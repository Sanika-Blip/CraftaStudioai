/**
 * Steps 2-5: Signal Detection → Classification → Normalization → Validation
 * Extracts engineering signals from user prompt, classifies by MemoryType,
 * normalizes aliases to canonical values, filters vague signals.
 */

import { MemoryType, Priority, MemorySource } from '@prisma/client'

export interface ExtractedSignal {
  key: string
  value: unknown
  type: MemoryType
  priority: Priority
  source: MemorySource
}

// ── Normalization Map ──────────────────────────────────────────────────────────
const NORMALIZATION_MAP: Record<string, string> = {
  pg: 'postgresql', postgres: 'postgresql', mongo: 'mongodb',
  'mongo db': 'mongodb', ts: 'typescript', js: 'javascript',
  'next.js': 'nextjs', next: 'nextjs', 'nest.js': 'nestjs', nest: 'nestjs',
  'clerk auth': 'clerk', 'next auth': 'nextauth', jwt: 'jwt',
  tailwind: 'tailwindcss', 'tailwind css': 'tailwindcss',
}

export function normalizeValue(value: string): string {
  const lower = value.toLowerCase().trim()
  return NORMALIZATION_MAP[lower] ?? lower
}

// ── Signal Patterns ────────────────────────────────────────────────────────────
interface SignalPattern {
  pattern: RegExp
  key: string
  type: MemoryType
  priority: Priority
  extract: (match: RegExpMatchArray) => string
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  // Database
  {
    pattern: /(?:use|using|with|database[:\s]+)\s*(postgresql|postgres|pg|mongodb|mongo|mysql|sqlite|supabase|neon|planetscale)/i,
    key: 'database', type: 'architecture_decision', priority: 'high',
    extract: m => normalizeValue(m[1]),
  },
  // Auth
  {
    pattern: /(?:use|using|auth(?:entication)?[:\s]+)\s*(clerk|jwt|nextauth|auth0|firebase|supabase auth)/i,
    key: 'auth_provider', type: 'architecture_decision', priority: 'high',
    extract: m => normalizeValue(m[1]),
  },
  // Framework
  {
    pattern: /(?:use|using|built with|framework[:\s]+)\s*(next\.?js|react|vue|svelte|fastify|express|nest\.?js)/i,
    key: 'framework', type: 'architecture_decision', priority: 'high',
    extract: m => normalizeValue(m[1]),
  },
  // Language
  {
    pattern: /(?:language[:\s]+|written in|use)\s*(typescript|javascript|python|ts|js)/i,
    key: 'language', type: 'preference', priority: 'medium',
    extract: m => normalizeValue(m[1]),
  },
  // ORM
  {
    pattern: /(?:use|orm[:\s]+)\s*(prisma|drizzle|typeorm|sequelize|mongoose)/i,
    key: 'orm', type: 'architecture_decision', priority: 'high',
    extract: m => normalizeValue(m[1]),
  },
  // Styling
  {
    pattern: /(?:use|styling[:\s]+|css[:\s]+)\s*(tailwind(?:css)?|styled-components|css modules|scss|sass)/i,
    key: 'styling', type: 'preference', priority: 'medium',
    extract: m => normalizeValue(m[1]),
  },
  // API style
  {
    pattern: /(?:use|build|create)\s+(rest(?:ful)?|graphql|trpc|grpc)\s+api/i,
    key: 'api_style', type: 'architecture_decision', priority: 'high',
    extract: m => normalizeValue(m[1]),
  },
  // Cache / Queue
  {
    pattern: /(?:use|with)\s+(redis|memcached|upstash)\s*(?:for\s+(?:cache|caching|queue))?/i,
    key: 'cache_provider', type: 'architecture_decision', priority: 'medium',
    extract: m => normalizeValue(m[1]),
  },
  // Hosting
  {
    pattern: /(?:deploy|host|hosting)\s+(?:on|to|with)\s+(vercel|railway|render|aws|gcp|azure|fly\.io)/i,
    key: 'hosting', type: 'constraint', priority: 'medium',
    extract: m => normalizeValue(m[1]),
  },
  // File storage
  {
    pattern: /(?:use|store files|upload to)\s+(s3|r2|cloudflare r2|supabase storage|uploadthing)/i,
    key: 'file_storage', type: 'architecture_decision', priority: 'medium',
    extract: m => normalizeValue(m[1]),
  },
  // Performance
  {
    pattern: /(?:must be|should be|needs to be)\s+(fast|performant|optimized|lightweight)/i,
    key: 'performance_requirement', type: 'constraint', priority: 'medium',
    extract: m => m[1].toLowerCase(),
  },
  // Mobile / responsive
  {
    pattern: /(?:mobile[- ]first|responsive design|support mobile)/i,
    key: 'responsive_design', type: 'constraint', priority: 'medium',
    extract: () => 'required',
  },
]

// ── Validation ─────────────────────────────────────────────────────────────────
const VAGUE_VALUES = new Set([
  'good', 'better', 'best', 'nice', 'clean', 'simple', 'easy',
  'modern', 'standard', 'normal', 'default', 'basic', 'advanced',
])

function isActionable(signal: ExtractedSignal): boolean {
  const val = String(signal.value).toLowerCase().trim()
  if (val.length < 2) return false
  if (VAGUE_VALUES.has(val)) return false
  return true
}

// ── Main Extractor ─────────────────────────────────────────────────────────────
export function extractSignals(
  input: string,
  source: MemorySource = 'user',
): ExtractedSignal[] {
  const signals: ExtractedSignal[] = []
  const seenKeys = new Set<string>()

  for (const sp of SIGNAL_PATTERNS) {
    const match = input.match(sp.pattern)
    if (match && !seenKeys.has(sp.key)) {
      const signal: ExtractedSignal = {
        key: sp.key,
        value: sp.extract(match),
        type: sp.type,
        priority: sp.priority,
        source,
      }
      if (isActionable(signal)) {
        signals.push(signal)
        seenKeys.add(sp.key)
      }
    }
  }

  return signals
}