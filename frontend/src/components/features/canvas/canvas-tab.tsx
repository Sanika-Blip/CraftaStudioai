"use client";

import { useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
import "@xyflow/react/dist/style.css";

import { PlannerNode } from "@/components/features/canvas/planner-node";
import { BlockNode } from "@/components/features/canvas/block-node";
import { PlanDocPanel } from "@/components/features/canvas/plan-doc-panel";
import { PremiumPlan } from "@/components/ui/premium-plan";
import { BlockInfoPanel } from "@/components/features/canvas/block-info-panel";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { BlockFocusOverlay } from "@/components/features/canvas/block-focus-overlay";

interface CanvasTabProps {
  isPlanDocOpen: boolean;
  setIsPlanDocOpen: (open: boolean) => void;
  isPlanMode: boolean;
  setActiveTab: (tab: "canvas" | "code" | "preview") => void;
  isPlanGenerated: boolean;
  setIsPlanGenerated: (gen: boolean) => void;
  isChatSidebarOpen?: boolean;
  setIsChatSidebarOpen?: (open: boolean) => void;
}

// Initial set of nodes organized around a central hub
const initialNodes: Node[] = [
  {
    id: "planner",
    type: "planner",
    position: { x: -210, y: -75 }, // Centered based on its 420px width
    data: {},
    draggable: true,
  },
  {
    id: "blk-auth",
    type: "block",
    position: { x: -650, y: -50 },
    data: {
      id: "BLK-AUTH-01",
      title: "CLERK AUTH",
      stack: "NEXT.JS + CLERK",
      status: "done",
      files: ["MIDDLEWARE.TS", "SIGN-IN/PAGE.TSX"],
    },
  },
  {
    id: "blk-db",
    type: "block",
    position: { x: -210, y: -450 },
    data: {
      id: "BLK-DB-02",
      title: "PRISMA SCHEMA",
      stack: "POSTGRES + PRISMA",
      status: "running",
      files: ["SCHEMA.PRISMA", "LIB/DB.TS"],
    },
  },
  {
    id: "blk-ui",
    type: "block",
    position: { x: 250, y: -50 },
    data: {
      id: "BLK-UI-03",
      title: "DASHBOARD LAYOUT",
      stack: "TAILWIND + RADIX",
      status: "idle",
      files: ["LAYOUT.TSX", "PAGE.TSX"],
    },
  },
];

const initialEdges: Edge[] = [
  { 
    id: "e1", 
    source: "planner", 
    target: "blk-auth", 
    sourceHandle: "left",
    targetHandle: "right-in",
    animated: false,
    type: "default",
  },
  { 
    id: "e2", 
    source: "planner", 
    target: "blk-db", 
    sourceHandle: "top",
    targetHandle: "bottom-in",
    animated: false,
    type: "default",
  },
  { 
    id: "e3", 
    source: "planner", 
    target: "blk-ui", 
    sourceHandle: "right",
    targetHandle: "left-in",
    animated: false,
    type: "default",
  },
];

function CanvasTabInner({ 
  isPlanDocOpen, 
  setIsPlanDocOpen, 
  isPlanMode, 
  setActiveTab,
  isPlanGenerated,
  setIsPlanGenerated,
  isChatSidebarOpen,
  setIsChatSidebarOpen
}: CanvasTabProps) {
  const { theme } = useTheme();
  const { fitView, setCenter } = useReactFlow();
  const nodeTypes = useMemo(() => ({ planner: PlannerNode, block: BlockNode }), []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [mounted, setMounted] = useState(false);
  const [showPremiumPlan, setShowPremiumPlan] = useState(false);
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<any>(null);
  const [isChatMoved, setIsChatMoved] = useState(false);
  const [projectName, setProjectName] = useState("CraftaStudio Default");
  const [sidebarPromptValue, setSidebarPromptValue] = useState("");
  const [focusedBlock, setFocusedBlock] = useState<Node | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update data for planner node to include the callback
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === "planner") {
          return { 
            ...node, 
            data: { 
              ...node.data,
              isChatMoved,
              projectName,
              onProjectNameChange: setProjectName,
              onPromptSubmit: (message: string, mode: "fast" | "plan") => {
                setIsChatMoved(true);
                if (setIsChatSidebarOpen) setIsChatSidebarOpen(true);
                setSidebarPromptValue(""); // Clear it when moved? Or keep the prompt? Let's just keep it moving
                if (mode === "plan") {
                  setShowPremiumPlan(true);
                } else {
                  // Simulate blocks generating
                  console.log("Fast mode: Generating blocks...");
                }
              }
            } 
          };
        }
        if (node.type === "block") {
          return {
            ...node,
            data: {
              ...node.data,
              onInfoClick: (info: any) => setSelectedBlockInfo(info)
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Update the planner node data whenever isChatMoved or projectName change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === "planner") {
          return { ...n, data: { ...n.data, isChatMoved, projectName } };
        }
        return n;
      })
    );
  }, [isChatMoved, projectName, setNodes]);

  // Force center on planner whenever this component mounts (when tab changes)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ nodes: [{ id: 'planner' }], padding: 0.5, duration: 400 });
    }, 100);
    return () => clearTimeout(timeout);
  }, [fitView]);

  const onNodeClick = (_: any, node: Node) => {
    if (node.type === "block" && !node.data.isSubblock) {
      // Enter focus mode
      setFocusedBlock(node);
    } else if (node.type === "block" && node.data.isSubblock) {
      // When subblock is clicked, open code Editor.
      // E.g., open code tab with this component
      setActiveTab("code");
    }
  };

  const handlePlanAction = (action: string) => {
    if (action === "Implement plan") {
      setIsPlanGenerated(true);
    }
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === "planner") {
          return { ...node, data: { ...node.data, command: action } };
        }
        return node;
      })
    );
  };

  return (
    <div className="w-full h-full relative bg-dot-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="[&_.react-flow__attribution]:hidden" 
      >
        {mounted && (
          <Background color="var(--primary-accent)" gap={24} size={1} variant={"dots" as any} className="opacity-[0.25]" />
        )}
        <Controls 
          className="!bg-[var(--surface)] !border-[var(--border)] !p-0.5 !rounded-xl !shadow-lg [&_button]:!border-none [&_button]:!bg-transparent [&_button]:!text-[var(--foreground)] [&_button:hover]:!bg-[var(--primary-accent)]/10 [&_svg]:!fill-current" 
          showInteractive={false} 
        >
           <button 
            type="button" 
            className="react-flow__controls-button flex items-center justify-center !w-7 !h-7 hover:!bg-[var(--primary-accent)]/10 transition-colors"
            title="Lock Viewport"
            onClick={() => console.log('Viewport Locked')}
          >
            <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </button>
        </Controls>
      </ReactFlow>

      {/* Overlays */}
      <PlanDocPanel isOpen={isPlanDocOpen} onClose={() => setIsPlanDocOpen(false)} />
      
      <PremiumPlan 
        isOpen={showPremiumPlan} 
        onClose={() => setShowPremiumPlan(false)} 
        onAction={handlePlanAction}
        title="PlacePro Coordinator Module Plan"
        summary="Add a new Coordinator section to the existing admin sidebar and bring over the full coordinator bundle behavior into PlacePro while keeping the current admin UI design system intact."
        items={[
          "coordinator roster CRUD",
          "attendance letter preview/download",
          "coordinator application form builder",
          "public coordinator application form",
          "admin response review workflow"
        ]}
      />

      <BlockInfoPanel 
        isOpen={!!selectedBlockInfo} 
        onClose={() => setSelectedBlockInfo(null)} 
        data={selectedBlockInfo}
      />

      {/* Sidebar Chat Box */}
      {(isChatMoved && (isChatSidebarOpen !== false)) && (
        <div className="absolute top-0 right-0 w-[420px] h-full z-[40] bg-[#1a1a1a]/95 backdrop-blur-xl border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
            <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Project Architect</span>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors" title="Chat History">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors" title="New Chat">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>
          </div>

          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col">
            <div className="flex flex-col gap-2 self-end max-w-[85%]">
               <div className="bg-[#2a2a2a] text-white/90 text-sm p-4 rounded-2xl rounded-tr-sm border border-white/5">
                 Add a new Coordinator section to the existing admin sidebar and bring over the full coordinator bundle behavior into PlacePro.
               </div>
               <span className="text-[10px] text-white/30 text-right px-1">You • 2:14 PM</span>
            </div>
            
            <div className="flex flex-col gap-2 self-start max-w-[90%]">
               <div className="flex items-center gap-2 mb-1 px-1">
                 <div className="size-5 rounded-md bg-[var(--primary-accent)]/20 text-[var(--primary-accent)] flex items-center justify-center border border-[var(--primary-accent)]/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                 </div>
                 <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Craftastudio.AI</span>
               </div>
               <div className="bg-transparent text-white/80 text-sm p-0 rounded-2xl">
                 I've laid out the foundation for the Coordinator Module. I added the database schema blocks for the forms and rosters, and the frontend layout for the admin sidebar.
                 <br/><br/>
                 Would you like me to start implementing the "Attendance Letter" generation feature first, or would you prefer I build the "Application Form Builder" UI?
               </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1a1a1a] border-t border-white/5 shrink-0">
            <PromptInputBox 
              className="w-full bg-[#222] border-white/10 text-white shadow-none"
              onSend={(msg) => {
                console.log("Sidebar chat message:", msg);
                // Handle ongoing generation conversational logic here
              }}
              value={sidebarPromptValue}
            />
          </div>
        </div>
      )}

      {/* Focused Block Subblock View */}
      <BlockFocusOverlay 
        block={focusedBlock} 
        onClose={() => setFocusedBlock(null)} 
        onSubblockClick={(subNode) => {
          setFocusedBlock(null);
          setActiveTab("code");
        }}
      />
    </div>
  );
}

export function CanvasTab(props: CanvasTabProps) {
  return (
    <ReactFlowProvider>
      <CanvasTabInner {...props} />
    </ReactFlowProvider>
  );
}
