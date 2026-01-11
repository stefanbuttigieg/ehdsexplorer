import { AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface TranslationFallbackNoticeProps {
  contentType: string;
  className?: string;
}

export function TranslationFallbackNotice({ contentType, className }: TranslationFallbackNoticeProps) {
  const { currentLanguage, languages, setLanguage } = useLanguage();
  
  const currentLang = languages.find(l => l.code === currentLanguage);
  
  if (currentLanguage === 'en') return null;

  return (
    <Alert variant="default" className={className}>
      <Globe className="h-4 w-4" />
      <AlertTitle>Translation not available</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          This {contentType} is not yet available in {currentLang?.native_name || currentLanguage}. 
          You are viewing the official English version.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLanguage('en')}
          >
            Switch to English
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
