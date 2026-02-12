/**
 * Utility functions for checking accessory unlock requirements
 */

export const ACCESSORY_CATEGORIES = {
  hat: { name: "Hats", order: 1, icon: "🎩" },
  headgear: { name: "Headgear", order: 2, icon: "👑" },
  eyes: { name: "Eyes", order: 3, icon: "👓" },
  face: { name: "Face", order: 4, icon: "😊" },
  body: { name: "Body", order: 5, icon: "👕" },
  background: { name: "Background", order: 6, icon: "🎨" },
  other: { name: "Other", order: 7, icon: "✨" },
};

/**
 * Check if an accessory is unlocked based on requirements
 * @param {Object} accessory - The accessory object
 * @param {Object} userProgress - User's progress data
 * @returns {Object} - {unlocked: boolean, progress: number, requirement: string}
 */
export function checkAccessoryUnlock(accessory, userProgress) {
  const requirement = accessory.unlock_requirement;

  // No requirement means it's unlocked
  if (!requirement) {
    return { unlocked: true, progress: 1, requirement: null };
  }

  const { type } = requirement;

  switch (type) {
    case "achievement": {
      const achievementId = requirement.id;
      const earned = userProgress.achievements?.some(
        (a) => a.achievement_id === achievementId && a.earned
      );
      return {
        unlocked: earned || false,
        progress: earned ? 1 : 0,
        requirement: `Earn achievement: ${requirement.name || achievementId}`,
      };
    }

    case "games_played": {
      const required = requirement.count;
      const current = userProgress.gamesPlayed || 0;
      return {
        unlocked: current >= required,
        progress: Math.min(current / required, 1),
        requirement: `Play ${required} games`,
      };
    }

    case "points_earned": {
      const required = requirement.amount;
      const current = userProgress.totalPoints || 0;
      return {
        unlocked: current >= required,
        progress: Math.min(current / required, 1),
        requirement: `Earn ${required.toLocaleString()} total points`,
      };
    }

    case "streak": {
      const required = requirement.days;
      const current = userProgress.currentStreak || 0;
      return {
        unlocked: current >= required,
        progress: Math.min(current / required, 1),
        requirement: `Reach ${required} day streak`,
      };
    }

    case "perfect_games": {
      const required = requirement.count;
      const current = userProgress.perfectGames || 0;
      return {
        unlocked: current >= required,
        progress: Math.min(current / required, 1),
        requirement: `Score 100% in ${required} game${required > 1 ? "s" : ""}`,
      };
    }

    case "level": {
      const required = requirement.level;
      const current = userProgress.level || 1;
      return {
        unlocked: current >= required,
        progress: Math.min(current / required, 1),
        requirement: `Reach level ${required}`,
      };
    }

    default:
      // Unknown requirement type, treat as unlocked
      return { unlocked: true, progress: 1, requirement: null };
  }
}

/**
 * Group accessories by category
 * @param {Array} accessories - Array of accessory objects
 * @returns {Object} - Accessories grouped by category
 */
export function groupAccessoriesByCategory(accessories) {
  const grouped = {};

  accessories.forEach((accessory) => {
    const category = accessory.category || "other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(accessory);
  });

  // Sort categories by order
  return Object.keys(grouped)
    .sort((a, b) => {
      const orderA = ACCESSORY_CATEGORIES[a]?.order || 999;
      const orderB = ACCESSORY_CATEGORIES[b]?.order || 999;
      return orderA - orderB;
    })
    .reduce((acc, category) => {
      acc[category] = grouped[category];
      return acc;
    }, {});
}
