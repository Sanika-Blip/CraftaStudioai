# CraftaStudio — Architecture Summary

A one-page reference for how the system works. Read this before touching any code.

---

## System in One Sentence

A user draws an architecture diagram as connected blocks. CraftaStudio converts that diagram into a structured context, sends it to parallel AI agents, and merges all generated code into a single downloadable codebase.

---

## Layers

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14)                              │
│  - Canvas: React Flow nodes (BlockNode, PlannerNode)│
│  - User draws blocks and connections                │
│  - Sends diagram to backend on "Run"                │
└────────────────────────┬────────────────────────────┘
                         │ POST /api/workflow/run
┌────────────────────────▼────────────────────────────┐
│  BACKEND (Fastify + TypeScript)                     │
│  - Validates the graph (no cycles)                  │
│  - Creates WorkflowRun record in PostgreSQL         │
│  - Enqueues orchestration job in BullMQ (Redis)     │
│  - Returns runId immediately                        │
└────────────────────────┬────────────────────────────┘
                         │ BullMQ job → Worker
┌────────────────────────▼────────────────────────────┐
│  ORCHESTRATOR (Backend Worker)                      │
│  - Runs topological sort on the block graph         │
│  - Calls POST /plan on Python agent service         │
│  - Broadcasts SharedContext to all agent jobs       │
└────────┬───────────────┬───────────────┬────────────┘
         │               │               │
    ┌────▼────┐    ┌─────▼────┐   ┌──────▼────┐
    │ DB Agent│    │API Agent │   │ UI Agent  │   ...
    │ Prisma  │    │ Fastify  │   │ Next.js   │
    │ schema  │    │ routes   │   │ components│
    └────┬────┘    └─────┬────┘   └──────┬────┘
         │               │               │
┌────────▼───────────────▼───────────────▼────────────┐
│  MERGE ENGINE                                       │
│  - Collects all BlockOutput records                 │
│  - Assembles a consistent file tree                 │
│  - Zips and stores in Cloudflare R2                 │
│  - Returns download URL to frontend                 │
└─────────────────────────────────────────────────────┘
```

---

## The Block Graph (DAG)

Every project is a **Directed Acyclic Graph** (DAG) of blocks:

- **Nodes** = blocks (data, api, ui, service, integration, auth, job)
- **Edges** = dependencies (this block depends on that block)

**Why a DAG?**
- Edges define generation order: a block cannot be generated before its dependency
- Cycles are illegal — the system rejects them at connection-creation time
- Topological sort gives the safe execution order

**Example:**
```
[User data model] → [User API] → [User UI page]
                 ↘             ↗
                   [Auth block]
```

The data model is generated first. The API and Auth can be generated in parallel (both depend only on the data model). The UI page is generated last (depends on the API).

---

## SharedContext — The Contract

The Planner agent produces one `SharedContext` object at the start of every run. Every generator agent receives this same context.

```json
{
  "project": "TaskManager",
  "entities": {
    "Task": { "fields": [...] },
    "User": { "fields": [...] }
  },
  "api_routes": {
    "GET /api/tasks": "List all tasks",
    "POST /api/tasks": "Create task"
  },
  "tech_stack": { ... },
  "conventions": { ... }
}
```

This is why generated code is consistent: the DB schema, the API, and the UI all reference the same entity definitions and the same route contracts.

---

## Parallel Execution

After the Planner builds the SharedContext, **all independent blocks run at the same time** via BullMQ:

- Each block gets its own job in the queue
- Workers pick up jobs up to concurrency limit (currently 5)
- Dependent blocks wait until their dependency's `BlockOutput` is written to DB
- No block shares memory with another — they only share the `SharedContext`

This is what makes generation fast: a 6-block diagram generates in roughly the time it takes to generate 1 block, not 6.

---

## Merge Engine

After all `BlockOutput` records are in the database:

1. Reads all outputs for the `WorkflowRun`
2. Organises files by layer (`prisma/`, `src/routes/`, `src/app/`)
3. Resolves naming conflicts (e.g., two agents both write to `src/app/layout.tsx`)
4. Packages everything into a `.zip` via JSZip
5. Uploads to Cloudflare R2 and returns a signed download URL

The result is a clean, structured codebase — not a set of unrelated file fragments.

---

## Data Model (Key Tables)

| Table | Purpose |
|---|---|
| `teams` | Top-level tenant |
| `projects` | One canvas per project |
| `blocks` | Each visual node (stores full block definition as JSONB) |
| `connections` | Directed edges between blocks |
| `workflow_runs` | One AI generation run per "Run" button click |
| `block_outputs` | Per-agent generated code for one run |

---

## Key Files to Know

| File | Why |
|---|---|
| `shared/types/blocks.ts` | Single source of truth for all types |
| `backend/src/graph/topologicalSort.ts` | Kahn's algorithm — DAG execution order |
| `backend/src/graph/cycleDetection.ts` | DFS — prevents illegal connections |
| `backend/src/queue/blockQueue.ts` | BullMQ setup — parallel agent dispatch |
| `agents/routes/plan.py` | Planner agent — produces SharedContext |
| `agents/routes/generate.py` | Generator agents — produces per-block code |
| `agents/types_/context.py` | Python mirror of SharedContext |
