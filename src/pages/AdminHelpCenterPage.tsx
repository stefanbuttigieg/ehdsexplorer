import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, Scale, Files, ListChecks, Users, Upload, 
  Bell, Link2, BookMarked, StickyNote, Layers, LayoutDashboard,
  ArrowLeft, ChevronRight, CheckCircle2, AlertCircle, Info,
  Edit, Trash2, Plus, Save, Eye, Search, Construction
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Layout from '@/components/Layout';

const AdminHelpCenterPage = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-serif">Help Center</h1>
            <p className="text-muted-foreground mt-1">
              Documentation for editors and administrators
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
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
              <a href="#content-management" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Content Management</span>
              </a>
              <a href="#user-management" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">User Management</span>
              </a>
              <a href="#site-settings" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Construction className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Site Settings</span>
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
              <CardTitle>Understanding Your Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Badge className="mt-0.5">Admin</Badge>
                <div>
                  <p className="font-medium">Administrators</p>
                  <p className="text-sm text-muted-foreground">
                    Full access to all features including user management, site settings, maintenance mode, and all content management capabilities.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Badge variant="secondary" className="mt-0.5">Editor</Badge>
                <div>
                  <p className="font-medium">Editors</p>
                  <p className="text-sm text-muted-foreground">
                    Can create, edit, and delete content (articles, recitals, definitions, etc.) but cannot manage users or site-wide settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                The Admin Dashboard is your central hub for managing all EHDS Regulation content. Here&apos;s what you&apos;ll find:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Content Cards:</strong> Quick access to each content type (Articles, Recitals, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Quick Actions:</strong> Common tasks like viewing the public site or bulk importing
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <strong>Maintenance Mode:</strong> (Admin only) Enable to show maintenance page to visitors
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Content Management */}
        <section id="content-management" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Content Management
          </h2>

          <Accordion type="multiple" className="space-y-4">
            {/* Articles */}
            <AccordionItem value="articles" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Managing Articles</span>
                  <Badge variant="outline">105 articles</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Editing an Article
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Navigate to <strong>Admin Dashboard → Articles</strong></li>
                    <li>Find the article using the search bar or by scrolling</li>
                    <li>Click the <strong>Edit</strong> button (pencil icon)</li>
                    <li>Modify the title, content (supports Markdown), chapter assignment, or section</li>
                    <li>Click <strong>Save Changes</strong></li>
                  </ol>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Tip:</strong> Articles support Markdown formatting. Use **bold**, *italic*, and bullet lists for better readability.</span>
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <StickyNote className="h-4 w-4" /> Adding Footnotes
                  </h4>
                  <p className="text-muted-foreground">
                    In the article content, add footnote markers like <code className="bg-muted px-1 rounded">[^1]</code>. 
                    Then manage the footnote content from <strong>Admin → Footnotes</strong>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Recitals */}
            <AccordionItem value="recitals" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Managing Recitals</span>
                  <Badge variant="outline">115 recitals</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Editing Recitals</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Go to <strong>Admin Dashboard → Recitals</strong></li>
                    <li>Search by recital number or content</li>
                    <li>Click <strong>Edit</strong> to modify content or related articles</li>
                    <li>Link to related articles by selecting from the dropdown</li>
                  </ol>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Bulk Editing
                  </h4>
                  <p className="text-muted-foreground">
                    Select multiple recitals using checkboxes, then click <strong>Bulk Edit</strong> to update related articles for all selected items at once.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Definitions */}
            <AccordionItem value="definitions" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Managing Definitions</span>
                  <Badge variant="outline">62+ terms</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Adding a Definition
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Go to <strong>Admin Dashboard → Definitions</strong></li>
                    <li>Click <strong>Add Definition</strong></li>
                    <li>Enter the term, definition text, and source article number</li>
                    <li>Save the new definition</li>
                  </ol>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                    <span><strong>Note:</strong> The source article links the definition to Article 2 definitions section. Most definitions come from Article 2.</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Implementing Acts */}
            <AccordionItem value="implementing-acts" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Managing Implementing Acts</span>
                  <Badge variant="outline">33 acts</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Key Fields</h4>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li><strong>Status:</strong> pending, feedback, adopted, or published</li>
                    <li><strong>Feedback Period:</strong> Format as &quot;DD MMMM YYYY - DD MMMM YYYY&quot; (e.g., &quot;09 December 2025 - 06 January 2026&quot;)</li>
                    <li><strong>Official Link:</strong> Link to EUR-Lex or feedback portal</li>
                    <li><strong>Related Articles:</strong> Link to relevant regulation articles</li>
                  </ul>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Tip:</strong> Acts with status &quot;feedback&quot; and valid feedback periods will appear in the &quot;Open for Feedback&quot; section on the homepage.</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chapters & Sections */}
            <AccordionItem value="chapters" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Chapters & Sections</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  The regulation is structured as <strong>Chapters → Sections → Articles</strong>. Managing this hierarchy:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li><strong>Chapters:</strong> Top-level divisions (10 chapters total)</li>
                  <li><strong>Sections:</strong> Sub-divisions within chapters (not all chapters have sections)</li>
                  <li><strong>Articles:</strong> Individual articles assigned to chapters/sections</li>
                </ul>
                <p className="text-muted-foreground">
                  Edit chapter titles and descriptions from <strong>Admin → Chapters & Sections</strong>.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Annexes */}
            <AccordionItem value="annexes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Files className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Managing Annexes</span>
                  <Badge variant="outline">4 annexes</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Annexes contain technical specifications and detailed requirements. Edit annex content from <strong>Admin → Annexes</strong>.
                </p>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Tip:</strong> Annex content supports full Markdown including tables. Use Markdown table syntax for structured data.</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* External Links */}
            <AccordionItem value="external-links" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">External Resources</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Joint Action Deliverables
                  </h4>
                  <p className="text-muted-foreground">
                    Link articles and implementing acts to Joint Action deliverables. Each deliverable requires:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground ml-4">
                    <li>Joint Action name</li>
                    <li>Deliverable name</li>
                    <li>URL link to the deliverable</li>
                    <li>Related articles and/or implementing acts</li>
                  </ul>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookMarked className="h-4 w-4" /> Published Works
                  </h4>
                  <p className="text-muted-foreground">
                    Link to academic papers, reports, and publications related to the regulation. Include the affiliated organization for attribution.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Footnotes */}
            <AccordionItem value="footnotes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <StickyNote className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Footnotes System</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">How Footnotes Work</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Add footnote markers in article/recital content: <code className="bg-muted px-1 rounded">[^1]</code>, <code className="bg-muted px-1 rounded">[^2]</code>, etc.</li>
                    <li>Go to <strong>Admin → Footnotes</strong></li>
                    <li>Create a new footnote with the matching marker</li>
                    <li>Link it to the specific article or recital</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  Footnotes appear as clickable superscript numbers that show a tooltip on hover and scroll to the footnote section when clicked.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Notifications */}
            <AccordionItem value="notifications" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Site Notifications</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Push announcements to all site visitors. Notifications appear as a banner at the top of pages.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Creating a Notification</h4>
                  <ul className="list-disc list-inside text-muted-foreground ml-4">
                    <li><strong>Title:</strong> Short heading for the notification</li>
                    <li><strong>Message:</strong> Full notification text</li>
                    <li><strong>Type:</strong> info, warning, or success (affects styling)</li>
                    <li><strong>Expiration:</strong> Optional date when the notification auto-hides</li>
                    <li><strong>Active:</strong> Toggle to show/hide immediately</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Bulk Import */}
            <AccordionItem value="bulk-import" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Bulk Import</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-muted-foreground">
                  Import large amounts of data at once using JSON format. Useful for initial data migration or bulk updates.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold">Steps</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Go to <strong>Admin → Bulk Import</strong></li>
                    <li>Select the content type (Articles, Recitals, etc.)</li>
                    <li>Paste your JSON data</li>
                    <li>Preview the import to verify data</li>
                    <li>Optionally delete existing data before importing</li>
                    <li>Click <strong>Import</strong></li>
                  </ol>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                    <span><strong>Warning:</strong> &quot;Delete existing data&quot; will permanently remove all current records of that type before importing.</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        {/* User Management (Admin Only) */}
        <section id="user-management" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
            <Badge>Admin Only</Badge>
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Inviting New Users</CardTitle>
              <CardDescription>Only administrators can invite new editors and admins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">How to Invite</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Go to <strong>Admin Dashboard → User Management</strong></li>
                  <li>Click <strong>Invite User</strong></li>
                  <li>Enter the user&apos;s email address</li>
                  <li>Select the role (Admin or Editor)</li>
                  <li>Click <strong>Send Invitation</strong></li>
                </ol>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                  <span>The invited user will receive an email with a link to set their password. Public signups are disabled for security.</span>
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Managing Existing Users</h4>
                <ul className="list-disc list-inside text-muted-foreground ml-4">
                  <li>View all users and their roles</li>
                  <li>Change user roles (upgrade editor to admin or vice versa)</li>
                  <li>Remove user access by deleting their role</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Site Settings */}
        <section id="site-settings" className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <Construction className="h-6 w-6 text-primary" />
            Site Settings
            <Badge>Admin Only</Badge>
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Enable maintenance mode when performing major updates or data imports. Visitors will see a maintenance page, but admins and editors can still access the site.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Using Maintenance Mode</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>On the Admin Dashboard, find the <strong>Maintenance Mode</strong> section</li>
                  <li>Toggle the switch to enable maintenance mode</li>
                  <li>Optionally customize the maintenance message</li>
                  <li>Perform your updates</li>
                  <li>Toggle off when complete</li>
                </ol>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                  <span><strong>Remember:</strong> Always disable maintenance mode when you&apos;re done to make the site accessible to visitors again.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Best Practices
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Content Editing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Preview changes before saving when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Use Markdown formatting for better readability
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Link related articles to recitals for cross-referencing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Keep feedback period dates in the correct format
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Use maintenance mode during large updates
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Test bulk imports with a small dataset first
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Regularly verify external links are working
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    Update implementing acts status as they progress
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Back to Dashboard */}
        <div className="flex justify-center pt-8 border-t">
          <Link to="/admin">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHelpCenterPage;
