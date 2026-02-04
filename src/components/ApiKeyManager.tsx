import { useState } from "react";
import { useApiKeys, ApiKey } from "@/hooks/useApiKeys";
import { useCountryAssignments } from "@/hooks/useCountryAssignments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Plus, Copy, Check, Trash2, Ban, AlertTriangle, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const ApiKeyManager = () => {
  const { myKeys, myKeysLoading, createKey, revokeKey, deleteKey } = useApiKeys();
  const { myAssignedCountries } = useCountryAssignments();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    
    if (selectedCountries.length === 0) {
      toast.error("Please select at least one country");
      return;
    }

    try {
      const result = await createKey.mutateAsync({
        name: newKeyName,
        countryCodes: selectedCountries,
      });
      
      setCreatedKey(result.rawKey);
      setNewKeyName("");
      setSelectedCountries([]);
    } catch (error) {
      console.error("Failed to create key:", error);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCreatedKey(null);
    setNewKeyName("");
    setSelectedCountries([]);
  };

  const getKeyStatusBadge = (key: ApiKey) => {
    if (!key.is_active) {
      return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Revoked</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Check className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate API keys to update obligation statuses programmatically
          </CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {createdKey ? "API Key Created" : "Create API Key"}
              </DialogTitle>
              <DialogDescription>
                {createdKey 
                  ? "Copy your API key now. You won't be able to see it again!"
                  : "Generate a new API key for programmatic access"}
              </DialogDescription>
            </DialogHeader>
            
            {createdKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Save this key!</p>
                      <p>This is the only time you'll see this API key. Store it securely.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    value={createdKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input 
                    id="keyName"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Countries (select which countries this key can update)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {myAssignedCountries.map((code) => (
                      <label 
                        key={code}
                        className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <Checkbox 
                          checked={selectedCountries.includes(code)}
                          onCheckedChange={() => toggleCountry(code)}
                        />
                        <span className="text-sm font-medium">{code}</span>
                      </label>
                    ))}
                  </div>
                  {myAssignedCountries.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You don't have any country assignments yet.
                    </p>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseCreateDialog}>Cancel</Button>
                  <Button 
                    onClick={handleCreateKey} 
                    disabled={createKey.isPending || !newKeyName.trim() || selectedCountries.length === 0}
                  >
                    {createKey.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {myKeysLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading keys...</div>
        ) : myKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm">Create one to start using the API</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Used</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{key.key_prefix}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.country_codes.slice(0, 2).map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                        ))}
                        {key.country_codes.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{key.country_codes.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getKeyStatusBadge(key)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {key.last_used_at 
                        ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {key.is_active && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600">
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately disable the key "{key.name}". Any systems using this key will stop working.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={() => revokeKey.mutate(key.id)}
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the key "{key.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteKey.mutate(key.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* API Usage Instructions */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">API Usage</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Use your API key to update obligation statuses programmatically:
          </p>
          <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`curl -X POST https://api.ehdsexplorer.eu/update-obligation-status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "country_code": "DE",
    "obligation_id": "ehda_services",
    "status": "in_progress",
    "status_notes": "Implementation underway"
  }'`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
