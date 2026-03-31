import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Globe, Wand2, Save, Download, RefreshCw, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useLanguages } from "@/hooks/useLanguages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Comprehensive English UI strings — the single source of truth
const DEFAULT_UI_KEYS: Array<{ key: string; value: string; context: string }> = [
  // Navigation — sidebar
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
  { key: "nav.search", value: "Search", context: "sidebar" },
  { key: "nav.kids_corner", value: "Kids' Corner", context: "sidebar" },
  { key: "nav.teams", value: "Teams", context: "sidebar" },
  { key: "nav.profile", value: "Profile", context: "sidebar" },
  { key: "nav.cross_regulation", value: "Cross-Regulation Map", context: "sidebar" },
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
  { key: "ui.filter", value: "Filter", context: "common" },
  { key: "ui.sort", value: "Sort", context: "common" },
  { key: "ui.reset", value: "Reset", context: "common" },
  { key: "ui.confirm", value: "Confirm", context: "common" },
  { key: "ui.select_all", value: "Select All", context: "common" },
  { key: "ui.deselect_all", value: "Deselect All", context: "common" },
  { key: "ui.expand", value: "Expand", context: "common" },
  { key: "ui.collapse", value: "Collapse", context: "common" },
  { key: "ui.view_all", value: "View All", context: "common" },
  // Auth
  { key: "ui.sign_in", value: "Sign In", context: "auth" },
  { key: "ui.sign_out", value: "Sign Out", context: "auth" },
  { key: "ui.sign_up", value: "Sign Up", context: "auth" },
  { key: "ui.profile", value: "Profile", context: "auth" },
  { key: "ui.settings", value: "Settings", context: "auth" },
  { key: "ui.forgot_password", value: "Forgot Password?", context: "auth" },
  { key: "ui.reset_password", value: "Reset Password", context: "auth" },
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
  { key: "content.implementing_act", value: "Implementing Act", context: "content" },
  { key: "content.delegated_act", value: "Delegated Act", context: "content" },
  { key: "content.footnote", value: "Footnote", context: "content" },
  { key: "content.cross_reference", value: "Cross-Reference", context: "content" },
  // Pages
  { key: "page.home_title", value: "EHDS Regulation Explorer", context: "page" },
  { key: "page.home_subtitle", value: "Your guide to the European Health Data Space Regulation", context: "page" },
  { key: "page.articles_title", value: "Articles", context: "page" },
  { key: "page.recitals_title", value: "Recitals", context: "page" },
  { key: "page.definitions_title", value: "Definitions", context: "page" },
  { key: "page.news_title", value: "News & Updates", context: "page" },
  { key: "page.faqs_title", value: "Official EHDS FAQs", context: "page" },
  { key: "page.overview_title", value: "EHDS Overview", context: "page" },
  { key: "page.annexes_title", value: "Annexes", context: "page" },
  { key: "page.implementing_acts_title", value: "Implementing & Delegated Acts", context: "page" },
  { key: "page.tools_hub_title", value: "Tools Hub", context: "page" },
  { key: "page.leaderboard_title", value: "Implementation Leaderboard", context: "page" },
  { key: "page.country_map_title", value: "EHDS Country Map", context: "page" },
  { key: "page.for_citizens_title", value: "EHDS for Citizens", context: "page" },
  { key: "page.for_healthtech_title", value: "EHDS for Health Tech", context: "page" },
  { key: "page.for_healthcare_title", value: "EHDS for Healthcare Professionals", context: "page" },
  { key: "page.games_title", value: "Learning Games", context: "page" },
  // Actions
  { key: "action.bookmark", value: "Bookmark", context: "action" },
  { key: "action.share", value: "Share", context: "action" },
  { key: "action.print", value: "Print", context: "action" },
  { key: "action.download", value: "Download", context: "action" },
  { key: "action.copy_link", value: "Copy Link", context: "action" },
  { key: "action.report_issue", value: "Report Issue", context: "action" },
  { key: "action.compare", value: "Compare", context: "action" },
  { key: "action.subscribe", value: "Subscribe", context: "action" },
  { key: "action.unsubscribe", value: "Unsubscribe", context: "action" },
  { key: "action.export", value: "Export", context: "action" },
  // Accessibility
  { key: "a11y.dark_mode", value: "Dark Mode", context: "accessibility" },
  { key: "a11y.light_mode", value: "Light Mode", context: "accessibility" },
  { key: "a11y.font_size", value: "Font Size", context: "accessibility" },
  { key: "a11y.increase_font", value: "Increase Font Size", context: "accessibility" },
  { key: "a11y.decrease_font", value: "Decrease Font Size", context: "accessibility" },
  { key: "a11y.high_contrast", value: "High Contrast", context: "accessibility" },
  // EHDS-specific terminology
  { key: "ehds.primary_use", value: "Primary Use of Health Data", context: "ehds" },
  { key: "ehds.secondary_use", value: "Secondary Use of Health Data", context: "ehds" },
  { key: "ehds.data_holder", value: "Data Holder", context: "ehds" },
  { key: "ehds.data_user", value: "Data User", context: "ehds" },
  { key: "ehds.data_permit", value: "Data Permit", context: "ehds" },
  { key: "ehds.data_request", value: "Data Request", context: "ehds" },
  { key: "ehds.health_data_access_body", value: "Health Data Access Body", context: "ehds" },
  { key: "ehds.digital_health_authority", value: "Digital Health Authority", context: "ehds" },
  { key: "ehds.electronic_health_record", value: "Electronic Health Record", context: "ehds" },
  { key: "ehds.ehr_system", value: "EHR System", context: "ehds" },
  { key: "ehds.myhealth_at_eu", value: "MyHealth@EU", context: "ehds" },
  { key: "ehds.healthdata_at_eu", value: "HealthData@EU", context: "ehds" },
  { key: "ehds.interoperability", value: "Interoperability", context: "ehds" },
  { key: "ehds.data_quality", value: "Data Quality", context: "ehds" },
  { key: "ehds.data_minimisation", value: "Data Minimisation", context: "ehds" },
  { key: "ehds.secure_processing_environment", value: "Secure Processing Environment", context: "ehds" },
  { key: "ehds.natural_person", value: "Natural Person", context: "ehds" },
  { key: "ehds.member_state", value: "Member State", context: "ehds" },
  { key: "ehds.european_commission", value: "European Commission", context: "ehds" },
  { key: "ehds.comitology", value: "Comitology", context: "ehds" },
  // Status labels
  { key: "status.not_started", value: "Not Started", context: "status" },
  { key: "status.in_progress", value: "In Progress", context: "status" },
  { key: "status.completed", value: "Completed", context: "status" },
  { key: "status.partial", value: "Partial", context: "status" },
  { key: "status.active", value: "Active", context: "status" },
  { key: "status.inactive", value: "Inactive", context: "status" },
  { key: "status.pending", value: "Pending", context: "status" },
  { key: "status.planned", value: "Planned", context: "status" },
  { key: "status.adopted", value: "Adopted", context: "status" },
  { key: "status.draft", value: "Draft", context: "status" },
];

