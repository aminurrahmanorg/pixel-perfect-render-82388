CREATE OR REPLACE FUNCTION public.dashboard_summary(p_from date, p_to date, p_today date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_days integer;
  v_prev_from date;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_today IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'invalid dashboard date range';
  END IF;

  v_days := p_to - p_from + 1;
  IF v_days > 366 THEN
    RAISE EXCEPTION 'dashboard date range cannot exceed 366 days';
  END IF;
  v_prev_from := p_from - v_days;

  WITH
  sales_totals AS (
    SELECT
      COALESCE(sum(total - tax) FILTER (WHERE sale_date BETWEEN p_from AND p_to), 0) AS cur_sales,
      COALESCE(sum(cost_total) FILTER (WHERE sale_date BETWEEN p_from AND p_to), 0) AS cur_cost,
      count(*) FILTER (WHERE sale_date BETWEEN p_from AND p_to) AS cur_orders,
      COALESCE(sum(total - tax) FILTER (WHERE sale_date BETWEEN v_prev_from AND p_from - 1), 0) AS prev_sales,
      COALESCE(sum(cost_total) FILTER (WHERE sale_date BETWEEN v_prev_from AND p_from - 1), 0) AS prev_cost,
      COALESCE(sum(total - tax) FILTER (WHERE sale_date = p_today), 0) AS today_sales,
      COALESCE(sum(cost_total) FILTER (WHERE sale_date = p_today), 0) AS today_cost,
      sum(1) FILTER (WHERE sale_date = p_today) AS today_orders
    FROM public.sales
    WHERE sale_date BETWEEN least(v_prev_from, p_today) AND greatest(p_to, p_today)
  ),
  expense_totals AS (
    SELECT
      COALESCE(sum(amount) FILTER (WHERE expense_date BETWEEN p_from AND p_to), 0) AS cur_exp,
      COALESCE(sum(amount) FILTER (WHERE expense_date BETWEEN v_prev_from AND p_from - 1), 0) AS prev_exp,
      COALESCE(sum(amount) FILTER (WHERE expense_date = p_today), 0) AS today_exp
    FROM public.expenses
    WHERE expense_date BETWEEN least(v_prev_from, p_today) AND greatest(p_to, p_today)
  ),
  income_totals AS (
    SELECT
      COALESCE(sum(amount) FILTER (WHERE income_date BETWEEN p_from AND p_to), 0) AS cur_inc,
      COALESCE(sum(amount) FILTER (WHERE income_date BETWEEN v_prev_from AND p_from - 1), 0) AS prev_inc,
      COALESCE(sum(amount) FILTER (WHERE income_date = p_today), 0) AS today_inc
    FROM public.income
    WHERE income_date BETWEEN least(v_prev_from, p_today) AND greatest(p_to, p_today)
  ),
  sales_by_day AS (
    SELECT sale_date AS day, sum(total - tax) AS sales, sum(cost_total) AS cost
    FROM public.sales
    WHERE sale_date BETWEEN p_from AND p_to
    GROUP BY sale_date
  ),
  expenses_by_day AS (
    SELECT expense_date AS day, sum(amount) AS expenses
    FROM public.expenses
    WHERE expense_date BETWEEN p_from AND p_to
    GROUP BY expense_date
  ),
  income_by_day AS (
    SELECT income_date AS day, sum(amount) AS income
    FROM public.income
    WHERE income_date BETWEEN p_from AND p_to
    GROUP BY income_date
  ),
  chart_rows AS (
    SELECT
      dates.day::date AS day,
      COALESCE(s.sales, 0) AS sales,
      COALESCE(s.cost, 0) + COALESCE(e.expenses, 0) AS costs,
      COALESCE(s.sales, 0) - COALESCE(s.cost, 0)
        - COALESCE(e.expenses, 0) + COALESCE(i.income, 0) AS profit
    FROM generate_series(p_from, p_to, interval '1 day') AS dates(day)
    LEFT JOIN sales_by_day s ON s.day = dates.day::date
    LEFT JOIN expenses_by_day e ON e.day = dates.day::date
    LEFT JOIN income_by_day i ON i.day = dates.day::date
  ),
  account_movements AS (
    SELECT account_id, COALESCE(paid_amount, total) AS amount
    FROM public.sales
    WHERE account_id IS NOT NULL
    UNION ALL
    SELECT account_id, amount FROM public.customer_payments WHERE account_id IS NOT NULL
    UNION ALL
    SELECT account_id, amount FROM public.income WHERE account_id IS NOT NULL
    UNION ALL
    SELECT account_id, -amount FROM public.expenses WHERE account_id IS NOT NULL
    UNION ALL
    SELECT from_account_id, -amount FROM public.transfers
    UNION ALL
    SELECT to_account_id, amount FROM public.transfers
  ),
  balances_by_type AS (
    SELECT a.type, sum(a.opening_balance + COALESCE(m.amount, 0)) AS balance
    FROM public.accounts a
    LEFT JOIN (
      SELECT account_id, sum(amount) AS amount
      FROM account_movements
      GROUP BY account_id
    ) m ON m.account_id = a.id
    GROUP BY a.type
  ),
  due_totals AS (
    SELECT
      COALESCE((SELECT sum(greatest(total - COALESCE(paid_amount, total), 0)) FROM public.sales), 0)
      - COALESCE((SELECT sum(amount) FROM public.customer_payments), 0) AS amount
  ),
  categories AS (
    SELECT category AS name, round(sum(amount), 2) AS value
    FROM public.expenses
    WHERE expense_date BETWEEN p_from AND p_to
    GROUP BY category
    ORDER BY value DESC, name
  ),
  top_items AS (
    SELECT
      i.name,
      sum(i.qty) AS qty,
      sum(i.qty * i.price) AS rev,
      sum(i.qty * (i.price - i.cost)) AS profit
    FROM public.sale_items i
    JOIN public.sales s ON s.id = i.sale_id
    WHERE s.sale_date BETWEEN p_from AND p_to
    GROUP BY i.name
    ORDER BY qty DESC, i.name
    LIMIT 8
  )
  SELECT jsonb_build_object(
    'todaySales', round(st.today_sales, 2),
    'todayExp', round(et.today_exp, 2),
    'todayProfit', round(st.today_sales - st.today_cost - et.today_exp + it.today_inc, 2),
    'todayOrders', COALESCE(st.today_orders, 0),
    'cash', round(COALESCE((SELECT balance FROM balances_by_type WHERE type = 'cash'), 0), 2),
    'bank', round(COALESCE((SELECT balance FROM balances_by_type WHERE type = 'bank'), 0), 2),
    'wallet', round(COALESCE((SELECT balance FROM balances_by_type WHERE type = 'wallet'), 0), 2),
    'total', round(COALESCE((SELECT sum(balance) FROM balances_by_type), 0), 2),
    'dues', round(greatest(dt.amount, 0), 2),
    'lowStock', (SELECT count(*) FROM public.menu_items WHERE track_stock AND stock_qty <= low_stock_at),
    'todayReturns', round(COALESCE((SELECT sum(refund) FROM public.sale_returns WHERE return_date = p_today), 0), 2),
    'cur', jsonb_build_object(
      'sales', round(st.cur_sales, 2),
      'cost', round(st.cur_cost, 2),
      'exp', round(et.cur_exp, 2),
      'inc', round(it.cur_inc, 2),
      'orders', COALESCE(st.cur_orders, 0)
    ),
    'prev', jsonb_build_object(
      'sales', round(st.prev_sales, 2),
      'cost', round(st.prev_cost, 2),
      'exp', round(et.prev_exp, 2),
      'inc', round(it.prev_inc, 2)
    ),
    'chart', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', to_char(day, 'Mon FMDD'),
        'Sales', round(sales, 2),
        'Costs', round(costs, 2),
        'Profit', round(profit, 2)
      ) ORDER BY day)
      FROM chart_rows
    ), '[]'::jsonb),
    'cats', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC, name)
      FROM categories
    ), '[]'::jsonb),
    'top', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', name, 'qty', qty, 'rev', round(rev, 2), 'profit', round(profit, 2)
      ) ORDER BY qty DESC, name)
      FROM top_items
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM sales_totals st
  CROSS JOIN expense_totals et
  CROSS JOIN income_totals it
  CROSS JOIN due_totals dt;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.dashboard_summary(date, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_summary(date, date, date) TO authenticated;

NOTIFY pgrst, 'reload schema';
