import Layout from '@/components/Layout';

const CookiesPolicyPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cookies Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 12, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What Are Cookies?</h2>
            <p className="text-foreground/80 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit a website. 
              They are widely used to make websites work more efficiently and to provide information 
              to the website owners. We also use similar technologies like localStorage to store 
              your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Cookies</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              EHDS Explorer uses cookies and localStorage for the following purposes:
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Essential Cookies</h3>
            <p className="text-foreground/80 leading-relaxed mb-2">
              These are necessary for the website to function properly and cannot be disabled.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Authentication:</strong> Used to keep you logged in if you have an admin account</li>
              <li><strong>Security:</strong> Help protect against security threats</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Functional Cookies</h3>
            <p className="text-foreground/80 leading-relaxed mb-2">
              These cookies enable enhanced functionality and personalization.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Theme Preference:</strong> Remembers your dark/light mode preference</li>
              <li><strong>Font Size:</strong> Stores your preferred font size setting</li>
              <li><strong>Bookmarks:</strong> Saves your bookmarked articles and recitals</li>
              <li><strong>Reading Progress:</strong> Tracks which articles you've read</li>
              <li><strong>Cookie Consent:</strong> Remembers your cookie preferences</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">2.3 Analytics Cookies</h3>
            <p className="text-foreground/80 leading-relaxed mb-2">
              These cookies help us understand how visitors interact with our website.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Page Views:</strong> Track which pages are visited</li>
              <li><strong>Session Duration:</strong> Measure how long users spend on the site</li>
              <li><strong>Traffic Sources:</strong> Understand where visitors come from</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cookie Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Purpose</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2 text-sm">theme</td>
                    <td className="px-4 py-2 text-sm">Dark/light mode preference</td>
                    <td className="px-4 py-2 text-sm">Functional</td>
                    <td className="px-4 py-2 text-sm">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">fontSize</td>
                    <td className="px-4 py-2 text-sm">Font size preference</td>
                    <td className="px-4 py-2 text-sm">Functional</td>
                    <td className="px-4 py-2 text-sm">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">bookmarks</td>
                    <td className="px-4 py-2 text-sm">Saved bookmarks</td>
                    <td className="px-4 py-2 text-sm">Functional</td>
                    <td className="px-4 py-2 text-sm">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">readingProgress</td>
                    <td className="px-4 py-2 text-sm">Reading history</td>
                    <td className="px-4 py-2 text-sm">Functional</td>
                    <td className="px-4 py-2 text-sm">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">cookieConsent</td>
                    <td className="px-4 py-2 text-sm">Cookie preferences</td>
                    <td className="px-4 py-2 text-sm">Essential</td>
                    <td className="px-4 py-2 text-sm">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">supabase-auth-token</td>
                    <td className="px-4 py-2 text-sm">Admin authentication</td>
                    <td className="px-4 py-2 text-sm">Essential</td>
                    <td className="px-4 py-2 text-sm">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Managing Your Cookie Preferences</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              You can manage your cookie preferences at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Cookie Banner:</strong> Use our cookie consent banner to select which types of cookies you accept</li>
              <li><strong>Browser Settings:</strong> Most browsers allow you to control cookies through their settings</li>
              <li><strong>Clear Data:</strong> You can clear your browser's cookies and localStorage at any time</li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-3">
              Note: Disabling certain cookies may affect the functionality of the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Cookies</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may use third-party analytics services that set their own cookies. These cookies are 
              governed by the respective privacy policies of these third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Updates to This Policy</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may update this Cookies Policy from time to time. Any changes will be posted on this 
              page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have questions about our use of cookies, please contact us through our GitHub 
              repository at{' '}
              <a 
                href="https://github.com/stefanbuttigieg/ehdsexplorer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                github.com/stefanbuttigieg/ehdsexplorer
              </a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default CookiesPolicyPage;
