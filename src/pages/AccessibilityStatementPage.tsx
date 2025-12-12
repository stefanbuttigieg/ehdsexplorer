import Layout from '@/components/Layout';

const AccessibilityStatementPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Accessibility Statement</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 12, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Our Commitment</h2>
            <p className="text-foreground/80 leading-relaxed">
              EHDS Explorer is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards to ensure we provide equal access to all users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Conformance Status</h2>
            <p className="text-foreground/80 leading-relaxed">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. 
              These guidelines explain how to make web content more accessible for people with disabilities 
              and more user-friendly for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Accessibility Features</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              EHDS Explorer includes the following accessibility features:
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">3.1 Visual Accessibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Dark/Light Mode:</strong> Toggle between dark and light themes to reduce eye strain and accommodate different visual preferences</li>
              <li><strong>Adjustable Font Sizes:</strong> Four font size options (small, medium, large, extra-large) accessible from any page</li>
              <li><strong>High Contrast:</strong> Sufficient color contrast ratios for text and interactive elements</li>
              <li><strong>Scalable Interface:</strong> The interface scales appropriately when browser zoom is used</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">3.2 Navigation Accessibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Keyboard Navigation:</strong> Full keyboard support for navigating between pages, articles, and interactive elements</li>
              <li><strong>Skip Links:</strong> Skip to main content functionality for screen reader users</li>
              <li><strong>Logical Tab Order:</strong> Interactive elements follow a logical tab sequence</li>
              <li><strong>Focus Indicators:</strong> Visible focus states on all interactive elements</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">3.3 Keyboard Shortcuts</h3>
            <p className="text-foreground/80 leading-relaxed mb-2">
              The following keyboard shortcuts are available to enhance navigation:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Shortcut</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2 text-sm"><kbd className="px-2 py-1 bg-muted rounded">/</kbd></td>
                    <td className="px-4 py-2 text-sm">Open search</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm"><kbd className="px-2 py-1 bg-muted rounded">?</kbd></td>
                    <td className="px-4 py-2 text-sm">Show keyboard shortcuts help</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm"><kbd className="px-2 py-1 bg-muted rounded">H</kbd></td>
                    <td className="px-4 py-2 text-sm">Go to home page</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm"><kbd className="px-2 py-1 bg-muted rounded">B</kbd></td>
                    <td className="px-4 py-2 text-sm">Bookmark current article</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm"><kbd className="px-2 py-1 bg-muted rounded">←</kbd> <kbd className="px-2 py-1 bg-muted rounded">→</kbd></td>
                    <td className="px-4 py-2 text-sm">Navigate between articles</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mb-2 mt-4">3.4 Content Accessibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Semantic HTML:</strong> Proper use of headings, landmarks, and ARIA labels</li>
              <li><strong>Alt Text:</strong> Descriptive alternative text for images</li>
              <li><strong>Link Descriptions:</strong> Links have descriptive text indicating their destination</li>
              <li><strong>Reading Progress:</strong> Visual indicators for reading progress that don't rely solely on color</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">3.5 Additional Features</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Print Functionality:</strong> Print-friendly layouts for articles and chapters</li>
              <li><strong>Responsive Design:</strong> Fully responsive interface that works on all device sizes</li>
              <li><strong>Bookmarks:</strong> Save articles for later reading without requiring an account</li>
              <li><strong>Search:</strong> Full-text search with fuzzy matching to help find content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Assistive Technology Compatibility</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              EHDS Explorer is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Known Limitations</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              While we strive for full accessibility, some limitations may exist:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Some older PDF documents linked from implementing acts may not be fully accessible</li>
              <li>Third-party content or external links may not meet our accessibility standards</li>
              <li>Complex regulatory tables may require additional context for screen reader users</li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-3">
              We are actively working to address these limitations and improve accessibility throughout the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Browser Compatibility</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              For the best accessibility experience, we recommend using the latest versions of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Edge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Feedback and Contact</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              We welcome your feedback on the accessibility of EHDS Explorer. If you encounter any 
              accessibility barriers or have suggestions for improvement, please let us know:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>
                <strong>GitHub Issues:</strong> Report accessibility issues on our{' '}
                <a 
                  href="https://github.com/stefanbuttigieg/ehdsexplorer/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub repository
                </a>
              </li>
              <li>
                <strong>Repository:</strong> View the source code and contribute at{' '}
                <a 
                  href="https://github.com/stefanbuttigieg/ehdsexplorer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  github.com/stefanbuttigieg/ehdsexplorer
                </a>
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-3">
              We aim to respond to accessibility feedback within 5 business days and will work to 
              address issues as quickly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Continuous Improvement</h2>
            <p className="text-foreground/80 leading-relaxed">
              Accessibility is an ongoing effort. We regularly review and update our platform to ensure 
              we meet accessibility standards and provide the best possible experience for all users. 
              As an open-source project, we welcome contributions that improve accessibility.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default AccessibilityStatementPage;
