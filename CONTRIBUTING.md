# CraftaStudio — Contributing Guide

## Branch Rules

- `main`     → production ready. ONLY Pranav merges here.
- `dev`      → integration branch. All PRs target this branch.
- `feature/xxx` → individual features (e.g. feature/planner-ai)

## How to work

1. Always branch from `dev`:
   ```
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Name your branch:
   - `feature/`   → new feature
   - `fix/`       → bug fix
   - `docs/`      → documentation only
   - `refactor/`  → code cleanup

3. Commit message format:
   ```
   feat: add planner AI endpoint
   fix: correct route naming in user controller
   docs: update README with setup steps
   refactor: split block validation into middleware
   ```

4. Before opening a PR:
   - Your code must run without errors
   - No `console.log` left in the code
   - `.env` values must never be committed
   - Add at least one comment explaining non-obvious logic

5. PR title format:
   ```
   [FEAT] Add Planner AI endpoint
   [FIX] Fix route mismatch in user controller
   [REFACTOR] Split validation middleware
   ```

6. PR review:
   - Pranav reviews ALL PRs before merge
   - Do not merge your own PR
   - Address review comments within 24 hours

## shared/types/ is SACRED

Never modify `shared/types/blocks.ts` or `shared/types/context.ts`
without messaging Pranav first and getting approval.
This file is the contract between all layers.
Changing it without coordination breaks everyone's code.

## Questions

Message on WhatsApp group for anything blocking you.
Do not stay blocked for more than 2 hours without asking.
