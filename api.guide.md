# API Guide

Base URL: `http://localhost:3000/api`. JSON responses use `{ "ok": true, ... }` on success and `{ "ok": false, "error": "..." }` on failures.

## Runtime modes

- **Demo mode** (no `DATABASE_URL`): read-only seeded project data. `GET /health` reports which optional providers are configured. Writes return `503`; they are not silently presented as saved.
- **Database mode** (`DATABASE_URL` configured and schema applied): project creation, project reads, text-source ingestion, requirements, evidence and versions are persisted in PostgreSQL through Prisma.
- AI extraction is opt-in. With `OPENAI_API_KEY`, source text is sent to the configured OpenAI-compatible API. Without it, a conservative keyword heuristic is used and the API labels the result `heuristic`.

All routes validate input. Upload accepts UTF-8 `.txt`, Markdown, CSV and JSON text sources up to 100 KB. Binary PDF, DOCX, images, authentication, and multi-tenant authorization are not implemented in this MVP; do not expose write routes to untrusted users.

## Endpoints

### `GET /health`

Returns `{ ok, mode, services, checkedAt }`, where `services` contains configured booleans for PostgreSQL, AI, Cloudinary, Meilisearch and Upstash Redis. This checks configuration presence, not provider connectivity.

### `GET /projects`

Returns `{ ok, mode, projects, total }`. Database results include source and requirement counts. Demo mode returns the fixed sample portfolio.

### `POST /projects`

Create a project. Requires database mode.

```json
{ "name": "Customer onboarding", "domain": "Operations", "owner": "Project owner" }
```

`name` is required (2–100 characters); `domain` and `owner` have defaults. Returns `201` with the created project and initial BRD sections/version.

### `GET /projects/{projectId}`

Returns one project, requirements with evidence links, conflicts, sources, versions, impacts and BRD sections. In demo mode only `atlas-ops` is available.

### `GET /projects/{projectId}/export`

Downloads a JSON snapshot of the project, its requirements, evidence, sources, conflicts, versions, impacts and BRD sections. Demo mode exports the Atlas Ops Hub fixture.

### `POST /projects/{projectId}/sources`

Multipart form upload. Fields: `file` (required) and `type` (`meeting`, `email`, `policy`, `document`, or `transcript`, default `document`). The source is persisted; explicit requirement statements are extracted, linked to evidence, marked for review, and versioned. Returns `201` with `source`, `extractionMode`, `requirements` and `version`.

```powershell
curl.exe -X POST http://localhost:3000/api/projects/PROJECT_ID/sources `
  -F "type=meeting" -F "file=@requirements.txt;type=text/plain"
```

The extractor does not resolve conflicts or approve requirements automatically. Human review is required.

### `PATCH /projects/{projectId}/conflicts/{conflictId}`

Save a human decision for an existing conflict. The request body is `{ "resolution": "Use 48 hours; the policy owner confirmed the governing policy." }`. Saves a version record along with the decision.

### `PATCH /projects/{projectId}/requirements/{requirementId}`

Update the review status for a project requirement. Accepted request is `{ "status": "approved" }`; supported states are `draft`, `validated`, `review`, and `approved`.

### `GET /projects/{projectId}/intelligence`

Returns deterministic, explainable score factors, requirement risk indicators, quality scores, stakeholder summaries, inferred scope signals, eco efficiency estimates, a project-scoped relationship graph, and an executive summary.

### `GET|POST /projects/{projectId}/eco`

`GET` returns the estimate. `POST` accepts `{ "ecoModeEnabled": true }` and stores an `EcoMetric` and `EcoEvent` in database mode. Environmental outputs are estimates, not measured carbon emissions.

### `GET /projects/{projectId}/graph`

Returns graph nodes and recorded evidence/requirement/stakeholder/section/conflict relationships for the requested project only.

### `GET /projects/{projectId}/stakeholders`, `GET /projects/{projectId}/scope`, `GET /projects/{projectId}/executive`

Return derived stakeholder-owner coverage, inferred scope deltas, and an executive summary. Historical scope counts are approximate until immutable version snapshots are available.

### `GET /projects/{projectId}/activity`, `GET /projects/{projectId}/notifications`

Return recent source, requirement, conflict, version, processing-job and recorded audit events or stored notifications. Demo mode returns illustrative sample activity.

Database-mode source ingestion records job stages for preprocessing, extraction, persistence and version creation. Source-ingestion failures are marked failed with sanitized persisted diagnostics. Minimal audit events are written for source ingestion and requirement/conflict decisions; this is not complete audit coverage.

### `POST /projects/{projectId}/compare`

Accepts `{ "sourceA": "...", "sourceB": "...", "textA": "...", "textB": "..." }`; returns an exact-line added/removed comparison. It does not semantically compare meaning. Text fields have a 100 KB limit.

### `POST /projects/{projectId}/ai/review`

Accepts an evidence review action such as `find_contradictions`, `unsupported_claims`, `stakeholder_gaps`, or `analyze_risk`. Returns a concise result based on stored evidence and deterministic checks; it does not reveal chain-of-thought.

### `GET|POST /requirements/{requirementId}/risk`

Calculate risk signals from confidence, evidence links, review state, compliance keywords and linked conflicts. `POST` persists the calculated result.

### `POST /requirements/{requirementId}/quality`

Persists deterministic clarity, completeness, evidence, testability and consistency scores. Optional `{ "suggestion": "..." }` text is stored separately; the original requirement is not replaced.

### `POST /requirements/{requirementId}/acceptance`

Persists `{ "given": "...", "when": "...", "then": "...", "status": "draft" }`. Each statement is 3–1000 characters. Generated criteria should be reviewed before approval.

### `POST /requirements/{requirementId}/test-cases`

Persists a test case with `priority`, `preconditions`, `steps` (1–30 strings) and `expectedResult`; an optional `acceptanceCriteriaId` links it to saved criteria.

### `GET /search?projectId=atlas-ops&q=invoice&type=all`

Project-scoped search over requirement, source evidence, conflict, stakeholder and BRD records. Supported `type` filters: `all`, `requirement`, `evidence`, `conflict`, `stakeholder`, and `brd`. Current implementation is database-backed project data filtering, not Meilisearch or vector retrieval.

## Status codes

`400` malformed request, `404` unknown project, `413` source too large, `415` unsupported source type, `503` database/provider unavailable or write attempted in demo mode.

## Local smoke checks

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/projects
```
