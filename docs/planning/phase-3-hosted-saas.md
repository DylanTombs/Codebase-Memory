# Phase 3 — Hosted Multi-Tenant SaaS

**Status: planned (north star)**

## Goal

Move from "clone the repo and run it locally" to a hosted product: a team connects their GitHub
org once via OAuth, ingestion runs continuously in the background, and the extension talks to a
hosted, authenticated API instead of `localhost:8000`.

## Why this is the north star

The local/self-hosted model caps adoption at people willing to run a Python project and manage
their own `.env`. A hosted product removes that friction entirely — see
[00-product-vision.md](./00-product-vision.md).

## Scope

- **Auth**: GitHub OAuth login; a tenant = a connected GitHub org/repo set.
- **Hosted API**: `server.py`'s FastAPI app becomes a real backend service — same `/query`-shaped
  contract, but behind auth, with tenant ID derived from the authenticated session/API key rather
  than a single global `.env`.
- **Hosted vector store**: move off local ChromaDB to a hosted vector DB (managed Chroma, pgvector,
  or similar) with per-tenant isolation. Each tenant's data must be unreachable from another
  tenant's queries — this is a hard security requirement, not a nice-to-have.
- **Background ingestion**: replace the manual `ingest.py` invocation / Streamlit re-ingest button
  with a webhook-driven job (GitHub webhook on PR merge → enqueue → connector pipeline from
  Phase 2 runs the relevant connector). No more "click re-ingest."
- **Client changes**: the extension's hardcoded `SERVER = 'http://localhost:8000'` becomes a
  configurable hosted URL with a per-user auth token (stored via `chrome.storage`, not hardcoded).
- **Dashboard**: Streamlit (`app.py`) is local-admin-only and doesn't support per-user sessions or
  auth well. Replace it with a proper hosted web dashboard for account/repo management, usage, and
  billing — Streamlit can stay as an internal debugging tool, not the customer-facing surface.
- **Billing**: plan gating (e.g. PR/query volume limits per tier).

## Architecture changes

- Tenant isolation touches every layer: storage (vector DB namespacing/row-level isolation), API
  (auth middleware, tenant resolution), ingestion (per-tenant job queue).
- `manifest.json` host_permissions needs to add the hosted API's domain alongside (or instead of)
  `localhost:8000`.

## Task list

- [ ] Design tenant data model (tenant ↔ GitHub org ↔ repos ↔ users)
- [ ] GitHub OAuth login flow
- [ ] Hosted vector DB with per-tenant isolation (security review required before launch — see
      global security rules: rate limiting, no cross-tenant data leakage in error messages)
- [ ] Webhook ingestion pipeline (PR merged → connector run) reusing Phase 2 connectors
- [ ] Hosted API with auth middleware + per-tenant query scoping
- [ ] Extension: configurable server URL + token storage, replacing hardcoded localhost
- [ ] Hosted dashboard (account, connected repos, usage) replacing Streamlit for end users
- [ ] Billing/plan gating

## Exit criteria

- A new customer can sign up, connect a GitHub org via OAuth, and start getting answers in the
  extension without running any code locally.
- Tenant isolation verified: a query under tenant A cannot return tenant B's data under any
  input, including malformed/adversarial queries.
