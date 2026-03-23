// CraftaStudio — src/app/canvas/page.tsx
'use client'

import { TopBar } from '@/components/canvas/TopBar'
import { BottomBar } from '@/components/canvas/BottomBar'

/**
 * CanvasPage — the main workspace of CraftaStudio.
 *
 * Layout (3-panel):
 *   ┌──────────────────────────────────────┐
 *   │              TopBar                  │
 *   ├────────────┬─────────────────────────┤
 *   │  Sidebar   │    React Flow Canvas    │
 *   │  (future)  │                         │
 *   ├────────────┴─────────────────────────┤
 *   │              BottomBar               │
 *   └──────────────────────────────────────┘
 *
 * The actual flow nodes (BlockNode, PlannerNode, MergeEngineNode)
 * will be mounted inside the canvas area once the flow store is wired.
 */
export default function CanvasPage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[hsl(var(--color-canvas-bg))]">
      {/* Top navigation & run controls */}
      <TopBar />

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">
        {/* TODO: Sidebar panel (block palette) */}
        <aside className="w-64 shrink-0 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
          <p className="text-xs text-muted uppercase tracking-widest font-semibold">
            Block Palette
          </p>
          <p className="mt-2 text-xs text-[hsl(var(--color-text-muted))]">
            Coming soon — drag blocks onto the canvas
          </p>
        </aside>

        {/* Canvas area — React Flow will mount here */}
        <section className="flex-1 relative" id="canvas-area">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold text-[hsl(var(--color-text-secondary))]">
                CraftaStudio Canvas
              </p>
              <p className="text-sm text-[hsl(var(--color-text-muted))]">
                React Flow will render here — architecture blocks coming soon
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Status bar */}
      <BottomBar />
    </div>
  )
}
