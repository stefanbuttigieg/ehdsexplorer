import { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

export function LanguageSelector({ variant = 'default', className }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, activeLanguages, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === currentLanguage);

  // Group languages: active first, then inactive
  const sortedLanguages = [...languages].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return a.sort_order - b.sort_order;
  });

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Globe className="h-4 w-4" />
            <span className="sr-only">Select language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-64">
            {sortedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => lang.is_active && handleLanguageChange(lang.code)}
                disabled={!lang.is_active}
                className={cn(
                  "flex items-center justify-between gap-2",
                  !lang.is_active && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{lang.native_name}</span>
                  {lang.code !== 'en' && !lang.is_active && (
                    <Badge variant="outline" className="text-xs">Soon</Badge>
                  )}
                </span>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Globe className="h-4 w-4" />
          <span>{currentLang?.native_name || 'English'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Select Language</span>
          <Badge variant="secondary" className="text-xs">
            {activeLanguages.length} available
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {activeLanguages.length > 0 && (
            <>
              {activeLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{lang.native_name}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </span>
                  {currentLanguage === lang.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Coming soon
              </DropdownMenuLabel>
            </>
          )}
          {sortedLanguages.filter(l => !l.is_active).map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              disabled
              className="flex items-center justify-between gap-2 opacity-50"
            >
              <span className="flex flex-col">
                <span className="font-medium">{lang.native_name}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
