# Security

## Current MVP boundaries

- This is a single-user hackathon MVP. Authentication, authorization, organization isolation, CSRF protection for authenticated writes, and audit-log retention are not implemented. Do not expose write APIs publicly or use them with sensitive production data. Minimal project-scoped audit events exist for source ingestion and review decisions; they are not a complete security audit trail.
- Demo mode is read-only on the server. Browser-only project changes are temporary and must not be treated as saved records.
- Database mode uses PostgreSQL/Prisma. Configure a least-privilege database user and TLS connection.
- AI processing is optional. When configured, uploaded text is sent to the external provider named by `OPENAI_BASE_URL`; review provider data-retention terms before sending confidential content.
- Uploads are text-only, limited to 100 KB, and persisted as extracted text. Malware scanning, encryption-at-rest policy, retention/deletion workflows, and PDF/DOCX/image parsing are not implemented.
- Cloudinary, Supabase, Meilisearch, Upstash and Sentry credentials in `.env.example` are placeholders. Those integrations are not called by this MVP.

## Required before production

1. Add Supabase Auth server-side session verification and enforce project/organization authorization in every API handler.
2. Add CSRF/origin controls for cookie-based writes, per-user and per-project rate limits, upload quotas and request timeouts.
3. Restrict database credentials and network access; apply Prisma migrations through deployment automation; enable backups and tested restore procedures.
4. Add private object storage, signed upload/download URLs, MIME sniffing, malware scanning, retention/deletion controls, and encryption policy before accepting binary files.
5. Redact secrets and personal data before provider calls; document provider retention and obtain user consent.
6. Extend audit events to project, export, and all other sensitive changes, and add retention/access policies. Avoid logging source contents, tokens, or personal data.
7. Configure security headers, dependency scanning, secret scanning, Sentry scrubbing, and a documented incident-response path.

Never put server secrets in `NEXT_PUBLIC_*` variables. `.env*` is git-ignored; use the hosting platform's secret manager in deployment.
