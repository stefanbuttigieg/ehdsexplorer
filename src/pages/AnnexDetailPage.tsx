import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getAnnexById } from "@/data/annexes";
import { getArticleById } from "@/data/articles";
import { ChevronLeft, FileText, Link as LinkIcon, Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import Layout from "@/components/Layout";

const AnnexDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const annex = getAnnexById(id || "");
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!annex) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Annex not found</h2>
          <Link to="/annexes">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Annexes
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const bookmarked = isBookmarked('annex', annex.id);

  return (
    <Layout>
      <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/annexes" className="hover:text-foreground">Annexes</Link>
        <span>/</span>
        <span className="text-foreground">Annex {annex.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
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

      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{annex.description}</p>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {annex.sections.map((section, index) => (
              <AccordionItem key={index} value={`section-${index}`}>
                <AccordionTrigger className="text-left">
                  <span className="font-medium">{section.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      {section.content}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Related Articles */}
      {annex.relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Related Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {annex.relatedArticles.map((articleId) => {
                const article = getArticleById(articleId);
                return (
                  <Link key={articleId} to={`/article/${articleId}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                      Art. {articleId}{article ? `: ${article.title}` : ""}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
