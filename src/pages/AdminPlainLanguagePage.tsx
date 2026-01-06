import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Languages, Sparkles, FileText, Check, X, Loader2, Eye, EyeOff, Zap, CheckCircle2, XCircle, MessageSquare, ThumbsUp, ThumbsDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/Layout";
import { useArticles } from "@/hooks/useArticles";
import { useRecitals } from "@/hooks/useRecitals";
import {
  usePlainLanguageTranslations,
  usePlainLanguageTranslation,
  useGenerateTranslation,
  useSaveTranslation,
  useBatchGenerateTranslations,
  useBulkPublishTranslations,
  BatchGenerationProgress,
  BulkPublishProgress,
} from "@/hooks/usePlainLanguageTranslations";
import { usePlainLanguageFeedbackList } from "@/hooks/usePlainLanguageFeedback";

const AdminPlainLanguagePage = () => {
  const [selectedType, setSelectedType] = useState<"article" | "recital">("article");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"translations" | "feedback">("translations");
  
  // Batch generation state
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<Set<number>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchGenerationProgress | null>(null);

  // Bulk publish state
  const [bulkPublishDialogOpen, setBulkPublishDialogOpen] = useState(false);
  const [selectedForPublish, setSelectedForPublish] = useState<Set<string>>(new Set());
  const [bulkPublishProgress, setBulkPublishProgress] = useState<BulkPublishProgress | null>(null);

  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();
  const { data: translations } = usePlainLanguageTranslations();
  const { data: feedbackList, isLoading: loadingFeedback } = usePlainLanguageFeedbackList();
  const { data: currentTranslation, isLoading: loadingTranslation } = usePlainLanguageTranslation(
    selectedType,
    selectedId || 0
  );

  const generateMutation = useGenerateTranslation();
  const saveMutation = useSaveTranslation();
  const batchMutation = useBatchGenerateTranslations();
  const bulkPublishMutation = useBulkPublishTranslations();

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

  // Get items without translations for batch generation
  const itemsWithoutTranslation = items.filter(item => !getTranslationStatus(item.id));

  // Get draft translations for bulk publish
  const draftTranslations = translations?.filter(t => !t.is_published) || [];

  const handleSelectItem = (id: number) => {
    setSelectedId(id);
    setEditedText(null); // Reset to null so it uses currentTranslation's text
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
    const textToSave = editedText !== null ? editedText : currentTranslation?.plain_language_text;
    if (!selectedId || !textToSave?.trim()) return;
    await saveMutation.mutateAsync({
      contentType: selectedType,
      contentId: selectedId,
      plainLanguageText: textToSave,
      isPublished: publish,
      generatedBy: currentTranslation?.generated_by || "ai",
    });
  };

  const handleBatchSelect = (id: number, checked: boolean) => {
    const newSet = new Set(selectedForBatch);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedForBatch(newSet);
  };

  const handleSelectAllForBatch = (checked: boolean) => {
    if (checked) {
      setSelectedForBatch(new Set(itemsWithoutTranslation.map(item => item.id)));
    } else {
      setSelectedForBatch(new Set());
    }
  };

  const handleStartBatch = async () => {
    if (selectedForBatch.size === 0) return;
    
    const itemsToGenerate = Array.from(selectedForBatch).map(id => ({
      contentType: selectedType,
      contentId: id,
    }));

    await batchMutation.mutateAsync({
      items: itemsToGenerate,
      onProgress: setBatchProgress,
    });
  };

  const handleCloseBatchDialog = () => {
    if (!batchMutation.isPending) {
      setBatchDialogOpen(false);
      setSelectedForBatch(new Set());
      setBatchProgress(null);
    }
  };

  // Bulk publish handlers
  const handlePublishSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedForPublish);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedForPublish(newSet);
  };

  const handleSelectAllForPublish = (checked: boolean) => {
    if (checked) {
      setSelectedForPublish(new Set(draftTranslations.map(t => t.id)));
    } else {
      setSelectedForPublish(new Set());
    }
  };

  const handleStartBulkPublish = async () => {
    if (selectedForPublish.size === 0 || !translations) return;
    
    await bulkPublishMutation.mutateAsync({
      translationIds: Array.from(selectedForPublish),
      translations,
      onProgress: setBulkPublishProgress,
    });
  };

  const handleCloseBulkPublishDialog = () => {
    if (!bulkPublishMutation.isPending) {
      setBulkPublishDialogOpen(false);
      setSelectedForPublish(new Set());
      setBulkPublishProgress(null);
    }
  };

  // When translation loads, update edited text
  const displayText = editedText !== null ? editedText : (currentTranslation?.plain_language_text || "");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
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
          
          <div className="flex gap-2">
            {/* Bulk Publish Button */}
            <Dialog open={bulkPublishDialogOpen} onOpenChange={setBulkPublishDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Publish
                  {draftTranslations.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{draftTranslations.length}</Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Bulk Publish Translations
                  </DialogTitle>
                  <DialogDescription>
                    Select draft translations to publish all at once.
                  </DialogDescription>
                </DialogHeader>
                
                {!bulkPublishProgress ? (
                  <>
                    {draftTranslations.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p>All translations are already published!</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="select-all-publish"
                              checked={selectedForPublish.size === draftTranslations.length && draftTranslations.length > 0}
                              onCheckedChange={handleSelectAllForPublish}
                            />
                            <label htmlFor="select-all-publish" className="text-sm font-medium cursor-pointer">
                              Select All ({draftTranslations.length} drafts)
                            </label>
                          </div>
                          <Badge variant="secondary">
                            {selectedForPublish.size} selected
                          </Badge>
                        </div>

                        <ScrollArea className="flex-1 max-h-[300px]">
                          <div className="space-y-1 p-1">
                            {draftTranslations.map((translation) => (
                              <div
                                key={translation.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                              >
                                <Checkbox
                                  id={`publish-${translation.id}`}
                                  checked={selectedForPublish.has(translation.id)}
                                  onCheckedChange={(checked) => handlePublishSelect(translation.id, checked as boolean)}
                                />
                                <label
                                  htmlFor={`publish-${translation.id}`}
                                  className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                                >
                                  <span className="font-medium">
                                    {translation.content_type === "article" ? "Article" : "Recital"} {translation.content_id}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Updated: {new Date(translation.updated_at).toLocaleDateString()}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}

                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={handleCloseBulkPublishDialog}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartBulkPublish}
                        disabled={selectedForPublish.size === 0 || bulkPublishMutation.isPending}
                      >
                        {bulkPublishMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Publish {selectedForPublish.size} Translation{selectedForPublish.size !== 1 ? "s" : ""}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  /* Progress View */
                  <div className="py-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {bulkPublishProgress.completed < bulkPublishProgress.total
                            ? "Publishing translations..."
                            : "Complete!"}
                        </span>
                        <span className="text-muted-foreground">
                          {bulkPublishProgress.completed} / {bulkPublishProgress.total}
                        </span>
                      </div>
                      <Progress 
                        value={(bulkPublishProgress.completed / bulkPublishProgress.total) * 100} 
                        className="h-2"
                      />
                    </div>

                    {bulkPublishProgress.results.length > 0 && (
                      <ScrollArea className="max-h-[250px]">
                        <div className="space-y-1">
                          {bulkPublishProgress.results.map((result, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 p-2 rounded text-sm ${
                                result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                              }`}
                            >
                              {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                              )}
                              <span className="capitalize">{result.type}</span> {result.id}
                              {result.error && (
                                <span className="text-red-600 text-xs ml-2">({result.error})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {!bulkPublishMutation.isPending && (
                      <DialogFooter>
                        <Button onClick={handleCloseBulkPublishDialog}>
                          Done
                        </Button>
                      </DialogFooter>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Batch Generation Button */}
            <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Zap className="h-4 w-4 mr-2" />
                  Batch Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Batch Generate Translations
                  </DialogTitle>
                  <DialogDescription>
                    Select multiple {selectedType}s to generate plain language translations at once.
                    Translations will be saved as drafts for review.
                  </DialogDescription>
                </DialogHeader>
                
                {!batchProgress ? (
                  <>
                    {/* Selection tabs */}
                    <Tabs value={selectedType} onValueChange={(v) => {
                      setSelectedType(v as "article" | "recital");
                      setSelectedForBatch(new Set());
                    }} className="mt-2">
                      <TabsList className="w-full">
                        <TabsTrigger value="article" className="flex-1">
                          Articles
                        </TabsTrigger>
                        <TabsTrigger value="recital" className="flex-1">
                          Recitals
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {itemsWithoutTranslation.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p>All {selectedType}s already have translations!</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="select-all"
                              checked={selectedForBatch.size === itemsWithoutTranslation.length && itemsWithoutTranslation.length > 0}
                              onCheckedChange={handleSelectAllForBatch}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                              Select All ({itemsWithoutTranslation.length} without translation)
                            </label>
                          </div>
                          <Badge variant="secondary">
                            {selectedForBatch.size} selected
                          </Badge>
                        </div>

                        <ScrollArea className="flex-1 max-h-[300px]">
                          <div className="space-y-1 p-1">
                            {itemsWithoutTranslation.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                              >
                                <Checkbox
                                  id={`batch-${item.id}`}
                                  checked={selectedForBatch.has(item.id)}
                                  onCheckedChange={(checked) => handleBatchSelect(item.id, checked as boolean)}
                                />
                                <label
                                  htmlFor={`batch-${item.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  <span className="font-medium">
                                    {selectedType === "article" ? `Article ${item.id}` : `Recital ${item.id}`}:
                                  </span>{" "}
                                  {selectedType === "article" ? item.title : ""}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}

                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={handleCloseBatchDialog}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartBatch}
                        disabled={selectedForBatch.size === 0 || batchMutation.isPending}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {selectedForBatch.size} Translation{selectedForBatch.size !== 1 ? "s" : ""}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  /* Progress View */
                  <div className="py-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {batchProgress.current 
                            ? `Generating ${batchProgress.current.type} ${batchProgress.current.id}...`
                            : "Complete!"}
                        </span>
                        <span className="text-muted-foreground">
                          {batchProgress.completed} / {batchProgress.total}
                        </span>
                      </div>
                      <Progress 
                        value={(batchProgress.completed / batchProgress.total) * 100} 
                        className="h-2"
                      />
                    </div>

                    {batchProgress.results.length > 0 && (
                      <ScrollArea className="max-h-[250px]">
                        <div className="space-y-1">
                          {batchProgress.results.map((result, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 p-2 rounded text-sm ${
                                result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                              }`}
                            >
                              {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                              )}
                              <span className="capitalize">{result.type}</span> {result.id}
                              {result.error && (
                                <span className="text-red-600 text-xs ml-2">({result.error})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {!batchMutation.isPending && (
                      <DialogFooter>
                        <Button onClick={handleCloseBatchDialog}>
                          Done
                        </Button>
                      </DialogFooter>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "translations" | "feedback")} className="mb-6">
          <TabsList>
            <TabsTrigger value="translations" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Translations
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
              {feedbackList && feedbackList.length > 0 && (
                <Badge variant="secondary" className="ml-1">{feedbackList.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "translations" && (
          <>
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
                setEditedText(null);
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
          </>
        )}

        {activeTab === "feedback" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                User Feedback
              </CardTitle>
              <CardDescription>
                View feedback submitted by users on plain language translations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFeedback ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !feedbackList || feedbackList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No feedback has been submitted yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{feedbackList.length}</div>
                        <p className="text-sm text-muted-foreground">Total Feedback</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {feedbackList.filter(f => f.feedback_type === "positive").length}
                        </div>
                        <p className="text-sm text-muted-foreground">Positive</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {feedbackList.filter(f => f.feedback_type === "negative").length}
                        </div>
                        <p className="text-sm text-muted-foreground">Negative</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {feedbackList.length > 0 
                            ? Math.round((feedbackList.filter(f => f.feedback_type === "positive").length / feedbackList.length) * 100)
                            : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Positive Rate</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Session</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedbackList.map((feedback) => {
                          const translation = feedback.plain_language_translations as { content_type: string; content_id: number } | null;
                          return (
                            <TableRow key={feedback.id}>
                              <TableCell>
                                {translation ? (
                                  <span className="font-medium">
                                    {translation.content_type === "article" ? "Article" : "Recital"} {translation.content_id}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Unknown</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {feedback.feedback_type === "positive" ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    Helpful
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                    Not Helpful
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                {feedback.comment ? (
                                  <p className="text-sm text-foreground line-clamp-2" title={feedback.comment}>
                                    {feedback.comment}
                                  </p>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(feedback.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {feedback.session_id?.slice(0, 8) || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminPlainLanguagePage;
