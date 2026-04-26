"use client";

import { Handle, Position } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, MessageSquare, ArrowUp, Info, ChevronRight, Code2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CanvasBlock, CanvasSubBlock } from "@/types/canvas";

interface BlockNodeProps {
  data: CanvasBlock & {
    onInfoClick?: (data: any) => void;
    onSubblockClick?: (sub: CanvasSubBlock) => void;
    onViewCode?: (data: CanvasBlock) => void;
    runId?: string | null;
  };
  selected?: boolean;
}

const STATUS_CONFIG = {
  idle:    { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  pulse: false, label: "IDLE"    },
  running: { color: "#10b981", glow: "rgba(16,185,129,0.6)",  pulse: true,  label: "RUNNING" },
  done:    { color: "#8b5cf6", glow: "rgba(139,92,246,0.5)",  pulse: false, label: "DONE"    },
  success: { color: "#22c55e", glow: "rgba(34,197,94,0.5)",   pulse: false, label: "SUCCESS" },
  error:   { color: "#ef4444", glow: "rgba(239,68,68,0.6)",   pulse: true,  label: "ERROR"   },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;
  return (
    <div className="relative flex items-center justify-center">
      {cfg.pulse && (
        <motion.div
          className="absolute rounded-full"
          style={{ backgroundColor: cfg.color, width: 14, height: 14 }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div
        className="relative size-2.5 rounded-full"
        style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.glow}, 0 0 16px ${cfg.glow}` }}
      />
    </div>
  );
}

export function BlockNode({ data, selected }: BlockNodeProps) {
  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const status = data.status ?? "idle";
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;

  const handleSend = () => {
    if (!input.trim()) return;
    console.log(`Block Chat (${data.id}):`, input);
    setInput("");
  };

  return (
    <motion.div
      className="relative"
      style={{ width: 280 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{ scale: isHovered ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Invisible Handles */}
      <Handle type="target" position={Position.Left}   id="left-in"   className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Top}    id="top-in"    className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Right}  id="right-in"  className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="target" position={Position.Bottom} id="bottom-in" className="!opacity-0 !w-0 !h-0 !border-none" />

      {/* Selected ring */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute -inset-[3px] rounded-[18px] pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${statusCfg.color}30, var(--primary-accent, #7c3aed)30)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Hover Toolbar */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-11 left-0 flex items-center gap-1 z-20"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl backdrop-blur-md">
              {[
                { Icon: RefreshCw, title: "Regenerate", onClick: () => console.log("Regenerating..."), show: true },
                { Icon: MessageSquare, title: "Chat", onClick: () => setIsChatOpen(!isChatOpen), active: isChatOpen, show: true },
                { Icon: Info, title: "Inspector", onClick: () => data.onInfoClick?.(data), show: true },
                { Icon: Code2, title: "View Code", onClick: () => data.onViewCode?.(data), show: status === "done" },
              ].filter(t => t.show).map(({ Icon, title, onClick, active }) => (
                <button
                  key={title}
                  title={title}
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    active
                      ? "bg-[var(--primary-accent)] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <div
        className={cn(
          "relative rounded-[16px] overflow-hidden transition-all duration-300",
          "bg-[var(--surface)] border",
          selected
            ? "shadow-[0_0_0_2px_var(--primary-accent)]"
            : isHovered
              ? "shadow-lg"
              : "shadow-md",
          selected
            ? "border-[var(--primary-accent)]/50"
            : isHovered
              ? "border-[var(--primary-accent)]/30"
              : "border-[var(--border)]"
        )}
      >
        {/* Top shimmer accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[16px]"
          style={{ background: `linear-gradient(90deg, transparent, ${statusCfg.color}60, transparent)` }}
        />

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              {/* Block ID label */}
              <span
                className="text-[9px] font-mono tracking-[0.25em] uppercase"
                style={{ color: `${statusCfg.color}` }}
              >
                {data.id}
              </span>
              {/* Title */}
              <h3 className="font-bold text-[14px] text-[var(--foreground)] tracking-tight leading-tight truncate">
                {data.title ?? "Unnamed Block"}
              </h3>
              {/* Stack / Subtitle */}
              {data.stack && (
                <span className="text-[10px] font-semibold mt-0.5 text-[var(--primary-accent)]">
                  {data.stack}
                </span>
              )}
            </div>

            {/* Status column */}
            <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
              <StatusDot status={status} />
              <span
                className="text-[8px] font-bold tracking-widest"
                style={{ color: `${statusCfg.color}90` }}
              >
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-blocks list */}
        <AnimatePresence>
          {!isChatOpen && data.subBlocks && data.subBlocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2 py-2 space-y-0.5 bg-[var(--muted)]/40"
            >
              {data.subBlocks.map((sub, i) => {
                const subCfg = STATUS_CONFIG[(sub.status ?? "idle") as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;
                return (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={(e) => { e.stopPropagation(); data.onSubblockClick?.(sub); }}
                    className="w-full group/sub flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all duration-200 hover:bg-[var(--muted)]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: subCfg.color, boxShadow: `0 0 6px ${subCfg.glow}` }}
                      />
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] group-hover/sub:text-[var(--foreground)] transition-colors truncate">
                        {sub.title ?? sub.type}
                      </span>
                    </div>
                    <ChevronRight className="size-3 text-transparent group-hover/sub:text-[var(--muted-foreground)] -translate-x-1 group-hover/sub:translate-x-0 transition-all duration-200" />
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files fallback */}
        {!isChatOpen && (!data.subBlocks || data.subBlocks.length === 0) && data.files && data.files.length > 0 && (
          <div className="px-3 py-2.5 flex flex-wrap gap-1.5 bg-[var(--muted)]/40">
            {data.files.map(f => (
              <div
                key={f}
                className="px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase bg-[var(--primary-accent)]/10 border border-[var(--primary-accent)]/25 text-[var(--primary-accent)]"
              >
                {f}
              </div>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2.5 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] focus-within:border-[var(--primary-accent)]/50 transition-all duration-200">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Message module..."
                    className="bg-transparent text-[11px] w-full focus:outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50"
                    value={input}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleSend(); }}
                  />
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handleSend(); }}
                    animate={{ scale: input.trim() ? 1 : 0.9, opacity: input.trim() ? 1 : 0.3 }}
                    className={cn(
                      "p-1 rounded-lg shrink-0 transition-all",
                      input.trim()
                        ? "bg-[var(--primary-accent)] text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    <ArrowUp className="size-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom shimmer accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${statusCfg.color}30, transparent)` }}
        />
      </div>

      {/* Source Handles */}
      <Handle type="source" position={Position.Left}   id="left-out"   className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Right}  id="right-out"  className="!opacity-0 !w-0 !h-0 !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className="!opacity-0 !w-0 !h-0 !border-none" />
    </motion.div>
  );
}