type UITranslation = {
  id: string;
  key: string;
  value: string;
  language_code: string;
  context: string | null;
  is_ai_generated: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function useUITranslations(languageCode: string) {
  return useQuery({
    queryKey: ["ui-translations", languageCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_translations")
        .select("*")
        .eq("language_code", languageCode);
      if (error) throw error;
      return data as UITranslation[];
    },
    enabled: !!languageCode,
  });
}

const AdminUITranslationsPage = () => {
  const { data: languages = [] } = useLanguages();
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState("en");
  const [search, setSearch] = useState("");
  const [contextFilter, setContextFilter] = useState("all");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", value: "", context: "common" });
  const autoSyncedRef = useRef(false);

  const { data: translations = [], isLoading } = useUITranslations(selectedLang);
  const { data: englishTranslations = [] } = useUITranslations("en");

  const allLanguages = languages;
  const nonEnglishLanguages = languages.filter((l) => l.code !== "en");

  // Auto-sync: seed new keys on page load
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;

    const syncKeys = async () => {
      // Fetch existing English keys
      const { data: existing } = await supabase
        .from("ui_translations")
        .select("key")
        .eq("language_code", "en");

      const existingKeys = new Set((existing || []).map((r: any) => r.key));
      const newKeys = DEFAULT_UI_KEYS.filter((k) => !existingKeys.has(k.key));

      if (newKeys.length === 0) return;

      const rows = newKeys.map((k) => ({
        key: k.key,
        language_code: "en",
        value: k.value,
        context: k.context,
        is_ai_generated: false,
      }));

      const { error } = await supabase.from("ui_translations").upsert(rows, {
        onConflict: "key,language_code",
      });

      if (!error) {
        toast.success(`Auto-synced ${newKeys.length} new UI keys`);
        queryClient.invalidateQueries({ queryKey: ["ui-translations", "en"] });
      }
    };

    syncKeys();
  }, [queryClient]);

  const englishMap = useMemo(() => {
    const map: Record<string, UITranslation> = {};
    englishTranslations.forEach((t) => (map[t.key] = t));
    return map;
  }, [englishTranslations]);

  const translationMap = useMemo(() => {
    const map: Record<string, UITranslation> = {};
    translations.forEach((t) => (map[t.key] = t));
    return map;
  }, [translations]);

  // Merge: all DEFAULT keys + any DB-only keys
  const allKeys = useMemo(() => {
    const keySet = new Set(DEFAULT_UI_KEYS.map((k) => k.key));
    const merged = [...DEFAULT_UI_KEYS];
    // Add any keys from DB that aren't in the default list
    englishTranslations.forEach((t) => {
      if (!keySet.has(t.key)) {
        merged.push({ key: t.key, value: t.value, context: t.context || "custom" });
        keySet.add(t.key);
      }
    });
    return merged;
  }, [englishTranslations]);

  const contexts = [...new Set(allKeys.map((k) => k.context))].sort();

  const filteredKeys = allKeys.filter((k) => {
    if (contextFilter !== "all" && k.context !== contextFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return k.key.toLowerCase().includes(q) || k.value.toLowerCase().includes(q);
    }
    return true;
  });

  const isEnglish = selectedLang === "en";
  const translatedCount = allKeys.filter((k) => translationMap[k.key]).length;
  const progress = allKeys.length > 0 ? Math.round((translatedCount / allKeys.length) * 100) : 0;

  const autoTranslate = async () => {
    if (!selectedLang || isEnglish) return;
    setIsTranslating(true);
    setTranslateProgress(0);

    const lang = languages.find((l) => l.code === selectedLang);
    const untranslated = allKeys.filter((k) => !translationMap[k.key]);
    const keysToTranslate = untranslated.length > 0 ? untranslated : allKeys;

    const chunkSize = 30;
    const chunks: typeof keysToTranslate[] = [];
    for (let i = 0; i < keysToTranslate.length; i += chunkSize) {
      chunks.push(keysToTranslate.slice(i, i + chunkSize));
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
      for (let i = 0; i < allKeys.length; i += chunkSize) {
        chunks.push(allKeys.slice(i, i + chunkSize));
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
      context: allKeys.find((k) => k.key === key)?.context || "common",
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

  const addCustomKey = async () => {
    if (!newKey.key || !newKey.value) return;
    const { error } = await supabase.from("ui_translations").upsert([{
      key: newKey.key,
      language_code: "en",
      value: newKey.value,
      context: newKey.context,
      is_ai_generated: false,
    }], { onConflict: "key,language_code" });

    if (error) {
      toast.error("Failed to add key: " + error.message);
    } else {
      toast.success(`Added key: ${newKey.key}`);
      setNewKey({ key: "", value: "", context: "common" });
      setShowAddKey(false);
      queryClient.invalidateQueries({ queryKey: ["ui-translations", "en"] });
    }
  };

  const exportTranslations = () => {
    const data = allKeys.map((k) => ({
      key: k.key,
      english: k.value,
      translated: isEnglish ? (translationMap[k.key]?.value || k.value) : (translationMap[k.key]?.value || ""),
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{allKeys.length} keys</Badge>
            {!isEnglish && (
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {translatedCount}/{allKeys.length} translated
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowAddKey(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Key
            </Button>
            {!isEnglish && (
              <Button variant="outline" size="sm" onClick={autoTranslateAll} disabled={isTranslating}>
                <Wand2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Auto-Translate All</span>
                <span className="sm:hidden">All</span>
              </Button>
            )}
          </div>
        </div>

        {/* Language selector + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedLang} onValueChange={(v) => { setSelectedLang(v); setEditedValues({}); }}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select language..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <span className="flex items-center gap-2 font-medium">
                  🇬🇧 English (Source)
                </span>
              </SelectItem>
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

        {/* Progress bar (non-English only) */}
        {!isEnglish && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium">
                  {translatedCount} / {allKeys.length} translated ({progress}%)
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={autoTranslate} disabled={isTranslating}>
                    <Wand2 className="h-4 w-4 mr-1" />
                    {isTranslating ? `${translateProgress}%` : "Auto-Translate"}
                  </Button>
                  {hasEdits && (
                    <Button size="sm" onClick={saveEdited} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : `Save ${Object.keys(editedValues).length}`}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={exportTranslations}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              {isTranslating && <Progress value={translateProgress} className="h-1 mt-1" />}
            </CardContent>
          </Card>
        )}

        {/* English mode: save/export bar */}
        {isEnglish && (
          <div className="flex gap-2 justify-end">
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
        )}

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
                  <TableHead className="w-48 min-w-[120px]">Key</TableHead>
                  {!isEnglish && <TableHead className="min-w-[140px]">English</TableHead>}
                  <TableHead className="min-w-[200px]">{isEnglish ? "Value (Editable)" : "Translation"}</TableHead>
                  <TableHead className="w-20">Context</TableHead>
                  {!isEnglish && <TableHead className="w-12">AI</TableHead>}
                  {!isEnglish && <TableHead className="w-12">IATE</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((k) => {
                  const existing = translationMap[k.key];
                  const editedValue = editedValues[k.key];

                  if (isEnglish) {
                    const currentValue = editedValue !== undefined ? editedValue : (existing?.value || k.value);
                    return (
                      <TableRow key={k.key}>
                        <TableCell className="font-mono text-xs text-muted-foreground break-all">
                          {k.key}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={currentValue}
                            onChange={(e) =>
                              setEditedValues((p) => ({ ...p, [k.key]: e.target.value }))
                            }
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{k.context}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const currentValue = editedValue !== undefined ? editedValue : (existing?.value || "");
                  return (
                    <TableRow key={k.key}>
                      <TableCell className="font-mono text-xs text-muted-foreground break-all">
                        {k.key}
                      </TableCell>
                      <TableCell className="text-sm">{k.value}</TableCell>
                      <TableCell>
                        <Input
                          value={currentValue}
                          onChange={(e) =>
                            setEditedValues((p) => ({ ...p, [k.key]: e.target.value }))
                          }
                          placeholder={`Translate to ${languages.find((l) => l.code === selectedLang)?.name || selectedLang}...`}
                          className={!existing ? "border-dashed border-amber-400/50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{k.context}</Badge>
                      </TableCell>
                      <TableCell>
                        {existing?.is_ai_generated && (
                          <Badge variant="secondary" className="text-[10px]">AI</Badge>
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
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Custom Key Dialog */}
      <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom UI Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Key (e.g. nav.new_page)</Label>
              <Input
                value={newKey.key}
                onChange={(e) => setNewKey((p) => ({ ...p, key: e.target.value }))}
                placeholder="section.key_name"
              />
            </div>
            <div>
              <Label>English Value</Label>
              <Input
                value={newKey.value}
                onChange={(e) => setNewKey((p) => ({ ...p, value: e.target.value }))}
                placeholder="Display text in English"
              />
            </div>
            <div>
              <Label>Context</Label>
              <Select value={newKey.context} onValueChange={(v) => setNewKey((p) => ({ ...p, context: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="custom">custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKey(false)}>Cancel</Button>
            <Button onClick={addCustomKey} disabled={!newKey.key || !newKey.value}>Add Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminUITranslationsPage;
