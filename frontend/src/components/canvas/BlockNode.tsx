// CraftaStudio — src/components/canvas/BlockNode.tsx
'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { BlockType } from '@shared/types/blocks'

/** Data shape stored on each React Flow Block node */
export interface BlockNodeData {
  blockType: BlockType
  label: string
  version: string
  /** Whether this block is currently being generated */
  isGenerating?: boolean
}

/** Maps block type to its accent colour CSS variable */
const BLOCK_COLOUR: Record<BlockType, string> = {
  data:        'var(--color-block-data)',
  api:         'var(--color-block-api)',
  ui:          'var(--color-block-ui)',
  service:     'var(--color-block-service)',
  integration: 'var(--color-block-integration)',
  auth:        'var(--color-block-auth)',
  job:         'var(--color-block-job)',
}

/**
 * BlockNode — a React Flow custom node representing one architectural block.
 *
 * Each block has:
 *  - A coloured top strip indicating its type
 *  - Input/output connection handles
 *  - A pulsing shimmer while the AI is generating its output
 *
 * @param props - Standard React Flow NodeProps augmented with BlockNodeData
 */
function BlockNodeComponent({ data, selected }: NodeProps<BlockNodeData>) {
  const { blockType, label, version, isGenerating = false } = data
  const accentColor = `hsl(${BLOCK_COLOUR[blockType]})`

  return (
    <div
      className={`
        relative w-48 rounded-lg overflow-hidden
        border transition-all duration-200
        ${selected
          ? 'border-[hsl(var(--color-primary))] shadow-lg shadow-[hsl(var(--color-primary)/0.3)]'
          : 'border-[hsl(var(--color-border))]'}
        bg-[hsl(var(--color-surface-raised))]
      `}
      role="group"
      aria-label={`${blockType} block: ${label}`}
    >
      {/* Generating shimmer overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] z-10 pointer-events-none" />
      )}

      {/* Coloured type stripe */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="p-3 space-y-1">
        {/* Type badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {blockType}
        </span>

        {/* Block name */}
        <p className="text-sm font-semibold text-[hsl(var(--color-text-primary))] truncate">
          {label}
        </p>

        {/* Version */}
        <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
          v{version}
        </p>
      </div>

      {/* React Flow connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-2.5 !h-2.5 !bg-[hsl(var(--color-border))] !border-[hsl(var(--color-surface))]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-2.5 !h-2.5 !bg-[hsl(var(--color-border))] !border-[hsl(var(--color-surface))]"
      />
    </div>
  )
}

/** Memoised to prevent re-render when unrelated flow state changes */
export const BlockNode = memo(BlockNodeComponent)
