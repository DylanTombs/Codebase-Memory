# Phase 4 — Team Collaboration & Scale

**Status: planned (post-SaaS)**

## Goal

Once the hosted product (Phase 3) has real tenants, invest in what makes it stickier for teams
specifically, and in the enterprise-readiness items that unblock larger customers.

## Scope

- **Multi-user per tenant**: shared query history within a team, so "someone already asked this"
  is visible instead of every engineer starting cold.
- **Answer feedback loop**: thumbs up/down on answers, surfaced back to improve retrieval/prompt
  quality over time.
- **Deferred data sources, revisited here**: Slack/Discord and Linear/Jira ingestion, which were
  explicitly deferred in [phase-2-source-expansion.md](./phase-2-source-expansion.md) pending
  proof of the core value prop. Each needs its own OAuth/API integration and its own connector
  per the Phase 2 connector interface.
- **Enterprise readiness**: audit logs, SSO (beyond plain GitHub OAuth), data retention controls,
  per global security rules (rate limiting, no sensitive data in error messages, auth/authz
  verified at every endpoint).
- **Observability**: query latency, ingestion job health, per-tenant usage metrics — needed both
  for billing accuracy (Phase 3) and for catching connector failures before a customer notices.

## Why this is sequenced last

These are retention/expansion features, not adoption blockers — Phase 3 (hosted SaaS) has to
prove people will use the core product before team-collaboration and integration-breadth
investments pay off.

## Task list

- [ ] Shared team query history
- [ ] Answer feedback (thumbs up/down) + a way to act on the signal
- [ ] Slack connector (auth + fetch + connector per Phase 2 interface)
- [ ] Linear/Jira connector
- [ ] Audit logs
- [ ] SSO beyond GitHub OAuth
- [ ] Data retention controls
- [ ] Per-tenant usage/observability dashboard

## Exit criteria

Revisit and re-prioritize this list once Phase 3 has live tenants — treat the task list above as
candidates, not a committed order. Real usage data should decide what's next, not this doc.
