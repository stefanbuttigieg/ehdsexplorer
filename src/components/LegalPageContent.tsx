import { usePageContent } from '@/hooks/usePageContent';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface LegalSection {
  title: string;
  content: string;
}

interface LegalPageData {
  last_updated: string;
  sections: LegalSection[];
}

interface LegalPageContentProps {
  pageId: string;
  fallbackTitle: string;
  children?: React.ReactNode;
}

export const LegalPageContent = ({ pageId, fallbackTitle, children }: LegalPageContentProps) => {
  const { data: page, isLoading } = usePageContent(pageId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-5 w-48 mb-8" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const content = page?.content as unknown as LegalPageData | null;
  const title = page?.title || fallbackTitle;
  const lastUpdated = content?.last_updated || 'Not available';
  const sections = content?.sections || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

      <div className="prose prose-sm max-w-none space-y-6 dark:prose-invert">
        {sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
            <div className="text-foreground/80 leading-relaxed legal-content">
              <ReactMarkdown 
                remarkPlugins={[remarkBreaks]}
                components={{
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 text-foreground/80">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 text-foreground/80">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground/80">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-border rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-border">{children}</tbody>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 text-left text-sm font-medium">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 text-sm">{children}</td>
                  ),
                  p: ({ children }) => (
                    <p className="text-foreground/80 leading-relaxed mb-3">{children}</p>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </div>
          </section>
        ))}
        {children}
      </div>
    </div>
  );
};
