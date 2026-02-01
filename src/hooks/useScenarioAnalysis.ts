import { useState, useCallback } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ScenarioAnalysisResult {
  content: string;
  isComplete: boolean;
}

export const useScenarioAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioAnalysisResult | null>(null);

  const analyzeScenario = useCallback(async (scenarioText: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const systemEnhancement = `
You are analyzing a specific scenario to provide EHDS compliance guidance. Structure your response as follows:

## 📋 Scenario Summary
Briefly restate the user's situation in 1-2 sentences.

## 📚 Relevant EHDS Articles
List the specific articles that apply to this scenario, with brief explanations of why each is relevant.

## ✅ What "Compliant" Looks Like
Describe the expected behavior or requirements to be compliant in this situation.

## 📝 Evidence & Documentation
What documentation, processes, or evidence would typically be needed to demonstrate compliance.

## ⚠️ Key Points to Watch
Any important deadlines, exceptions, or common pitfalls to be aware of.

## 🔗 Sources
Include clickable links to the relevant articles using the format [Article X](/articles/X).

Keep your response focused, practical, and actionable.`;

    const userMessage: Message = { 
      role: 'user', 
      content: `${systemEnhancement}\n\nAnalyze this scenario:\n\n${scenarioText}` 
    };

    let assistantContent = '';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ehds-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [userMessage],
            role: 'legal', // Use legal role for detailed compliance analysis
            explainLevel: 'professional'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setResult({ content: assistantContent, isComplete: false });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
            }
          } catch { /* ignore */ }
        }
      }

      setResult({ content: assistantContent, isComplete: true });
    } catch (e) {
      console.error('Scenario analysis error:', e);
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyzeScenario,
    isLoading,
    error,
    result,
    reset,
  };
};
