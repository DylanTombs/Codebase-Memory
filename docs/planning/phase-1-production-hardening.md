# Phase 1 — Production Hardening (Single Tenant)

**Status: next up**

## Goal

Make the *live* path (`DEMO_MODE=false`: real OpenAI embeddings + GPT-4o-mini) as trustworthy as
the demo path already is. Right now it's implemented but unproven end-to-end against a real repo
with the extension attached.

## Why now

The demo narrative only holds up if the real thing actually works when a prospect tries it on
their own repo. This is the highest-risk untested path in the codebase today.

## Scope

- Run a full ingest against a real, non-curated repo with `DEMO_MODE=false`; verify the extension
  → `server.py` → `query.py` → OpenAI loop end-to-end.
- Add unit tests for pure logic: `build_chunk`, `_build_context`, `_demo_answer`, env validation.
- Add integration tests for `/status`, `/query`, `/reset` against a seeded test Chroma collection
  (target: 80%+ coverage per project testing standard).
- Namespace the Chroma collection by `REPO_NAME` (e.g. `pr_memory__{repo_slug}`) so ingesting a
  second repo locally doesn't silently mix PR data from two repos in one collection. This is a
  prerequisite for Phase 2 and Phase 3, not just hygiene.
- Write the README for future developers/integrators: env setup, `ingest.py` → `server.py` →
  `app.py`/extension run order, how `DEMO_MODE` differs from the live path.
- Tighten ingest-failure UX in `app.py` — the re-ingest button currently surfaces raw
  stdout/stderr without checking exit status.

## Architecture changes

- Collection naming becomes `pr_memory__{repo_slug}` instead of the single global `pr_memory`.
  This touches `ingest.py`, `query.py`, `server.py`, `app.py` (all four currently hardcode the
  collection name).

## Task list

- [ ] Live end-to-end run against a real repo, document any breakage and fix it
- [ ] Unit tests: `ingest.build_chunk`, `query._build_context`, `query._demo_answer`, `ingest.validate_env`
- [ ] Integration tests: `server.py` endpoints against a seeded test collection
- [ ] Namespace Chroma collections by repo
- [ ] README: setup + run instructions for self-hosting
- [ ] `app.py`: surface ingest success/failure based on subprocess exit code, not just stdout presence

## Exit criteria

- A new developer can clone, set up `.env`, run ingest against their own repo, and get a correct
  live (non-demo) answer through the extension — without reading source code.
- 80%+ test coverage on `ingest.py` and `query.py` core logic.
