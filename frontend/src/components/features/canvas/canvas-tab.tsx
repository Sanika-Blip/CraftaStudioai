"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
} from "@xyflow/react";
import { useUser, useAuth } from "@clerk/nextjs";
import "@xyflow/react/dist/style.css";

// System Components
import { PlannerNode } from "@/components/features/canvas/planner-node";
import { BlockNode } from "@/components/features/canvas/block-node";
import { UnknownBlockNode } from "@/components/features/canvas/unknown-block";
import { FlowingEdge } from "@/components/features/canvas/flowing-edge";
import { PlanDocPanel } from "@/components/features/canvas/plan-doc-panel";
import { PremiumPlan } from "@/components/ui/premium-plan";
import { BlockInfoPanel } from "@/components/features/canvas/block-info-panel";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { BlockFocusOverlay } from "@/components/features/canvas/block-focus-overlay";
import { EdgeHighlightProvider, useEdgeHighlight } from "@/components/features/canvas/edge-highlight-context";

// Layout & Types
import { calculateCircularLayout } from "@/utils/layout";
import { CanvasJSONPayload, CanvasBlock } from "@/types/canvas";

interface CanvasTabProps {
  isPlanDocOpen: boolean;
  setIsPlanDocOpen: (open: boolean) => void;
  isPlanMode: boolean;
  setActiveTab: (tab: "canvas" | "code" | "preview") => void;
  isPlanGenerated: boolean;
  setIsPlanGenerated: (gen: boolean) => void;
  isChatSidebarOpen?: boolean;
  setIsChatSidebarOpen?: (open: boolean) => void;
  projectId?: string | null;
}

/**
 * Example JSON Payload from Planner Engine
 */
const MOCK_PAYLOAD: CanvasJSONPayload = {
  blocks: [
    {
      id: "blk-auth",
      type: "block",
      title: "Authentication Module",
      stack: "Next.js + Clerk",
      status: "done",
      subBlocks: [
        { id: "sub-auth-1", type: "auth", title: "User Login Flow", status: "done" },
        { id: "sub-auth-2", type: "auth", title: "Session Guard", status: "done" }
      ]
    },
    {
      id: "blk-db",
      type: "block",
      title: "Data Persistence",
      stack: "PostgreSQL + Prisma",
      status: "running",
      subBlocks: [
        { id: "sub-db-1", type: "db", title: "Prisma Schema Creation", status: "running" },
        { id: "sub-db-2", type: "db", title: "Migration Pipeline", status: "idle" }
      ]
    },
    {
      id: "blk-ui",
      type: "block",
      title: "Frontend Dashboard",
      stack: "React + Tailwind",
      status: "idle",
      subBlocks: [
        { id: "sub-ui-1", type: "ui", title: "Shell Layout", status: "idle" },
        { id: "sub-ui-2", type: "ui", title: "Navigation Sidebar", status: "idle" }
      ]
    },
    {
      id: "blk-api",
      type: "block",
      title: "Inventory API",
      stack: "Node.js + tRPC",
      status: "idle",
      subBlocks: [
        { id: "sub-api-1", type: "api", title: "Product Endpoints", status: "idle" }
      ]
    },
    {
      id: "blk-legacy",
      type: "legacy-system", // Testing unknown type fallback
      title: "Legacy Gateway",
      status: "idle"
    }
  ]
};

