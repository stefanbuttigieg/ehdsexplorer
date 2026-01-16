import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AIRole, ExplainLevel } from '@/data/aiRolePrompts';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  share_id?: string | null;
  tags?: string[];
  role_used?: string;
  explain_level_used?: string;
};

type UsageInfo = {
  remaining: number;
  limit: number;
};

interface SendMessageOptions {
  role?: AIRole;
  explainLevel?: ExplainLevel;
}

export const useEHDSAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [currentConversationFavorite, setCurrentConversationFavorite] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ai_daily_usage')
        .select('request_count, daily_limit')
        .eq('usage_date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
        return;
      }
      
      if (data) {
        setUsageInfo({
          remaining: data.daily_limit - data.request_count,
          limit: data.daily_limit
        });
      } else {
        setUsageInfo({ remaining: 30, limit: 30 });
      }
    } catch (e) {
      console.error('Error fetching usage:', e);
    }
  };

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ai_assistant_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Conversation[];
    },
  });

  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
      // Load favorite status
      const conv = conversations?.find(c => c.id === currentConversationId);
      setCurrentConversationFavorite(conv?.is_favorite || false);
    }
  }, [currentConversationId, conversations]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_assistant_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })));
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const createConversation = async (
    firstMessage: string, 
    role: AIRole = 'general', 
    explainLevel: ExplainLevel = 'professional'
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 50) + '...' 
        : firstMessage;

      const { data, error } = await supabase
        .from('ai_assistant_conversations')
        .insert({ 
          user_id: user.id, 
          title,
          role_used: role,
          explain_level_used: explainLevel
        })
        .select()
        .single();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      return data.id;
    } catch (e) {
      console.error('Error creating conversation:', e);
      return null;
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const { error } = await supabase
        .from('ai_assistant_messages')
        .insert({ conversation_id: conversationId, role, content });
      
      if (error) throw error;

      await supabase
        .from('ai_assistant_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch (e) {
      console.error('Error saving message:', e);
    }
  };

  const toggleFavorite = useCallback(async () => {
    if (!currentConversationId) return;
    
    const newFavoriteStatus = !currentConversationFavorite;
    setCurrentConversationFavorite(newFavoriteStatus);
    
    try {
      const { error } = await supabase
        .from('ai_assistant_conversations')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', currentConversationId);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch (e) {
      console.error('Error toggling favorite:', e);
      setCurrentConversationFavorite(!newFavoriteStatus); // Revert on error
    }
  }, [currentConversationId, currentConversationFavorite, queryClient]);

  const sendMessage = useCallback(async (input: string, options?: SendMessageOptions) => {
    const role = options?.role || 'general';
    const explainLevel = options?.explainLevel || 'professional';

    if (usageInfo && usageInfo.remaining <= 0) {
      setError("Daily limit reached. The AI assistant will be available again tomorrow.");
      return;
    }

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';
    let convId = currentConversationId;

    const { data: { user } } = await supabase.auth.getUser();

    if (user && !convId) {
      convId = await createConversation(input, role, explainLevel);
      if (convId) {
        setCurrentConversationId(convId);
      }
    }

    if (user && convId) {
      await saveMessage(convId, 'user', input);
    }

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ehds-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [...messages, userMsg].map(m => ({
              role: m.role,
              content: m.content
            })),
            role,
            explainLevel
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.remaining !== undefined) {
          setUsageInfo({
            remaining: errorData.remaining,
            limit: errorData.limit || 30
          });
        }
        
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const remainingHeader = response.headers.get('X-Remaining-Uses');
      const limitHeader = response.headers.get('X-Daily-Limit');
      if (remainingHeader !== null) {
        setUsageInfo({
          remaining: parseInt(remainingHeader, 10),
          limit: limitHeader ? parseInt(limitHeader, 10) : 30
        });
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (user && convId && assistantContent) {
        await saveMessage(convId, 'assistant', assistantContent);
      }
    } catch (e) {
      console.error('EHDS Assistant error:', e);
      setError(e instanceof Error ? e.message : 'An error occurred');
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentConversationId, usageInfo]);

  const loadConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setError(null);
  }, []);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    setCurrentConversationFavorite(false);
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_assistant_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
      
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch (e) {
      console.error('Error deleting conversation:', e);
    }
  }, [currentConversationId, startNewConversation, queryClient]);

  const clearMessages = useCallback(() => {
    startNewConversation();
  }, [startNewConversation]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    conversations,
    conversationsLoading,
    currentConversationId,
    loadConversation,
    startNewConversation,
    deleteConversation,
    usageInfo,
    isFavorite: currentConversationFavorite,
    toggleFavorite,
  };
};
