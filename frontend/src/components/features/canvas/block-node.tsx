import { Handle, Position } from "@xyflow/react";
import { RefreshCw, MessageSquare, ArrowUp, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BlockNodeProps {
  data: {
    id: string;
    title: string;
    stack: string;
    status: "idle" | "running" | "done" | "overflow";
    files: string[];
    onInfoClick?: (data: any) => void;
    isSubblock?: boolean;
    parentId?: string;
  };
}

export function BlockNode({ data }: BlockNodeProps) {
  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isRunning = data.status === "running";
  const isDone = data.status === "done";

  const handleSend = () => {
    if (!input.trim()) return;
    console.log(`Block Chat (${data.id}):`, input);
    setInput("");
  };

  return (
    <div className={cn("group relative transition-all duration-500", data.isSubblock ? "w-[220px]" : "w-[280px]")}>
      <Handle type="target" position={Position.Left} id="left-in" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Top} id="top-in" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Right} id="right-in" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Bottom} id="bottom-in" className="!opacity-0 !w-0 !h-0 !border-none" />

      {/* Hover Actions */}
      <div className="absolute -top-10 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-md p-1 shadow-lg z-10 pointer-events-none group-hover:pointer-events-auto before:absolute before:inset-x-0 before:-bottom-4 before:h-4 before:content-['']">
        <button 
          className="p-1.5 hover:bg-[var(--muted)] rounded-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
          title="Regenerate"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Regenerating...");
          }}
        >
          <RefreshCw className="size-3" />
        </button>
        <button 
          className={cn(
            "p-1.5 rounded-sm transition-colors",
            isChatOpen ? "bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )} 
          onClick={(e) => {
            e.stopPropagation();
            setIsChatOpen(!isChatOpen);
          }}
          title="Toggle Chat"
        >
          <MessageSquare className="size-3" />
        </button>
        <button 
          className="p-1.5 hover:bg-[var(--muted)] rounded-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
          title="Intelligence"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onInfoClick) data.onInfoClick(data);
          }}
        >
          <Info className="size-3" />
        </button>
      </div>

      {/* Main Card */}
      <div 
        className={cn(
          "surface-card flex flex-col overflow-hidden transition-all duration-300",
          isRunning ? "border-l-2 border-l-[var(--agent-running)] shadow-sm" : "border-l-2 border-l-transparent",
          "hover:border-[var(--primary-accent)]/80"
        )}
      >
        <div className="p-3 border-b border-[var(--border)] flex flex-col items-center justify-center gap-1 bg-[var(--muted)]/30 text-center relative">
          <span className="text-[10px] font-mono text-[var(--muted-foreground)] tracking-wider">{data.id}</span>
          {isRunning && <div className="size-2 rounded-full bg-[var(--agent-running)] animate-pulse-fast absolute top-3 right-3" />}
          {isDone && <div className="size-2 rounded-full bg-[var(--agent-idle)] absolute top-3 right-3" />}
          
          <span className="font-bold text-sm text-[var(--foreground)] leading-tight mt-2">{data.title}</span>
          <span className="text-[10px] text-[var(--primary-accent)] font-medium mt-0.5">{data.stack}</span>
        </div>
        
        {/* Files Section (Conditional or always visible) */}
        {!isChatOpen && !data.isSubblock && data.files && data.files.length > 0 && (
          <div className="p-3 bg-[var(--muted)]/40 border-b border-[var(--border)] animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-col items-center gap-1.5">
              {data.files.map((file) => (
                <span key={file} className="text-[10px] font-mono text-[var(--muted-foreground)] truncate flex items-center justify-center gap-1.5" title={file}>
                  <span className="text-[var(--primary-accent)] font-bold">•</span>
                  {file.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Input Section */}
        {isChatOpen && (
          <div className="p-2.5 bg-[var(--surface)] flex items-center gap-2 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] focus-within:border-[var(--primary-accent)]/50 transition-colors">
              <input 
                autoFocus
                type="text" 
                placeholder="Refine this block..."
                className="bg-transparent text-[11px] w-full focus:outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                value={input}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend();
                }}
                className={cn(
                  "p-1 rounded-md transition-all",
                  input.trim() ? "text-[var(--primary-accent)] hover:bg-[var(--primary-accent)]/10" : "text-[var(--muted-foreground)] opacity-50"
                )}
              >
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Left} id="left-out" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Right} id="right-out" className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className="!opacity-0 !w-0 !h-0 !border-none" />
    </div>
  );
}
