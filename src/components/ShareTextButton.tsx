import { useState, useEffect, useCallback } from "react";
import { Share2, Link, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import { useToast } from "@/hooks/use-toast";

interface Position {
  x: number;
  y: number;
}

export const ShareTextButton = () => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [position, setPosition] = useState<Position | null>(null);
  const [copied, setCopied] = useState(false);
  const { copyShareLink, createShareLink } = useTextHighlight();
  const { toast } = useToast();

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 3 && text.length < 200) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setSelectedText(text);
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setCopied(false);
      }
    } else {
      setPosition(null);
      setSelectedText("");
    }
  }, []);

  const handleCopyLink = async () => {
    const success = await copyShareLink(selectedText);
    if (success) {
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link to highlight the selected text.",
      });
      setTimeout(() => {
        setPosition(null);
        setSelectedText("");
        setCopied(false);
      }, 1500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EHDS Explorer - Highlighted Text",
          text: selectedText,
          url: createShareLink(selectedText),
        });
        setPosition(null);
        setSelectedText("");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDismiss = () => {
    setPosition(null);
    setSelectedText("");
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [handleSelection]);

  // Hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (position) {
        setPosition(null);
        setSelectedText("");
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [position]);

  if (!position || !selectedText) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-popover border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 gap-1.5 text-xs"
        onClick={handleNativeShare}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
        Share
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 gap-1.5 text-xs"
        onClick={handleCopyLink}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Link className="h-3.5 w-3.5" />
        )}
        Copy link
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
