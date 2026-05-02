"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, CheckCircle2, XCircle, Loader2, ChevronRight,
  Zap, Calendar, Hash, Code2, AlertCircle, RefreshCw
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

// ✅ Import shared type
import { BlockOutput as BaseBlockOutput } from "@/types/block";

// ✅ Extend it (fixes your error)
interface BlockOutput extends BaseBlockOutput {
  id: string;
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
      const hasCode = run.blockOutputs.some(b => b.outputCode?.length > 0);
      if (hasCode) {
        onSelectRun(run.id, run.blockOutputs);
        onClose();
      } else {
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
          <motion.div
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[91] w-[440px] flex flex-col bg-[#0d0d12] border-l border-white/[0.06]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Run History</h2>
              <button onClick={onClose}><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="border p-3 rounded-lg">
                  <p className="text-xs text-white">{run.prompt}</p>

                  <button
                    onClick={() => handleLoadRun(run)}
                    className="mt-2 text-xs text-blue-400"
                  >
                    Load Run
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}