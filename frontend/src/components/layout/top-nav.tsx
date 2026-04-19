"use client";

import { Play, FileText, Hexagon, Sun, Moon, PanelRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface TopNavProps {
  activeTab: "canvas" | "code" | "preview";
  setActiveTab: (tab: "canvas" | "code" | "preview") => void;
  isPlanDocOpen: boolean;
  setIsPlanDocOpen: (open: boolean) => void;
  isPlanMode: boolean;
  isPlanGenerated: boolean;
  onSettingsClick?: () => void;
  isChatSidebarOpen?: boolean;
  setIsChatSidebarOpen?: (open: boolean) => void;
}

export function TopNav({ 
  activeTab, 
  setActiveTab, 
  isPlanDocOpen, 
  setIsPlanDocOpen, 
  isPlanMode, 
  isPlanGenerated,
  onSettingsClick,
  isChatSidebarOpen,
  setIsChatSidebarOpen
}: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tabs = [
    { id: "canvas", label: "Canvas" },
    { id: "code", label: "Code" },
    { id: "preview", label: "Preview" },
  ] as const;

  return (
    <header className="h-14 mt-2 mb-2 bg-transparent flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] px-4 py-2 flex items-center gap-2 rounded-xl shadow-sm">
        <div className="size-6 rounded-md bg-[var(--primary-accent)]/20 flex items-center justify-center border border-[var(--primary-accent)]/30">
          <Hexagon className="size-4 text-[var(--primary-accent)] fill-[var(--primary-accent)]" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-[var(--foreground)]">CraftaStudio</span>
      </div>

      <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl shadow-sm border border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-[var(--primary-accent)] text-black dark:text-black shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--muted-foreground)]">
          <div className="size-2 rounded-full bg-[var(--agent-running)] animate-pulse-fast" />
          <span>6 running · 10 blocks</span>
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        )}

        {isChatSidebarOpen !== undefined && setIsChatSidebarOpen && (
          <button
            onClick={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
            className={cn(
              "p-2 rounded-md transition-colors",
              isChatSidebarOpen ? "bg-[var(--foreground)]/10 text-[var(--foreground)]" : "hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            title="Toggle Sidebar Chat"
          >
            <PanelRight className="size-4" />
          </button>
        )}

        {isPlanGenerated && (
          <button 
            onClick={() => setIsPlanDocOpen(!isPlanDocOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
              isPlanDocOpen 
                ? "bg-[var(--primary-accent)]/10 border-[var(--primary-accent)] text-[var(--foreground)]" 
                : "hover:bg-[var(--surface)] border-transparent hover:border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <FileText className="size-4" />
            Plan
          </button>
        )}

        <button 
          onClick={() => setActiveTab("preview")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-accent)] hover:bg-opacity-90 text-[var(--surface)] dark:text-black text-sm font-semibold transition-colors shadow-sm"
        >
          Run 
          <Play className="size-3.5 fill-current" />
        </button>

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
