import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { AchievementProvider } from "@/contexts/AchievementContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import UmamiAnalytics from "@/components/UmamiAnalytics";
import { ComparisonBar } from "@/components/ComparisonBar";
import { AchievementUnlockedToast } from "@/components/achievements/AchievementUnlockedToast";
import { LevelUpModal } from "@/components/achievements/LevelUpModal";
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
import ComparePage from "./pages/ComparePage";
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
import FlashcardGamePage from "./pages/FlashcardGamePage";
import QuizGamePage from "./pages/QuizGamePage";
import ApiDocsPage from "./pages/ApiDocsPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AdminNewsPage from "./pages/AdminNewsPage";
import AdminImplementingActContentPage from "./pages/AdminImplementingActContentPage";
import ProfilePage from "./pages/ProfilePage";
import HelpCenterPage from "./pages/HelpCenterPage";
import AdminPlainLanguagePage from "./pages/AdminPlainLanguagePage";
import AdminQAPage from "./pages/AdminQAPage";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage";
import AdminAIFeedbackPage from "./pages/AdminAIFeedbackPage";
import AdminTranslationsPage from "./pages/AdminTranslationsPage";
import AdminLanguagesPage from "./pages/AdminLanguagesPage";
import AdminHelpCenterFaqPage from "./pages/AdminHelpCenterFaqPage";
import AdminOnboardingPage from "./pages/AdminOnboardingPage";
import NotesPage from "./pages/NotesPage";
import TeamsPage from "./pages/TeamsPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import VerifySubscriptionPage from "./pages/VerifySubscriptionPage";
import ManageSubscriptionPage from "./pages/ManageSubscriptionPage";
import AchievementsPage from "./pages/AchievementsPage";
import HealthAuthoritiesPage from "./pages/HealthAuthoritiesPage";
import AdminHealthAuthoritiesPage from "./pages/AdminHealthAuthoritiesPage";
import AdminLegalPagesPage from "./pages/AdminLegalPagesPage";
import AdminCountryLegislationPage from "./pages/AdminCountryLegislationPage";
import AdminCrossRegulationPage from "./pages/AdminCrossRegulationPage";
import AdminImplementationTrackerPage from "./pages/AdminImplementationTrackerPage";
import CrossRegulationMapPage from "./pages/CrossRegulationMapPage";
import AdminCountryAssignmentsPage from "./pages/AdminCountryAssignmentsPage";
import CountryManagerDashboard from "./pages/CountryManagerDashboard";
import AdminRolePermissionsPage from "./pages/AdminRolePermissionsPage";
import AdminFeatureFlagsPage from "./pages/AdminFeatureFlagsPage";
import AdminObligationsPage from "./pages/AdminObligationsPage";
import ForCitizensPage from "./pages/ForCitizensPage";
import ForHealthTechPage from "./pages/ForHealthTechPage";
import ForHealthcareProPage from "./pages/ForHealthcareProPage";
import ScenarioFinderPage from "./pages/ScenarioFinderPage";
import AdminLandingPagesPage from "./pages/AdminLandingPagesPage";

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

// Wrappers to use achievements hooks within providers
const AchievementToastWrapper = () => <AchievementUnlockedToast />;
const LevelUpModalWrapper = () => <LevelUpModal />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ehds-theme">
      <LanguageProvider>
        <ComparisonProvider>
          <AchievementProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <UmamiAnalytics />
                <CookieConsentBanner />
                <ComparisonBar />
                <AchievementToastWrapper />
                <LevelUpModalWrapper />
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
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies-policy" element={<CookiesPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/accessibility" element={<AccessibilityStatementPage />} />
            <Route path="/match-game" element={<MatchGamePage />} />
            <Route path="/flashcards" element={<FlashcardGamePage />} />
            <Route path="/quiz" element={<QuizGamePage />} />
            <Route path="/api" element={<ApiDocsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/verify-subscription" element={<VerifySubscriptionPage />} />
            <Route path="/manage-subscription" element={<ManageSubscriptionPage />} />
            <Route path="/health-authorities" element={<HealthAuthoritiesPage />} />
            <Route path="/cross-regulation-map" element={<CrossRegulationMapPage />} />
            <Route path="/for/citizens" element={<ForCitizensPage />} />
            <Route path="/for/healthtech" element={<ForHealthTechPage />} />
            <Route path="/for/healthcare-professionals" element={<ForHealthcareProPage />} />
            <Route path="/scenario-finder" element={<ScenarioFinderPage />} />
            <Route path="/admin/auth" element={<AdminAuthPage />} />
            <Route path="/admin/set-password" element={<AdminSetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-countries" element={<CountryManagerDashboard />} />
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
            <Route path="/admin/qa" element={<AdminQAPage />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="/admin/ai-feedback" element={<AdminAIFeedbackPage />} />
            <Route path="/admin/translations" element={<AdminTranslationsPage />} />
            <Route path="/admin/languages" element={<AdminLanguagesPage />} />
            <Route path="/admin/help-center-faqs" element={<AdminHelpCenterFaqPage />} />
            <Route path="/admin/onboarding" element={<AdminOnboardingPage />} />
            <Route path="/admin/health-authorities" element={<AdminHealthAuthoritiesPage />} />
            <Route path="/admin/legal-pages" element={<AdminLegalPagesPage />} />
            <Route path="/admin/country-legislation" element={<AdminCountryLegislationPage />} />
            <Route path="/admin/cross-regulation" element={<AdminCrossRegulationPage />} />
            <Route path="/admin/implementation-tracker" element={<AdminImplementationTrackerPage />} />
            <Route path="/admin/obligations" element={<AdminObligationsPage />} />
            <Route path="/admin/country-assignments" element={<AdminCountryAssignmentsPage />} />
            <Route path="/admin/role-permissions" element={<AdminRolePermissionsPage />} />
            <Route path="/admin/feature-flags" element={<AdminFeatureFlagsPage />} />
            <Route path="/admin/landing-pages" element={<AdminLandingPagesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MaintenanceGuard>
          </BrowserRouter>
          </TooltipProvider>
          </AchievementProvider>
        </ComparisonProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
