ALTER TABLE public.implementing_acts DROP CONSTRAINT IF EXISTS implementing_acts_status_check;

ALTER TABLE public.implementing_acts
ADD CONSTRAINT implementing_acts_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pending'::text,
      'preparation'::text,
      'feedback'::text,
      'feedback-closed'::text,
      'progress'::text,
      'adopted'::text
    ]
  )
);