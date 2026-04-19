// CraftaStudio — src/components/canvas/PlannerNode.tsx
'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

/** Data shape for the Planner orchestrator node */
export interface PlannerNodeData {
  prompt: string
  /** Number of downstream block agents spawned */
  agentCount: number
  status: 'idle' | 'planning' | 'done' | 'error'
}

/**
 * PlannerNode — the root/entry node of every CraftaStudio workflow.
 *
 * The Planner receives the user's natural-language prompt,
 * calls the Python /plan endpoint, and emits tasks to all
 * downstream Block agents.
 *
 * Visual cues:
 *  - Pulsing violet ring while planning is in progress
 *  - Agent count badge shows how many parallel tasks were spawned
 *
 * @param props - Node props with PlannerNodeData
 */
function PlannerNodeComponent({ data, selected }: NodeProps<PlannerNodeData>) {
  const { prompt, agentCount, status } = data

  return (
    <div
      className={`
        relative w-56 rounded-xl overflow-hidden
        border-2 transition-all duration-200
        bg-[hsl(var(--color-surface-raised))]
        ${selected ? 'border-[hsl(var(--color-accent))]' : 'border-[hsl(var(--color-border))]'}
        ${status === 'planning' ? 'ring-2 ring-[hsl(var(--color-accent)/0.5)] animate-pulse' : ''}
      `}
      role="group"
      aria-label="Planner AI node"
    >
      {/* Header */}
      <div className="bg-[hsl(var(--color-accent)/0.15)] px-3 py-2 flex items-center gap-2">
        <span className="text-[hsl(var(--color-accent))] text-sm">🧠</span>
        <span className="text-xs font-bold text-[hsl(var(--color-accent))] uppercase tracking-wider">
          Planner AI
        </span>
      </div>

      {/* Prompt preview */}
      <div className="p-3 space-y-2">
        <p className="text-xs text-[hsl(var(--color-text-secondary))] line-clamp-3 leading-relaxed">
          {prompt || 'No prompt set — double-click to edit'}
        </p>

        {/* Agent spawn count */}
        {agentCount > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-4 h-4 rounded-full bg-[hsl(var(--color-accent)/0.2)] flex items-center justify-center text-[9px] font-bold text-[hsl(var(--color-accent))]">
              {agentCount}
            </span>
            <span className="text-[10px] text-[hsl(var(--color-text-muted))]">
              agents queued
            </span>
          </div>
        )}

        {/* Status badge */}
        <StatusPill status={status} />
      </div>

      {/* Output handle — connects to Block nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="tasks"
        className="!w-3 !h-3 !bg-[hsl(var(--color-accent))] !border-[hsl(var(--color-surface))]"
      />
    </div>
  )
}

/** Coloured status pill component */
function StatusPill({ status }: { status: PlannerNodeData['status'] }) {
  const config = {
    idle:     { label: 'Idle',     bg: 'hsl(var(--color-border))',   text: 'hsl(var(--color-text-muted))' },
    planning: { label: 'Planning…',bg: 'hsl(var(--color-warning)/0.2)', text: 'hsl(var(--color-warning))' },
    done:     { label: 'Done',     bg: 'hsl(var(--color-success)/0.2)', text: 'hsl(var(--color-success))' },
    error:    { label: 'Error',    bg: 'hsl(var(--color-error)/0.2)',   text: 'hsl(var(--color-error))' },
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

export const PlannerNode = memo(PlannerNodeComponent)
