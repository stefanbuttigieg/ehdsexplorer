import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ComicStory } from "@/data/comicStories";

interface ComicBookReaderProps {
  story: ComicStory;
  onBack: () => void;
}

export const ComicBookReader = ({ story, onBack }: ComicBookReaderProps) => {
  const [currentPanel, setCurrentPanel] = useState(-1); // -1 = cover
  const [panelImages, setPanelImages] = useState<Record<number, string>>({});
  const [loadingPanel, setLoadingPanel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPanels = story.panels.length;
  const isOnCover = currentPanel === -1;
  const panel = !isOnCover ? story.panels[currentPanel] : null;

  const generateImage = async (panelIndex: number) => {
    if (panelImages[panelIndex]) return;

    setLoadingPanel(panelIndex);
    setError(null);

    try {
      const prompt =
        panelIndex === -1
          ? story.coverPrompt
          : story.panels[panelIndex].imagePrompt;

      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-comic-panel",
        {
          body: { imagePrompt: prompt, storyTitle: story.title },
        }
      );

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setPanelImages((prev) => ({ ...prev, [panelIndex]: data.imageUrl }));
      }
    } catch (err) {
      console.error("Failed to generate panel:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate image"
      );
    } finally {
      setLoadingPanel(null);
    }
  };

  const goToPanel = (index: number) => {
    setCurrentPanel(index);
    setError(null);
    if (!panelImages[index]) {
      generateImage(index);
    }
  };

  const handleNext = () => {
    if (currentPanel < totalPanels - 1) goToPanel(currentPanel + 1);
  };

  const handlePrev = () => {
    if (currentPanel > -1) {
      setCurrentPanel(currentPanel - 1);
      setError(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Comics
        </Button>
        <Badge variant="outline">
          {isOnCover
            ? "Cover"
            : `Panel ${currentPanel + 1} of ${totalPanels}`}
        </Badge>
      </div>

      {/* Cover view */}
      {isOnCover && (
        <Card className="overflow-hidden">
          <div className="relative aspect-[3/4] sm:aspect-[16/10] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 flex flex-col items-center justify-center p-8 text-center">
            {panelImages[-1] ? (
              <img
                src={panelImages[-1]}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : loadingPanel === -1 ? (
              <Skeleton className="absolute inset-0 w-full h-full" />
            ) : null}

            <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-xl p-8 max-w-lg">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2">
                {story.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                {story.subtitle}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {story.description}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {story.ehdsThemes.map((theme) => (
                  <Badge key={theme} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => goToPanel(0)} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Start Reading
                </Button>
                {!panelImages[-1] && loadingPanel !== -1 && (
                  <Button
                    variant="outline"
                    onClick={() => generateImage(-1)}
                    className="gap-2"
                  >
                    Generate Cover Art
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Panel view */}
      {!isOnCover && panel && (
        <Card className="overflow-hidden">
          {/* Panel image */}
          <div className="relative aspect-[16/10] bg-muted">
            {panelImages[currentPanel] ? (
              <img
                src={panelImages[currentPanel]}
                alt={`Panel ${currentPanel + 1}`}
                className="w-full h-full object-cover"
              />
            ) : loadingPanel === currentPanel ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Skeleton className="absolute inset-0 w-full h-full" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Generating panel artwork...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Button
                  onClick={() => generateImage(currentPanel)}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Generate Artwork
                </Button>
              </div>
            )}
          </div>

          {/* Narration & dialogue */}
          <div className="p-6">
            {panel.narration && (
              <p className="italic text-muted-foreground text-sm mb-4 border-l-2 border-primary pl-4">
                {panel.narration}
              </p>
            )}

            {panel.dialogue && panel.dialogue.length > 0 && (
              <div className="space-y-3">
                {panel.dialogue.map((d, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Badge
                      variant="outline"
                      className="shrink-0 font-semibold mt-0.5"
                    >
                      {d.character}
                    </Badge>
                    <p className="text-sm leading-relaxed">{d.text}</p>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 pb-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentPanel <= -1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            {/* Panel dots */}
            <div className="flex gap-1.5">
              {story.panels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPanel(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentPanel
                      ? "bg-primary"
                      : panelImages[i]
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentPanel >= totalPanels - 1}
              className="gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Article references */}
      {!isOnCover && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Related EHDS Articles:{" "}
            {story.articleReferences.map((a, i) => (
              <span key={a}>
                <a
                  href={`/article/${a}`}
                  className="text-primary hover:underline"
                >
                  Article {a}
                </a>
                {i < story.articleReferences.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};
