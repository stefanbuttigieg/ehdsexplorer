import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { AchievementProvider } from "@/contexts/AchievementContext";
import { StakeholderProvider } from "@/contexts/StakeholderContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import UmamiAnalytics from "@/components/UmamiAnalytics";
import { ComparisonBar } from "@/components/ComparisonBar";
import { AchievementUnlockedToast } from "@/components/achievements/AchievementUnlockedToast";
import { LevelUpModal } from "@/components/achievements/LevelUpModal";
import CookieConsentBanner from "./components/CookieConsentBanner";

// Eagerly load Index for fastest FCP/LCP on homepage
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ChapterPage = lazy(() => import("./pages/ChapterPage"));
const RecitalsPage = lazy(() => import("./pages/RecitalsPage"));
const RecitalPage = lazy(() => import("./pages/RecitalPage"));
const DefinitionsPage = lazy(() => import("./pages/DefinitionsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ImplementingActsPage = lazy(() => import("./pages/ImplementingActsPage"));
const ImplementingActDetail = lazy(() => import("./pages/ImplementingActDetail"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const AnnexesPage = lazy(() => import("./pages/AnnexesPage"));
const AnnexDetailPage = lazy(() => import("./pages/AnnexDetailPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const AdminAuthPage = lazy(() => import("./pages/AdminAuthPage"));
const AdminSetPasswordPage = lazy(() => import("./pages/AdminSetPasswordPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminArticlesPage = lazy(() => import("./pages/AdminArticlesPage"));
const AdminRecitalsPage = lazy(() => import("./pages/AdminRecitalsPage"));
const AdminDefinitionsPage = lazy(() => import("./pages/AdminDefinitionsPage"));
const AdminAnnexesPage = lazy(() => import("./pages/AdminAnnexesPage"));
const AdminImplementingActsPage = lazy(() => import("./pages/AdminImplementingActsPage"));
const AdminBulkImportPage = lazy(() => import("./pages/AdminBulkImportPage"));
const AdminChaptersPage = lazy(() => import("./pages/AdminChaptersPage"));
const AdminOverviewPage = lazy(() => import("./pages/AdminOverviewPage"));
const AdminJointActionDeliverablesPage = lazy(() => import("./pages/AdminJointActionDeliverablesPage"));
const AdminPublishedWorksPage = lazy(() => import("./pages/AdminPublishedWorksPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminFootnotesPage = lazy(() => import("./pages/AdminFootnotesPage"));
const AdminHelpCenterPage = lazy(() => import("./pages/AdminHelpCenterPage"));
const AdminEmailTemplatesPage = lazy(() => import("./pages/AdminEmailTemplatesPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const CookiesPolicyPage = lazy(() => import("./pages/CookiesPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const AccessibilityStatementPage = lazy(() => import("./pages/AccessibilityStatementPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MatchGamePage = lazy(() => import("./pages/MatchGamePage"));
const FlashcardGamePage = lazy(() => import("./pages/FlashcardGamePage"));
const QuizGamePage = lazy(() => import("./pages/QuizGamePage"));
const WordSearchGamePage = lazy(() => import("./pages/WordSearchGamePage"));
const TrueFalseGamePage = lazy(() => import("./pages/TrueFalseGamePage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const AdminNewsPage = lazy(() => import("./pages/AdminNewsPage"));
const AdminImplementingActContentPage = lazy(() => import("./pages/AdminImplementingActContentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const AdminPlainLanguagePage = lazy(() => import("./pages/AdminPlainLanguagePage"));
const AdminQAPage = lazy(() => import("./pages/AdminQAPage"));
const AdminSubscriptionsPage = lazy(() => import("./pages/AdminSubscriptionsPage"));
const AdminAIFeedbackPage = lazy(() => import("./pages/AdminAIFeedbackPage"));
const AdminTranslationsPage = lazy(() => import("./pages/AdminTranslationsPage"));
const AdminLanguagesPage = lazy(() => import("./pages/AdminLanguagesPage"));
const AdminHelpCenterFaqPage = lazy(() => import("./pages/AdminHelpCenterFaqPage"));
const AdminOnboardingPage = lazy(() => import("./pages/AdminOnboardingPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const VerifySubscriptionPage = lazy(() => import("./pages/VerifySubscriptionPage"));
const ManageSubscriptionPage = lazy(() => import("./pages/ManageSubscriptionPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const HealthAuthoritiesPage = lazy(() => import("./pages/HealthAuthoritiesPage"));
const AdminHealthAuthoritiesPage = lazy(() => import("./pages/AdminHealthAuthoritiesPage"));
const AdminLegalPagesPage = lazy(() => import("./pages/AdminLegalPagesPage"));
const AdminCountryLegislationPage = lazy(() => import("./pages/AdminCountryLegislationPage"));
const AdminCrossRegulationPage = lazy(() => import("./pages/AdminCrossRegulationPage"));
const AdminImplementationTrackerPage = lazy(() => import("./pages/AdminImplementationTrackerPage"));
const CrossRegulationMapPage = lazy(() => import("./pages/CrossRegulationMapPage"));
const AdminCountryAssignmentsPage = lazy(() => import("./pages/AdminCountryAssignmentsPage"));
const CountryManagerDashboard = lazy(() => import("./pages/CountryManagerDashboard"));
const AdminRolePermissionsPage = lazy(() => import("./pages/AdminRolePermissionsPage"));
const AdminFeatureFlagsPage = lazy(() => import("./pages/AdminFeatureFlagsPage"));
const AdminObligationsPage = lazy(() => import("./pages/AdminObligationsPage"));
const ForCitizensPage = lazy(() => import("./pages/ForCitizensPage"));
const ForHealthTechPage = lazy(() => import("./pages/ForHealthTechPage"));
const ForHealthcareProPage = lazy(() => import("./pages/ForHealthcareProPage"));
const ScenarioFinderPage = lazy(() => import("./pages/ScenarioFinderPage"));
const AdminLandingPagesPage = lazy(() => import("./pages/AdminLandingPagesPage"));
const AdminTopicIndexPage = lazy(() => import("./pages/AdminTopicIndexPage"));
const TopicIndexPage = lazy(() => import("./pages/TopicIndexPage"));
const AdminEhdsiKpisPage = lazy(() => import("./pages/AdminEhdsiKpisPage"));
const AdminApiLogsPage = lazy(() => import("./pages/AdminApiLogsPage"));
const AdminApiDocsPage = lazy(() => import("./pages/AdminApiDocsPage"));
const AdminSEOPage = lazy(() => import("./pages/AdminSEOPage"));
const AdminSecuritySettingsPage = lazy(() => import("./pages/AdminSecuritySettingsPage"));
const AdminTranslationImportPage = lazy(() => import("./pages/AdminTranslationImportPage"));
const ToolsHubPage = lazy(() => import("./pages/ToolsHubPage"));

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

// Minimal loading fallback that matches the initial loader style
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

// Wrappers to use achievements hooks within providers
const AchievementToastWrapper = () => <AchievementUnlockedToast />;
const LevelUpModalWrapper = () => <LevelUpModal />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ehds-theme">
      <LanguageProvider>
        <StakeholderProvider>
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
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/word-search" element={<WordSearchGamePage />} />
            <Route path="/true-false" element={<TrueFalseGamePage />} />
            <Route path="/games" element={<GamesPage />} />
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
            <Route path="/topic-index" element={<TopicIndexPage />} />
            <Route path="/tools" element={<ToolsHubPage />} />
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
            <Route path="/admin/topic-index" element={<AdminTopicIndexPage />} />
            <Route path="/admin/ehdsi-kpis" element={<AdminEhdsiKpisPage />} />
            <Route path="/admin/api-logs" element={<AdminApiLogsPage />} />
            <Route path="/admin/api-docs" element={<AdminApiDocsPage />} />
            <Route path="/admin/seo" element={<AdminSEOPage />} />
            <Route path="/admin/security" element={<AdminSecuritySettingsPage />} />
            <Route path="/admin/translation-import" element={<AdminTranslationImportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </MaintenanceGuard>
          </BrowserRouter>
            </TooltipProvider>
            </AchievementProvider>
          </ComparisonProvider>
        </StakeholderProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
