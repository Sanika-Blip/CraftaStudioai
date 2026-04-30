"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, CheckCircle2, XCircle, Loader2, ChevronRight,
  Zap, Calendar, Hash, Code2, AlertCircle, RefreshCw
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface BlockOutput {
  id: string;
  blockId: string;
  blockType: string;
  outputCode: string;
  status: "done" | "failed" | "pending" | "running";
  tokensUsed: number;
  errorMsg?: string | null;
  createdAt: string;
}

interface WorkflowRun {
  id: string;
  prompt: string;
  status: "pending" | "running" | "done" | "failed";
  version: number;
  createdAt: string;
  blockOutputs: BlockOutput[];
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  onSelectRun?: (runId: string, blockOutputs: BlockOutput[]) => void;
}

const StatusIcon = ({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) => {
  const cls = size === "lg" ? "size-5" : "size-3.5";
  if (status === "done") return <CheckCircle2 className={cn(cls, "text-emerald-400")} />;
  if (status === "failed") return <XCircle className={cn(cls, "text-red-400")} />;
  if (status === "running") return <Loader2 className={cn(cls, "text-[var(--primary-accent)] animate-spin")} />;
  return <Clock className={cn(cls, "text-white/30")} />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    done: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    failed: "bg-red-500/10 border-red-500/20 text-red-400",
    running: "bg-[var(--primary-accent)]/10 border-[var(--primary-accent)]/20 text-[var(--primary-accent)]",
    pending: "bg-white/5 border-white/10 text-white/30",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-widest uppercase", styles[status] ?? styles.pending)}>
      {status}
    </span>
  );
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function totalTokens(run: WorkflowRun): number {
  return run.blockOutputs.reduce((sum, b) => sum + (b.tokensUsed ?? 0), 0);
}

export function HistoryPanel({ isOpen, onClose, projectId, onSelectRun }: HistoryPanelProps) {
  const { getToken } = useAuth();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
      const res = await fetch(`${apiUrl}/api/workflow/runs?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
      const data = await res.json();
      setRuns(data);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, getToken]);

  useEffect(() => {
    if (isOpen) fetchRuns();
    else {
      setExpandedRun(null);
      setError(null);
    }
  }, [isOpen, fetchRuns]);

  const handleLoadRun = async (run: WorkflowRun) => {
    if (!onSelectRun) return;
    setLoadingRunId(run.id);
    try {
      // If blockOutputs already loaded with code, use them directly
      const hasCode = run.blockOutputs.some(b => b.outputCode?.length > 0);
      if (hasCode) {
        onSelectRun(run.id, run.blockOutputs);
        onClose();
      } else {
        // Fetch full run with code
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
        const res = await fetch(`${apiUrl}/api/workflow/runs/${run.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load run");
        const fullRun: WorkflowRun = await res.json();
        onSelectRun(fullRun.id, fullRun.blockOutputs);
        onClose();
      }
    } catch (err) {
      console.error("[HistoryPanel] Failed to load run:", err);
    } finally {
      setLoadingRunId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[91] w-[440px] flex flex-col bg-[#0d0d12] border-l border-white/[0.06] shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[var(--primary-accent)]/10 border border-[var(--primary-accent)]/20">
                  <Clock className="size-4 text-[var(--primary-accent)]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Run History</h2>
                  <p className="text-[10px] text-white/30 font-mono mt-0.5">
                    {isLoading ? "Loading..." : `${runs.length} run${runs.length !== 1 ? "s" : ""} · your history only`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRuns}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
                  title="Refresh"
                >
                  <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-4 space-y-3">

              {/* Loading state */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="relative">
                    <div className="size-10 rounded-full border-2 border-[var(--primary-accent)]/20 border-t-[var(--primary-accent)] animate-spin" />
                  </div>
                  <p className="text-xs text-white/30 font-mono">Loading your history...</p>
                </div>
              )}

              {/* Error state */}
              {!isLoading && error && (
                <div className="flex flex-col items-center justify-center h-48 gap-3 p-6">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="size-5 text-red-400" />
                  </div>
                  <p className="text-xs text-white/40 text-center">{error}</p>
                  <button
                    onClick={fetchRuns}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !error && runs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-3 p-6">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <Clock className="size-8 text-white/10" />
                  </div>
                  <p className="text-sm font-medium text-white/30 text-center">No runs yet</p>
                  <p className="text-xs text-white/15 text-center max-w-[200px]">
                    Submit a prompt and click Implement This to start generating.
                  </p>
                </div>
              )}

              {/* Run list */}
              {!isLoading && !error && runs.map((run, idx) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                  {/* Run row */}
                  <button
                    className="w-full flex items-start gap-3 p-4 hover:bg-white/[0.03] transition-colors text-left"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      <StatusIcon status={run.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 leading-snug line-clamp-2">
                        {run.prompt}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
                          <Calendar className="size-3" />
                          {timeAgo(run.createdAt)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
                          <Hash className="size-3" />
                          {run.blockOutputs.length} blocks
                        </div>
                        {totalTokens(run) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
                            <Zap className="size-3" />
                            {totalTokens(run).toLocaleString()} tokens
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={run.status} />
                      <ChevronRight
                        className={cn(
                          "size-3.5 text-white/20 transition-transform duration-200",
                          expandedRun === run.id && "rotate-90"
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded block details */}
                  <AnimatePresence>
                    {expandedRun === run.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-2">
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">
                            Generated Blocks — {run.blockOutputs.length}
                          </p>

                          {run.blockOutputs.length === 0 && (
                            <p className="text-[11px] text-white/20 font-mono py-2">No blocks generated yet.</p>
                          )}

                          {run.blockOutputs.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <StatusIcon status={block.status} />
                                <span className="text-[11px] text-white/60 font-mono truncate">{block.blockType}</span>
                                {block.errorMsg && (
                                  <span className="text-[9px] text-red-400/60 truncate max-w-[100px]" title={block.errorMsg}>
                                    {block.errorMsg}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {block.tokensUsed > 0 && (
                                  <span className="text-[9px] text-white/15 font-mono">{block.tokensUsed}t</span>
                                )}
                                <StatusBadge status={block.status} />
                              </div>
                            </div>
                          ))}

                          {/* Load this run button */}
                          {run.status === "done" && run.blockOutputs.some(b => b.status === "done") && (
                            <button
                              onClick={() => handleLoadRun(run)}
                              disabled={loadingRunId === run.id}
                              className="w-full mt-3 py-2.5 rounded-xl bg-[var(--primary-accent)]/10 border border-[var(--primary-accent)]/20 text-[12px] font-semibold text-[var(--primary-accent)] hover:bg-[var(--primary-accent)]/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {loadingRunId === run.id ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Code2 className="size-3.5" />
                                  Load this run into editor
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.04] shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-white/10 font-mono">History is private to your account</p>
              <p className="text-[10px] text-white/10 font-mono">Last {runs.length} runs</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}