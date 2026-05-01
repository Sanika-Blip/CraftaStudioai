"use client";

import React from "react";
import { FileText, CheckCircle2, CircleDashed, Loader2, Zap, Edit3, Save, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      mermaid
        .render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
        .then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        })
        .catch((e) => console.error("Mermaid error", e));
    }
  }, [chart]);

  return (
    <div
      ref={ref}
      className="mermaid-diagram my-4 flex justify-center w-full overflow-auto text-xs"
    />
  );
}

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
    projectId?: string;
  } | null;
  isLoading?: boolean;
  onImplement?: () => void;
  isImplementing?: boolean;
}

const REQUIRED_SECTIONS = [
  "## Overview",
  "## Architecture",
  "## Blocks",
  "## Pages",
  "## Data Models",
  "## API Endpoints",
  "## Build Order",
];

export function PlanDocPanel({
  isOpen,
  onClose,
  planDoc,
  isLoading,
  onImplement,
  isImplementing,
}: PlanDocPanelProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedMarkdown, setEditedMarkdown] = React.useState("");
  const [validation, setValidation] = React.useState<{ valid: boolean; missing: string[] }>({
    valid: true,
    missing: [],
  });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (planDoc?.markdown && !isEditing) {
      setEditedMarkdown(planDoc.markdown);
    }
  }, [planDoc, isEditing]);

  React.useEffect(() => {
    const doc = editedMarkdown || "";
    const missing = REQUIRED_SECTIONS.filter((s) => !doc.includes(s)).map((s) =>
      s.replace("## ", "")
    );
    setValidation({ valid: missing.length === 0, missing });
  }, [editedMarkdown]);

  const handleSave = async () => {
    if (!planDoc?.projectId) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${planDoc.projectId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedMarkdown }),
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save plan", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Block summary strip
  const blockSummary = planDoc?.blocks ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsEditing(false); onClose(); } }}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
          "sm:max-w-2xl sm:max-h-[min(720px,90vh)] sm:rounded-2xl shadow-2xl",
          // override default z-index to match app
          "z-[200]"
        )}
      >
        <ScrollArea className="flex max-h-full flex-col">
          {/* ── Header ── */}
          <DialogHeader className="contents space-y-0 text-left">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
              <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-[var(--foreground)]">
                <div className="size-7 rounded-lg bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 flex items-center justify-center">
                  <FileText className="size-3.5 text-[var(--primary-accent)]" />
                </div>
                {isLoading ? "Generating Plan..." : planDoc?.title || "Architecture Plan"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {planDoc?.summary || "Review the generated architecture plan and click Implement This to generate code."}
              </DialogDescription>

              <div className="flex items-center gap-2">
                {planDoc && !isLoading && blockSummary.length > 0 && (
                  <button
                    onClick={() => { onImplement?.(); onClose(); }}
                    disabled={isImplementing || !validation.valid || isEditing}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all duration-200",
                      isImplementing || !validation.valid || isEditing
                        ? "bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]/60 cursor-not-allowed"
                        : "bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-[0.98]"
                    )}
                  >
                    {isImplementing ? (
                      <><Loader2 className="size-3 animate-spin" /> Implementing...</>
                    ) : (
                      <><Zap className="size-3" /> Implement This</>
                    )}
                  </button>
                )}
                {planDoc && !planDoc.is_chat && !isLoading && (
                  <button
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--primary-accent)] hover:bg-[var(--primary-accent)]/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isEditing ? (
                      <>{isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save</>
                    ) : (
                      <><Edit3 className="size-3" /> Edit</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* ── Body ── */}
          <div className="flex-1 overflow-hidden">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-48 gap-4 p-8">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-accent)]/20 border-t-[var(--primary-accent)] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary-accent)] animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">AI is designing your system...</p>
                  <p className="text-xs text-[var(--muted-foreground)] font-mono animate-pulse">Sarvam is thinking</p>
                </div>
              </div>
            )}

            {/* Block strip */}
            {!isLoading && blockSummary.length > 0 && (
              <div className="px-6 py-3 border-b border-[var(--border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {blockSummary.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--foreground)]/[0.03] text-[11px] font-medium text-[var(--muted-foreground)]"
                    >
                      {b.status === "done" ? (
                        <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                      ) : (
                        <CircleDashed className="size-3 text-[var(--primary-accent)]/60 shrink-0" />
                      )}
                      {b.title}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { onImplement?.(); onClose(); }}
                  disabled={isImplementing || !validation.valid || isEditing}
                  className={cn(
                    "flex items-center gap-2 self-start rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200",
                    isImplementing || !validation.valid || isEditing
                      ? "bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]/60 cursor-not-allowed"
                      : "bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-[0.98]"
                  )}
                >
                  {isImplementing ? (
                    <><Loader2 className="size-4 animate-spin" /> Implementing...</>
                  ) : (
                    <><Zap className="size-4" /> Implement This</>
                  )}
                </button>
              </div>
            )}

            {/* Markdown / Edit area */}
            {!isLoading && planDoc && (
              <div className="px-6 py-5">
                {isEditing ? (
                  <textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="w-full h-72 p-3 text-xs font-mono bg-black/40 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary-accent)] transition-colors resize-none"
                    placeholder="Edit your architecture plan markdown..."
                  />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-xs text-[var(--muted-foreground)] prose-headings:text-[var(--foreground)] prose-headings:font-semibold prose-a:text-[var(--primary-accent)] prose-strong:text-[var(--foreground)] prose-code:text-[var(--primary-accent)] prose-code:bg-[var(--primary-accent)]/10 prose-code:px-1 prose-code:rounded prose-table:text-[10px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          if (!inline && match && match[1] === "mermaid") {
                            return (
                              <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {editedMarkdown || planDoc.markdown}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !planDoc && (
              <div className="flex flex-col items-center justify-center h-48 p-8 text-center gap-3">
                <FileText className="size-8 text-[var(--muted-foreground)]/30" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  Submit a prompt to generate your architecture plan
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        {planDoc && !isLoading && blockSummary.length > 0 && (
          <DialogFooter className="px-6 pb-6 pt-4 border-t border-[var(--border)] sm:justify-between gap-3 flex-row">
            {/* Validation warning */}
            {!validation.valid && (
              <div className="flex items-center gap-2 text-amber-400 text-xs">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Missing: {validation.missing.join(", ")}</span>
              </div>
            )}
            {validation.valid && (
              <p className="text-[11px] text-[var(--muted-foreground)] self-center">
                {blockSummary.length} block{blockSummary.length !== 1 ? "s" : ""} ready to generate
              </p>
            )}

            <button
              onClick={() => { onImplement?.(); onClose(); }}
              disabled={isImplementing || !validation.valid || isEditing}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shrink-0",
                isImplementing || !validation.valid || isEditing
                  ? "bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]/60 cursor-not-allowed"
                  : "bg-[var(--primary-accent)] text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[var(--primary-accent)]/30"
              )}
            >
              {isImplementing ? (
                <><Loader2 className="size-4 animate-spin" /> Implementing...</>
              ) : (
                <><Zap className="size-4" /> Implement This</>
              )}
            </button>
          </DialogFooter>
        )}
        {!isLoading && planDoc && blockSummary.length === 0 && (
          <div className="px-6 pb-6 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
            No structured blocks were parsed from this plan yet. Please review the plan content or regenerate it with a ## Blocks table.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
