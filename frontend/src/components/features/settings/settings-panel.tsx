"use client";

import { X, User, ChevronRight, Bell, Settings2, Command, PlaySquare, FileCode, Bot, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState("account");

  if (!isOpen) return null;

  const sidebarGroups = [
    {
      title: "",
      items: [
        { id: "account", label: "Account" },
      ]
    },
    {
      title: "GLOBAL",
      items: [
        { id: "agent", label: "Agent" },
        { id: "browser", label: "Browser" },
        { id: "notifications", label: "Notifications" },
        { id: "models", label: "Models" },
        { id: "customizations", label: "Customizations" },
        { id: "tab", label: "Tab" },
        { id: "editor", label: "Editor" },
        { id: "mcp", label: "MCP Plugins" },
        { id: "audit", label: "Audit Log (Credits)" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-5xl h-[80vh] bg-[#1E1E1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-center relative bg-[#1E1E1E]">
          <h2 className="text-sm font-medium text-white/70">Settings - Account</h2>
          <button 
            onClick={onClose}
            className="absolute right-4 p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[240px] bg-[#1a1a1a] border-r border-white/5 p-3 flex flex-col gap-6 overflow-y-auto">
            {sidebarGroups.map((group, i) => (
              <div key={i} className="flex flex-col gap-1">
                {group.title && (
                  <span className="text-[10px] font-bold text-white/30 tracking-wider px-3 mb-1 uppercase">
                    {group.title}
                  </span>
                )}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === item.id 
                        ? "bg-white/10 text-white font-medium" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-[#1E1E1E] p-8 overflow-y-auto">
            {activeTab === "account" && (
              <div className="max-w-2xl mx-auto space-y-10">
                {/* General Section */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-4">General</h3>
                  
                  <div className="border border-white/5 rounded-xl divide-y divide-white/5 bg-white/[0.02]">
                    <div className="p-4 flex items-center justify-between">
                      <div className="pr-12">
                        <div className="text-sm font-medium text-white/90">Enable Telemetry</div>
                        <div className="text-xs text-white/50 mt-1 leading-relaxed">
                          When toggled on, Antigravity collects usage data to help Google enhance performance and features.
                        </div>
                      </div>
                      <button className="w-10 h-6 shrink-0 bg-[#3f3f3f] rounded-full relative transition-colors cursor-pointer focus:outline-none">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
                      </button>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="pr-12">
                        <div className="text-sm font-medium text-white/90">Marketing Emails</div>
                        <div className="text-xs text-white/50 mt-1 leading-relaxed">
                          Receive product updates, tips, and promotions from Google Antigravity via email.
                        </div>
                      </div>
                      <button className="w-10 h-6 shrink-0 bg-[#3f3f3f] rounded-full relative transition-colors cursor-pointer focus:outline-none">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Account Section */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-4">Account</h3>
                  
                  <div className="border border-white/5 rounded-xl divide-y divide-white/5 bg-white/[0.02]">
                    <div className="p-4 flex items-center justify-between">
                      <div className="pr-12">
                        <div className="text-sm font-medium text-white/90">Your Plan: Google AI Pro</div>
                        <div className="text-xs text-white/50 mt-1 leading-relaxed">
                          You can upgrade to the Google AI Ultra plan to receive the highest rate limits.
                        </div>
                      </div>
                      <button className="px-5 py-2 shrink-0 bg-[#333333] hover:bg-[#444444] text-white/90 text-sm font-medium rounded-lg transition-colors border border-white/10">
                        Upgrade
                      </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white/90">Email</div>
                        <div className="text-xs text-white/50 mt-1">user@example.com</div>
                      </div>
                      <button className="px-5 py-2 shrink-0 bg-[#333333] hover:bg-[#402020] text-white/90 text-sm font-medium rounded-lg transition-colors border border-white/10">
                        Sign out
                      </button>
                    </div>
                  </div>
                </section>

                <div className="text-xs text-white/30 text-center pt-8">
                  By using this app, you agree to its <a href="#" className="underline hover:text-white/50">Terms of Service</a>
                </div>
              </div>
            )}
            
            {activeTab === "audit" && (
              <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="text-xs font-bold text-white/40 tracking-wider uppercase mb-4">Audit Log & Credits</h3>
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl mb-6">
                  <div className="text-2xl font-bold text-white">482 <span className="text-sm text-white/50 font-normal">Credits Remaining</span></div>
                </div>
                <div className="border border-white/5 rounded-xl divide-y divide-white/5 bg-white/[0.02]">
                  {[1, 2, 3, 4, 5].map((i) => (
                     <div key={i} className="p-4 flex justify-between items-center text-sm">
                       <span className="text-white/80">Architecture Block Generated</span>
                       <span className="text-[var(--primary-accent)]">-5 CR</span>
                     </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab !== "account" && activeTab !== "audit" && (
              <div className="max-w-2xl mx-auto flex items-center justify-center h-full text-white/30 text-sm">
                Configuration for {activeTab} will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
