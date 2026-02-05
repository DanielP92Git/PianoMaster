/**
 * TrailMap Component
 *
 * Displays the complete skill trail with nodes organized in a winding path
 * Duolingo-style progression with connected nodes and visual feedback
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Drum, Crown, ChevronDown, ChevronUp, Target, Trash2 } from 'lucide-react';
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
import TrailNode from './TrailNode';
import TrailNodeModal from './TrailNodeModal';
import supabase from '../../services/supabase';

/**
 * SVG Path connector between nodes
 * Creates a curved line with optional glow for completed sections
 */
const PathConnector = ({ startX, startY, endX, endY, isCompleted }) => {
  // Determine if this is a horizontal or vertical connection
  const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);

  let path;
  if (isHorizontal) {
    // Horizontal curve with slight vertical offset
    const cpOffset = Math.abs(endX - startX) * 0.4;
    path = `M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`;
  } else {
    // Vertical curve
    const cpOffset = Math.abs(endY - startY) * 0.4;
    path = `M ${startX} ${startY} C ${startX} ${startY + cpOffset}, ${endX} ${endY - cpOffset}, ${endX} ${endY}`;
  }

  return (
    <g>
      {/* Glow effect for completed paths */}
      {isCompleted && (
        <path
          d={path}
          fill="none"
          stroke="rgba(74, 222, 128, 0.4)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="blur(4px)"
        />
      )}
      {/* Main path line */}
      <path
        d={path}
        fill="none"
        stroke={isCompleted ? '#4ade80' : 'rgba(255, 255, 255, 0.2)'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={isCompleted ? 'none' : '12 8'}
      />
    </g>
  );
};

/**
 * Unit Section Component
 * Renders a collapsible unit with its nodes
 */
