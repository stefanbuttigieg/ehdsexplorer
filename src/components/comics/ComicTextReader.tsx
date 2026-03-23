import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ComicPanel } from "@/data/comicStories";

interface ComicTextReaderProps {
  panel: ComicPanel;
}

function buildPanelScript(panel: ComicPanel): string {
  const parts: string[] = [];

  if (panel.narration) {
    parts.push(panel.narration);
  }

  if (panel.dialogue?.length) {
    for (const d of panel.dialogue) {
      parts.push(`${d.character} says: ${d.text}`);
    }
  }

  return parts.join(". ") || "";
}

export const ComicTextReader = ({ panel }: ComicTextReaderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(async () => {
    const script = buildPanelScript(panel);
    if (!script) {
      toast.info("No text to read on this panel.");
      return;
    }

    stop();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: script,
            voiceId: "JBFqnCBsd6RMkjVDRZzb", // George — warm, friendly
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = () => {
        toast.error("Failed to play audio.");
        stop();
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("TTS error:", err);
      toast.error("Could not generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [panel, stop]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isPlaying ? stop : play}
      disabled={isLoading}
      className="gap-2"
      aria-label={isPlaying ? "Stop reading" : "Read panel aloud"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {isLoading ? "Loading…" : isPlaying ? "Stop" : "Read Aloud"}
    </Button>
  );
};
