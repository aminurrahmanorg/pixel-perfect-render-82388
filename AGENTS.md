<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Data rows are scoped by public.current_store_owner() (owner or store_members link), so team members share the owner's store; never filter by auth.uid() directly.
- Sale `paid_amount` NULL means fully paid (legacy rows); account balances use received amount + customer repayments. Why: dues live on the sale, not a separate ledger.
- Customer due/points math lives in src/lib/customers.ts with tests in src/test/customers.test.ts. Why: one source of truth for POS, Customers page and reports.
- AI assistant: server fn in src/lib/ai.functions.ts builds a store data summary via the user's RLS client and sends it to the AI Gateway. Why: answers stay scoped to the caller's store.
- Returns rewrite the original sale (total/tax/cost_total/paid_amount via applyReturn in src/lib/pos.ts) and log rows in sale_returns. Why: every report and balance stays correct without extra refund math.
- Store roles come from public.current_store_role() (owner/manager/cashier); restrictive RLS blocks cashier deletes and settings edits, UI hides pages via CASHIER_PAGES. Why: one role source for DB and UI.
- Stock qty changes only through stock_moves (triggers on stock_moves, sale_items, sale_returns). Why: the ledger always explains the number.
