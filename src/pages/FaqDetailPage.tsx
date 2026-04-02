import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, ScrollText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEOHead, BreadcrumbSchema } from "@/components/seo";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { useEhdsFaqs, useEhdsFaqFootnotes } from "@/hooks/useEhdsFaqs";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { FaqDataTableDisplay } from "@/components/FaqDataTableDisplay";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";

const FaqDetailPage = () => {
  const { id } = useParams();
  const faqNumber = parseInt(id || "1");
  const { data: faqs = [], isLoading } = useEhdsFaqs();
  const { data: implementingActs = [] } = useImplementingActs();

  const faq = faqs.find(f => f.faq_number === faqNumber);
  const { data: footnotes = [] } = useEhdsFaqFootnotes(faq ? [faq.id] : []);
  const faqFootnotes = footnotes.filter(fn => faq && fn.faq_id === faq.id);

  const prevFaq = faqs.find(f => f.faq_number === faqNumber - 1);
  const nextFaq = faqs.find(f => f.faq_number === faqNumber + 1);

  const articleLinks = (faq?.source_articles || []).filter(Boolean);
  const recitalLinks = (faq?.source_recitals || []).filter(Boolean);

  const relatedActs = useMemo(() => {
    if (!faq || articleLinks.length === 0) return [];
    const artNums = articleLinks.map(a => parseInt(a, 10)).filter(n => !isNaN(n));
    return implementingActs.filter(act =>
      act.relatedArticles.some(r => artNums.includes(r))
    );
  }, [faq, articleLinks, implementingActs]);

  const content = faq ? (faq.rich_content || faq.answer) : "";
  const processedContent = content.replace(
    /(?:see\s+)?question\s+(\d+)(?:\s+(?:below|above))?/gi,
    (match, num) => `[${match}](/faq/${num})`
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!faq) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">FAQ Not Found</h1>
          <p className="text-muted-foreground mb-4">FAQ #{faqNumber} could not be found.</p>
          <Link to="/faqs">
            <Button>View all FAQs</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={`FAQ ${faq.faq_number}: ${faq.question} | EHDS Explorer`}
        description={faq.answer.slice(0, 155)}
        url={`/faq/${faq.faq_number}`}
        keywords={["EHDS FAQ", faq.chapter, "European Health Data Space"]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "FAQs", url: "/faqs" },
          { name: `FAQ ${faq.faq_number}`, url: `/faq/${faq.faq_number}` },
        ]}
      />
      <FAQSchema items={[{ question: faq.question, answer: faq.answer }]} pageUrl={`/faq/${faq.faq_number}`} />

      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <Breadcrumbs items={[
          { label: "FAQs", href: "/faqs" },
          { label: `FAQ ${faq.faq_number}` },
        ]} />

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          {prevFaq ? (
            <Link to={`/faq/${prevFaq.faq_number}`}>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">FAQ</span> {prevFaq.faq_number}
              </Button>
            </Link>
          ) : <div />}
          {nextFaq ? (
            <Link to={`/faq/${nextFaq.faq_number}`}>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">FAQ</span> {nextFaq.faq_number} <ChevronRight className="h-4 w-4 ml-0.5 sm:ml-1" />
              </Button>
            </Link>
          ) : <div />}
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <Badge variant="outline" className="shrink-0 font-mono text-base sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
                {faq.faq_number}
              </Badge>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">{faq.chapter}</Badge>
                  {faq.sub_category && (
                    <Badge variant="outline" className="text-xs">{faq.sub_category}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-serif leading-snug">
                  {faq.question}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="prose prose-sm md:prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
            </div>

            {faq.source_references && (
              <p className="text-sm text-muted-foreground mt-4 italic border-t pt-2">
                {faq.source_references}
              </p>
            )}

            {faqFootnotes.length > 0 && (
              <div className="mt-4 pt-3 border-t space-y-1">
                {faqFootnotes.map((fn, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <sup className="font-mono text-primary">{fn.marker}</sup> {fn.content}
                  </p>
                ))}
              </div>
            )}

            <FaqDataTableDisplay faqId={faq.id} />

            {/* Related Articles */}
            {articleLinks.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Related Articles</h3>
                <div className="flex flex-wrap gap-1.5">
                  {articleLinks.map(art => (
                    <Link key={art} to={`/article/${art}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        <FileText className="h-3 w-3 mr-1" /> Art. {art}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Recitals */}
            {recitalLinks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Related Recitals</h3>
                <div className="flex flex-wrap gap-1.5">
                  {recitalLinks.map(rec => (
                    <Link key={rec} to={`/recital/${rec}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ScrollText className="h-3 w-3 mr-1" /> Recital {rec}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Implementing Acts */}
            {relatedActs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Related Implementing Acts</h3>
                <div className="flex flex-wrap gap-1.5">
                  {relatedActs.map(act => (
                    <Link key={act.id} to={`/implementing-acts/${act.id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-primary/30">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {act.title.length > 50 ? act.title.slice(0, 50) + "…" : act.title}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between mt-6">
          {prevFaq ? (
            <Link to={`/faq/${prevFaq.faq_number}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" /> FAQ {prevFaq.faq_number}
              </Button>
            </Link>
          ) : <div />}
          <Link to="/faqs">
            <Button variant="ghost" size="sm">All FAQs</Button>
          </Link>
          {nextFaq ? (
            <Link to={`/faq/${nextFaq.faq_number}`}>
              <Button variant="outline" size="sm">
                FAQ {nextFaq.faq_number} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : <div />}
        </div>
      </div>
    </Layout>
  );
};

export default FaqDetailPage;
