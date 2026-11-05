CREATE OR REPLACE FUNCTION public.rename_product_category(p_id uuid, p_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old_name text;
  v_new_name text := trim(p_name);
  v_owner_id uuid := public.current_store_owner();
BEGIN
  IF v_new_name = '' THEN
    RAISE EXCEPTION 'Category name is required';
  END IF;

  SELECT name INTO v_old_name
  FROM public.product_categories
  WHERE id = p_id AND owner_id = v_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or not allowed';
  END IF;

  UPDATE public.menu_items
  SET category = v_new_name
  WHERE owner_id = v_owner_id
    AND lower(trim(category)) = lower(trim(v_old_name));

  UPDATE public.product_categories
  SET name = v_new_name
  WHERE id = p_id AND owner_id = v_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_product_category(p_id uuid, p_replacement_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old_name text;
  v_replacement_name text;
  v_owner_id uuid := public.current_store_owner();
BEGIN
  SELECT name INTO v_old_name
  FROM public.product_categories
  WHERE id = p_id AND owner_id = v_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or not allowed';
  END IF;

  IF p_replacement_id IS NOT NULL THEN
    SELECT name INTO v_replacement_name
    FROM public.product_categories
    WHERE id = p_replacement_id AND owner_id = v_owner_id;

    IF NOT FOUND OR p_replacement_id = p_id THEN
      RAISE EXCEPTION 'Choose a different category from this store';
    END IF;

    UPDATE public.menu_items
    SET category = v_replacement_name
    WHERE owner_id = v_owner_id
      AND lower(trim(category)) = lower(trim(v_old_name));
  ELSIF EXISTS (
    SELECT 1
    FROM public.menu_items
    WHERE owner_id = v_owner_id
      AND lower(trim(category)) = lower(trim(v_old_name))
  ) THEN
    RAISE EXCEPTION 'Move this category''s products to another category before deleting it';
  END IF;

  DELETE FROM public.product_categories
  WHERE id = p_id AND owner_id = v_owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rename_product_category(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_product_category(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_product_category(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_category(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
