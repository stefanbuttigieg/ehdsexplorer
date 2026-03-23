import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ComicPanel } from "@/data/comicStories";

interface ComicTextReaderProps {
  panel: ComicPanel;
}

// Voice mapping – pick voices that best approximate young characters
const CHARACTER_VOICES: Record<string, string> = {
  alex: "iP95p4xoKVk53GoZ742B",            // Chris – lighter male voice for a boy
  mia: "pFZP5JQG7iQjIQuC4Bku",             // Lily – lighter female voice for a girl
  "professor byte": "kPtEHAvRnjUJFv7SK9WI", // Glitch – robotic/digital voice
};
const NARRATOR_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George – warm narrator

interface Segment {
  text: string;
  voiceId: string;
}

function buildSegments(panel: ComicPanel): Segment[] {
  const segments: Segment[] = [];

  if (panel.narration) {
    segments.push({ text: panel.narration, voiceId: NARRATOR_VOICE });
  }

  if (panel.dialogue?.length) {
    for (const d of panel.dialogue) {
      const key = d.character.toLowerCase();
      const voiceId = CHARACTER_VOICES[key] ?? NARRATOR_VOICE;
      segments.push({ text: d.text, voiceId });
    }
  }

  return segments;
}

async function fetchTTSBlob(text: string, voiceId: string): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text, voiceId }),
    }
  );

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status}`);
  }

  return response.blob();
}

export const ComicTextReader = ({ panel }: ComicTextReaderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);
  const urlsRef = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    cleanup();
    setIsPlaying(false);
    setIsLoading(false);
  }, [cleanup]);

  const playSegmentSequentially = useCallback(
    async (segments: Segment[]) => {
      for (const seg of segments) {
        if (cancelledRef.current) return;

        const blob = await fetchTTSBlob(seg.text, seg.voiceId);
        if (cancelledRef.current) return;

        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Playback error"));
          audio.play().catch(reject);
        });
      }
    },
    []
  );

  const play = useCallback(async () => {
    const segments = buildSegments(panel);
    if (segments.length === 0) {
      toast.info("No text to read on this panel.");
      return;
    }

    stop();
    cancelledRef.current = false;
    setIsLoading(true);

    try {
      setIsPlaying(true);
      setIsLoading(false);
      await playSegmentSequentially(segments);
    } catch (err) {
      if (!cancelledRef.current) {
        console.error("TTS error:", err);
        toast.error("Could not generate speech. Please try again.");
      }
    } finally {
      if (!cancelledRef.current) {
        setIsPlaying(false);
      }
      cleanup();
    }
  }, [panel, stop, playSegmentSequentially, cleanup]);

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
