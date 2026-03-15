import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sparkles, Heart, Shield, Gamepad2, ArrowLeft } from "lucide-react";
import { comicStories, type AgeGroup, type ComicStory } from "@/data/comicStories";
import { ComicStoryCard } from "@/components/comics/ComicStoryCard";
import { ComicBookReader } from "@/components/comics/ComicBookReader";

const KidsCornerPage = () => {
  const [selectedStory, setSelectedStory] = useState<ComicStory | null>(null);
  const [ageFilter, setAgeFilter] = useState<AgeGroup | "all">("all");

  const filteredStories = ageFilter === "all"
    ? comicStories
    : comicStories.filter((s) => s.ageGroup === ageFilter);

  if (selectedStory) {
    return (
      <Layout>
        <Helmet>
          <title>{selectedStory.title} | EHDS Comics</title>
        </Helmet>
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <ComicBookReader story={selectedStory} onBack={() => setSelectedStory(null)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Comics — Learn About EHDS | EHDS Explorer</title>
        <meta
          name="description"
          content="Fun comic books and stories to help children and teens understand the European Health Data Space regulation."
        />
      </Helmet>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            Made for Young Explorers
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Kids Corner
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover the European Health Data Space through exciting comic book stories! 
            Learn about your health data rights, how data protects you, and how it helps doctors and researchers.
          </p>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Your Data, Your Rights</p>
                <p className="text-xs text-muted-foreground">
                  Learn how the EHDS protects your health information
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Heart className="h-8 w-8 text-secondary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Healthcare Heroes</p>
                <p className="text-xs text-muted-foreground">
                  See how health data helps doctors save lives
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/20 to-transparent border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-accent-foreground shrink-0" />
              <div>
                <p className="font-semibold text-sm">AI-Generated Art</p>
                <p className="text-xs text-muted-foreground">
                  Every panel is uniquely created by AI
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Age filter tabs */}
        <Tabs
          value={ageFilter}
          onValueChange={(v) => setAgeFilter(v as AgeGroup | "all")}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold font-serif">Comic Books</h2>
            <TabsList>
              <TabsTrigger value="all">All Ages</TabsTrigger>
              <TabsTrigger value="10-13">Ages 10–13</TabsTrigger>
              <TabsTrigger value="14-17">Ages 14–17</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={ageFilter} className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredStories.map((story) => (
                <ComicStoryCard
                  key={story.id}
                  story={story}
                  onClick={() => setSelectedStory(story)}
                />
              ))}
            </div>
            {filteredStories.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No stories available for this age group yet. Check back soon!
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Games CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Want more EHDS fun?</h3>
                  <p className="text-sm text-muted-foreground">
                    Try our interactive learning games — quizzes, flashcards, word search, and more!
                  </p>
                </div>
              </div>
              <Link to="/games">
                <Badge variant="default" className="cursor-pointer text-sm px-4 py-2">
                  Play Games →
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default KidsCornerPage;
