import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { usePlainLanguageFeedback } from "@/hooks/usePlainLanguageFeedback";

interface PlainLanguageFeedbackProps {
  translationId: string;
}

export const PlainLanguageFeedback = ({ translationId }: PlainLanguageFeedbackProps) => {
  const { feedbackGiven, isSubmitting, submitFeedback } = usePlainLanguageFeedback(translationId);
  const [selectedType, setSelectedType] = useState<"positive" | "negative" | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleFeedbackClick = (type: "positive" | "negative") => {
    setSelectedType(type);
    setShowCommentBox(true);
  };

  const handleSubmit = () => {
    if (selectedType) {
      submitFeedback(selectedType, comment);
      setShowCommentBox(false);
    }
  };

  const handleSkipComment = () => {
    if (selectedType) {
      submitFeedback(selectedType);
      setShowCommentBox(false);
    }
  };

  if (feedbackGiven) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks for your feedback!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!showCommentBox ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Was this helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackClick("positive")}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackClick("negative")}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedType === "positive" ? (
              <ThumbsUp className="h-4 w-4 text-green-600" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-600" />
            )}
            <span>Add a comment (optional)</span>
          </div>
          <Textarea
            placeholder="Tell us more about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="h-3 w-3 mr-1" />
              Submit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipComment}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
