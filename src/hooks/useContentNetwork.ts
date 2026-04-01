import { useMemo } from "react";
import { Article } from "@/hooks/useArticles";
import { EhdsFaq } from "@/hooks/useEhdsFaqs";
import { Recital } from "@/hooks/useRecitals";
import { Annex } from "@/hooks/useAnnexes";
import { ImplementingAct } from "@/hooks/useImplementingActs";
import { JointActionDeliverable } from "@/hooks/useJointActionDeliverables";
import { DownloadableResource } from "@/hooks/useDownloadableResources";

export type ContentNodeType = "article" | "faq" | "recital" | "annex" | "implementing-act" | "deliverable" | "resource";

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
  type: string;
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
  implementingActs: ImplementingAct[] | undefined,
  deliverables?: JointActionDeliverable[] | undefined,
  resources?: DownloadableResource[] | undefined
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

    // Build article-to-FAQ map for deliverable/resource indirect linking
    const articleToFaqIds = new Map<number, string[]>();

    // Add FAQ nodes and links (articles + recitals)
    for (const faq of faqs || []) {
      const faqId = `faq-${faq.faq_number}`;
      nodes.push({ id: faqId, type: "faq", label: `FAQ ${faq.faq_number}`, title: faq.question, degree: 0 });

      // Link to articles
      for (const artStr of faq.source_articles || []) {
        const artNum = parseInt(artStr, 10);
        if (!isNaN(artNum) && articleIds.has(`art-${artNum}`)) {
          addLink(faqId, `art-${artNum}`, "faq-article");
          // Track for indirect linking
          if (!articleToFaqIds.has(artNum)) articleToFaqIds.set(artNum, []);
          articleToFaqIds.get(artNum)!.push(faqId);
        }
      }

      // Link to recitals
      for (const recStr of faq.source_recitals || []) {
        const recNum = parseInt(recStr, 10);
        if (!isNaN(recNum)) {
          addLink(faqId, `rec-${recNum}`, "faq-recital");
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

    // Add annex nodes and links
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
    const iaIds = new Set<string>();
    for (const ia of implementingActs || []) {
      const iaId = `ia-${ia.id}`;
      iaIds.add(iaId);
      nodes.push({ id: iaId, type: "implementing-act", label: ia.articleReference, title: ia.title, degree: 0 });
      for (const artNum of ia.relatedArticles) {
        if (articleIds.has(`art-${artNum}`)) {
          addLink(iaId, `art-${artNum}`, "ia-article");
        }
      }
    }

    // Add deliverable nodes and links
    for (const d of deliverables || []) {
      const dId = `del-${d.id}`;
      nodes.push({ id: dId, type: "deliverable", label: d.deliverable_name.slice(0, 30), title: `${d.joint_action_name}: ${d.deliverable_name}`, degree: 0 });

      // Link to articles
      for (const artNum of d.related_articles || []) {
        if (articleIds.has(`art-${artNum}`)) {
          addLink(dId, `art-${artNum}`, "deliverable-article");
        }
        // Indirect link: deliverable → FAQ (through shared articles)
        for (const faqId of articleToFaqIds.get(artNum) || []) {
          addLink(dId, faqId, "deliverable-faq");
        }
      }

      // Link to implementing acts
      for (const iaOrigId of d.related_implementing_acts || []) {
        const iaNodeId = `ia-${iaOrigId}`;
        if (iaIds.has(iaNodeId)) {
          addLink(dId, iaNodeId, "deliverable-ia");
        }
      }
    }

    // Add resource nodes and links (extract article refs from description/tags)
    for (const res of resources || []) {
      const rId = `res-${res.id}`;
      const tagRefs: number[] = [];
      for (const tag of res.tags || []) {
        const m = tag.match(/^article[- ]?(\d+)$/i);
        if (m) tagRefs.push(parseInt(m[1], 10));
      }
      const descRefs = res.description ? extractArticleRefsFromText(res.description) : [];
      const allRefs = [...new Set([...tagRefs, ...descRefs])];

      // Only add resource if it has connections
      if (allRefs.some(n => articleIds.has(`art-${n}`))) {
        nodes.push({ id: rId, type: "resource", label: res.title.slice(0, 30), title: res.title, degree: 0 });
        for (const artNum of allRefs) {
          if (articleIds.has(`art-${artNum}`)) {
            addLink(rId, `art-${artNum}`, "resource-article");
          }
        }
      }
    }

    // Set degree on nodes
    for (const node of nodes) {
      node.degree = degreeMap.get(node.id) || 0;
    }

    // Stats
    const totalLinks = links.length;
    const typeCounts: Record<ContentNodeType, number> = {
      article: (articles || []).length,
      faq: (faqs || []).length,
      recital: (recitals || []).length,
      annex: (annexes || []).length,
      "implementing-act": (implementingActs || []).length,
      deliverable: (deliverables || []).length,
      resource: nodes.filter(n => n.type === "resource").length,
    };

    return { nodes, links, totalLinks, typeCounts };
  }, [articles, faqs, recitals, annexes, implementingActs, deliverables, resources]);
}
