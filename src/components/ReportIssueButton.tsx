import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReportIssueButtonProps {
  context?: string;
}

export function ReportIssueButton({ context }: ReportIssueButtonProps) {
  const email = "info@stefanbuttigieg.com"; // Replace with your email
  const subject = encodeURIComponent("EHDS Explorer - Issue Report");
  
  const body = encodeURIComponent(
    `Issue Type: [Bug / Content Correction / Suggestion]

Description:
[Please describe the issue here]

${context ? `Page: ${context}\n` : ""}
---
Browser: ${navigator.userAgent}
URL: ${window.location.href}
`
  );

  const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9"
          >
            <a href={mailtoLink}>
              <Bug className="h-4 w-4" />
              <span className="sr-only">Report Issue</span>
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Report an issue</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
