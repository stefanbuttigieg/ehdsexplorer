import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Code, FileJson, Lock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const CountryManagerApiDocs = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API Documentation
        </CardTitle>
        <CardDescription>
          Use the API to programmatically update obligation statuses from your systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base URL */}
        <div>
          <h4 className="font-medium mb-2">Base URL</h4>
          <code className="block bg-muted px-3 py-2 rounded text-sm">
            https://api.ehdsexplorer.eu
          </code>
        </div>

        {/* Authentication */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Authentication
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            All requests must include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> header.
            Generate API keys using the section above.
          </p>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`curl -X POST https://api.ehdsexplorer.eu/update-obligation-status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ehds_your_api_key_here"`}
          </pre>
        </div>

        {/* Endpoints */}
        <div>
          <h4 className="font-medium mb-3">Endpoints</h4>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="update-status">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100">POST</Badge>
                  <code className="text-sm">/update-obligation-status</code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Update the implementation status of an EHDS obligation for a specific country.
                </p>

                <Tabs defaultValue="request" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request" className="space-y-4">
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
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">Content-Type</code></td>
                              <td className="px-3 py-2"><Badge variant="destructive" className="text-xs">Required</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">Must be <code className="text-xs">application/json</code></td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">X-API-Key</code></td>
                              <td className="px-3 py-2"><Badge variant="destructive" className="text-xs">Required</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">Your API key</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

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
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">country_code</code></td>
                              <td className="px-3 py-2 text-muted-foreground">string</td>
                              <td className="px-3 py-2"><Badge variant="destructive" className="text-xs">Required</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">2-letter ISO country code (e.g., "DE", "FR")</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">obligation_id</code></td>
                              <td className="px-3 py-2 text-muted-foreground">string</td>
                              <td className="px-3 py-2"><Badge variant="destructive" className="text-xs">Required</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">The obligation identifier</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">status</code></td>
                              <td className="px-3 py-2 text-muted-foreground">string</td>
                              <td className="px-3 py-2"><Badge variant="destructive" className="text-xs">Required</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">One of: <code className="text-xs">not_started</code>, <code className="text-xs">in_progress</code>, <code className="text-xs">partial</code>, <code className="text-xs">completed</code></td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">status_notes</code></td>
                              <td className="px-3 py-2 text-muted-foreground">string</td>
                              <td className="px-3 py-2"><Badge variant="outline" className="text-xs">Optional</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">Additional notes about the status</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-3 py-2"><code className="text-xs">evidence_url</code></td>
                              <td className="px-3 py-2 text-muted-foreground">string</td>
                              <td className="px-3 py-2"><Badge variant="outline" className="text-xs">Optional</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">URL to supporting evidence or documentation</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Example Request</h5>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`curl -X POST https://api.ehdsexplorer.eu/update-obligation-status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ehds_abc123..." \\
  -d '{
    "country_code": "DE",
    "obligation_id": "ehda_services",
    "status": "in_progress",
    "status_notes": "Implementation phase started Q1 2025",
    "evidence_url": "https://health.gov.de/ehds-implementation"
  }'`}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="response" className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Success Response (200)
                      </h5>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "uuid-of-status-record",
    "country_code": "DE",
    "obligation_id": "ehda_services",
    "status": "in_progress",
    "status_notes": "Implementation phase started Q1 2025",
    "evidence_url": "https://health.gov.de/ehds-implementation",
    "last_verified_at": "2025-02-04T12:00:00Z",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-02-04T12:00:00Z"
  },
  "message": "Updated EHDA Services status for DE to in_progress"
}`}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="errors" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          401 Unauthorized
                        </h5>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "error": "Invalid API key"
}
// or
{
  "error": "API key has been revoked"
}
// or
{
  "error": "Missing authentication - provide X-API-Key header"
}`}
                        </pre>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          403 Forbidden
                        </h5>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "error": "Forbidden - you are not authorized for this country"
}`}
                        </pre>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your API key can only update countries it was created for.
                        </p>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          400 Bad Request
                        </h5>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "error": "country_code must be a 2-letter ISO country code"
}
// or
{
  "error": "status must be one of: not_started, in_progress, partial, completed"
}
// or
{
  "error": "evidence_url must be a valid URL"
}`}
                        </pre>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          404 Not Found
                        </h5>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "error": "Obligation not found or inactive"
}`}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Obligation IDs Reference */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Obligation IDs Reference
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Use the obligation list endpoint to get all available obligation IDs:
          </p>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`curl https://api.ehdsexplorer.eu/ehds-obligations`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Common obligation IDs include: <code className="bg-muted px-1 rounded">ehda_services</code>, <code className="bg-muted px-1 rounded">patient_summary</code>, <code className="bg-muted px-1 rounded">eprescription</code>, etc.
          </p>
        </div>

        {/* Rate Limits */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Rate Limits</h4>
          <p className="text-sm text-muted-foreground">
            API requests are limited to <strong>100 requests per minute</strong> per API key.
            If you exceed this limit, you'll receive a <code className="bg-muted px-1.5 py-0.5 rounded">429 Too Many Requests</code> response.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
