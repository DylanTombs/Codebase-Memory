# Phase 2 — Source Expansion

**Status: planned**

## Goal

Move beyond "PRs only" to a fuller picture of institutional memory: GitHub Issues, commit
messages as a first-class source (not just metadata folded into PR chunks), and docs/wiki
content (Notion, Confluence, in-repo ADRs/markdown).

## Why these sources, and why not others

GitHub Issues, commits, and docs/wiki were chosen because they're high-signal, low-friction —
same GitHub auth for issues/commits, and docs/wiki capture *formal* decisions that PRs alone
miss (e.g. an ADR written before any code existed).

Slack/Discord and Linear/Jira ingestion are explicitly **deferred**, not rejected — see
[phase-4-team-scale.md](./phase-4-team-scale.md). They require new auth flows and have a noisier
signal-to-noise ratio; revisit once the GitHub + docs/wiki path has proven the core value prop
with real users.

## Scope

- Generalize ingestion into a **source connector** abstraction (repository pattern): a common
  interface (`fetch() -> list[Chunk]`) with concrete connectors for PRs, Issues, commits, and
  docs/wiki. This is the point where `ingest.py` (currently one file, GitHub-PR-specific) splits
  into `ingest/connectors/{github_prs,github_issues,docs}.py` + a shared `ingest/pipeline.py` —
  per the many-small-files convention, once there's a second connector to justify the split.
- Issues and commits become independently citable sources in answers (not just folded into a PR
  chunk), so an answer can cite "Issue #12" or a bare commit, not only PRs.
- Docs/wiki connector: start with in-repo markdown/ADRs (no new external auth needed), then
  Notion/Confluence (requires their respective API auth).
- Chunking/metadata schema needs a `source_type` field so query results can show "PR #4" vs.
  "Issue #12" vs. "ADR: choosing-grpc.md" distinctly in the UI.

## Architecture changes

- New `source_type` field in Chroma metadata; sources rendered in both `app.py` and the extension
  need to branch on it for display (PR link vs. issue link vs. doc link).
- Connector interface becomes the seam multi-tenant Phase 3 ingestion jobs will call per-tenant,
  per-source — designing it cleanly here pays off directly in Phase 3.

## Task list

- [ ] Define `Chunk` + connector interface (`fetch() -> list[Chunk]`)
- [ ] Refactor existing PR ingestion into a `github_prs` connector behind that interface
- [ ] Add `github_issues` connector
- [ ] Add commit-message connector (or fold into `github_prs` as a richer chunk — decide based on
      whether commits outside any PR are common enough in target repos to matter)
- [ ] Add in-repo markdown/ADR connector
- [ ] Add Notion connector (auth + fetch)
- [ ] Add `source_type` to metadata schema; update `query.py` source formatting
- [ ] Update `app.py` and extension UI to render mixed source types

## Exit criteria

- A repo with no PR history but rich docs/ADRs still produces useful answers.
- Adding a new source type requires writing one connector file, not touching `query.py` or the UI
  rendering logic beyond the `source_type` branch.
