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

// ─── Parse raw LLM output into per-file chunks ─────────────────────────────────
function parseOutputIntoFiles(raw: string, blockTitle: string): GeneratedFile[] {
  if (!raw) return [];

  const fileRegex = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  const files: GeneratedFile[] = [];
  let match;

  while ((match = fileRegex.exec(raw)) !== null) {
    const name = match[1].trim();
    const content = match[2].trim();
    files.push({ name, content, language: detectLanguage(name), blockTitle });
  }

  if (files.length === 0) {
    // If no FILE: markers, treat the whole output as one file
    const ext = blockTitle.toLowerCase().includes("front") ? "tsx" : "ts";
    const name = `${blockTitle.toLowerCase().replace(/\s+/g, "-")}/index.${ext}`;
    files.push({ name, content: raw, language: detectLanguage(name), blockTitle });
  }

  return files;
}

// ─── Line-numbers + code display ───────────────────────────────────────────────
function CodeDisplay({ content, language }: { content: string; language: string }) {
  const lines = content.split("\n");
  return (
    <div className="flex flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
      {/* Line numbers */}
      <div className="w-12 shrink-0 border-r border-white/5 flex flex-col items-end pr-3 py-5 text-white/20 select-none text-[11px] bg-[#0d0d0d]">
        {lines.map((_, i) => (
          <span key={i} className="leading-[1.7]">{i + 1}</span>
        ))}
      </div>
      {/* Code */}
      <pre className="flex-1 p-5 overflow-x-auto text-[#e2e8f0] whitespace-pre bg-[#0d0d0d]">
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
    <div className="w-[260px] shrink-0 border-r border-white/5 bg-[#111111] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 h-11 flex items-center gap-2 border-b border-white/5">
        <Terminal size={13} className="text-[#a3e635]" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Explorer</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {Object.keys(groups).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <FolderOpen size={28} className="text-white/10" />
            <p className="text-[11px] text-white/30 leading-relaxed">
              Generate a plan and click<br /><span className="text-[#a3e635]/60">Implement This</span> to see files
            </p>
          </div>
        )}
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <FolderOpen size={12} className="text-[#a3e635]/50 shrink-0" />
              <span className="text-[10px] font-semibold text-white/40 truncate uppercase tracking-wider">{group}</span>
            </div>
            {items.map(({ file, idx }) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className={cn(
                  "w-full flex items-center gap-2 px-5 py-1.5 text-left transition-colors",
                  idx === selectedIdx
                    ? "bg-[#a3e635]/10 text-[#a3e635]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <File size={11} className="shrink-0" />
                <span className="text-[11px] font-mono truncate">{file.name.split("/").pop()}</span>
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
    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004").replace("http", "ws")}/ws?projectId=${projectId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "block:status_update" && msg.status === "done") {
          // A block just finished — refresh the file list
          fetchOutputs();
        }
      } catch {}
    };
    return () => { ws.close(); };
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
    <div className="w-full h-full flex bg-[#0d0d0d] animate-in fade-in duration-500">
      {/* Sidebar */}
      <FileSidebar files={files} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />

      {/* Main editor area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="h-11 border-b border-white/5 flex items-center px-4 shrink-0 bg-[#111111] justify-between">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider shrink-0">Workspace</span>
            {selectedFile && (
              <>
                <ChevronRight className="size-3 text-white/20 shrink-0" />
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <FileCode2 size={12} className="text-[#a3e635] shrink-0" />
                  <span className="text-[12px] font-mono text-white/80 truncate">{selectedFile.name}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              onClick={fetchOutputs}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
              title="Refresh outputs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            {/* Copy */}
            {selectedFile && (
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
                title="Copy file"
              >
                {copied ? <CheckCheck size={13} className="text-[#a3e635]" /> : <Copy size={13} />}
              </button>
            )}
            {/* Download ZIP */}
            {files.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#a3e635]/10 hover:bg-[#a3e635]/20 border border-[#a3e635]/20 text-[#a3e635] text-[11px] font-semibold transition-colors"
                title="Download as ZIP"
              >
                <Download size={11} />
                Export ZIP
              </button>
            )}
          </div>
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0d0d0d]">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="text-[#a3e635] animate-spin" />
              <p className="text-sm text-white/40 font-mono animate-pulse">Loading outputs...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <AlertCircle size={28} className="text-red-400/60" />
              <p className="text-sm text-white/40">{error}</p>
              <button onClick={fetchOutputs} className="text-xs text-[#a3e635] hover:underline">Retry</button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#a3e635]/5 border border-[#a3e635]/10 flex items-center justify-center">
                <ZapIcon size={28} className="text-[#a3e635]/40" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-white/60">No code generated yet</p>
                <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                  Go to the <span className="text-[#a3e635]/60">Canvas tab</span>, submit a prompt, then click{" "}
                  <span className="text-[#a3e635]/60">Implement This</span> to generate code.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && selectedFile && (
            <CodeDisplay content={selectedFile.content} language={selectedFile.language} />
          )}
        </div>

        {/* Status bar */}
        <div className="h-6 border-t border-white/5 bg-[#0a0a0a] flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-white/20 font-mono">
            <span>UTF-8</span>
            <span>{selectedFile?.language ?? "—"}</span>
            {files.length > 0 && <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white/20 font-mono">
            {selectedFile && (
              <>
                <span>{selectedFile.content.split("\n").length} lines</span>
                <span>Groq Llama 3.3</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
