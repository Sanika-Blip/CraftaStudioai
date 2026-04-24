"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { StatusBar } from "@/components/layout/status-bar";
import { CanvasTab } from "@/components/features/canvas/canvas-tab";
import { CodeTab } from "@/components/features/editor/code-tab";
import { PreviewTab } from "@/components/features/editor/preview-tab";
import { SettingsPanel } from "@/components/features/settings/settings-panel";
import { MainSidebar } from "@/components/layout/main-sidebar";

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

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Sync the authenticated Clerk user into our database
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
        console.log("[Dashboard] Syncing user at:", `${apiUrl}/api/auth/sync`);
        const res = await fetch(`${apiUrl}/api/auth/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[Dashboard] Sync failed with status ${res.status}:`, errorText);
          return;
        }

        const user = await res.json();
        console.log("[Dashboard] Sync success, user data:", user);
        
        const firstProject = user?.teams?.[0]?.projects?.[0];
        if (firstProject) {
          console.log("[Dashboard] Setting project ID:", firstProject.id);
          setProjectId(firstProject.id);
        } else {
          console.error("[Dashboard] No project found in user data");
        }
      } catch (err) {
        console.error("[Dashboard] Failed to sync user:", err);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn]);

  // Show spinner while Clerk loads or if not signed in (redirect is in progress)
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
        onOpenSettings={(tab) => {
           localStorage.setItem("craftastudio-settings-tab", tab);
           setIsSettingsOpen(true);
        }} 
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
        <main className="flex-1 relative">
          {activeTab === "canvas" && (
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
            />
          )}
          {activeTab === "code" && <CodeTab />}
          {activeTab === "preview" && <PreviewTab />}
        </main>
        <StatusBar />
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
