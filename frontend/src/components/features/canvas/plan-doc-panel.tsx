"use client";

import { X, FileText, CheckCircle2, CircleDashed, Loader2, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBlock {
  id: string;
  title: string;
  type: string;
  stack: string;
  description?: string;
  status: string;
  subBlocks?: { id: string; type: string; title: string; status: string }[];
}

interface PlanDocPanelProps {
  isOpen: boolean;
  onClose: () => void;
  planDoc?: {
    title: string;
    summary: string;
    markdown: string;
    blocks: PlanBlock[];
    is_chat?: boolean;
  } | null;
  isLoading?: boolean;
  onImplement?: () => void;
  isImplementing?: boolean;
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-xs leading-relaxed text-[var(--muted-foreground)] space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-widest mt-4 mb-1 border-b border-[var(--border)] pb-1">
              {line.replace("## ", "")}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="text-[10px] font-semibold text-[var(--primary-accent)] mt-3 mb-0.5">
              {line.replace("### ", "")}
            </h4>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <ChevronRight className="size-3 mt-0.5 shrink-0 text-[var(--primary-accent)]/60" />
              <span>{line.replace(/^[-*] /, "")}</span>
            </div>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-[var(--foreground)]">{line.replace(/\*\*/g, "")}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export function PlanDocPanel({ isOpen, onClose, planDoc, isLoading, onImplement, isImplementing }: PlanDocPanelProps) {
  return (
    <div className={cn(
      "absolute top-0 right-0 h-full w-[320px] border-l border-[var(--border)] bg-[var(--surface)]/98 backdrop-blur-md z-[60] flex flex-col shadow-2xl transition-all duration-300 ease-in-out",
      isOpen ? "translate-x-0 opacity-100 visible" : "translate-x-full opacity-0 invisible"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[var(--primary-accent)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">
            {planDoc?.title || "Architecture Plan"}
          </span>
        </div>
        <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary-accent)]/20 border-t-[var(--primary-accent)] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[var(--primary-accent)] animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] font-mono animate-pulse text-center">
              Sarvam is thinking...
            </p>
          </div>
        )}

        {!isLoading && planDoc && (
          <div className="p-4 space-y-4">
            {/* Summary */}
            {planDoc.summary && (
              <div className="p-3 rounded-xl bg-[var(--primary-accent)]/5 border border-[var(--primary-accent)]/10">
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{planDoc.summary}</p>
              </div>
            )}

            {/* Blocks */}
            {planDoc.blocks.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                  {planDoc.blocks.length} Modules Planned
                </p>
                <div className="flex flex-col gap-1.5">
                  {planDoc.blocks.map((block, i) => (
                    <div key={`${block.id}-${i}`} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors group border border-transparent hover:border-[var(--border)]">
                      <div className="mt-0.5">
                        {block.status === "done" && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                        {block.status === "running" && <Loader2 className="size-3.5 text-[var(--primary-accent)] animate-spin" />}
                        {block.status === "idle" && <CircleDashed className="size-3.5 text-[var(--muted-foreground)]" />}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-[11px] font-semibold text-[var(--foreground)] truncate">{block.title}</span>
                        <span className="text-[9px] font-mono text-[var(--primary-accent)]/70 truncate">{block.stack}</span>
                        {block.description && (
                          <span className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">{block.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown content */}
            {planDoc.markdown && (
              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                  {planDoc.is_chat ? "Assistant Response" : "Full Plan"}
                </p>
                <MarkdownRenderer content={planDoc.markdown} />
              </div>
            )}
          </div>
        )}

        {!isLoading && !planDoc && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
            <FileText className="size-8 text-[var(--muted-foreground)]/30" />
            <p className="text-xs text-[var(--muted-foreground)]">Submit a prompt to generate your architecture plan</p>
          </div>
        )}
      </div>

      {/* Footer — Implement button */}
      {planDoc && !planDoc.is_chat && !isLoading && (
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={onImplement}
            disabled={isImplementing}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200",
              isImplementing
                ? "bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]/60 cursor-not-allowed"
                : "bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[var(--primary-accent)]/20"
            )}
          >
            {isImplementing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Implementing...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Implement This
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