const UnitSection = ({
  unit,
  nodes,
  completedNodeIds,
  unlockedNodes,
  onNodeClick,
  getNodeProgress,
  isExpanded,
  onToggle,
  isCurrent
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32);
      }
    };

    // Delay initial measurement to ensure DOM is ready and expansion animation completes
    const timer = setTimeout(updateWidth, 50);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Re-measure when expansion state changes
  useEffect(() => {
    if (isExpanded && containerRef.current) {
      // Wait for expansion animation to complete
      const timer = setTimeout(() => {
        setContainerWidth(containerRef.current.offsetWidth - 32);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Calculate node positions
  const NODE_SIZE = 70;
  const WAVE_AMPLITUDE = 30;
  const CENTER_Y = 120;
  const PADDING_X = 50;

  const nodePositions = useMemo(() => {
    const numNodes = nodes.length;
    const availableWidth = containerWidth - PADDING_X * 2;
    const spacing = numNodes > 1 ? availableWidth / (numNodes - 1) : 0;

    return nodes.map((node, index) => {
      const x = numNodes > 1
        ? PADDING_X + index * spacing
        : containerWidth / 2;

      const verticalWobble = Math.sin(index * 0.7) * WAVE_AMPLITUDE;
      const y = CENTER_Y + verticalWobble;

      return { node, x, y, index };
    });
  }, [nodes, containerWidth]);

  const svgWidth = containerWidth;
  const svgHeight = CENTER_Y + WAVE_AMPLITUDE + 80;

  // Calculate unit progress
  const completedInUnit = nodes.filter(n => completedNodeIds.includes(n.id)).length;
  const totalStars = nodes.reduce((sum, n) => {
    const prog = getNodeProgress(n.id);
    return sum + (prog?.stars || 0);
  }, 0);
  const maxStars = nodes.length * 3;
  const unitComplete = completedInUnit === nodes.length;

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl ${
            isCurrent ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse' :
            unitComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
            'bg-gradient-to-br from-purple-500/50 to-indigo-600/50'
          }`}>
            {unit?.icon || '📚'}
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white">{unit?.name || 'Unit'}</h3>
            <p className="text-xs text-white/60">{completedInUnit}/{nodes.length} complete • {totalStars}/{maxStars} ⭐</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unitComplete && <span className="text-green-400 text-sm">✓</span>}
          {isExpanded ? <ChevronUp className="h-5 w-5 text-white/60" /> : <ChevronDown className="h-5 w-5 text-white/60" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div ref={containerRef} className="w-full px-4 pb-4">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="block w-full"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Path Connectors */}
            {nodePositions.map((pos, index) => {
              if (index === 0) return null;
              const prevPos = nodePositions[index - 1];
              const isCompleted = completedNodeIds.includes(prevPos.node.id);

              return (
                <PathConnector
                  key={`path-${pos.node.id}`}
                  startX={prevPos.x}
                  startY={prevPos.y}
                  endX={pos.x}
                  endY={pos.y}
                  isCompleted={isCompleted}
                />
              );
            })}

            {/* Nodes */}
            {nodePositions.map((pos) => {
              const nodeProgress = getNodeProgress(pos.node.id);
              const isUnlocked = unlockedNodes.has(pos.node.id);
              const isCompleted = completedNodeIds.includes(pos.node.id);

              return (
                <foreignObject
                  key={pos.node.id}
                  x={pos.x - NODE_SIZE / 2}
                  y={pos.y - NODE_SIZE / 2 - 15}
                  width={NODE_SIZE + 10}
                  height={NODE_SIZE + 50}
                >
                  <TrailNode
                    node={pos.node}
                    progress={nodeProgress}
                    isUnlocked={isUnlocked}
                    isCompleted={isCompleted}
                    isCurrent={false}
                    isFirstNode={pos.index === 0}
                    onClick={onNodeClick}
                  />
                </foreignObject>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Trail Section Component
 * Renders a single category path with unit grouping
 * Nodes organized in collapsible units with vertical scroll
 */
const TrailSection = ({
  title,
  subtitle,
  icon,
  nodes,
  completedNodeIds,
  unlockedNodes,
  onNodeClick,
  getNodeProgress,
  findCurrentNode,
  category,
  currentUnit
}) => {
  // State for expanded units
  const [expandedUnits, setExpandedUnits] = useState(new Set());

  // Group nodes by unit
  const nodesByUnit = useMemo(() => {
    const grouped = {};

    // Separate nodes with units vs legacy nodes
    const nodesWithUnits = nodes.filter(n => n.unit);
    const legacyNodes = nodes.filter(n => !n.unit);

    // Group by unit number
    nodesWithUnits.forEach(node => {
      const unitNum = node.unit;
      if (!grouped[unitNum]) {
        grouped[unitNum] = [];
      }
      grouped[unitNum].push(node);
    });

    // Add legacy nodes as a pseudo-unit if any exist
    if (legacyNodes.length > 0) {
      grouped[999] = legacyNodes; // Use 999 for legacy
    }

    // Sort nodes within each unit by orderInUnit
    Object.keys(grouped).forEach(unitNum => {
      grouped[unitNum].sort((a, b) => (a.orderInUnit || 0) - (b.orderInUnit || 0));
    });

    return grouped;
  }, [nodes]);

  // Get units metadata
  const units = useMemo(() => {
    const unitKeys = Object.keys(nodesByUnit).filter(k => k !== '999').map(Number).sort((a, b) => a - b);
    return unitKeys.map(unitNum => {
      // Find the UNITS entry for this category and unit number
      const unitKey = Object.keys(UNITS).find(key => {
        const unit = UNITS[key];
        return unit.category === category && unit.order === unitNum;
      });
      return unitKey ? UNITS[unitKey] : { order: unitNum, name: `Unit ${unitNum}`, icon: '📚' };
    });
  }, [nodesByUnit, category]);

  // Auto-expand current unit and adjacent units
  useEffect(() => {
    if (currentUnit) {
      const toExpand = new Set();
      toExpand.add(currentUnit);
      if (currentUnit > 1) toExpand.add(currentUnit - 1);
      toExpand.add(currentUnit + 1);
      setExpandedUnits(toExpand);
    } else if (units.length > 0) {
      // Default: expand first unit
      setExpandedUnits(new Set([units[0].order]));
    }
  }, [currentUnit, units]);

  const toggleUnit = (unitNum) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitNum)) {
        next.delete(unitNum);
      } else {
        next.add(unitNum);
      }
      return next;
    });
  };

  return (
    <div className="relative rounded-3xl bg-white/5 p-4 sm:p-6 backdrop-blur-sm">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg sm:h-12 sm:w-12">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          <p className="text-xs text-white/60 sm:text-sm">{subtitle}</p>
        </div>
      </div>

      {/* Units Container - Vertical scroll */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar-minimal">
        {units.map((unit) => {
          const unitNodes = nodesByUnit[unit.order] || [];
          return (
            <UnitSection
              key={unit.order}
              unit={unit}
              nodes={unitNodes}
              completedNodeIds={completedNodeIds}
              unlockedNodes={unlockedNodes}
              onNodeClick={onNodeClick}
              getNodeProgress={getNodeProgress}
              isExpanded={expandedUnits.has(unit.order)}
              onToggle={() => toggleUnit(unit.order)}
              isCurrent={currentUnit === unit.order}
            />
          );
        })}

        {/* Legacy nodes section (if any) */}
        {nodesByUnit[999] && (
          <UnitSection
            key="legacy"
            unit={{ order: 999, name: 'Classic Nodes', icon: '📜' }}
            nodes={nodesByUnit[999]}
            completedNodeIds={completedNodeIds}
            unlockedNodes={unlockedNodes}
            onNodeClick={onNodeClick}
            getNodeProgress={getNodeProgress}
            isExpanded={expandedUnits.has(999)}
            onToggle={() => toggleUnit(999)}
            isCurrent={false}
          />
        )}
      </div>
    </div>
  );
};

const TrailMap = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
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
  const trebleSectionRef = useRef(null);
  const bassSectionRef = useRef(null);
  const rhythmSectionRef = useRef(null);

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

  const { t } = useTranslation(['trail', 'common']);

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

  // Calculate total stars
  const totalStars = progress.reduce((sum, p) => sum + (p.stars || 0), 0);

  return (
    <div className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Progress Summary Banner */}
      {/* <div className="flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 px-4 py-3 backdrop-blur-sm sm:gap-8 sm:px-6 sm:py-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-2xl">&#11088;</span>
          <div>
            <div className="text-lg font-bold text-yellow-400 sm:text-2xl">{totalStars}</div>
            <div className="text-[10px] text-white/60 sm:text-xs">Stars</div>
          </div>
        </div>
        <div className="h-8 w-px bg-white/20 sm:h-10" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-2xl">&#9989;</span>
          <div>
            <div className="text-lg font-bold text-green-400 sm:text-2xl">{completedNodeIds.length}</div>
            <div className="text-[10px] text-white/60 sm:text-xs">Done</div>
          </div>
        </div>
        <div className="h-8 w-px bg-white/20 sm:h-10" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-2xl">&#128275;</span>
          <div>
            <div className="text-lg font-bold text-cyan-400 sm:text-2xl">{unlockedNodes.size}</div>
            <div className="text-[10px] text-white/60 sm:text-xs">Open</div>
          </div>
        </div>
      </div> */}

      {/* Treble Clef Path */}
      <div ref={trebleSectionRef}>
        <TrailSection
          title={t('sections.trebleClef.title', { ns: 'trail' })}
          subtitle={t('sections.trebleClef.subtitle', { ns: 'trail' })}
          icon={<img src={trebleClefIcon} alt="" className="h-8 w-8 sm:h-12 sm:w-12 brightness-0 invert" />}
          nodes={trebleNodes}
          completedNodeIds={completedNodeIds}
          unlockedNodes={unlockedNodes}
          onNodeClick={setSelectedNode}
          getNodeProgress={getNodeProgress}
          findCurrentNode={findCurrentNode}
          category={NODE_CATEGORIES.TREBLE_CLEF}
          currentUnit={currentUnits.treble}
        />
      </div>

      {/* Bass Clef Path */}
      <div ref={bassSectionRef}>
        <TrailSection
          title={t('sections.bassClef.title', { ns: 'trail' })}
          subtitle={t('sections.bassClef.subtitle', { ns: 'trail' })}
          icon={<img src={bassClefIcon} alt="" className="h-8 w-8 sm:h-12 sm:w-12 brightness-0 invert" />}
          nodes={bassNodes}
          completedNodeIds={completedNodeIds}
          unlockedNodes={unlockedNodes}
          onNodeClick={setSelectedNode}
          getNodeProgress={getNodeProgress}
          findCurrentNode={findCurrentNode}
          category={NODE_CATEGORIES.BASS_CLEF}
          currentUnit={currentUnits.bass}
        />
      </div>

      {/* Rhythm Path */}
      <div ref={rhythmSectionRef}>
        <TrailSection
          title={t('sections.rhythm.title', { ns: 'trail' })}
          subtitle={t('sections.rhythm.subtitle', { ns: 'trail' })}
          icon={<Drum className="h-5 w-5 sm:h-6 sm:w-6" />}
          nodes={rhythmNodes}
          completedNodeIds={completedNodeIds}
          unlockedNodes={unlockedNodes}
          onNodeClick={setSelectedNode}
          getNodeProgress={getNodeProgress}
          findCurrentNode={findCurrentNode}
          category={NODE_CATEGORIES.RHYTHM}
          currentUnit={currentUnits.rhythm}
        />
      </div>

      {/* Boss Battles */}
      {bossNodes.length > 0 && (
        <TrailSection
          title={t('sections.boss.title', { ns: 'trail' })}
          subtitle={t('sections.boss.subtitle', { ns: 'trail' })}
          icon={<Crown className="h-5 w-5 sm:h-6 sm:w-6" />}
          nodes={bossNodes}
          completedNodeIds={completedNodeIds}
          unlockedNodes={unlockedNodes}
          onNodeClick={setSelectedNode}
          getNodeProgress={getNodeProgress}
          findCurrentNode={findCurrentNode}
        />
      )}

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

      {/* Jump to Current Node - Floating Action Button */}
      <button
        onClick={() => {
          // Find which category has the most progress
          const trebleProgress = trebleNodes.filter(n => completedNodeIds.includes(n.id)).length;
          const bassProgress = bassNodes.filter(n => completedNodeIds.includes(n.id)).length;
          const rhythmProgress = rhythmNodes.filter(n => completedNodeIds.includes(n.id)).length;

          // Scroll to the section with most recent activity
          if (trebleProgress >= bassProgress && trebleProgress >= rhythmProgress) {
            trebleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (bassProgress >= rhythmProgress) {
            bassSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            rhythmSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 sm:h-16 sm:w-16"
        aria-label="Jump to current node"
      >
        <Target className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {/* DEV ONLY: Reset Progress Button */}
      {import.meta.env.DEV && (
        <button
          onClick={handleResetProgress}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-2xl transition-all hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          aria-label="Reset all progress (dev only)"
          title="DEV ONLY: Reset all trail progress and XP"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Reset Progress</span>
          <span className="sm:hidden">Reset</span>
        </button>
      )}
    </div>
  );
};

export default TrailMap;
