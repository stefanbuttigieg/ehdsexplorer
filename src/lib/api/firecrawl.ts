 import { supabase } from '@/integrations/supabase/client';
 
 type FirecrawlResponse<T = any> = {
   success: boolean;
   error?: string;
   data?: T;
 };
 
 type ScrapeOptions = {
   formats?: ('markdown' | 'html' | 'rawHtml' | 'links')[];
   onlyMainContent?: boolean;
   waitFor?: number;
 };
 
 export const firecrawlApi = {
   // Scrape a single URL
   async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
     const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
       body: { url, options },
     });
 
     if (error) {
       return { success: false, error: error.message };
     }
     return data;
   },
 };