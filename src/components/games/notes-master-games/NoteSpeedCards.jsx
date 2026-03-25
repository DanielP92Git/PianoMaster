/**
 * NoteSpeedCards — Speed card game for single-note trail nodes
 *
 * A Duolingo-kids-style speed card game where notes flash by on a staff
 * and the child taps the screen when the target note appears.
 *
 * NOTE: Full game component will be implemented in Plan 02.
 * Pure functions are exported here for testability.
 */

// ============================================================
// Pure Functions (exported for testability — tested by NoteSpeedCards.test.js)
// ============================================================

/**
 * Generate a shuffled sequence of cards with exactly `targetCount` target cards
 * and `totalCards - targetCount` distractor cards.
 *
 * @param {number} totalCards - Total number of cards in the sequence
 * @param {number} targetCount - How many cards should be the target note
 * @param {string} targetPitch - The pitch of the target note (e.g. 'C4')
 * @param {string[]} distractorPool - Array of distractor pitches to sample from
 * @returns {{ id: number, pitch: string, isTarget: boolean }[]}
 */
export function generateCardSequence(totalCards, targetCount, targetPitch, distractorPool) {
  const cards = [];

  // Create target cards
  for (let i = 0; i < targetCount; i++) {
    cards.push({ id: i, pitch: targetPitch, isTarget: true });
  }

  // Create distractor cards, cycling through the pool
  const distractorCount = totalCards - targetCount;
  for (let i = 0; i < distractorCount; i++) {
    const pitch = distractorPool[i % distractorPool.length];
    cards.push({ id: targetCount + i, pitch, isTarget: false });
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Re-assign sequential IDs after shuffle
  return cards.map((card, index) => ({ ...card, id: index }));
}

/**
 * Get the display duration (ms) for a card at the given index in the sequence.
 * Speed ramps up in 4 tiers:
 *   Cards 0-4:   2000ms (Learning)
 *   Cards 5-9:   1500ms (Warming Up)
 *   Cards 10-14: 1200ms (Challenge)
 *   Cards 15+:   1000ms (Fast)
 *
 * @param {number} cardIndex - 0-based index of the card
 * @returns {number} Duration in milliseconds
 */
export function getSpeedForCard(cardIndex) {
  if (cardIndex < 5) return 2000;
  if (cardIndex < 10) return 1500;
  if (cardIndex < 15) return 1200;
  return 1000;
}

/**
 * Calculate a 0-100 score based on how many targets the player caught.
 *
 * @param {number} caught - Number of target cards the player tapped
 * @param {number} total - Total number of target cards in the sequence
 * @returns {number} Score from 0 to 100
 */
export function calculateScore(caught, total) {
  if (total === 0) return 0;
  return Math.round((caught / total) * 100);
}

// ============================================================
// Game Component (stub — full implementation in Plan 02)
// ============================================================

/**
 * NoteSpeedCards game component.
 * Full implementation coming in Plan 02.
 */
export function NoteSpeedCards() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <p className="text-white text-xl">Speed Cards — Coming Soon!</p>
    </div>
  );
}
