import { Helmet } from "react-helmet-async";

interface ArticleMetadata {
  type: "article";
  articleNumber: number;
  title: string;
  content: string;
  chapterNumber?: number;
}

interface RecitalMetadata {
  type: "recital";
  recitalNumber: number;
  content: string;
}

interface LegislationMetadata {
  type: "legislation";
  title: string;
  description: string;
}

type MetadataProps = ArticleMetadata | RecitalMetadata | LegislationMetadata;

const ELI_BASE = "http://data.europa.eu/eli/reg/2025/327";
const EUR_LEX_BASE = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R0327";

export const JsonLdMetadata = (props: MetadataProps) => {
  const getJsonLd = () => {
    const baseContext = {
      "@context": "https://schema.org",
    };

    if (props.type === "article") {
      return {
        ...baseContext,
        "@type": "Legislation",
        "@id": `${ELI_BASE}/art_${props.articleNumber}`,
        name: `Article ${props.articleNumber} - ${props.title}`,
        description: props.content.substring(0, 200) + "...",
        legislationType: "Regulation",
        legislationIdentifier: `CELEX:32025R0327`,
        jurisdiction: {
          "@type": "AdministrativeArea",
          name: "European Union",
        },
        legislationLegalForce: "InForce",
        isPartOf: {
          "@type": "Legislation",
          name: "Regulation (EU) 2025/327 - European Health Data Space",
          "@id": ELI_BASE,
          url: EUR_LEX_BASE,
        },
        inLanguage: "en",
        datePublished: "2025-01-22",
        publisher: {
          "@type": "Organization",
          name: "European Union",
          url: "https://european-union.europa.eu/",
        },
        sameAs: [
          `${ELI_BASE}/art_${props.articleNumber}`,
          `${EUR_LEX_BASE}#art_${props.articleNumber}`,
        ],
      };
    }

    if (props.type === "recital") {
      return {
        ...baseContext,
        "@type": "Legislation",
        "@id": `${ELI_BASE}/rec_${props.recitalNumber}`,
        name: `Recital ${props.recitalNumber}`,
        description: props.content.substring(0, 200) + "...",
        legislationType: "Regulation",
        legislationIdentifier: "CELEX:32025R0327",
        isPartOf: {
          "@type": "Legislation",
          name: "Regulation (EU) 2025/327 - European Health Data Space",
          "@id": ELI_BASE,
        },
        inLanguage: "en",
        datePublished: "2025-01-22",
      };
    }

    // Legislation overview
    return {
      ...baseContext,
      "@type": "Legislation",
      "@id": ELI_BASE,
      name: "Regulation (EU) 2025/327 - European Health Data Space",
      alternateName: "EHDS Regulation",
      description: props.description,
      legislationType: "Regulation",
      legislationIdentifier: "CELEX:32025R0327",
      jurisdiction: {
        "@type": "AdministrativeArea",
        name: "European Union",
      },
      legislationLegalForce: "InForce",
      inLanguage: "en",
      datePublished: "2025-01-22",
      publisher: {
        "@type": "Organization",
        name: "European Union",
        url: "https://european-union.europa.eu/",
      },
      sameAs: [ELI_BASE, EUR_LEX_BASE],
      url: EUR_LEX_BASE,
    };
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(getJsonLd())}</script>
    </Helmet>
  );
};

export const ELI_LINKS = {
  base: ELI_BASE,
  eurLex: EUR_LEX_BASE,
  getArticleEli: (articleNumber: number) => `${ELI_BASE}/art_${articleNumber}`,
  getRecitalEli: (recitalNumber: number) => `${ELI_BASE}/rec_${recitalNumber}`,
};
