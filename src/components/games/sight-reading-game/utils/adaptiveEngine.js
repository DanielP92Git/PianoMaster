// Phase 03 — Adaptive Pedagogy (ADAPT-01/02/03). Pure, side-effect-free engine functions.
// No React, no DB, no component state — mirrors patternBuilder.js's config-in/config-out
// discipline. Imports only from the sibling constants module (see 03-01-PLAN.md).
import {
  MIN_TIER_INDEX,
  MAX_TIER_INDEX,
  ESCALATE_SUCCESS_STREAK,
  EASE_MISS_RUN,
  BASE_TEMPO_CLAMP_MIN_FRACTION,
  BASE_TEMPO_CLAMP_MAX_FRACTION,
  MASTERY_MIN_ATTEMPTS,
  WEAK_ACCURACY_THRESHOLD,
  WEAK_NOTE_WEIGHT,
} from "../constants/adaptiveTiers";

// computeNextTier({ successStreak, missRunInLastExercise, currentTierIndex }) => { tierIndex, didEscalate }
// Easing takes precedence over escalation. Uses MIN_TIER_INDEX/MAX_TIER_INDEX/ESCALATE_SUCCESS_STREAK/EASE_MISS_RUN.
export function computeNextTier({
  successStreak = 0,
  missRunInLastExercise = 0,
  currentTierIndex = 0,
} = {}) {
  if (missRunInLastExercise >= EASE_MISS_RUN) {
    return {
      tierIndex: Math.max(MIN_TIER_INDEX, currentTierIndex - 1),
      didEscalate: false,
    };
  }

  if (successStreak >= ESCALATE_SUCCESS_STREAK) {
    const nextTierIndex = Math.min(MAX_TIER_INDEX, currentTierIndex + 1);
    return {
      tierIndex: nextTierIndex,
      didEscalate: nextTierIndex !== currentTierIndex,
    };
  }

  return { tierIndex: currentTierIndex, didEscalate: false };
}

// applyTierToSettings(baseSettings, tier, nodeSupersetNotes = []) => new settings object
// baseSettings.tempo is the node's BASE tempo. Clamp with BASE_TEMPO_CLAMP_*_FRACTION.
// Widen selectedNotes only when tier.widenNotes; toggle rests per tier.includeRests. Never mutate baseSettings.
export function applyTierToSettings(
  baseSettings,
  tier,
  nodeSupersetNotes = []
) {
  const baseTempo = baseSettings?.tempo ?? 0;
  const minTempo = baseTempo * BASE_TEMPO_CLAMP_MIN_FRACTION;
  const maxTempo = baseTempo * BASE_TEMPO_CLAMP_MAX_FRACTION;
  const rawTempo = baseTempo + (tier?.tempoDeltaBpm ?? 0);
  const clampedTempo = Math.min(maxTempo, Math.max(minTempo, rawTempo));

  const baseSelectedNotes = Array.isArray(baseSettings?.selectedNotes)
    ? baseSettings.selectedNotes
    : [];
  const superset = Array.isArray(nodeSupersetNotes) ? nodeSupersetNotes : [];
  const selectedNotes = tier?.widenNotes
    ? [...new Set([...baseSelectedNotes, ...superset])]
    : baseSelectedNotes;

  let rhythmSettings = baseSettings?.rhythmSettings;
  if (tier?.includeRests === false) {
    rhythmSettings = {
      ...(baseSettings?.rhythmSettings ?? {}),
      allowRests: false,
    };
  } else if (tier?.includeRests === true) {
    rhythmSettings = {
      ...(baseSettings?.rhythmSettings ?? {}),
      allowRests: true,
    };
  }

  return {
    ...baseSettings,
    tempo: clampedTempo,
    selectedNotes,
    rhythmSettings,
  };
}

// buildWeightedNotePool(basePool, masteryMap, minAttempts = MASTERY_MIN_ATTEMPTS)
//   => { [pitch]: weight } per-pitch weight map (never a duplicated array — see CR-01,
//   03-REVIEW.md: patternBuilder.js hard-dedupes `selectedNotes` before picking a note, so
//   duplication-based weighting is silently discarded before it can have any effect).
// masteryMap shape: { [pitch]: { correct, total } }. accuracy = total ? correct/total*100 : 100.
// Consumed by patternBuilder.js's weighted random note pick (generatePatternData's
// `noteWeights` config field) — every pitch in basePool gets an entry (weak pitches get
// WEAK_NOTE_WEIGHT, everyone else 1), so callers never need a separate "is this weighted"
// branch downstream.
export function buildWeightedNotePool(
  basePool = [],
  masteryMap = {},
  minAttempts = MASTERY_MIN_ATTEMPTS
) {
  const safeMasteryMap = masteryMap ?? {};
  const weights = {};

  for (const pitch of basePool) {
    const stats = safeMasteryMap[pitch];
    const total = stats?.total ?? 0;
    const correct = stats?.correct ?? 0;
    const accuracy = total ? (correct / total) * 100 : 100;
    const isWeak = total >= minAttempts && accuracy < WEAK_ACCURACY_THRESHOLD;

    weights[pitch] = isWeak ? WEAK_NOTE_WEIGHT : 1;
  }

  return weights;
}
