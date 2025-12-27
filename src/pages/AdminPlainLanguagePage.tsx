import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Languages, Sparkles, FileText, Check, X, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import Layout from "@/components/Layout";
import { useArticles } from "@/hooks/useArticles";
import { useRecitals } from "@/hooks/useRecitals";
import {
  usePlainLanguageTranslations,
  usePlainLanguageTranslation,
  useGenerateTranslation,
  useSaveTranslation,
} from "@/hooks/usePlainLanguageTranslations";

const AdminPlainLanguagePage = () => {
  const [selectedType, setSelectedType] = useState<"article" | "recital">("article");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();
  const { data: translations } = usePlainLanguageTranslations();
  const { data: currentTranslation, isLoading: loadingTranslation } = usePlainLanguageTranslation(
    selectedType,
    selectedId || 0
  );

  const generateMutation = useGenerateTranslation();
  const saveMutation = useSaveTranslation();

  const items = selectedType === "article" 
    ? articles?.map(a => ({ id: a.article_number, title: a.title })) || []
    : recitals?.map(r => ({ id: r.recital_number, title: `Recital ${r.recital_number}` })) || [];

  const getTranslationStatus = (id: number) => {
    const t = translations?.find(
      tr => tr.content_type === selectedType && tr.content_id === id
    );
    if (!t) return null;
    return t.is_published ? "published" : "draft";
  };

  const handleSelectItem = (id: number) => {
    setSelectedId(id);
    setEditedText("");
  };

  const handleGenerate = async () => {
    if (!selectedId) return;
    const result = await generateMutation.mutateAsync({
      contentType: selectedType,
      contentId: selectedId,
    });
    setEditedText(result.plainLanguageText);
  };

  const handleSave = async (publish: boolean) => {
    if (!selectedId || !editedText.trim()) return;
    await saveMutation.mutateAsync({
      contentType: selectedType,
      contentId: selectedId,
      plainLanguageText: editedText,
      isPublished: publish,
      generatedBy: currentTranslation?.generated_by || "ai",
    });
  };

  // When translation loads, update edited text
  const displayText = editedText || currentTranslation?.plain_language_text || "";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif flex items-center gap-2">
              <Languages className="h-7 w-7 text-primary" />
              Plain Language Translations
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and manage AI-powered plain language versions of legal content
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Plain language translations are AI-generated and should be reviewed for accuracy before publishing.
            Published translations will appear alongside the original legal text for users.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel - Content selector */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Content</CardTitle>
              <CardDescription>Choose an article or recital to translate</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={selectedType} onValueChange={(v) => {
                setSelectedType(v as "article" | "recital");
                setSelectedId(null);
                setEditedText("");
              }}>
                <TabsList className="w-full rounded-none border-b">
                  <TabsTrigger value="article" className="flex-1">
                    Articles ({articles?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="recital" className="flex-1">
                    Recitals ({recitals?.length || 0})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={selectedType} className="m-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-2 space-y-1">
                      {items.map((item) => {
                        const status = getTranslationStatus(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectItem(item.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                              selectedId === item.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted"
                            }`}
                          >
                            <span className="text-sm line-clamp-2">
                              <span className="font-medium">
                                {selectedType === "article" ? `Art. ${item.id}` : item.id}:
                              </span>{" "}
                              {selectedType === "article" ? item.title : ""}
                            </span>
                            {status && (
                              <Badge
                                variant={status === "published" ? "default" : "secondary"}
                                className="shrink-0 text-xs"
                              >
                                {status === "published" ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right panel - Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedId
                      ? `${selectedType === "article" ? "Article" : "Recital"} ${selectedId}`
                      : "Select content to translate"}
                  </CardTitle>
                  {selectedId && currentTranslation && (
                    <CardDescription className="mt-1">
                      {currentTranslation.is_published ? (
                        <span className="text-green-600 dark:text-green-400">Published</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Draft</span>
                      )}{" "}
                      • Last updated: {new Date(currentTranslation.updated_at).toLocaleDateString()}
                    </CardDescription>
                  )}
                </div>
                {selectedId && (
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {currentTranslation ? "Regenerate" : "Generate"} with AI
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedId ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Languages className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select an article or recital from the list to get started</p>
                  </div>
                </div>
              ) : loadingTranslation ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Textarea
                    value={displayText}
                    onChange={(e) => setEditedText(e.target.value)}
                    placeholder="Click 'Generate with AI' to create a plain language translation, or write your own..."
                    className="min-h-[400px] font-sans leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      {displayText.length} characters
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={!displayText.trim() || saveMutation.isPending}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Save as Draft
                      </Button>
                      <Button
                        onClick={() => handleSave(true)}
                        disabled={!displayText.trim() || saveMutation.isPending}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Publish
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{articles?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{recitals?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Recitals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {translations?.filter(t => t.is_published).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">
                {translations?.filter(t => !t.is_published).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPlainLanguagePage;
