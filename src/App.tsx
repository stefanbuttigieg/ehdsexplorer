import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import UmamiAnalytics from "@/components/UmamiAnalytics";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import ArticlesPage from "./pages/ArticlesPage";
import ChapterPage from "./pages/ChapterPage";
import RecitalsPage from "./pages/RecitalsPage";
import RecitalPage from "./pages/RecitalPage";
import DefinitionsPage from "./pages/DefinitionsPage";
import SearchPage from "./pages/SearchPage";
import ImplementingActsPage from "./pages/ImplementingActsPage";
import ImplementingActDetail from "./pages/ImplementingActDetail";
import OverviewPage from "./pages/OverviewPage";
import BookmarksPage from "./pages/BookmarksPage";
import AnnexesPage from "./pages/AnnexesPage";
import AnnexDetailPage from "./pages/AnnexDetailPage";
import AdminAuthPage from "./pages/AdminAuthPage";
import AdminSetPasswordPage from "./pages/AdminSetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArticlesPage from "./pages/AdminArticlesPage";
import AdminRecitalsPage from "./pages/AdminRecitalsPage";
import AdminDefinitionsPage from "./pages/AdminDefinitionsPage";
import AdminAnnexesPage from "./pages/AdminAnnexesPage";
import AdminImplementingActsPage from "./pages/AdminImplementingActsPage";
import AdminBulkImportPage from "./pages/AdminBulkImportPage";
import AdminChaptersPage from "./pages/AdminChaptersPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import AdminJointActionDeliverablesPage from "./pages/AdminJointActionDeliverablesPage";
import AdminPublishedWorksPage from "./pages/AdminPublishedWorksPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminFootnotesPage from "./pages/AdminFootnotesPage";
import AdminHelpCenterPage from "./pages/AdminHelpCenterPage";
import AdminEmailTemplatesPage from "./pages/AdminEmailTemplatesPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookiesPolicyPage from "./pages/CookiesPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import AccessibilityStatementPage from "./pages/AccessibilityStatementPage";
import CookieConsentBanner from "./components/CookieConsentBanner";
import NotFound from "./pages/NotFound";
import MatchGamePage from "./pages/MatchGamePage";
import ApiDocsPage from "./pages/ApiDocsPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AdminNewsPage from "./pages/AdminNewsPage";
import AdminImplementingActContentPage from "./pages/AdminImplementingActContentPage";
import ProfilePage from "./pages/ProfilePage";
import HelpCenterPage from "./pages/HelpCenterPage";
import AdminPlainLanguagePage from "./pages/AdminPlainLanguagePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ehds-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UmamiAnalytics />
          <CookieConsentBanner />
          <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/chapter/:id" element={<ChapterPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/recitals" element={<RecitalsPage />} />
            <Route path="/recital/:id" element={<RecitalPage />} />
            <Route path="/definitions" element={<DefinitionsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/implementing-acts" element={<ImplementingActsPage />} />
            <Route path="/implementing-acts/:id" element={<ImplementingActDetail />} />
            <Route path="/annexes" element={<AnnexesPage />} />
            <Route path="/annex/:id" element={<AnnexDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies-policy" element={<CookiesPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/accessibility" element={<AccessibilityStatementPage />} />
            <Route path="/match-game" element={<MatchGamePage />} />
            <Route path="/api" element={<ApiDocsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/admin/auth" element={<AdminAuthPage />} />
            <Route path="/admin/set-password" element={<AdminSetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/articles" element={<AdminArticlesPage />} />
            <Route path="/admin/recitals" element={<AdminRecitalsPage />} />
            <Route path="/admin/definitions" element={<AdminDefinitionsPage />} />
            <Route path="/admin/annexes" element={<AdminAnnexesPage />} />
            <Route path="/admin/implementing-acts" element={<AdminImplementingActsPage />} />
            <Route path="/admin/implementing-acts/:id/content" element={<AdminImplementingActContentPage />} />
            <Route path="/admin/bulk-import" element={<AdminBulkImportPage />} />
            <Route path="/admin/chapters" element={<AdminChaptersPage />} />
            <Route path="/admin/overview" element={<AdminOverviewPage />} />
            <Route path="/admin/joint-action-deliverables" element={<AdminJointActionDeliverablesPage />} />
            <Route path="/admin/published-works" element={<AdminPublishedWorksPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/footnotes" element={<AdminFootnotesPage />} />
            <Route path="/admin/help" element={<AdminHelpCenterPage />} />
            <Route path="/admin/email-templates" element={<AdminEmailTemplatesPage />} />
            <Route path="/admin/news" element={<AdminNewsPage />} />
            <Route path="/admin/plain-language" element={<AdminPlainLanguagePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MaintenanceGuard>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
