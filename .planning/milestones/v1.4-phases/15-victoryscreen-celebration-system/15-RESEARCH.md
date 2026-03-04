# Phase 15: VictoryScreen Celebration System - Research

**Researched:** 2026-02-08
**Domain:** Celebration animation UX, confetti effects, tiered feedback systems
**Confidence:** HIGH

## Summary

This research investigates how to implement a tiered celebration system for VictoryScreen that matches achievement significance for 8-year-old learners. The app already has a robust foundation from Phase 13 (CelebrationWrapper with accessibility support) and Phase 14 (8 node type visual distinctions). The current VictoryScreen (src/components/games/VictoryScreen.jsx) renders celebrations but lacks tiered variations, confetti effects, node-type-specific messaging, XP breakdown details, and percentile comparisons.

The standard approach is to extend the existing VictoryScreen with conditional rendering based on achievement context (stars, node type, boss status, level-up) while respecting the existing accessibility infrastructure (reducedMotion, extendedTimeouts). Industry consensus supports confetti for high-achievement moments with canvas-based rendering for performance. The app already has react-confetti@6.2.3 installed.

For celebration tiers, Phase 13 established three duration tiers (standard 500ms, level-up 1000ms, boss 3000ms). Phase 15 extends this to four visual tiers: minimal (no stars/standard completion), standard (1-2 stars), full (3 stars), and epic (boss wins). For XP breakdown, the xpSystem.js calculateSessionXP function already provides baseXP and bonusXP values that can be displayed. For percentile comparisons, PostgreSQL's PERCENT_RANK() window function provides an efficient solution.

**Primary recommendation:** Build tiered celebration variants within VictoryScreen using the existing CelebrationWrapper, add canvas-confetti for 3-star/boss celebrations with reduced-motion support, create node-type-specific message mappings (8 types from nodeTypes.js), display XP breakdown from existing calculateSessionXP data, and implement percentile comparison via SQL query against students_score table.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-confetti | 6.2.3 | Confetti effects | Already installed, React-specific wrapper for canvas-confetti with resize handling |
| CelebrationWrapper | Current | Accessibility-aware celebration container | Phase 13 implementation, handles reducedMotion/extendedTimeouts/skip |
| VictoryScreen | Current | Game completion screen | Existing component with stars, XP display, trail integration |
| xpSystem.js | Current | XP calculation and breakdown | calculateSessionXP provides baseXP/bonusXP/bonuses structure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nodeTypeStyles.js | Current | Node type icon/color mapping | For node-type-specific celebration styling |
| NODE_TYPES | Current | 8 node type definitions | For message mapping (DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, REVIEW, CHALLENGE, MINI_BOSS, BOSS) |
| PostgreSQL PERCENT_RANK() | Native | Percentile calculations | For "better than X%" comparisons against score history |
| Tailwind CSS | 3.4.1 | Styling system | Gradient backgrounds, animation utilities |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-confetti | canvas-confetti (vanilla) | Direct canvas-confetti is 17kb lighter but loses automatic resize handling; react-confetti already installed |
| react-confetti | party.js | party.js has click-based confetti but less control over particle count/spread; react-confetti better for fullscreen celebrations |
| PERCENT_RANK() SQL | Client-side percentile calculation | SQL window functions are optimized for large datasets; client-side would require fetching all scores |
| Hardcoded messages | i18n translation keys | Phase 15 requirements specify 8 specific messages (not full i18n yet); can migrate to i18n in future phase |

**Installation:**
```bash
# react-confetti already installed
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── games/
│   │   └── VictoryScreen.jsx           # Enhanced with tiered celebrations
│   ├── celebrations/
│   │   ├── CelebrationWrapper.jsx      # Existing from Phase 13
│   │   ├── ConfettiEffect.jsx          # New: Wrapper for react-confetti
│   │   └── useCelebrationDuration.js   # Existing from Phase 13
├── utils/
│   ├── celebrationMessages.js          # New: Node-type-specific messages
│   ├── celebrationTiers.js             # New: Tier determination logic
│   └── xpSystem.js                     # Existing: XP calculations
└── services/
    └── scoreComparisonService.js       # New: Percentile calculations
```

