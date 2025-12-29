import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, AlertTriangle, ExternalLink, RefreshCw, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useArticles } from "@/hooks/useArticles";
import { useRecitals } from "@/hooks/useRecitals";
import { useChapters } from "@/hooks/useChapters";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { toast } from "sonner";

interface CheckItem {
  id: string;
  category: string;
  label: string;
  description: string;
  status: "pending" | "pass" | "fail" | "na";
  notes: string;
}

const initialChecks: CheckItem[] = [
  // Data Integrity
  { id: "data-articles", category: "Data Integrity", label: "All 105 articles loaded", description: "Verify all articles are accessible from the database", status: "pending", notes: "" },
  { id: "data-recitals", category: "Data Integrity", label: "All 115 recitals loaded", description: "Verify all recitals are accessible from the database", status: "pending", notes: "" },
  { id: "data-chapters", category: "Data Integrity", label: "All 10 chapters loaded", description: "Verify chapter structure is correct", status: "pending", notes: "" },
  { id: "data-definitions", category: "Data Integrity", label: "Definitions loaded", description: "Verify all definitions from Article 2 are present", status: "pending", notes: "" },
  { id: "data-implementing", category: "Data Integrity", label: "Implementing acts loaded", description: "Verify implementing acts tracker data", status: "pending", notes: "" },
  
  // Navigation
  { id: "nav-home", category: "Navigation", label: "Homepage loads", description: "Home page renders without errors", status: "pending", notes: "" },
  { id: "nav-articles", category: "Navigation", label: "Articles page works", description: "Can browse and view individual articles", status: "pending", notes: "" },
  { id: "nav-recitals", category: "Navigation", label: "Recitals page works", description: "Can browse and view individual recitals", status: "pending", notes: "" },
  { id: "nav-search", category: "Navigation", label: "Search functionality", description: "Search returns relevant results", status: "pending", notes: "" },
  { id: "nav-sidebar", category: "Navigation", label: "Sidebar navigation", description: "All sidebar links work correctly", status: "pending", notes: "" },
  
  // Responsive Design
  { id: "resp-mobile", category: "Responsive Design", label: "Mobile view", description: "Site is usable on mobile devices (< 768px)", status: "pending", notes: "" },
  { id: "resp-tablet", category: "Responsive Design", label: "Tablet view", description: "Site is usable on tablet devices (768px - 1024px)", status: "pending", notes: "" },
  { id: "resp-desktop", category: "Responsive Design", label: "Desktop view", description: "Site looks correct on desktop (> 1024px)", status: "pending", notes: "" },
  
  // Features
  { id: "feat-bookmarks", category: "Features", label: "Bookmarks work", description: "Can save and view bookmarks (if logged in)", status: "pending", notes: "" },
  { id: "feat-print", category: "Features", label: "Print styling", description: "Articles print correctly with proper formatting", status: "pending", notes: "" },
  { id: "feat-dark", category: "Features", label: "Dark mode", description: "Dark mode toggle works and styles are correct", status: "pending", notes: "" },
  { id: "feat-font", category: "Features", label: "Font size controls", description: "Font size adjustment works", status: "pending", notes: "" },
  { id: "feat-keyboard", category: "Features", label: "Keyboard shortcuts", description: "Keyboard shortcuts work (/, ?, h, b)", status: "pending", notes: "" },
  
  // API
  { id: "api-articles", category: "API", label: "API articles endpoint", description: "GET /api-data?resource=articles returns data", status: "pending", notes: "" },
  { id: "api-recitals", category: "API", label: "API recitals endpoint", description: "GET /api-data?resource=recitals returns data", status: "pending", notes: "" },
  { id: "api-csv", category: "API", label: "API CSV export", description: "CSV format parameter works correctly", status: "pending", notes: "" },
  
  // Admin
  { id: "admin-login", category: "Admin", label: "Admin login", description: "Admin authentication works", status: "pending", notes: "" },
  { id: "admin-edit", category: "Admin", label: "Content editing", description: "Can edit articles/recitals from admin", status: "pending", notes: "" },
  { id: "admin-news", category: "Admin", label: "News management", description: "Can create and publish news summaries", status: "pending", notes: "" },
];

const AdminQAPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: recitals, isLoading: recitalsLoading } = useRecitals();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: definitions, isLoading: definitionsLoading } = useDefinitions();
  const { data: implementingActs, isLoading: iaLoading } = useImplementingActs();
  
  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    navigate("/admin");
    return null;
  }

  const updateCheck = (id: string, status: "pass" | "fail" | "na", notes?: string) => {
    setChecks(prev => prev.map(check => 
      check.id === id 
        ? { ...check, status, notes: notes ?? check.notes }
        : check
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecks(prev => prev.map(check => 
      check.id === id ? { ...check, notes } : check
    ));
  };

  const runAutoChecks = () => {
    // Data integrity auto-checks
    if (!articlesLoading && articles) {
      updateCheck("data-articles", articles.length === 105 ? "pass" : "fail", 
        `Found ${articles.length} articles`);
    }
    if (!recitalsLoading && recitals) {
      updateCheck("data-recitals", recitals.length === 115 ? "pass" : "fail",
        `Found ${recitals.length} recitals`);
    }
    if (!chaptersLoading && chapters) {
      updateCheck("data-chapters", chapters.length === 10 ? "pass" : "fail",
        `Found ${chapters.length} chapters`);
    }
    if (!definitionsLoading && definitions) {
      updateCheck("data-definitions", definitions.length > 0 ? "pass" : "fail",
        `Found ${definitions.length} definitions`);
    }
    if (!iaLoading && implementingActs) {
      updateCheck("data-implementing", implementingActs.length > 0 ? "pass" : "fail",
        `Found ${implementingActs.length} implementing acts`);
    }

    toast.success("Auto-checks completed!");
  };

  const resetChecks = () => {
    setChecks(initialChecks);
    toast.info("All checks reset");
  };

  const exportResults = () => {
    const date = new Date().toISOString().split('T')[0];
    const results = {
      date,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === "pass").length,
        failed: checks.filter(c => c.status === "fail").length,
        pending: checks.filter(c => c.status === "pending").length,
        na: checks.filter(c => c.status === "na").length,
      },
      checks: checks.map(c => ({
        category: c.category,
        label: c.label,
        status: c.status,
        notes: c.notes,
      })),
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("QA report exported!");
  };

  const categories = [...new Set(checks.map(c => c.category))];
  const filteredChecks = showOnlyFailed 
    ? checks.filter(c => c.status === "fail" || c.status === "pending")
    : checks;

  const summary = {
    passed: checks.filter(c => c.status === "pass").length,
    failed: checks.filter(c => c.status === "fail").length,
    pending: checks.filter(c => c.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                QA Checklist
              </h1>
              <p className="text-muted-foreground text-sm">Pre-deployment verification</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={runAutoChecks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Auto-Checks
            </Button>
            <Button variant="outline" size="sm" onClick={resetChecks}>
              Reset All
            </Button>
            <Button variant="default" size="sm" onClick={exportResults}>
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">{summary.passed}</Badge>
                  <span className="text-sm text-muted-foreground">Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{summary.failed}</Badge>
                  <span className="text-sm text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{summary.pending}</Badge>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-failed" 
                  checked={showOnlyFailed}
                  onCheckedChange={(checked) => setShowOnlyFailed(checked as boolean)}
                />
                <label htmlFor="show-failed" className="text-sm cursor-pointer">
                  Show only failed/pending
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checks by Category */}
        {categories.map(category => {
          const categoryChecks = filteredChecks.filter(c => c.category === category);
          if (categoryChecks.length === 0) return null;
          
          return (
            <Card key={category} className="mb-4">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {categoryChecks.map(check => (
                    <div key={check.id} className="border rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {check.status === "pass" && <Check className="h-4 w-4 text-green-500" />}
                            {check.status === "fail" && <X className="h-4 w-4 text-red-500" />}
                            {check.status === "pending" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            {check.status === "na" && <span className="text-muted-foreground text-xs">N/A</span>}
                            <span className="font-medium text-sm">{check.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{check.description}</p>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            variant={check.status === "pass" ? "default" : "outline"} 
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateCheck(check.id, "pass")}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant={check.status === "fail" ? "destructive" : "outline"} 
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateCheck(check.id, "fail")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant={check.status === "na" ? "secondary" : "outline"} 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => updateCheck(check.id, "na")}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>
                      
                      {(check.notes || check.status === "fail") && (
                        <Textarea
                          placeholder="Add notes..."
                          value={check.notes}
                          onChange={(e) => updateNotes(check.id, e.target.value)}
                          className="mt-2 text-xs min-h-[60px]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Quick Links */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">Quick Links for Testing</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {[
                { label: "Homepage", href: "/" },
                { label: "Articles", href: "/articles" },
                { label: "Recitals", href: "/recitals" },
                { label: "Definitions", href: "/definitions" },
                { label: "Implementing Acts", href: "/implementing-acts" },
                { label: "API Docs", href: "/api" },
                { label: "Search", href: "/search" },
                { label: "Help Center", href: "/help" },
              ].map(link => (
                <Button
                  key={link.href}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => window.open(link.href, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  {link.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminQAPage;
