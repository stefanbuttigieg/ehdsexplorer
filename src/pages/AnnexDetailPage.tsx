import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnex } from "@/hooks/useAnnexes";
import { ChevronLeft, FileText, Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// Ensure markdown tables parse: blank line before a table, and a divider row after the header if missing.
const fixTables = (text: string): string => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isDivider = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const prev = out[out.length - 1];
    if (isRow(l) && (prev === undefined || !isRow(prev))) {
      if (prev !== undefined && prev.trim() !== "") out.push("");
      out.push(l);
      const next = lines[i + 1];
      if (next === undefined || !isDivider(next)) {
        const cols = l.trim().replace(/^\||\|$/g, "").split("|").length;
        out.push("|" + Array(cols).fill(" --- ").join("|") + "|");
      }
      continue;
    }
    if (prev !== undefined && isRow(prev) && !isRow(l) && !isDivider(l) && l.trim() !== "") out.push("");
    out.push(l);
  }
  return out.join("\n");
};

const AnnexDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: annex, isLoading } = useAnnex(id || "");
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!annex) {
    return (
      <Layout>
        <div className="p-6">
          <Breadcrumbs items={[{ label: "Annexes", href: "/annexes" }, { label: "Not Found" }]} />
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Annex not found</h2>
            <Link to="/annexes">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Annexes
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const bookmarked = isBookmarked('annex', annex.id);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <Breadcrumbs items={[{ label: "Annexes", href: "/annexes" }, { label: `Annex ${annex.id}` }]} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Annex {annex.id}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                {annex.title}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleBookmark('annex', annex.id)}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  table: ({ children }) => (
                    <div className="not-prose my-4 w-full overflow-x-auto rounded-md border border-border">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-2 text-left align-top font-semibold text-foreground">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2 align-top text-foreground">{children}</td>
                  ),
                }}
              >
                {fixTables(annex.content)}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-start pt-4">
          <Link to="/annexes">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Annexes
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AnnexDetailPage;