### Pattern 1: Tiered Celebration Determination
**What:** Logic to determine celebration tier based on achievement context.

**When to use:** At VictoryScreen mount, before rendering celebration content.

**Example:**
```javascript
// Source: Educational psychology research on reward significance
// Tier escalation based on achievement magnitude

/**
 * Determine celebration tier based on achievement context
 * @param {number} stars - Stars earned (0-3)
 * @param {boolean} isBoss - Whether this is a boss node
 * @param {boolean} leveledUp - Whether player leveled up
 * @param {number} scorePercentage - Score percentage (0-100)
 * @returns {'minimal'|'standard'|'full'|'epic'} Celebration tier
 */
export const determineCelebrationTier = (stars, isBoss, leveledUp, scorePercentage) => {
  // Epic tier: Boss wins (overrides everything)
  if (isBoss && stars >= 1) {
    return 'epic';
  }

  // Full tier: 3 stars OR level-up
  if (stars === 3 || leveledUp) {
    return 'full';
  }

  // Standard tier: 1-2 stars
  if (stars >= 1) {
    return 'standard';
  }

  // Minimal tier: No stars (< 60% score)
  return 'minimal';
};

/**
 * Get celebration tier configuration
 * @param {string} tier - Celebration tier
 * @returns {Object} { duration, confetti, animation, message }
 */
export const getCelebrationConfig = (tier) => {
  const configs = {
    minimal: {
      duration: 'standard',        // 500ms (or 100ms in reducedMotion)
      confetti: false,
      animation: 'fade',           // Simple opacity transition
      messageIntensity: 'neutral'  // "Good try!"
    },
    standard: {
      duration: 'standard',        // 500ms
      confetti: false,
      animation: 'bounce',         // Star bounce animation
      messageIntensity: 'positive' // "Great job!"
    },
    full: {
      duration: 'level-up',        // 1000ms
      confetti: true,              // Confetti for 3-star achievements
      animation: 'bounce-glow',    // Enhanced star animation
      messageIntensity: 'excellent' // "Perfect!" or "Amazing!"
    },
    epic: {
      duration: 'boss',            // 3000ms
      confetti: true,              // Extended confetti burst
      animation: 'epic',           // Full celebration with particles
      messageIntensity: 'epic'     // "EPIC VICTORY!" or "BOSS DEFEATED!"
    }
  };

  return configs[tier] || configs.standard;
};
```

### Pattern 2: Confetti Effect with Accessibility
**What:** React-confetti wrapper that respects reducedMotion settings.

**When to use:** When celebration tier is 'full' or 'epic'.

**Example:**
```jsx
// Source: react-confetti documentation + Phase 13 accessibility patterns
// https://github.com/alampros/react-confetti

import Confetti from 'react-confetti';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useWindowSize } from '../../hooks/useWindowSize'; // Or implement inline

/**
 * Accessible confetti effect
 * Automatically stops after duration, respects reducedMotion
 */
export const ConfettiEffect = ({ tier = 'full', onComplete }) => {
  const { reducedMotion } = useAccessibility();
  const { width, height } = useWindowSize();
  const [isRunning, setIsRunning] = useState(true);

  // Don't render confetti at all if reducedMotion is enabled
  if (reducedMotion) {
    // Call onComplete immediately
    useEffect(() => {
      onComplete?.();
    }, [onComplete]);
    return null;
  }

  // Confetti configuration based on tier
  const config = tier === 'epic' ? {
    numberOfPieces: 500,       // Dense confetti for boss wins
    recycle: false,            // Don't loop - stops after falling
    gravity: 0.3,              // Slower fall for extended celebration
    wind: 0,                   // No wind drift
    initialVelocityY: 20,      // Strong upward velocity
    colors: ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#9370DB'] // Gold, orange, red, blue, purple
  } : {
    numberOfPieces: 200,       // Moderate confetti for 3-star
    recycle: false,
    gravity: 0.5,              // Normal fall speed
    wind: 0,
    initialVelocityY: 15,
    colors: ['#FFD700', '#FFA500', '#87CEEB', '#98FB98'] // Gold, orange, blue, green
  };

  // Auto-stop after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRunning(false);
      onComplete?.();
    }, tier === 'epic' ? 3000 : 1000);

    return () => clearTimeout(timer);
  }, [tier, onComplete]);

  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={isRunning ? config.numberOfPieces : 0}
      recycle={config.recycle}
      gravity={config.gravity}
      wind={config.wind}
      initialVelocityY={config.initialVelocityY}
      colors={config.colors}
    />
  );
};
```

