// CraftaStudio — src/components/canvas/TopBar.tsx
'use client'

/**
 * TopBar — fixed navigation bar at the top of the canvas workspace.
 *
 * Responsibilities:
 *  - Display the project name and logo
 *  - Expose the "Run Workflow" trigger button
 *  - Show current connection status (backend / agents)
 *
 * @todo Wire to useWorkflowStore for run state management
 * @todo Integrate Clerk UserButton for profile menu
 */
export function TopBar() {
  return (
    <header
      className="
        h-14 shrink-0
        flex items-center justify-between
        px-4 gap-4
        bg-[hsl(var(--color-surface))]
        border-b border-[hsl(var(--color-border))]
        z-10
      "
      role="banner"
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded bg-[hsl(var(--color-primary))] flex items-center justify-center text-xs font-bold text-white">
          C
        </span>
        <span className="font-semibold text-sm tracking-tight">
          CraftaStudio
        </span>
      </div>

      {/* Centre — project breadcrumb placeholder */}
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-[hsl(var(--color-text-muted))]">
          Untitled Project
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* TODO: Replace with <UserButton /> from @clerk/nextjs */}
        <button
          id="btn-run-workflow"
          type="button"
          className="
            px-3 py-1.5 rounded text-xs font-semibold
            bg-[hsl(var(--color-primary))] text-white
            hover:brightness-110 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Run AI workflow"
          disabled
        >
          ▶ Run
        </button>
      </div>
    </header>
  )
}
