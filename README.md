# CraftaStudio

> Design your architecture. Let parallel AI agents build it.

CraftaStudio is an **architecture-first AI code generation platform**. You draw your system as a visual block diagram — data models, APIs, UI, jobs — and the platform generates every layer simultaneously using parallel Claude agents, all sharing the same architectural context.

---

## The Problem

AI code generators are prompt-in, code-out tools. They work for one file at a time. They don't know your schema when writing your API, or your API when writing your UI. Every generated piece is an island — and you spend hours stitching them together.

CraftaStudio solves this by making the **architecture the input**, not the prompt.

---

## How It Works

```
User draws blocks on canvas
         ↓
Planner AI reads the full diagram
         ↓
Builds a SharedContext (entities, routes, conventions)
         ↓
Parallel agents receive the same context
         ↓
Each agent generates its layer (DB schema, API, UI, jobs)
         ↓
Merge Engine assembles a consistent, downloadable codebase
```

No agent works in isolation. Every piece of generated code is aware of the rest of the system.

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- React Flow (`@xyflow/react`) — visual canvas
- Tailwind CSS — dark theme
- Zustand — canvas state
- Monaco Editor — in-app code preview
- Clerk — authentication
- Framer Motion — animations

**Backend**
- Fastify + TypeScript
- Prisma ORM + PostgreSQL
- BullMQ + Redis — parallel agent job queue
- Zod — validation

**AI Agents**
- FastAPI (Python) + LangGraph
- Anthropic Claude (claude-sonnet-4-5)
- Shared context broadcast pattern

**Infrastructure**
- Vercel — frontend
- Railway / Render — backend + agent service
- Cloudflare R2 — generated file storage
- Upstash Redis — queue

---

## Folder Structure

```
craftastudio/
├── frontend/                  # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── canvas/        # Main workspace page
│       │   └── layout.tsx
│       └── components/
│           └── canvas/        # BlockNode, PlannerNode, MergeEngineNode
│
├── backend/                   # Fastify API server
│   ├── prisma/
│   │   └── schema.prisma      # DB schema (Teams, Projects, Blocks, Runs)
│   └── src/
│       ├── routes/            # blocks, connections, workflow
│       ├── middleware/        # validateBlockType, teamOwnership
│       ├── graph/             # BFS traversal, DFS cycle detection, Kahn sort
│       └── queue/             # BullMQ block generation queue
│
├── agents/                    # Python FastAPI agent service
│   ├── routes/
│   │   ├── plan.py            # POST /plan — Planner agent
│   │   └── generate.py        # POST /generate — Generator agents
│   ├── types_/
│   │   └── context.py         # SharedContext Pydantic model
│   └── prompts/               # System prompts per agent type
│
├── shared/
│   └── types/
│       └── blocks.ts          # Contract between all layers — DO NOT MODIFY without approval
│
└── docs/                      # Architecture diagrams, ADRs
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 1 — Clone and set up environment

```bash
git clone https://github.com/pranavgawaii/craftastudio.git
cd craftastudio
cp .env.example .env
# Fill in all values in .env before continuing
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 3 — Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# → http://localhost:3001
```

### 4 — Agents

```bash
cd agents
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

---

## Contribution Workflow

```
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# Build, test locally
git push origin feature/your-feature-name
# Open PR → targets dev → Pranav reviews → merge
```

**Branch naming:**
- `feature/` — new feature
- `fix/` — bug fix
- `refactor/` — cleanup

**Commit format:**
```
feat: add merge engine download endpoint
fix: handle cycle detection edge case
docs: update architecture summary
```

Full rules: see [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## Vision

Most developers spend more time on boilerplate than on ideas. CraftaStudio inverts this — your architecture diagram becomes your codebase. Draw the system you want. The platform builds the code you'd write anyway.

The goal is not to replace engineers. It's to compress the gap between **idea and running code** from weeks to minutes.

---

## License

MIT — see [`LICENSE`](./LICENSE)