### Pattern 3: Node-Type-Specific Messaging
**What:** Message mapping based on the 8 node types from nodeTypes.js.

**When to use:** When displaying celebration title/message in VictoryScreen.

**Example:**
```javascript
// Source: Phase 14 node types + educational psychology child-friendly language
// Messages designed for 8-year-old comprehension and engagement

import { NODE_TYPES } from '../data/nodeTypes';

/**
 * Get celebration message based on node type and stars
 * @param {string} nodeType - Node type from NODE_TYPES
 * @param {number} stars - Stars earned (0-3)
 * @param {boolean} isBoss - Whether this is a boss node
 * @returns {Object} { title, subtitle }
 */
export const getCelebrationMessage = (nodeType, stars, isBoss) => {
  // Boss overrides all (special epic messaging)
  if (isBoss && stars >= 1) {
    return {
      title: stars === 3 ? 'PERFECT VICTORY!' : 'BOSS DEFEATED!',
      subtitle: 'You conquered the challenge!'
    };
  }

  // Star-based base messages
  const starMessages = {
    3: { title: 'PERFECT!', subtitle: 'You got every single one!' },
    2: { title: 'Great Job!', subtitle: 'You did really well!' },
    1: { title: 'Good Try!', subtitle: 'Keep practicing!' },
    0: { title: 'Nice Effort!', subtitle: 'Try again to earn stars!' }
  };

  // Node-type-specific enhancements (only for 3-star completions)
  if (stars === 3) {
    const nodeTypeMessages = {
      [NODE_TYPES.DISCOVERY]: {
        title: 'NEW NOTES MASTERED!',
        subtitle: "You learned something new!"
      },
      [NODE_TYPES.PRACTICE]: {
        title: 'PRACTICE PERFECT!',
        subtitle: "You're getting really good!"
      },
      [NODE_TYPES.MIX_UP]: {
        title: 'GAME CHAMPION!',
        subtitle: 'You aced the memory game!'
      },
      [NODE_TYPES.SPEED_ROUND]: {
        title: 'LIGHTNING FAST!',
        subtitle: 'Wow, you beat the clock!'
      },
      [NODE_TYPES.REVIEW]: {
        title: 'YOU REMEMBERED!',
        subtitle: 'Those notes stuck with you!'
      },
      [NODE_TYPES.CHALLENGE]: {
        title: 'CHALLENGE CRUSHED!',
        subtitle: 'That was a tough one!'
      },
      [NODE_TYPES.MINI_BOSS]: {
        title: 'MINI-BOSS DOWN!',
        subtitle: 'Unit checkpoint completed!'
      }
      // BOSS handled above
    };

    return nodeTypeMessages[nodeType] || starMessages[3];
  }

  return starMessages[stars] || starMessages[0];
};
```

### Pattern 4: XP Breakdown Display
**What:** Visual breakdown of XP components (stars, bonuses, completion).

**When to use:** When xpData exists (trail nodes only).

