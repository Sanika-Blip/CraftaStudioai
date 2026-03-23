# CraftaStudio — Onboarding Guide

Welcome to the team. This document gets you from zero to a running local development environment in under 30 minutes.

---

## Step 1 — Prerequisites

Make sure these are installed before anything else:

| Tool | Version | Check |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Python | 3.11+ | `python --version` |
| PostgreSQL | 15+ | `psql --version` |
| Redis | 7+ | `redis-cli ping` → `PONG` |
| Git | any | `git --version` |

---

## Step 2 — Clone the Repository

```bash
git clone https://github.com/pranavgawaii/craftastudio.git
cd craftastudio
```

You now have the full codebase locally.

---

## Step 3 — Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value. Ask Pranav for:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `DATABASE_URL` (your local PostgreSQL connection string)
- `REDIS_URL` (default: `redis://localhost:6379`)

**Never commit `.env`.** It is in `.gitignore` for a reason.

---

## Step 4 — Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

You should see the CraftaStudio canvas with a dark theme and a top bar.

---

## Step 5 — Run the Backend

In a new terminal:

```bash
cd backend
npm install
npx prisma generate        # generates the Prisma client
npx prisma migrate dev     # creates all tables in your local DB
npm run dev
```

Open: [http://localhost:3001/health](http://localhost:3001/health)

Expected response: `{ "status": "ok", "ts": "..." }`

---

## Step 6 — Run the Agents Service

In a new terminal:

```bash
cd agents
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open: [http://localhost:8000/health](http://localhost:8000/health)

Expected response: `{ "status": "ok" }`

---

## Step 7 — Understand the Codebase

Read these files in this order:

1. [`shared/types/blocks.ts`](./shared/types/blocks.ts) — start here. This is the contract.
2. [`ARCHITECTURE_SUMMARY.md`](./ARCHITECTURE_SUMMARY.md) — understand the system in 5 minutes
3. [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) — understand the data model
4. [`backend/src/routes/workflow.ts`](./backend/src/routes/workflow.ts) — understand how a run starts
5. [`agents/routes/plan.py`](./agents/routes/plan.py) — understand the Planner agent

---

## Step 8 — Your First Task

Start with something small and confined. Good starter tasks:

**Frontend:**
- Add a `blockType` icon map to `BlockNode.tsx` (different emoji/icon per type)
- Add a real Clerk `<UserButton />` to `TopBar.tsx`

**Backend:**
- Wire `cycleDetection.pathExists()` into the `POST /api/connections` route before creating an edge
- Add `GET /api/blocks/:id/affected` endpoint using `getAffectedBlocks()`

**Agents:**
- Add input/output logging middleware to FastAPI (log `run_id`, `block_type`, `tokens_used`)

Pick one, branch off `dev`, build it, test it, open a PR.

---

## Getting Help

- Stuck for more than 2 hours? Message Pranav on WhatsApp.
- Don't understand the architecture? Re-read `ARCHITECTURE_SUMMARY.md` first, then ask.
- Found a bug? Open a GitHub issue with steps to reproduce.
- Want to change `shared/types/`? Message Pranav first — don't just edit it.
