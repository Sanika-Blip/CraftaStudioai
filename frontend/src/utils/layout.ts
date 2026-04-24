import { Node, Edge } from "@xyflow/react";
import { CanvasJSONPayload } from "../types/canvas";

/**
 * Calculates a circular distribution of blocks around a central point.
 * 
 * @param payload The raw JSON payload from the planner engine.
 * @param center The coordinates of the central planner node.
 * @returns An object containing React Flow formatted nodes and edges.
 */
export function calculateCircularLayout(
  payload: CanvasJSONPayload,
  center: { x: number; y: number } = { x: 0, y: 0 }
) {
  const blocks = payload.blocks;
  const totalNodes = blocks.length;
  
  // Adaptive radius logic: Grows as more nodes are added to prevent overlapping
  const BASE_RADIUS = 350;
  const SPACING_FACTOR = 40;
  const radius = BASE_RADIUS + totalNodes * SPACING_FACTOR;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. Always include the central Planner Node
  nodes.push({
    id: "planner",
    type: "planner",
    position: center,
    data: {},
    draggable: true,
  });

  // 2. Distribute blocks radially
  blocks.forEach((block, index) => {
    // Trigonometry: angle in radians
    const angle = (index / totalNodes) * 2 * Math.PI;
    
    // Calculate precise Cartesian coordinates
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);

    const nodeId = block.id || `blk-${index}`;

    nodes.push({
      id: nodeId,
      type: "block",
      position: { x, y },
      data: { ...block },
    });

    // Colour palette – start and end for gradient
    const PALETTE = [
      { color: "#8b5cf6", colorEnd: "#3b82f6" },
      { color: "#a855f7", colorEnd: "#6366f1" },
      { color: "#7c3aed", colorEnd: "#2563eb" },
      { color: "#6d28d9", colorEnd: "#4f46e5" },
    ];
    const pair = PALETTE[index % PALETTE.length];

    edges.push({
      id: `e-${nodeId}`,
      source: "planner",
      target: nodeId,
      sourceHandle: getHandleForAngle(angle),
      targetHandle: getOpposingHandle(angle),
      type: "flowing",
      data: { animated: true, ...pair },
    });
  });

  return { nodes, edges };
}

/**
 * Helper to determine which side of the planner node the edge should emerge from.
 */
function getHandleForAngle(angle: number) {
  // Normalize angle to 0..2PI
  const norm = angle % (2 * Math.PI);
  
  if (norm > Math.PI / 4 && norm <= (3 * Math.PI) / 4) return "bottom";
  if (norm > (3 * Math.PI) / 4 && norm <= (5 * Math.PI) / 4) return "left";
  if (norm > (5 * Math.PI) / 4 && norm <= (7 * Math.PI) / 4) return "top";
  return "right";
}

/**
 * Helper to determine which side of the target block the edge should enter.
 */
function getOpposingHandle(angle: number) {
  const norm = angle % (2 * Math.PI);
  
  if (norm > Math.PI / 4 && norm <= (3 * Math.PI) / 4) return "top-in";
  if (norm > (3 * Math.PI) / 4 && norm <= (5 * Math.PI) / 4) return "right-in";
  if (norm > (5 * Math.PI) / 4 && norm <= (7 * Math.PI) / 4) return "bottom-in";
  return "left-in";
}
