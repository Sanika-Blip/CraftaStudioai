/**
 * Steps 6-7: Deduplication + Merge → Storage
 *
 * IF key not exists → insert
 * IF same value    → increase confidence (max 1.0)
 * IF diff value    → override + version++
 */

import prisma from '../lib/prisma'
import { MemorySource } from '@prisma/client'
import { extractSignals, ExtractedSignal } from './memoryExtractor'

// ── Upsert single signal ───────────────────────────────────────────────────────
export async function upsertMemory(
  projectId: string,
  signal: ExtractedSignal,
): Promise<void> {
  const existing = await prisma.memory.findUnique({
    where: { projectId_key: { projectId, key: signal.key } },
  })

  if (!existing) {
    // INSERT — new signal
    await prisma.memory.create({
      data: {
        projectId,
        key: signal.key,
        value: { data: signal.value } as any,
        type: signal.type,
        priority: signal.priority,
        source: signal.source,
        confidence: 0.6,
        version: 1,
      },
    })
    console.log(`[memory] INSERT key=${signal.key} value=${signal.value}`)
    return
  }

  const existingValue = (existing.value as any)?.data
  const isSameValue = String(existingValue).toLowerCase() === String(signal.value).toLowerCase()

  if (isSameValue) {
    // SAME VALUE → boost confidence (cap at 1.0)
    const newConfidence = Math.min(existing.confidence + 0.1, 1.0)
    await prisma.memory.update({
      where: { projectId_key: { projectId, key: signal.key } },
      data: {
        confidence: newConfidence,
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })
    console.log(`[memory] BOOST key=${signal.key} confidence=${newConfidence.toFixed(2)}`)
  } else {
    // DIFFERENT VALUE → override + version++
    await prisma.memory.update({
      where: { projectId_key: { projectId, key: signal.key } },
      data: {
        value: { data: signal.value } as any,
        type: signal.type,
        priority: signal.priority,
        source: signal.source,
        confidence: 0.6,
        version: { increment: 1 },
        isConflict: true,
        updatedAt: new Date(),
      },
    })
    console.log(`[memory] OVERRIDE key=${signal.key} old=${existingValue} new=${signal.value}`)
  }
}

// ── Process a full prompt string ───────────────────────────────────────────────
export async function processAndStoreMemory(
  projectId: string,
  input: string,
  source: MemorySource = 'user',
): Promise<ExtractedSignal[]> {
  const signals = extractSignals(input, source)

  if (signals.length === 0) {
    console.log(`[memory] No actionable signals found in input`)
    return []
  }

  console.log(`[memory] Processing ${signals.length} signals for project ${projectId}`)

  await Promise.all(signals.map(s => upsertMemory(projectId, s)))

  return signals
}

// ── Capture signals from block output (Step 11: Post-Execution Learning) ───────
export async function captureOutputSignals(
  projectId: string,
  outputCode: string,
  blockType: string,
): Promise<void> {
  // Infer signals from generated code
  const inferredSignals: ExtractedSignal[] = []

  if (/prisma/i.test(outputCode)) {
    inferredSignals.push({
      key: 'orm', value: 'prisma',
      type: 'architecture_decision', priority: 'high', source: 'inferred',
    })
  }
  if (/fastify/i.test(outputCode)) {
    inferredSignals.push({
      key: 'framework', value: 'fastify',
      type: 'architecture_decision', priority: 'high', source: 'inferred',
    })
  }
  if (/tailwind/i.test(outputCode)) {
    inferredSignals.push({
      key: 'styling', value: 'tailwindcss',
      type: 'preference', priority: 'medium', source: 'inferred',
    })
  }
  if (/useState|useEffect|react/i.test(outputCode)) {
    inferredSignals.push({
      key: 'framework', value: 'react',
      type: 'architecture_decision', priority: 'high', source: 'inferred',
    })
  }

  if (inferredSignals.length > 0) {
    console.log(`[memory] Capturing ${inferredSignals.length} inferred signals from ${blockType} output`)
    await Promise.all(inferredSignals.map(s => upsertMemory(projectId, s)))
  }
}