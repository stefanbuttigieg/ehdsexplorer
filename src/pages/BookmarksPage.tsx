import { Link } from "react-router-dom";
import { Bookmark, FileText, ListChecks, Download, FileJson, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useArticles } from "@/hooks/useArticles";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { getRecitalById } from "@/data/recitals";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";

interface ExportBookmark {
  type: string;
  id: number | string;
  title: string;
  description?: string;
  addedAt: string;
  url: string;
}

const BookmarksPage = () => {
  const { bookmarks, getBookmarksByType, toggleBookmark } = useBookmarks();
  const { data: articles = [] } = useArticles();
  const { data: implementingActs = [] } = useImplementingActs();

  const articleBookmarks = getBookmarksByType('article');
  const recitalBookmarks = getBookmarksByType('recital');
  const actBookmarks = getBookmarksByType('act');

  const getArticleById = (id: number) => articles.find(a => a.article_number === id);
  const getActById = (id: string) => implementingActs.find(a => a.id === id);

  const prepareExportData = (): ExportBookmark[] => {
    const exportData: ExportBookmark[] = [];
    const baseUrl = window.location.origin;

    articleBookmarks.forEach(b => {
      const article = getArticleById(b.id as number);
      if (article) {
        exportData.push({
          type: 'Article',
          id: article.article_number,
          title: `Article ${article.article_number}: ${article.title}`,
          description: article.content?.substring(0, 200) + '...',
          addedAt: b.addedAt,
          url: `${baseUrl}/article/${article.article_number}`,
        });
      }
    });

    recitalBookmarks.forEach(b => {
      const recital = getRecitalById(b.id as number);
      if (recital) {
        exportData.push({
          type: 'Recital',
          id: recital.id,
          title: `Recital ${recital.id}`,
          description: recital.content?.substring(0, 200) + '...',
          addedAt: b.addedAt,
          url: `${baseUrl}/recital/${recital.id}`,
        });
      }
    });

    actBookmarks.forEach(b => {
      const act = getActById(b.id as string);
      if (act) {
        exportData.push({
          type: 'Implementing Act',
          id: act.id,
          title: `${act.articleReference}: ${act.title}`,
          description: act.description?.substring(0, 200) + '...',
          addedAt: b.addedAt,
          url: `${baseUrl}/implementing-acts/${act.id}`,
        });
      }
    });

    return exportData;
  };

  const exportToJSON = () => {
    const data = prepareExportData();
    const json = JSON.stringify({
      exportedAt: new Date().toISOString(),
      source: 'EHDS Explorer',
      bookmarks: data,
    }, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ehds-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Bookmarks exported to JSON');
  };

  const exportToPDF = () => {
    const data = prepareExportData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EHDS Explorer Bookmarks</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
            h2 { color: #2c5282; margin-top: 30px; }
            .bookmark { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .bookmark-type { background: #ebf8ff; color: #2b6cb0; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .bookmark-title { font-weight: bold; margin: 10px 0 5px; }
            .bookmark-description { color: #718096; font-size: 14px; }
            .bookmark-meta { color: #a0aec0; font-size: 12px; margin-top: 10px; }
            .footer { margin-top: 40px; text-align: center; color: #a0aec0; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>EHDS Explorer Bookmarks</h1>
          <p>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          
          ${data.length === 0 ? '<p>No bookmarks to export.</p>' : data.map(b => `
            <div class="bookmark">
              <span class="bookmark-type">${b.type}</span>
              <div class="bookmark-title">${b.title}</div>
              ${b.description ? `<div class="bookmark-description">${b.description}</div>` : ''}
              <div class="bookmark-meta">Added: ${new Date(b.addedAt).toLocaleDateString()} | URL: ${b.url}</div>
            </div>
          `).join('')}
          
          <div class="footer">Generated by EHDS Explorer</div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('PDF export opened in new window');
  };

  if (bookmarks.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Bookmarks" }]} />
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">No bookmarks yet</h1>
            <p className="text-muted-foreground mb-6">Save articles, recitals, and implementing acts for quick access</p>
            <Link to="/"><Button>Start exploring</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Bookmarks" }]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-serif">Bookmarks</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {articleBookmarks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Articles</h2>
            <div className="space-y-3">
              {articleBookmarks.map(b => {
                const article = getArticleById(b.id as number);
                return article ? (
                  <Link key={b.id} to={`/article/${b.id}`}>
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">Article {article.article_number}</Badge>
                          <h3 className="font-medium">{article.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); toggleBookmark('article', b.id); }}>
                          <Bookmark className="h-4 w-4 fill-current" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}

        {actBookmarks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ListChecks className="h-5 w-5" /> Implementing Acts</h2>
            <div className="space-y-3">
              {actBookmarks.map(b => {
                const act = getActById(b.id as string);
                return act ? (
                  <Link key={b.id} to={`/implementing-acts/${b.id}`}>
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">{act.articleReference}</Badge>
                          <h3 className="font-medium">{act.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); toggleBookmark('act', b.id); }}>
                          <Bookmark className="h-4 w-4 fill-current" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookmarksPage;