function CanvasTabInner({
  isPlanDocOpen,
  setIsPlanDocOpen,
  isPlanMode,
  setActiveTab,
  isPlanGenerated,
  setIsPlanGenerated,
  isChatSidebarOpen,
  setIsChatSidebarOpen,
  projectId
}: CanvasTabProps) {
  const { theme } = useTheme();
  const { fitView } = useReactFlow();
  const { startNode, finishNode } = useEdgeHighlight();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const isDemoMode = user?.primaryEmailAddress?.emailAddress === "demo@craftastudio.com";

  // Cycle reference — tracks the setTimeout handle for the demo cycling loop
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Registry - Easy to extend
  const nodeTypes = useMemo(() => ({
    planner: PlannerNode,
    block: BlockNode,
    "legacy-system": UnknownBlockNode // Map unknown types either explicitly or allow catch-all in render
  }), []);

  const edgeTypes = useMemo(() => ({ flowing: FlowingEdge }), []);

  // 2. React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 3. Engine State
  const [payload, setPayload] = useState<CanvasJSONPayload>(isDemoMode ? MOCK_PAYLOAD : { blocks: [] });
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<any>(null);
  const [focusedBlock, setFocusedBlock] = useState<Node | null>(null);
  const [isChatMoved, setIsChatMoved] = useState(false);
  const [projectName, setProjectName] = useState("Alpha Project Alpha");

  // Plan doc state — populated by Sarvam after user submits a prompt
  const [planDoc, setPlanDoc] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 4. Fetch blocks from backend when projectId is available
  useEffect(() => {
    if (!projectId || isDemoMode) return;

    const fetchBlocks = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
        const res = await fetch(`${apiUrl}/api/blocks?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const blocks = await res.json();
          if (blocks.length > 0) {
            // Map DB blocks to CanvasBlock format if necessary
            // For now assuming the structure matches or the UI can handle it
            setPayload({ 
              blocks: blocks.map((b: any) => ({
                id: b.id,
                type: b.blockType,
                title: b.blockJson?.title || "Untitled Block",
                stack: b.blockJson?.stack || "Default Stack",
                status: b.blockJson?.status || "idle",
                subBlocks: b.blockJson?.subBlocks || []
              }))
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch blocks:", err);
      }
    };

    fetchBlocks();
    // Optional: Set up polling or WS here
  }, [projectId, isDemoMode, getToken]);

  /**
   * MAIN PROMPT HANDLER
   * Calls Sarvam via /api/plan to generate a rich Architecture Plan Document.
   * Shows preview blocks on canvas immediately, opens the PlanDocPanel.
   */
  const handlePromptSubmit = useCallback(async (msg: string) => {
    setIsChatMoved(true);
    if (setIsChatSidebarOpen) setIsChatSidebarOpen(true);

    // Open the plan panel with loading state immediately
    setIsPlanDocOpen(true);
    setPlanDoc(null);
    setIsPlanning(true);

    if (isDemoMode) {
      // Demo mode: simulate Sarvam response with mock data
      const prompt = msg.toLowerCase();
      let newBlocks: CanvasBlock[] = [];

      if (prompt.includes("auth") || prompt.includes("login")) {
        newBlocks = [
          { id: "blk-clerk", type: "block", title: "Clerk Integration", stack: "Next.js", status: "idle", subBlocks: [{ id: "s1", type: "feat", title: "OAuth Providers" }] },
          { id: "blk-db-users", type: "block", title: "User Schema", stack: "Prisma", status: "idle", subBlocks: [{ id: "s2", type: "feat", title: "Profile Logic" }] }
        ];
      } else if (prompt.includes("payment") || prompt.includes("stripe") || prompt.includes("shop")) {
        newBlocks = [
          { id: "blk-stripe", type: "block", title: "Stripe Gateway", stack: "Node.js", status: "idle", subBlocks: [{ id: "p1", type: "feat", title: "Webhooks" }] },
          { id: "blk-cart", type: "block", title: "Cart Logic", stack: "React Query", status: "idle" },
          { id: "blk-products", type: "block", title: "Product Catalog", stack: "Drizzle", status: "idle" }
        ];
      } else {
        newBlocks = MOCK_PAYLOAD.blocks.slice(0, 4).map(b => ({ ...b, status: "idle" }));
      }

      setTimeout(() => {
        setPlanDoc({
          title: msg.slice(0, 40),
          summary: "This is a demo plan generated by CraftaStudio. Click 'Implement This' to start building.",
          markdown: `## Overview\nDemo architecture for: ${msg}\n\n## Modules\n${newBlocks.map(b => `- **${b.title}** (${b.stack})`).join("\n")}`,
          blocks: newBlocks,
        });
        setPayload({ blocks: newBlocks });
        setIsPlanning(false);
      }, 1200);
      return;
    }

    // Real API mode — call Sarvam via backend
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
      const res = await fetch(`${apiUrl}/api/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: msg, project_name: projectName }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[CanvasTab] Plan API failed:", err);
        setIsPlanning(false);
        return;
      }

      const plan = await res.json();
      setPlanDoc(plan);

      // Show plan blocks on canvas as pending preview
      if (plan.blocks?.length > 0) {
        setPayload({ blocks: plan.blocks.map((b: any) => ({ ...b, status: "idle" })) });
      }
    } catch (err) {
      console.error("[CanvasTab] Failed to generate plan:", err);
    } finally {
      setIsPlanning(false);
    }
  }, [setIsChatSidebarOpen, setIsPlanDocOpen, isDemoMode, projectId, projectName, getToken]);

  /**
   * IMPLEMENT HANDLER
   * Called when user clicks "Implement This" in the PlanDocPanel.
   * Triggers the full agent pipeline via /api/workflow/run.
   */
  const handleImplement = useCallback(async () => {
    if (!planDoc || isImplementing) return;
    setIsImplementing(true);

    if (isDemoMode) {
      // Demo: animate blocks to running then done
      setPayload(prev => ({ blocks: prev.blocks.map(b => ({ ...b, status: "running" })) }));
      setTimeout(() => {
        setPayload(prev => ({ blocks: prev.blocks.map(b => ({ ...b, status: "done" })) }));
        setIsImplementing(false);
      }, 3000);
      return;
    }

    if (!projectId) {
      console.warn("[CanvasTab] Cannot implement — no projectId");
      setIsImplementing(false);
      return;
    }

    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
      const res = await fetch(`${apiUrl}/api/workflow/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, prompt: planDoc.summary || planDoc.title }),
      });

      if (res.ok) {
        // Set blocks to running to show animation
        setPayload(prev => ({ blocks: prev.blocks.map(b => ({ ...b, status: "running" })) }));
        // Poll for completion
        const pollInterval = setInterval(async () => {
          const pollRes = await fetch(`${apiUrl}/api/blocks?projectId=${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pollRes.ok) {
            const blocks = await pollRes.json();
            if (blocks.length > 0) {
              clearInterval(pollInterval);
              setPayload({
                blocks: blocks.map((b: any) => ({
                  id: b.id, type: b.blockType,
                  title: b.blockJson?.title || "Module",
                  stack: b.blockJson?.stack || "",
                  status: b.blockJson?.status || "done",
                  subBlocks: b.blockJson?.subBlocks || [],
                }))
              });
              setIsImplementing(false);
            }
          }
        }, 3000);
        // Fallback: stop polling after 2 minutes
        setTimeout(() => { clearInterval(pollInterval); setIsImplementing(false); }, 120_000);
      }
    } catch (err) {
      console.error("[CanvasTab] Implement failed:", err);
      setIsImplementing(false);
    }
  }, [planDoc, isImplementing, isDemoMode, projectId, getToken]);

  /**
   * CORE TRANSFORMATION: Payload -> Circular Layout -> Nodes/Edges
   */
  const refreshLayout = useCallback(() => {
    // Planner node width is 420px → offset by -210 to center it on the origin
    const PLANNER_OFFSET = { x: -210, y: -80 };
    const { nodes: newNodes, edges: newEdges } = calculateCircularLayout(payload, PLANNER_OFFSET);

    // 2. Hydrate nodes with application-specific callbacks
    const hydratedNodes = newNodes.map(node => {
      if (node.id === "planner") {
        return {
          ...node,
          data: {
            ...node.data,
            projectName,
            onProjectNameChange: setProjectName,
            onPromptSubmit: handlePromptSubmit
          }
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          // Pass interaction handlers down to the Block components
          onInfoClick: (info: any) => setSelectedBlockInfo(info),
          onSubblockClick: (sub: any) => {
            console.log("Sub-block selected:", sub);
            setActiveTab("code");
          }
        }
      };
    });

    setNodes(hydratedNodes);
    setEdges(newEdges);
  }, [payload, projectName, setActiveTab, setEdges, setNodes, handlePromptSubmit]);

  // Handle Payload Changes
  useEffect(() => {
    refreshLayout();
    // Auto-fit view when layout regenerates
    setTimeout(() => fitView({ duration: 800, padding: 0.3 }), 100);
  }, [payload, refreshLayout, fitView]);

  /**
   * ── Edge Highlight Sync ────────────────────────────────────────────────
   * Derives activeNodeId from payload status.
   * When a block has status "running", its ID is set as activeNodeId; all
   * connected edges highlight automatically via context — no state is stored
   * inside the edge data itself.
   *
   * Demo cycling: if no block is explicitly running, we cycle through blocks
   * every 1.8 s to visually demonstrate the flow highlight system.
   */
  useEffect(() => {
    // Clear any existing cycle timer on payload change
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    const runningBlock = payload.blocks.find(b => b.status === "running");

    if (runningBlock) {
      // Explicit running block — activate immediately
      startNode(runningBlock.id);
    } else {
      // No explicit running block — start a demo cycle to showcase the system
      const blockIds = payload.blocks.map(b => b.id);
      if (blockIds.length === 0) { finishNode(); return; }

      let idx = 0;
      const STEP_MS  = 1800; // time each node stays "active"
      const PAUSE_MS = 400;  // brief pause between nodes

      const cycle = () => {
        startNode(blockIds[idx]);
        idx = (idx + 1) % blockIds.length;

        cycleTimerRef.current = setTimeout(() => {
          finishNode();
          cycleTimerRef.current = setTimeout(cycle, PAUSE_MS);
        }, STEP_MS);
      };

      cycle();
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const onNodeClick = (_: any, node: Node) => {
    if (node.type === "block") {
      setFocusedBlock(node);
      // Logic from plan: Pass selected block to settings/inspector
      console.log("Selecting block for inspector:", node.data);
    }
  };

  // Only block render until the component is hydrated on the client.
  // We do NOT block on projectId — if the backend sync hasn't returned yet,
  // we still show the chat UI so the user is never stuck on the loading screen.
  if (!mounted) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--primary-accent)] border-t-transparent animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-mono animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[var(--background)]">
      {payload.blocks.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6">
          <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-[var(--primary-accent)] animate-pulse" />
                <span className="text-xs font-medium text-white/80 tracking-wide uppercase">AI Architect Ready</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-white/50 text-transparent bg-clip-text">
                What are we building today?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Describe your application architecture. Our agents will plan the system and generate the foundational blocks.
              </p>
            </div>
            
            <div className="w-full max-w-xl">
              <PromptInputBox
                className="bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl scale-110"
                onSend={handlePromptSubmit}
              />
            </div>
            
            <div className="flex gap-4 text-sm text-muted-foreground pt-4">
              <button onClick={() => handlePromptSubmit("I need a SaaS boilerplate with Next.js, Clerk Auth, and Stripe subscriptions.")} className="hover:text-foreground transition-colors px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5">
                SaaS Boilerplate
              </button>
              <button onClick={() => handlePromptSubmit("Build a real-time chat application with WebSockets and Redis.")} className="hover:text-foreground transition-colors px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5">
                Real-time Chat
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        className="[&_.react-flow__attribution]:hidden"
      >
        {mounted && (
          <Background
            color="var(--primary-accent)"
            gap={36}
            size={0.8}
            variant={"dots" as any}
            className="opacity-[0.15]"
          />
        )}
        <Controls
          className="
            !border-0 !rounded-2xl !shadow-xl !overflow-hidden
            [&_button]:!border-0 [&_button]:!w-8 [&_button]:!h-8
            [&_button]:!flex [&_button]:!items-center [&_button]:!justify-center
            [&_button]:!transition-colors [&_button]:!duration-150
            [&_button_svg]:!w-4 [&_button_svg]:!h-4
            [&_button_svg]:!fill-[var(--foreground)]
            [&_button]:!bg-[var(--surface)]
            [&_button]:!text-[var(--foreground)]
            [&_button:hover]:!bg-[var(--primary-accent)]/15
            [&_button:hover_svg]:!fill-[var(--primary-accent)]
          "
          showInteractive={false}
        />
      </ReactFlow>
      )}

      {/* Dynamic Overlays Mapping Payload State to UI */}
      <PlanDocPanel
        isOpen={isPlanDocOpen}
        onClose={() => setIsPlanDocOpen(false)}
        planDoc={planDoc}
        isLoading={isPlanning}
        onImplement={handleImplement}
        isImplementing={isImplementing}
      />

      <BlockInfoPanel
        isOpen={!!selectedBlockInfo}
        onClose={() => setSelectedBlockInfo(null)}
        data={selectedBlockInfo}
      />

      {/* Sidebar Chat Box (Animated) */}
      {isChatMoved && (
        <div className={cn(
          "absolute top-0 right-0 w-[420px] h-full z-[40] flex flex-col transition-all duration-500 ease-in-out bg-[var(--surface)]/98 backdrop-blur-2xl border-l border-[var(--border)] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
          isChatSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[var(--primary-accent)] shadow-[0_0_8px_var(--primary-accent)]" />
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em]">Project Stream</span>
            </div>
            <button
              onClick={() => setIsChatSidebarOpen?.(false)}
              className="p-1 hover:bg-[var(--foreground)]/5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
            {/* Dynamic content would render here based on chat history state */}
            <div className="bg-[var(--foreground)]/[0.03] border border-[var(--border)] p-4 rounded-2xl text-xs text-[var(--muted-foreground)] leading-relaxed italic">
              Waiting for architect analysis...
            </div>
          </div>

          <div className="p-6">
            <PromptInputBox
              className="bg-[var(--background)] border-[var(--border)] shadow-xl"
              onSend={handlePromptSubmit}
            />
          </div>
        </div>
      )}

      {/* Focused Block Details */}
      <BlockFocusOverlay
        block={focusedBlock}
        onClose={() => setFocusedBlock(null)}
        onSubblockClick={() => {
          setFocusedBlock(null);
          setActiveTab("code");
        }}
      />
    </div>
  );
}

export function CanvasTab(props: CanvasTabProps) {
  return (
    <EdgeHighlightProvider>
      <ReactFlowProvider>
        <CanvasTabInner {...props} />
      </ReactFlowProvider>
    </EdgeHighlightProvider>
  );
}
