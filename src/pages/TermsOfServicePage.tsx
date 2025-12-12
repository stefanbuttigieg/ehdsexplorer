import Layout from '@/components/Layout';

const TermsOfServicePage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 12, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-foreground/80 leading-relaxed">
              By accessing and using EHDS Explorer ("the Service"), you accept and agree to be bound by 
              these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-foreground/80 leading-relaxed">
              EHDS Explorer is an open-source educational platform designed to help users navigate, search, 
              and understand the European Health Data Space Regulation (EU) 2025/327. The Service provides 
              access to regulatory text, definitions, implementing acts tracking, and related resources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Important Disclaimers</h2>
            
            <h3 className="text-lg font-medium mb-2 mt-4">3.1 Not Legal Advice</h3>
            <p className="text-foreground/80 leading-relaxed mb-3">
              <strong>The content provided on EHDS Explorer is for informational and educational purposes only 
              and does not constitute legal advice.</strong> The Service is not a substitute for professional 
              legal counsel. Users should consult qualified legal professionals for advice specific to their 
              circumstances.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">3.2 No Official Status</h3>
            <p className="text-foreground/80 leading-relaxed mb-3">
              EHDS Explorer is an independent, community-driven project and has no official affiliation with 
              the European Union, European Commission, or any governmental body. The official text of 
              Regulation (EU) 2025/327 is published in the Official Journal of the European Union.
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">3.3 Accuracy of Information</h3>
            <p className="text-foreground/80 leading-relaxed">
              While we strive to maintain accurate and up-to-date information, we make no warranties or 
              representations regarding the completeness, accuracy, reliability, or availability of the 
              content. Users should always verify information against official sources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Permitted Use</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">You may use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Browse and search regulatory content for educational purposes</li>
              <li>Save bookmarks and track your reading progress</li>
              <li>Access information about implementing acts and their status</li>
              <li>Share links to specific articles, recitals, or pages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Prohibited Use</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
              <li>Misrepresent the Service as an official EU resource</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              The EHDS Explorer platform code is released under the MIT License and is available on{' '}
              <a 
                href="https://github.com/stefanbuttigieg/ehdsexplorer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              The regulatory text of the EHDS Regulation is © European Union and is reproduced for 
              educational purposes. Official EU legal documents are subject to the EU's reuse policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. User Accounts</h2>
            <p className="text-foreground/80 leading-relaxed">
              Administrative access to the Service is by invitation only. If you are granted administrative 
              access, you are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-foreground/80 leading-relaxed">
              To the fullest extent permitted by applicable law, EHDS Explorer and its contributors shall 
              not be liable for any indirect, incidental, special, consequential, or punitive damages, or 
              any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, 
              use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-3">
              <li>Your use or inability to use the Service</li>
              <li>Any errors, inaccuracies, or omissions in the content</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any decisions made based on information provided by the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Indemnification</h2>
            <p className="text-foreground/80 leading-relaxed">
              You agree to indemnify and hold harmless EHDS Explorer and its contributors from any claims, 
              damages, losses, liabilities, and expenses (including legal fees) arising from your use of 
              the Service or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Service Availability</h2>
            <p className="text-foreground/80 leading-relaxed">
              We do not guarantee that the Service will be available at all times. We may suspend, withdraw, 
              or restrict the availability of all or any part of the Service for business or operational 
              reasons. We will try to give you reasonable notice of any suspension or withdrawal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
            <p className="text-foreground/80 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting to the Service. Your continued use of the Service after any changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
            <p className="text-foreground/80 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the European Union 
              and the applicable Member State laws, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-foreground/80 leading-relaxed">
              For questions about these Terms of Service, please contact us through our GitHub repository at{' '}
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

export default TermsOfServicePage;
