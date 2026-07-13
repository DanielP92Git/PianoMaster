// Phase 03 — Adaptive Pedagogy (ADAPT-01/02/03). Pure, side-effect-free engine functions.
// No React, no DB, no component state — mirrors patternBuilder.js's config-in/config-out
// discipline. Imports only from the sibling constants module (see 03-01-PLAN.md).
import {
  MIN_TIER_INDEX,
  MAX_TIER_INDEX,
  BASELINE_TIER_INDEX,
  ESCALATE_SUCCESS_STREAK,
  EASE_MISS_RUN,
  BASE_TEMPO_CLAMP_MIN_FRACTION,
  BASE_TEMPO_CLAMP_MAX_FRACTION,
  ABSOLUTE_MIN_BPM,
  MASTERY_MIN_ATTEMPTS,
  WEAK_ACCURACY_THRESHOLD,
  WEAK_NOTE_WEIGHT,
} from "../constants/adaptiveTiers";

// computeNextTier({ successStreak, missRunInLastExercise, currentTierIndex })
//   => { tierIndex, didEscalate, didRecover }
// Precedence: easing > recovery > escalation.
// - Easing: a run of misses eases one tier down (floor MIN_TIER_INDEX).
// - Recovery: once BELOW baseline, a SINGLE successful exercise climbs one tier back toward
//   baseline (capped at BASELINE_TIER_INDEX). Silent (didRecover, no level-up cue) — this just
//   undoes an earlier slow-down so a child who answers correctly isn't left stuck slow.
// - Escalation: only AT/ABOVE baseline, and only after ESCALATE_SUCCESS_STREAK consecutive
//   successes, step up into a harder tier (didEscalate → level-up cue).
export function computeNextTier({
  successStreak = 0,
  missRunInLastExercise = 0,
  currentTierIndex = 0,
} = {}) {
  if (missRunInLastExercise >= EASE_MISS_RUN) {
    return {
      tierIndex: Math.max(MIN_TIER_INDEX, currentTierIndex - 1),
      didEscalate: false,
      didRecover: false,
    };
  }

  // successStreak >= 1 means the just-finished exercise was a success (the caller resets the
  // streak to 0 on any non-success). Below baseline, one success is enough to recover a notch.
  if (successStreak >= 1 && currentTierIndex < BASELINE_TIER_INDEX) {
    return {
      tierIndex: Math.min(BASELINE_TIER_INDEX, currentTierIndex + 1),
      didEscalate: false,
      didRecover: true,
    };
  }

  if (successStreak >= ESCALATE_SUCCESS_STREAK) {
    const nextTierIndex = Math.min(MAX_TIER_INDEX, currentTierIndex + 1);
    return {
      tierIndex: nextTierIndex,
      didEscalate: nextTierIndex !== currentTierIndex,
      didRecover: false,
    };
  }

  return { tierIndex: currentTierIndex, didEscalate: false, didRecover: false };
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
  // Fractional clamp first (0.75x–1.25x base), then an ABSOLUTE floor so easing never drops the
  // tempo below ABSOLUTE_MIN_BPM. Since easing only produces rawTempo <= base and node/gear tempos
  // are >= ABSOLUTE_MIN_BPM, this floor never raises tempo above base — it only prevents an
  // unusably slow tempo on low-base nodes.
  const clampedTempo = Math.max(
    ABSOLUTE_MIN_BPM,
    Math.min(maxTempo, Math.max(minTempo, rawTempo))
  );

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
