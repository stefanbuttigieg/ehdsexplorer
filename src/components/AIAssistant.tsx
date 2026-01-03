import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, Loader2, Bot, User, AlertCircle, ThumbsUp, ThumbsDown, History, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEHDSAssistant } from '@/hooks/useEHDSAssistant';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AIAssistantProps {
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'positive' | 'negative'>>({});
  const { 
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
  } = useEHDSAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current && !showHistory) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory]);

  // Reset feedback when messages change
  useEffect(() => {
    if (messages.length === 0) {
      setFeedbackGiven({});
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'positive' | 'negative') => {
    const assistantMessage = messages[messageIndex];
    if (assistantMessage.role !== 'assistant') return;

    let userQuery = '';
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userQuery = messages[i].content;
        break;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to provide feedback",
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('ai_assistant_feedback')
        .insert({
          user_id: user.id,
          message_content: assistantMessage.content,
          user_query: userQuery,
          feedback_type: feedbackType,
        });

      if (insertError) throw insertError;

      setFeedbackGiven(prev => ({ ...prev, [messageIndex]: feedbackType }));
      
      toast({
        title: feedbackType === 'positive' ? "Thanks for the feedback!" : "Feedback recorded",
        description: feedbackType === 'positive' 
          ? "Glad this was helpful!" 
          : "We'll work on improving responses like this.",
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
    setShowHistory(false);
    setFeedbackGiven({});
  };

  const handleNewConversation = () => {
    startNewConversation();
    setShowHistory(false);
    setFeedbackGiven({});
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await deleteConversation(conversationId);
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              {showHistory ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowHistory(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
              <div>
                <h3 className="font-semibold text-sm">
                  {showHistory ? 'Chat History' : 'EHDS Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {showHistory ? 'Select a conversation' : 'Ask about the regulation'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowHistory(true)}
                    title="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNewConversation}
                    title="New conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* History View */}
          {showHistory ? (
            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors group",
                          currentConversationId === conv.id && "bg-muted"
                        )}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Start chatting to create one</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium mb-2">Welcome to EHDS Assistant</p>
                    <p className="text-xs max-w-[280px]">
                      Ask me anything about the European Health Data Space Regulation. I can help you find articles, explain concepts, and navigate the regulation.
                    </p>
                    <div className="mt-4 space-y-2 text-xs text-left w-full">
                      <p className="font-medium text-foreground">Try asking:</p>
                      <button 
                        className="block w-full text-left p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                        onClick={() => sendMessage("What is the EHDS regulation about?")}
                      >
                        "What is the EHDS regulation about?"
                      </button>
                      <button 
                        className="block w-full text-left p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                        onClick={() => sendMessage("What are the key definitions in Article 2?")}
                      >
                        "What are the key definitions in Article 2?"
                      </button>
                      <button 
                        className="block w-full text-left p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                        onClick={() => sendMessage("Which articles cover secondary use of health data?")}
                      >
                        "Which articles cover secondary use?"
                      </button>
                    </div>
                    {/* Disclaimer */}
                    <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-medium mb-1">⚠️ Please note:</p>
                      <p>Responses are AI-generated and may contain errors. Always verify with official sources. Daily usage limits apply.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 max-w-[85%]">
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm",
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            {message.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                                <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                          {/* Feedback buttons for assistant messages */}
                          {message.role === 'assistant' && message.content && !isLoading && (
                            <div className="flex items-center gap-1 pl-1">
                              {feedbackGiven[index] ? (
                                <span className="text-xs text-muted-foreground">
                                  {feedbackGiven[index] === 'positive' ? '👍 Thanks!' : '👎 Noted'}
                                </span>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-green-600"
                                    onClick={() => handleFeedback(index, 'positive')}
                                    title="Helpful"
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                    onClick={() => handleFeedback(index, 'negative')}
                                    title="Not helpful"
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Error */}
              {error && (
                <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t bg-background">
                <div className="flex gap-2 p-4 pb-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about EHDS..."
                    className="min-h-[44px] max-h-[120px] resize-none text-sm"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-[44px] w-[44px] flex-shrink-0"
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-2 px-4">
                  <span>AI-generated • may be inaccurate</span>
                  {usageInfo && (
                    <span className={cn(
                      "font-medium",
                      usageInfo.remaining <= 5 && "text-amber-600 dark:text-amber-400",
                      usageInfo.remaining <= 0 && "text-destructive"
                    )}>
                      {usageInfo.remaining}/{usageInfo.limit} uses left today
                    </span>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105",
          isOpen && "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};

export default AIAssistant;
