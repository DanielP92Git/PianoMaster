/**
 * TrailMap Component
 *
 * Displays the complete skill trail with nodes organized in a winding path
 * Duolingo-style progression with connected nodes and visual feedback
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useUser } from '../../features/authentication/useUser';
import {
  getNodesByCategory,
  getBossNodes,
  NODE_CATEGORIES
} from '../../data/skillTrail';
import {
  getStudentProgress,
  getCompletedNodeIds,
} from '../../services/skillProgressService';
import TrailNode from './TrailNode';
import TrailNodeModal from './TrailNodeModal';

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
 * Trail Section Component
 * Renders a single category path with winding layout
 * Nodes fit within container width without horizontal scroll
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
  findCurrentNode
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for padding (24px on each side = 48px total from p-6)
        setContainerWidth(containerRef.current.offsetWidth - 48);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate node positions for horizontal wavy path
  const NODE_SIZE = 70; // Slightly smaller nodes
  const WAVE_AMPLITUDE = 30; // Vertical wobble range
  const CENTER_Y = 120; // Center vertical position
  const PADDING_X = 50; // Horizontal padding on edges

  const nodePositions = useMemo(() => {
    const numNodes = nodes.length;
    // Calculate available width for nodes
    const availableWidth = containerWidth - PADDING_X * 2;
    // Calculate spacing between nodes (distribute evenly)
    const spacing = numNodes > 1 ? availableWidth / (numNodes - 1) : 0;

    return nodes.map((node, index) => {
      // Horizontal position: evenly distributed within container
      const x = numNodes > 1
        ? PADDING_X + index * spacing
        : containerWidth / 2; // Center single node

      // Vertical position: sine wave for wavy effect
      const verticalWobble = Math.sin(index * 0.7) * WAVE_AMPLITUDE;
      const y = CENTER_Y + verticalWobble;

      return {
        node,
        x,
        y,
        index
      };
    });
  }, [nodes, containerWidth]);

  // SVG dimensions fit the container
  const svgWidth = containerWidth;
  const svgHeight = CENTER_Y + WAVE_AMPLITUDE + 80;

  // Find current node for this section
  const currentNode = findCurrentNode(nodes);

  return (
    <div ref={containerRef} className="relative rounded-3xl bg-white/5 p-6 backdrop-blur-sm">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-xl shadow-lg sm:h-12 sm:w-12 sm:text-2xl">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          <p className="text-xs text-white/60 sm:text-sm">{subtitle}</p>
        </div>
      </div>

      {/* Path Container - No horizontal scroll */}
      <div className="overflow-hidden pb-2">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
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
            const isCurrent = currentNode?.id === pos.node.id;

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
                  isCurrent={isCurrent}
                  isFirstNode={pos.index === 0}
                  onClick={onNodeClick}
                />
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const TrailMap = () => {
  const { user } = useUser();
  const [progress, setProgress] = useState([]);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [progressData, completedIds] = await Promise.all([
          getStudentProgress(user.id),
          getCompletedNodeIds(user.id)
        ]);

        setProgress(progressData);
        setCompletedNodeIds(completedIds);

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-bounce">&#127925;</div>
          <p className="text-lg text-white/70">Loading your trail...</p>
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
      <TrailSection
        title="Treble Clef Path"
        subtitle="Learn to read notes in the treble clef"
        icon="&#119070;"
        nodes={trebleNodes}
        completedNodeIds={completedNodeIds}
        unlockedNodes={unlockedNodes}
        onNodeClick={setSelectedNode}
        getNodeProgress={getNodeProgress}
        findCurrentNode={findCurrentNode}
      />

      {/* Bass Clef Path */}
      <TrailSection
        title="Bass Clef Path"
        subtitle="Master the bass clef notes"
        icon="&#119074;"
        nodes={bassNodes}
        completedNodeIds={completedNodeIds}
        unlockedNodes={unlockedNodes}
        onNodeClick={setSelectedNode}
        getNodeProgress={getNodeProgress}
        findCurrentNode={findCurrentNode}
      />

      {/* Rhythm Path */}
      <TrailSection
        title="Rhythm Path"
        subtitle="Keep the beat and learn rhythm patterns"
        icon="&#127928;"
        nodes={rhythmNodes}
        completedNodeIds={completedNodeIds}
        unlockedNodes={unlockedNodes}
        onNodeClick={setSelectedNode}
        getNodeProgress={getNodeProgress}
        findCurrentNode={findCurrentNode}
      />

      {/* Boss Battles */}
      {bossNodes.length > 0 && (
        <TrailSection
          title="Boss Challenges"
          subtitle="Test your mastery with special challenges"
          icon="&#128081;"
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
    </div>
  );
};

export default TrailMap;
