import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import type { ComicStory } from "@/data/comicStories";
import { useComicPanelImages } from "@/hooks/useComicPanelImages";
import { ComicPanelOverlay } from "./ComicPanelOverlay";

interface ComicBookReaderProps {
  story: ComicStory;
  onBack: () => void;
}

export const ComicBookReader = ({ story, onBack }: ComicBookReaderProps) => {
  const [currentPanel, setCurrentPanel] = useState(-1); // -1 = cover
  const { imageMap, isLoading: imagesLoading } = useComicPanelImages(story.id);

  const totalPanels = story.panels.length;
  const isOnCover = currentPanel === -1;
  const panel = !isOnCover ? story.panels[currentPanel] : null;

  const getImage = (panelIndex: number) => imageMap[panelIndex] ?? null;
  const goToPanel = (index: number) => setCurrentPanel(index);
  const handleNext = () => { if (currentPanel < totalPanels - 1) goToPanel(currentPanel + 1); };
  const handlePrev = () => { if (currentPanel > -1) setCurrentPanel(currentPanel - 1); };

  const coverImage = getImage(-1);
  const currentImage = getImage(currentPanel);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Comics
        </Button>
        <Badge variant="outline">
          {isOnCover ? "Cover" : `Panel ${currentPanel + 1} of ${totalPanels}`}
        </Badge>
      </div>

      {/* Cover view */}
      {isOnCover && (
        <Card className="overflow-hidden">
          <div className="relative aspect-[3/4] sm:aspect-[16/10] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 flex flex-col items-center justify-center p-8 text-center">
            {imagesLoading ? (
              <Skeleton className="absolute inset-0 w-full h-full" />
            ) : coverImage ? (
              <img src={coverImage} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : null}

            <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-xl p-8 max-w-lg">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2">{story.title}</h1>
              <p className="text-lg text-muted-foreground mb-2">{story.subtitle}</p>
              <p className="text-sm text-muted-foreground mb-6">{story.description}</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {story.ehdsThemes.map((theme) => (
                  <Badge key={theme} variant="secondary" className="text-xs">{theme}</Badge>
                ))}
              </div>
              <Button onClick={() => goToPanel(0)} className="gap-2">
                <Sparkles className="h-4 w-4" /> Start Reading
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Panel view */}
      {!isOnCover && panel && (
        <Card className="overflow-hidden">
          {/* Panel image with dialogue overlay */}
          <div className="relative aspect-[16/10] bg-muted">
            {imagesLoading ? (
              <Skeleton className="absolute inset-0 w-full h-full" />
            ) : currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={`Panel ${currentPanel + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Speech bubble overlays */}
                <ComicPanelOverlay
                  narration={panel.narration}
                  dialogue={panel.dialogue}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-sm text-muted-foreground">Illustration coming soon ✨</p>
              </div>
            )}
          </div>

          {/* Narration & dialogue below (fallback/expanded view) */}
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
                    <Badge variant="outline" className="shrink-0 font-semibold mt-0.5">{d.character}</Badge>
                    <p className="text-sm leading-relaxed">{d.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 pb-6">
            <Button variant="outline" onClick={handlePrev} disabled={currentPanel <= -1} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-1.5">
              {story.panels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPanel(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentPanel
                      ? "bg-primary"
                      : getImage(i)
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" onClick={handleNext} disabled={currentPanel >= totalPanels - 1} className="gap-2">
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
                <a href={`/article/${a}`} className="text-primary hover:underline">Article {a}</a>
                {i < story.articleReferences.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};
