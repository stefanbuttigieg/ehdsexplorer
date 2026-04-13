import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Linkedin, BookOpen } from "lucide-react";
import { Plus, Trash2, Edit, Save, X, ArrowLeft, Upload, Loader2, Check, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useImplementingAct } from "@/hooks/useImplementingActs";
import {
  useImplementingActRecitals,
  useImplementingActSections,
  useImplementingActArticles,
  ImplementingActRecital,
  ImplementingActSection,
  ImplementingActArticle,
} from "@/hooks/useImplementingActContent";
import { useLinkedInPosts, useCreateLinkedInPost, useDeleteLinkedInPost, LinkedInPost } from "@/hooks/useLinkedInPosts";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useImplementingActImport } from "@/hooks/useImplementingActImport";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FootnoteManager } from "@/components/admin/FootnoteManager";
import { useFootnotesByIAArticle, useFootnotesByIARecital } from "@/hooks/useFootnotes";
import { useDefinitions } from "@/hooks/useDefinitions";
import { Checkbox } from "@/components/ui/checkbox";

/** Small wrapper that fetches footnotes for an IA article or recital and renders FootnoteManager */
function IAFootnoteSection({ type, parentId }: { type: "article" | "recital"; parentId: string }) {
  const { data: articleFootnotes = [] } = useFootnotesByIAArticle(type === "article" ? parentId : null);
  const { data: recitalFootnotes = [] } = useFootnotesByIARecital(type === "recital" ? parentId : null);
  const footnotes = type === "article" ? articleFootnotes : recitalFootnotes;
  return (
    <FootnoteManager
      footnotes={footnotes}
      implementingActArticleId={type === "article" ? parentId : null}
      implementingActRecitalId={type === "recital" ? parentId : null}
    />
  );
}
import { Progress } from "@/components/ui/progress";

const AdminImplementingActContentPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: act, isLoading: loadingAct } = useImplementingAct(id || "");
  const { data: recitals = [], isLoading: loadingRecitals } = useImplementingActRecitals(id || "");
  const { data: sections = [], isLoading: loadingSections } = useImplementingActSections(id || "");
  const { data: articles = [], isLoading: loadingArticles } = useImplementingActArticles(id || "");

  const [editingRecital, setEditingRecital] = useState<ImplementingActRecital | null>(null);
  const [editingArticle, setEditingArticle] = useState<ImplementingActArticle | null>(null);
  const [editingSection, setEditingSection] = useState<ImplementingActSection | null>(null);

  const [newRecitalOpen, setNewRecitalOpen] = useState(false);
  const [newArticleOpen, setNewArticleOpen] = useState(false);
  const [newSectionOpen, setNewSectionOpen] = useState(false);

  const [newRecital, setNewRecital] = useState({ recital_number: 1, content: "" });
  const [newArticle, setNewArticle] = useState({ article_number: 1, title: "", content: "", section_id: "" });
  const [newSection, setNewSection] = useState({ section_number: 1, title: "" });
  const { data: linkedInPosts = [] } = useLinkedInPosts(id || "");
  const createLinkedInPost = useCreateLinkedInPost();
  const deleteLinkedInPost = useDeleteLinkedInPost();

  const [newLinkedInPostOpen, setNewLinkedInPostOpen] = useState(false);
  const [editingLinkedInPost, setEditingLinkedInPost] = useState<LinkedInPost | null>(null);
  const [newLinkedInPost, setNewLinkedInPost] = useState({ post_url: "", title: "", description: "", author_name: "", posted_at: "" });

  const isLoading = loadingAct || loadingRecitals || loadingSections || loadingArticles;

  // Definition extraction from articles titled "Definitions"
  const { data: allDefinitions = [] } = useDefinitions();
  const [selectedDefTerms, setSelectedDefTerms] = useState<Set<string>>(new Set());
  const [isImportingDefs, setIsImportingDefs] = useState(false);

  const extractedDefinitions = useMemo(() => {
    const defArticles = articles.filter(a => a.title.toLowerCase().includes('definition'));
    const defs: Array<{ term: string; definition: string; alreadyExists: boolean }> = [];
    const existingTermsLower = new Set(allDefinitions.map(d => d.term.toLowerCase()));

    for (const article of defArticles) {
      // Parse "'term' means definition;" patterns
      const regex = /['\u2018\u2019']([^'\u2018\u2019']+)['\u2018\u2019']\s+means\s+([\s\S]*?)(?:;\s*$|;\s*(?=['\u2018\u2019']))/gm;
      let match;
      while ((match = regex.exec(article.content)) !== null) {
        const term = match[1].trim();
        let definition = match[2].trim();
        // Clean up definition - remove trailing semicolons and whitespace
        definition = definition.replace(/;\s*$/, '').trim();
        if (term && definition) {
          defs.push({
            term,
            definition,
            alreadyExists: existingTermsLower.has(term.toLowerCase()),
          });
        }
      }
      
      // Also try numbered list pattern: (a) 'term' means ...
      if (defs.length === 0) {
        const altRegex = /(?:\([a-z]\)\s*)?['\u2018\u2019']([^'\u2018\u2019']+)['\u2018\u2019']\s+means\s+([\s\S]*?)(?:;\s*$|;\s*(?=\([a-z]\)))/gm;
        let altMatch;
        while ((altMatch = altRegex.exec(article.content)) !== null) {
          const term = altMatch[1].trim();
          let definition = altMatch[2].trim().replace(/;\s*$/, '').trim();
          if (term && definition && !defs.some(d => d.term.toLowerCase() === term.toLowerCase())) {
            defs.push({
              term,
              definition,
              alreadyExists: existingTermsLower.has(term.toLowerCase()),
            });
          }
        }
      }
    }
    return defs;
  }, [articles, allDefinitions]);

  const newDefinitions = extractedDefinitions.filter(d => !d.alreadyExists);

  const toggleDefSelection = (term: string) => {
    setSelectedDefTerms(prev => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term); else next.add(term);
      return next;
    });
  };

  const selectAllNewDefs = () => {
    setSelectedDefTerms(new Set(newDefinitions.map(d => d.term)));
  };

  const handleImportDefinitions = async () => {
    if (selectedDefTerms.size === 0) return;
    setIsImportingDefs(true);
    try {
      const toImport = extractedDefinitions.filter(d => selectedDefTerms.has(d.term) && !d.alreadyExists);
      // Get max id
      const { data: maxRow } = await supabase.from("definitions").select("id").order("id", { ascending: false }).limit(1).single();
      let nextId = (maxRow?.id || 159) + 1;

      for (const def of toImport) {
        const defId = nextId++;
        const { error: defError } = await supabase.from("definitions").insert({
          id: defId,
          term: def.term,
          definition: def.definition,
          source: 'implementing_act' as any,
        });
        if (defError) throw defError;

        const { error: srcError } = await supabase.from("definition_sources").insert({
          definition_id: defId,
          source: 'implementing_act' as any,
          source_text: def.definition,
        });
        if (srcError) throw srcError;
      }

      toast.success(`Imported ${toImport.length} definitions to the glossary`);
      setSelectedDefTerms(new Set());
      queryClient.invalidateQueries({ queryKey: ["definitions"] });
    } catch (e) {
      toast.error(`Failed to import: ${(e as Error).message}`);
    } finally {
      setIsImportingDefs(false);
    }
  };

  // Import functionality
  const {
    isParsing: isImportParsing,
    isImporting: isImportRunning,
    parsedContent: importParsed,
    parseDocument: importParse,
    importToImplementingAct,
    reset: resetImport,
  } = useImplementingActImport();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [isFileLoading, setIsFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      toast.error("Please select a PDF or Word (.docx) file");
      return;
    }

    setIsFileLoading(true);
    try {
      if (isDocx) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // Convert HTML to clean text preserving structure
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = result.value;
        // Walk the DOM to extract structured text
        const lines: string[] = [];
        const walk = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) lines.push(text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            // Block elements get their own line
            if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "div", "br"].includes(tag)) {
              const text = el.textContent?.trim();
              if (text) lines.push(text);
            } else {
              for (const child of Array.from(node.childNodes)) {
                walk(child);
              }
            }
          }
        };
        for (const child of Array.from(tempDiv.childNodes)) {
          walk(child);
        }
        const fullText = lines.join("\n");
        setImportText(fullText);
        toast.success(`Extracted text from Word document`);
      } else {
        // PDF path
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          const lineMap = new Map<number, Array<{ x: number; str: string }>>();
          for (const item of content.items as any[]) {
            if (!item.str) continue;
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y)!.push({ x: item.transform[4], str: item.str });
          }

          const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
          const pageLines: string[] = [];
          for (const y of sortedYs) {
            const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
            pageLines.push(items.map(it => it.str).join(" "));
          }
          fullText += pageLines.join("\n") + "\n\n";
        }
        setImportText(fullText);
        toast.success(`Extracted text from ${pdf.numPages} pages`);
      }
    } catch (err) {
      toast.error("Failed to read file: " + (err as Error).message);
    } finally {
      setIsFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleImportParse = useCallback(async () => {
    if (importText.trim()) {
      await importParse(importText);
    }
  }, [importText, importParse]);

  const handleImportConfirm = useCallback(async () => {
    if (!importParsed || !id) return;
    const articleNums = importParsed.articles.map(a => a.articleNumber);
    const recitalNums = importParsed.recitals.map(r => r.recitalNumber);
    const result = await importToImplementingAct(id, articleNums, recitalNums);
    if (result) {
      setShowImportDialog(false);
      setImportText("");
      resetImport();
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
    }
  }, [importParsed, id, importToImplementingAct, resetImport, queryClient]);

  // Mutations
  const addRecitalMutation = useMutation({
    mutationFn: async (data: typeof newRecital) => {
      const { error } = await supabase.from("implementing_act_recitals").insert({
        implementing_act_id: id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      setNewRecitalOpen(false);
      setNewRecital({ recital_number: recitals.length + 1, content: "" });
      toast.success("Recital added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateRecitalMutation = useMutation({
    mutationFn: async (data: ImplementingActRecital) => {
      const { error } = await supabase.from("implementing_act_recitals").update({
        recital_number: data.recital_number,
        content: data.content,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      setEditingRecital(null);
      toast.success("Recital updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteRecitalMutation = useMutation({
    mutationFn: async (recitalId: string) => {
      const { error } = await supabase.from("implementing_act_recitals").delete().eq("id", recitalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-recitals", id] });
      toast.success("Recital deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const addSectionMutation = useMutation({
    mutationFn: async (data: typeof newSection) => {
      const { error } = await supabase.from("implementing_act_sections").insert({
        implementing_act_id: id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      setNewSectionOpen(false);
      setNewSection({ section_number: sections.length + 1, title: "" });
      toast.success("Section added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (data: ImplementingActSection) => {
      const { error } = await supabase.from("implementing_act_sections").update({
        section_number: data.section_number,
        title: data.title,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      setEditingSection(null);
      toast.success("Section updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("implementing_act_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-sections", id] });
      toast.success("Section deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const addArticleMutation = useMutation({
    mutationFn: async (data: typeof newArticle) => {
      const { error } = await supabase.from("implementing_act_articles").insert({
        implementing_act_id: id,
        article_number: data.article_number,
        title: data.title,
        content: data.content,
        section_id: data.section_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      setNewArticleOpen(false);
      setNewArticle({ article_number: articles.length + 1, title: "", content: "", section_id: "" });
      toast.success("Article added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: ImplementingActArticle) => {
      const { error } = await supabase.from("implementing_act_articles").update({
        article_number: data.article_number,
        title: data.title,
        content: data.content,
        section_id: data.section_id,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      setEditingArticle(null);
      toast.success("Article updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase.from("implementing_act_articles").delete().eq("id", articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementing-act-articles", id] });
      toast.success("Article deleted");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!act) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6 text-center">
          <p className="text-muted-foreground">Implementing Act not found</p>
          <Link to="/admin/implementing-acts">
            <Button className="mt-4">Back to list</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Implementing Acts", href: "/admin/implementing-acts" },
            { label: act.articleReference },
          ]}
        />

        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/implementing-acts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{act.title}</h1>
            <p className="text-muted-foreground">{act.articleReference}</p>
          </div>
          <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { resetImport(); setImportText(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import from Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Implementing Act Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!importParsed ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImportParsing || isFileLoading}
                      >
                        {isFileLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reading file...</>
                        ) : (
                          <><FileText className="h-4 w-4 mr-2" />Upload PDF or Word</>
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <div className="flex-1 border-t border-muted" />
                        <span className="text-xs text-muted-foreground bg-background px-2">or paste text</span>
                        <div className="flex-1 border-t border-muted" />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Paste the full text of the implementing act here..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="h-64 font-mono text-sm"
                      disabled={isImportParsing || isFileLoading}
                    />
                    <Button
                      className="w-full"
                      onClick={handleImportParse}
                      disabled={isImportParsing || isFileLoading || !importText.trim()}
                    >
                      {isImportParsing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Parsing...</>
                      ) : (
                        "Parse Content"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        Found {importParsed.articles.length} articles, {importParsed.recitals.length} recitals.
                        This will replace all existing content for this implementing act.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { resetImport(); setImportText(""); }} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleImportConfirm} disabled={isImportRunning} className="flex-1">
                        {isImportRunning ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                        ) : (
                          <><Check className="h-4 w-4 mr-2" />Import Content</>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="articles">Articles ({articles.length})</TabsTrigger>
            <TabsTrigger value="recitals">Recitals ({recitals.length})</TabsTrigger>
            <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
            <TabsTrigger value="definitions" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Definitions ({extractedDefinitions.length})
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-1.5">
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn ({linkedInPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Article Number</Label>
                          <Input
                            type="number"
                            value={newArticle.article_number}
                            onChange={(e) => setNewArticle({ ...newArticle, article_number: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Section (optional)</Label>
                          <Select
                            value={newArticle.section_id || "none"}
                            onValueChange={(v) => setNewArticle({ ...newArticle, section_id: v === "none" ? "" : v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No section" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No section</SelectItem>
                              {sections.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  Section {s.section_number}: {s.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newArticle.title}
                          onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <MarkdownEditor
                          value={newArticle.content}
                          onChange={(v) => setNewArticle({ ...newArticle, content: v })}
                        />
                      </div>
                      <Button onClick={() => addArticleMutation.mutate(newArticle)} disabled={addArticleMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Article
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No articles yet</p>
                ) : (
                  <div className="space-y-3">
                    {articles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Art. {article.article_number}</Badge>
                          <span className="font-medium">{article.title}</span>
                          {article.section_id && (
                            <Badge variant="outline" className="text-xs">
                              {sections.find((s) => s.id === article.section_id)?.title}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingArticle(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteArticleMutation.mutate(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Article Dialog */}
            <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Article</DialogTitle>
                </DialogHeader>
                {editingArticle && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Article Number</Label>
                        <Input
                          type="number"
                          value={editingArticle.article_number}
                          onChange={(e) =>
                            setEditingArticle({ ...editingArticle, article_number: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Select
                          value={editingArticle.section_id || "none"}
                          onValueChange={(v) => setEditingArticle({ ...editingArticle, section_id: v === "none" ? null : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="No section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No section</SelectItem>
                            {sections.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                Section {s.section_number}: {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editingArticle.title}
                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <MarkdownEditor
                        value={editingArticle.content}
                        onChange={(v) => setEditingArticle({ ...editingArticle, content: v })}
                      />
                    </div>
                    <IAFootnoteSection type="article" parentId={editingArticle.id} />
                    <div className="flex gap-2">
                      <Button onClick={() => updateArticleMutation.mutate(editingArticle)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingArticle(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Recitals Tab */}
          <TabsContent value="recitals">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recitals</CardTitle>
                <Dialog open={newRecitalOpen} onOpenChange={setNewRecitalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Recital
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Recital</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Recital Number</Label>
                        <Input
                          type="number"
                          value={newRecital.recital_number}
                          onChange={(e) => setNewRecital({ ...newRecital, recital_number: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <MarkdownEditor
                          value={newRecital.content}
                          onChange={(v) => setNewRecital({ ...newRecital, content: v })}
                        />
                      </div>
                      <Button onClick={() => addRecitalMutation.mutate(newRecital)} disabled={addRecitalMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Recital
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {recitals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No recitals yet</p>
                ) : (
                  <div className="space-y-3">
                    {recitals.map((recital) => (
                      <div key={recital.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline">({recital.recital_number})</Badge>
                          <p className="text-sm line-clamp-2">{recital.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRecital(recital)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRecitalMutation.mutate(recital.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Recital Dialog */}
            <Dialog open={!!editingRecital} onOpenChange={() => setEditingRecital(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Recital</DialogTitle>
                </DialogHeader>
                {editingRecital && (
                  <div className="space-y-4">
                    <div>
                      <Label>Recital Number</Label>
                      <Input
                        type="number"
                        value={editingRecital.recital_number}
                        onChange={(e) =>
                          setEditingRecital({ ...editingRecital, recital_number: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <MarkdownEditor
                        value={editingRecital.content}
                        onChange={(v) => setEditingRecital({ ...editingRecital, content: v })}
                      />
                    </div>
                    <IAFootnoteSection type="recital" parentId={editingRecital.id} />
                    <div className="flex gap-2">
                      <Button onClick={() => updateRecitalMutation.mutate(editingRecital)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingRecital(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sections</CardTitle>
                <Dialog open={newSectionOpen} onOpenChange={setNewSectionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Section Number</Label>
                        <Input
                          type="number"
                          value={newSection.section_number}
                          onChange={(e) => setNewSection({ ...newSection, section_number: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newSection.title}
                          onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                        />
                      </div>
                      <Button onClick={() => addSectionMutation.mutate(newSection)} disabled={addSectionMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" /> Save Section
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sections yet</p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Section {section.section_number}</Badge>
                          <span className="font-medium">{section.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {articles.filter((a) => a.section_id === section.id).length} articles
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSection(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSectionMutation.mutate(section.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Section Dialog */}
            <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Section</DialogTitle>
                </DialogHeader>
                {editingSection && (
                  <div className="space-y-4">
                    <div>
                      <Label>Section Number</Label>
                      <Input
                        type="number"
                        value={editingSection.section_number}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, section_number: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editingSection.title}
                        onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateSectionMutation.mutate(editingSection)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* LinkedIn Posts Tab */}
          <TabsContent value="linkedin">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>LinkedIn Posts</CardTitle>
                <Dialog open={newLinkedInPostOpen} onOpenChange={setNewLinkedInPostOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add LinkedIn Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Post URL *</Label>
                        <Input
                          value={newLinkedInPost.post_url}
                          onChange={(e) => setNewLinkedInPost({ ...newLinkedInPost, post_url: e.target.value })}
                          placeholder="https://www.linkedin.com/posts/..."
                        />
                      </div>
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={newLinkedInPost.title}
                          onChange={(e) => setNewLinkedInPost({ ...newLinkedInPost, title: e.target.value })}
                          placeholder="Post title or summary"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={newLinkedInPost.description}
                          onChange={(e) => setNewLinkedInPost({ ...newLinkedInPost, description: e.target.value })}
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Author Name</Label>
                          <Input
                            value={newLinkedInPost.author_name}
                            onChange={(e) => setNewLinkedInPost({ ...newLinkedInPost, author_name: e.target.value })}
                            placeholder="Author name"
                          />
                        </div>
                        <div>
                          <Label>Posted Date</Label>
                          <Input
                            type="date"
                            value={newLinkedInPost.posted_at}
                            onChange={(e) => setNewLinkedInPost({ ...newLinkedInPost, posted_at: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          if (!newLinkedInPost.post_url || !newLinkedInPost.title) {
                            toast.error("URL and Title are required");
                            return;
                          }
                          createLinkedInPost.mutate({
                            implementing_act_id: id!,
                            post_url: newLinkedInPost.post_url,
                            title: newLinkedInPost.title,
                            description: newLinkedInPost.description || null,
                            author_name: newLinkedInPost.author_name || null,
                            posted_at: newLinkedInPost.posted_at || null,
                            sort_order: linkedInPosts.length,
                          }, {
                            onSuccess: () => {
                              setNewLinkedInPostOpen(false);
                              setNewLinkedInPost({ post_url: "", title: "", description: "", author_name: "", posted_at: "" });
                              toast.success("LinkedIn post added");
                            },
                            onError: (e) => toast.error(`Failed: ${e.message}`),
                          });
                        }}
                        disabled={createLinkedInPost.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" /> Save Post
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {linkedInPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No LinkedIn posts yet</p>
                ) : (
                  <div className="space-y-3">
                    {linkedInPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <Linkedin className="h-4 w-4 text-[#0A66C2] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{post.author_name || post.post_url}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteLinkedInPost.mutate(
                              { id: post.id, implementingActId: id! },
                              {
                                onSuccess: () => toast.success("Post deleted"),
                                onError: (e) => toast.error(`Failed: ${e.message}`),
                              }
                            )}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Definitions Tab */}
          <TabsContent value="definitions">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Extracted Definitions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Definitions found in articles titled "Definitions". Import new ones to the glossary.
                  </p>
                </div>
                {newDefinitions.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllNewDefs}>
                      Select All New ({newDefinitions.length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleImportDefinitions}
                      disabled={selectedDefTerms.size === 0 || isImportingDefs}
                    >
                      {isImportingDefs ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" />Import Selected ({selectedDefTerms.size})</>
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {extractedDefinitions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No definitions article found. Definitions are extracted from articles with "Definitions" in the title.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {extractedDefinitions.map((def) => (
                      <div
                        key={def.term}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          def.alreadyExists ? 'bg-muted/50 opacity-60' : 'bg-background'
                        }`}
                      >
                        {!def.alreadyExists && (
                          <Checkbox
                            checked={selectedDefTerms.has(def.term)}
                            onCheckedChange={() => toggleDefSelection(def.term)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{def.term}</span>
                            {def.alreadyExists ? (
                              <Badge variant="secondary" className="text-xs">Already in glossary</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{def.definition}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminImplementingActContentPage;