**Example:**
```jsx
// Source: Existing xpSystem.js calculateSessionXP structure
// Display format optimized for 8-year-old understanding

/**
 * XP Breakdown Component
 * Shows where XP came from with child-friendly labels
 */
export const XPBreakdown = ({ xpData }) => {
  if (!xpData || xpData.totalXP === 0) return null;

  const { baseXP, bonusXP, bonuses, totalXP, stars } = xpData;

  return (
    <div className="space-y-2 text-sm">
      <div className="text-center font-bold text-blue-600">
        Total XP Earned: +{totalXP}
      </div>

      {/* Breakdown */}
      <div className="space-y-1 text-xs text-gray-700">
        {/* Stars earned */}
        <div className="flex justify-between">
          <span>⭐ Stars earned ({stars}):</span>
          <span className="font-semibold">+{baseXP}</span>
        </div>

        {/* Bonuses */}
        {bonuses.firstTime && (
          <div className="flex justify-between text-purple-600">
            <span>🎉 First time bonus:</span>
            <span className="font-semibold">+25</span>
          </div>
        )}

        {bonuses.perfect && (
          <div className="flex justify-between text-amber-600">
            <span>💯 Perfect score:</span>
            <span className="font-semibold">+50</span>
          </div>
        )}

        {bonuses.threeStars && (
          <div className="flex justify-between text-yellow-600">
            <span>⭐ Three stars:</span>
            <span className="font-semibold">+50</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Pattern 5: Percentile Comparison via SQL
**What:** Calculate percentile rank for current score against student's history.

**When to use:** After score is saved, to display "Better than X%" message.

**Example:**
```javascript
// Source: PostgreSQL PERCENT_RANK() window function
// https://www.postgresql.org/docs/current/functions-window.html

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

/**
 * Calculate percentile for current score against student's history
 * @param {string} studentId - Student UUID
 * @param {number} currentScore - Current score achieved
 * @param {string} nodeId - Node ID (to compare same-node scores)
 * @returns {Promise<number>} Percentile (0-100)
 */
export async function calculateScorePercentile(studentId, currentScore, nodeId) {
  await verifyStudentDataAccess(studentId);

  try {
    // Query to calculate percentile rank for current score
    // Uses PostgreSQL's PERCENT_RANK() window function
    const { data, error } = await supabase.rpc('calculate_score_percentile', {
      p_student_id: studentId,
      p_current_score: currentScore,
      p_node_id: nodeId
    });

    if (error) throw error;

    // Convert 0.0-1.0 to 0-100 percentage
    const percentile = Math.round((data || 0) * 100);
    return percentile;
  } catch (error) {
    console.error('Error calculating percentile:', error);
    return null; // Return null on error, don't block VictoryScreen
  }
}

/**
 * Get percentile comparison message
 * @param {number} percentile - Percentile (0-100)
 * @returns {string} Child-friendly comparison message
 */
export function getPercentileMessage(percentile) {
  if (percentile === null || percentile === undefined) {
    return null; // No message if calculation failed
  }

  if (percentile >= 90) {
    return `🏆 Your best score yet! Better than ${percentile}% of your attempts!`;
  } else if (percentile >= 70) {
    return `📈 Great improvement! Better than ${percentile}% of your previous scores!`;
  } else if (percentile >= 50) {
    return `👍 You're getting better! Beat ${percentile}% of your past tries!`;
  } else if (percentile >= 25) {
    return `💪 Keep practicing! Better than ${percentile}% of before!`;
  } else {
    return `🌱 Room to grow! Keep trying!`;
  }
}
```

**SQL Function (to be added to migrations):**
```sql
-- Supabase PostgreSQL function for percentile calculation
-- Uses PERCENT_RANK() window function for efficient calculation

