import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Loader2, Bot, User, AlertCircle, ThumbsUp, ThumbsDown, History, Plus, ChevronLeft, Mic, MicOff, Volume2, Square, Settings2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEHDSAssistant } from '@/hooks/useEHDSAssistant';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import AIRoleSelector from './AIRoleSelector';
import AIContextSuggestions from './AIContextSuggestions';
import AIConversationActions from './AIConversationActions';

interface AIAssistantProps {
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'positive' | 'negative'>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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
    isFavorite,
    toggleFavorite,
  } = useEHDSAssistant();

  const {
    role,
    explainLevel,
    simplifyMode,
    isLoggedIn,
    setRole,
    setExplainLevel,
    setSimplifyMode,
  } = useAIPreferences();

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
    if (isOpen && inputRef.current && !showHistory && !showSettings) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory, showSettings]);

  // Reset feedback when messages change
  useEffect(() => {
    if (messages.length === 0) {
      setFeedbackGiven({});
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), { 
      role, 
      explainLevel: simplifyMode ? explainLevel : 'professional' 
    });
    setInput('');
  };

  const handleQuickSend = (message: string) => {
    sendMessage(message, { 
      role, 
      explainLevel: simplifyMode ? explainLevel : 'professional' 
    });
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

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        setInput(prev => prev ? `${prev} ${data.text}` : data.text);
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      toast({
        title: "Transcription failed",
        description: "Could not convert speech to text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const speakText = async (text: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }

    setIsSpeaking(true);
    try {
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\n+/g, ' ');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
      toast({
        title: "Speech failed",
        description: "Could not convert text to speech. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  };

  // Separate favorite and regular conversations
  const favoriteConversations = conversations?.filter(c => c.is_favorite) || [];
  const regularConversations = conversations?.filter(c => !c.is_favorite) || [];

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              {(showHistory || showSettings) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { setShowHistory(false); setShowSettings(false); }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
              <div>
                <h3 className="font-semibold text-sm">
                  {showHistory ? 'Chat History' : showSettings ? 'Settings' : 'EHDS Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {showHistory ? 'Select a conversation' : showSettings ? 'Customize responses' : 'Ask about the regulation'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && !showSettings && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
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
                  <AIConversationActions
                    conversationId={currentConversationId}
                    messages={messages}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    isLoggedIn={isLoggedIn}
                  />
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

          {/* Settings View */}
          {showSettings ? (
            <div className="flex-1 p-4 overflow-auto">
              <AIRoleSelector
                selectedRole={role}
                onRoleChange={setRole}
                selectedLevel={explainLevel}
                onLevelChange={setExplainLevel}
                simplifyMode={simplifyMode}
                onSimplifyModeChange={setSimplifyMode}
              />
              <p className="mt-4 text-xs text-muted-foreground">
                These settings customize how the AI responds to your questions. 
                {isLoggedIn 
                  ? ' Your preferences are saved to your account.' 
                  : ' Log in to save your preferences.'}
              </p>
            </div>
          ) : showHistory ? (
            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-1">
                    {/* Favorites Section */}
                    {favoriteConversations.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground font-medium">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          Favorites
                        </div>
                        {favoriteConversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors group",
                              currentConversationId === conv.id && "bg-muted"
                            )}
                            onClick={() => handleSelectConversation(conv.id)}
                          >
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400 flex-shrink-0" />
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
                        {regularConversations.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground font-medium mt-2">
                            <MessageCircle className="h-3 w-3" />
                            Recent
                          </div>
                        )}
                      </>
                    )}
                    {/* Regular conversations */}
                    {regularConversations.map((conv) => (
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
                        onClick={() => handleQuickSend("What is the EHDS regulation about?")}
                      >
                        "What is the EHDS regulation about?"
                      </button>
                      <button 
                        className="block w-full text-left p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                        onClick={() => handleQuickSend("What are the key definitions in Article 2?")}
                      >
                        "What are the key definitions in Article 2?"
                      </button>
                      <button 
                        className="block w-full text-left p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                        onClick={() => handleQuickSend("Which articles cover secondary use of health data?")}
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
                              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&_a]:text-primary [&_a]:underline">
                                <ReactMarkdown
                                  components={{
                                    a: ({ href, children }) => {
                                      if (href?.startsWith('/')) {
                                        return (
                                          <Link to={href} className="text-primary underline hover:text-primary/80">
                                            {children}
                                          </Link>
                                        );
                                      }
                                      return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                                          {children}
                                        </a>
                                      );
                                    }
                                  }}
                                >
                                  {message.content || '...'}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                          {/* Action buttons for assistant messages */}
                          {message.role === 'assistant' && message.content && !isLoading && (
                            <div className="flex items-center gap-1 pl-1">
                              {/* Speak button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                                title={isSpeaking ? "Stop speaking" : "Listen to response"}
                              >
                                {isSpeaking ? (
                                  <Square className="h-3.5 w-3.5" />
                                ) : (
                                  <Volume2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              
                              {/* Feedback buttons */}
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

              {/* Context Suggestions */}
              {messages.length === 0 && (
                <AIContextSuggestions 
                  onSendMessage={handleQuickSend} 
                  isLoading={isLoading} 
                />
              )}

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
                  {/* Mic button */}
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className="h-[44px] w-[44px] flex-shrink-0"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isTranscribing}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? "Recording..." : "Ask about EHDS..."}
                    className="min-h-[44px] max-h-[120px] resize-none text-sm"
                    rows={1}
                    disabled={isLoading || isRecording}
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
