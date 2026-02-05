 import { useState, useMemo } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronRight, Eye, Search, BookOpen, FileText, StickyNote } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ParsedArticle, ParsedRecital, ParsedDefinition, ParsedAnnex, ParsedFootnote, EnglishSource, ValidationResult } from '@/hooks/useTranslationImport';
 
 interface TranslationDiffPreviewProps {
   parsedArticles: ParsedArticle[];
   parsedRecitals: ParsedRecital[];
  parsedDefinitions: ParsedDefinition[];
  parsedAnnexes: ParsedAnnex[];
  parsedFootnotes: ParsedFootnote[];
   englishSource: EnglishSource;
   validation: ValidationResult;
   selectedArticles: number[];
   selectedRecitals: number[];
   onArticleSelect: (articleNumber: number, selected: boolean) => void;
   onRecitalSelect: (recitalNumber: number, selected: boolean) => void;
   onSelectAllArticles: (selected: boolean) => void;
   onSelectAllRecitals: (selected: boolean) => void;
 }
 
 export function TranslationDiffPreview({
   parsedArticles,
   parsedRecitals,
  parsedDefinitions,
  parsedAnnexes,
  parsedFootnotes,
   englishSource,
   validation,
   selectedArticles,
   selectedRecitals,
   onArticleSelect,
   onRecitalSelect,
   onSelectAllArticles,
   onSelectAllRecitals,
 }: TranslationDiffPreviewProps) {
   const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
   const [expandedRecitals, setExpandedRecitals] = useState<Set<number>>(new Set());
   const [searchQuery, setSearchQuery] = useState('');
   const [showOnlyMissing, setShowOnlyMissing] = useState(false);
 
   // Filter articles based on search
   const filteredArticles = useMemo(() => {
     let articles = parsedArticles;
     
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       articles = articles.filter(
         a => a.title.toLowerCase().includes(query) ||
              a.content.toLowerCase().includes(query) ||
              a.articleNumber.toString().includes(query)
       );
     }
     
     return articles;
   }, [parsedArticles, searchQuery]);
 
   const filteredRecitals = useMemo(() => {
     let recitals = parsedRecitals;
     
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       recitals = recitals.filter(
         r => r.content.toLowerCase().includes(query) ||
              r.recitalNumber.toString().includes(query)
       );
     }
     
     return recitals;
   }, [parsedRecitals, searchQuery]);
 
   // Create a map for quick English source lookup
   const englishArticleMap = useMemo(() => 
     new Map(englishSource.articles.map(a => [a.article_number, a])),
     [englishSource.articles]
   );
 
   const englishRecitalMap = useMemo(() =>
     new Map(englishSource.recitals.map(r => [r.recital_number, r])),
     [englishSource.recitals]
   );
 
   const toggleArticleExpand = (num: number) => {
     setExpandedArticles(prev => {
       const next = new Set(prev);
       if (next.has(num)) {
         next.delete(num);
       } else {
         next.add(num);
       }
       return next;
     });
   };
 
   const toggleRecitalExpand = (num: number) => {
     setExpandedRecitals(prev => {
       const next = new Set(prev);
       if (next.has(num)) {
         next.delete(num);
       } else {
         next.add(num);
       }
       return next;
     });
   };
 
   const allArticlesSelected = parsedArticles.length > 0 && 
     parsedArticles.every(a => selectedArticles.includes(a.articleNumber));
   
   const allRecitalsSelected = parsedRecitals.length > 0 &&
     parsedRecitals.every(r => selectedRecitals.includes(r.recitalNumber));
 
   return (
     <div className="space-y-4">
       {/* Validation Summary */}
      <Card className={validation.isValid ? 'border-primary/50' : 'border-destructive/50'}>
         <CardHeader className="pb-2">
           <CardTitle className="text-base flex items-center gap-2">
             {validation.isValid ? (
              <Check className="h-5 w-5 text-primary" />
             ) : (
               <AlertTriangle className="h-5 w-5 text-destructive" />
             )}
             Validation Summary
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-2">
           <div className="flex gap-4 text-sm">
             <span>Articles: <Badge variant="secondary">{validation.articleCount} / 105</Badge></span>
             <span>Recitals: <Badge variant="secondary">{validation.recitalCount} / 115</Badge></span>
              {validation.definitionCount > 0 && (
                <span>Definitions: <Badge variant="secondary">{validation.definitionCount}</Badge></span>
              )}
              {validation.annexCount > 0 && (
                <span>Annexes: <Badge variant="secondary">{validation.annexCount}</Badge></span>
              )}
              {validation.footnoteCount > 0 && (
                <span>Footnotes: <Badge variant="secondary">{validation.footnoteCount}</Badge></span>
              )}
           </div>
           
           {validation.errors.length > 0 && (
             <div className="space-y-1">
               {validation.errors.map((error, i) => (
                 <p key={i} className="text-sm text-destructive flex items-start gap-1">
                   <X className="h-4 w-4 shrink-0 mt-0.5" />
                   {error}
                 </p>
               ))}
             </div>
           )}
           
           {validation.warnings.length > 0 && (
             <div className="space-y-1">
               {validation.warnings.map((warning, i) => (
                  <p key={i} className="text-sm text-orange-600 dark:text-orange-400 flex items-start gap-1">
                   <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                   {warning}
                 </p>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Search and Filters */}
       <div className="flex gap-2 items-center">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search articles or recitals..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-9"
           />
         </div>
       </div>
 
       {/* Content Preview Tabs */}
       <Tabs defaultValue="articles">
         <TabsList>
           <TabsTrigger value="articles">
             Articles ({filteredArticles.length})
           </TabsTrigger>
           <TabsTrigger value="recitals">
             Recitals ({filteredRecitals.length})
           </TabsTrigger>
            {parsedDefinitions.length > 0 && (
              <TabsTrigger value="definitions">
                Definitions ({parsedDefinitions.length})
              </TabsTrigger>
            )}
            {parsedAnnexes.length > 0 && (
              <TabsTrigger value="annexes">
                Annexes ({parsedAnnexes.length})
              </TabsTrigger>
            )}
            {parsedFootnotes.length > 0 && (
              <TabsTrigger value="footnotes">
                Footnotes ({parsedFootnotes.length})
              </TabsTrigger>
            )}
         </TabsList>
 
         <TabsContent value="articles" className="mt-4">
           <div className="flex items-center gap-2 mb-3">
             <Checkbox
               id="select-all-articles"
               checked={allArticlesSelected}
               onCheckedChange={(checked) => onSelectAllArticles(!!checked)}
             />
             <label htmlFor="select-all-articles" className="text-sm font-medium">
               Select all articles for import
             </label>
             <Badge variant="outline" className="ml-auto">
               {selectedArticles.length} selected
             </Badge>
           </div>
 
           <ScrollArea className="h-[500px] border rounded-md">
             <div className="p-2 space-y-2">
               {filteredArticles.map((article) => {
                 const englishArticle = englishArticleMap.get(article.articleNumber);
                 const isExpanded = expandedArticles.has(article.articleNumber);
                 const isSelected = selectedArticles.includes(article.articleNumber);
                 const isDuplicate = validation.duplicateArticles.includes(article.articleNumber);
 
                 return (
                   <Collapsible
                     key={article.articleNumber}
                     open={isExpanded}
                     onOpenChange={() => toggleArticleExpand(article.articleNumber)}
                   >
                    <div className={`border rounded-md ${isDuplicate ? 'border-orange-500' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
                       <div className="flex items-center gap-2 p-3">
                         <Checkbox
                           checked={isSelected}
                           onCheckedChange={(checked) => onArticleSelect(article.articleNumber, !!checked)}
                           onClick={(e) => e.stopPropagation()}
                         />
                         <CollapsibleTrigger asChild>
                           <Button variant="ghost" size="sm" className="p-0 h-auto">
                             {isExpanded ? (
                               <ChevronDown className="h-4 w-4" />
                             ) : (
                               <ChevronRight className="h-4 w-4" />
                             )}
                           </Button>
                         </CollapsibleTrigger>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="shrink-0">
                               Art. {article.articleNumber}
                             </Badge>
                             <span className="text-sm font-medium truncate">
                               {article.title}
                             </span>
                           </div>
                         </div>
                         {isDuplicate && (
                           <Badge variant="destructive" className="shrink-0">Duplicate</Badge>
                         )}
                         {!englishArticle && (
                           <Badge variant="secondary" className="shrink-0">No English match</Badge>
                         )}
                         <Badge variant="outline" className="shrink-0 text-xs">
                           {article.content.length} chars
                         </Badge>
                       </div>
                       
                       <CollapsibleContent>
                         <div className="border-t p-3 grid grid-cols-2 gap-4">
                           <div>
                             <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                               <Eye className="h-3 w-3" /> Translated Content
                             </h4>
                             <div className="text-sm bg-muted/50 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                               {article.content.slice(0, 500)}
                               {article.content.length > 500 && '...'}
                             </div>
                           </div>
                           <div>
                             <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                               English Source
                             </h4>
                             {englishArticle ? (
                              <div className="text-sm bg-primary/5 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                                 <p className="font-medium mb-1">{englishArticle.title}</p>
                                 {englishArticle.content.slice(0, 500)}
                                 {englishArticle.content.length > 500 && '...'}
                               </div>
                             ) : (
                               <div className="text-sm text-muted-foreground italic p-2">
                                 No matching English article found
                               </div>
                             )}
                           </div>
                         </div>
                       </CollapsibleContent>
                     </div>
                   </Collapsible>
                 );
               })}
 
               {filteredArticles.length === 0 && (
                 <p className="text-center text-muted-foreground py-8">
                   No articles found
                 </p>
               )}
             </div>
           </ScrollArea>
         </TabsContent>
 
         <TabsContent value="recitals" className="mt-4">
           <div className="flex items-center gap-2 mb-3">
             <Checkbox
               id="select-all-recitals"
               checked={allRecitalsSelected}
               onCheckedChange={(checked) => onSelectAllRecitals(!!checked)}
             />
             <label htmlFor="select-all-recitals" className="text-sm font-medium">
               Select all recitals for import
             </label>
             <Badge variant="outline" className="ml-auto">
               {selectedRecitals.length} selected
             </Badge>
           </div>
 
           <ScrollArea className="h-[500px] border rounded-md">
             <div className="p-2 space-y-2">
               {filteredRecitals.map((recital) => {
                 const englishRecital = englishRecitalMap.get(recital.recitalNumber);
                 const isExpanded = expandedRecitals.has(recital.recitalNumber);
                 const isSelected = selectedRecitals.includes(recital.recitalNumber);
                 const isDuplicate = validation.duplicateRecitals.includes(recital.recitalNumber);
 
                 return (
                   <Collapsible
                     key={recital.recitalNumber}
                     open={isExpanded}
                     onOpenChange={() => toggleRecitalExpand(recital.recitalNumber)}
                   >
                    <div className={`border rounded-md ${isDuplicate ? 'border-orange-500' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
                       <div className="flex items-center gap-2 p-3">
                         <Checkbox
                           checked={isSelected}
                           onCheckedChange={(checked) => onRecitalSelect(recital.recitalNumber, !!checked)}
                           onClick={(e) => e.stopPropagation()}
                         />
                         <CollapsibleTrigger asChild>
                           <Button variant="ghost" size="sm" className="p-0 h-auto">
                             {isExpanded ? (
                               <ChevronDown className="h-4 w-4" />
                             ) : (
                               <ChevronRight className="h-4 w-4" />
                             )}
                           </Button>
                         </CollapsibleTrigger>
                         <Badge variant="outline" className="shrink-0">
                           ({recital.recitalNumber})
                         </Badge>
                         <span className="text-sm truncate flex-1">
                           {recital.content.slice(0, 80)}...
                         </span>
                         {isDuplicate && (
                           <Badge variant="destructive" className="shrink-0">Duplicate</Badge>
                         )}
                         <Badge variant="outline" className="shrink-0 text-xs">
                           {recital.content.length} chars
                         </Badge>
                       </div>
                       
                       <CollapsibleContent>
                         <div className="border-t p-3 grid grid-cols-2 gap-4">
                           <div>
                             <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                               <Eye className="h-3 w-3" /> Translated Content
                             </h4>
                             <div className="text-sm bg-muted/50 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                               {recital.content}
                             </div>
                           </div>
                           <div>
                             <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                               English Source
                             </h4>
                             {englishRecital ? (
                              <div className="text-sm bg-primary/5 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                                 {englishRecital.content}
                               </div>
                             ) : (
                               <div className="text-sm text-muted-foreground italic p-2">
                                 No matching English recital found
                               </div>
                             )}
                           </div>
                         </div>
                       </CollapsibleContent>
                     </div>
                   </Collapsible>
                 );
               })}
 
               {filteredRecitals.length === 0 && (
                 <p className="text-center text-muted-foreground py-8">
                   No recitals found
                 </p>
               )}
             </div>
           </ScrollArea>
         </TabsContent>

          {/* Definitions Tab */}
          <TabsContent value="definitions" className="mt-4">
            <ScrollArea className="h-[500px] border rounded-md">
              <div className="p-2 space-y-2">
                {parsedDefinitions.map((def) => (
                  <div key={def.definitionNumber} className="border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">({def.definitionNumber})</Badge>
                      <span className="font-medium">{def.term}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{def.definition.slice(0, 200)}...</p>
                  </div>
                ))}
                {parsedDefinitions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No definitions extracted. Definitions are parsed from Article 2.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Annexes Tab */}
          <TabsContent value="annexes" className="mt-4">
            <ScrollArea className="h-[500px] border rounded-md">
              <div className="p-2 space-y-2">
                {parsedAnnexes.map((annex) => (
                  <div key={annex.annexNumber} className="border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">ANNEX {annex.romanNumeral}</Badge>
                      <span className="font-medium">{annex.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {annex.content.slice(0, 300)}...
                      <Badge variant="secondary" className="ml-2">{annex.content.length} chars</Badge>
                    </p>
                  </div>
                ))}
                {parsedAnnexes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No annexes found. Look for ANNEX I, ANNEX II markers.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Footnotes Tab */}
          <TabsContent value="footnotes" className="mt-4">
            <ScrollArea className="h-[500px] border rounded-md">
              <div className="p-2 space-y-2">
                {parsedFootnotes.map((fn, idx) => (
                  <div key={idx} className="border rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">({fn.marker})</Badge>
                      <p className="text-sm">{fn.content}</p>
                    </div>
                  </div>
                ))}
                {parsedFootnotes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No footnotes found. Footnotes are detected at the document end.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
       </Tabs>
     </div>
   );
 }