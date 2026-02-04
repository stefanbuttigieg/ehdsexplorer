import { useState } from "react";
import { Copy, Check, ExternalLink, Code, Lock, FileJson, Globe, Shield, Key, AlertTriangle, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminPageLayout, AdminPageLoading } from "@/components/admin/AdminPageLayout";
import { useAdminGuard } from "@/hooks/useAdminGuard";

const API_BASE = "https://api.ehdsexplorer.eu";

// ============ GET ENDPOINTS ============
const getEndpoints = [
  {
    resource: "articles",
    description: "All 105 articles of the EHDS Regulation",
    parameters: [
      { name: "id", type: "number", required: false, description: "Return a specific article by number" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code (e.g., en, de, fr, mt)" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["article_number", "title", "content", "chapter_id", "section_id", "is_key_provision", "stakeholder_tags"],
    exampleRequest: `curl "${API_BASE}?resource=articles"`,
    exampleResponse: `{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "EHDS Regulation - articles",
  "data": [
    { "article_number": 1, "title": "Subject matter and scope", "content": "..." }
  ],
  "recordCount": 105
}`,
  },
  {
    resource: "recitals",
    description: "All 115 recitals providing interpretation guidance",
    parameters: [
      { name: "id", type: "number", required: false, description: "Return a specific recital by number" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["recital_number", "content", "related_articles"],
    exampleRequest: `curl "${API_BASE}?resource=recitals&id=1"`,
    exampleResponse: `{
  "data": { "recital_number": 1, "content": "The European Health Data Space...", "related_articles": [1, 2] }
}`,
  },
  {
    resource: "definitions",
    description: "Defined terms from Article 2 and related sources",
    parameters: [
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["term", "definition", "source_article", "source"],
    exampleRequest: `curl "${API_BASE}?resource=definitions&lang=de"`,
    exampleResponse: `{
  "data": [{ "term": "elektronische Gesundheitsdaten", "definition": "..." }],
  "recordCount": 170
}`,
  },
  {
    resource: "chapters",
    description: "Chapter structure of the regulation",
    parameters: [
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
    ],
    availableFields: ["chapter_number", "title", "description"],
    exampleRequest: `curl "${API_BASE}?resource=chapters"`,
    exampleResponse: `{
  "data": [{ "chapter_number": 1, "title": "General provisions", "description": "Articles 1-2" }],
  "recordCount": 10
}`,
  },
  {
    resource: "sections",
    description: "Section subdivisions within chapters",
    parameters: [
      { name: "id", type: "number", required: false, description: "Filter by chapter_id" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
    ],
    availableFields: ["section_number", "title", "chapter_id"],
    exampleRequest: `curl "${API_BASE}?resource=sections&id=2"`,
    exampleResponse: `{
  "data": [{ "section_number": 1, "title": "Rights of natural persons", "chapter_id": 2 }]
}`,
  },
  {
    resource: "implementing-acts",
    description: "Implementing and delegated acts tracker",
    parameters: [
      { name: "id", type: "string", required: false, description: "Return a specific act by ID" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["id", "title", "description", "type", "theme", "themes", "status", "article_reference", "related_articles", "feedback_deadline", "official_link"],
    exampleRequest: `curl "${API_BASE}?resource=implementing-acts"`,
    exampleResponse: `{
  "data": [{ "id": "art-6-ehr-categories", "title": "EHR Categories", "type": "implementing", "status": "pending" }]
}`,
  },
  {
    resource: "annexes",
    description: "Regulation annexes",
    parameters: [
      { name: "id", type: "string", required: false, description: "Return a specific annex by ID" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "lang", type: "string", required: false, description: "Language code for translations" },
    ],
    availableFields: ["id", "title", "content"],
    exampleRequest: `curl "${API_BASE}?resource=annexes&id=I"`,
    exampleResponse: `{
  "data": { "id": "I", "title": "Main characteristics...", "content": "..." }
}`,
  },
  {
    resource: "health-authorities",
    description: "National Digital Health Authorities and Health Data Access Bodies",
    parameters: [
      { name: "id", type: "string", required: false, description: "Return a specific authority by ID" },
      { name: "country", type: "string", required: false, description: "Filter by country code (e.g., MT, DE)" },
      { name: "type", type: "string", required: false, description: "Filter by type: dha or hdab" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["id", "name", "country_code", "country_name", "authority_type", "status", "email", "phone", "website", "address", "description", "ehds_role", "latitude", "longitude"],
    exampleRequest: `curl "${API_BASE}?resource=health-authorities&country=MT"`,
    exampleResponse: `{
  "data": [{ "name": "eHealth Malta", "country_code": "MT", "authority_type": "dha", "status": "active" }]
}`,
  },
  {
    resource: "country-legislation",
    description: "National implementing legislation tracker",
    parameters: [
      { name: "id", type: "string", required: false, description: "Return specific legislation by ID" },
      { name: "country", type: "string", required: false, description: "Filter by country code (e.g., MT, DE)" },
      { name: "status", type: "string", required: false, description: "Filter by status (e.g., adopted, draft)" },
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
      { name: "fields", type: "string", required: false, description: "Comma-separated fields to return" },
    ],
    availableFields: ["id", "country_code", "country_name", "title", "official_title", "legislation_type", "status", "status_notes", "summary", "url", "effective_date", "adoption_date", "publication_date", "enforcement_measures"],
    exampleRequest: `curl "${API_BASE}?resource=country-legislation&country=MT"`,
    exampleResponse: `{
  "data": [{ "country_code": "MT", "title": "Health Data Act", "status": "adopted" }]
}`,
  },
  {
    resource: "ehds-obligations",
    description: "EHDS obligation definitions for tracking implementation status",
    parameters: [
      { name: "format", type: "string", required: false, description: "Response format: json (default) or csv" },
    ],
    availableFields: ["id", "name", "description", "category", "article_references", "sort_order"],
    exampleRequest: `curl "${API_BASE}?resource=ehds-obligations"`,
    exampleResponse: `{
  "data": [
    { "id": "ehda_services", "name": "EHDA Services", "category": "primary_use" },
    { "id": "patient_summary", "name": "Patient Summary", "category": "primary_use" }
  ]
}`,
  },
  {
    resource: "metadata",
    description: "API metadata and regulation information",
    parameters: [],
    availableFields: [],
    exampleRequest: `curl "${API_BASE}?resource=metadata"`,
    exampleResponse: `{
  "regulation": {
    "title": "Regulation (EU) 2025/327 - European Health Data Space",
    "celex": "32025R0327",
    "eli": "http://data.europa.eu/eli/reg/2025/327"
  },
  "api": { "version": "2.0" }
}`,
  },
];

// ============ POST ENDPOINTS ============
const postEndpoints = [
  {
    endpoint: "/update-obligation-status",
    description: "Update the implementation status of an EHDS obligation for a specific country",
    authentication: "Required (API Key or Bearer Token)",
    headers: [
      { name: "Content-Type", required: true, value: "application/json" },
      { name: "X-API-Key", required: true, description: "Your API key (or use Bearer token)" },
    ],
    requestBody: [
      { name: "country_code", type: "string", required: true, description: "2-letter ISO country code (e.g., \"DE\", \"FR\")" },
      { name: "obligation_id", type: "string", required: true, description: "The obligation identifier (e.g., \"ehda_services\")" },
      { name: "status", type: "string", required: true, description: "One of: not_started, in_progress, partial, completed" },
      { name: "status_notes", type: "string", required: false, description: "Additional notes about the status" },
      { name: "evidence_url", type: "string", required: false, description: "URL to supporting evidence or documentation" },
    ],
    exampleRequest: `curl -X POST ${API_BASE}/update-obligation-status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ehds_your_api_key_here" \\
  -d '{
    "country_code": "DE",
    "obligation_id": "ehda_services",
    "status": "in_progress",
    "status_notes": "Implementation phase started Q1 2025",
    "evidence_url": "https://health.gov.de/ehds-implementation"
  }'`,
    successResponse: `{
  "success": true,
  "data": {
    "id": "uuid-of-status-record",
    "country_code": "DE",
    "obligation_id": "ehda_services",
    "status": "in_progress",
    "status_notes": "Implementation phase started Q1 2025",
    "evidence_url": "https://health.gov.de/ehds-implementation",
    "last_verified_at": "2025-02-04T12:00:00Z"
  },
  "message": "Updated EHDA Services status for DE to in_progress"
}`,
    errorResponses: [
      { status: 401, message: "Invalid API key", description: "API key is missing, invalid, or expired" },
      { status: 403, message: "Forbidden - you are not authorized for this country", description: "API key doesn't have access to the requested country" },
      { status: 400, message: "country_code must be a 2-letter ISO country code", description: "Invalid country code format" },
      { status: 400, message: "status must be one of: not_started, in_progress, partial, completed", description: "Invalid status value" },
      { status: 404, message: "Obligation not found or inactive", description: "The obligation_id doesn't exist" },
    ],
  },
];

const supportedLanguages = [
  { code: "en", name: "English" }, { code: "mt", name: "Maltese" }, { code: "de", name: "German" },
  { code: "fr", name: "French" }, { code: "it", name: "Italian" }, { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" }, { code: "nl", name: "Dutch" }, { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" }, { code: "sk", name: "Slovak" }, { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" }, { code: "bg", name: "Bulgarian" }, { code: "el", name: "Greek" },
  { code: "sv", name: "Swedish" }, { code: "da", name: "Danish" }, { code: "fi", name: "Finnish" },
  { code: "et", name: "Estonian" }, { code: "lv", name: "Latvian" }, { code: "lt", name: "Lithuanian" },
  { code: "sl", name: "Slovenian" }, { code: "hr", name: "Croatian" }, { code: "ga", name: "Irish" },
];

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (label) {
    return (
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied!" : label}
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

const CodeBlock = ({ code }: { code: string }) => (
  <div className="relative">
    <div className="absolute right-1 top-1 z-10">
      <CopyButton text={code} />
    </div>
    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono max-w-full">
      <code className="whitespace-pre-wrap">{code}</code>
    </pre>
  </div>
);

const GetEndpointCard = ({ endpoint }: { endpoint: typeof getEndpoints[0] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100">GET</Badge>
              <div>
                <code className="text-sm font-medium">{endpoint.resource}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{endpoint.description}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Parameters */}
            {endpoint.parameters.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Query Parameters</h5>
                <div className="rounded border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Parameter</th>
                        <th className="text-left px-3 py-2 font-medium">Type</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.parameters.map((param) => (
                        <tr key={param.name} className="border-t">
                          <td className="px-3 py-2"><code className="text-xs">{param.name}</code></td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{param.type}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Available Fields */}
            {endpoint.availableFields.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Available Fields</h5>
                <div className="flex flex-wrap gap-1">
                  {endpoint.availableFields.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs font-mono">{field}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Example Request */}
            <div>
              <h5 className="text-sm font-medium mb-2">Example Request</h5>
              <CodeBlock code={endpoint.exampleRequest} />
            </div>
            
            {/* Example Response */}
            <div>
              <h5 className="text-sm font-medium mb-2">Example Response</h5>
              <CodeBlock code={endpoint.exampleResponse} />
            </div>

            <Button 
              variant="default" 
              size="sm" 
              onClick={() => window.open(`${API_BASE}?resource=${endpoint.resource}`, "_blank")} 
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Try it
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const PostEndpointCard = ({ endpoint }: { endpoint: typeof postEndpoints[0] }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100">POST</Badge>
          <code className="text-sm font-medium">{endpoint.endpoint}</code>
        </div>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Authentication Required</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Use <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">X-API-Key</code> header or Bearer token
          </p>
        </div>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            {/* Headers */}
            <div>
              <h5 className="text-sm font-medium mb-2">Headers</h5>
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Header</th>
                      <th className="text-left px-3 py-2 font-medium">Required</th>
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.headers.map((header) => (
                      <tr key={header.name} className="border-t">
                        <td className="px-3 py-2"><code className="text-xs">{header.name}</code></td>
                        <td className="px-3 py-2">
                          <Badge variant={header.required ? "destructive" : "outline"} className="text-xs">
                            {header.required ? "Required" : "Optional"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{header.description || header.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Request Body */}
            <div>
              <h5 className="text-sm font-medium mb-2">Request Body</h5>
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Field</th>
                      <th className="text-left px-3 py-2 font-medium">Type</th>
                      <th className="text-left px-3 py-2 font-medium">Required</th>
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.requestBody.map((field) => (
                      <tr key={field.name} className="border-t">
                        <td className="px-3 py-2"><code className="text-xs">{field.name}</code></td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{field.type}</td>
                        <td className="px-3 py-2">
                          <Badge variant={field.required ? "destructive" : "outline"} className="text-xs">
                            {field.required ? "Required" : "Optional"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Example Request */}
            <div>
              <h5 className="text-sm font-medium mb-2">Example Request</h5>
              <CodeBlock code={endpoint.exampleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Success Response (200)
              </h5>
              <CodeBlock code={endpoint.successResponse} />
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-3">
            {endpoint.errorResponses.map((err) => (
              <div key={`${err.status}-${err.message}`}>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  {err.status >= 400 && err.status < 500 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  {err.status} Error
                </h5>
                <div className="bg-muted p-3 rounded-lg text-xs">
                  <code>{`{ "error": "${err.message}" }`}</code>
                  <p className="text-muted-foreground mt-1">{err.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const AdminApiDocsPage = () => {
  const { shouldRender, loading } = useAdminGuard();

  if (loading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  return (
    <AdminPageLayout
      title="API Documentation"
      description="Complete API reference for all GET and POST endpoints"
      backTo="/admin"
    >
      <div className="space-y-6">
        {/* Overview */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary">v2.0</Badge>
              <Badge variant="outline">100 req/hour rate limit</Badge>
            </div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Overview
            </CardTitle>
            <CardDescription>
              The EHDS Explorer API provides programmatic access to all regulation content and country implementation data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-background border-2 border-dashed border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-primary">Base URL</p>
                <CopyButton text={API_BASE} label="Copy" />
              </div>
              <code className="block text-sm font-mono bg-muted p-2 rounded-md">{API_BASE}</code>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">24 Languages</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Use the <code className="bg-muted px-1 rounded">lang</code> parameter</p>
                <div className="flex flex-wrap gap-1">
                  {supportedLanguages.slice(0, 8).map((l) => (
                    <Badge key={l.code} variant="outline" className="text-xs">{l.code}</Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">+16 more</Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">FAIR Compliant</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  All responses include Schema.org metadata. Export as JSON or CSV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="get" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="get" className="gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">GET</Badge>
              Read Endpoints ({getEndpoints.length})
            </TabsTrigger>
            <TabsTrigger value="post" className="gap-2">
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">POST</Badge>
              Write Endpoints ({postEndpoints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="get" className="mt-4 space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Public access</strong> — No authentication required. Rate limited to 100 requests per hour per IP.
              </p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {getEndpoints.map((ep) => (
                  <GetEndpointCard key={ep.resource} endpoint={ep} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="post" className="mt-4 space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Authentication Required</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                POST endpoints require an API key. Generate keys from the Country Manager Dashboard.
              </p>
            </div>
            {postEndpoints.map((ep) => (
              <PostEndpointCard key={ep.endpoint} endpoint={ep} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Endpoint Type</th>
                    <th className="text-left px-4 py-2 font-medium">Limit</th>
                    <th className="text-left px-4 py-2 font-medium">Window</th>
                    <th className="text-left px-4 py-2 font-medium">Headers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2">GET (Public)</td>
                    <td className="px-4 py-2">100 requests</td>
                    <td className="px-4 py-2">Per hour</td>
                    <td className="px-4 py-2"><code className="text-xs">X-RateLimit-*</code></td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">POST (Authenticated)</td>
                    <td className="px-4 py-2">100 requests</td>
                    <td className="px-4 py-2">Per minute per key</td>
                    <td className="px-4 py-2"><code className="text-xs">X-RateLimit-*</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              When rate limited, you'll receive a <code className="bg-muted px-1 rounded">429 Too Many Requests</code> response with a <code className="bg-muted px-1 rounded">Retry-After</code> header.
            </p>
          </CardContent>
        </Card>

        {/* OpenAPI Spec */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileJson className="h-5 w-5" />
              OpenAPI Specification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Download the full OpenAPI 3.0 specification for code generation and API clients.
            </p>
            <Button variant="outline" asChild>
              <a href="/openapi.json" target="_blank" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Download OpenAPI Spec
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminApiDocsPage;
