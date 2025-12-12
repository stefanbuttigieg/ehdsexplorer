import Layout from '@/components/Layout';

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 12, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-foreground/80 leading-relaxed">
              Welcome to EHDS Explorer. We are committed to protecting your privacy and ensuring transparency 
              about how we handle your data. This Privacy Policy explains what information we collect, how we 
              use it, and your rights regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data Controller</h2>
            <p className="text-foreground/80 leading-relaxed">
              EHDS Explorer is an open-source educational resource for understanding the European Health Data 
              Space Regulation (EU) 2025/327. This platform is provided for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2 mt-4">3.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Account information (email address) if you create an admin account</li>
              <li>Feedback or communications you send to us</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">3.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Reading progress and bookmarks (stored locally in your browser)</li>
              <li>Accessibility preferences (font size, theme - stored locally)</li>
              <li>Basic analytics data (page views, session duration)</li>
              <li>Technical information (browser type, device type, IP address)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. How We Use Your Information</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Provide and maintain the EHDS Explorer service</li>
              <li>Remember your reading preferences and progress</li>
              <li>Improve the user experience and content</li>
              <li>Analyze usage patterns to enhance the platform</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Storage and Security</h2>
            <p className="text-foreground/80 leading-relaxed">
              Most user preferences (bookmarks, reading progress, theme) are stored locally in your browser 
              using localStorage and are not transmitted to our servers. Admin account data is securely stored 
              using industry-standard encryption and security measures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights Under GDPR</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              As a user in the European Union, you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restriction:</strong> Request limitation of processing</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may use third-party services for analytics and hosting. These services have their own 
              privacy policies and may collect information as specified in their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-foreground/80 leading-relaxed">
              EHDS Explorer is not directed at children under 16 years of age. We do not knowingly collect 
              personal information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through the 
              project's GitHub repository at{' '}
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

export default PrivacyPolicyPage;
