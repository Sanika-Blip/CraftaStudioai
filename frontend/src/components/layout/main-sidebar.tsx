"use client";

import {
  Home, User, Bot, FolderKanban, Bell, Cpu,
  Palette, LayoutPanelLeft, FileCode2, Puzzle, ScrollText, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const LogoIcon = () => (
  <div className="size-[30px] rounded-full bg-[#0a0a0a] flex items-center justify-center border border-white/10 shadow-lg">
    <span className="text-white font-bold text-sm tracking-tighter">N</span>
  </div>
);

type SettingsTabId = "account" | "agent" | "projects" | "notifications" | "models" | "customizations" | "tab" | "editor" | "mcp" | "audit";

interface MainSidebarProps {
  onOpenSettings: (tab: SettingsTabId) => void;
  onHistoryClick?: () => void;
}

export function MainSidebar({ onOpenSettings, onHistoryClick }: MainSidebarProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const sidebarGroups = [
    {
      title: "",
      items: [
        { id: "home", label: "Home / Dashboard", icon: Home, action: "home" },
      ]
    },
    {
      title: "ACCOUNT",
      items: [
        { id: "account", label: "Account", icon: User, action: "settings" },
      ],
    },
    {
      title: "GLOBAL SETTINGS",
      items: [
        { id: "agent", label: "Agent", icon: Bot, action: "settings" },
        { id: "projects", label: "Projects", icon: FolderKanban, action: "settings" },
        { id: "notifications", label: "Notifications", icon: Bell, action: "settings" },
        { id: "models", label: "Models", icon: Cpu, action: "settings" },
        { id: "customizations", label: "Customizations", icon: Palette, action: "settings" },
        { id: "tab", label: "Tab Interface", icon: LayoutPanelLeft, action: "settings" },
        { id: "editor", label: "Editor", icon: FileCode2, action: "settings" },
        { id: "mcp", label: "MCP Plugins", icon: Puzzle, action: "settings" },
        { id: "audit", label: "Audit Logs", icon: ScrollText, action: "settings" },
        { id: "history", label: "History", icon: Clock, action: "history" }, // ✅ below audit logs
      ],
    },
  ];

  const handleClick = (item: { id: string; action: string }) => {
    if (item.action === "history") {
      onHistoryClick?.();
    } else if (item.action === "settings") {
      onOpenSettings(item.id as SettingsTabId);
    }
    // home does nothing (already on dashboard)
  };

  return (
    <nav
      className="group relative h-full w-[64px] hover:w-[240px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col bg-[var(--surface)]/40 backdrop-blur-md border-r border-[var(--border)] z-[90] shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] overflow-hidden shrink-0"
      onMouseLeave={() => setHoveredTab(null)}
    >
      <div className="flex-1 py-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden scrollbar-none pb-20">
        {sidebarGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="flex flex-col gap-0.5 px-3">
            {group.title && (
              <div className="h-5 flex items-center px-3 mt-2 mb-1">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase opacity-0 group-hover:opacity-60 transition-opacity duration-300 whitespace-nowrap delay-100">
                  {group.title}
                </span>
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isHovered = hoveredTab === item.id;
              const isHistory = item.id === "history";

              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onClick={() => handleClick(item)}
                  className="relative flex items-center h-10 w-full rounded-xl transition-all duration-200 outline-none group/btn"
                  aria-label={item.label}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-xl transition-colors duration-200",
                    isHovered ? "bg-[var(--foreground)]/5" : "bg-transparent"
                  )} />

                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300",
                    isHovered
                      ? isHistory
                        ? "h-1/2 bg-[var(--primary-accent)] shadow-[0_0_10px_var(--primary-accent)]"
                        : "h-1/2 bg-[var(--primary-accent)] shadow-[0_0_10px_var(--primary-accent)]"
                      : "h-0 bg-transparent"
                  )} />

                  <div className="absolute left-0 w-10 h-full flex items-center justify-center shrink-0">
                    <Icon
                      className={cn(
                        "size-[18px] transition-all duration-200",
                        isHovered ? "text-[var(--primary-accent)] scale-110" : "text-[var(--muted-foreground)]"
                      )}
                      strokeWidth={isHovered ? 2.5 : 2}
                    />
                  </div>

                  <span
                    className={cn(
                      "absolute left-10 text-[13px] font-medium whitespace-nowrap transition-all duration-300",
                      "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 tracking-tight",
                      isHovered ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                    )}
                    style={{ transitionDelay: "50ms" }}
                  >
                    {item.label}
                  </span>

                  <div className="absolute left-14 hidden group-hover/btn:flex opacity-0 group-hover:!hidden pointer-events-none transition-opacity duration-200 z-[100]">
                    <div className="bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[var(--surface)] to-transparent pt-6 border-t border-transparent group-hover:border-[var(--border)] transition-colors duration-300">
        <button className="relative flex items-center h-10 w-full rounded-xl transition-all duration-200 hover:bg-[var(--foreground)]/5 group/profile outline-none">
          <div className="absolute left-0 w-8 h-full flex items-center justify-center shrink-0">
            <LogoIcon />
          </div>
          <span className="absolute left-10 text-[13px] font-bold whitespace-nowrap opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[var(--foreground)]">
            CraftaStudio
          </span>
        </button>
      </div>
    </nav>
  );
}