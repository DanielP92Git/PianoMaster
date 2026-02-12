/**
 * HorizontalTrailLayout Component
 *
 * Desktop-optimized horizontal wavy layout for trail nodes.
 * Each unit is a horizontal row with gentle wavy vertical offset.
 * UnitProgressCards appear between unit rows as visual separators.
 * Vertical scroll (no horizontal overflow).
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PathConnector from './PathConnector';
import UnitProgressCard from './UnitProgressCard';
import TrailNode from './TrailNode';
import { translateNodeName } from '../../utils/translateNodeName';

const HorizontalTrailLayout = ({
  nodes,
  completedNodeIds,
  unlockedNodes,
  onNodeClick,
  getNodeProgress,
  activeNodeRef,
  units,
  nodesByUnit
}) => {
  const { t, i18n } = useTranslation('trail');

  return (
    <div className="w-full space-y-6">
      {units.map((unit) => {
        const unitNodes = nodesByUnit[unit.order] || [];
        if (unitNodes.length === 0) return null;

        return (
          <UnitRow
            key={unit.order}
            unit={unit}
            unitNodes={unitNodes}
            completedNodeIds={completedNodeIds}
            unlockedNodes={unlockedNodes}
            onNodeClick={onNodeClick}
            getNodeProgress={getNodeProgress}
            activeNodeRef={activeNodeRef}
            t={t}
            i18n={i18n}
          />
        );
      })}
    </div>
  );
};

/**
 * UnitRow Component
 * Renders a single unit as a horizontal wavy row of nodes
 */
const UnitRow = ({
  unit,
  unitNodes,
  completedNodeIds,
  unlockedNodes,
  onNodeClick,
  getNodeProgress,
  activeNodeRef,
  t,
  i18n
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate node positions with wavy vertical offset
  const nodePositions = useMemo(() => {
    const numNodes = unitNodes.length;
    const PADDING_X = 60;
    const CENTER_Y = 90;
    const WAVE_AMPLITUDE = 20;

    const availableWidth = containerWidth - PADDING_X * 2;
    const spacing = numNodes > 1 ? availableWidth / (numNodes - 1) : 0;

    return unitNodes.map((node, index) => {
      const x = numNodes > 1
        ? PADDING_X + index * spacing
        : containerWidth / 2;

      // Gentle wavy vertical offset
      const yOffset = Math.sin(index * 0.8) * WAVE_AMPLITUDE;
      const y = CENTER_Y + yOffset;

      return { node, x, y, index };
    });
  }, [unitNodes, containerWidth]);

  // Find current node in this unit
  const currentNodeId = useMemo(() => {
    const firstIncomplete = unitNodes.find(
      node => unlockedNodes.has(node.id) && !completedNodeIds.includes(node.id)
    );

    if (firstIncomplete) return firstIncomplete.id;

    // If all completed, use last completed in this unit
    const completedInUnit = unitNodes.filter(n => completedNodeIds.includes(n.id));
    if (completedInUnit.length > 0) {
      return completedInUnit[completedInUnit.length - 1].id;
    }

    return unitNodes[0]?.id;
  }, [unitNodes, unlockedNodes, completedNodeIds]);

  // Calculate unit progress for UnitProgressCard
  const completedCount = unitNodes.filter(n => completedNodeIds.includes(n.id)).length;
  const totalStars = unitNodes.reduce((sum, n) => {
    const prog = getNodeProgress(n.id);
    return sum + (prog?.stars || 0);
  }, 0);
  const maxStars = unitNodes.length * 3;
  const isUnitComplete = completedCount === unitNodes.length;

  const containerHeight = 200; // Fixed height to accommodate wave + labels

  return (
    <>
      {/* Unit row container */}
      <div className="max-w-5xl mx-auto px-8">
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ height: `${containerHeight}px` }}
        >
          {/* SVG layer for path connectors */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            {nodePositions.map((pos, index) => {
              if (index === 0) return null;

              const prevPos = nodePositions[index - 1];

              const startX = prevPos.x;
              const startY = prevPos.y;
              const endX = pos.x;
              const endY = pos.y;

              const isCompleted = completedNodeIds.includes(prevPos.node.id);
              const isLocked = !unlockedNodes.has(pos.node.id);

              return (
                <PathConnector
                  key={`path-${pos.node.id}`}
                  startX={startX}
                  startY={startY}
                  endX={endX}
                  endY={endY}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                />
              );
            })}
          </svg>

          {/* Nodes layer */}
          {nodePositions.map((pos) => {
            const node = pos.node;
            const nodeProgress = getNodeProgress(node.id);
            const isUnlocked = unlockedNodes.has(node.id);
            const isCompleted = completedNodeIds.includes(node.id);
            const isCurrent = node.id === currentNodeId;
            const isFirstNode = pos.index === 0;

            return (
              <div
                key={node.id}
                ref={isCurrent ? activeNodeRef : null}
                className="absolute"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Scale node up 1.1x for desktop */}
                <div className="transform scale-110 origin-center flex flex-col items-center">
                  <TrailNode
                    node={node}
                    progress={nodeProgress}
                    isUnlocked={isUnlocked}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isFirstNode={isFirstNode}
                    onClick={onNodeClick}
                  />
                  {/* Node label always visible on desktop */}
                  <div className="mt-1 text-xs font-semibold text-white text-center max-w-[90px]">
                    {translateNodeName(node.name, t, i18n)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UnitProgressCard below unit row */}
      <div className="max-w-5xl mx-auto px-8 my-4">
        <UnitProgressCard
          unit={unit}
          completedCount={completedCount}
          totalCount={unitNodes.length}
          totalStars={totalStars}
          maxStars={maxStars}
          isUnitComplete={isUnitComplete}
        />
      </div>
    </>
  );
};

export default HorizontalTrailLayout;
