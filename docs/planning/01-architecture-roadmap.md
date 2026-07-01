# Architecture Roadmap

How each major piece evolves from the current local demo to the hosted SaaS target. This is the
"why" behind the phase docs — read this when a phase's scope seems arbitrary.

| Concern | Phase 0 (now) | Phase 1 | Phase 2 | Phase 3+ |
|---|---|---|---|---|
| Ingestion trigger | Manual (`python ingest.py` / Streamlit button) | Manual, but reliable | Manual, pluggable sources | Webhook-driven background jobs |
| Data sources | GitHub PRs only | GitHub PRs only | + Issues, commits, docs/wiki | Same, per-tenant configurable |
| Vector store | Local ChromaDB (single SQLite file, single collection) | Local ChromaDB, collection namespaced per repo | Local ChromaDB, collection namespaced per repo + source type | Hosted vector DB, isolated per tenant |
| API server | `server.py` on `localhost:8000` | Same, hardened | Same | Hosted multi-tenant API behind auth |
| Client | Streamlit (`app.py`) + Chrome extension hitting localhost | Same | Same | Extension hits hosted API with per-user auth token; Streamlit retired in favor of a hosted web dashboard |
| Auth | None (local trust) | None | None | GitHub OAuth login, per-tenant API keys |
| Tenancy | N/A (single user, single repo) | N/A | N/A | Multi-tenant from day one of this phase |
| Answers | `DEMO_MODE` scripted answers (intentional, for the demo video) **or** live GPT-4o-mini RAG | Live RAG path proven end-to-end; demo mode kept as a permanent, separate code path | Live RAG over multiple source types | Live RAG, response caching, feedback loop |

## Decisions this implies

- **`DEMO_MODE` is not technical debt to remove.** It's a deliberate, permanent two-mode design:
  scripted answers for a curated demo repo/video, real RAG for everything else. Both modes stay
  in `query.py`/`server.py` indefinitely — see [phase-0](./phase-0-demo-foundation.md).
- **Ingestion becomes a "source connector" abstraction in Phase 2**, not before. Don't generalize
  `ingest.py` into a plugin system until there's a second source type to prove the interface
  against (PRs + Issues/commits + docs). Building it earlier would be designing for a
  hypothetical.
- **Streamlit is a Phase 0/1 prototyping tool, not the long-term dashboard.** It doesn't support
  multi-tenant auth or per-user sessions well. Phase 3 plans its replacement rather than trying
  to retrofit multi-tenancy into it.
- **Chroma stays local through Phase 2.** Moving to a hosted vector DB is coupled to multi-tenancy
  (Phase 3) — doing it earlier adds infra cost with no tenant isolation problem yet to solve.
