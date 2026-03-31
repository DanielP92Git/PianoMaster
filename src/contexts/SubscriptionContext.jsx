import { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSubscriptionStatus } from "../services/subscriptionService";
import { useUser } from "../features/authentication/useUser";
import supabase from "../services/supabase";
import toast from "react-hot-toast";

const SubscriptionContext = createContext();

/**
 * SubscriptionProvider — provides isPremium status globally via React Query.
 *
 * Features:
 * - Fetches parent_subscriptions on auth, with staleTime: 0 (SVC-02)
 * - Subscribes to Supabase Realtime postgres_changes for instant invalidation (SVC-03)
 * - Shows "Premium unlocked!" toast only on false -> true transition (Pitfall 2 guard)
 * - Silent degradation on error (isPremium defaults to false)
 *
 * @param {{ children: React.ReactNode }} props
 */
export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => fetchSubscriptionStatus(userId),
    enabled: isAuthenticated && !!userId,
    staleTime: 0, // SVC-02: always considered stale — Realtime handles push invalidation
    refetchOnWindowFocus: false, // Realtime handles push; no window-focus poll needed
    retry: 1,
  });

  // SVC-03: Realtime channel for instant invalidation after webhook writes to parent_subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`subscription-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_subscriptions",
          filter: `student_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[SubscriptionContext] Realtime status:", status); // eslint-disable-line no-console
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Toast de-duplication guard (Pitfall 2):
  // Only show toast when isPremium transitions from false -> true.
  // Do NOT show toast in the Realtime callback — reconnect can re-deliver events.
  // Skip while data is undefined (loading) to avoid false→true on initial load for existing subscribers.
  const prevIsPremiumRef = useRef(null);

  useEffect(() => {
    if (data === undefined) return;
    if (prevIsPremiumRef.current === false && data?.isPremium === true) {
      toast.success("Premium unlocked!", { duration: 4000 });
    }
    prevIsPremiumRef.current = data?.isPremium ?? false;
  }, [data]);

  // Default to false: safe degradation while loading, on error, or no subscription
  const isPremium = data?.isPremium ?? false;

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * useSubscription — access subscription status from any component in the app.
 *
 * @returns {{ isPremium: boolean, isLoading: boolean }}
 * @throws {Error} if used outside of SubscriptionProvider
 */
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
