import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ChevronDown, FileText, BookOpen, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { SEOHead, BreadcrumbSchema } from "@/components/seo";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useEhdsFaqs, useEhdsFaqFootnotes, getChaptersFromFaqs, type EhdsFaq } from "@/hooks/useEhdsFaqs";
import { useImplementingActs, type ImplementingAct } from "@/hooks/useImplementingActs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { FaqDataTableDisplay } from "@/components/FaqDataTableDisplay";


function FAQContent({ faq, footnotes }: { faq: EhdsFaq; footnotes: { marker: string; content: string }[] }) {
  const content = faq.rich_content || faq.answer;

  // Replace FAQ cross-references like "question 33" with links
  const processedContent = content.replace(
    /(?:see\s+)?question\s+(\d+)(?:\s+(?:below|above))?/gi,
    (match, num) => `[${match}](/faqs#faq-${num})`
  );

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
      {faq.source_references && (
        <p className="text-sm text-muted-foreground mt-4 italic border-t pt-2">
          {faq.source_references}
        </p>
      )}
      {footnotes.length > 0 && (
        <div className="mt-4 pt-3 border-t space-y-1">
          {footnotes.map((fn, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              <sup className="font-mono text-primary">{fn.marker}</sup> {fn.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function FAQItem({ faq, footnotes, isOpen, onToggle, implementingActs }: {
  faq: EhdsFaq;
  footnotes: { marker: string; content: string }[];
  isOpen: boolean;
  onToggle: () => void;
  implementingActs: ImplementingAct[];
}) {
  const articleLinks = (faq.source_articles || []).filter(Boolean);
  
  // Find implementing acts linked to the same articles as this FAQ
  const relatedActs = useMemo(() => {
    if (articleLinks.length === 0) return [];
    const artNums = articleLinks.map(a => parseInt(a, 10)).filter(n => !isNaN(n));
    return implementingActs.filter(act => 
      act.relatedArticles.some(r => artNums.includes(r))
    );
  }, [articleLinks, implementingActs]);

  return (
    <div id={`faq-${faq.faq_number}`} className="scroll-mt-20">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 rounded-lg hover:bg-accent/50 transition-colors flex items-start gap-3 group">
            <Link to={`/faq/${faq.faq_number}`} onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className="shrink-0 mt-0.5 font-mono hover:bg-primary hover:text-primary-foreground transition-colors">
                {faq.faq_number}
              </Badge>
            </Link>
            <span className="font-medium flex-1 text-sm md:text-base">{faq.question}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 mt-1 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 ml-10">
            <FAQContent faq={faq} footnotes={footnotes} />
            <FaqDataTableDisplay faqId={faq.id} />
            {articleLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {articleLinks.map((art) => (
                  <Link key={art} to={`/article/${art}`}>
                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      <FileText className="h-3 w-3 mr-1" />
                      Art. {art}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            {(faq.source_recitals || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(faq.source_recitals || []).map((rec) => (
                  <Link key={rec} to={`/recital/${rec}`}>
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-accent">
                      <ScrollText className="h-3 w-3 mr-1" />
                      Recital {rec}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            {relatedActs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {relatedActs.map((act) => (
                  <Link key={act.id} to={`/implementing-acts/${act.id}`}>
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-primary/30">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {act.title.length > 40 ? act.title.slice(0, 40) + "…" : act.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

const FAQsPage = () => {
  const { data: faqs = [], isLoading } = useEhdsFaqs();
  const { data: implementingActs = [] } = useImplementingActs();
  const faqIds = useMemo(() => faqs.map(f => f.id), [faqs]);
  const { data: allFootnotes = [] } = useEhdsFaqFootnotes(faqIds);
  const [search, setSearch] = useState("");
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const location = useLocation();

  // Open FAQ from hash on mount
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith("#faq-")) {
      const num = parseInt(hash.replace("#faq-", ""));
      if (!isNaN(num)) {
        setOpenFaqs(new Set([num]));
        setTimeout(() => {
          document.getElementById(`faq-${num}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [location.hash]);

  const chapters = useMemo(() => getChaptersFromFaqs(faqs), [faqs]);

  const filtered = useMemo(() => {
    let result = faqs;
    if (activeChapter) {
      result = result.filter(f => f.chapter === activeChapter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        (f.rich_content || "").toLowerCase().includes(q) ||
        String(f.faq_number) === q.replace("#", "")
      );
    }
    return result;
  }, [faqs, search, activeChapter]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, Record<string, EhdsFaq[]>> = {};
    for (const faq of filtered) {
      if (!groups[faq.chapter]) groups[faq.chapter] = {};
      const sub = faq.sub_category || "_default";
      if (!groups[faq.chapter][sub]) groups[faq.chapter][sub] = [];
      groups[faq.chapter][sub].push(faq);
    }
    return groups;
  }, [filtered]);

  const toggleFaq = (num: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const getFootnotes = (faqId: string) =>
    allFootnotes.filter(fn => fn.faq_id === faqId);

  const faqSchemaItems = faqs.slice(0, 30).map(f => ({
    question: f.question,
    answer: f.answer,
  }));

  return (
    <Layout>
      <SEOHead
        title="EHDS FAQs | Official EU Commission Q&A | EHDS Explorer"
        description="Official Frequently Asked Questions on the European Health Data Space (EHDS) Regulation from the European Commission DG SANTE."
        url="/faqs"
        keywords={["EHDS FAQ", "European Health Data Space", "EU health data", "EHDS questions"]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "FAQs", url: "/faqs" },
        ]}
      />
      <FAQSchema items={faqSchemaItems} pageUrl="/faqs" />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Breadcrumbs items={[{ label: "FAQs" }]} />

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2">
            EHDS Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Official Q&A from the European Commission (DG SANTE, Unit C.1 – Digital Health).
            {faqs.length > 0 && ` ${faqs.length} questions across ${chapters.length} topics.`}
          </p>
          <a
            href="https://health.ec.europa.eu/ehealth-digital-health-and-care/ehds-action_en"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
          >
            <FileText className="h-4 w-4" />
            View official source on the European Commission website ↗
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs by keyword, question, or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chapter Nav Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-4 space-y-1">
              <Button
                variant={activeChapter === null ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-between text-sm"
                onClick={() => setActiveChapter(null)}
              >
                All Topics
                <Badge variant="outline" className="ml-2">{faqs.length}</Badge>
              </Button>
              {chapters.map(({ chapter, count }) => (
                <Button
                  key={chapter}
                  variant={activeChapter === chapter ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-between text-sm text-left"
                  onClick={() => setActiveChapter(chapter)}
                >
                  <span className="truncate">{chapter}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">{count}</Badge>
                </Button>
              ))}
            </div>
          </aside>

          {/* FAQ Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {search ? "No FAQs match your search." : "No FAQs available yet. Use the admin panel to sync FAQs from the EU Commission PDF."}
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedFaqs).map(([chapter, subGroups]) => (
                <div key={chapter} className="mb-8">
                  <h2 className="text-lg font-semibold mb-3 text-primary border-b pb-2">{chapter}</h2>
                  {Object.entries(subGroups).map(([sub, subFaqs]) => (
                    <div key={sub} className="mb-4">
                      {sub !== "_default" && (
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 ml-2">{sub}</h3>
                      )}
                      <div className="space-y-1 border rounded-lg divide-y">
                        {subFaqs.map(faq => (
                          <FAQItem
                            key={faq.id}
                            faq={faq}
                            footnotes={getFootnotes(faq.id)}
                            isOpen={openFaqs.has(faq.faq_number)}
                            onToggle={() => toggleFaq(faq.faq_number)}
                            implementingActs={implementingActs}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQsPage;
