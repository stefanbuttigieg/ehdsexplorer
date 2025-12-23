import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ContentType = "recitals" | "articles" | "definitions" | "annexes" | "joint_action_deliverables" | "published_works" | "footnotes" | "ia_recitals" | "ia_articles" | "ia_sections";

interface RecitalImport {
  recital_number: number;
  content: string;
  related_articles?: number[];
}

interface ArticleImport {
  article_number: number;
  title: string;
  content: string;
  chapter_id?: number;
}

interface DefinitionImport {
  term: string;
  definition: string;
  source_article?: number;
}

interface AnnexImport {
  id: string;
  title: string;
  content: string;
}

interface JointActionDeliverableImport {
  joint_action_name: string;
  deliverable_name: string;
  deliverable_link: string;
  related_articles?: number[];
  related_implementing_acts?: string[];
}

interface PublishedWorkImport {
  name: string;
  link: string;
  affiliated_organization: string;
  related_articles?: number[];
  related_implementing_acts?: string[];
}

interface FootnoteImport {
  marker: string;
  content: string;
  article_id?: number;
  recital_id?: number;
}

interface IARecitalImport {
  implementing_act_id: string;
  recital_number: number;
  content: string;
}

interface IAArticleImport {
  implementing_act_id: string;
  article_number: number;
  title: string;
  content: string;
  section_id?: string;
}

interface IASectionImport {
  implementing_act_id: string;
  section_number: number;
  title: string;
}

