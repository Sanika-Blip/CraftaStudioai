"use client";

import { 
  Globe, 
  RotateCw, 
  ExternalLink, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Plus,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PreviewTab() {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isRunning, setIsRunning] = useState(false);

  const viewportWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[390px]"
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] pt-2 px-2 pb-2">
      {/* Browser Main Window Shell */}
      <div className="flex-1 flex flex-col bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Browser Top Bar (Tabs & Address) */}
        <div className="bg-[#18181b] border-b border-[#27272a] flex flex-col shrink-0">
          
          {/* Traffic Lights & Tabs Row */}
          <div className="h-10 flex items-center px-4 gap-4">
             {/* Traffic Lights */}
             <div className="flex items-center gap-1.5 w-16">
                <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                <div className="size-2.5 rounded-full bg-[#febc2e]" />
                <div className="size-2.5 rounded-full bg-[#28c840]" />
             </div>

             {/* Browser Tab */}
             <div className="h-8 px-4 bg-[#27272a]/50 border-t border-x border-[#3f3f46] rounded-t-lg flex items-center gap-2 min-w-[160px] translate-y-[1px]">
                <Globe size={12} className="text-[#FD572D]" />
                <span className="text-[10px] font-medium text-[#e4e4e7] truncate tracking-tight">CraftaStudio App</span>
             </div>

             <button className="size-6 flex items-center justify-center rounded-md hover:bg-[#27272a] text-[#71717a] transition-colors">
                <Plus size={14} />
             </button>

             {/* Viewport Controls */}
             <div className="ml-auto flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-[#27272a]">
                <button 
                  onClick={() => setViewport("desktop")}
                  className={cn("p-1 rounded transition-all", viewport === "desktop" ? "bg-[#27272a] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Monitor size={14} />
                </button>
                <button 
                  onClick={() => setViewport("tablet")}
                  className={cn("p-1 rounded transition-all", viewport === "tablet" ? "bg-[#27272a] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Tablet size={14} />
                </button>
                <button 
                  onClick={() => setViewport("mobile")}
                  className={cn("p-1 rounded transition-all", viewport === "mobile" ? "bg-[#27272a] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Smartphone size={14} />
                </button>
             </div>
          </div>

          {/* Address Bar Row */}
          <div className="h-10 border-t border-[#27272a] flex items-center px-4 gap-4 bg-[#1c1c1f]">
             <div className="flex items-center gap-2 text-[#a1a1aa]">
                <ChevronLeft size={16} className="opacity-50" />
                <ChevronRight size={16} className="opacity-50" />
                <RotateCw size={14} className="ml-2 hover:text-white cursor-pointer transition-colors" />
             </div>

             <div className="flex-1 flex items-center h-7 bg-black/40 border border-[#27272a] rounded-full px-4 gap-2 flex-shrink min-w-0">
                <ShieldCheck size={12} className="text-[#28c840] shrink-0" />
                <span className="text-[11px] font-mono text-[#a1a1aa] truncate flex-shrink">
                  https://<span className="text-white">craftastudio-deploy</span>.vercel.app
                </span>
             </div>

             <div className="flex items-center gap-3">
                <ExternalLink size={14} className="text-[#a1a1aa] hover:text-white cursor-pointer transition-colors" />
                <Maximize2 size={13} className="text-[#a1a1aa] hover:text-white cursor-pointer transition-colors" />
             </div>
          </div>
        </div>

        {/* Viewport Container */}
        <div className="flex-1 flex justify-center bg-[#09090b] relative overflow-auto p-4 scrollbar-hide">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[var(--background)]" />

          <div className={cn(
            "h-full transition-all duration-500 ease-[0.32, 0.72, 0, 1] relative shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex flex-col bg-white rounded-md overflow-hidden shrink-0",
            viewportWidths[viewport],
            !isRunning && "bg-[#18181b]"
          )}>
            {!isRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="relative group cursor-pointer" onClick={() => setIsRunning(true)}>
                  {/* Glowing Ring */}
                  <div className="absolute -inset-4 bg-[#FD572D]/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="w-20 h-20 rounded-full bg-[#1c1c1f] border border-[#FD572D]/30 flex items-center justify-center shadow-2xl transition-transform group-active:scale-90 duration-200">
                    <Play className="size-8 text-[#FD572D] fill-[#FD572D] ml-1" />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-2">
                  <h3 className="text-[15px] font-bold text-white tracking-tight uppercase">Development Engine Offline</h3>
                  <p className="text-[12px] text-zinc-500 max-w-[200px] leading-relaxed">
                    Ready to build? Click start to boot up the edge runtime.
                  </p>
                </div>

                {/* Loading Status Decoration */}
                <div className="mt-12 flex items-center gap-6">
                  {["API", "DB", "AUTH", "UI"].map(label => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className="size-1 rounded-full bg-zinc-800" />
                      <span className="text-[8px] font-black text-zinc-600 font-mono">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-10 items-center justify-center bg-white text-black text-center">
                 {/* Real website-like mockup content */}
                 <div className="w-12 h-12 bg-[#09090b] rounded-xl flex items-center justify-center mb-6">
                    <div className="size-6 border-2 border-[#FD572D] rounded-full" />
                 </div>
                 <h1 className="text-3xl font-black tracking-tight mb-2">Hello World</h1>
                 <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">Your application is live and running on the Vercel edge network.</p>
                 <div className="mt-8 flex gap-3">
                    <div className="h-8 px-6 bg-black text-white text-[10px] font-bold rounded flex items-center cursor-not-allowed">GET STARTED</div>
                    <div className="h-8 px-6 border border-zinc-200 text-[10px] font-bold rounded flex items-center cursor-not-allowed">DOCS</div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
