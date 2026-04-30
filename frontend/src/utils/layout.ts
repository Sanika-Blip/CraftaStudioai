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

  // Planner node pinned at origin
  const PLANNER_X = 0;
  const PLANNER_Y = 0;

  nodes.push({
    id: "planner",
    type: "planner",
    position: { x: PLANNER_X, y: PLANNER_Y },
    data: {},
    draggable: true,
  });

  // Calculate layout dividing blocks left and right
  const blocksOnLeft = Math.ceil(blocks.length / 2);
  const blocksOnRight = blocks.length - blocksOnLeft;

  const ROW_GAP_Y = 220;
  const X_OFFSET = 480; // Distance from planner

  const leftStartY = -((blocksOnLeft - 1) * ROW_GAP_Y) / 2;
  const rightStartY = -((blocksOnRight - 1) * ROW_GAP_Y) / 2;

  let leftIndex = 0;
  let rightIndex = 0;

  // Single clean professional color (dark premium purple)
  const PREMIUM_COLOR = "#8b5cf6"; 

  blocks.forEach((block, index) => {
    const isLeft = index % 2 === 0;

    let x, y;
    if (isLeft) {
      // Left side
      x = PLANNER_X - X_OFFSET - 320; // 320 is approx width of block
      y = PLANNER_Y + leftStartY + leftIndex * ROW_GAP_Y;
      leftIndex++;
    } else {
      // Right side
      x = PLANNER_X + X_OFFSET;
      y = PLANNER_Y + rightStartY + rightIndex * ROW_GAP_Y;
      rightIndex++;
    }

    // Use DB id if it looks like a UUID, otherwise use index-based id
    const isUUID = /^[0-9a-f-]{36}$/.test(block.id ?? "");
    const nodeId = isUUID ? block.id : `blk-${index}`;

    nodes.push({
      id: nodeId,
      type: "block",
      position: { x, y },
      data: { ...block, id: nodeId },
    });

    edges.push({
      id: `e-${nodeId}-${index}`,
      source: "planner",
      sourceHandle: isLeft ? "left" : "right",
      target: nodeId,
      type: "flowing",
      data: { 
        animated: true, 
        color: PREMIUM_COLOR, 
        colorEnd: PREMIUM_COLOR 
      },
    });
  });

  return { nodes, edges };
}
