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

type ContentType = "recitals" | "articles" | "definitions" | "annexes";

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
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${parsed.length} ${contentType}`,
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
