import { useState, useRef } from "react";
import { useObligationEvidence, EvidenceWithProfile, EvidenceType } from "@/hooks/useObligationEvidence";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Link2, 
  FileText, 
  StickyNote, 
  Plus, 
  Trash2, 
  Download, 
  ExternalLink,
  Upload,
  File,
  Paperclip,
  User,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ObligationEvidenceManagerProps {
  countryCode: string;
  obligationId: string;
  obligationName: string;
  canEdit?: boolean;
}

export const ObligationEvidenceManager = ({
  countryCode,
  obligationId,
  obligationName,
  canEdit = true,
}: ObligationEvidenceManagerProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    evidence, 
    isLoading, 
    addLink, 
    addNote, 
    uploadDocument, 
    deleteEvidence,
    getDocumentUrl 
  } = useObligationEvidence(countryCode, obligationId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EvidenceType>("link");
  
  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddEvidence = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      if (activeTab === "link") {
        if (!url.trim()) {
          toast.error("Please enter a URL");
          return;
        }
        // Validate URL
        try {
          new URL(url);
        } catch {
          toast.error("Please enter a valid URL");
          return;
        }
        
        await addLink.mutateAsync({
          country_code: countryCode,
          obligation_id: obligationId,
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
        });
      } else if (activeTab === "note") {
        if (!description.trim()) {
          toast.error("Please enter note content");
          return;
        }
        
        await addNote.mutateAsync({
          country_code: countryCode,
          obligation_id: obligationId,
          title: title.trim(),
          description: description.trim(),
        });
      } else if (activeTab === "document") {
        if (!selectedFile) {
          toast.error("Please select a file");
          return;
        }
        
        await uploadDocument.mutateAsync({
          country_code: countryCode,
          obligation_id: obligationId,
          title: title.trim(),
          file: selectedFile,
          description: description.trim() || undefined,
        });
      }

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add evidence:", error);
    }
  };

  const handleDownload = async (item: EvidenceWithProfile) => {
    if (!item.file_path) return;
    
    try {
      const signedUrl = await getDocumentUrl(item.file_path);
      window.open(signedUrl, "_blank");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "link": return <Link2 className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "note": return <StickyNote className="h-4 w-4" />;
    }
  };

  const getEvidenceBadge = (type: EvidenceType) => {
    switch (type) {
      case "link": return <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" />Link</Badge>;
      case "document": return <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />Document</Badge>;
      case "note": return <Badge variant="outline" className="gap-1"><StickyNote className="h-3 w-3" />Note</Badge>;
    }
  };

  const isPending = addLink.isPending || addNote.isPending || uploadDocument.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Evidence
          </CardTitle>
          <CardDescription className="text-xs">
            Documents, links, and notes for {obligationName}
          </CardDescription>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Evidence</DialogTitle>
                <DialogDescription>
                  Add supporting documentation for this obligation
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EvidenceType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="link" className="gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </TabsTrigger>
                  <TabsTrigger value="document" className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Document
                  </TabsTrigger>
                  <TabsTrigger value="note" className="gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" />
                    Note
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Evidence title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <TabsContent value="link" className="mt-0 space-y-4">
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-desc">Description (optional)</Label>
                      <Textarea
                        id="link-desc"
                        placeholder="Brief description of this resource"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="document" className="mt-0 space-y-4">
                    <div>
                      <Label htmlFor="file">File</Label>
                      <div className="mt-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                          onChange={handleFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <File className="h-4 w-4" />
                          {selectedFile ? selectedFile.name : "Choose file..."}
                        </Button>
                        {selectedFile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown type"}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 10MB. PDF, Word, Excel, images, or text files.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="doc-desc">Description (optional)</Label>
                      <Textarea
                        id="doc-desc"
                        placeholder="Brief description of this document"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="note" className="mt-0 space-y-4">
                    <div>
                      <Label htmlFor="note-content">Content</Label>
                      <Textarea
                        id="note-content"
                        placeholder="Write your note here..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEvidence} disabled={isPending}>
                  {isPending ? "Adding..." : "Add Evidence"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Loading evidence...
          </div>
        ) : evidence.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No evidence added yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getEvidenceBadge(item.evidence_type)}
                      <span className="font-medium text-sm truncate">{item.title}</span>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.description}
                      </p>
                    )}

                    {item.evidence_type === "document" && item.file_name && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.file_name} • {formatFileSize(item.file_size)}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.profile && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.profile.display_name || item.profile.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.evidence_type === "link" && item.url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => window.open(item.url!, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    
                    {item.evidence_type === "document" && item.file_path && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {canEdit && (item.uploaded_by === user?.id || true) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{item.title}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteEvidence.mutate(item)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
