import { useMemo } from "react";
import { Article } from "@/hooks/useArticles";
import { EhdsFaq } from "@/hooks/useEhdsFaqs";
import { Recital } from "@/hooks/useRecitals";
import { Annex } from "@/hooks/useAnnexes";
import { ImplementingAct } from "@/hooks/useImplementingActs";

export type ContentNodeType = "article" | "faq" | "recital" | "annex" | "implementing-act";

export interface ContentNode {
  id: string;
  type: ContentNodeType;
  label: string;
  title: string;
  degree: number;
}

export interface ContentLink {
  source: string;
  target: string;
  type: string; // e.g. "faq-article", "recital-article", "ia-article"
}

const extractArticleRefsFromText = (text: string): number[] => {
  const refs = new Set<number>();
  const pattern = /Articles?\s+(\d+)/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 105) refs.add(num);
  }
  return Array.from(refs);
};

export function useContentNetwork(
  articles: Article[] | undefined,
  faqs: EhdsFaq[] | undefined,
  recitals: Recital[] | undefined,
  annexes: Annex[] | undefined,
  implementingActs: ImplementingAct[] | undefined
) {
  return useMemo(() => {
    const nodes: ContentNode[] = [];
    const links: ContentLink[] = [];
    const degreeMap = new Map<string, number>();

    const addDegree = (id: string) => degreeMap.set(id, (degreeMap.get(id) || 0) + 1);
    const seenLinks = new Set<string>();
    const addLink = (source: string, target: string, type: string) => {
      const key = `${source}>${target}`;
      if (seenLinks.has(key)) return;
      seenLinks.add(key);
      links.push({ source, target, type });
      addDegree(source);
      addDegree(target);
    };

    // Add article nodes
    const articleIds = new Set<string>();
    for (const a of articles || []) {
      const id = `art-${a.article_number}`;
      articleIds.add(id);
      nodes.push({ id, type: "article", label: `Art. ${a.article_number}`, title: a.title, degree: 0 });
    }

    // Add FAQ nodes and links
    for (const faq of faqs || []) {
      const faqId = `faq-${faq.faq_number}`;
      nodes.push({ id: faqId, type: "faq", label: `FAQ ${faq.faq_number}`, title: faq.question, degree: 0 });
      for (const artStr of faq.source_articles || []) {
        const artNum = parseInt(artStr, 10);
        if (!isNaN(artNum) && articleIds.has(`art-${artNum}`)) {
          addLink(faqId, `art-${artNum}`, "faq-article");
        }
      }
    }

    // Add recital nodes and links
    for (const r of recitals || []) {
      const rId = `rec-${r.recital_number}`;
      nodes.push({ id: rId, type: "recital", label: `Rec. ${r.recital_number}`, title: r.content.slice(0, 80) + "…", degree: 0 });
      for (const artNum of r.related_articles || []) {
        if (articleIds.has(`art-${artNum}`)) {
          addLink(rId, `art-${artNum}`, "recital-article");
        }
      }
    }

    // Add annex nodes and links (extract article refs from content)
    for (const annex of annexes || []) {
      const aId = `anx-${annex.id}`;
      nodes.push({ id: aId, type: "annex", label: `Annex ${annex.id}`, title: annex.title, degree: 0 });
      const refs = extractArticleRefsFromText(annex.content);
      for (const artNum of refs) {
        if (articleIds.has(`art-${artNum}`)) {
          addLink(aId, `art-${artNum}`, "annex-article");
        }
      }
    }

    // Add implementing act nodes and links
    for (const ia of implementingActs || []) {
      const iaId = `ia-${ia.id}`;
      nodes.push({ id: iaId, type: "implementing-act", label: ia.articleReference, title: ia.title, degree: 0 });
      for (const artNum of ia.relatedArticles) {
        if (articleIds.has(`art-${artNum}`)) {
          addLink(iaId, `art-${artNum}`, "ia-article");
        }
      }
    }

    // Set degree on nodes
    for (const node of nodes) {
      node.degree = degreeMap.get(node.id) || 0;
    }

    // Stats
    const totalLinks = links.length;
    const typeCounts = {
      article: (articles || []).length,
      faq: (faqs || []).length,
      recital: (recitals || []).length,
      annex: (annexes || []).length,
      "implementing-act": (implementingActs || []).length,
    };

    return { nodes, links, totalLinks, typeCounts };
  }, [articles, faqs, recitals, annexes, implementingActs]);
}
