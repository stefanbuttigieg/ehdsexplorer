import { Link } from 'react-router-dom';
import { useArticle } from '@/hooks/useArticles';
import { useRecital } from '@/hooks/useRecitals';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale } from 'lucide-react';

interface LegalReferenceLinkProps {
  type: 'article' | 'recital';
  number: number;
  children: React.ReactNode;
}

const ArticlePreview = ({ articleNumber }: { articleNumber: number }) => {
  const { data: article, isLoading } = useArticle(articleNumber);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-full" />
        <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
      </div>
    );
  }
  
  if (!article) {
    return <p className="text-sm text-muted-foreground">Article not found</p>;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <Badge variant="outline" className="text-xs">Article {article.article_number}</Badge>
      </div>
      <h4 className="font-semibold text-sm">{article.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-3">
        {article.content.slice(0, 200)}...
      </p>
    </div>
  );
};

const RecitalPreview = ({ recitalNumber }: { recitalNumber: number }) => {
  const { data: recital, isLoading } = useRecital(recitalNumber);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-full" />
        <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
      </div>
    );
  }
  
  if (!recital) {
    return <p className="text-sm text-muted-foreground">Recital not found</p>;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        <Badge variant="outline" className="text-xs">Recital {recital.recital_number}</Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-4">
        {recital.content.slice(0, 250)}...
      </p>
    </div>
  );
};

export const LegalReferenceLink = ({ type, number, children }: LegalReferenceLinkProps) => {
  const isMobile = useIsMobile();
  const path = type === 'article' ? `/article/${number}` : `/recital/${number}`;
  
  // On mobile, just show a simple link without hover preview
  if (isMobile) {
    return (
      <Link 
        to={path} 
        className="text-primary hover:underline font-medium"
      >
        {children}
      </Link>
    );
  }
  
  // On tablet/desktop, show hover preview
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link 
          to={path} 
          className="text-primary hover:underline font-medium"
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="start">
        {type === 'article' ? (
          <ArticlePreview articleNumber={number} />
        ) : (
          <RecitalPreview recitalNumber={number} />
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

// Utility to parse text and replace article/recital references with links
export const parseAndLinkReferences = (text: string): React.ReactNode[] => {
  // Regex to match "Article X", "Articles X", "Recital X", "Recitals X" (case insensitive)
  // Also matches ranges like "Articles 1 to 5" or "Article 1(2)"
  const referencePattern = /\b(Articles?\s+\d+(?:\s*(?:to|and|-)\s*\d+)?(?:\s*\(\d+\))?|Recitals?\s+\d+(?:\s*(?:to|and|-)\s*\d+)?)/gi;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = referencePattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const matchText = match[0];
    const isArticle = matchText.toLowerCase().startsWith('article');
    
    // Extract the first number from the reference
    const numberMatch = matchText.match(/\d+/);
    if (numberMatch) {
      const number = parseInt(numberMatch[0], 10);
      
      // Validate the number is reasonable (articles 1-105, recitals 1-115)
      const maxNumber = isArticle ? 105 : 115;
      if (number >= 1 && number <= maxNumber) {
        parts.push(
          <LegalReferenceLink 
            key={`${match.index}-${matchText}`}
            type={isArticle ? 'article' : 'recital'} 
            number={number}
          >
            {matchText}
          </LegalReferenceLink>
        );
      } else {
        // Number out of range, just show as text
        parts.push(matchText);
      }
    } else {
      parts.push(matchText);
    }
    
    lastIndex = match.index + matchText.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};