export default function AdminBulkImportPage() {
  const { user, isEditor, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentType, setContentType] = useState<ContentType>("recitals");
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (loading) {
    return <Layout><div className="flex items-center justify-center h-64">Loading...</div></Layout>;
  }

  if (!user || !isEditor) {
    navigate("/admin/auth");
    return null;
  }

  const validateData = () => {
    setValidationError(null);
    setPreviewData([]);
    
    if (!jsonData.trim()) {
      setValidationError("Please enter JSON data");
      return false;
    }

    try {
      const parsed = JSON.parse(jsonData);
      
      if (!Array.isArray(parsed)) {
        setValidationError("Data must be an array of objects");
        return false;
      }

      if (parsed.length === 0) {
        setValidationError("Array cannot be empty");
        return false;
      }

      // Validate based on content type
      switch (contentType) {
        case "recitals":
          for (const item of parsed) {
            if (typeof item.recital_number !== "number" || !item.content) {
              setValidationError("Each recital must have 'recital_number' (number) and 'content' (string)");
              return false;
            }
          }
          break;
        case "articles":
          for (const item of parsed) {
            if (typeof item.article_number !== "number" || !item.title || !item.content) {
              setValidationError("Each article must have 'article_number' (number), 'title' (string), and 'content' (string)");
              return false;
            }
          }
          break;
        case "definitions":
          for (const item of parsed) {
            if (!item.term || !item.definition) {
              setValidationError("Each definition must have 'term' (string) and 'definition' (string)");
              return false;
            }
          }
          break;
        case "annexes":
          for (const item of parsed) {
            if (!item.id || !item.title || !item.content) {
              setValidationError("Each annex must have 'id' (string), 'title' (string), and 'content' (string)");
              return false;
            }
          }
          break;
        case "joint_action_deliverables":
          for (const item of parsed) {
            if (!item.joint_action_name || !item.deliverable_name || !item.deliverable_link) {
              setValidationError("Each deliverable must have 'joint_action_name', 'deliverable_name', and 'deliverable_link'");
              return false;
            }
          }
          break;
        case "published_works":
          for (const item of parsed) {
            if (!item.name || !item.link || !item.affiliated_organization) {
              setValidationError("Each published work must have 'name', 'link', and 'affiliated_organization'");
              return false;
            }
          }
          break;
        case "footnotes":
          for (const item of parsed) {
            if (!item.marker || !item.content) {
              setValidationError("Each footnote must have 'marker' and 'content'");
              return false;
            }
          }
          break;
        case "ia_recitals":
          for (const item of parsed) {
            if (!item.implementing_act_id || typeof item.recital_number !== "number" || !item.content) {
              setValidationError("Each IA recital must have 'implementing_act_id', 'recital_number' (number), and 'content'");
              return false;
            }
          }
          break;
        case "ia_articles":
          for (const item of parsed) {
            if (!item.implementing_act_id || typeof item.article_number !== "number" || !item.title || !item.content) {
              setValidationError("Each IA article must have 'implementing_act_id', 'article_number' (number), 'title', and 'content'");
              return false;
            }
          }
          break;
        case "ia_sections":
          for (const item of parsed) {
            if (!item.implementing_act_id || typeof item.section_number !== "number" || !item.title) {
              setValidationError("Each IA section must have 'implementing_act_id', 'section_number' (number), and 'title'");
              return false;
            }
          }
          break;
      }

      setPreviewData(parsed.slice(0, 5));
      return true;
    } catch (e) {
      setValidationError(`Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`);
      return false;
    }
  };

  const handleImport = async () => {
    if (!validateData()) return;

    setIsImporting(true);
    try {
      const parsed = JSON.parse(jsonData);
      
      switch (contentType) {
        case "recitals":
          const recitals = parsed as RecitalImport[];
          // Delete existing recitals first
          await supabase.from("recitals").delete().neq("id", 0);
          // Insert new recitals
          const { error: recitalError } = await supabase.from("recitals").insert(
            recitals.map(r => ({
              recital_number: r.recital_number,
              content: r.content,
              related_articles: r.related_articles || []
            }))
          );
          if (recitalError) throw recitalError;
          break;
          
        case "articles":
          const articles = parsed as ArticleImport[];
          await supabase.from("articles").delete().neq("id", 0);
          const { error: articleError } = await supabase.from("articles").insert(
            articles.map(a => ({
              article_number: a.article_number,
              title: a.title,
              content: a.content,
              chapter_id: a.chapter_id || null
            }))
          );
          if (articleError) throw articleError;
          break;
          
        case "definitions":
          const definitions = parsed as DefinitionImport[];
          await supabase.from("definitions").delete().neq("id", 0);
          const { error: defError } = await supabase.from("definitions").insert(
            definitions.map(d => ({
              term: d.term,
              definition: d.definition,
              source_article: d.source_article || null
            }))
          );
          if (defError) throw defError;
          break;
          
        case "annexes":
          const annexes = parsed as AnnexImport[];
          await supabase.from("annexes").delete().neq("id", "");
          const { error: annexError } = await supabase.from("annexes").insert(
            annexes.map(a => ({
              id: a.id,
              title: a.title,
              content: a.content
            }))
          );
          if (annexError) throw annexError;
          break;
          
        case "joint_action_deliverables":
          const deliverables = parsed as JointActionDeliverableImport[];
          await supabase.from("joint_action_deliverables").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          const { error: jadError } = await supabase.from("joint_action_deliverables").insert(
            deliverables.map(d => ({
              joint_action_name: d.joint_action_name,
              deliverable_name: d.deliverable_name,
              deliverable_link: d.deliverable_link,
              related_articles: d.related_articles || [],
              related_implementing_acts: d.related_implementing_acts || []
            }))
          );
          if (jadError) throw jadError;
          break;
          
        case "published_works":
          const works = parsed as PublishedWorkImport[];
          await supabase.from("published_works").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          const { error: pwError } = await supabase.from("published_works").insert(
            works.map(w => ({
              name: w.name,
              link: w.link,
              affiliated_organization: w.affiliated_organization,
              related_articles: w.related_articles || [],
              related_implementing_acts: w.related_implementing_acts || []
            }))
          );
          if (pwError) throw pwError;
          break;
          
        case "footnotes":
          const footnotes = parsed as FootnoteImport[];
          await supabase.from("footnotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          const { error: fnError } = await supabase.from("footnotes").insert(
            footnotes.map(f => ({
              marker: f.marker,
              content: f.content,
              article_id: f.article_id || null,
              recital_id: f.recital_id || null
            }))
          );
          if (fnError) throw fnError;
          break;
          
        case "ia_recitals":
          const iaRecitals = parsed as IARecitalImport[];
          // Group by implementing_act_id for targeted deletion
          const iaRecitalActIds = [...new Set(iaRecitals.map(r => r.implementing_act_id))];
          for (const actId of iaRecitalActIds) {
            await supabase.from("implementing_act_recitals").delete().eq("implementing_act_id", actId);
          }
          const { error: iaRecitalError } = await supabase.from("implementing_act_recitals").insert(
            iaRecitals.map(r => ({
              implementing_act_id: r.implementing_act_id,
              recital_number: r.recital_number,
              content: r.content
            }))
          );
          if (iaRecitalError) throw iaRecitalError;
          break;
          
        case "ia_articles":
          const iaArticles = parsed as IAArticleImport[];
          const iaArticleActIds = [...new Set(iaArticles.map(a => a.implementing_act_id))];
          for (const actId of iaArticleActIds) {
            await supabase.from("implementing_act_articles").delete().eq("implementing_act_id", actId);
          }
          const { error: iaArticleError } = await supabase.from("implementing_act_articles").insert(
            iaArticles.map(a => ({
              implementing_act_id: a.implementing_act_id,
              article_number: a.article_number,
              title: a.title,
              content: a.content,
              section_id: a.section_id || null
            }))
          );
          if (iaArticleError) throw iaArticleError;
          break;
          
        case "ia_sections":
          const iaSections = parsed as IASectionImport[];
          const iaSectionActIds = [...new Set(iaSections.map(s => s.implementing_act_id))];
          for (const actId of iaSectionActIds) {
            await supabase.from("implementing_act_sections").delete().eq("implementing_act_id", actId);
          }
          const { error: iaSectionError } = await supabase.from("implementing_act_sections").insert(
            iaSections.map(s => ({
              implementing_act_id: s.implementing_act_id,
              section_number: s.section_number,
              title: s.title
            }))
          );
          if (iaSectionError) throw iaSectionError;
          break;
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${parsed.length} ${contentType.replace(/_/g, " ")}`,
      });
      
      setJsonData("");
      setPreviewData([]);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getExampleData = () => {
    switch (contentType) {
      case "recitals":
        return JSON.stringify([
          { recital_number: 1, content: "The aim of this Regulation...", related_articles: [1] },
          { recital_number: 2, content: "The COVID-19 pandemic...", related_articles: [1, 2] }
        ], null, 2);
      case "articles":
        return JSON.stringify([
          { article_number: 1, title: "Subject matter", content: "This Regulation establishes...", chapter_id: 1 }
        ], null, 2);
      case "definitions":
        return JSON.stringify([
          { term: "electronic health data", definition: "Data concerning health...", source_article: 2 }
        ], null, 2);
      case "annexes":
        return JSON.stringify([
          { id: "I", title: "Annex I - Priority Categories", content: "The priority categories..." }
        ], null, 2);
      case "joint_action_deliverables":
        return JSON.stringify([
          { 
            joint_action_name: "TEHDAS", 
            deliverable_name: "Guidelines on Secondary Use", 
            deliverable_link: "https://example.com/guideline.pdf",
            related_articles: [33, 34],
            related_implementing_acts: ["art-5-1"]
          }
        ], null, 2);
      case "published_works":
        return JSON.stringify([
          { 
            name: "EHDS Implementation Guide", 
            link: "https://example.com/guide.pdf",
            affiliated_organization: "European Commission",
            related_articles: [1, 2],
            related_implementing_acts: ["art-5-1"]
          }
        ], null, 2);
      case "footnotes":
        return JSON.stringify([
          { 
            marker: "(1)", 
            content: "OJ L 119, 4.5.2016, p. 1.",
            article_id: 1
          }
        ], null, 2);
      case "ia_recitals":
        return JSON.stringify([
          { 
            implementing_act_id: "art-5-1",
            recital_number: 1, 
            content: "Whereas the implementation of..."
          }
        ], null, 2);
      case "ia_articles":
        return JSON.stringify([
          { 
            implementing_act_id: "art-5-1",
            article_number: 1, 
            title: "Subject matter and scope",
            content: "This implementing act establishes...",
            section_id: null
          }
        ], null, 2);
      case "ia_sections":
        return JSON.stringify([
          { 
            implementing_act_id: "art-5-1",
            section_number: 1, 
            title: "General provisions"
          }
        ], null, 2);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import content from JSON data. This will replace all existing data of the selected type.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Settings
            </CardTitle>
            <CardDescription>
              Select the content type and paste your JSON data below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recitals">Recitals</SelectItem>
                  <SelectItem value="articles">Articles</SelectItem>
                  <SelectItem value="definitions">Definitions</SelectItem>
                  <SelectItem value="annexes">Annexes</SelectItem>
                  <SelectItem value="joint_action_deliverables">Joint Action Deliverables</SelectItem>
                  <SelectItem value="published_works">Published Works</SelectItem>
                  <SelectItem value="footnotes">Footnotes</SelectItem>
                  <SelectItem value="ia_recitals">IA Recitals</SelectItem>
                  <SelectItem value="ia_articles">IA Articles</SelectItem>
                  <SelectItem value="ia_sections">IA Sections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>JSON Data</Label>
              <Textarea
                placeholder="Paste your JSON array here..."
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={validateData}>
                Validate Data
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {previewData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview (First 5 items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Example Format</CardTitle>
            <CardDescription>
              Expected JSON format for {contentType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {getExampleData()}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
