import Layout from '@/components/Layout';
import { LegalPageContent } from '@/components/LegalPageContent';

const TermsOfServicePage = () => {
  return (
    <Layout>
      <LegalPageContent pageId="terms-of-service" fallbackTitle="Terms of Service" />
    </Layout>
  );
};

export default TermsOfServicePage;
