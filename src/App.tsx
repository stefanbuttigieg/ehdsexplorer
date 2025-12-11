import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import ChapterPage from "./pages/ChapterPage";
import RecitalsPage from "./pages/RecitalsPage";
import DefinitionsPage from "./pages/DefinitionsPage";
import SearchPage from "./pages/SearchPage";
import ImplementingActsPage from "./pages/ImplementingActsPage";
import ImplementingActDetail from "./pages/ImplementingActDetail";
import OverviewPage from "./pages/OverviewPage";
import BookmarksPage from "./pages/BookmarksPage";
import AnnexesPage from "./pages/AnnexesPage";
import AnnexDetailPage from "./pages/AnnexDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ehds-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/chapter/:id" element={<ChapterPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/recitals" element={<RecitalsPage />} />
            <Route path="/recital/:id" element={<RecitalsPage />} />
            <Route path="/definitions" element={<DefinitionsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/implementing-acts" element={<ImplementingActsPage />} />
            <Route path="/implementing-acts/:id" element={<ImplementingActDetail />} />
            <Route path="/annexes" element={<AnnexesPage />} />
            <Route path="/annex/:id" element={<AnnexDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
