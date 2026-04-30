"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, FileCode, Layers, Activity, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockData {
  id: string;
  title: string;
  stack: string;
  status: string;
  files: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Per-block chat history store (in-memory, keyed by blockId)
const chatHistories: Record<string, Message[]> = {};

function getInitialMessages(blockId: string, block: BlockData): Message[] {
  if (!chatHistories[blockId]) {
    chatHistories[blockId] = [
      {
        role: "assistant",
        content: `Hi! I'm your AI assistant for the **${block.title}** block. I can help you refine logic, generate code, explain architecture decisions, or answer anything about this block.\n\nWhat would you like to do?`,
        timestamp: now(),
      },
    ];
  }
  return chatHistories[blockId];
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const MOCK_RESPONSES: Record<string, string[]> = {
  "BLK-AUTH-01": [
    "The CLERK AUTH block handles session management, JWT validation, and route protection via middleware.",
    "I can generate a `middleware.ts` update to add role-based access control. Want me to proceed?",
    "The `sign-in/page.tsx` uses Clerk's `<SignIn />` component with custom redirect URLs.",
  ],
  "BLK-DB-02": [
    "The PRISMA SCHEMA block defines your database models. I can extend it with new relations.",
    "I'll generate a migration script for any schema changes you need.",
    "Currently using PostgreSQL. Want me to add an index for performance optimization?",
  ],
  "BLK-UI-03": [
    "The DASHBOARD LAYOUT uses Tailwind + Radix for accessible, styled components.",
    "I can scaffold new pages that follow the existing component patterns.",
    "Want me to add a responsive sidebar or a data table component?",
  ],
};

function getMockResponse(blockId: string, query: string): string {
  const responses = MOCK_RESPONSES[blockId];
  if (responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return `I'm analyzing **${query}** in the context of this block. Here's what I found: this block appears well-structured. Would you like me to suggest any improvements?`;
}

interface BlockChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: BlockData | null;
}

export function BlockChatPanel({ isOpen, onClose, data }: BlockChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // When the active block changes, load its chat history
  useEffect(() => {
    if (data) {
      const history = getInitialMessages(data.id, data);
      setMessages([...history]);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [data?.id]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || !data) return;
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: now() };

    // Persist to history
    chatHistories[data.id] = [...(chatHistories[data.id] ?? []), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    const query = userMsg.content;
    setTimeout(() => {
      const aiMsg: Message = {
        role: "assistant",
        content: getMockResponse(data.id, query),
        timestamp: now(),
      };
      chatHistories[data.id] = [...(chatHistories[data.id] ?? []), aiMsg];
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "absolute top-0 right-0 h-full w-[380px] z-[50] flex flex-col",
        "bg-[#111]/95 backdrop-blur-xl border-l border-white/5 shadow-2xl",
        "transition-all duration-400 ease-in-out",
        isOpen && data
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-full opacity-0 pointer-events-none"
      )}
    >
      {/* ── Header ── */}
      <div className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/25 flex items-center justify-center">
            <Sparkles className="size-3.5 text-[var(--primary-accent)]" />
          </div>
          <div>
            <div className="text-xs font-bold text-white/90 leading-tight">Block AI</div>
            <div className="text-[10px] font-mono text-white/40">{data?.id ?? "—"}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Collapsible Block Details ── */}
      <div className="shrink-0 border-b border-white/5">
        <button
          onClick={() => setIsDetailOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
            {data?.title ?? "Block Details"}
          </span>
          {isDetailOpen ? (
            <ChevronUp className="size-3 text-white/30" />
          ) : (
            <ChevronDown className="size-3 text-white/30" />
          )}
        </button>

        {isDetailOpen && data && (
          <div className="px-4 pb-4 flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Stack */}
            <div className="flex items-center gap-2">
              <Layers className="size-3 text-white/30 shrink-0" />
              <span className="text-[11px] text-[var(--primary-accent)] font-medium">{data.stack}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Activity className="size-3 text-white/30 shrink-0" />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  data.status === "running"
                    ? "text-yellow-400"
                    : data.status === "done"
                      ? "text-emerald-400"
                      : "text-white/40"
                )}
              >
                {data.status}
              </span>
            </div>

            {/* Files */}
            {data.files.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileCode className="size-3 text-white/30" />
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Files</span>
                </div>
                {data.files.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-[var(--primary-accent)]/30 transition-colors cursor-pointer group/file"
                  >
                    <span className="text-[var(--primary-accent)] text-[10px] font-bold">•</span>
                    <span className="text-[10px] font-mono text-white/60 group-hover/file:text-white/90 transition-colors">
                      {file}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-1 max-w-[92%] animate-in fade-in slide-in-from-bottom-2 duration-200",
              msg.role === "user" ? "self-end items-end" : "self-start items-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1.5 px-1 mb-0.5">
                <div className="size-4 rounded-md bg-[var(--primary-accent)]/20 border border-[var(--primary-accent)]/30 flex items-center justify-center">
                  <Sparkles className="size-2.5 text-[var(--primary-accent)]" />
                </div>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Block AI</span>
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed",
                msg.role === "user"
                  ? "bg-[var(--primary-accent)]/20 border border-[var(--primary-accent)]/20 text-white/90 rounded-tr-sm"
                  : "bg-white/[0.04] border border-white/[0.06] text-white/80 rounded-tl-sm"
              )}
              // Render **bold** as bold via a simple replace
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
            <span className="text-[9px] text-white/25 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="self-start flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] animate-in fade-in duration-200">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-1.5 rounded-full bg-[var(--primary-accent)]/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 p-3 border-t border-white/5 bg-[#0d0d0d]/80">
        <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 pt-2.5 pb-2 focus-within:border-[var(--primary-accent)]/40 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${data?.title ?? "this block"}…`}
            className="flex-1 bg-transparent text-[12px] text-white/80 placeholder:text-white/25 resize-none focus:outline-none max-h-24 overflow-y-auto leading-relaxed"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "mb-0.5 shrink-0 size-6 rounded-lg flex items-center justify-center transition-all",
              input.trim() && !isTyping
                ? "bg-[var(--primary-accent)] text-white hover:bg-[var(--primary-accent)]/80"
                : "bg-white/[0.05] text-white/20 cursor-not-allowed"
            )}
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-white/20 text-center mt-2">
          Context: {data?.id} · Press Enter to send, Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
