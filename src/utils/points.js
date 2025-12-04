export const calculateGameplayPoints = (scores = []) => {
  if (!Array.isArray(scores)) return 0;
  return scores.reduce((sum, score) => sum + (score?.score || 0), 0);
};

export const calculateAchievementPoints = (earnedAchievements = []) => {
  if (!Array.isArray(earnedAchievements)) return 0;
  return earnedAchievements.reduce(
    (sum, achievement) => sum + (achievement?.points || 0),
    0
  );
};

export const calculatePointsSummary = ({ scores = [], earned = [] } = {}) => {
  const gameplayPoints = calculateGameplayPoints(scores);
  const achievementPoints = calculateAchievementPoints(earned);

  return {
    gameplayPoints,
    achievementPoints,
    totalPoints: gameplayPoints + achievementPoints,
  };
};
