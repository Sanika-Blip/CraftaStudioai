"use client";

import { useState } from "react";
import { SettingsPanel } from "@/components/features/settings/settings-panel";

export default function SettingsPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-screen bg-[var(--background)]">
      <SettingsPanel
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          // Navigate back after closing
          window.history.back();
        }}
      />
      {/* Fallback if panel is closed but route is still active */}
      {!isOpen && (
        <div className="flex items-center justify-center h-full text-[var(--muted-foreground)] text-sm">
          Redirecting...
        </div>
      )}
    </div>
  );
}
