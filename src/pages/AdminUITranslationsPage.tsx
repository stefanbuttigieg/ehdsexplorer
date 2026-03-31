import { useState, useMemo } from "react";
import { Search, Globe, Wand2, Save, Download, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useLanguages } from "@/hooks/useLanguages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Default English UI strings to seed
const DEFAULT_UI_KEYS: Array<{ key: string; value: string; context: string }> = [
  // Navigation
  { key: "nav.home", value: "Home", context: "sidebar" },
  { key: "nav.overview", value: "Overview", context: "sidebar" },
  { key: "nav.definitions", value: "Definitions", context: "sidebar" },
  { key: "nav.articles", value: "Articles", context: "sidebar" },
  { key: "nav.recitals", value: "Recitals", context: "sidebar" },
  { key: "nav.annexes", value: "Annexes", context: "sidebar" },
  { key: "nav.implementing_acts", value: "Implementing Acts", context: "sidebar" },
  { key: "nav.country_map", value: "EHDS Country Map", context: "sidebar" },
  { key: "nav.regulatory_map", value: "Regulatory Map", context: "sidebar" },
  { key: "nav.article_dependencies", value: "Article Dependencies", context: "sidebar" },
  { key: "nav.content_network", value: "Content Network", context: "sidebar" },
  { key: "nav.for_citizens", value: "For Citizens", context: "sidebar" },
  { key: "nav.for_healthtech", value: "For Health Tech", context: "sidebar" },
  { key: "nav.for_healthcare", value: "For Healthcare Pros", context: "sidebar" },
  { key: "nav.topic_index", value: "Topic Index", context: "sidebar" },
  { key: "nav.tools_hub", value: "Tools Hub", context: "sidebar" },
  { key: "nav.scenario_finder", value: "Scenario Finder", context: "sidebar" },
  { key: "nav.news", value: "News", context: "sidebar" },
  { key: "nav.faqs", value: "Official FAQs", context: "sidebar" },
  { key: "nav.bookmarks", value: "Bookmarks", context: "sidebar" },
  { key: "nav.notes", value: "Notes", context: "sidebar" },
  { key: "nav.achievements", value: "Achievements", context: "sidebar" },
  { key: "nav.compare", value: "Compare", context: "sidebar" },
  { key: "nav.leaderboard", value: "Leaderboard", context: "sidebar" },
  { key: "nav.games", value: "Games", context: "sidebar" },
  { key: "nav.chapters", value: "Chapters", context: "sidebar" },
  { key: "nav.help_center", value: "Help Center", context: "sidebar" },
  { key: "nav.api_docs", value: "API Documentation", context: "sidebar" },
  // Legal
  { key: "nav.privacy_policy", value: "Privacy Policy", context: "legal" },
  { key: "nav.cookie_policy", value: "Cookie Policy", context: "legal" },
  { key: "nav.terms_of_service", value: "Terms of Service", context: "legal" },
  { key: "nav.accessibility", value: "Accessibility Statement", context: "legal" },
  // Common UI
  { key: "ui.search", value: "Search", context: "common" },
  { key: "ui.search_placeholder", value: "Search articles, recitals, definitions...", context: "common" },
  { key: "ui.loading", value: "Loading...", context: "common" },
  { key: "ui.save", value: "Save", context: "common" },
  { key: "ui.cancel", value: "Cancel", context: "common" },
  { key: "ui.delete", value: "Delete", context: "common" },
  { key: "ui.edit", value: "Edit", context: "common" },
  { key: "ui.close", value: "Close", context: "common" },
  { key: "ui.back", value: "Back", context: "common" },
  { key: "ui.next", value: "Next", context: "common" },
  { key: "ui.previous", value: "Previous", context: "common" },
  { key: "ui.read_more", value: "Read more", context: "common" },
  { key: "ui.show_more", value: "Show more", context: "common" },
  { key: "ui.show_less", value: "Show less", context: "common" },
  { key: "ui.no_results", value: "No results found", context: "common" },
  { key: "ui.sign_in", value: "Sign In", context: "auth" },
  { key: "ui.sign_out", value: "Sign Out", context: "auth" },
  { key: "ui.sign_up", value: "Sign Up", context: "auth" },
  { key: "ui.profile", value: "Profile", context: "auth" },
  { key: "ui.settings", value: "Settings", context: "auth" },
  // Content labels
  { key: "content.article", value: "Article", context: "content" },
  { key: "content.recital", value: "Recital", context: "content" },
  { key: "content.definition", value: "Definition", context: "content" },
  { key: "content.annex", value: "Annex", context: "content" },
  { key: "content.chapter", value: "Chapter", context: "content" },
  { key: "content.section", value: "Section", context: "content" },
  { key: "content.key_provision", value: "Key Provision", context: "content" },
  { key: "content.related_articles", value: "Related Articles", context: "content" },
  { key: "content.related_recitals", value: "Related Recitals", context: "content" },
  { key: "content.plain_language", value: "Plain Language", context: "content" },
  { key: "content.original_text", value: "Original Text", context: "content" },
  // Pages
  { key: "page.home_title", value: "EHDS Regulation Explorer", context: "page" },
  { key: "page.home_subtitle", value: "Your guide to the European Health Data Space Regulation", context: "page" },
  { key: "page.articles_title", value: "Articles", context: "page" },
  { key: "page.recitals_title", value: "Recitals", context: "page" },
  { key: "page.definitions_title", value: "Definitions", context: "page" },
  { key: "page.news_title", value: "News & Updates", context: "page" },
  { key: "page.faqs_title", value: "Official EHDS FAQs", context: "page" },
  // Actions
  { key: "action.bookmark", value: "Bookmark", context: "action" },
  { key: "action.share", value: "Share", context: "action" },
  { key: "action.print", value: "Print", context: "action" },
  { key: "action.download", value: "Download", context: "action" },
  { key: "action.copy_link", value: "Copy Link", context: "action" },
  { key: "action.report_issue", value: "Report Issue", context: "action" },
  // Accessibility
  { key: "a11y.dark_mode", value: "Dark Mode", context: "accessibility" },
  { key: "a11y.light_mode", value: "Light Mode", context: "accessibility" },
  { key: "a11y.font_size", value: "Font Size", context: "accessibility" },
  { key: "a11y.increase_font", value: "Increase Font Size", context: "accessibility" },
  { key: "a11y.decrease_font", value: "Decrease Font Size", context: "accessibility" },
];

