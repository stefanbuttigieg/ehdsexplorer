import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users } from "lucide-react";
import type { ComicStory } from "@/data/comicStories";

interface ComicStoryCardProps {
  story: ComicStory;
  onClick: () => void;
}

export const ComicStoryCard = ({ story, onClick }: ComicStoryCardProps) => {
  const ageLabel = story.ageGroup === "10-13" ? "Ages 10–13" : "Ages 14–17";
  const ageColor = story.ageGroup === "10-13"
    ? "bg-accent/20 text-accent-foreground"
    : "bg-secondary text-secondary-foreground";

  return (
    <Card
      className="hover:border-primary transition-all cursor-pointer group h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <BookOpen className="h-10 w-10 text-primary group-hover:scale-110 transition-transform shrink-0" />
          <Badge className={ageColor}>
            <Users className="h-3 w-3 mr-1" />
            {ageLabel}
          </Badge>
        </div>
        <CardTitle className="text-xl mt-3">{story.title}</CardTitle>
        <CardDescription>{story.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {story.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {story.ehdsThemes.slice(0, 3).map((theme) => (
            <Badge key={theme} variant="outline" className="text-xs px-2 py-0">
              {theme}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {story.panels.length} panels • AI-generated illustrations
        </p>
      </CardContent>
    </Card>
  );
};
