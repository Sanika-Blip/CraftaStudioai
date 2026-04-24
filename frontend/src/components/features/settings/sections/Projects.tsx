"use client";

import { useState } from "react";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-6 shrink-0 rounded-full relative transition-colors duration-200 cursor-pointer focus:outline-none ${
        enabled ? "bg-[var(--primary-accent)]" : "bg-[var(--muted)]"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
          enabled ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

const regions = [
  { id: "us-east-1", label: "US East (N. Virginia)" },
  { id: "us-west-2", label: "US West (Oregon)" },
  { id: "eu-west-1", label: "EU West (Ireland)" },
  { id: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { id: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
];

export function ProjectsSection() {
  const [selectedRegion, setSelectedRegion] = useState("us-east-1");
  const [autoSync, setAutoSync] = useState(true);
  const [gitIntegration, setGitIntegration] = useState(false);
  const [syncInterval, setSyncInterval] = useState("5");

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Default Region */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--muted-foreground)] tracking-wider uppercase mb-4">Default Region</h3>
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--muted-foreground)] mb-3">
            Select the default deployment region for new projects.
          </div>
          <div className="grid grid-cols-1 gap-2">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`p-3 rounded-lg text-left text-sm transition-all border ${
                  selectedRegion === region.id
                    ? "border-[var(--primary-accent)] bg-[var(--primary-accent)]/10 text-[var(--foreground)]"
                    : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary-accent)]/30 hover:bg-[var(--primary-accent)]/5"
                }`}
              >
                <span className="font-medium">{region.label}</span>
                <span className="text-xs opacity-60 ml-2 font-mono">{region.id}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sync Settings */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--muted-foreground)] tracking-wider uppercase mb-4">Sync & Storage</h3>
        <div className="border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] bg-[var(--surface)]">
          <div className="p-4 flex items-center justify-between">
            <div className="pr-12">
              <div className="text-sm font-medium text-[var(--foreground)]">Auto-Sync Projects</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Automatically save and sync project changes to the cloud.
              </div>
            </div>
            <Toggle enabled={autoSync} onToggle={() => setAutoSync(!autoSync)} />
          </div>

          {autoSync && (
            <div className="p-4">
              <div className="text-sm font-medium text-[var(--foreground)] mb-2">Sync Interval</div>
              <div className="flex gap-2">
                {["1", "5", "15", "30"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSyncInterval(val)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      syncInterval === val
                        ? "border-[var(--primary-accent)] bg-[var(--primary-accent)]/10 text-[var(--primary-accent)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary-accent)]/30"
                    }`}
                  >
                    {val}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Git Integration */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--muted-foreground)] tracking-wider uppercase mb-4">Version Control</h3>
        <div className="border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] bg-[var(--surface)]">
          <div className="p-4 flex items-center justify-between">
            <div className="pr-12">
              <div className="text-sm font-medium text-[var(--foreground)]">Git Integration</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Enable automatic Git commits when the AI generates or modifies code.
              </div>
            </div>
            <Toggle enabled={gitIntegration} onToggle={() => setGitIntegration(!gitIntegration)} />
          </div>
        </div>
      </section>
    </div>
  );
}
