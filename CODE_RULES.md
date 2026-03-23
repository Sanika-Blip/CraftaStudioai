# CraftaStudio — Code Rules

These are not suggestions. Every piece of code merged into this repository must follow these rules. PRs that violate them will not be approved.

---

## TypeScript Rules

### Strict Mode — Always On
Every TypeScript file must run with strict mode. Both `tsconfig.json` files (frontend and backend) have `"strict": true`. Do not disable it. Do not add `// @ts-ignore` without written justification.

### No `any` Types
```typescript
// ❌ Not allowed
function process(data: any) { ... }

// ✅ Required
function process(data: BlockOutput) { ... }
// or if shape is truly unknown:
function process(data: Record<string, unknown>) { ... }
```

### No Type Assertions Without Proof
```typescript
// ❌ Not allowed
const id = (req.params as any).id

// ✅ Required
const { id } = req.params as { id: string }
// Only after you have validated the shape with Zod
```

---

## Shared Types — Sacred Contract

`shared/types/blocks.ts` is the contract between frontend, backend, and agents.

- **Never modify it without Pranav's approval**
- Import types from it — don't redefine them locally
- If you need a new type, discuss first

```typescript
// ✅ Import from shared
import type { BlockType, SharedContext } from '@shared/types/blocks'

// ❌ Never redefine locally
type BlockType = 'data' | 'api' // WRONG
```

---

## No `console.log` in Final Code

`console.log` is for development debugging only. Remove it before opening a PR.

```typescript
// ❌ Not allowed in merged code
console.log('block data:', block)

// ✅ Use Fastify logger in backend
req.log.info({ blockId: block.id }, 'Block fetched')

// ✅ Use proper error boundaries in frontend — don't log silently
```

Linting will catch most of these. If you find one in existing code, fix it and note it in your PR.

---

## No Hardcoded Values

```typescript
// ❌ Not allowed
const model = 'claude-sonnet-4-5'
const port = 3001
const redisUrl = 'redis://localhost:6379'

// ✅ Required — read from environment
const model = process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-5'
const port = Number(process.env['PORT'] ?? 3001)
const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
```

All environment variables must exist in `.env.example`. If you add a new one, add it there too.

---

## Naming Conventions

### TypeScript / JavaScript

| Thing | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `blockId`, `runStatus` |
| Functions | `camelCase` | `getAffectedBlocks()` |
| Types / Interfaces | `PascalCase` | `BlockOutput`, `SharedContext` |
| Constants | `UPPER_SNAKE` | `BLOCK_TYPES`, `MAX_RETRIES` |
| Files (components) | `PascalCase.tsx` | `BlockNode.tsx` |
| Files (utils/routes) | `camelCase.ts` | `blockQueue.ts` |

### Python

| Thing | Convention | Example |
|---|---|---|
| Variables / Functions | `snake_case` | `shared_context`, `get_client()` |
| Classes / Models | `PascalCase` | `SharedContext`, `PlanRequest` |
| Constants | `UPPER_SNAKE` | `BLOCK_PROMPT_MAP` |
| Files | `snake_case.py` | `context.py`, `plan.py` |

---

## Function Documentation

Every non-trivial function must have a JSDoc (TypeScript) or docstring (Python) comment.

```typescript
// ✅ TypeScript — JSDoc
/**
 * BFS traversal to find all blocks downstream of a changed block.
 *
 * @param projectId - UUID of the project
 * @param blockId   - ID of the changed block (BFS origin)
 * @returns         - Ordered list of affected block IDs
 */
export async function getAffectedBlocks(projectId: string, blockId: string): Promise<string[]>
```

```python
# ✅ Python — docstring
async def plan(req: PlanRequest) -> PlanResponse:
    """
    Planner agent endpoint.
    Converts user prompt into SharedContext via Claude.
    """
```

---

## Validation

- **Backend routes:** all request bodies must be validated with **Zod** before use
- **Agent routes:** all request bodies must use **Pydantic** models
- **Never trust raw `req.body`** without parsing

```typescript
// ✅ Always validate first
const parsed = CreateBlockSchema.safeParse(req.body)
if (!parsed.success) return reply.code(422).send(...)
const { projectId, blockType } = parsed.data
```

---

## File Header

Every TypeScript and Python file must start with a top comment identifying it:

```typescript
// CraftaStudio — src/routes/blocks.ts
```

```python
# CraftaStudio — agents/routes/plan.py
```

---

## Error Handling

- Never let errors fail silently
- Use typed error responses: `{ error: string, code?: string }`
- Log errors with context, not just the message

```typescript
// ❌ Not allowed
} catch (e) { }

// ✅ Required
} catch (err: unknown) {
  req.log.error({ err, blockId }, 'Failed to fetch block')
  return reply.code(500).send({ error: 'Internal server error' })
}
```
