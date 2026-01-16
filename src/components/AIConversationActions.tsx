import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MoreVertical, 
  Star, 
  StarOff, 
  Share2, 
  Download, 
  Copy, 
  Check,
  Tag
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConversationActionsProps {
  conversationId: string | null;
  messages: Message[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoggedIn: boolean;
}

const AIConversationActions: React.FC<AIConversationActionsProps> = ({
  conversationId,
  messages,
  isFavorite,
  onToggleFavorite,
  isLoggedIn,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExportMarkdown = () => {
    const markdown = messages
      .map((m) => `**${m.role === 'user' ? 'You' : 'EHDS Assistant'}:**\n\n${m.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ehds-conversation-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Conversation exported as Markdown',
    });
  };

  const handleShare = async () => {
    if (!conversationId || !isLoggedIn) {
      toast({
        title: 'Login required',
        description: 'Please log in to share conversations',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Generate a share ID if not exists
      const shareId = crypto.randomUUID().slice(0, 8);
      
      const { error } = await supabase
        .from('ai_assistant_conversations')
        .update({ share_id: shareId })
        .eq('id', conversationId);

      if (error) throw error;

      const url = `${window.location.origin}/shared/conversation/${shareId}`;
      setShareUrl(url);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Error sharing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShareUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard',
    });
  };

  if (messages.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isLoggedIn && conversationId && (
            <>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share conversation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleExportMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Export as Markdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share conversation</DialogTitle>
            <DialogDescription>
              Anyone with this link can view this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="share-link" className="sr-only">
                Link
              </Label>
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="text-xs"
              />
            </div>
            <Button size="sm" onClick={handleCopyShareUrl}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIConversationActions;
