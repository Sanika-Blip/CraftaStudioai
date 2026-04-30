"use client";

import {
  Home, User, Bot, FolderKanban, Bell, Cpu,
  Palette, LayoutPanelLeft, FileCode2, Puzzle, ScrollText, Clock,
  ChevronRight, Plus, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3004";

const LogoIcon = () => (
  <div className="size-7.5 rounded-full bg-[#0a0a0a] flex items-center justify-center border border-white/10 shadow-lg">
    <span className="text-white font-bold text-sm tracking-tighter">N</span>
  </div>
);

type SettingsTabId = "account" | "agent" | "projects" | "notifications" | "models" | "customizations" | "tab" | "editor" | "mcp" | "audit";

interface Project {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  projects: Project[];
}

interface MainSidebarProps {
  activeProjectId?: string | null;
  onProjectSwitch?: (id: string, name: string) => void;
  onOpenSettings: (tab: SettingsTabId) => void;
  onHistoryClick?: () => void;
}

export function MainSidebar({ activeProjectId, onProjectSwitch, onOpenSettings, onHistoryClick }: MainSidebarProps) {
  const { getToken } = useAuth();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isProjectPanelOpen, setIsProjectPanelOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/workspace`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { teams: Team[] };
      setTeams(data.teams ?? []);
      if (data.teams?.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data.teams[0].id);
      }
    } catch (err) {
      console.error("[Sidebar] Failed to fetch workspace:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, [getToken, selectedTeamId]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !selectedTeamId) return;
    try {
      setCreateLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newProjectName.trim(), teamId: selectedTeamId }),
      });
      if (!res.ok) return;
      const newProject = await res.json() as Project;
      setNewProjectName("");
      setCreatingProject(false);
      await fetchWorkspace();
      // Auto-switch to the new project
      onProjectSwitch?.(newProject.id, newProject.name);
    } catch (err) {
      console.error("[Sidebar] Failed to create project:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const allProjects = teams.flatMap((t) =>
    t.projects.map((p) => ({ ...p, teamName: t.name }))
  );

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
        { id: "projects", label: "Projects", icon: FolderKanban, action: "projects" },
        { id: "notifications", label: "Notifications", icon: Bell, action: "settings" },
        { id: "models", label: "Models", icon: Cpu, action: "settings" },
        { id: "customizations", label: "Customizations", icon: Palette, action: "settings" },
        { id: "tab", label: "Tab Interface", icon: LayoutPanelLeft, action: "settings" },
        { id: "editor", label: "Editor", icon: FileCode2, action: "settings" },
        { id: "mcp", label: "MCP Plugins", icon: Puzzle, action: "settings" },
        { id: "audit", label: "Audit Logs", icon: ScrollText, action: "settings" },
        { id: "history", label: "History", icon: Clock, action: "history" },
      ],
    },
  ];

  const handleClick = (item: { id: string; action: string }) => {
    if (item.action === "history") {
      onHistoryClick?.();
    } else if (item.action === "projects") {
      setIsProjectPanelOpen((prev) => {
        const next = !prev;
        if (!prev) void fetchWorkspace();
        return next;
      });
    } else if (item.action === "settings") {
      setIsProjectPanelOpen(false);
      onOpenSettings(item.id as SettingsTabId);
    }
  };

  return (
    <>
      <nav
        className="group relative h-full w-16 hover:w-60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col bg-(--surface)/40 backdrop-blur-md border-r border-(--border) z-90 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] overflow-hidden shrink-0"
        onMouseLeave={() => setHoveredTab(null)}
      >
        <div className="flex-1 py-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden scrollbar-none pb-20">
          {sidebarGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-0.5 px-3">
              {group.title && (
                <div className="h-5 flex items-center px-3 mt-2 mb-1">
                  <span className="text-[10px] font-bold text-(--muted-foreground) tracking-widest uppercase opacity-0 group-hover:opacity-60 transition-opacity duration-300 whitespace-nowrap delay-100">
                    {group.title}
                  </span>
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isHovered = hoveredTab === item.id;
                const isProjectsActive = item.id === "projects" && isProjectPanelOpen;

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
                      isHovered || isProjectsActive ? "bg-(--foreground)/5" : "bg-transparent"
                    )} />

                    <div className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full transition-all duration-300",
                      isHovered || isProjectsActive
                        ? "h-1/2 bg-(--primary-accent) shadow-[0_0_10px_var(--primary-accent)]"
                        : "h-0 bg-transparent"
                    )} />

                    <div className="absolute left-0 w-10 h-full flex items-center justify-center shrink-0">
                      <Icon
                        className={cn(
                          "size-4.5 transition-all duration-200",
                          isHovered || isProjectsActive ? "text-(--primary-accent) scale-110" : "text-(--muted-foreground)"
                        )}
                        strokeWidth={isHovered || isProjectsActive ? 2.5 : 2}
                      />
                    </div>

                    <span
                      className={cn(
                        "absolute left-10 text-[13px] font-medium whitespace-nowrap transition-all duration-300",
                        "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 tracking-tight",
                        isHovered || isProjectsActive ? "text-(--foreground)" : "text-(--muted-foreground)"
                      )}
                      style={{ transitionDelay: "50ms" }}
                    >
                      {item.label}
                    </span>

                    {item.id === "projects" && (
                      <ChevronRight
                        className={cn(
                          "absolute right-3 size-3.5 text-(--muted-foreground) transition-all duration-300",
                          "opacity-0 group-hover:opacity-100",
                          isProjectPanelOpen ? "rotate-90 text-(--primary-accent)" : "rotate-0"
                        )}
                        style={{ transitionDelay: "50ms" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-linear-to-t from-(--surface) to-transparent pt-6 border-t border-transparent group-hover:border-(--border) transition-colors duration-300">
          <button className="relative flex items-center h-10 w-full rounded-xl transition-all duration-200 hover:bg-(--foreground)/5 group/profile outline-none">
            <div className="absolute left-0 w-8 h-full flex items-center justify-center shrink-0">
              <LogoIcon />
            </div>
            <span className="absolute left-10 text-[13px] font-bold whitespace-nowrap opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-(--foreground)">
              CraftaStudio
            </span>
          </button>
        </div>
      </nav>

      {/* Project Switcher Panel */}
      {isProjectPanelOpen && (
        <div className="absolute left-16 top-0 h-full w-70 z-89 bg-(--surface) border-r border-(--border) shadow-xl flex flex-col animate-in slide-in-from-left-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-(--border)">
            <span className="text-xs font-bold text-(--muted-foreground) tracking-widest uppercase">Projects</span>
            <button
              onClick={() => { setCreatingProject(true); setNewProjectName(""); }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-(--primary-accent)/10 text-(--primary-accent) border border-(--primary-accent)/30 hover:bg-(--primary-accent)/20 transition-all"
            >
              <Plus className="size-3" />
              New
            </button>
          </div>

          {/* Create project form */}
          {creatingProject && (
            <div className="px-3 py-3 border-b border-[var(--border)] space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="Project name…"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") { setCreatingProject(false); setNewProjectName(""); }
                }}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-(--background) border border-(--border) text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:border-(--primary-accent) transition-colors"
              />
              {teams.length > 1 && (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-(--background) border border-(--border) text-(--foreground) focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createLoading}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-(--primary-accent) text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {createLoading ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => { setCreatingProject(false); setNewProjectName(""); }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-(--border) text-(--muted-foreground) hover:border-(--primary-accent)/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Project list */}
          <div className="flex-1 overflow-y-auto py-2">
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8 gap-2 text-(--muted-foreground)">
                <div className="w-3.5 h-3.5 border-2 border-(--primary-accent) border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : allProjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-(--muted-foreground) opacity-60">
                No projects yet
              </div>
            ) : (
              allProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectSwitch?.(project.id, project.name);
                      setIsProjectPanelOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all group/proj",
                      isActive
                        ? "bg-(--primary-accent)/10 text-(--foreground)"
                        : "hover:bg-(--foreground)/5 text-(--muted-foreground) hover:text-(--foreground)"
                    )}
                  >
                    <FolderKanban className={cn("size-4 shrink-0", isActive ? "text-(--primary-accent)" : "")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{project.name}</div>
                      <div className="text-[10px] text-(--muted-foreground) opacity-60 truncate">{project.teamName}</div>
                    </div>
                    {isActive && <Check className="size-3.5 text-(--primary-accent) shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close panel */}
      {isProjectPanelOpen && (
        <div
          className="fixed inset-0 z-[88]"
          onClick={() => setIsProjectPanelOpen(false)}
        />
      )}
    </>
  );
}