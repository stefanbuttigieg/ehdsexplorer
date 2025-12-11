import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";

const OverviewPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Badge variant="outline" className="mb-2">Regulation (EU) 2025/327</Badge>
        <h1 className="text-3xl font-bold font-serif mb-4">European Health Data Space Regulation</h1>
        <p className="text-lg text-muted-foreground mb-8">Quick overview of the EHDS Regulation</p>

        <Card className="mb-6">
          <CardHeader><CardTitle>What is the EHDS?</CardTitle></CardHeader>
          <CardContent className="legal-text space-y-4">
            <p>The European Health Data Space (EHDS) is a health-specific ecosystem comprising rules, common standards and practices, infrastructures and a governance framework that aims to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Empower individuals</strong> through increased digital access to and control of their electronic health data</li>
              <li><strong>Support healthcare delivery</strong> by enabling health data to flow freely with the patient across borders</li>
              <li><strong>Foster a genuine single market</strong> for electronic health record systems and related services</li>
              <li><strong>Provide a framework for secondary use</strong> of health data for research, innovation, policy-making, and regulatory purposes</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Key Components</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Primary Use (Chapter II)</h4>
              <p className="text-sm text-muted-foreground">Rights of individuals to access, download, and share their health data. Includes MyHealth@EU for cross-border healthcare.</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">EHR Systems (Chapter III)</h4>
              <p className="text-sm text-muted-foreground">Requirements for electronic health record systems, including CE marking and interoperability standards.</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Secondary Use (Chapter IV)</h4>
              <p className="text-sm text-muted-foreground">Framework for accessing health data for research, innovation, and policy-making through health data access bodies.</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Cross-Border Infrastructure (Chapters II & VI)</h4>
              <p className="text-sm text-muted-foreground">MyHealth@EU for primary use and HealthData@EU for secondary use of health data across borders.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Key Dates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Entry into force</span>
                <Badge>25 March 2025</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>General application</span>
                <Badge>26 March 2027</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>MyHealth@EU (Art. 23)</span>
                <Badge>26 March 2028</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>EHR Systems & HealthData@EU</span>
                <Badge>26 March 2029</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OverviewPage;
