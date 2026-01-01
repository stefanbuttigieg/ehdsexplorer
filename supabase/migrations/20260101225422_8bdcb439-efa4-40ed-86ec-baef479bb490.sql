-- Create table for AI assistant conversations
CREATE TABLE public.ai_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for conversation messages
CREATE TABLE public.ai_assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_assistant_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.ai_assistant_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.ai_assistant_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.ai_assistant_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.ai_assistant_conversations FOR DELETE
USING (auth.uid() = user_id);

-- Messages policies (through conversation ownership)
CREATE POLICY "Users can view messages of their conversations"
ON public.ai_assistant_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ai_assistant_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert messages to their conversations"
ON public.ai_assistant_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ai_assistant_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete messages from their conversations"
ON public.ai_assistant_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.ai_assistant_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_conversations_user ON public.ai_assistant_conversations(user_id);
CREATE INDEX idx_conversations_updated ON public.ai_assistant_conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation ON public.ai_assistant_messages(conversation_id);
CREATE INDEX idx_messages_created ON public.ai_assistant_messages(created_at);

-- Trigger to update conversation updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.ai_assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();