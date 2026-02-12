/**
 * ZigzagTrailLayout Component
 *
 * Vertical zigzag layout for trail nodes (used on both mobile and desktop).
 * Nodes alternate left/right with smooth S-curve SVG paths.
 * UnitProgressCards appear ABOVE each unit's nodes as chapter breaks.
 * Desktop mode: narrower zigzag (35%/65%), larger nodes, more spacing.
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import PathConnector from './PathConnector';
import UnitProgressCard from './UnitProgressCard';
import TrailNode from './TrailNode';

const ZigzagTrailLayout = ({
  nodes,
  completedNodeIds,
  unlockedNodes,
  onNodeClick,
  getNodeProgress,
  activeNodeRef,
  units,
  nodesByUnit,
  isDesktop = false,
  isRTL = false
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  // Responsive layout constants
  const CARD_HEIGHT = 80; // Unit card approximate height
  const CARD_SPACING = isDesktop ? 50 : 40; // Space below card before first node
  const NODE_SPACING = isDesktop ? 120 : 110; // Vertical distance between nodes
  const LEFT_PERCENT = isDesktop ? 35 : 25;
  const RIGHT_PERCENT = isDesktop ? 65 : 75;
  const VARIATION_AMP = isDesktop ? 3 : 5; // Horizontal jitter amplitude

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

  // Build layout items array with unit cards BEFORE their nodes
  const layoutItems = useMemo(() => {
    const items = [];
    let nodeIndex = 0;

    units.forEach((unit) => {
      const unitNodes = nodesByUnit[unit.order] || [];
      if (unitNodes.length === 0) return;

      // Calculate unit progress
      const completedInUnit = unitNodes.filter(n => completedNodeIds.includes(n.id)).length;
      const totalStars = unitNodes.reduce((sum, n) => {
        const prog = getNodeProgress(n.id);
        return sum + (prog?.stars || 0);
      }, 0);
      const maxStars = unitNodes.length * 3;
      const isUnitComplete = completedInUnit === unitNodes.length;

      // Add unit card BEFORE the unit's nodes
      items.push({
        type: 'unitCard',
        unit,
        unitNodes,
        completedCount: completedInUnit,
        totalCount: unitNodes.length,
        totalStars,
        maxStars,
        isUnitComplete
      });

      // Add each node in this unit
      unitNodes.forEach((node) => {
        items.push({
          type: 'node',
          node,
          unitOrder: unit.order,
          nodeIndex: nodeIndex++
        });
      });
    });

    return items;
  }, [units, nodesByUnit, completedNodeIds, getNodeProgress]);

  // Calculate positions for all layout items
  const positions = useMemo(() => {
    const pos = [];
    let currentY = 30; // Start Y position

    layoutItems.forEach((item) => {
      if (item.type === 'unitCard') {
        pos.push({
          item,
          xPercent: 50,
          y: currentY
        });
        // Card height + spacing below before first node
        currentY += CARD_HEIGHT + CARD_SPACING;
      } else if (item.type === 'node') {
        // Calculate zigzag horizontal position with deterministic variation
        const isLeft = item.nodeIndex % 2 === 0;
        const basePercent = isLeft ? LEFT_PERCENT : RIGHT_PERCENT;
        const variation = Math.sin(item.nodeIndex * 1.7) * VARIATION_AMP;
        let xPercent = basePercent + variation;

        // Mirror position for RTL
        if (isRTL) {
          xPercent = 100 - xPercent;
        }

        pos.push({
          item,
          xPercent,
          y: currentY
        });

        currentY += NODE_SPACING;
      }
    });

    return pos;
  }, [layoutItems, CARD_HEIGHT, CARD_SPACING, NODE_SPACING, LEFT_PERCENT, RIGHT_PERCENT, VARIATION_AMP]);

  // Calculate total height
  const totalHeight = positions.length > 0
    ? positions[positions.length - 1].y + 120
    : 400;

  // Find current/active node
  const currentNodeId = useMemo(() => {
    const firstIncomplete = layoutItems.find(
      item => item.type === 'node' &&
              unlockedNodes.has(item.node.id) &&
              !completedNodeIds.includes(item.node.id)
    );

    if (firstIncomplete) return firstIncomplete.node.id;

    const completedItems = layoutItems.filter(
      item => item.type === 'node' && completedNodeIds.includes(item.node.id)
    );
    if (completedItems.length > 0) {
      return completedItems[completedItems.length - 1].node.id;
    }

    const firstNode = layoutItems.find(item => item.type === 'node');
    return firstNode ? firstNode.node.id : null;
  }, [layoutItems, unlockedNodes, completedNodeIds]);

  // Get node positions only (for path drawing)
  const nodePositions = useMemo(() => {
    return positions.filter(pos => pos.item.type === 'node');
  }, [positions]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isDesktop ? 'max-w-lg mx-auto' : ''}`}
      style={{ height: `${totalHeight}px` }}
    >
      {/* SVG layer for path connectors - z-index 0 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible', zIndex: 0 }}
      >
        {nodePositions.map((pos, index) => {
          if (index === 0) return null;

          const prevPos = nodePositions[index - 1];

          // Convert percentage to pixels
          const startX = (prevPos.xPercent / 100) * containerWidth;
          const startY = prevPos.y;
          const endX = (pos.xPercent / 100) * containerWidth;
          const endY = pos.y;

          const isCompleted = completedNodeIds.includes(prevPos.item.node.id);
          const isLocked = !unlockedNodes.has(pos.item.node.id);

          return (
            <PathConnector
              key={`path-${pos.item.node.id}`}
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

      {/* Node and card layer - above SVG */}
      {positions.map((pos) => {
        if (pos.item.type === 'unitCard') {
          return (
            <div
              key={`card-${pos.item.unit.order}`}
              className="absolute left-0 right-0 px-4"
              style={{ top: `${pos.y}px`, zIndex: 3 }}
            >
              <UnitProgressCard
                unit={pos.item.unit}
                completedCount={pos.item.completedCount}
                totalCount={pos.item.totalCount}
                totalStars={pos.item.totalStars}
                maxStars={pos.item.maxStars}
                isUnitComplete={pos.item.isUnitComplete}
              />
            </div>
          );
        }

        // Render node
        const node = pos.item.node;
        const nodeProgress = getNodeProgress(node.id);
        const isUnlocked = unlockedNodes.has(node.id);
        const isCompleted = completedNodeIds.includes(node.id);
        const isCurrent = node.id === currentNodeId;
        const isFirstNode = pos.item.nodeIndex === 0;

        return (
          <div
            key={node.id}
            ref={isCurrent ? activeNodeRef : null}
            className="absolute w-20"
            style={{
              left: `${pos.xPercent}%`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          >
            <div className={`flex flex-col items-center ${isDesktop ? 'transform scale-110 origin-center' : ''}`}>
              <TrailNode
                node={node}
                progress={nodeProgress}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isFirstNode={isFirstNode}
                onClick={onNodeClick}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ZigzagTrailLayout;
