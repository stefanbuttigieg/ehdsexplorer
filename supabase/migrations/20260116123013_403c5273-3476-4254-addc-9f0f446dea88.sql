-- Add AI assistant preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_ai_role text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS preferred_explain_level text DEFAULT 'professional';

-- Add conversation features to ai_assistant_conversations
ALTER TABLE public.ai_assistant_conversations 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS share_id text UNIQUE,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role_used text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS explain_level_used text DEFAULT 'professional';

-- Create index for share_id lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_share_id ON public.ai_assistant_conversations(share_id) WHERE share_id IS NOT NULL;

-- Create index for favorites
CREATE INDEX IF NOT EXISTS idx_ai_conversations_favorites ON public.ai_assistant_conversations(user_id, is_favorite) WHERE is_favorite = true;