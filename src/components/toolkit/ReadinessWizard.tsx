import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import {
  useReadinessQuestions,
  useSaveAssessment,
  calculateScores,
  CATEGORY_LABELS,
  type ReadinessOption,
  type AssessmentResult,
} from "@/hooks/useReadinessAssessment";
import { ReadinessResults } from "./ReadinessResults";

export function ReadinessWizard() {
  const { data: questions = [], isLoading } = useReadinessQuestions();
  const saveAssessment = useSaveAssessment();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const hasAnswer = currentQuestion ? !!answers[currentQuestion.id] : false;

  // Group questions by category for the step indicator
  const categoryOrder = useMemo(() => {
    const seen = new Set<string>();
    return questions.reduce<string[]>((acc, q) => {
      if (!seen.has(q.category)) {
        seen.add(q.category);
        acc.push(q.category);
      }
      return acc;
    }, []);
  }, [questions]);

  const currentCategory = currentQuestion?.category;

  const handleChoice = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      const scores = calculateScores(questions, answers);
      setResult(scores);

      try {
        await saveAssessment.mutateAsync({ answers, result: scores });
      } catch {
        // Save failed but still show results
      }
    }
  }, [currentStep, totalSteps, answers, questions, saveAssessment]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No assessment questions configured yet.
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return <ReadinessResults result={result} onRestart={handleRestart} />;
  }

  return (
    <Card className="overflow-hidden">
      {/* Progress header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentStep + 1} of {totalSteps}
          </span>
          <Badge variant="outline" className="text-xs">
            <ClipboardCheck className="h-3 w-3 mr-1" />
            Readiness Assessment
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {categoryOrder.map((cat) => (
            <Badge
              key={cat}
              variant={cat === currentCategory ? "default" : "secondary"}
              className="text-xs font-normal"
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </Badge>
          ))}
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-normal">
            {CATEGORY_LABELS[currentQuestion.category] ?? currentQuestion.category}
          </Badge>
          {currentQuestion.weight >= 3 && (
            <Badge variant="destructive" className="text-xs">High Weight</Badge>
          )}
        </div>
        <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        {currentQuestion.description && (
          <CardDescription>{currentQuestion.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-6">
        <RadioGroup
          value={answers[currentQuestion.id] ?? ""}
          onValueChange={handleChoice}
          className="space-y-3"
        >
          {currentQuestion.options.map((opt: ReadinessOption) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                answers[currentQuestion.id] === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-sm">{opt.label}</span>
              </div>
            </label>
          ))}
        </RadioGroup>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasAnswer || saveAssessment.isPending}
            className="gap-2"
          >
            {saveAssessment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === totalSteps - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Get My Score
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
