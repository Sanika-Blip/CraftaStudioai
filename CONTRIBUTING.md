# CraftaStudio Engineering Handbook

Welcome to the team. This document is the single source of truth for our architecture, onboarding, workflow, and code rules.

---

## 1. Onboarding

Get from zero to a running local environment in under 10 minutes.

### Prerequisites
- **Node.js**: 20+
- **Python**: 3.11+
- **PostgreSQL**: 15+
- **Redis**: 7+

### Local Setup
```bash
# 1. Clone & environment
git clone https://github.com/pranavgawaii/craftastudio.git
cd craftastudio
cp .env.example .env

# Fill in .env with:
# ANTHROPIC_API_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, DATABASE_URL, REDIS_URL

# 2. Start Frontend
cd frontend
npm install
npm run dev # Runs on :3000

# 3. Start Backend
cd ../backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev # Runs on :3001

# 4. Start Agents Service
cd ../agents
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 # Runs on :8000
```

---

## 2. Architecture Summary

**The Flow:** Prompt → Planner AI → Canvas Blocks → SharedContext → Parallel Agents → Codebase

- **The Graph:** Every project is a Directed Acyclic Graph (DAG) of blocks (rules out circular dependencies).
- **SharedContext:** Planner AI creates an overarching context. Every agent (DB, API, UI) reads this exact context so the generated codebase is perfectly cohesive.
- **Parallel Execution:** BullMQ workers trigger generator agents simultaneously. A 10-block diagram generates as fast as the slowest single block.
- **Merge Engine:** Collects all `BlockOutput` artifacts, structures the file tree, zips it to Cloudflare R2, and returns the codebase.

### Key Files
- `shared/types/blocks.ts` — The Contract. Source of truth.
- `backend/src/graph/topologicalSort.ts` — Kahn's algorithm for DAG execution order.
- `agents/routes/plan.py` — Planner agent producing SharedContext.

---

## 3. Development Workflow

`Research → Design → Build → Test → Merge`
*(Do not skip stages. "I'll test it later" is ignored.)*

### Branching Rules
- **`main`**: Production only. (Only Tech Lead merges).
- **`dev`**: Integration branch. All PRs target `dev`.
- Prefix branches: `feature/`, `fix/`, `refactor/`, `docs/`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature
```

### PR Expectations
- You must test your code locally.
- Review must be completed within 24h.
- Max 2 hours stuck on one problem — after 2h, ping the team immediately. No heroics, no wasted days.

---

## 4. Code Rules

These are strict rules enforced across the repo.

### 4.1. Strict TypeScript
- `strict: true` is enabled everywhere. Do not disable it.
- **No `any` types**. Use `unknown` or define the interface.
- **No Type Assertions without Zod proof**.

### 4.2. Shared Contract is Sacred
Do not modify `shared/types/blocks.ts` or `shared/types/context.ts` without discussing with the Tech Lead. This file binds all layers.

### 4.3. Clean Code
- **No `console.log`** in final code. Use Fastify logger (`req.log.info`) in the backend.
- **No Hardcoded Values**. Everything must come from `.env` with a fallback.

### 4.4. Naming Conventions
- Variables/Functions: `camelCase` (JS/TS), `snake_case` (Python)
- Files: `PascalCase.tsx` (React), `camelCase.ts` (API), `snake_case.py` (Python)
- Constants: `UPPER_SNAKE`

### 4.5. Validation
- **Backend**: All incoming request bodies MUST be parsed with **Zod**. Never trust raw `req.body`.
- **Agents**: All requests MUST be parsed with **Pydantic**.

### 4.6. Error Handling
- Never let errors fail silently in `catch`.
- Always return typed error responses: `{ error: string, code?: string }`.
