"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  FileCode2, Terminal, Layers, ChevronRight, Download,
  RefreshCw, Copy, CheckCheck, AlertCircle, Loader2,
  FolderOpen, File, ZapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  name: string;
  content: string;
  language: string;
  blockTitle?: string;
}

interface BlockOutput {
  id: string;
  blockId: string;
  blockType: string;
  outputCode: string;
  status: "pending" | "running" | "done" | "failed";
  errorMsg?: string | null;
  createdAt: string;
}

// ─── Language detection ────────────────────────────────────────────────────────
function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", prisma: "prisma", sql: "sql", json: "json",
    css: "css", html: "html", md: "markdown", yaml: "yaml", yml: "yaml",
    sh: "bash", env: "bash",
  };
  return map[ext ?? ""] ?? "typescript";
}

// ─── Strip any residual markdown fences from a code block ───────────────────
function stripFences(code: string): string {
  return code
    .replace(/^```[a-zA-Z]*\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();
}

// ─── Parse raw LLM output into per-file chunks ────────────────────────────────
function parseOutputIntoFiles(raw: string, blockTitle: string): GeneratedFile[] {
  if (!raw) return [];

  const files: GeneratedFile[] = [];

  // Pattern 1: // FILE: path/to/file.ext  (may have fences inside each block)
  if (raw.includes("// FILE:")) {
    const fileRegex = /\/\/ FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/ FILE:|$)/g;
    let match;
    while ((match = fileRegex.exec(raw)) !== null) {
      const name = match[1].trim();
      const content = stripFences(match[2]);
      if (name && content) {
        files.push({ name, content, language: detectLanguage(name), blockTitle });
      }
    }
  }

  // Pattern 2: The whole output IS an HTML file (no FILE: markers)
  if (files.length === 0) {
    const cleaned = stripFences(raw);
    if (cleaned.includes("<!DOCTYPE") || cleaned.includes("<html")) {
      files.push({
        name: `${blockTitle.toLowerCase().replace(/\s+/g, "-")}/index.html`,
        content: cleaned,
        language: "html",
        blockTitle,
      });
    } else {
      // Generic fallback
      const ext = blockTitle.toLowerCase().includes("front") || blockTitle.toLowerCase().includes("ui") ? "tsx" : "ts";
      files.push({
        name: `${blockTitle.toLowerCase().replace(/\s+/g, "-")}/index.${ext}`,
        content: cleaned,
        language: detectLanguage(`index.${ext}`),
        blockTitle,
      });
    }
  }

  return files;
}

// ─── Line-numbers + code display ───────────────────────────────────────────────
function CodeDisplay({ content, language }: { content: string; language: string }) {
  const lines = content.split("\n");
  return (
    <div className="flex flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
      {/* Line numbers */}
      <div className="w-12 shrink-0 border-r border-white/5 flex flex-col items-end pr-3 py-5 text-white/40 select-none text-[11px] bg-[#1e1e1e]">
        {lines.map((_, i) => (
          <span key={i} className="leading-[1.7]">{i + 1}</span>
        ))}
      </div>
      {/* Code */}
      <pre className="flex-1 p-5 overflow-x-auto text-[#e2e8f0] whitespace-pre bg-[#1e1e1e]">
        <code>{content}</code>
      </pre>
    </div>
  );
}

// ─── Sidebar file tree ─────────────────────────────────────────────────────────
interface FileTreeProps {
  files: GeneratedFile[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

function FileSidebar({ files, selectedIdx, onSelect }: FileTreeProps) {
  // Group files by blockTitle
  const groups: Record<string, { file: GeneratedFile; idx: number }[]> = {};
  for (let i = 0; i < files.length; i++) {
    const key = files[i].blockTitle ?? "Output";
    if (!groups[key]) groups[key] = [];
    groups[key].push({ file: files[i], idx: i });
  }

  return (
    <div className="w-[260px] shrink-0 border-r border-[#2d2d2d] bg-[#252526] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 h-11 flex items-center gap-2 border-b border-[#2d2d2d]">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/60">Explorer</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {Object.keys(groups).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <FolderOpen size={28} className="text-white/20" />
            <p className="text-[11px] text-white/40 leading-relaxed">
              Generate a plan and click<br /><span className="text-[#007acc]">Implement This</span> to see files
            </p>
          </div>
        )}
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e] transition-colors">
              <ChevronRight size={14} className="text-white/40 shrink-0" />
              <span className="text-[11px] font-semibold text-white/80 truncate">{group}</span>
            </div>
            {items.map(({ file, idx }) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className={cn(
                  "w-full flex items-center gap-2 pl-8 pr-5 py-1 text-left transition-colors",
                  idx === selectedIdx
                    ? "bg-[#37373d] text-white border-l-2 border-[#007acc]"
                    : "text-[#cccccc] hover:text-white hover:bg-[#2a2d2e] border-l-2 border-transparent"
                )}
              >
                <File size={13} className={idx === selectedIdx ? "text-[#007acc]" : "text-[#cccccc]"} />
                <span className="text-[12px] font-mono truncate">{file.name.split("/").pop()}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Code Tab ─────────────────────────────────────────────────────────────
export function CodeTab({ projectId }: { projectId?: string | null }) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch all block outputs for the project
  const fetchOutputs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

      // Get all blocks for this project
      const blocksRes = await fetch(`${apiUrl}/api/blocks?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!blocksRes.ok) throw new Error("Failed to fetch blocks");
      const blocks = await blocksRes.json();

      // For each block get its latest output
      const allFiles: GeneratedFile[] = [];
      for (const block of blocks) {
        const outRes = await fetch(`${apiUrl}/api/blocks/${block.id}/output`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (outRes.ok) {
          const output: BlockOutput = await outRes.json();
          if (output.outputCode) {
            const blockTitle = (block.blockJson as any)?.title ?? block.blockType;
            const parsed = parseOutputIntoFiles(output.outputCode, blockTitle);
            allFiles.push(...parsed);
          }
        }
      }
      setFiles(allFiles);
      if (allFiles.length > 0) setSelectedIdx(0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, getToken]);

  // Fetch on mount
  useEffect(() => {
    fetchOutputs();
  }, [fetchOutputs]);

  // WebSocket: auto-refresh when a block completes
  useEffect(() => {
    if (!projectId) return;
    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004").replace("http", "ws")}/api/ws/${projectId}`;
    let ws: WebSocket;
    let shouldReconnect = true;
    const connect = () => {
      if (!shouldReconnect) return;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === "block:status_update" && (msg.status === "done" || msg.status === "failed")) {
            // A block just finished — refresh the file list after a brief delay
            setTimeout(fetchOutputs, 1500);
          }
          if (msg.event === "workflow:completed") {
            setTimeout(fetchOutputs, 1500);
          }
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => { if (shouldReconnect) setTimeout(connect, 2000); };
    };
    connect();
    return () => { shouldReconnect = false; ws?.close(); };
  }, [projectId, fetchOutputs]);

  const selectedFile = files[selectedIdx] ?? null;

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  // Download all files as ZIP
  const handleDownloadAll = useCallback(async () => {
    if (files.length === 0) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.name, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "craftastudio-output.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [files]);

  return (
    <div className="w-full h-full flex bg-[#1e1e1e] animate-in fade-in duration-500 font-sans">
      {/* Sidebar */}
      <FileSidebar files={files} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />

      {/* Main editor area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="h-11 flex items-center shrink-0 bg-[#2d2d2d] justify-between shadow-sm z-10">
          <div className="flex h-full">
            {selectedFile && (
              <div className="flex items-center gap-2 px-4 h-full bg-[#1e1e1e] border-t-2 border-[#007acc] text-[#cccccc]">
                <FileCode2 size={14} className="text-[#007acc] shrink-0" />
                <span className="text-[12px] font-mono">{selectedFile.name.split('/').pop()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 px-4">
            {/* Refresh */}
              <button
                onClick={fetchOutputs}
                disabled={loading}
                className="p-1.5 rounded-md hover:bg-white/10 text-[#cccccc] transition-colors"
                title="Refresh outputs"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              {/* Copy */}
              {selectedFile && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-white/10 text-[#cccccc] transition-colors"
                  title="Copy file"
                >
                  {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              )}
              {/* Download ZIP */}
              {files.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="p-1.5 rounded-md hover:bg-white/10 text-[#cccccc] transition-colors"
                  title="Download as ZIP"
                >
                  <Download size={14} />
                </button>
              )}
            </div>
          </div>

        {/* Code area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#1e1e1e]">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="text-[#007acc] animate-spin" />
              <p className="text-sm text-[#cccccc] font-mono animate-pulse">Loading outputs...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm text-[#cccccc]">{error}</p>
              <button onClick={fetchOutputs} className="text-xs text-[#007acc] hover:underline">Retry</button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#007acc]/10 flex items-center justify-center">
                <FileCode2 size={28} className="text-[#007acc]" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[#cccccc]">No code generated yet</p>
                <p className="text-xs text-[#999999] max-w-xs leading-relaxed">
                  Go to the <span className="text-[#007acc]">Canvas tab</span>, submit a prompt, then click{" "}
                  <span className="text-[#007acc]">Implement This</span> to generate code.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && selectedFile && (
            <CodeDisplay content={selectedFile.content} language={selectedFile.language} />
          )}
        </div>

        {/* Status bar */}
        <div className="h-6 bg-[#007acc] flex items-center px-4 justify-between shrink-0 shadow-inner z-10">
          <div className="flex items-center gap-4 text-[11px] text-white font-sans">
            <span className="flex items-center gap-1"><RefreshCw size={12}/> Ready</span>
            <span>{selectedFile?.language ?? "—"}</span>
            {files.length > 0 && <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white font-sans">
            {selectedFile && (
              <>
                <span>Ln {selectedFile.content.split("\n").length}, Col 1</span>
                <span>UTF-8</span>
                <span className="flex items-center gap-1"><Terminal size={12}/> Groq Llama 3.3</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
