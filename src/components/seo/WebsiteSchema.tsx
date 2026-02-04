import { Helmet } from 'react-helmet-async';

interface WebsiteSchemaProps {
  searchUrl?: string;
}

export function WebsiteSchema({ searchUrl }: WebsiteSchemaProps) {
  const baseUrl = 'https://ehdsexplorer.lovable.app';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EHDS Explorer',
    alternateName: 'European Health Data Space Regulation Explorer',
    url: baseUrl,
    description: 'Comprehensive digital platform for exploring Regulation (EU) 2025/327 - the European Health Data Space Regulation',
    publisher: {
      '@type': 'Organization',
      name: 'EHDS Explorer',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`,
      },
    },
    potentialAction: searchUrl
      ? {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}${searchUrl}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
    inLanguage: ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'sv', 'da', 'fi', 'el', 'cs', 'hu', 'ro', 'bg', 'sk', 'sl', 'hr', 'lt', 'lv', 'et', 'mt', 'ga'],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
