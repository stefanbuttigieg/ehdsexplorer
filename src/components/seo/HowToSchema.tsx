import { Helmet } from 'react-helmet-async';

interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format, e.g., "PT30M" for 30 minutes
  pageUrl?: string;
}

export function HowToSchema({ 
  name, 
  description, 
  steps, 
  totalTime,
  pageUrl 
}: HowToSchemaProps) {
  const baseUrl = 'https://ehdsexplorer.lovable.app';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: name,
    description: description,
    totalTime: totalTime,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url ? `${baseUrl}${step.url}` : undefined,
    })),
    url: pageUrl ? `${baseUrl}${pageUrl}` : undefined,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
