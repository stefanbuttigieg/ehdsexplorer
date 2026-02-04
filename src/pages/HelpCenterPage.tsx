import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, Scale, Files, ListChecks, Search, Bookmark,
  ArrowLeft, ChevronRight, Info, Keyboard, HelpCircle, ExternalLink,
  Home, MessageCircle, Eye, Accessibility as AccessibilityIcon, UserPlus, Sparkles, Loader2,
  Bot, Users, StickyNote, Trophy, Globe, Highlighter, Map, Newspaper
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useHelpCenterFaqs, useFaqCategories } from '@/hooks/useHelpCenterFaq';
import { SEOHead, FAQSchema, BreadcrumbSchema } from '@/components/seo';

const HelpCenterPage = () => {
  const { user } = useAuth();
  const { data: dynamicFaqs, isLoading: faqsLoading } = useHelpCenterFaqs(true);
  const categories = useFaqCategories();
  
  // Group FAQs by category
  const groupedFaqs = dynamicFaqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof dynamicFaqs>) || {};

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  // Prepare FAQ items for schema
  const faqSchemaItems = dynamicFaqs?.map(faq => ({
    question: faq.question,
    answer: faq.answer,
  })) || [];

  return (
    <Layout>
      <SEOHead
        title="Help Center | EHDS Explorer"
        description="Learn how to navigate and use the EHDS Regulation Explorer. Find answers to frequently asked questions about the European Health Data Space."
        url="/help"
        keywords={['EHDS help', 'FAQ', 'European Health Data Space guide', 'regulation explorer help']}
      />
      {faqSchemaItems.length > 0 && (
        <FAQSchema items={faqSchemaItems} pageUrl="/help" />
      )}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Help Center', url: '/help' },
        ]}
      />
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-serif">Help Center</h1>
            <p className="text-muted-foreground mt-1">
              Learn how to navigate and use the EHDS Regulation Explorer
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Quick Navigation
            </CardTitle>
            <CardDescription>Jump to a specific topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href="#getting-started" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Getting Started</span>
              </a>
              <a href="#navigation" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Home className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Navigation</span>
              </a>
              <a href="#features" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Features</span>
              </a>
              <a href="#ai-assistant" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Assistant</span>
              </a>
              <a href="#personalization" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Personalization</span>
              </a>
              <a href="#collaboration" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Collaboration</span>
              </a>
              <a href="#accessibility" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <AccessibilityIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Accessibility</span>
              </a>
              <a href="#faq" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">FAQ</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Getting Started
          </h2>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>What is the EHDS Explorer?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The EHDS Regulation Explorer is a comprehensive tool for navigating and understanding the 
                European Health Data Space (EHDS) Regulation (EU) 2025/327. It provides easy access to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>105 Articles</strong> organized by 10 chapters and sections
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>115 Recitals</strong> with links to related articles
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>62+ Definitions</strong> from Article 2
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Implementing Acts</strong> tracker with feedback period alerts
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>4 Annexes</strong> with technical specifications
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>AI Assistant</strong> for contextual help and explanations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Stakeholder-Specific Guides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The EHDS Explorer offers tailored landing pages for different stakeholders:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <Link to="/for/citizens" className="text-primary hover:underline font-medium">For Citizens</Link> - Understand your health data rights
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <Link to="/for/healthtech" className="text-primary hover:underline font-medium">For Health Tech</Link> - Compliance checklists and requirements
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <Link to="/for/healthcare-professionals" className="text-primary hover:underline font-medium">For Healthcare Professionals</Link> - Workflow scenarios and patient rights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taking a Guided Tour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                New to the EHDS Explorer? Take our interactive guided tour to learn about all the features:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Click the <strong>Help icon</strong> (?) in the header to start the tour
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Or click <strong>"Take a Tour"</strong> in the sidebar
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Sign Up CTA - Only show if not logged in */}
        {!user && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">Unlock More Features</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a free account to save bookmarks across devices, take personal notes, 
                    highlight and annotate content, collaborate with teams, earn achievements, and receive alerts on implementing acts updates.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link to="/admin/auth">
                      <Button size="lg" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Sign Up Free
                      </Button>
                    </Link>
                    <Link to="/admin/auth">
                      <Button variant="outline" size="lg">
                        Already have an account? Log in
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Navigation */}
        <section id="navigation" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Navigation
          </h2>

          <Accordion type="multiple" className="space-y-4">
            <AccordionItem value="sidebar" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Using the Sidebar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  The sidebar provides quick access to all major sections:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><strong>Home:</strong> Dashboard with quick links and latest updates</li>
                  <li><strong>Overview:</strong> Introduction to the EHDS Regulation</li>
                  <li><strong>Definitions:</strong> Search and browse all legal terms</li>
                  <li><strong>Articles:</strong> Browse all 105 articles by chapter</li>
                  <li><strong>Recitals:</strong> Browse all 115 recitals</li>
                  <li><strong>Annexes:</strong> Technical specifications and requirements</li>
                  <li><strong>Implementing Acts:</strong> Track implementation progress</li>
                  <li><strong>News:</strong> Weekly updates and summaries</li>
                  <li><strong>Bookmarks:</strong> Your saved articles and recitals</li>
                  <li><strong>Notes:</strong> Your personal notes (logged-in users)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="chapters" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Browsing by Chapter</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  The regulation is organized into 10 chapters. Click the <strong>Chapters</strong> section 
                  in the sidebar to expand and view all chapters. Each chapter page shows:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Chapter title and description</li>
                  <li>Sections within the chapter (if any)</li>
                  <li>All articles belonging to that chapter</li>
                  <li>Key provisions marked with a star icon</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quick-explorer" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Quick Explorers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  On the homepage, you'll find numbered grids for quick access:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><strong>Articles Quick Explorer:</strong> Click any number (1-105) to jump directly to that article</li>
                  <li><strong>Recitals Quick Explorer:</strong> Click any number (1-115) to jump to that recital</li>
                  <li>Hover over numbers to preview titles before clicking</li>
                  <li>Key provisions are highlighted with a distinct color</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cross-regulation" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Map className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Cross-Regulation Map</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Explore how the EHDS connects to other EU regulations:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><strong>GDPR:</strong> Data protection requirements</li>
                  <li><strong>AI Act:</strong> AI system compliance</li>
                  <li><strong>MDR/IVDR:</strong> Medical device regulations</li>
                  <li><strong>NIS2:</strong> Cybersecurity requirements</li>
                </ul>
                <p className="text-muted-foreground">
                  Access the <Link to="/cross-regulation-map" className="text-primary hover:underline">Cross-Regulation Map</Link> from the sidebar.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* Features */}
        <section id="features" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Core Features
          </h2>

          <Accordion type="multiple" className="space-y-4">
            <AccordionItem value="search" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Search</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Use the powerful search feature to find content across the entire regulation:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Click the search bar or press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">/</kbd> to open</li>
                  <li>Search across articles, recitals, definitions, and annexes</li>
                  <li>Results show matching content with highlighted keywords</li>
                  <li>Filter by content type for focused searches</li>
                  <li>Recently viewed items appear in suggestions</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bookmarks" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Bookmarks</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Save articles and recitals for quick access later:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Click the bookmark icon on any article or recital page</li>
                  <li>Access all your bookmarks from the sidebar</li>
                  <li>Bookmarks sync across devices for logged-in users</li>
                  <li>Remove bookmarks by clicking the icon again</li>
                  <li>Share bookmarks with your team</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cross-references" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Cross-References</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Navigate between related content easily:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Articles link to related recitals and vice versa</li>
                  <li>Definitions link to their source article</li>
                  <li>Implementing acts link to related articles</li>
                  <li>Footnotes provide additional context and references</li>
                  <li>Links to external EU regulations (GDPR, AI Act, etc.)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="implementing-acts" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Implementing Acts Tracker</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Track the progress of implementing acts:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><strong>Pending:</strong> Not yet started</li>
                  <li><strong>Feedback:</strong> Open for public consultation</li>
                  <li><strong>Adopted:</strong> Officially adopted</li>
                  <li><strong>Published:</strong> Published in the Official Journal</li>
                </ul>
                <p className="text-muted-foreground">
                  The homepage highlights acts currently open for feedback with countdown timers. Subscribe to receive email alerts when status changes.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="keyboard" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Keyboard className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Keyboard Shortcuts</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Navigate faster with keyboard shortcuts:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground ml-4">
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">/</kbd> Open search</div>
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">?</kbd> Show shortcuts</div>
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">g</kbd> + <kbd className="bg-muted px-1.5 py-0.5 rounded">h</kbd> Go home</div>
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">g</kbd> + <kbd className="bg-muted px-1.5 py-0.5 rounded">a</kbd> Go to articles</div>
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">g</kbd> + <kbd className="bg-muted px-1.5 py-0.5 rounded">r</kbd> Go to recitals</div>
                  <div><kbd className="bg-muted px-1.5 py-0.5 rounded">g</kbd> + <kbd className="bg-muted px-1.5 py-0.5 rounded">d</kbd> Go to definitions</div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="news" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Weekly News Summaries</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Stay updated with EHDS-related developments:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Weekly curated summaries of EHDS news</li>
                  <li>Updates on implementing acts and regulatory changes</li>
                  <li>Access from the News section in the sidebar</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* AI Assistant */}
        <section id="ai-assistant" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            EHDS AI Assistant
          </h2>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Your AI-Powered Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The EHDS Assistant helps you understand the regulation with contextual explanations. Access it via the floating button in the bottom-right corner.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>7 Role-Based Modes:</strong> Citizen, General, Healthcare Pro, Legal, Researcher, Health Tech, Policy Maker
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>4 Explanation Levels:</strong> Expert, Professional, Student, Beginner
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Source Citations:</strong> All answers reference specific articles and recitals
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Conversation History:</strong> Logged-in users can save, favorite, and export conversations
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Personalization */}
        <section id="personalization" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Personalization
          </h2>

          <Accordion type="multiple" className="space-y-4">
            <AccordionItem value="stakeholder-filter" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="font-semibold">"View As" Stakeholder Filter</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Customize your browsing experience based on your role:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Use the "View as..." dropdown in the header to select your stakeholder type</li>
                  <li>Content is filtered to show the most relevant articles and recitals</li>
                  <li>Key provisions for your role are highlighted</li>
                  <li>The AI Assistant automatically adjusts its persona to match</li>
                  <li>Your preference is saved for future visits</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="plain-language" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Plain Language Mode</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Simplify legal text for easier understanding:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Toggle "Plain Language" on article and recital pages</li>
                  <li>AI-generated summaries in accessible language</li>
                  <li>Side-by-side comparison with original text</li>
                  <li>Provide feedback to improve translations</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="translations" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Language Support</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Access content in multiple EU languages:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Use the language selector in the footer</li>
                  <li>Translations are available for articles, recitals, and chapters</li>
                  <li>Fallback notice shown when translations are unavailable</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* Collaboration */}
        <section id="collaboration" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Collaboration Features
          </h2>

          <Accordion type="multiple" className="space-y-4">
            <AccordionItem value="notes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <StickyNote className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Personal Notes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Take notes while studying the regulation:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Create notes linked to specific articles or recitals</li>
                  <li>Organize with tags for easy filtering</li>
                  <li>Pin important notes to the top</li>
                  <li>Sync across devices when logged in</li>
                  <li>Share notes with your team</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="annotations" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Highlighter className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Highlighting & Annotations</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Mark up content as you read:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Select text to highlight with different colors</li>
                  <li>Add comments to highlighted sections</li>
                  <li>Tag annotations for organization</li>
                  <li>View all annotations from the Notes page</li>
                  <li>Export to Markdown, JSON, Notion, or Obsidian</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="teams" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Team Workspaces</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Collaborate with colleagues:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Create or join team workspaces</li>
                  <li>Share annotations and notes with team members</li>
                  <li>View team activity feed</li>
                  <li>Role-based permissions (Owner, Admin, Member, Viewer)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="achievements" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Achievements & Gamification</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Track your learning progress:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>Earn badges for reading articles and recitals</li>
                  <li>Unlock achievements for using features</li>
                  <li>Track progress with visual indicators</li>
                  <li>Play flashcard and quiz games to test knowledge</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* Accessibility */}
        <section id="accessibility" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <AccessibilityIcon className="h-6 w-6 text-primary" />
            Accessibility
          </h2>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The EHDS Explorer is designed to be accessible to all users:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Font Size Control:</strong> Adjust text size using the accessibility menu in the header
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Dark Mode:</strong> Toggle between light and dark themes
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Keyboard Navigation:</strong> Full keyboard support for all features
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Screen Reader Support:</strong> Semantic HTML and ARIA labels
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Mobile Responsive:</strong> Works on all device sizes
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Plain Language:</strong> Simplified versions of legal text
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* FAQ */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Frequently Asked Questions
          </h2>

          {faqsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dynamicFaqs && dynamicFaqs.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedFaqs).map(([category, faqs]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                    {getCategoryLabel(category)}
                  </h3>
                  <Accordion type="multiple" className="space-y-4">
                    {faqs?.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <span className="font-semibold text-left">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3 text-muted-foreground whitespace-pre-wrap">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              <AccordionItem value="what-is-ehds" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold text-left">What is the European Health Data Space (EHDS)?</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3 text-muted-foreground">
                  <p>
                    The European Health Data Space (EHDS) is a health-specific data sharing framework established by 
                    Regulation (EU) 2025/327. It aims to promote better exchange and access to different types of 
                    health data across the EU for healthcare delivery (primary use) and for research, innovation, 
                    policy-making, and regulatory activities (secondary use).
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="when-apply" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold text-left">When does the EHDS Regulation apply?</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3 text-muted-foreground">
                  <p>
                    The EHDS Regulation entered into force on 26 March 2025. Application dates are staggered through 2031.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="official-source" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold text-left">Is this the official source of the EHDS Regulation?</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3 text-muted-foreground">
                  <p>
                    No, this explorer is an unofficial tool. The official text is published in the 
                    <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202500327" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Official Journal of the European Union</a>.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </section>

        <Separator className="my-8" />
        <section id="support" className="mb-8">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Need More Help?
          </h2>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                If you have questions or need assistance:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Use the <strong>AI Assistant</strong> for instant answers about the EHDS
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Use the <strong>Report Issue</strong> button in the header to submit feedback
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Check the <Link to="/api" className="text-primary hover:underline">API Documentation</Link> for developer resources
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Visit our <a href="https://github.com/stefanbuttigieg/ehdsexplorer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub repository</a> for technical issues
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default HelpCenterPage;
