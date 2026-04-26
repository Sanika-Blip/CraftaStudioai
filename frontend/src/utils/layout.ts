import { Node, Edge } from "@xyflow/react";
import { CanvasJSONPayload } from "../types/canvas";

/**
 * Clean grid layout: planner node centered left, blocks in 2-column grid to the right.
 * Prevents overlapping and gives a professional Lovable/Linear-style flow.
 */
export function calculateCircularLayout(
  payload: CanvasJSONPayload,
  _center: { x: number; y: number } = { x: 0, y: 0 }
) {
  const blocks = payload.blocks;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Planner node pinned left-center
  const PLANNER_X = -240;
  const PLANNER_Y = -80;

  nodes.push({
    id: "planner",
    type: "planner",
    position: { x: PLANNER_X, y: PLANNER_Y },
    data: {},
    draggable: true,
  });

  // Block grid layout — 2 columns to the right of the planner
  const COL_COUNT = 2;
  const COL_GAP_X = 380;  // horizontal spacing
  const ROW_GAP_Y = 220;  // vertical spacing
  const GRID_START_X = 220; // right of planner
  const GRID_START_Y = -((Math.ceil(blocks.length / COL_COUNT) - 1) * ROW_GAP_Y) / 2 - 80;

  const PALETTE = [
    { color: "#8b5cf6", colorEnd: "#3b82f6" },
    { color: "#a855f7", colorEnd: "#6366f1" },
    { color: "#06b6d4", colorEnd: "#3b82f6" },
    { color: "#10b981", colorEnd: "#06b6d4" },
    { color: "#f59e0b", colorEnd: "#ef4444" },
    { color: "#ec4899", colorEnd: "#8b5cf6" },
  ];

  blocks.forEach((block, index) => {
    const col = index % COL_COUNT;
    const row = Math.floor(index / COL_COUNT);
    const x = GRID_START_X + col * COL_GAP_X;
    const y = GRID_START_Y + row * ROW_GAP_Y;

    // Use DB id if it looks like a UUID, otherwise use index-based id
    const isUUID = /^[0-9a-f-]{36}$/.test(block.id ?? "");
    const nodeId = isUUID ? block.id : `blk-${index}`;

    nodes.push({
      id: nodeId,
      type: "block",
      position: { x, y },
      data: { ...block, id: nodeId },
    });

    const pair = PALETTE[index % PALETTE.length];

    edges.push({
      id: `e-${nodeId}-${index}`, // include index to guarantee uniqueness
      source: "planner",
      target: nodeId,
      type: "flowing",
      data: { animated: true, ...pair },
    });
  });

  return { nodes, edges };
}
