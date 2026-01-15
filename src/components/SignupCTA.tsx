import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, ArrowRight, Book, Bookmark, Bell, Users, Star, Sparkles, Check, StickyNote, Highlighter, Share2 } from "lucide-react";
import { useOnboardingSteps } from "@/hooks/useOnboardingSteps";
import { useAuth } from "@/hooks/useAuth";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  book: Book,
  bookmark: Bookmark,
  bell: Bell,
  users: Users,
  star: Star,
  sparkles: Sparkles,
  check: Check,
  "sticky-note": StickyNote,
  highlighter: Highlighter,
  share: Share2,
};

export function SignupCTA() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: steps = [] } = useOnboardingSteps();
  const { user, loading } = useAuth();

  // Don't show if user is logged in or still loading
  if (loading || user) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Up</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Welcome to EHDS Explorer</DialogTitle>
        </DialogHeader>
        <OnboardingFlow steps={steps} onComplete={() => setDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface OnboardingFlowProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    step_order: number;
  }>;
  onComplete: () => void;
}

function OnboardingFlow({ steps, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Create a free account to unlock all features of EHDS Explorer.
          </p>
        </div>
        <div className="space-y-3">
          <Link to="/admin/auth" onClick={onComplete} className="block">
            <Button size="lg" className="w-full gap-2">
              <UserPlus className="h-5 w-5" />
              Sign Up Now
            </Button>
          </Link>
          <Link to="/admin/auth" onClick={onComplete} className="block">
            <Button variant="outline" size="lg" className="w-full">
              Already have an account? Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  const IconComponent = iconMap[step.icon] || Star;

  return (
    <div className="py-4">
      {/* Progress indicator */}
      <div className="flex gap-1.5 mb-8 justify-center">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? "w-8 bg-primary"
                : index < currentStep
                ? "w-4 bg-primary/50"
                : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
          <IconComponent className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{step.description}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="min-w-[100px]"
        >
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Link to="/admin/auth" onClick={onComplete} className="flex-1">
            <Button size="lg" className="w-full gap-2">
              <UserPlus className="h-5 w-5" />
              Create Account
            </Button>
          </Link>
        ) : (
          <Button onClick={handleNext} className="flex-1 gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Skip option */}
      <div className="text-center mt-4">
        <Link
          to="/admin/auth"
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip and sign up now →
        </Link>
      </div>
    </div>
  );
}
