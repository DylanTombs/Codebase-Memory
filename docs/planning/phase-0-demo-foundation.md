# Phase 0 — Demo Foundation

**Status: done**

## Goal

Prove the product narrative — "ask why your codebase works this way, right from GitHub" — with
a polished, reliable demo, before investing in production infrastructure.

## Scope

- Ingest merged PRs (title, body, labels, review/issue comments, commit messages) from a single
  GitHub repo into local ChromaDB.
- Query via vector search + GPT-4o-mini synthesis, with citations enforced by the system prompt.
- Two clients: a Streamlit dashboard for ingestion/debugging, and a Chrome extension that injects
  an "ask" panel directly into github.com.
- `DEMO_MODE`: a permanent, intentional second path. When set, ingestion uses local
  sentence-transformers (no OpenAI calls), and `server.py` serves pre-written, curated answers
  from `demo_qa.json` round-robin instead of running live RAG. This is for the demo video against
  the `URL-Shortener` repo and is **not** scaffolding to be removed later — see
  [01-architecture-roadmap.md](./01-architecture-roadmap.md).

## What's built

- `ingest.py`, `query.py`, `server.py`, `app.py`, `extension/` — all functional.
- Idempotent ingestion (skips already-ingested PR IDs), retry/backoff on GitHub API calls.
- Themed (dark/light) extension UI with status checks and error states.

## Exit criteria (met)

- End-to-end demo works against the curated repo with `DEMO_MODE=true`.
- Extension correctly surfaces "server offline" / "no data" states.

## Explicitly out of scope here

- Tests, multi-repo support, hosted infra, additional data sources — see later phases.
