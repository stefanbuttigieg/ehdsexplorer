import Layout from '@/components/Layout';
import { LegalPageContent } from '@/components/LegalPageContent';

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <LegalPageContent pageId="privacy-policy" fallbackTitle="Privacy Policy" />
    </Layout>
  );
};

export default PrivacyPolicyPage;
