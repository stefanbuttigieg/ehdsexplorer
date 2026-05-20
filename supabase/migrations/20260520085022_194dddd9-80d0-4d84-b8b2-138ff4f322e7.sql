
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.close_expired_feedback_periods()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  rec record;
  end_part text;
  end_date date;
BEGIN
  FOR rec IN
    SELECT id, feedback_deadline
    FROM public.implementing_acts
    WHERE status = 'feedback'
      AND feedback_deadline IS NOT NULL
      AND feedback_deadline <> ''
  LOOP
    BEGIN
      -- feedback_deadline format: "dd Month yyyy - dd Month yyyy"
      IF position(' - ' in rec.feedback_deadline) > 0 THEN
        end_part := trim(split_part(rec.feedback_deadline, ' - ', 2));
      ELSE
        end_part := trim(rec.feedback_deadline);
      END IF;

      end_date := to_date(end_part, 'DD FMMonth YYYY');

      IF end_date < CURRENT_DATE THEN
        UPDATE public.implementing_acts
        SET status = 'feedback-closed',
            previous_status = 'feedback',
            updated_at = now()
        WHERE id = rec.id;
        updated_count := updated_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Skip unparseable deadlines
      CONTINUE;
    END;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- Run once now to backfill
SELECT public.close_expired_feedback_periods();

-- Unschedule previous version if it exists, then schedule daily at 02:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('close-expired-feedback-periods');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'close-expired-feedback-periods',
  '0 2 * * *',
  $$SELECT public.close_expired_feedback_periods();$$
);
