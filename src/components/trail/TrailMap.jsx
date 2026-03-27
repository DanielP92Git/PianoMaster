/**
 * TrailMap Component
 *
 * Displays the complete skill trail with nodes organized in a winding path
 * Duolingo-style progression with connected nodes and visual feedback.
 *
 * Data-driven tab rendering: adding a new tab = one entry in TRAIL_TAB_CONFIGS (D-09).
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target } from 'lucide-react';
import MusicLoader from '../ui/MusicLoader';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../features/authentication/useUser';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isFreeNode } from '../../config/subscriptionConfig';
import {
  getNodesByCategory,
  getBossNodes,
  NODE_CATEGORIES,
  UNITS
} from '../../data/skillTrail';
import { TRAIL_TAB_CONFIGS } from '../../data/constants';
import {
  getStudentProgress,
  getCompletedNodeIds,
  getCurrentUnitForCategory,
} from '../../services/skillProgressService';
import ZigzagTrailLayout from './ZigzagTrailLayout';
import TrailNodeModal from './TrailNodeModal';

/**
 * useMediaQuery Hook
 * Detects responsive breakpoints using window.matchMedia
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

const TrailMap = () => {
  const { user } = useUser();
  const { isPremium } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('path') || 'treble'; // Default to treble
  const [progress, setProgress] = useState([]);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [_currentUnits, setCurrentUnits] = useState(
    Object.fromEntries(TRAIL_TAB_CONFIGS.map(t => [t.id, 1]))
  );
  const tabRefs = useRef([]);
  const activeNodeRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Desktop uses same zigzag layout but with adjusted spacing

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [progressData, completedIds, ...unitResults] = await Promise.all([
          getStudentProgress(user.id),
          getCompletedNodeIds(user.id),
          ...TRAIL_TAB_CONFIGS.map(tab =>
            getCurrentUnitForCategory(user.id, NODE_CATEGORIES[tab.categoryKey])
          )
        ]);

        setProgress(progressData);
        setCompletedNodeIds(completedIds);
        setCurrentUnits(
          Object.fromEntries(TRAIL_TAB_CONFIGS.map((tab, i) => [tab.id, unitResults[i]]))
        );

        // Calculate which nodes are unlocked locally
        const allNodes = [
          ...TRAIL_TAB_CONFIGS.flatMap(tab =>
            getNodesByCategory(NODE_CATEGORIES[tab.categoryKey])
          ),
          ...getBossNodes()
        ];

        const unlocked = new Set();
        for (const node of allNodes) {
          const isUnlocked = node.prerequisites.every(prereqId =>
            completedIds.includes(prereqId)
          );
          if (isUnlocked) {
            unlocked.add(node.id);
          }
        }
        setUnlockedNodes(unlocked);
      } catch (error) {
        console.error('Error fetching trail progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user?.id]);

  // Auto-scroll to active node on initial load and tab change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNodeRef.current) {
        activeNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 400); // Wait for layout to render
    return () => clearTimeout(timer);
  }, [activeTab, loading]); // Re-scroll on tab change or when loading completes

  // Get progress for a specific node
  const getNodeProgress = (nodeId) => {
    return progress.find(p => p.node_id === nodeId);
  };

  // Build a unified lookup map: { [tabId]: sortedNodes[] }
  // Boss nodes are merged into their respective tab using bossPrefix from config (D-13)
  const bossNodes = getBossNodes();

  const nodesWithBossByTab = useMemo(() => {
    return Object.fromEntries(
      TRAIL_TAB_CONFIGS.map(tab => {
        const categoryNodes = getNodesByCategory(NODE_CATEGORIES[tab.categoryKey]);
        const tabBosses = bossNodes.filter(b => b.id.startsWith(tab.bossPrefix));
        const merged = [...categoryNodes, ...tabBosses].sort((a, b) => a.order - b.order);
        return [tab.id, merged];
      })
    );
  }, [bossNodes]);

  const { t, i18n } = useTranslation(['trail', 'common']);
  const isRTL = i18n.dir() === 'rtl';

  // Prepare data for active tab — all driven by config (D-09, D-11, D-12)
  const activeTabConfig = TRAIL_TAB_CONFIGS.find(t => t.id === activeTab) || TRAIL_TAB_CONFIGS[0];
  const activeNodes = nodesWithBossByTab[activeTab] || [];
  const activeCategory = NODE_CATEGORIES[activeTabConfig.categoryKey];

  // Group nodes by unit for layout components
  const { nodesByUnit, units } = useMemo(() => {
    const grouped = {};
    activeNodes.forEach(node => {
      const unitNum = node.unit || 999;
      if (!grouped[unitNum]) grouped[unitNum] = [];
      grouped[unitNum].push(node);
    });
    // Sort within each unit by orderInUnit
    Object.values(grouped).forEach(arr => arr.sort((a, b) => (a.orderInUnit || 0) - (b.orderInUnit || 0)));

    const unitKeys = Object.keys(grouped).filter(k => k !== '999').map(Number).sort((a, b) => a - b);
    const unitsList = unitKeys.map(unitNum => {
      const unitKey = Object.keys(UNITS).find(key => {
        const unit = UNITS[key];
        return unit.category === activeCategory && unit.order === unitNum;
      });
      return unitKey ? UNITS[unitKey] : { order: unitNum, name: `Unit ${unitNum}`, icon: '📚' };
    });

    return { nodesByUnit: grouped, units: unitsList };
  }, [activeNodes, activeCategory]);

  // Pre-compute which nodes are premium-locked for free-tier users
  // During loading/error, isPremium defaults to false → premium nodes show gold (safe default per CONTEXT.md)
  const premiumLockedNodeIds = useMemo(() => {
    if (isPremium) return new Set();
    const locked = new Set();
    const allNodesFlat = Object.values(nodesWithBossByTab).flat();
    for (const node of allNodesFlat) {
      if (!isFreeNode(node.id)) {
        locked.add(node.id);
      }
    }
    return locked;
  }, [isPremium, nodesWithBossByTab]);

  // Tab change handler
  const handleTabChange = (tabId) => {
    setSearchParams({ path: tabId });
  };

  // Keyboard navigation handler (RTL-aware)
  const handleTabKeyDown = (e, index) => {
    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    if (e.key === prevKey) {
      e.preventDefault();
      const prevIndex = (index - 1 + TRAIL_TAB_CONFIGS.length) % TRAIL_TAB_CONFIGS.length;
      tabRefs.current[prevIndex]?.focus();
      handleTabChange(TRAIL_TAB_CONFIGS[prevIndex].id);
    } else if (e.key === nextKey) {
      e.preventDefault();
      const nextIndex = (index + 1) % TRAIL_TAB_CONFIGS.length;
      tabRefs.current[nextIndex]?.focus();
      handleTabChange(TRAIL_TAB_CONFIGS[nextIndex].id);
    }
  };

  // Calculate progress per path
  const getPathProgress = (nodes) => {
    const completed = nodes.filter(n => completedNodeIds.includes(n.id)).length;
    return `${completed}/${nodes.length}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <MusicLoader size="md" text={t('loading', { ns: 'trail' })} />
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Tab Bar — data-driven from TRAIL_TAB_CONFIGS (D-09, D-10, D-11) */}
      <div role="tablist" aria-label={t('tabs.ariaLabel', { defaultValue: 'Learning paths' })} className="flex justify-center gap-2 px-4 py-3">
        {TRAIL_TAB_CONFIGS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const nodes = nodesWithBossByTab[tab.id] || [];
          const progress = getPathProgress(nodes);
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={el => tabRefs.current[index] = el}
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex flex-col items-center px-5 py-2.5 min-h-[48px] rounded-full text-sm font-bold
                transition-colors
                ${isActive
                  ? `${tab.colorActive} ${tab.colorBorder} border ${tab.colorGlow} text-white`
                  : 'bg-transparent border border-white/10 text-white/60 hover:text-white/80 hover:border-white/20'
                }
              `}
            >
              <TabIcon className="h-4 w-4 mb-0.5" />
              <span>{t(`tabs.${tab.id}`, { defaultValue: tab.label })}</span>
              <span className="text-[10px] font-normal opacity-70 mt-0.5">{progress}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        aria-label={t(`tabs.${activeTab}Panel`, { defaultValue: `${activeTab} learning path` })}
      >
        {activeNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-white/50">
              {t(`tabs.${activeTab}Panel`, { defaultValue: 'Coming soon!' })}
            </p>
          </div>
        ) : (
          <ZigzagTrailLayout
            nodes={activeNodes}
            completedNodeIds={completedNodeIds}
            unlockedNodes={unlockedNodes}
            premiumLockedNodeIds={premiumLockedNodeIds}
            onNodeClick={setSelectedNode}
            getNodeProgress={getNodeProgress}
            activeNodeRef={activeNodeRef}
            units={units}
            nodesByUnit={nodesByUnit}
            isDesktop={isDesktop}
            isRTL={isRTL}
          />
        )}
      </div>

      {/* Node detail modal */}
      {selectedNode && (
        <TrailNodeModal
          node={selectedNode}
          progress={getNodeProgress(selectedNode.id)}
          isUnlocked={unlockedNodes.has(selectedNode.id)}
          isPremiumLocked={premiumLockedNodeIds.has(selectedNode.id)}
          prerequisites={selectedNode.prerequisites}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Jump to Top - Floating Action Button */}
      <button
        onClick={() => {
          // Scroll the trail-page container (fixed inset-0 overflow-y-auto), not window
          const trailPage = document.querySelector('.trail-page');
          if (trailPage) {
            trailPage.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 sm:h-16 sm:w-16"
        aria-label="Jump to top"
      >
        <Target className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>
    </div>
  );
};

export default TrailMap;
