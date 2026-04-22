import { useState } from "react";
import { Loader2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useSubmitETranslation,
  useTranslationJob,
  type ETranslationTargetType,
} from "@/hooks/useETranslation";

// 24 official EU languages supported by eTranslation
const EU_LANGUAGES: { code: string; name: string }[] = [
  { code: "BG", name: "Bulgarian" },
  { code: "CS", name: "Czech" },
  { code: "DA", name: "Danish" },
  { code: "DE", name: "German" },
  { code: "EL", name: "Greek" },
  { code: "EN", name: "English" },
  { code: "ES", name: "Spanish" },
  { code: "ET", name: "Estonian" },
  { code: "FI", name: "Finnish" },
  { code: "FR", name: "French" },
  { code: "GA", name: "Irish" },
  { code: "HR", name: "Croatian" },
  { code: "HU", name: "Hungarian" },
  { code: "IT", name: "Italian" },
  { code: "LT", name: "Lithuanian" },
  { code: "LV", name: "Latvian" },
  { code: "MT", name: "Maltese" },
  { code: "NL", name: "Dutch" },
  { code: "PL", name: "Polish" },
  { code: "PT", name: "Portuguese" },
  { code: "RO", name: "Romanian" },
  { code: "SK", name: "Slovak" },
  { code: "SL", name: "Slovenian" },
  { code: "SV", name: "Swedish" },
];

interface ETranslateButtonProps {
  text: string;
  sourceLanguage?: string;
  targetType?: ETranslationTargetType;
  targetId?: string;
  targetField?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function ETranslateButton({
  text,
  sourceLanguage = "EN",
  targetType = "snippet",
  targetId,
  targetField,
  variant = "outline",
  size = "sm",
  label = "Translate (EC)",
}: ETranslateButtonProps) {
  const [target, setTarget] = useState<string>("FR");
  const [jobId, setJobId] = useState<string | null>(null);
  const submit = useSubmitETranslation();
  const { data: job } = useTranslationJob(jobId);

  const handleSubmit = async () => {
    if (!text?.trim()) {
      toast.error("Nothing to translate");
      return;
    }
    try {
      const res = await submit.mutateAsync({
        text,
        sourceLanguage,
        targetLanguage: target,
        targetType,
        targetId,
        targetField,
      });
      setJobId(res.jobId);
      toast.success("Submitted to eTranslation. Awaiting EC callback…");
    } catch {
      // toast handled in hook
    }
  };

  const isPending = submit.isPending || job?.status === "pending";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Languages className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">European Commission eTranslation</p>
            <p className="text-xs text-muted-foreground">
              Official EU machine translation. Asynchronous — results arrive via callback.
            </p>
          </div>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger>
              <SelectValue placeholder="Target language" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-64">
                {EU_LANGUAGES.filter((l) => l.code !== sourceLanguage.toUpperCase()).map(
                  (l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </SelectItem>
                  )
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
            size="sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {job?.status === "pending" ? "Awaiting EC…" : "Submitting…"}
              </>
            ) : (
              "Translate"
            )}
          </Button>

          {job?.status === "completed" && job.translated_text && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {job.target_language}
              </p>
              <p className="whitespace-pre-wrap">{job.translated_text}</p>
            </div>
          )}
          {job?.status === "failed" && (
            <p className="text-xs text-destructive">
              Failed: {job.error_message || "Unknown error"}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}