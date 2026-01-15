import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, ArrowRight, Book, Bookmark, Bell, Users, Star, Sparkles, Check } from "lucide-react";
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
};

export function SignupCTA() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: steps = [] } = useOnboardingSteps();
  const { user } = useAuth();

  // Don't show if user is logged in
  if (user) return null;

  return (
    <section className="py-10 px-4 border-b border-border">
      <div className="max-w-4xl mx-auto">
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="relative pt-8 pb-8 px-6 md:px-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Icon section */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <UserPlus className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 font-serif">
                  Unlock Your EHDS Journey
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  Create a free account to save your progress, take notes, collaborate with teams, 
                  and stay updated on implementing acts.
                </p>

                {/* Features preview */}
                <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
                  {steps.slice(0, 4).map((step) => {
                    const IconComponent = iconMap[step.icon] || Star;
                    return (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm"
                      >
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span>{step.title}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                        <Sparkles className="h-5 w-5" />
                        Get Started Free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Welcome to EHDS Explorer</DialogTitle>
                      </DialogHeader>
                      <OnboardingFlow steps={steps} onComplete={() => setDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  
                  <Link to="/admin/auth">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Already have an account?
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
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
      <div className="py-6 text-center">
        <p className="text-muted-foreground mb-6">
          Create a free account to unlock all features of EHDS Explorer.
        </p>
        <Link to="/admin/auth" onClick={onComplete}>
          <Button size="lg" className="gap-2">
            <UserPlus className="h-5 w-5" />
            Sign Up Now
          </Button>
        </Link>
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
