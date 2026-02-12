/**
 * TrailMap Component
 *
 * Displays the complete skill trail with nodes organized in a winding path
 * Duolingo-style progression with connected nodes and visual feedback
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drum, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../features/authentication/useUser';
import trebleClefIcon from '../../assets/noteImages/treble/treble-clef.svg';
import bassClefIcon from '../../assets/noteImages/bass/bass-clef.svg';
import {
  getNodesByCategory,
  getBossNodes,
  NODE_CATEGORIES,
  UNITS
} from '../../data/skillTrail';
import {
  getStudentProgress,
  getCompletedNodeIds,
  getCurrentUnitForCategory,
  resetStudentProgress
} from '../../services/skillProgressService';
import ZigzagTrailLayout from './ZigzagTrailLayout';
import TrailNodeModal from './TrailNodeModal';
import supabase from '../../services/supabase';

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

// Tab configuration for path switching
const TRAIL_TABS = [
  { id: 'treble', label: 'Treble', categoryKey: 'TREBLE_CLEF' },
  { id: 'bass', label: 'Bass', categoryKey: 'BASS_CLEF' },
  { id: 'rhythm', label: 'Rhythm', categoryKey: 'RHYTHM' },
];

const TrailMap = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('path') || 'treble'; // Default to treble
  const [progress, setProgress] = useState([]);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [currentUnits, setCurrentUnits] = useState({
    treble: 1,
    bass: 1,
    rhythm: 1
  });
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
        const [progressData, completedIds, trebleUnit, bassUnit, rhythmUnit] = await Promise.all([
          getStudentProgress(user.id),
          getCompletedNodeIds(user.id),
          getCurrentUnitForCategory(user.id, NODE_CATEGORIES.TREBLE_CLEF),
          getCurrentUnitForCategory(user.id, NODE_CATEGORIES.BASS_CLEF),
          getCurrentUnitForCategory(user.id, NODE_CATEGORIES.RHYTHM)
        ]);

        setProgress(progressData);
        setCompletedNodeIds(completedIds);
        setCurrentUnits({
          treble: trebleUnit,
          bass: bassUnit,
          rhythm: rhythmUnit
        });

        // Calculate which nodes are unlocked locally
        const allNodes = [
          ...getNodesByCategory(NODE_CATEGORIES.TREBLE_CLEF),
          ...getNodesByCategory(NODE_CATEGORIES.BASS_CLEF),
          ...getNodesByCategory(NODE_CATEGORIES.RHYTHM),
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

  // Find the current (next to complete) node in a category
  const findCurrentNode = (nodes) => {
    for (const node of nodes) {
      const isUnlocked = unlockedNodes.has(node.id);
      const isCompleted = completedNodeIds.includes(node.id);
      if (isUnlocked && !isCompleted) {
        return node;
      }
    }
    // If all completed, return the last one for replay
    const lastCompleted = [...nodes].reverse().find(n => completedNodeIds.includes(n.id));
    return lastCompleted || nodes[0];
  };

  // Get nodes by category
  const trebleNodes = getNodesByCategory(NODE_CATEGORIES.TREBLE_CLEF);
  const bassNodes = getNodesByCategory(NODE_CATEGORIES.BASS_CLEF);
  const rhythmNodes = getNodesByCategory(NODE_CATEGORIES.RHYTHM);
  const bossNodes = getBossNodes();

  // Merge boss nodes into their respective categories
  const trebleWithBoss = useMemo(() => {
    const trebleBosses = bossNodes.filter(b => b.id.startsWith('boss_treble'));
    return [...trebleNodes, ...trebleBosses].sort((a, b) => a.order - b.order);
  }, [trebleNodes, bossNodes]);

  const bassWithBoss = useMemo(() => {
    const bassBosses = bossNodes.filter(b => b.id.startsWith('boss_bass'));
    return [...bassNodes, ...bassBosses].sort((a, b) => a.order - b.order);
  }, [bassNodes, bossNodes]);

  const rhythmWithBoss = useMemo(() => {
    const rhythmBosses = bossNodes.filter(b => b.id.startsWith('boss_rhythm'));
    return [...rhythmNodes, ...rhythmBosses].sort((a, b) => a.order - b.order);
  }, [rhythmNodes, bossNodes]);

  const { t, i18n } = useTranslation(['trail', 'common']);
  const isRTL = i18n.dir() === 'rtl';

  // Prepare data for active tab
  const activeNodes = activeTab === 'treble' ? trebleWithBoss :
                      activeTab === 'bass' ? bassWithBoss : rhythmWithBoss;
  const activeCategory = activeTab === 'treble' ? NODE_CATEGORIES.TREBLE_CLEF :
                         activeTab === 'bass' ? NODE_CATEGORIES.BASS_CLEF :
                         NODE_CATEGORIES.RHYTHM;

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
      const prevIndex = (index - 1 + TRAIL_TABS.length) % TRAIL_TABS.length;
      tabRefs.current[prevIndex]?.focus();
      handleTabChange(TRAIL_TABS[prevIndex].id);
    } else if (e.key === nextKey) {
      e.preventDefault();
      const nextIndex = (index + 1) % TRAIL_TABS.length;
      tabRefs.current[nextIndex]?.focus();
      handleTabChange(TRAIL_TABS[nextIndex].id);
    }
  };

  // Calculate progress per path
  const getPathProgress = (nodes) => {
    const completed = nodes.filter(n => completedNodeIds.includes(n.id)).length;
    return `${completed}/${nodes.length}`;
  };

  // Development: Reset all trail progress
  const handleResetProgress = async () => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      '🚨 DEV MODE: Reset ALL trail progress?\n\nThis will:\n- Delete all node progress\n- Delete all unit progress\n- Reset XP to 0\n- Delete all scores\n- Cannot be undone!\n\nContinue?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      console.log('🗑️ Resetting all trail progress for user:', user.id);

      // 1. Delete all skill progress
      const { data: deletedSkills, error: skillError, count: skillCount } = await supabase
        .from('student_skill_progress')
        .delete()
        .eq('student_id', user.id)
        .select();

      if (skillError) throw skillError;
      console.log(`✓ Deleted ${deletedSkills?.length || 0} student_skill_progress records`);

      // 2. Delete all unit progress
      const { data: deletedUnits, error: unitError } = await supabase
        .from('student_unit_progress')
        .delete()
        .eq('student_id', user.id)
        .select();

      if (unitError) throw unitError;
      console.log(`✓ Deleted ${deletedUnits?.length || 0} student_unit_progress records`);

      // 3. Delete all scores (prevents migration from restoring progress)
      const { data: deletedScores, error: scoreError } = await supabase
        .from('students_score')
        .delete()
        .eq('student_id', user.id)
        .select();

      if (scoreError) throw scoreError;
      console.log(`✓ Deleted ${deletedScores?.length || 0} students_score records`);

      // 4. Reset XP to 0
      const { data: updatedStudent, error: xpError } = await supabase
        .from('students')
        .update({ total_xp: 0, current_level: 1 })
        .eq('id', user.id)
        .select();

      if (xpError) throw xpError;
      console.log('✓ Reset XP and level:', updatedStudent);

      // 5. Clear ALL localStorage keys related to progress
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes(user.id) ||
          key.startsWith('trail_') ||
          key.startsWith('progress_') ||
          key.startsWith('xp_') ||
          key.includes('migration')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('✓ Cleared localStorage keys:', keysToRemove);

      // 6. Invalidate ALL React Query caches
      await queryClient.invalidateQueries();
      queryClient.clear();
      console.log('✓ Cleared React Query cache');

      // 7. Update local state immediately
      setProgress([]);
      setCompletedNodeIds([]);
      setUnlockedNodes(new Set());
      setCurrentUnits({ treble: 1, bass: 1, rhythm: 1 });
      console.log('✓ Reset local state');

      // 8. Verify deletion by fetching fresh data
      console.log('🔍 Verifying deletion...');
      const { data: verifyProgress } = await supabase
        .from('student_skill_progress')
        .select('*')
        .eq('student_id', user.id);

      console.log('Remaining progress records:', verifyProgress?.length || 0);

      if (verifyProgress && verifyProgress.length > 0) {
        console.error('⚠️ WARNING: Progress records still exist!', verifyProgress);
      }

      console.log('✅ Reset complete! Reloading in 1 second...');

      // Wait longer for database changes to propagate, then hard reload
      setTimeout(() => {
        window.location.href = window.location.pathname + '?reset=' + Date.now();
      }, 1000);

    } catch (error) {
      console.error('❌ Error resetting progress:', error);
      alert(`❌ Error: ${error.message}\n\nCheck console for details.`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-bounce">&#127925;</div>
          <p className="text-lg text-white/70">{t('loading', { ns: 'trail' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Tab Bar */}
      <div role="tablist" aria-label={t('tabs.ariaLabel', { defaultValue: 'Learning paths' })} className="flex justify-center gap-2 px-4 py-3">
        {TRAIL_TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const nodes = tab.id === 'treble' ? trebleWithBoss :
                        tab.id === 'bass' ? bassWithBoss : rhythmWithBoss;
          const progress = getPathProgress(nodes);

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
                  ? 'bg-white/15 backdrop-blur-sm border border-white/30 text-white shadow-lg'
                  : 'bg-transparent border border-white/10 text-white/60 hover:text-white/80 hover:border-white/20'
                }
              `}
            >
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
        <ZigzagTrailLayout
          nodes={activeNodes}
          completedNodeIds={completedNodeIds}
          unlockedNodes={unlockedNodes}
          onNodeClick={setSelectedNode}
          getNodeProgress={getNodeProgress}
          activeNodeRef={activeNodeRef}
          units={units}
          nodesByUnit={nodesByUnit}
          isDesktop={isDesktop}
          isRTL={isRTL}
        />
      </div>

      {/* Node detail modal */}
      {selectedNode && (
        <TrailNodeModal
          node={selectedNode}
          progress={getNodeProgress(selectedNode.id)}
          isUnlocked={unlockedNodes.has(selectedNode.id)}
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
