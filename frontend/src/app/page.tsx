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

export default function CraftaStudio() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();

  // All useState hooks must be declared before any conditional returns
  const [activeTab, setActiveTab] = useState<"canvas" | "code" | "preview">("canvas");
  const [isPlanDocOpen, setIsPlanDocOpen] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

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
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Failed to sync user:", err);
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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
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
          />
        )}
        {activeTab === "code" && <CodeTab />}
        {activeTab === "preview" && <PreviewTab />}
      </main>
      <StatusBar />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
