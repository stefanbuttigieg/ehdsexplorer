import { useState, useCallback, useEffect, useRef } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Languages, Loader2, AlertTriangle, Check, RotateCcw, FileWarning } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import Layout from '@/components/Layout';
 import { useAuth } from '@/hooks/useAuth';
 import { useLanguages } from '@/hooks/useLanguages';
 import { useTranslationImport } from '@/hooks/useTranslationImport';
 import { TranslationDiffPreview } from '@/components/admin/TranslationDiffPreview';
 
// PDF.js types
type PDFDocumentProxy = Awaited<ReturnType<typeof import('pdfjs-dist')['getDocument']>['promise']>;

 // Language code to name mapping
 const LANGUAGE_NAMES: Record<string, string> = {
   en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
   pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', cs: 'Czech', sk: 'Slovak',
   hu: 'Hungarian', ro: 'Romanian', bg: 'Bulgarian', el: 'Greek', sv: 'Swedish',
   da: 'Danish', fi: 'Finnish', et: 'Estonian', lv: 'Latvian', lt: 'Lithuanian',
   sl: 'Slovenian', hr: 'Croatian', mt: 'Maltese', ga: 'Irish',
 };
 
 const AdminTranslationImportPage = () => {
   const { user, loading, isEditor } = useAuth();
   const navigate = useNavigate();
   const { data: languages } = useLanguages();
   
   const {
     isParsing,
     isImporting,
     parsedContent,
     validation,
     englishSource,
     parseDocument,
     importTranslations,
     loadEnglishSource,
     reset,
   } = useTranslationImport();
 
   const [selectedLanguage, setSelectedLanguage] = useState<string>('');
   const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
   const [selectedRecitals, setSelectedRecitals] = useState<number[]>([]);
   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
   const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState<'idle' | 'extracting' | 'parsing' | 'done' | 'error'>('idle');
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const isMountedRef = useRef(true);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
 
   useEffect(() => {
     if (!loading && !user) {
       navigate('/admin/auth');
     } else if (!loading && user && !isEditor) {
       navigate('/');
     }
   }, [user, loading, isEditor, navigate]);
 
   // Load English source on mount
   useEffect(() => {
     if (user && isEditor) {
       loadEnglishSource();
     }
   }, [user, isEditor, loadEnglishSource]);
 
   // Auto-select all valid items when parsing completes
   useEffect(() => {
     if (parsedContent && validation) {
       // Select all articles that have a match in English source
       const validArticles = parsedContent.articles
         .filter(a => !validation.duplicateArticles.includes(a.articleNumber))
         .map(a => a.articleNumber);
       setSelectedArticles(validArticles);
       
       // Select all recitals that have a match in English source
       const validRecitals = parsedContent.recitals
         .filter(r => !validation.duplicateRecitals.includes(r.recitalNumber))
         .map(r => r.recitalNumber);
       setSelectedRecitals(validRecitals);
       
       // Auto-detect language if possible
       if (parsedContent.detectedLanguage && parsedContent.detectedLanguage !== 'en') {
         setSelectedLanguage(parsedContent.detectedLanguage);
       }
     }
   }, [parsedContent, validation]);
 
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
     
     setUploadedFile(file);
    setParseProgress(0);
    setParseStatus('extracting');
    setParseError(null);
    setExtractedText('');
     
     // For PDFs, we need to use the document parser
     if (file.type === 'application/pdf') {
      try {
        setParseProgress(5);
        
        // Dynamically import pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
          if (!isMountedRef.current) return;
          setParseProgress(Math.round((i / totalPages) * 50));
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }
        
        if (!isMountedRef.current) return;
        setExtractedText(fullText);
        setParseProgress(60);
        setParseStatus('parsing');
        await parseDocument(fullText);
        if (!isMountedRef.current) return;
        setParseProgress(100);
        setParseStatus('done');
      } catch (error) {
        console.error('Failed to parse PDF:', error);
        if (!isMountedRef.current) return;
        setParseProgress(0);
        setParseStatus('error');
        setParseError(error instanceof Error ? error.message : 'Failed to extract text from PDF');
        setExtractedText('');
      }
      return;
     }
     
     // For text files, read directly
     try {
      setParseStatus('extracting');
       setParseProgress(30);
       const text = await file.text();
      setExtractedText(text);
       setParseProgress(60);
      setParseStatus('parsing');
       await parseDocument(text);
      if (!isMountedRef.current) return;
       setParseProgress(100);
      setParseStatus('done');
     } catch (error) {
       console.error('Failed to read file:', error);
      if (!isMountedRef.current) return;
       setParseProgress(0);
      setParseStatus('error');
      setParseError(error instanceof Error ? error.message : 'Failed to read file');
     }
  }, [parseDocument]);
 
  const handleTextPaste = useCallback(async (text: string) => {
     if (!text.trim()) return;
    setExtractedText(text);
     await parseDocument(text);
   }, [parseDocument]);
 
  const handleImport = useCallback(async () => {
     if (!selectedLanguage) {
       alert('Please select a target language');
       return;
     }
     
     const success = await importTranslations(selectedLanguage, selectedArticles, selectedRecitals);
     if (success) {
       // Navigate to translations page
       navigate('/admin/translations');
     }
   }, [selectedLanguage, selectedArticles, selectedRecitals, importTranslations, navigate]);
 
  const handleReset = useCallback(() => {
     reset();
     setUploadedFile(null);
     setSelectedArticles([]);
     setSelectedRecitals([]);
     setParseProgress(0);
    setParseStatus('idle');
    setParseError(null);
    setExtractedText('');
   }, [reset]);
 
  const handleArticleSelect = useCallback((articleNumber: number, selected: boolean) => {
     setSelectedArticles(prev => 
       selected 
         ? [...prev, articleNumber]
         : prev.filter(n => n !== articleNumber)
     );
   }, []);
 
  const handleRecitalSelect = useCallback((recitalNumber: number, selected: boolean) => {
     setSelectedRecitals(prev =>
       selected
         ? [...prev, recitalNumber]
         : prev.filter(n => n !== recitalNumber)
     );
   }, []);
 
  const handleSelectAllArticles = useCallback((selected: boolean) => {
     if (selected && parsedContent) {
       setSelectedArticles(parsedContent.articles.map(a => a.articleNumber));
     } else {
       setSelectedArticles([]);
     }
   }, [parsedContent]);
 
  const handleSelectAllRecitals = useCallback((selected: boolean) => {
     if (selected && parsedContent) {
       setSelectedRecitals(parsedContent.recitals.map(r => r.recitalNumber));
     } else {
       setSelectedRecitals([]);
     }
   }, [parsedContent]);
 
   // Get available languages (non-English)
   const availableLanguages = languages?.filter(l => l.code !== 'en') || [];
 
   if (loading || !user || !isEditor) {
     return (
       <Layout>
         <div className="flex items-center justify-center min-h-[60vh]">
           <Loader2 className="h-8 w-8 animate-spin" />
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
           <Link to="/admin/translations">
             <Button variant="ghost" size="icon">
               <ArrowLeft className="h-4 w-4" />
             </Button>
           </Link>
           <div className="flex-1">
             <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-2">
               <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
               Translation Import
             </h1>
             <p className="text-sm sm:text-base text-muted-foreground">
               Parse translated regulation PDFs and import content with validation
             </p>
           </div>
           {parsedContent && (
             <Button variant="outline" onClick={handleReset}>
               <RotateCcw className="h-4 w-4 mr-2" />
               Start Over
             </Button>
           )}
         </div>
 
         {/* Source Data Status */}
         <Card className="mb-6">
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <FileText className="h-5 w-5" />
               English Source Data
             </CardTitle>
           </CardHeader>
           <CardContent>
             {englishSource ? (
               <div className="flex gap-4 text-sm">
                 <Badge variant="secondary" className="gap-1">
                   <Check className="h-3 w-3" />
                   {englishSource.articles.length} Articles
                 </Badge>
                 <Badge variant="secondary" className="gap-1">
                   <Check className="h-3 w-3" />
                   {englishSource.recitals.length} Recitals
                 </Badge>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-muted-foreground">
                 <Loader2 className="h-4 w-4 animate-spin" />
                 Loading English source data...
               </div>
             )}
           </CardContent>
         </Card>
 
         {!parsedContent ? (
           /* Upload Section */
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Languages className="h-5 w-5" />
                 Upload Translated Document
               </CardTitle>
               <CardDescription>
                 Upload a PDF or paste text content from a translated version of the EHDS Regulation
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {/* File Upload */}
               <div className="border-2 border-dashed rounded-lg p-8 text-center">
                 <input
                   type="file"
                   accept=".pdf,.txt,.md"
                   onChange={handleFileUpload}
                   className="hidden"
                   id="file-upload"
                   disabled={isParsing}
                 />
                 <label
                   htmlFor="file-upload"
                   className="cursor-pointer flex flex-col items-center gap-2"
                 >
                   <Upload className="h-12 w-12 text-muted-foreground" />
                   <p className="font-medium">Click to upload or drag and drop</p>
                   <p className="text-sm text-muted-foreground">PDF, TXT, or Markdown files</p>
                 </label>
               </div>
 
               {uploadedFile && uploadedFile.type === 'application/pdf' && (
                <Alert variant={parseStatus === 'error' ? 'destructive' : 'default'}>
                  {parseStatus === 'error' ? <FileWarning className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>PDF Uploaded: {uploadedFile.name}</AlertTitle>
                  <AlertDescription>
                    {parseStatus === 'extracting' && 'Extracting text from PDF pages...'}
                    {parseStatus === 'parsing' && 'Analyzing structure and detecting articles/recitals...'}
                    {parseStatus === 'done' && 'PDF parsed successfully! Review the results below.'}
                    {parseStatus === 'error' && (parseError || 'Failed to parse PDF. Please paste the text manually below.')}
                    {parseStatus === 'idle' && 'PDF will be automatically parsed. If results are incorrect, paste the text manually below.'}
                  </AlertDescription>
                </Alert>
               )}
 
              {(parseStatus === 'extracting' || parseStatus === 'parsing') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          {parseStatus === 'extracting' ? 'Extracting text...' : 'Parsing content...'}
                        </span>
                        <span className="text-muted-foreground">{parseProgress}%</span>
                      </div>
                      <Progress value={parseProgress} className="h-2" />
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {parseStatus === 'extracting' 
                      ? 'Reading PDF pages and extracting text content...' 
                      : 'Detecting articles, recitals, and chapter boundaries...'}
                  </p>
                </div>
              )}
 
               {/* Text Paste Area */}
               <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {extractedText ? 'Extracted text (edit if needed):' : 'Or paste text content directly:'}
                  </label>
                 <textarea
                   className="w-full h-64 p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="Paste the full text content of the translated regulation here...&#10;&#10;The parser will detect:&#10;- Article markers (Article 1, Artikel 1, Artículo 1, etc.)&#10;- Recital markers ((1), (2), etc.)&#10;- Chapter boundaries (CHAPTER I, KAPITEL I, etc.)"
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                   onPaste={(e) => {
                     const text = e.clipboardData.getData('text');
                     if (text.length > 1000) {
                       e.preventDefault();
                       handleTextPaste(text);
                     }
                   }}
                   disabled={isParsing}
                 />
                 <Button
                   variant="secondary"
                   className="w-full"
                    disabled={isParsing || !extractedText.trim()}
                   onClick={() => {
                      if (extractedText.trim()) {
                        handleTextPaste(extractedText);
                      }
                   }}
                 >
                   {isParsing ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Parsing...
                     </>
                   ) : (
                     'Parse Content'
                   )}
                 </Button>
               </div>
             </CardContent>
           </Card>
         ) : (
           /* Preview and Import Section */
           <div className="space-y-6">
             {/* Language Selection */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-base">Target Language</CardTitle>
                 <CardDescription>
                   Select the language for these translations
                   {parsedContent.detectedLanguage !== 'unknown' && (
                     <span className="ml-2">
                       (Detected: <Badge variant="outline">{LANGUAGE_NAMES[parsedContent.detectedLanguage] || parsedContent.detectedLanguage}</Badge>)
                     </span>
                   )}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                   <SelectTrigger className="w-64">
                     <SelectValue placeholder="Select language" />
                   </SelectTrigger>
                   <SelectContent>
                     {availableLanguages.map((lang) => (
                       <SelectItem key={lang.code} value={lang.code}>
                         {lang.native_name} ({lang.code.toUpperCase()})
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </CardContent>
             </Card>
 
             {/* Diff Preview */}
             {englishSource && validation && (
               <TranslationDiffPreview
                 parsedArticles={parsedContent.articles}
                 parsedRecitals={parsedContent.recitals}
                  parsedDefinitions={parsedContent.definitions}
                  parsedAnnexes={parsedContent.annexes}
                  parsedFootnotes={parsedContent.footnotes}
                 englishSource={englishSource}
                 validation={validation}
                 selectedArticles={selectedArticles}
                 selectedRecitals={selectedRecitals}
                 onArticleSelect={handleArticleSelect}
                 onRecitalSelect={handleRecitalSelect}
                 onSelectAllArticles={handleSelectAllArticles}
                 onSelectAllRecitals={handleSelectAllRecitals}
               />
             )}
 
             {/* Import Button */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="text-sm text-muted-foreground">
                     Ready to import {selectedArticles.length} articles and {selectedRecitals.length} recitals
                     {selectedLanguage && (
                       <> to <Badge>{LANGUAGE_NAMES[selectedLanguage] || selectedLanguage}</Badge></>
                     )}
                   </div>
                   <Button
                     size="lg"
                     onClick={handleImport}
                     disabled={isImporting || !selectedLanguage || (selectedArticles.length === 0 && selectedRecitals.length === 0)}
                   >
                     {isImporting ? (
                       <>
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         Importing...
                       </>
                     ) : (
                       <>
                         <Check className="h-4 w-4 mr-2" />
                         Import Translations
                       </>
                     )}
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
         )}
       </div>
     </Layout>
   );
 };
 
 export default AdminTranslationImportPage;