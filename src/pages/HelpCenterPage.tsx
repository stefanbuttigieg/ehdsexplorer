import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, Scale, Files, ListChecks, Search, Bookmark,
  ArrowLeft, ChevronRight, Info, Keyboard, HelpCircle, ExternalLink,
  Home, MessageCircle, Eye, Accessibility as AccessibilityIcon
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

const HelpCenterPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
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
              <a href="#accessibility" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <AccessibilityIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Accessibility</span>
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
                European Health Data Space (EHDS) Regulation. It provides easy access to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>105 Articles</strong> organized by chapters and sections
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
                  <strong>Implementing Acts</strong> with feedback tracking
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>4 Annexes</strong> with technical specifications
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
                  <li><strong>Articles:</strong> Browse all 105 articles</li>
                  <li><strong>Recitals:</strong> Browse all 115 recitals</li>
                  <li><strong>Annexes:</strong> Technical specifications and requirements</li>
                  <li><strong>Implementing Acts:</strong> Track implementation progress</li>
                  <li><strong>News:</strong> Weekly updates and summaries</li>
                  <li><strong>Bookmarks:</strong> Your saved articles and recitals</li>
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
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* Features */}
        <section id="features" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Features
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
                  <li>Bookmarks are saved in your browser (no account required)</li>
                  <li>Remove bookmarks by clicking the icon again</li>
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
                  The homepage highlights acts currently open for feedback with countdown timers.
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
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Contact & Support */}
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
