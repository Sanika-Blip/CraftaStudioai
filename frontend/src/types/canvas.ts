/**
 * Represents a nested feature or sub-item within a larger architectural block.
 */
export interface CanvasSubBlock {
  id: string;
  type: string;
  title?: string;
  status?: "done" | "running" | "idle" | "error" | "awaiting_confirm" | "failed" | "pending";
  description?: string;
}

/**
 * Represents a top-level architectural block in the canvas graph.
 */
export interface CanvasBlock {
  id: string;
  type: string;
  title?: string;
  stack?: string;
  status: "done" | "running" | "idle" | "error" | "awaiting_confirm" | "failed" | "pending";
  files?: string[];
  subBlocks?: CanvasSubBlock[];
}

/**
 * The structured payload received from the planner engine.
 */
export interface CanvasJSONPayload {
  blocks: CanvasBlock[];
}
