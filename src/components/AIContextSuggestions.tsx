import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lightbulb, MessageSquareText } from 'lucide-react';

interface AIContextSuggestionsProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

interface ContextSuggestion {
  label: string;
  question: string;
}

const AIContextSuggestions: React.FC<AIContextSuggestionsProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Generate context-aware suggestions based on current page
  const getSuggestions = (): ContextSuggestion[] => {
    // Article page
    const articleMatch = pathname.match(/\/articles?\/(\d+)/);
    if (articleMatch) {
      const articleNum = articleMatch[1];
      return [
        { label: 'Explain this', question: `Explain Article ${articleNum} in simple terms` },
        { label: 'Key obligations', question: `What are the key obligations in Article ${articleNum}?` },
        { label: 'Related articles', question: `Which other articles relate to Article ${articleNum}?` },
      ];
    }

    // Recital page
    const recitalMatch = pathname.match(/\/recitals?\/(\d+)/);
    if (recitalMatch) {
      const recitalNum = recitalMatch[1];
      return [
        { label: 'Purpose', question: `What is the purpose of Recital ${recitalNum}?` },
        { label: 'Related articles', question: `Which articles does Recital ${recitalNum} explain?` },
      ];
    }

    // Chapter page
    const chapterMatch = pathname.match(/\/chapters?\/(\d+)/);
    if (chapterMatch) {
      const chapterNum = chapterMatch[1];
      return [
        { label: 'Overview', question: `Give me an overview of Chapter ${chapterNum}` },
        { label: 'Key provisions', question: `What are the main provisions in Chapter ${chapterNum}?` },
      ];
    }

    // Definitions page
    if (pathname.includes('/definitions')) {
      return [
        { label: 'Key terms', question: 'What are the most important definitions in EHDS?' },
        { label: 'Health data', question: 'How does EHDS define electronic health data?' },
      ];
    }

    // Implementing acts page
    if (pathname.includes('/implementing-acts')) {
      return [
        { label: 'Status overview', question: 'What is the current status of EHDS implementing acts?' },
        { label: 'Upcoming deadlines', question: 'Which implementing acts have upcoming deadlines?' },
      ];
    }

    // Default suggestions
    return [
      { label: 'EHDS overview', question: 'What is the EHDS regulation about?' },
      { label: 'Key dates', question: 'What are the key implementation dates for EHDS?' },
    ];
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="px-3 py-2 border-t bg-muted/30">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Lightbulb className="h-3 w-3 text-amber-500" />
        <span className="text-[10px] text-muted-foreground font-medium">Quick questions</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2 py-0"
            onClick={() => onSendMessage(suggestion.question)}
            disabled={isLoading}
          >
            <MessageSquareText className="h-3 w-3 mr-1" />
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AIContextSuggestions;
