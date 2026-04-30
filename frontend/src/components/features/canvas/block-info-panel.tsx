import { X, Info, FileCode, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    title: string;
    stack: string;
    status: string;
    files: string[];
  } | null;
}

export function BlockInfoPanel({ isOpen, onClose, data }: BlockInfoPanelProps) {
  if (!data && isOpen) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 h-full w-[320px] border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md z-[100] flex flex-col shadow-2xl transition-all duration-300 ease-in-out",
      isOpen ? "translate-x-0 opacity-100 visible" : "-translate-x-full opacity-0 invisible"
    )}>
      <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="bg-[var(--primary-accent)]/10 p-1.5 rounded-lg border border-[var(--primary-accent)]/20">
            <Info className="size-4 text-[var(--primary-accent)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[var(--foreground)] tracking-wide uppercase">Block Intelligence</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{data?.id}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {/* Title Section */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight">{data?.title}</h2>
          <div className="flex items-center gap-2">
            <Activity className="size-3 text-[var(--primary-accent)]" />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              data?.status === "running" ? "text-[var(--agent-running)]" : "text-[var(--agent-idle)]"
            )}>
              {data?.status}
            </span>
          </div>
        </section>

        {/* Stack Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-[0.1em] text-[10px] font-bold">
            <Layers className="size-3" />
            <span>Technology Stack</span>
          </div>
          <div className="bg-[var(--muted)]/50 border border-[var(--border)] rounded-lg p-3">
            <span className="text-sm font-medium text-[var(--primary-accent)]">{data?.stack}</span>
          </div>
        </section>

        {/* Files Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] uppercase tracking-[0.1em] text-[10px] font-bold">
            <FileCode className="size-3" />
            <span>Associated Files</span>
          </div>
          <div className="flex flex-col gap-2">
            {data?.files.map((file) => (
              <div key={file} className="group/file flex items-center justify-between p-2.5 rounded-lg bg-[var(--muted)]/30 border border-transparent hover:border-[var(--border)] hover:bg-[var(--muted)]/50 transition-all cursor-pointer">
                <span className="text-[11px] font-mono text-[var(--foreground)]/80 group-hover/file:text-[var(--foreground)]">{file}</span>
                <span className="text-[9px] text-[var(--muted-foreground)] group-hover/file:text-[var(--primary-accent)] transition-colors">Open</span>
              </div>
            ))}
          </div>
        </section>

        {/* AI Analysis Mock */}
        <section className="p-4 rounded-xl bg-[var(--primary-accent)]/[0.03] border border-[var(--primary-accent)]/10">
          <p className="text-[11px] text-[var(--muted-foreground)] italic leading-relaxed">
            This block currently implements the core {data?.title} logic using {data?.stack}. Recent refinements focus on performance optimization and type safety.
          </p>
        </section>
      </div>

      <div className="p-6 border-t border-[var(--border)] bg-[var(--muted)]/50 mt-auto">
        <button className="w-full py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] transition-all shadow-sm">
          Generate Block Specs
        </button>
      </div>
    </div>
  );
}
