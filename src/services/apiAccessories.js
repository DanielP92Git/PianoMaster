import supabase from "./supabase";
import { calculatePointsSummary } from "../utils/points";
import {
  getStudentScoreValues,
  getAchievementPointsTotal,
} from "./apiDatabase";

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function syncEquippedAccessoriesCacheBestEffort(userId) {
  try {
    // Cache sync is helpful but should never block UI flows (equip/unlock modals).
    await withTimeout(syncEquippedAccessoriesCache(userId), 4000, "Accessory cache sync");
  } catch (error) {
    console.warn("[accessories] equipped cache sync skipped:", error?.message || error);
  }
}

const USER_ACCESSORY_SELECT = `
  *,
  accessory:accessories(*),
  custom_metadata
`;

async function fetchAccessoryById(accessoryId) {
  const { data, error } = await supabase
    .from("accessories")
    .select("*")
    .eq("id", accessoryId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to load accessory");
  }

  return data;
}

async function fetchLedgerDelta(userId) {
  const { data, error } = await supabase
    .from("student_point_transactions")
    .select("delta")
    .eq("student_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to load point ledger");
  }

  return data?.reduce((sum, tx) => sum + (tx.delta || 0), 0) ?? 0;
}

async function syncEquippedAccessoriesCache(userId) {
  const { data, error } = await supabase
    .from("user_accessories")
    .select(
      "accessory_id, slot, custom_metadata, accessory:accessories(image_url, category, metadata)"
    )
    .eq("user_id", userId)
    .eq("is_equipped", true);

  if (error) {
    console.error("Failed to load equipped accessories for cache sync", error);
    return;
  }

  const payload = (data || []).map((entry) => ({
    accessory_id: entry.accessory_id,
    slot: entry.slot,
    image_url: entry.accessory?.image_url || null,
    category: entry.accessory?.category || null,
    metadata: entry.accessory?.metadata || {},
    custom_metadata: entry.custom_metadata || {},
  }));

  const { error: updateError } = await supabase
    .from("students")
    .update({ equipped_accessories: payload })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update equipped accessory cache", updateError);
  }
}

export async function getAccessories({ category } = {}) {
  let query = supabase.from("accessories").select("*");
  if (category) {
    query = query.eq("category", category);
  }
  query = query.order("price_points", { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to fetch accessories");
  }
  return data ?? [];
}

export async function getUserAccessories(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_accessories")
    .select(USER_ACCESSORY_SELECT)
    .eq("user_id", userId)
    .order("purchased_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch user accessories");
  }
  return data ?? [];
}

export async function getEquippedAccessories(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_accessories")
    .select(USER_ACCESSORY_SELECT)
    .eq("user_id", userId)
    .eq("is_equipped", true);

  if (error) {
    throw new Error(error.message || "Failed to fetch equipped accessories");
  }
  return data ?? [];
}

export async function getUserPointBalance(userId) {
  if (!userId) return { earned: 0, ledgerDelta: 0, available: 0 };

  const [scores, achievementPoints, ledgerDelta] = await Promise.all([
    getStudentScoreValues(userId),
    getAchievementPointsTotal(userId),
    fetchLedgerDelta(userId),
  ]);

  const { totalPoints } = calculatePointsSummary({
    scores,
    achievementPointsOverride: achievementPoints,
  });

  const available = totalPoints + ledgerDelta;
  return {
    earned: totalPoints,
    ledgerDelta,
    available,
  };
}

