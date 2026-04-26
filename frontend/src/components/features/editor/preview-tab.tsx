"use client";

import {
  Globe, RotateCw, ExternalLink, Play, ChevronLeft, ChevronRight,
  ShieldCheck, Plus, Monitor, Smartphone, Tablet, Maximize2, Loader2,
  RefreshCw, ZapIcon
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface PreviewTabProps {
  projectId?: string | null;
}

export function PreviewTab({ projectId }: PreviewTabProps) {
  const { getToken } = useAuth();
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const viewportWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[390px]",
  };

  // Fetch the HTML output from block outputs
  const fetchPreview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

      const blocksRes = await fetch(`${apiUrl}/api/blocks?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!blocksRes.ok) throw new Error("Failed to fetch blocks");
      const blocks = await blocksRes.json();

      // Find the frontend/ui block output first, then fallback to any block
      let previewHtml: string | null = null;
      const priorityTypes = ["frontend", "ui", "calculator", "index"];

      // Sort blocks — frontend/ui first
      const sorted = [...blocks].sort((a, b) => {
        const aFront = priorityTypes.some(t => a.blockType.includes(t));
        const bFront = priorityTypes.some(t => b.blockType.includes(t));
        return (bFront ? 1 : 0) - (aFront ? 1 : 0);
      });

      for (const block of sorted) {
        const outRes = await fetch(`${apiUrl}/api/blocks/${block.id}/output`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!outRes.ok) continue;
        const output = await outRes.json();
        if (!output.outputCode) continue;

        // Extract HTML file from the output
        const htmlMatch = output.outputCode.match(/\/\/ FILE: .*?\.html\n([\s\S]*?)(?=\/\/ FILE:|$)/);
        if (htmlMatch) {
          previewHtml = htmlMatch[1].trim();
          break;
        }

        // If the whole output looks like HTML
        if (output.outputCode.includes("<!DOCTYPE html") || output.outputCode.includes("<html")) {
          previewHtml = output.outputCode;
          break;
        }
      }

      setHtmlContent(previewHtml);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, getToken]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // WebSocket: auto-refresh when blocks complete
  useEffect(() => {
    if (!projectId) return;
    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004").replace("http", "ws")}/ws?projectId=${projectId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "block:status_update" && msg.status === "done") {
          fetchPreview();
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [projectId, fetchPreview]);

  // Write HTML into iframe using srcdoc
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [htmlContent]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--background)] pt-2 px-2 pb-2">
      {/* Browser Shell */}
      <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl relative">

        {/* Top Bar */}
        <div className="bg-[var(--surface)] border-b border-[var(--border)] flex flex-col shrink-0">

          {/* Tabs Row */}
          <div className="h-10 flex items-center px-4 gap-4">
            <div className="flex items-center gap-1.5 w-16">
              <div className="size-2.5 rounded-full bg-[#ff5f57]" />
              <div className="size-2.5 rounded-full bg-[#febc2e]" />
              <div className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="h-8 px-4 bg-[var(--muted)]/50 border-t border-x border-[var(--border)] rounded-t-lg flex items-center gap-2 min-w-[160px] translate-y-[1px]">
              <Globe size={12} className="text-[var(--primary-accent)]" />
              <span className="text-[10px] font-medium text-[var(--foreground)] truncate tracking-tight">CraftaStudio Preview</span>
            </div>
            <button className="size-6 flex items-center justify-center rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
              <Plus size={14} />
            </button>

            {/* Viewport Controls */}
            <div className="ml-auto flex items-center gap-1 bg-[var(--muted)]/50 p-1 rounded-lg border border-[var(--border)]">
              {(["desktop", "tablet", "mobile"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  className={cn("p-1 rounded transition-all",
                    viewport === v
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  {v === "desktop" && <Monitor size={14} />}
                  {v === "tablet" && <Tablet size={14} />}
                  {v === "mobile" && <Smartphone size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Address Bar */}
          <div className="h-10 border-t border-[var(--border)] flex items-center px-4 gap-4 bg-[var(--surface)]">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <ChevronLeft size={16} className="opacity-50" />
              <ChevronRight size={16} className="opacity-50" />
              <button onClick={fetchPreview} disabled={loading} className="ml-2 hover:text-[var(--foreground)] cursor-pointer transition-colors">
                <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex-1 flex items-center h-7 bg-[var(--muted)]/30 border border-[var(--border)] rounded-full px-4 gap-2">
              <ShieldCheck size={12} className="text-[#28c840] shrink-0" />
              <span className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">
                craftastudio://preview/{projectId ?? "sandbox"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw
                size={14}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
                onClick={fetchPreview}
              />
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 flex justify-center bg-[var(--background)] relative overflow-auto p-4 scrollbar-hide">
          <div className={cn(
            "h-full transition-all duration-500 ease-[0.32,0.72,0,1] relative shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden shrink-0",
            viewportWidths[viewport],
          )}>

            {/* Loading */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#18181b]">
                <Loader2 size={24} className="text-[var(--primary-accent)] animate-spin" />
                <p className="text-sm text-white/40 font-mono animate-pulse">Loading preview...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#18181b] text-center p-8">
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={fetchPreview} className="text-xs text-[var(--primary-accent)] hover:underline">Retry</button>
              </div>
            )}

            {/* No preview yet */}
            {!loading && !error && !htmlContent && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#18181b] text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary-accent)]/5 border border-[var(--primary-accent)]/10 flex items-center justify-center">
                  <ZapIcon size={28} className="text-[var(--primary-accent)]/40" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-white/60">No preview available yet</p>
                  <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                    Go to <span className="text-[var(--primary-accent)]/60">Canvas</span>, submit a prompt, then click{" "}
                    <span className="text-[var(--primary-accent)]/60">Implement This</span> to generate a live preview.
                  </p>
                </div>
              </div>
            )}

            {/* Live HTML Preview */}
            {!loading && !error && htmlContent && (
              <iframe
                ref={iframeRef}
                title="CraftaStudio Preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
