import { X, FileText, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanDocPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanDocPanel({ isOpen, onClose }: PlanDocPanelProps) {
  const blocks = [
    { id: "BLK-AUTH-01", name: "Clerk Auth", status: "done" },
    { id: "BLK-DB-02", name: "Prisma Schema", status: "running" },
    { id: "BLK-UI-03", name: "Dashboard Layout", status: "idle" },
    { id: "BLK-API-04", name: "User Endpoints", status: "idle" },
  ];

  return (
    <div className={cn(
      "absolute top-0 right-0 h-full w-[260px] border-l border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md z-[50] flex flex-col shadow-2xl transition-all duration-300 ease-in-out",
      isOpen ? "translate-x-0 opacity-100 visible" : "translate-x-full opacity-0 invisible"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[var(--primary-accent)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">Generation Plan</span>
        </div>
        <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <div key={block.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--muted)] transition-colors group">
              <div className="mt-0.5">
                {block.status === "done" && <CheckCircle2 className="size-4 text-[var(--agent-idle)]" />}
                {block.status === "running" && <Loader2 className="size-4 text-[var(--agent-running)] animate-spin-slow" />}
                {block.status === "idle" && <CircleDashed className="size-4 text-[var(--muted-foreground)]" />}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">{block.id}</span>
                <span className={cn(
                  "text-xs font-medium truncate", 
                  block.status === "running" ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                )}>
                  {block.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/50">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--muted-foreground)]">Est. Context</span>
          <span className="font-mono text-[var(--primary-accent)] font-medium">32,500 tk</span>
        </div>
      </div>
    </div>
  );
}
