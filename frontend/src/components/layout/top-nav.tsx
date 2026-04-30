"use client";

import { Play, Sun, Moon, LayoutGrid, Code, Settings, PanelRightClose, PanelRightOpen, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

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

const PANEL_STORAGE_KEY = "craftastudio-panel-open";

export function TopNav({
  activeTab,
  setActiveTab,
  isPlanDocOpen,
  setIsPlanDocOpen,
  isPlanMode,
  isPlanGenerated,
  onSettingsClick,
  isChatSidebarOpen,
  setIsChatSidebarOpen,
}: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keyboard shortcut: Ctrl+B (or Cmd+B)
  const handlePanelToggle = useCallback(() => {
    const next = !isChatSidebarOpen;
    setIsChatSidebarOpen?.(next);
    try { localStorage.setItem(PANEL_STORAGE_KEY, String(next)); } catch {}
  }, [isChatSidebarOpen, setIsChatSidebarOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        handlePanelToggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePanelToggle]);

  const tabs = [
    { id: "canvas", label: "Canvas", icon: LayoutGrid },
    { id: "code", label: "Code", icon: Code },
    { id: "preview", label: "Preview", icon: Play },
  ] as const;

  const PanelIcon = isChatSidebarOpen ? PanelRightClose : PanelRightOpen;

  return (
    <header className="h-16 flex items-center justify-between px-6 shrink-0 z-50 relative mt-2 bg-transparent">
      {/* ── Left: Project Info ── */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-[var(--primary-accent)]" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--foreground)] uppercase opacity-80">
              Project: CraftaStudio App
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6366f1] uppercase">
              • Development Mode
            </span>
          </div>
        </div>
      </div>

      {/* ── Center: Tab Navigator ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] p-1 rounded-full shadow-2xl ring-1 ring-[var(--border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-300 group",
                isActive
                  ? "bg-[var(--primary-accent)] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-white" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                )}
              />
              <span className="text-[14px] font-bold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Right: Meta + Controls ── */}
      <div className="flex items-center gap-4">
        {/* Panel controls */}
        <div className="hidden xl:flex items-center gap-5 border-r border-[var(--border)] pr-4">

          {/* ── Panel Toggle Button ── */}
          {activeTab === "canvas" && setIsChatSidebarOpen && (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setIsPlanDocOpen(!isPlanDocOpen)}
                className={cn(
                  "flex items-center justify-center p-2 rounded-lg transition-all duration-200 border",
                  isPlanDocOpen
                    ? "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                    : "text-[var(--muted-foreground)] bg-transparent border-transparent hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20"
                )}
                aria-label={isPlanDocOpen ? "Close Plan" : "View Plan"}
                title="View Architecture Plan"
              >
                <FileText className="size-4 transition-transform duration-300" />
              </button>

              <button
                id="panel-toggle-btn"
                onClick={handlePanelToggle}
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                aria-label={isChatSidebarOpen ? "Close Panel" : "Open Panel"}
                className={cn(
                  "flex items-center justify-center p-2 rounded-lg transition-all duration-200 border",
                  isChatSidebarOpen
                    ? "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                    : "text-[var(--muted-foreground)] bg-transparent border-transparent hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20"
                )}
              >
                <PanelIcon
                  className={cn(
                    "size-4 transition-transform duration-300",
                    isChatSidebarOpen ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>

              {/* Tooltip */}
              {tooltipVisible && (
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] shadow-lg z-[200] pointer-events-none">
                  {isChatSidebarOpen ? "Close Panel" : "Open Panel"}
                  <span className="ml-2 text-[10px] text-[var(--muted-foreground)] font-mono">⌘B</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme + User */}
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors border border-[var(--border)]"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          )}

          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Settings"
                labelIcon={<Settings className="size-4" />}
                onClick={() => onSettingsClick?.()}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}
