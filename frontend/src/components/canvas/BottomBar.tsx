// CraftaStudio — src/components/canvas/BottomBar.tsx
'use client'

/**
 * BottomBar — status strip fixed at the bottom of the canvas workspace.
 *
 * Responsibilities:
 *  - Display agent status badges (idle / running / error)
 *  - Show token usage summary from the last run
 *  - Provide quick-access zoom controls
 *
 * @todo Wire to useWorkflowStore for live agent statuses
 * @todo Add zoom-to-fit button for React Flow viewport
 */
export function BottomBar() {
  return (
    <footer
      className="
        h-10 shrink-0
        flex items-center justify-between
        px-4 gap-4
        bg-[hsl(var(--color-surface))]
        border-t border-[hsl(var(--color-border))]
        text-xs text-[hsl(var(--color-text-muted))]
        z-10
      "
      role="contentinfo"
    >
      {/* Left — agent status indicators */}
      <div className="flex items-center gap-3">
        <StatusBadge label="Planner" status="idle" />
        <StatusBadge label="Backend" status="idle" />
        <StatusBadge label="Frontend" status="idle" />
        <StatusBadge label="DB" status="idle" />
      </div>

      {/* Right — token usage */}
      <div className="flex items-center gap-4">
        <span>Tokens: —</span>
        <span className="text-[hsl(var(--color-border)/1)]">|</span>
        <span>Ready</span>
      </div>
    </footer>
  )
}

/** Agent status badge colours */
type AgentStatus = 'idle' | 'running' | 'done' | 'error'

const STATUS_COLOUR: Record<AgentStatus, string> = {
  idle:    'bg-[hsl(var(--color-border))]',
  running: 'bg-[hsl(var(--color-warning))]',
  done:    'bg-[hsl(var(--color-success))]',
  error:   'bg-[hsl(var(--color-error))]',
}

/**
 * Small coloured dot + label for showing per-agent running state.
 */
function StatusBadge({ label, status }: { label: string; status: AgentStatus }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOUR[status]}`}
        aria-label={`${label} status: ${status}`}
      />
      {label}
    </span>
  )
}
