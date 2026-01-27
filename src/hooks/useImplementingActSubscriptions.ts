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

  // Unsubscribe using token via edge function (secure)
  const unsubscribe = useMutation({
    mutationFn: async (unsubscribeToken: string) => {
      const { data, error } = await supabase.functions.invoke("handle-unsubscribe", {
        body: { token: unsubscribeToken, action: "unsubscribe" },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to unsubscribe");
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

// Note: Subscription check removed for security - email lookup is only available to admins
// The subscribe button should track state locally after subscription
export const useCheckSubscription = (_email: string, _implementingActId?: string) => {
  // Return null - subscription status cannot be checked by unauthenticated users
  // This is intentional for security - prevents email enumeration attacks
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};
