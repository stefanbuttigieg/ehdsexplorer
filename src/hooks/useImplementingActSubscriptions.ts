import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Subscription {
  id: string;
  email: string;
  implementing_act_id: string | null;
  subscribe_all: boolean;
  created_at: string;
  unsubscribe_token: string;
  verified: boolean;
  verification_token: string;
}

export const useImplementingActSubscriptions = () => {
  const queryClient = useQueryClient();

  // Subscribe to a specific implementing act or all
  const subscribe = useMutation({
    mutationFn: async ({ 
      email, 
      implementingActId,
      subscribeAll = false 
    }: { 
      email: string; 
      implementingActId?: string;
      subscribeAll?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("implementing_act_subscriptions")
        .insert({
          email,
          implementing_act_id: subscribeAll ? null : implementingActId,
          subscribe_all: subscribeAll,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You are already subscribed to this implementing act");
        }
        throw error;
      }

      // Send verification email
      try {
        await supabase.functions.invoke("send-verification-email", {
          body: { subscription_id: data.id },
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Please check your email to verify your subscription.");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to subscribe");
    },
  });

  // Unsubscribe using token
  const unsubscribe = useMutation({
    mutationFn: async (unsubscribeToken: string) => {
      const { error } = await supabase
        .from("implementing_act_subscriptions")
        .delete()
        .eq("unsubscribe_token", unsubscribeToken);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Successfully unsubscribed from alerts");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: () => {
      toast.error("Failed to unsubscribe");
    },
  });

  return {
    subscribe,
    unsubscribe,
  };
};

// Hook for checking if email is subscribed (for UI state)
export const useCheckSubscription = (email: string, implementingActId?: string) => {
  return useQuery({
    queryKey: ["subscription-check", email, implementingActId],
    queryFn: async () => {
      if (!email) return null;

      let query = supabase
        .from("implementing_act_subscriptions")
        .select("id, subscribe_all")
        .eq("email", email);

      if (implementingActId) {
        query = query.or(`implementing_act_id.eq.${implementingActId},subscribe_all.eq.true`);
      }

      const { data, error } = await query.maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!email,
  });
};
