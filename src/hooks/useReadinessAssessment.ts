import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReadinessOption {
  value: string;
  label: string;
  score: number;
}

export interface ReadinessQuestion {
  id: string;
  category: string;
  question: string;
  description: string | null;
  options: ReadinessOption[];
  weight: number;
  sort_order: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionCount: number;
}

export interface AssessmentResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  categoryScores: CategoryScore[];
  level: "beginner" | "developing" | "advanced" | "ready";
}

const CATEGORY_LABELS: Record<string, string> = {
  data_governance: "Data Governance",
  technical_readiness: "Technical Readiness",
  compliance_framework: "Compliance Framework",
  cross_border: "Cross-Border Readiness",
  security_privacy: "Security & Privacy",
};

export { CATEGORY_LABELS };

function getSessionId(): string {
  let sid = sessionStorage.getItem("readiness-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("readiness-session-id", sid);
  }
  return sid;
}

export function useReadinessQuestions() {
  return useQuery({
    queryKey: ["readiness-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_questions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;

      return (data ?? []).map((q) => ({
        ...q,
        options: (q.options as unknown as ReadinessOption[]) ?? [],
      })) as ReadinessQuestion[];
    },
  });
}

export function calculateScores(
  questions: ReadinessQuestion[],
  answers: Record<string, string>
): AssessmentResult {
  const categoryMap = new Map<
    string,
    { score: number; maxScore: number; count: number }
  >();

  for (const q of questions) {
    const selectedValue = answers[q.id];
    const selectedOption = q.options.find((o) => o.value === selectedValue);
    const score = selectedOption ? selectedOption.score * q.weight : 0;
    const maxScore = Math.max(...q.options.map((o) => o.score)) * q.weight;

    const existing = categoryMap.get(q.category) ?? {
      score: 0,
      maxScore: 0,
      count: 0,
    };
    categoryMap.set(q.category, {
      score: existing.score + score,
      maxScore: existing.maxScore + maxScore,
      count: existing.count + 1,
    });
  }

  const categoryScores: CategoryScore[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      score: data.score,
      maxScore: data.maxScore,
      percentage: data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0,
      questionCount: data.count,
    })
  );

  const totalScore = categoryScores.reduce((sum, c) => sum + c.score, 0);
  const maxScore = categoryScores.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let level: AssessmentResult["level"];
  if (percentage >= 80) level = "ready";
  else if (percentage >= 55) level = "advanced";
  else if (percentage >= 30) level = "developing";
  else level = "beginner";

  return { totalScore, maxScore, percentage, categoryScores, level };
}

export function useSaveAssessment() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      answers: Record<string, string>;
      result: AssessmentResult;
    }) => {
      const scores: Record<string, unknown> = {};
      for (const cs of params.result.categoryScores) {
        scores[cs.category] = {
          score: cs.score,
          maxScore: cs.maxScore,
          percentage: cs.percentage,
        };
      }

      const { data, error } = await supabase
        .from("readiness_assessments")
        .insert({
          user_id: user?.id ?? null,
          session_id: user ? null : getSessionId(),
          answers: params.answers as unknown as Record<string, never>,
          scores: scores as unknown as Record<string, never>,
          total_score: params.result.totalScore,
          max_score: params.result.maxScore,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
