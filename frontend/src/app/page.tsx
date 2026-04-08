"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { StatusBar } from "@/components/layout/status-bar";
import { CanvasTab } from "@/components/features/canvas/canvas-tab";
import { CodeTab } from "@/components/features/editor/code-tab";
import { PreviewTab } from "@/components/features/editor/preview-tab";
import { SettingsPanel } from "@/components/features/settings/settings-panel";

export default function CraftaStudio() {
  const [activeTab, setActiveTab] = useState<"canvas" | "code" | "preview">("canvas");
  const [isPlanDocOpen, setIsPlanDocOpen] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

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
