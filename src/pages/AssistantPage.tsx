import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Trash2, Loader2, Bot, User, AlertCircle, ThumbsUp, ThumbsDown, 
  Plus, Mic, MicOff, Volume2, Square, Star, MessageCircle, PanelLeftClose, 
  PanelLeft, Settings2, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { useEHDSAssistant } from '@/hooks/useEHDSAssistant';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { useStakeholderAIRole } from '@/contexts/StakeholderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import AIRoleSelector from '@/components/AIRoleSelector';
import AIContextSuggestions from '@/components/AIContextSuggestions';
import AIConversationActions from '@/components/AIConversationActions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import andreaAvatar from '@/assets/andrea-avatar.png';

const AssistantPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'positive' | 'negative'>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const {
    messages, isLoading, error, sendMessage,
    conversations, conversationsLoading, currentConversationId,
    loadConversation, startNewConversation, deleteConversation,
    usageInfo, isFavorite, toggleFavorite,
  } = useEHDSAssistant();

  const {
    role, explainLevel, simplifyMode, isLoggedIn,
    setRole, setExplainLevel, setSimplifyMode,
  } = useAIPreferences();

  const stakeholderAIRole = useStakeholderAIRole();
  const effectiveRole = stakeholderAIRole || role;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) setFeedbackGiven({});
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), {
      role: effectiveRole,
      explainLevel: simplifyMode ? explainLevel : 'professional',
    });
    setInput('');
  };

  const handleQuickSend = (message: string) => {
    sendMessage(message, {
      role: effectiveRole,
      explainLevel: simplifyMode ? explainLevel : 'professional',
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
      if (messages[i].role === 'user') { userQuery = messages[i].content; break; }
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from('ai_assistant_feedback')
        .insert({ user_id: user?.id || null, message_content: assistantMessage.content, user_query: userQuery, feedback_type: feedbackType });
      if (insertError) throw insertError;
      setFeedbackGiven(prev => ({ ...prev, [messageIndex]: feedbackType }));
      toast({ title: feedbackType === 'positive' ? "Thanks!" : "Feedback recorded" });
    } catch { toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" }); }
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
    setFeedbackGiven({});
    setMobileSheetOpen(false);
  };

  const handleNewConversation = () => {
    startNewConversation();
    setFeedbackGiven({});
    setMobileSheetOpen(false);
  };

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast({ title: "Microphone access denied", variant: "destructive" }); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: formData,
      });
      if (!response.ok) throw new Error('Transcription failed');
      const data = await response.json();
      if (data.text) { setInput(prev => prev ? `${prev} ${data.text}` : data.text); inputRef.current?.focus(); }
    } catch { toast({ title: "Transcription failed", variant: "destructive" }); }
    finally { setIsTranscribing(false); }
  };

  const speakText = async (text: string) => {
    if (currentAudio) { currentAudio.pause(); setCurrentAudio(null); }
    setIsSpeaking(true);
    try {
      const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/#{1,6}\s/g, '').replace(/`[^`]+`/g, '').replace(/\n+/g, ' ');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text: cleanText }),
      });
      if (!response.ok) throw new Error('TTS failed');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => { setIsSpeaking(false); setCurrentAudio(null); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setIsSpeaking(false); setCurrentAudio(null); };
      setCurrentAudio(audio);
      await audio.play();
    } catch { setIsSpeaking(false); toast({ title: "Speech failed", variant: "destructive" }); }
  };

  const stopSpeaking = () => {
    if (currentAudio) { currentAudio.pause(); setCurrentAudio(null); setIsSpeaking(false); }
  };

  const favoriteConversations = conversations?.filter(c => c.is_favorite) || [];
  const regularConversations = conversations?.filter(c => !c.is_favorite) || [];

  // Sidebar content (shared between desktop sidebar and mobile sheet)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b">
        <Button onClick={handleNewConversation} className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" /> New Chat
        </Button>
      </div>

      {/* Settings Toggle */}
      <div className="px-3 pt-3">
        <Button 
          variant={showSettings ? "secondary" : "ghost"} 
          size="sm" 
          className="w-full justify-start gap-2 text-xs"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Button>
      </div>

      {showSettings && (
        <div className="px-3 py-2 border-b">
          <AIRoleSelector
            selectedRole={role}
            onRoleChange={setRole}
            selectedLevel={explainLevel}
            onLevelChange={setExplainLevel}
            simplifyMode={simplifyMode}
            onSimplifyModeChange={setSimplifyMode}
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            {isLoggedIn ? 'Preferences saved to your account.' : 'Log in to save preferences.'}
          </p>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {favoriteConversations.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    Favorites
                  </div>
                  {favoriteConversations.map((conv) => (
                    <button
                      key={conv.id}
                      className={cn(
                        "flex items-center gap-2 w-full p-2 rounded-md text-left cursor-pointer hover:bg-muted transition-colors group text-sm",
                        currentConversationId === conv.id && "bg-muted"
                      )}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </button>
                  ))}
                </>
              )}

              {regularConversations.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-2">
                    <MessageCircle className="h-3 w-3" />
                    Recent
                  </div>
                  {regularConversations.map((conv) => (
                    <button
                      key={conv.id}
                      className={cn(
                        "flex items-center gap-2 w-full p-2 rounded-md text-left cursor-pointer hover:bg-muted transition-colors group text-sm",
                        currentConversationId === conv.id && "bg-muted"
                      )}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </button>
                  ))}
                </>
              )}

              {(!conversations || conversations.length === 0) && !conversationsLoading && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="mt-1">Start chatting to see your history here</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Usage Info */}
      {usageInfo && (
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          {usageInfo.remaining}/{usageInfo.limit} questions remaining today
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && sidebarOpen && (
        <div className="w-72 border-r flex flex-col bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between p-3 border-b">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 border-b bg-background flex-shrink-0">
          <div className="flex items-center gap-2">
            {!isMobile && !sidebarOpen && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            {isMobile && (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex items-center p-3 border-b">
                    <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Link>
                  </div>
                  <div className="h-[calc(100vh-49px)]">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={andreaAvatar} alt="Andrea, your EHDS assistant" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-semibold">Andrea</h1>
              <p className="text-[10px] text-muted-foreground">Your EHDS regulation guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AIConversationActions
              conversationId={currentConversationId}
              messages={messages}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center max-w-lg mx-auto">
              <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20 shadow-md">
                <AvatarImage src={andreaAvatar} alt="Andrea, your EHDS assistant" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mb-1">Hi, I'm Andrea 👋</h2>
              <p className="text-xs text-muted-foreground mb-3">Your EHDS regulation guide</p>
              <p className="text-sm text-muted-foreground mb-6">
                Ask me anything about the European Health Data Space regulation. I can explain articles, 
                compare provisions, clarify obligations, and help you navigate the legislation.
              </p>
              <AIContextSuggestions onSendMessage={handleQuickSend} isLoading={isLoading} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1 border border-border">
                      <AvatarImage src={andreaAvatar} alt="Andrea" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <Link to={href || '#'} className="text-primary underline hover:no-underline">
                                {children}
                              </Link>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Feedback row for last assistant message */}
              {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isLoading && (
                <div className="flex items-center gap-1 pl-11">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", feedbackGiven[messages.length - 1] === 'positive' && "text-green-500")}
                    onClick={() => handleFeedback(messages.length - 1, 'positive')}
                    disabled={!!feedbackGiven[messages.length - 1]}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", feedbackGiven[messages.length - 1] === 'negative' && "text-red-500")}
                    onClick={() => handleFeedback(messages.length - 1, 'negative')}
                    disabled={!!feedbackGiven[messages.length - 1]}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(messages[messages.length - 1].content)}
                  >
                    {isSpeaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0 border border-border">
                    <AvatarImage src={andreaAvatar} alt="Andrea" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Andrea is thinking</span>
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm mx-auto max-w-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-3 flex-shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Andrea about the EHDS regulation..."
                  className="min-h-[44px] max-h-[200px] resize-none pr-12 rounded-xl"
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isRecording && "text-destructive animate-pulse")}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing || isLoading}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isTranscribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" size="icon" className="h-[44px] w-[44px] rounded-xl flex-shrink-0" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {usageInfo && isMobile && (
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                {usageInfo.remaining}/{usageInfo.limit} remaining today
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
