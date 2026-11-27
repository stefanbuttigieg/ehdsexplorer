CREATE OR REPLACE FUNCTION public.preserve_ia_column_values()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NEW.column_key IS NOT DISTINCT FROM OLD.column_key THEN
    RETURN NEW;
  END IF;
  IF NEW.table_id IS DISTINCT FROM OLD.table_id THEN
    RAISE EXCEPTION 'Cannot move a column while changing its key';
  END IF;
  IF btrim(NEW.column_key) = '' THEN
    RAISE EXCEPTION 'Column key cannot be empty';
  END IF;
  -- Serialize schema/data writes so a conflicting key cannot appear mid-save.
  LOCK TABLE public.implementing_act_data_columns, public.implementing_act_data_rows IN SHARE ROW EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM public.implementing_act_data_columns WHERE table_id = OLD.table_id AND id <> OLD.id AND column_key = NEW.column_key) THEN
    RAISE EXCEPTION 'This column key is already used in this table';
  END IF;
  IF EXISTS (SELECT 1 FROM public.implementing_act_data_rows WHERE table_id = OLD.table_id AND "values" ? NEW.column_key) THEN
    RAISE EXCEPTION 'This key already contains row data; choose a different key';
  END IF;
  UPDATE public.implementing_act_data_rows
  SET "values" = ("values" - OLD.column_key) || jsonb_build_object(NEW.column_key, "values" -> OLD.column_key)
  WHERE table_id = OLD.table_id AND "values" ? OLD.column_key;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preserve_ia_column_values() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preserve_ia_column_values() TO authenticated, service_role;
CREATE TRIGGER preserve_ia_column_values BEFORE UPDATE OF column_key ON public.implementing_act_data_columns FOR EACH ROW EXECUTE FUNCTION public.preserve_ia_column_values();