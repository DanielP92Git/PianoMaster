import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import supabase from "../services/supabase";
import { useUser } from "../features/authentication/useUser";

// Global state to track subscriptions across React StrictMode reruns
const globalSubscriptionState = {
  currentUserId: null,
  subscription: null,
  isSettingUp: false,
};

export function useRealTimeSubscriptions() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const subscriptionsRef = useRef([]);
  const hasInitialized = useRef(false);

  // Stable cleanup function
  const cleanupSubscriptions = useCallback(() => {

    if (globalSubscriptionState.subscription) {
      try {
        globalSubscriptionState.subscription.unsubscribe();
      } catch (error) {
        console.warn("Error unsubscribing:", error);
      }
    }

    globalSubscriptionState.subscription = null;
    globalSubscriptionState.currentUserId = null;
    globalSubscriptionState.isSettingUp = false;
    subscriptionsRef.current = [];
  }, []);

  // Setup subscriptions function
  const setupSubscriptions = useCallback(
    (userId) => {
      // If already setting up, return
      if (globalSubscriptionState.isSettingUp) {
        return;
      }

      // If subscription already exists for this user, reuse it
      if (
        globalSubscriptionState.currentUserId === userId &&
        globalSubscriptionState.subscription
      ) {
        subscriptionsRef.current = [globalSubscriptionState.subscription];
        return;
      }

      // Mark as setting up
      globalSubscriptionState.isSettingUp = true;

      // Clean up any existing subscription
      if (globalSubscriptionState.subscription) {
        try {
          globalSubscriptionState.subscription.unsubscribe();
        } catch (error) {
          console.warn("Error unsubscribing previous:", error);
        }
      }

      // Create new subscription
      const subscription = supabase
        .channel(`student_data_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "student_achievements",
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: ["achievements", userId],
              });
              queryClient.invalidateQueries({
                queryKey: ["recent-achievements", userId],
              });
            }, 50);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "student_profiles",
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["scores"] });
              queryClient.invalidateQueries({
                queryKey: ["user-scores", userId],
              });
            }, 50);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "practice_sessions",
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: ["practice-sessions", userId],
              });
            }, 50);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "current_streak",
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["streak"] });
            }, 50);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "students_total_score",
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["scores"] });
              queryClient.invalidateQueries({
                queryKey: ["user-scores", userId],
              });
            }, 50);
          }
        )
        .subscribe((status) => {
          
          globalSubscriptionState.isSettingUp = false;
        });

      // Store in global state
      globalSubscriptionState.subscription = subscription;
      globalSubscriptionState.currentUserId = userId;
      subscriptionsRef.current = [subscription];
    },
    [queryClient]
  );

  useEffect(() => {
    const userId = user?.id;

    // If no user, clean up and return
    if (!userId) {
      if (globalSubscriptionState.currentUserId) {
        cleanupSubscriptions();
      }
      hasInitialized.current = false;
      return;
    }

    // If already initialized for this user, just sync local state
    if (
      globalSubscriptionState.currentUserId === userId &&
      globalSubscriptionState.subscription
    ) {
      subscriptionsRef.current = [globalSubscriptionState.subscription];
      hasInitialized.current = true;
      return;
    }

    // If different user or not initialized, setup subscriptions
    if (
      !hasInitialized.current ||
      globalSubscriptionState.currentUserId !== userId
    ) {
      hasInitialized.current = true;
      setupSubscriptions(userId);
    }

    // Simple cleanup function - only cleanup if user changes
    return () => {
      // Only cleanup if user actually changed
      if (globalSubscriptionState.currentUserId !== userId) {
        cleanupSubscriptions();
      }
    };
  }, [user?.id, setupSubscriptions, cleanupSubscriptions]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  return {
    isConnected: subscriptionsRef.current.length > 0,
    subscriptionsCount: subscriptionsRef.current.length,
  };
}
