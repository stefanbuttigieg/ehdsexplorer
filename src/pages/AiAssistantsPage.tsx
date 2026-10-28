import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Check, Copy, KeyRound, Lock, Search, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SEOHead, BreadcrumbSchema } from '@/components/seo';

const MCP_URL = 'https://api.ehdsexplorer.eu/functions/v1/mcp';

const TOOLS = [
  { name: 'search_articles', desc: 'Find EHDS articles by keyword.' },
  { name: 'get_article', desc: 'Read the full text of one article.' },
  { name: 'get_recital', desc: 'Read the full text of one recital.' },
  { name: 'search_definitions', desc: 'Look up defined terms from the glossary.' },
  { name: 'search_faqs', desc: 'Search the official Commission FAQs.' },
  { name: 'list_implementing_acts', desc: 'List implementing acts and their feedback status.' },
  { name: 'get_feedback_insights', desc: 'Read public feedback insights for an act.' },
];

const EXAMPLES = [
  'What does Article 35 of the EHDS say about secondary use?',
  'Define "electronic health record system" under the EHDS.',
  'Which implementing acts are open for feedback right now?',
  'Summarise the main points of contention in the feedback on Article 77.',
];

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</span>
    <div className="pt-0.5 text-sm leading-relaxed">{children}</div>
  </li>
);

const AiAssistantsPage = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="Use EHDS Explorer in Claude or ChatGPT | EHDS Explorer"
        description="Connect Claude or ChatGPT to EHDS Explorer so your AI assistant can search the EHDS Regulation, definitions, FAQs and implementing acts with sources."
        url="/ai-assistants"
        canonical="https://ehdsexplorer.eu/ai-assistants"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'AI assistants', url: '/ai-assistants' }]} />

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <header className="space-y-3">
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> New</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Use EHDS Explorer in Claude or ChatGPT</h1>
          <p className="text-muted-foreground">
            Connect your AI assistant to EHDS Explorer and ask questions about the European Health Data Space
            Regulation (EU) 2025/327. The assistant answers using the actual legal text, definitions and official
            FAQs from this site instead of guessing.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              EHDS Explorer offers a connection using the <strong>Model Context Protocol (MCP)</strong>, an open standard
              that lets AI assistants use outside tools. Once connected, your assistant can look things up on this site whenever your question needs it.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3"><Search className="mb-2 h-4 w-4 text-primary" /><strong>1. You ask</strong><p className="text-muted-foreground">A question about the EHDS in your normal chat.</p></div>
              <div className="rounded-lg border p-3"><KeyRound className="mb-2 h-4 w-4 text-primary" /><strong>2. It looks up</strong><p className="text-muted-foreground">The assistant calls EHDS Explorer tools for the relevant text.</p></div>
              <div className="rounded-lg border p-3"><ShieldCheck className="mb-2 h-4 w-4 text-primary" /><strong>3. It answers</strong><p className="text-muted-foreground">With references to articles, recitals and FAQs.</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection address</CardTitle>
            <CardDescription>You'll paste this into your assistant's settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 break-all rounded-md border bg-muted px-3 py-2 text-sm">{MCP_URL}</code>
              <Button onClick={copy} variant="outline" className="gap-2" aria-label="Copy connection address">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              You'll need a free EHDS Explorer account. When you connect, you'll be asked to sign in and approve access.
              {' '}<Link to="/auth" className="text-primary underline">Create an account</Link>
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Set up in Claude</CardTitle>
              <CardDescription>Claude.ai or Claude Desktop (paid plans support custom connectors).</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <Step n={1}>Open <strong>Settings → Connectors</strong>.</Step>
                <Step n={2}>Choose <strong>Add custom connector</strong>.</Step>
                <Step n={3}>Name it <strong>EHDS Explorer</strong> and paste the connection address.</Step>
                <Step n={4}>Click <strong>Connect</strong>, sign in to EHDS Explorer and approve access.</Step>
                <Step n={5}>In a new chat, make sure EHDS Explorer is switched on in the tools menu, then ask away.</Step>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Set up in ChatGPT</CardTitle>
              <CardDescription>Plus, Pro, Business or Enterprise plans.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <Step n={1}>Open <strong>Settings → Apps &amp; Connectors → Advanced settings</strong> and turn on <strong>Developer mode</strong>.</Step>
                <Step n={2}>Back in <strong>Apps &amp; Connectors</strong>, choose <strong>Create</strong>.</Step>
                <Step n={3}>Name it <strong>EHDS Explorer</strong>, paste the connection address and choose <strong>OAuth</strong> sign-in.</Step>
                <Step n={4}>Save, then sign in to EHDS Explorer and approve access.</Step>
                <Step n={5}>In a new chat, add EHDS Explorer from the <strong>+</strong> menu and ask your question.</Step>
              </ol>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground">Menu names in Claude and ChatGPT change from time to time; if a step looks different, look for "connectors" or "custom MCP" in settings.</p>

        <Card>
          <CardHeader><CardTitle>What your assistant can do</CardTitle><CardDescription>Read-only: assistants can look things up but cannot change anything on the site.</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {TOOLS.map((t) => (
                <li key={t.name} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-4">
                  <code className="text-xs text-primary sm:w-52">{t.name}</code>
                  <span className="text-sm">{t.desc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Try asking</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {EXAMPLES.map((e) => <li key={e} className="rounded-md border bg-muted/50 px-3 py-2 text-sm">“{e}”</li>)}
            </ul>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Questions</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="cost"><AccordionTrigger>Does it cost anything?</AccordionTrigger><AccordionContent>No. EHDS Explorer is free. Your Claude or ChatGPT plan must support custom connectors.</AccordionContent></AccordionItem>
            <AccordionItem value="privacy"><AccordionTrigger>What data is shared?</AccordionTrigger><AccordionContent>Your assistant only receives public EHDS content from this site. We see which tools were used under your account, not your wider chat. You can remove the connector at any time in your assistant's settings.</AccordionContent></AccordionItem>
            <AccordionItem value="legal"><AccordionTrigger>Is this legal advice?</AccordionTrigger><AccordionContent>No. AI answers can still be wrong. Always check the cited article or recital on EHDS Explorer or EUR-Lex.</AccordionContent></AccordionItem>
            <AccordionItem value="trouble"><AccordionTrigger>It won't connect. What now?</AccordionTrigger><AccordionContent>Check you pasted the full address, that you're signed in to EHDS Explorer in the same browser, and that you approved access. Removing and re-adding the connector often helps.</AccordionContent></AccordionItem>
            <AccordionItem value="dev"><AccordionTrigger>I'm a developer. Is there an API?</AccordionTrigger><AccordionContent>Yes. See the <Link to="/api" className="text-primary underline">public API documentation</Link>.</AccordionContent></AccordionItem>
          </Accordion>
        </section>
      </div>
    </Layout>
  );
};

export default AiAssistantsPage;
