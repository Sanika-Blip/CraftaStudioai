import { Handle, Position } from "@xyflow/react";
import { Hexagon, Edit2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";

export function PlannerNode({ data }: { data: any }) {
  const [mode, setMode] = useState<"fast" | "plan">("plan");

  const handleSend = (message: string) => {
    if (data?.onPromptSubmit) {
      data.onPromptSubmit(message, mode);
    }
  };

  const isChatMoved = data?.isChatMoved;

  return (
    <div className={cn(
      "bg-transparent flex flex-col p-2 gap-3 relative group transition-all duration-500",
      isChatMoved ? "w-[300px]" : "w-[420px]"
    )}>
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-[var(--primary-accent)]/[0.05] rounded-3xl -z-10 border border-[var(--primary-accent)]/[0.15] shadow-[0_0_60px_rgba(139,92,246,0.2)]" />
      
      {/* Handles to connect in all directions - Enabling side-by-side growth */}
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Left} id="left" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Top} id="top" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0 !w-0 !h-0 !border-none" />

      {/* Header & Mode Toggles (Hidden when chat moved) */}
      {!isChatMoved && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-[var(--primary-accent)] p-1 rounded-lg border border-black/5 shadow-sm">
              <Hexagon className="size-3.5 text-black fill-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[10px] text-[var(--foreground)] tracking-[0.1em] uppercase">Planner Engine</span>
            </div>
          </div>

          {/* FAST/PLAN Selector */}
          <div className="flex items-center bg-[var(--surface)]/80 backdrop-blur-sm rounded-lg p-0.5 border border-[var(--border)] shadow-sm">
            <button
              onClick={() => setMode("fast")}
              className={cn(
                "px-3 py-1 text-[9px] font-bold rounded-md transition-all",
                mode === "fast" ? "bg-[var(--primary-accent)] text-black" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              FAST
            </button>
            <button
              onClick={() => setMode("plan")}
              className={cn(
                "px-3 py-1 text-[9px] font-bold rounded-md transition-all",
                mode === "plan" ? "bg-[var(--primary-accent)] text-black" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              PLAN
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isChatMoved ? (
        <div className="flex flex-col items-center justify-center p-4 bg-transparent group/title">
          <div className="flex items-center justify-center w-full relative">
            <input 
              value={data?.projectName || "Untitled Project"}
              onChange={(e) => data?.onProjectNameChange?.(e.target.value)}
              className="w-full text-center bg-transparent border-none focus:outline-none text-3xl font-bold text-[var(--foreground)] tracking-tight uppercase uppercase font-mono"
            />
            <Edit2 className="size-4 text-[var(--muted-foreground)] absolute -right-6 opacity-0 group-hover/title:opacity-100 transition-opacity" />
          </div>
          <span className="text-[12px] font-mono text-[var(--primary-accent)] mt-2 opacity-80 uppercase tracking-widest">Core Module</span>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <PromptInputBox 
            className="shadow-2xl ring-1 ring-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md"
            onSend={handleSend}
            value={data?.command}
          />
        </div>
      )}
    </div>
  );
}