function useUITranslations(languageCode: string) {
  return useQuery({
    queryKey: ["ui-translations", languageCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_translations")
        .select("*")
        .eq("language_code", languageCode);
      if (error) throw error;
      return data as Array<{
        id: string;
        key: string;
        value: string;
        language_code: string;
        context: string | null;
        is_ai_generated: boolean | null;
        created_at: string | null;
        updated_at: string | null;
      }>;
    },
    enabled: !!languageCode,
  });
}

const AdminUITranslationsPage = () => {
  const { data: languages = [] } = useLanguages();
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState("");
  const [search, setSearch] = useState("");
  const [contextFilter, setContextFilter] = useState("all");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: translations = [], isLoading } = useUITranslations(selectedLang);

  const nonEnglishLanguages = languages.filter((l) => l.code !== "en");

  const translationMap = useMemo(() => {
    const map: Record<string, typeof translations[0]> = {};
    translations.forEach((t) => (map[t.key] = t));
    return map;
  }, [translations]);

  const contexts = [...new Set(DEFAULT_UI_KEYS.map((k) => k.context))];

  const filteredKeys = DEFAULT_UI_KEYS.filter((k) => {
    if (contextFilter !== "all" && k.context !== contextFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return k.key.toLowerCase().includes(q) || k.value.toLowerCase().includes(q);
    }
    return true;
  });

  const translatedCount = DEFAULT_UI_KEYS.filter((k) => translationMap[k.key]).length;
  const progress = DEFAULT_UI_KEYS.length > 0 ? Math.round((translatedCount / DEFAULT_UI_KEYS.length) * 100) : 0;

  const seedEnglishKeys = async () => {
    setIsSeeding(true);
    try {
      const rows = DEFAULT_UI_KEYS.map((k) => ({
        key: k.key,
        language_code: "en",
        value: k.value,
        context: k.context,
        is_ai_generated: false,
      }));
      const { error } = await supabase.from("ui_translations").upsert(rows, {
        onConflict: "key,language_code",
      });
      if (error) throw error;
      toast.success(`Seeded ${rows.length} English UI keys`);
    } catch (e) {
      toast.error("Failed to seed: " + (e as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  const autoTranslate = async () => {
    if (!selectedLang) return;
    setIsTranslating(true);
    setTranslateProgress(0);

    const lang = languages.find((l) => l.code === selectedLang);
    const untranslated = DEFAULT_UI_KEYS.filter((k) => !translationMap[k.key]);
    const allKeys = untranslated.length > 0 ? untranslated : DEFAULT_UI_KEYS;

    // Batch in chunks of 30
    const chunkSize = 30;
    const chunks: typeof allKeys[] = [];
    for (let i = 0; i < allKeys.length; i += chunkSize) {
      chunks.push(allKeys.slice(i, i + chunkSize));
    }

    let totalTranslated = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("translate-ui-strings", {
          body: {
            targetLanguage: selectedLang,
            targetLanguageName: lang?.name || selectedLang,
            keys: chunks[i].map((k) => ({ key: k.key, value: k.value })),
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        totalTranslated += data?.translated || 0;
      } catch (e) {
        toast.error(`Batch ${i + 1} failed: ${(e as Error).message}`);
      }

      setTranslateProgress(Math.round(((i + 1) / chunks.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: ["ui-translations", selectedLang] });
    toast.success(`Auto-translated ${totalTranslated} UI strings to ${lang?.name || selectedLang}`);
    setIsTranslating(false);
  };

  const autoTranslateAll = async () => {
    setIsTranslating(true);
    setTranslateProgress(0);

    const targetLangs = nonEnglishLanguages.filter((l) => l.is_active);
    for (let li = 0; li < targetLangs.length; li++) {
      const lang = targetLangs[li];

      const chunkSize = 30;
      const chunks: typeof DEFAULT_UI_KEYS[] = [];
      for (let i = 0; i < DEFAULT_UI_KEYS.length; i += chunkSize) {
        chunks.push(DEFAULT_UI_KEYS.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        try {
          await supabase.functions.invoke("translate-ui-strings", {
            body: {
              targetLanguage: lang.code,
              targetLanguageName: lang.name,
              keys: chunks[i].map((k) => ({ key: k.key, value: k.value })),
            },
          });
        } catch (e) {
          console.error(`Failed for ${lang.code} batch ${i + 1}:`, e);
        }
      }

      setTranslateProgress(Math.round(((li + 1) / targetLangs.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: ["ui-translations"] });
    toast.success(`Auto-translated UI strings for ${targetLangs.length} languages`);
    setIsTranslating(false);
  };

  const saveEdited = async () => {
    if (Object.keys(editedValues).length === 0) return;
    setIsSaving(true);

    const rows = Object.entries(editedValues).map(([key, value]) => ({
      key,
      language_code: selectedLang,
      value,
      is_ai_generated: false,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("ui_translations").upsert(rows, {
      onConflict: "key,language_code",
    });

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(`Saved ${rows.length} translations`);
      setEditedValues({});
      queryClient.invalidateQueries({ queryKey: ["ui-translations", selectedLang] });
    }
    setIsSaving(false);
  };

  const exportTranslations = () => {
    const data = DEFAULT_UI_KEYS.map((k) => ({
      key: k.key,
      english: k.value,
      translated: translationMap[k.key]?.value || "",
      context: k.context,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ui-translations-${selectedLang || "en"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasEdits = Object.keys(editedValues).length > 0;

  return (
    <AdminPageLayout
      title="UI Translations"
      description="Manage translations for all user interface elements — menus, buttons, labels, and tooltips"
    >
      <div className="space-y-4">
        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={seedEnglishKeys} disabled={isSeeding}>
              {isSeeding ? "Seeding..." : "Seed English Keys"}
            </Button>
            <Button variant="outline" size="sm" onClick={autoTranslateAll} disabled={isTranslating}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Translate All Languages
            </Button>
          </div>
        </div>

        {/* Language selector + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select target language..." />
            </SelectTrigger>
            <SelectContent>
              {nonEnglishLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="flex items-center gap-2">
                    {l.name}
                    {!l.is_active && (
                      <Badge variant="outline" className="text-[10px]">inactive</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys or values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={contextFilter} onValueChange={setContextFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contexts</SelectItem>
              {contexts.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLang && (
          <>
            {/* Progress bar */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {translatedCount} / {DEFAULT_UI_KEYS.length} translated ({progress}%)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={autoTranslate}
                      disabled={isTranslating}
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      {isTranslating ? `Translating... ${translateProgress}%` : "Auto-Translate"}
                    </Button>
                    {hasEdits && (
                      <Button size="sm" onClick={saveEdited} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "Saving..." : `Save ${Object.keys(editedValues).length} Changes`}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={exportTranslations}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                {isTranslating && (
                  <Progress value={translateProgress} className="h-1 mt-1" />
                )}
              </CardContent>
            </Card>

            {/* Translation table */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Key</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>Translation</TableHead>
                      <TableHead className="w-24">Context</TableHead>
                      <TableHead className="w-16">AI</TableHead>
                      <TableHead className="w-16">IATE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.map((k) => {
                      const existing = translationMap[k.key];
                      const editedValue = editedValues[k.key];
                      const currentValue = editedValue !== undefined ? editedValue : (existing?.value || "");

                      return (
                        <TableRow key={k.key}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {k.key}
                          </TableCell>
                          <TableCell className="text-sm">{k.value}</TableCell>
                          <TableCell>
                            <Input
                              value={currentValue}
                              onChange={(e) =>
                                setEditedValues((p) => ({
                                  ...p,
                                  [k.key]: e.target.value,
                                }))
                              }
                              placeholder={`Translate to ${languages.find((l) => l.code === selectedLang)?.name || selectedLang}...`}
                              className={!existing ? "border-dashed border-amber-400/50" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {k.context}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {existing?.is_ai_generated && (
                              <Badge variant="secondary" className="text-[10px]">
                                AI
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`https://iate.europa.eu/search/standard/result?source=en&target=${selectedLang}&query=${encodeURIComponent(k.value)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Look up "${k.value}" in IATE`}
                              className="text-primary hover:underline text-xs"
                            >
                              IATE
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {!selectedLang && (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a target language to manage UI translations</p>
              <p className="text-sm text-muted-foreground mt-2">
                Use "Seed English Keys" first to populate the base translation keys, then select a language and click "Auto-Translate" to generate AI translations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminUITranslationsPage;
