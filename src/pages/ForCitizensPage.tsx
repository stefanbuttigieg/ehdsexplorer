import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import CitizenRightsCard from '@/components/CitizenRightsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  FileText, 
  HelpCircle, 
  ArrowRight,
  Shield,
  Globe,
  CheckCircle2,
  BookOpen,
  Bot
} from 'lucide-react';
import { RIGHTS_CATEGORIES } from '@/data/citizenRights';

const ForCitizensPage: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>EHDS for Citizens - Your Health Data Rights | EHDS Explorer</title>
        <meta 
          name="description" 
          content="Understand your rights under the European Health Data Space (EHDS) regulation. Learn how to access, control, and protect your electronic health records across the EU." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">For Citizens & Patients</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Your Health Data, Your Rights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            The European Health Data Space (EHDS) gives you new rights to access, control, 
            and protect your electronic health records across the EU.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/articles?chapter=2" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Read Chapter II: Primary Use
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/help" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Get Help
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {Object.entries(RIGHTS_CATEGORIES).map(([key, cat]) => (
            <Card key={key} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-1">
                  {key === 'access' && '2'}
                  {key === 'control' && '2'}
                  {key === 'protection' && '4'}
                  {key === 'cross-border' && '2'}
                </div>
                <p className="text-sm text-muted-foreground">{cat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* All Rights */}
        <section className="mb-12">
          <CitizenRightsCard showHeader={false} />
        </section>

        {/* Key Things to Know */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Key Things to Know</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="p-2 bg-green-500/10 rounded-lg w-fit mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">It's Free</CardTitle>
                <CardDescription>
                  You have the right to access your health data and receive copies free of charge. 
                  Healthcare providers cannot charge you for this.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-blue-500/10 rounded-lg w-fit mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Works Across Borders</CardTitle>
                <CardDescription>
                  Your health data can follow you when you travel or move within the EU. 
                  The MyHealth@EU infrastructure makes this possible.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 bg-purple-500/10 rounded-lg w-fit mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">You're in Control</CardTitle>
                <CardDescription>
                  You can restrict who sees your data and opt out of your data being used 
                  for research purposes. Your consent matters.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Common Questions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Common Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: "How do I access my health records?",
                a: "Contact your healthcare provider or national health portal. Under EHDS, they must provide electronic access to your records.",
              },
              {
                q: "Can I see who has viewed my data?",
                a: "Yes! Article 12 gives you the right to see access logs showing who accessed your health records and when.",
              },
              {
                q: "What if I find an error in my records?",
                a: "You can request corrections. Healthcare providers must rectify inaccurate data without undue delay (Article 4).",
              },
              {
                q: "Can I stop my data being used for research?",
                a: "Yes, Article 51 gives you the right to opt out of secondary use of your health data for research and policy purposes.",
              },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Assistant CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Have Questions? Ask the AI Assistant
                </h3>
                <p className="text-muted-foreground mb-4">
                  Our AI assistant can explain your rights in simple language and help you find 
                  relevant articles. Just select "Citizen / Patient" mode for tailored answers.
                </p>
                <Badge variant="secondary" className="mb-2">
                  Tip: Look for the chat bubble icon in the bottom right corner
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Resources */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Explore Further</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/definitions" className="group">
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <FileText className="h-5 w-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                    Key Definitions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Understand terms like "electronic health data", "data holder", and more.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/articles" className="group">
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <BookOpen className="h-5 w-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                    Browse All Articles
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Read the full regulation with plain language explanations available.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/help" className="group">
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <HelpCircle className="h-5 w-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                    Help Center
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Find answers to frequently asked questions about EHDS.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ForCitizensPage;