CREATE OR REPLACE FUNCTION calculate_score_percentile(
  p_student_id UUID,
  p_current_score INTEGER,
  p_node_id TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  percentile_rank DECIMAL;
BEGIN
  -- Calculate percentile rank for current score
  -- PERCENT_RANK() returns 0.0 for lowest score, 1.0 for highest
  SELECT PERCENT_RANK() OVER (ORDER BY score)
  INTO percentile_rank
  FROM (
    -- Include historical scores + current score
    SELECT score FROM students_score
    WHERE student_id = p_student_id
      AND game_type = 'trail_node'
      AND score IS NOT NULL
    UNION ALL
    SELECT p_current_score AS score
  ) all_scores
  WHERE score = p_current_score
  LIMIT 1;

  RETURN COALESCE(percentile_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Anti-Patterns to Avoid
- **Same celebration for all achievements:** Tiered celebrations make accomplishments feel more meaningful; minimal/standard/full/epic distinction is crucial
- **Confetti in reducedMotion mode:** Always check reducedMotion flag before rendering particle effects; return null component instead
- **Hardcoded celebration messages:** Use node-type-specific messages from centralized mapping; makes messages contextually relevant
- **Client-side percentile calculation:** Fetching all scores to client is inefficient; use SQL PERCENT_RANK() window function for performance
- **Blocking VictoryScreen on percentile query:** Percentile is nice-to-have, not critical; handle null gracefully, don't delay celebration

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti particle physics | Custom canvas rendering | react-confetti library | Already installed, handles gravity/wind/velocity/resize automatically; 500+ GitHub stars |
| Window resize handling | Custom resize listener | react-confetti auto-resize | Library includes useWindowSize hook and handles resize events; prevents memory leaks |
| Percentile calculation | Array sorting on client | PostgreSQL PERCENT_RANK() | SQL window functions optimized for large datasets; handles ties correctly; single query instead of fetching all scores |
| XP breakdown calculation | Recalculating XP in VictoryScreen | Use xpData from calculateSessionXP | calculateSessionXP already provides baseXP/bonusXP/bonuses structure; avoid duplicate logic |
| Celebration duration logic | Inline timeout calculations | useCelebrationDuration hook (Phase 13) | Centralized logic handles reducedMotion/extendedTimeouts; already tested and accessible |

**Key insight:** Phase 13 and Phase 14 already built the foundation (CelebrationWrapper, accessibility, node types). Phase 15 is about conditional rendering and visual escalation, not rebuilding infrastructure.

## Common Pitfalls

### Pitfall 1: Confetti Performance on Low-End Devices
**What goes wrong:** 500 particles at 60fps can lag on older iPads/Chromebooks common in schools.

**Why it happens:** react-confetti renders every particle individually; high particle counts are GPU-intensive.

**How to avoid:**
- Use 200 particles for 'full' tier (3-star), 500 only for 'epic' tier (boss)
- Set recycle: false so confetti stops after falling (doesn't loop infinitely)
- Disable confetti entirely in reducedMotion mode
- Consider device detection: `navigator.hardwareConcurrency < 4` → reduce particle count by 50%

**Warning signs:**
- Frame rate drops during confetti animation
- Users on low-end devices report "laggy celebrations"
- Confetti animation doesn't complete (browser kills animation due to performance)

### Pitfall 2: Node Type Not Available in Free Play Mode
**What goes wrong:** getCelebrationMessage(nodeType, stars, isBoss) called with nodeType = null when playing outside trail.

**Why it happens:** VictoryScreen supports both trail mode (nodeId provided) and free play mode (nodeId = null).

**How to avoid:**
- Provide fallback messages when nodeType is null
- Use generic star-based messages for free play: "Great Job!", "Perfect!", etc.
- Only apply node-type-specific messaging when nodeType is defined

**Warning signs:**
- Console errors: "Cannot read property of undefined" in getCelebrationMessage
- Free play mode shows blank celebration titles
- Node-specific messages appear in practice mode

### Pitfall 3: XP Breakdown Shows Before Data Loads
**What goes wrong:** XPBreakdown component renders with undefined xpData, shows "NaN" or empty values.

**Why it happens:** VictoryScreen useEffect calls awardXP asynchronously; xpData state not set until promise resolves.

**How to avoid:**
- Always check `if (!xpData || xpData.totalXP === 0) return null;` at top of XPBreakdown
- Show loading skeleton or hide breakdown entirely until xpData is populated
- Don't render XPBreakdown component at all if xpData is null

**Warning signs:**
- "Total XP Earned: +NaN" appears briefly
- XP breakdown section flickers or jumps when data loads
- Breakdown shows "undefined" for bonus labels

### Pitfall 4: Percentile Query Delays Celebration
**What goes wrong:** VictoryScreen waits for percentile calculation before showing celebration, causing 500ms+ delay.

**Why it happens:** Developer calls await calculateScorePercentile() in useEffect before allowing VictoryScreen to render.

**How to avoid:**
- Calculate percentile in background, don't block rendering
- Render VictoryScreen immediately with stars/XP, add percentile message when it loads
- Handle null percentile gracefully: `{percentileMessage && <div>{percentileMessage}</div>}`
- Use separate state: `const [percentileMessage, setPercentileMessage] = useState(null);`

**Warning signs:**
- Noticeable delay between game end and VictoryScreen appearing
- Users report "celebration takes a second to show"
- Database query times visible in DevTools Network tab

### Pitfall 5: Celebration Tier Logic Inconsistent with Duration Tiers
**What goes wrong:** determineCelebrationTier returns 'full' but getCelebrationConfig uses 'standard' duration.

**Why it happens:** Developer creates separate tier systems for visual tier and duration tier, causing misalignment.

**How to avoid:**
- Map celebration tiers directly to Phase 13 duration tiers: minimal/standard → 'standard', full → 'level-up', epic → 'boss'
- Use getCelebrationConfig return value for duration: `config.duration` passed to CelebrationWrapper tier prop
- Document tier mappings clearly in code comments

**Warning signs:**
- 3-star celebration completes too quickly (using 500ms instead of 1000ms)
- Boss celebration too short or too long
- reducedMotion duration calculations don't match tier expectations

## Code Examples

Verified patterns from official sources:

### Integrating Tiered Celebrations into VictoryScreen
```jsx
// Source: Existing VictoryScreen.jsx structure + tiered celebration patterns
// Conditional rendering based on achievement context

import { useState, useEffect } from 'react';
import { determineCelebrationTier, getCelebrationConfig } from '../../utils/celebrationTiers';
import { getCelebrationMessage } from '../../utils/celebrationMessages';
import { ConfettiEffect } from '../celebrations/ConfettiEffect';
import { XPBreakdown } from './XPBreakdown';
import { calculateScorePercentile, getPercentileMessage } from '../../services/scoreComparisonService';

const VictoryScreen = ({ score, totalPossibleScore, nodeId, ... }) => {
  const scorePercentage = (score / totalPossibleScore) * 100;
  const stars = calculateStars(scorePercentage); // Existing function
  const node = nodeId ? getNodeById(nodeId) : null;
  const isBoss = node?.isBoss || false;
  const nodeType = node?.nodeType || null;

  const [showConfetti, setShowConfetti] = useState(false);
  const [percentileMessage, setPercentileMessage] = useState(null);

  // Determine celebration tier
  const tier = determineCelebrationTier(
    stars,
    isBoss,
    xpData?.leveledUp || false,
    scorePercentage
  );
  const celebrationConfig = getCelebrationConfig(tier);
  const message = getCelebrationMessage(nodeType, stars, isBoss);

  // Trigger confetti for full/epic tiers
  useEffect(() => {
    if (celebrationConfig.confetti && !reducedMotion) {
      setShowConfetti(true);
    }
  }, [celebrationConfig.confetti, reducedMotion]);

  // Calculate percentile in background (non-blocking)
  useEffect(() => {
    if (!nodeId || !user?.id) return;

    const loadPercentile = async () => {
      const percentile = await calculateScorePercentile(
        user.id,
        Math.round(scorePercentage),
        nodeId
      );
      setPercentileMessage(getPercentileMessage(percentile));
    };

    loadPercentile();
  }, [nodeId, user?.id, scorePercentage]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Confetti overlay */}
      {showConfetti && (
        <ConfettiEffect
          tier={tier}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Victory content */}
      <div className="max-w-md">
        {/* Celebration title (node-type-specific) */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          {message.title}
        </h2>
        <p className="text-white/90">{message.subtitle}</p>

        {/* Stars display */}
        <div className="flex items-center justify-center gap-1 py-1">
          {[1, 2, 3].map((starNum) => (
            <span
              key={starNum}
              className={`text-3xl ${
                starNum <= stars
                  ? reducedMotion
                    ? 'text-yellow-400'
                    : 'animate-bounce text-yellow-400'
                  : 'text-gray-400/30'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* XP Breakdown (trail nodes only) */}
        {xpData && <XPBreakdown xpData={xpData} />}

        {/* Percentile comparison (loads async) */}
        {percentileMessage && (
          <div className="mt-2 text-sm text-white/80 bg-black/20 rounded-lg px-3 py-2">
            {percentileMessage}
          </div>
        )}

        {/* Action buttons */}
        {/* ... existing buttons ... */}
      </div>
    </div>
  );
};
```

### React-Confetti Reduced Motion Pattern
```jsx
// Source: react-confetti documentation + accessibility best practices
// https://github.com/alampros/react-confetti#confetti-number

import Confetti from 'react-confetti';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const ConfettiEffect = ({ tier, onComplete }) => {
  const { reducedMotion } = useAccessibility();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Skip confetti entirely in reducedMotion mode
  if (reducedMotion) {
    useEffect(() => {
      onComplete?.();
    }, [onComplete]);
    return null;
  }

  // Tier-based configuration
  const numberOfPieces = tier === 'epic' ? 500 : 200;
  const gravity = tier === 'epic' ? 0.3 : 0.5;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={numberOfPieces}
        recycle={false}
        gravity={gravity}
        colors={['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#9370DB']}
        onConfettiComplete={onComplete}
      />
    </div>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single celebration for all scores | Tiered celebrations (minimal/standard/full/epic) | 2024-2025 gamification research | Players feel more rewarded for high achievements; boss wins feel special |
| Static congratulations message | Context-aware messaging (node type + stars) | 2025 educational UX | Messages feel personalized; "YOU REMEMBERED!" for review nodes vs "LIGHTNING FAST!" for speed rounds |
| No score context | Percentile comparison ("Better than 85%") | 2025 motivational design | Players understand progress relative to own history; encourages improvement |
| Confetti via GIF/video | Canvas-based confetti (canvas-confetti) | 2023+ performance focus | 60fps animation, GPU-accelerated, scales to device capability |
| Generic "+150 XP" display | XP breakdown showing sources | 2025 transparency in gamification | Players understand "why" they got XP; teaches star value and bonuses |

**Deprecated/outdated:**
- **Lottie animations for confetti:** JSON-based animations (Lottie) were popular 2020-2022 but are heavier (50-200kb per animation) than canvas-confetti (17kb total); modern approach uses canvas
- **DOM-based particle systems:** Creating hundreds of `<div>` elements for particles is slow; canvas rendering is 10x+ faster
- **Fixed celebration duration:** Old VictoryScreens had hardcoded 2-second celebration; modern approach uses accessibility-aware tiers
- **Client-side percentile:** Sorting all scores in React component; PostgreSQL PERCENT_RANK() is orders of magnitude faster for >100 scores

## Open Questions

Things that couldn't be fully resolved:

1. **Should percentile calculation compare all scores or same-node scores only?**
   - What we know: Same-node comparison is more meaningful ("better than 80% of your C-D-E attempts")
   - What's unclear: If student has only 1-2 attempts on a node, percentile is less useful (always 0% or 50%)
   - Recommendation: Filter by same nodeId in SQL query; fall back to generic message if fewer than 3 historical attempts

2. **Confetti particle count for low-end devices**
   - What we know: 500 particles can lag on older iPads; 200 particles works smoothly
   - What's unclear: How to detect device capability reliably (navigator.hardwareConcurrency is not available on all browsers)
   - Recommendation: Start with 200/500 split (full/epic tiers); monitor analytics for performance complaints; consider device detection in future phase

3. **Node-type-specific messages for i18n**
   - What we know: Phase 15 requires 8 specific English messages; app already has i18n system (i18next)
   - What's unclear: Should messages use hardcoded strings or translation keys immediately?
   - Recommendation: Use hardcoded English strings for Phase 15 (faster implementation); create translation keys in future i18n phase when Hebrew translations are ready

4. **XP breakdown visibility on small screens**
   - What we know: VictoryScreen already has responsive layout; XP breakdown adds 3-4 lines of text
   - What's unclear: Will breakdown push buttons below fold on small screens (iPhone SE)?
   - Recommendation: Test on 375px viewport; if overflow, make breakdown collapsible or reduce font size on mobile

## Sources

### Primary (HIGH confidence)
- Existing codebase - VictoryScreen.jsx (current implementation with stars, XP, trail integration)
- Existing codebase - Phase 13 CelebrationWrapper (accessibility-aware animations)
- Existing codebase - Phase 14 nodeTypeStyles.js (8 node types with icons/colors)
- Existing codebase - xpSystem.js calculateSessionXP (baseXP/bonusXP structure)
- [PostgreSQL PERCENT_RANK() Documentation](https://www.postgresql.org/docs/current/functions-window.html) - Window function for percentile calculations
- [react-confetti GitHub](https://github.com/alampros/react-confetti) - React wrapper for canvas-confetti with auto-resize
- [canvas-confetti Documentation](https://www.kirilv.com/canvas-confetti/) - Configuration options, performance notes

### Secondary (MEDIUM confidence)
- [GeeksforGeeks - PostgreSQL PERCENT_RANK](https://www.geeksforgeeks.org/postgresql-percent_rank-function/) - Practical examples of percentile calculations
- [PopSQL - Calculate Percentiles in PostgreSQL](https://popsql.com/learn-sql/postgresql/how-to-calculate-percentiles-in-postgresql) - SQL query patterns
- [Bundlephobia - canvas-confetti](https://bundlephobia.com/package/canvas-confetti) - Bundle size metrics (17kb minified+gzipped)
- [CodiLime - React Confetti](https://codilime.com/blog/react-confetti/) - React integration patterns and best practices
- Educational psychology research (Phase 13 citations) - Tiered rewards increase motivation for 8-year-olds

### Tertiary (LOW confidence)
- WebSearch results on confetti animation performance - Community patterns suggest 200-500 particle range for mobile devices
- WebSearch results on percentile messaging - No specific child-focused research; adult UX patterns applied

## Metadata

**Confidence breakdown:**
- Tiered celebrations: HIGH - Phase 13 established tiers, straightforward conditional rendering
- Confetti integration: HIGH - react-confetti already installed, API well-documented, accessibility pattern from Phase 13
- Node-type messaging: HIGH - 8 node types clearly defined in nodeTypes.js, message mapping is simple lookup table
- XP breakdown: HIGH - calculateSessionXP already provides structured data, display is straightforward React component
- Percentile calculation: MEDIUM - PERCENT_RANK() SQL is well-documented, but database function needs testing with real data
- Performance considerations: MEDIUM - Canvas-confetti is performant, but device-specific tuning may be needed

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable technologies and well-established patterns)
