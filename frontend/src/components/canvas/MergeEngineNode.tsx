// CraftaStudio — src/components/canvas/MergeEngineNode.tsx
'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

/** Data shape for the Merge Engine terminal node */
export interface MergeEngineNodeData {
  status: 'idle' | 'merging' | 'done' | 'error'
  /** Number of block outputs successfully merged */
  mergedCount: number
  /** Total tokens consumed across all agents */
  totalTokens: number
  /** Download URL for the generated ZIP archive — null until done */
  downloadUrl: string | null
}

/**
 * MergeEngineNode — the terminal node in the CraftaStudio workflow.
 *
 * Responsibilities:
 *  - Collect all BlockOutput payloads from parallel agents
 *  - Merge them into a consistent codebase via the /merge endpoint
 *  - Produce a downloadable ZIP containing all generated files
 *
 * @param props - Node props with MergeEngineNodeData
 */
function MergeEngineNodeComponent({
  data,
  selected,
}: NodeProps<MergeEngineNodeData>) {
  const { status, mergedCount, totalTokens, downloadUrl } = data

  return (
    <div
      className={`
        relative w-56 rounded-xl overflow-hidden
        border-2 transition-all duration-200
        bg-[hsl(var(--color-surface-raised))]
        ${selected
          ? 'border-[hsl(var(--color-primary))]'
          : 'border-[hsl(var(--color-border))]'}
        ${status === 'merging'
          ? 'ring-2 ring-[hsl(var(--color-primary)/0.4)] animate-pulse'
          : ''}
      `}
      role="group"
      aria-label="Merge Engine node"
    >
      {/* Header */}
      <div className="bg-[hsl(var(--color-primary)/0.12)] px-3 py-2 flex items-center gap-2">
        <span className="text-sm">⚙️</span>
        <span className="text-xs font-bold text-[hsl(var(--color-primary))] uppercase tracking-wider">
          Merge Engine
        </span>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-center">
          <StatCell label="Blocks" value={mergedCount} />
          <StatCell label="Tokens" value={totalTokens.toLocaleString()} />
        </div>

        {/* Status */}
        <StatusPill status={status} />

        {/* Download button — only when done and URL is available */}
        {status === 'done' && downloadUrl && (
          <a
            href={downloadUrl}
            download="craftastudio-output.zip"
            id="btn-download-zip"
            className="
              mt-1 w-full flex items-center justify-center gap-1.5
              py-1.5 rounded text-xs font-semibold
              bg-[hsl(var(--color-success)/0.15)] text-[hsl(var(--color-success))]
              hover:bg-[hsl(var(--color-success)/0.25)] transition-colors
            "
          >
            ⬇ Download ZIP
          </a>
        )}
      </div>

      {/* Input handle — receives from all Block nodes */}
      <Handle
        type="target"
        position={Position.Left}
        id="results"
        className="!w-3 !h-3 !bg-[hsl(var(--color-primary))] !border-[hsl(var(--color-surface))]"
      />
    </div>
  )
}

/** Labelled value cell for the stats grid */
function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[hsl(var(--color-surface-overlay))] rounded p-1.5">
      <p className="text-[10px] text-[hsl(var(--color-text-muted))]">{label}</p>
      <p className="text-sm font-bold text-[hsl(var(--color-text-primary))]">
        {value}
      </p>
    </div>
  )
}

/** Coloured status pill */
function StatusPill({ status }: { status: MergeEngineNodeData['status'] }) {
  const config = {
    idle:    { label: 'Waiting',   bg: 'hsl(var(--color-border))',       text: 'hsl(var(--color-text-muted))' },
    merging: { label: 'Merging…',  bg: 'hsl(var(--color-info)/0.2)',     text: 'hsl(var(--color-info))' },
    done:    { label: 'Complete',  bg: 'hsl(var(--color-success)/0.2)',  text: 'hsl(var(--color-success))' },
    error:   { label: 'Error',     bg: 'hsl(var(--color-error)/0.2)',    text: 'hsl(var(--color-error))' },
  }[status]

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}

export const MergeEngineNode = memo(MergeEngineNodeComponent)