export async function purchaseAccessory({ userId, accessoryId, slotOverride }) {
  if (!userId || !accessoryId) {
    throw new Error("Missing user or accessory");
  }

  const accessory = await fetchAccessoryById(accessoryId);

  const existing = await supabase
    .from("user_accessories")
    .select("id")
    .eq("user_id", userId)
    .eq("accessory_id", accessoryId)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    throw new Error(existing.error.message || "Failed to check ownership");
  }

  if (existing.data) {
    throw new Error("Accessory already owned");
  }

  const { available } = await getUserPointBalance(userId);
  if (available < accessory.price_points) {
    throw new Error("Not enough points to buy this accessory");
  }

  const slot = slotOverride || accessory.category || "auto";

  const { data: ownership, error: ownershipError } = await supabase
    .from("user_accessories")
    .insert([
      {
        user_id: userId,
        accessory_id: accessoryId,
        slot,
      },
    ])
    .select(USER_ACCESSORY_SELECT)
    .single();

  if (ownershipError) {
    throw new Error(ownershipError.message || "Failed to grant accessory");
  }

  const { error: ledgerError } = await supabase
    .from("student_point_transactions")
    .insert([
      {
        student_id: userId,
        delta: -Math.abs(accessory.price_points),
        reason: "accessory_purchase",
        metadata: {
          accessory_id: accessoryId,
          slot,
        },
      },
    ]);

  if (ledgerError) {
    // Try to roll back ownership insert
    await supabase
      .from("user_accessories")
      .delete()
      .eq("id", ownership.id)
      .eq("user_id", userId);

    throw new Error(ledgerError.message || "Failed to record point spend");
  }

  await syncEquippedAccessoriesCache(userId);
  return ownership;
}

export async function equipAccessory({ userId, accessoryId, slot }) {
  if (!userId || !accessoryId) {
    throw new Error("Missing user or accessory to equip");
  }

  const { data: record, error: fetchError } = await supabase
    .from("user_accessories")
    .select(USER_ACCESSORY_SELECT)
    .eq("user_id", userId)
    .eq("accessory_id", accessoryId)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message || "Accessory not owned");
  }

  if (!record) {
    throw new Error("Accessory not owned");
  }

  const targetSlot =
    slot || record.slot || record.accessory?.category || "auto";

  // Unequip other accessories in the same slot
  const { error: unequipError } = await supabase
    .from("user_accessories")
    .update({
      is_equipped: false,
      equipped_at: null,
    })
    .eq("user_id", userId)
    .eq("slot", targetSlot);

  if (unequipError) {
    throw new Error(unequipError.message || "Failed to unequip existing accessory");
  }

  const { data, error } = await supabase
    .from("user_accessories")
    .update({
      is_equipped: true,
      slot: targetSlot,
      equipped_at: new Date().toISOString(),
    })
    .eq("id", record.id)
    .select(USER_ACCESSORY_SELECT)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Failed to equip accessory");
  }

  // Best-effort cache sync; don't block UI if it stalls.
  void syncEquippedAccessoriesCacheBestEffort(userId);
  return data;
}

export async function unequipAccessory({ userId, accessoryId }) {
  if (!userId || !accessoryId) {
    throw new Error("Missing user or accessory to unequip");
  }

  const { data, error } = await supabase
    .from("user_accessories")
    .update({
      is_equipped: false,
      equipped_at: null,
    })
    .eq("user_id", userId)
    .eq("accessory_id", accessoryId)
    .select(USER_ACCESSORY_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to unequip accessory");
  }

  // Best-effort cache sync; don't block UI if it stalls.
  void syncEquippedAccessoriesCacheBestEffort(userId);
  return data;
}

export async function getUserPointTransactions(userId, { limit = 20 } = {}) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("student_point_transactions")
    .select("*")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Failed to fetch point history");
  }
  return data ?? [];
}

export async function updateAccessoryCustomMetadata({
  userId,
  accessoryId,
  customMetadata,
}) {
  if (!userId || !accessoryId) {
    throw new Error("Missing user or accessory");
  }

  const { error } = await supabase
    .from("user_accessories")
    .update({ custom_metadata: customMetadata })
    .eq("user_id", userId)
    .eq("accessory_id", accessoryId);

  if (error) {
    throw new Error(error.message || "Failed to update accessory position");
  }

  // Re-sync equipped accessories cache
  void syncEquippedAccessoriesCacheBestEffort(userId);
}
