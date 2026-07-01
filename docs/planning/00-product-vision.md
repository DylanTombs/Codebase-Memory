# Product Vision

## Problem

Engineering decisions live in PR discussions, commit history, and people's heads. When that
context is needed later ("why did we do it this way?"), it's either lost, or it costs someone
a Slack message and a wait. This gets worse as teams grow and turnover increases.

## Product

Codebase Memory turns merged PR history (and later, issues, commits, and docs) into a
queryable institutional memory. An engineer asks a question in plain English from inside
GitHub; the answer is grounded in and cited to the actual PRs that made the decision.

## Who it's for

Engineering teams of meaningful size (10+) with enough PR/commit history that institutional
knowledge has already started to leak — not solo developers or brand-new repos.

## North star

Hosted, multi-tenant SaaS: a team connects their GitHub org once, ingestion runs continuously
in the background (webhook-driven, not manual), and every engineer on the team gets the
GitHub-embedded "ask why" panel with no local setup required.

## Non-goals (for now)

- Not a general code-search or code-review tool — scope is "why," not "what" or "is this good."
- Not chasing every integration on day one. Slack and Linear/Jira ingestion were considered and
  explicitly deferred — see [phase-4-team-scale.md](./phase-4-team-scale.md) — until the GitHub +
  docs/wiki path proves the core value proposition.

## Current status

Phase 0 (demo foundation) is complete. See [phase-0-demo-foundation.md](./phase-0-demo-foundation.md).
