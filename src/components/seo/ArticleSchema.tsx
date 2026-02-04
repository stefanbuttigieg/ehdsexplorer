import { Helmet } from 'react-helmet-async';

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  articleNumber?: number;
  isLegislation?: boolean;
}

export function ArticleSchema({
  title,
  description,
  url,
  datePublished = '2025-03-26',
  dateModified,
  articleNumber,
  isLegislation = true,
}: ArticleSchemaProps) {
  const baseUrl = 'https://ehdsexplorer.lovable.app';
  
  const schema = isLegislation
    ? {
        '@context': 'https://schema.org',
        '@type': 'Legislation',
        name: title,
        description: description,
        url: `${baseUrl}${url}`,
        legislationIdentifier: articleNumber ? `EHDS-Article-${articleNumber}` : undefined,
        legislationType: 'EU Regulation',
        jurisdiction: {
          '@type': 'AdministrativeArea',
          name: 'European Union',
        },
        legislationDate: datePublished,
        dateModified: dateModified || datePublished,
        isPartOf: {
          '@type': 'Legislation',
          name: 'Regulation (EU) 2025/327 - European Health Data Space',
          legislationIdentifier: 'CELEX:32025R0327',
          url: 'https://eur-lex.europa.eu/eli/reg/2025/327/oj',
        },
        publisher: {
          '@type': 'Organization',
          name: 'European Union',
          url: 'https://european-union.europa.eu',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        url: `${baseUrl}${url}`,
        datePublished: datePublished,
        dateModified: dateModified || datePublished,
        author: {
          '@type': 'Organization',
          name: 'EHDS Explorer',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'EHDS Explorer',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/favicon.svg`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}${url}`,
        },
      };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
