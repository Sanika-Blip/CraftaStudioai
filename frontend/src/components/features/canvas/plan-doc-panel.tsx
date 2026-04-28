"use client";

import React from "react";
import { X, FileText, CheckCircle2, CircleDashed, Loader2, Zap, Edit3, Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(e => console.error("Mermaid error", e));
    }
  }, [chart]);

  return <div ref={ref} className="mermaid-diagram my-4 flex justify-center w-full overflow-auto text-xs" />;
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

export function PlanDocPanel({ isOpen, onClose, planDoc, isLoading, onImplement, isImplementing }: PlanDocPanelProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedMarkdown, setEditedMarkdown] = React.useState("");
  const [validation, setValidation] = React.useState<{valid: boolean, missing: string[]}>({ valid: true, missing: [] });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (planDoc?.markdown && !isEditing) {
      setEditedMarkdown(planDoc.markdown);
    }
  }, [planDoc, isEditing]);

  React.useEffect(() => {
    const doc = editedMarkdown || "";
    const missing: string[] = [];

    if (!doc.includes("## Overview")) missing.push("Overview");
    if (!doc.includes("## Architecture")) missing.push("Architecture");
    if (!doc.includes("## Blocks") && !doc.includes("| Block ID |")) missing.push("Blocks Table");
    if (!doc.includes("## Pages")) missing.push("Pages");
    if (!doc.includes("## Data Models")) missing.push("Data Models");
    if (!doc.includes("## API Endpoints")) missing.push("API Endpoints");
    if (!doc.includes("## Build Order")) missing.push("Build Order");

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

  return (
    <div className={cn(
      "absolute top-0 right-0 h-full w-[450px] border-l border-[var(--border)] bg-[var(--surface)]/98 backdrop-blur-md z-[60] flex flex-col shadow-2xl transition-all duration-300 ease-in-out",
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
        <div className="flex items-center gap-2">
          {planDoc && !planDoc.is_chat && !isLoading && (
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[var(--primary-accent)] hover:bg-[var(--primary-accent)]/10 px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              {isEditing ? (
                <>{isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save</>
              ) : (
                <><Edit3 className="size-3" /> Edit Plan</>
              )}
            </button>
          )}
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ml-2">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-none relative">
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
          <div className="p-4 space-y-6">
            {isEditing ? (
              <textarea
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                className="w-full h-[600px] p-3 text-xs font-mono bg-black/40 border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:border-[var(--primary-accent)] transition-colors resize-none"
              />
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-xs text-[var(--muted-foreground)] prose-headings:text-[var(--foreground)] prose-a:text-[var(--primary-accent)] prose-strong:text-[var(--foreground)] prose-code:text-[var(--primary-accent)] prose-code:bg-[var(--primary-accent)]/10 prose-code:px-1 prose-code:rounded">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (!inline && match && match[1] === "mermaid") {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {editedMarkdown || planDoc.markdown}
                </ReactMarkdown>
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
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          {!validation.valid && (
            <div className="flex items-start gap-2 mb-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold">Plan Incomplete</span>
                <span className="text-[10px] opacity-80">Missing sections: {validation.missing.join(", ")}</span>
              </div>
            </div>
          )}
          <button
            onClick={onImplement}
            disabled={isImplementing || !validation.valid || isEditing}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200",
              isImplementing || !validation.valid || isEditing
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
