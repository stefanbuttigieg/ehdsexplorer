-- Create annotations table for storing user annotations
CREATE TABLE public.annotations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'recital', 'implementing_act')),
    content_id TEXT NOT NULL,
    selected_text TEXT NOT NULL,
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    highlight_color TEXT DEFAULT 'yellow',
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notes table for standalone notes
CREATE TABLE public.user_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    related_content JSONB DEFAULT '[]',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create annotation_tags table for organizing annotations
CREATE TABLE public.annotation_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Junction table for annotation-tag relationships
CREATE TABLE public.annotation_tag_links (
    annotation_id UUID NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.annotation_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (annotation_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_tag_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for annotations
CREATE POLICY "Users can view their own annotations"
ON public.annotations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annotations"
ON public.annotations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
ON public.annotations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
ON public.annotations FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_notes
CREATE POLICY "Users can view their own notes"
ON public.user_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.user_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.user_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.user_notes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for annotation_tags
CREATE POLICY "Users can view their own tags"
ON public.annotation_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.annotation_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.annotation_tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.annotation_tags FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for annotation_tag_links (based on annotation ownership)
CREATE POLICY "Users can view their own annotation tag links"
ON public.annotation_tag_links FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.annotations 
    WHERE annotations.id = annotation_id AND annotations.user_id = auth.uid()
));

CREATE POLICY "Users can create their own annotation tag links"
ON public.annotation_tag_links FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.annotations 
    WHERE annotations.id = annotation_id AND annotations.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own annotation tag links"
ON public.annotation_tag_links FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.annotations 
    WHERE annotations.id = annotation_id AND annotations.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_annotations_updated_at
BEFORE UPDATE ON public.annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON public.user_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();