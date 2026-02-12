import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccessories,
  getUserAccessories,
  purchaseAccessory,
  equipAccessory,
  unequipAccessory,
  getUserPointBalance,
  getUserPointTransactions,
  updateAccessoryCustomMetadata,
} from "../services/apiAccessories";
import { useUser } from "../features/authentication/useUser";

export function useAccessoriesList(options = {}) {
  const filters = options.filters ?? null;

  return useQuery({
    queryKey: ["accessories", filters],
    queryFn: () => getAccessories(options.filters),
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  });
}

export function useUserAccessories(options = {}) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["user-accessories", user?.id],
    queryFn: () => getUserAccessories(user.id),
    enabled: !!user?.id,
    staleTime: options.staleTime ?? 60 * 1000,
  });
}

export function usePointBalance(options = {}) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["point-balance", user?.id],
    queryFn: () => getUserPointBalance(user.id),
    enabled: !!user?.id,
    staleTime: options.staleTime ?? 30 * 1000, // 30 seconds - keep data fresh
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000,
  });
}

export function usePointTransactions(limit = 20) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["point-transactions", user?.id, limit],
    queryFn: () => getUserPointTransactions(user.id, { limit }),
    enabled: !!user?.id,
  });
}

export function usePurchaseAccessory(options = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessoryId, slotOverride, userId = user?.id }) => {
      if (!userId) {
        throw new Error("User must be authenticated to purchase accessories");
      }
      return purchaseAccessory({ accessoryId, slotOverride, userId });
    },
    onSuccess: (_, variables) => {
      const targetUserId = variables.userId || user?.id;
      if (targetUserId) {
        queryClient.invalidateQueries(["user-accessories", targetUserId]);
        queryClient.invalidateQueries(["point-balance", targetUserId]);
        queryClient.invalidateQueries(["point-transactions", targetUserId]);
      }
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}

export function useEquipAccessory(options = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessoryId, slot, userId = user?.id }) => {
      if (!userId) {
        throw new Error("User must be authenticated to equip accessories");
      }
      return equipAccessory({ accessoryId, slot, userId });
    },
    onSuccess: (_, variables) => {
      const targetUserId = variables.userId || user?.id;
      if (targetUserId) {
        queryClient.invalidateQueries(["user-accessories", targetUserId]);
        queryClient.invalidateQueries(["point-balance", targetUserId]);
      }
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}

export function useUnequipAccessory(options = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessoryId, userId = user?.id }) => {
      if (!userId) {
        throw new Error("User must be authenticated to unequip accessories");
      }
      return unequipAccessory({ accessoryId, userId });
    },
    onSuccess: (_, variables) => {
      const targetUserId = variables.userId || user?.id;
      if (targetUserId) {
        queryClient.invalidateQueries(["user-accessories", targetUserId]);
        queryClient.invalidateQueries(["point-balance", targetUserId]);
      }
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}

export function useUpdateAccessoryMetadata(options = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessoryId, customMetadata, userId = user?.id }) => {
      if (!userId) {
        throw new Error("User must be authenticated");
      }
      return updateAccessoryCustomMetadata({
        userId,
        accessoryId,
        customMetadata,
      });
    },
    onSuccess: (_, variables) => {
      const targetUserId = variables.userId || user?.id;
      if (targetUserId) {
        queryClient.invalidateQueries(["user-accessories", targetUserId]);
      }
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}
