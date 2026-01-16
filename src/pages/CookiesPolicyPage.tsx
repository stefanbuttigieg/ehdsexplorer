import { Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { LegalPageContent } from '@/components/LegalPageContent';

const CookiesPolicyPage = () => {
  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <Layout>
      <LegalPageContent pageId="cookies-policy" fallbackTitle="Cookies Policy">
        <div className="mt-6 pt-6 border-t">
          <Button onClick={handleOpenCookieSettings} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Cookie Preferences
          </Button>
        </div>
      </LegalPageContent>
    </Layout>
  );
};

export default CookiesPolicyPage;
