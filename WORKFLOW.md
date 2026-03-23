# CraftaStudio — Development Workflow

This document defines how work moves from idea to production. Everyone follows this. No exceptions.

---

## Development Lifecycle

Every feature or fix goes through these stages in order:

```
Research → Design → Build → Test → Merge
```

| Stage | What happens | Output |
|---|---|---|
| **Research** | Understand the problem, check existing code | Clear task definition |
| **Design** | Plan the approach — schema changes? New route? UI? | Written plan (comment in issue or PR) |
| **Build** | Write code on a feature branch | Working local implementation |
| **Test** | Run it manually. Does it work? Edge cases? | Confirmed working behaviour |
| **Merge** | Open PR → Pranav reviews → fix feedback → merge | Code on `dev` |

Do not skip stages. "I'll test it later" is not allowed.

---

## Branch Flow

```
main
 └── dev
      ├── feature/planner-ai-context
      ├── feature/block-node-ui
      ├── fix/cycle-detection-edge-case
      └── refactor/queue-retry-logic
```

**Rules:**
- `main` — production only. Never push directly. Only Pranav merges here.
- `dev` — integration branch. All PRs target `dev`.
- Always branch from `dev`, never from `main`.
- One feature per branch. Do not combine unrelated changes.

**Create a branch:**
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

**Branch naming:**
- `feature/` — anything that adds new capability
- `fix/` — bug fix
- `refactor/` — code improvement with no behaviour change
- `docs/` — documentation only

---

## PR Lifecycle

```
Branch pushed
     ↓
Open PR (target: dev)
     ↓
PR checklist filled
     ↓
Pranav reviews (within 24h)
     ↓
Fix feedback (within 24h)
     ↓
Approved → Merge
```

**PR checklist (must pass before requesting review):**
- [ ] Code runs without errors
- [ ] No `.env` values committed
- [ ] No `console.log` in final code
- [ ] `shared/types/` not modified without Pranav's approval
- [ ] Branch is up to date with `dev`

**PR title format:**
```
[FEAT] Add Planner AI context endpoint
[FIX] Correct cycle detection for single-node graphs
[REFACTOR] Extract block validation into middleware
[DOCS] Update onboarding steps
```

---

## Weekly Demo Rule

Every week, the team demos what was shipped to `dev` that week.

- Last 10 minutes of the week's final session
- Each dev shows their feature working live
- No slides — just the running product
- If nothing was shipped: explain why and what's next

This keeps everyone aligned and accountable.

---

## Blocking Rule

**Maximum 2 hours stuck on one problem.**

If you are blocked for more than 2 hours:
1. Write down exactly what you tried
2. Message Pranav on WhatsApp with that context
3. Do not sit silent and lose a full day

Asking for help is not weakness. Losing a day to pride is.

---

## Code Review Expectations

**As the author:**
- Your PR description must explain *what* changed and *why*
- Link to the issue or task if one exists
- Don't open a PR for work-in-progress — only when it's ready

**As the reviewer (Pranav):**
- Reviews within 24 hours
- Comments are either: `[MUST]` fix this, or `[NIT]` optional suggestion
- Approves only when all `[MUST]` items are resolved
