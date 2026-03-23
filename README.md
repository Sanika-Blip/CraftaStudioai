# CraftaStudio

**Architecture-first AI code generation.**

[![Phase MVP](https://img.shields.io/badge/Phase-MVP-black?style=flat-square)](#)
[![License MIT](https://img.shields.io/badge/License-MIT-black?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Fastify%20%7C%20Claude-black?style=flat-square)](#)

> Prompt your architecture. Refine the flow. Let parallel agents build every layer — simultaneously.

---

### The Problem

Current AI code capabilities are constrained to single-file, single-prompt interactions. They generate your API without comprehensive knowledge of your schema, and your UI without awareness of your routes. Every generated piece exists as an isolated island.

The result is hours spent stitching together disjointed code.

**CraftaStudio fundamentally changes this dynamic: the architecture is the input — not the prompt.**

---

### How It Works

```text
Prompt  →  Planner AI  →  Canvas Blocks  →  SharedContext  →  Parallel Agents  →  Codebase
```

1. **Prompt** — Write what you want to build. 
2. **Plan** — The Planner AI translates your prompt into a visual architecture of interconnected blocks.
3. **Refine** — Review, modify, and expand the generated architecture on the interactive canvas.
4. **Generate** — Parallel Claude agents simultaneously receive the global context and build their respective layers.
5. **Merge** — Complete outputs undergo systematic assembly into a unified, deployment-ready codebase.

No agent operates in the dark. Every generated asset understands the complete system.

---

### Tech Stack

- **Frontend:** Next.js 14, TypeScript, React Flow, Zustand, Tailwind CSS, Monaco
- **Backend:** Fastify, PostgreSQL, Prisma ORM, BullMQ, Redis, Zod
- **Agents:** Python (FastAPI), LangGraph, Anthropic Claude
- **Infrastructure:** Vercel, Railway / Render, Cloudflare R2, Upstash Redis

---

### Local Setup

**Dependencies required:** Node 20+, Python 3.11+, PostgreSQL 15+, Redis 7+

```bash
# 1. Clone & environment
git clone https://github.com/pranavgawaii/craftastudio.git
cd craftastudio
cp .env.example .env

# 2. Install dependencies globally
npm run install:all

# 3. Provision the database
cd backend && npx prisma migrate dev

# 4. Spin up the cluster
cd ..
npm run dev
# Services available: Frontend :3000 | Backend :3001 | Agents :8000
```

---

### Contribution Guidelines

We enforce strict branch naming and commit conventions to maintain a clean history.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature
```

**Branch Prefixes:**
- `feature/`
- `fix/`
- `refactor/`

**Commit Syntax:**
Keep commits under 6 words total. No explanations.
```text
feat: add planner route
fix: prisma singleton
docs: update readme
chore: cleanup structure
```

---

### Vision

Boilerplate is wasted potential. CraftaStudio compresses the gap between system design and running code from weeks down to minutes. 

**Prompt the architecture. Refine the blocks. Get the codebase.**
