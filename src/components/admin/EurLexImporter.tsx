 import { useState, useCallback } from 'react';
 import { Globe, Loader2, Check, AlertTriangle, ExternalLink } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { Progress } from '@/components/ui/progress';
 import { firecrawlApi } from '@/lib/api/firecrawl';
 import { toast } from 'sonner';
 
 interface EurLexImporterProps {
   onContentFetched: (content: string, sourceUrl: string) => void;
 }
 
 // EUR-Lex URL patterns for EHDS Regulation
 const EURLEX_BASE = 'eur-lex.europa.eu';
 const EHDS_CELEX = '32025R0327';
 
 // Language codes to EUR-Lex language codes
 const LANG_MAP: Record<string, string> = {
   en: 'EN', de: 'DE', fr: 'FR', es: 'ES', it: 'IT',
   pt: 'PT', nl: 'NL', pl: 'PL', cs: 'CS', sk: 'SK',
   hu: 'HU', ro: 'RO', bg: 'BG', el: 'EL', sv: 'SV',
   da: 'DA', fi: 'FI', et: 'ET', lv: 'LV', lt: 'LT',
   sl: 'SL', hr: 'HR', mt: 'MT', ga: 'GA',
 };
 
 export function EurLexImporter({ onContentFetched }: EurLexImporterProps) {
   const [url, setUrl] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [status, setStatus] = useState<'idle' | 'fetching' | 'parsing' | 'done' | 'error'>('idle');
   const [error, setError] = useState<string | null>(null);
   const [detectedLang, setDetectedLang] = useState<string | null>(null);
 
   const detectLanguageFromUrl = (inputUrl: string): string | null => {
     // EUR-Lex URLs contain language code like /TXT/?uri=CELEX:32025R0327&lang=DE
     const langMatch = inputUrl.match(/[?&]lang=([A-Z]{2})/i);
     if (langMatch) {
       const lang = langMatch[1].toUpperCase();
       // Find the matching language code
       for (const [code, eurLexCode] of Object.entries(LANG_MAP)) {
         if (eurLexCode === lang) return code;
       }
     }
     return null;
   };
 
   const validateUrl = (inputUrl: string): { valid: boolean; error?: string } => {
     if (!inputUrl.trim()) {
       return { valid: false, error: 'Please enter a URL' };
     }
     
     try {
       const parsed = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
       
       if (!parsed.hostname.includes(EURLEX_BASE)) {
         return { valid: false, error: 'URL must be from EUR-Lex (eur-lex.europa.eu)' };
       }
       
       // Warn if not EHDS regulation
       if (!inputUrl.includes(EHDS_CELEX)) {
         return { 
           valid: true, 
           error: 'Warning: This URL may not be for the EHDS Regulation (32025R0327)' 
         };
       }
       
       return { valid: true };
     } catch {
       return { valid: false, error: 'Invalid URL format' };
     }
   };
 
   const handleFetch = useCallback(async () => {
     const validation = validateUrl(url);
     if (!validation.valid) {
       setError(validation.error || 'Invalid URL');
       return;
     }
 
     setIsLoading(true);
     setStatus('fetching');
     setProgress(10);
     setError(null);
 
     try {
       // Detect language from URL
       const lang = detectLanguageFromUrl(url);
       if (lang) {
         setDetectedLang(lang);
       }
 
       setProgress(30);
 
       // Fetch HTML content using Firecrawl
       const response = await firecrawlApi.scrape(url, {
         formats: ['markdown', 'html'],
         onlyMainContent: true,
         waitFor: 2000, // Wait for dynamic content
       });
 
       setProgress(70);
 
       if (!response.success) {
         throw new Error(response.error || 'Failed to fetch page');
       }
 
       const content = response.data?.markdown || response.data?.html || '';
       
       if (!content || content.length < 1000) {
         throw new Error('Page content appears to be empty or too short. The page may require login or have anti-scraping protection.');
       }
 
       setProgress(90);
       setStatus('parsing');
 
       // Pass content to parent
       onContentFetched(content, url);
 
       setProgress(100);
       setStatus('done');
       toast.success(`Fetched content from EUR-Lex${lang ? ` (${lang.toUpperCase()})` : ''}`);
 
     } catch (err) {
       console.error('Failed to fetch EUR-Lex content:', err);
       setStatus('error');
       setError(err instanceof Error ? err.message : 'Failed to fetch page');
       toast.error('Failed to fetch EUR-Lex content');
     } finally {
       setIsLoading(false);
     }
   }, [url, onContentFetched]);
 
   const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setUrl(e.target.value);
     setError(null);
     setStatus('idle');
     
     // Try to detect language from URL as user types
     const lang = detectLanguageFromUrl(e.target.value);
     setDetectedLang(lang);
   };
 
   const generateEurLexUrl = (langCode: string) => {
     const eurLexLang = LANG_MAP[langCode] || 'EN';
     return `https://eur-lex.europa.eu/legal-content/${eurLexLang}/TXT/HTML/?uri=CELEX:${EHDS_CELEX}`;
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Globe className="h-5 w-5" />
           Import from EUR-Lex
         </CardTitle>
         <CardDescription>
           Paste a EUR-Lex URL to automatically fetch and parse the translated regulation
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* URL Input */}
         <div className="space-y-2">
           <div className="flex gap-2">
             <Input
               type="url"
               value={url}
               onChange={handleUrlChange}
               placeholder="https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32025R0327"
               disabled={isLoading}
               className="flex-1"
             />
             <Button 
               onClick={handleFetch} 
               disabled={isLoading || !url.trim()}
             >
               {isLoading ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Fetching...
                 </>
               ) : (
                 'Fetch'
               )}
             </Button>
           </div>
           
           {detectedLang && (
             <div className="flex items-center gap-2 text-sm">
               <Check className="h-4 w-4 text-primary" />
               <span>Detected language: <Badge>{detectedLang.toUpperCase()}</Badge></span>
             </div>
           )}
         </div>
 
         {/* Quick Language Links */}
         <div className="space-y-2">
           <p className="text-sm text-muted-foreground">Quick links to EHDS Regulation translations:</p>
           <div className="flex flex-wrap gap-1">
             {Object.entries(LANG_MAP).slice(0, 12).map(([code, eurLex]) => (
               <Button
                 key={code}
                 variant="outline"
                 size="sm"
                 className="h-7 px-2 text-xs"
                 onClick={() => {
                   const newUrl = generateEurLexUrl(code);
                   setUrl(newUrl);
                   setDetectedLang(code);
                 }}
               >
                 {code.toUpperCase()}
               </Button>
             ))}
             <Button
               variant="ghost"
               size="sm"
               className="h-7 px-2 text-xs"
               asChild
             >
               <a 
                 href={`https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${EHDS_CELEX}`}
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 View all languages <ExternalLink className="h-3 w-3 ml-1" />
               </a>
             </Button>
           </div>
         </div>
 
         {/* Progress */}
         {status !== 'idle' && status !== 'done' && status !== 'error' && (
           <div className="space-y-2">
             <div className="flex justify-between text-sm">
               <span>{status === 'fetching' ? 'Fetching page...' : 'Parsing content...'}</span>
               <span>{progress}%</span>
             </div>
             <Progress value={progress} className="h-2" />
           </div>
         )}
 
         {/* Error */}
         {error && (
           <Alert variant={error.startsWith('Warning') ? 'default' : 'destructive'}>
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>{error.startsWith('Warning') ? 'Warning' : 'Error'}</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
         )}
 
         {/* Success */}
         {status === 'done' && (
           <Alert className="border-primary/50">
             <Check className="h-4 w-4 text-primary" />
             <AlertTitle>Content fetched successfully</AlertTitle>
             <AlertDescription>
               The page content has been extracted. Review the parsed results below.
             </AlertDescription>
           </Alert>
         )}
       </CardContent>
     </Card>
   );
 }