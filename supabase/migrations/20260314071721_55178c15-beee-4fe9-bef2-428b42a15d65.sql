
CREATE TABLE public.comic_panel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id text NOT NULL,
  panel_index integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, panel_index)
);

ALTER TABLE public.comic_panel_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read comic panel images"
  ON public.comic_panel_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin write access
CREATE POLICY "Admins can insert comic panel images"
  ON public.comic_panel_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update comic panel images"
  ON public.comic_panel_images FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete comic panel images"
  ON public.comic_panel_images FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_comic_panel_images_updated_at
  BEFORE UPDATE ON public.comic_panel_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
