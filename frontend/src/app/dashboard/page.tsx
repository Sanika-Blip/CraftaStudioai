"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { StatusBar } from "@/components/layout/status-bar";
import { CanvasTab } from "@/components/features/canvas/canvas-tab";
import { CodeTab } from "@/components/features/editor/code-tab";
import { PreviewTab } from "@/components/features/editor/preview-tab";
import { SettingsPanel } from "@/components/features/settings/settings-panel";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { HistoryPanel } from "@/components/features/canvas/history-panel";

export default function CraftaStudio() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"canvas" | "code" | "preview">("canvas");
  const [isPlanDocOpen, setIsPlanDocOpen] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Track whether any code has been generated — controls Export & Share visibility
  const [hasGeneratedOutput, setHasGeneratedOutput] = useState(false);

  // Track selected run from history — passed to CodeTab
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          console.warn("[Dashboard] Sync timed out — proceeding without projectId");
        }, 30000);

        const res = await fetch(`${apiUrl}/api/auth/sync`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (!res.ok) return;
        const user = await res.json() as { teams?: { projects?: { id: string; name: string }[] }[] };
        const firstProject = user?.teams?.[0]?.projects?.[0];
        if (firstProject) {
          setProjectId(firstProject.id);
          setProjectName(firstProject.name);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[Dashboard] Failed to sync user:", err);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, getToken]);

  // Called by MainSidebar when user clicks a project
  const handleProjectSwitch = useCallback((id: string, name: string) => {
    setProjectId(id);
    setProjectName(name);
    setHasGeneratedOutput(false);
    setSelectedRunId(null);
    setIsPlanDocOpen(false);
    setActiveTab("canvas");
  }, []);

  // Called by CanvasTab when generation completes
  const handleGenerationComplete = useCallback(() => {
    setHasGeneratedOutput(true);
  }, []);

  // Called by HistoryPanel when user loads a past run
  const handleSelectRun = useCallback((runId: string) => {
    setSelectedRunId(runId);
    setHasGeneratedOutput(true);
    setActiveTab("code");
  }, []);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--primary-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MainSidebar
        activeProjectId={projectId}
        onProjectSwitch={handleProjectSwitch}
        onOpenSettings={(tab) => {
          localStorage.setItem("craftastudio-settings-tab", tab);
          setIsSettingsOpen(true);
        }}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onProjectSelect={handleProjectSwitch}
      />

      <div className="flex flex-col flex-1 relative overflow-hidden">
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPlanDocOpen={isPlanDocOpen}
          setIsPlanDocOpen={setIsPlanDocOpen}
          isPlanMode={isPlanMode}
          isPlanGenerated={isPlanGenerated}
          onSettingsClick={() => setIsSettingsOpen(true)}
          isChatSidebarOpen={isChatSidebarOpen}
          setIsChatSidebarOpen={setIsChatSidebarOpen}
        />

        <main className="flex-1 relative overflow-hidden">
          <div className={activeTab === "canvas" ? "block w-full h-full" : "hidden"}>
            <CanvasTab
              isPlanDocOpen={isPlanDocOpen}
              setIsPlanDocOpen={setIsPlanDocOpen}
              isPlanMode={isPlanMode}
              setActiveTab={setActiveTab}
              isPlanGenerated={isPlanGenerated}
              setIsPlanGenerated={setIsPlanGenerated}
              isChatSidebarOpen={isChatSidebarOpen}
              setIsChatSidebarOpen={setIsChatSidebarOpen}
              projectId={projectId}
              projectName={projectName}
              onProjectNameChange={setProjectName}
              onGenerationComplete={handleGenerationComplete}
            />
          </div>
          <div className={activeTab === "code" ? "block w-full h-full" : "hidden"}>
            <CodeTab
              projectId={projectId}
            />
          </div>
          <div className={activeTab === "preview" ? "block w-full h-full" : "hidden"}>
            <PreviewTab />
          </div>
        </main>

        <StatusBar hasGeneratedOutput={hasGeneratedOutput} />
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projectId={projectId}
        onSelectRun={handleSelectRun}
      />
    </div>
  );
}
