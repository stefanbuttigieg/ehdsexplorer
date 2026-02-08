import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToolkitQuestions, type ToolkitOption } from "@/hooks/useToolkitQuestions";
import { useToolkitProfile, useToolkitRecommendations } from "@/hooks/useToolkitProfile";
import { StarterKitResults } from "./StarterKitResults";

export function StarterKitWizard() {
  const { data: questions = [], isLoading } = useToolkitQuestions();
  const { saveProfile } = useToolkitProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState(false);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [orgSize, setOrgSize] = useState<string | null>(null);

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer = Array.isArray(currentAnswer)
    ? currentAnswer.length > 0
    : !!currentAnswer;

  const handleSingleChoice = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  const handleMultiChoice = useCallback(
    (value: string, checked: boolean) => {
      if (!currentQuestion) return;
      setAnswers((prev) => {
        const existing = (prev[currentQuestion.id] as string[]) || [];
        return {
          ...prev,
          [currentQuestion.id]: checked
            ? [...existing, value]
            : existing.filter((v) => v !== value),
        };
      });
    },
    [currentQuestion]
  );

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Submit
      const pt = (answers["q-org-type"] as string) ?? "";
      const os = (answers["q-org-size"] as string) ?? "";
      setProfileType(pt);
      setOrgSize(os);

      try {
        await saveProfile.mutateAsync({
          answers,
          profileType: pt,
          organizationSize: os,
        });
      } catch {
        // Save failed but still show results from local data
      }
      setCompleted(true);
    }
  }, [currentStep, totalSteps, answers, saveProfile]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setCompleted(false);
    setProfileType(null);
    setOrgSize(null);
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
          No wizard questions configured yet.
        </CardContent>
      </Card>
    );
  }

  if (completed && profileType) {
    return (
      <StarterKitResults
        profileType={profileType}
        organizationSize={orgSize}
        answers={answers}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Progress header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Compliance Starter Kit
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        {currentQuestion.description && (
          <CardDescription>{currentQuestion.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-6">
        {currentQuestion.question_type === "single_choice" ? (
          <RadioGroup
            value={(currentAnswer as string) ?? ""}
            onValueChange={handleSingleChoice}
            className="space-y-3"
          >
            {currentQuestion.options.map((opt: ToolkitOption) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  currentAnswer === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium text-sm">{opt.label}</span>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((opt: ToolkitOption) => {
              const selected = ((currentAnswer as string[]) ?? []).includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) =>
                      handleMultiChoice(opt.value, !!checked)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{opt.label}</span>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

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
            disabled={!hasAnswer || saveProfile.isPending}
            className="gap-2"
          >
            {saveProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === totalSteps - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Get My Roadmap
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
