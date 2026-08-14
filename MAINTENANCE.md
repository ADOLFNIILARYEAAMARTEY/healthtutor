# Maintenance Guide

This document explains how HealthTutor is expected to be maintained after
initial delivery, using the standard four categories of software maintenance,
plus operational notes on backups, dependencies, security, logging, and
scalability.

## Corrective Maintenance

Fixing defects reported by users (tutors, administrators, or examiners).

- Reproduce the issue locally against a seeded database (`pnpm db:seed`)
  before changing anything.
- Business-rule bugs (wrong attendance %, wrong risk classification, wrong
  academic average) should first get a failing test in `tests/calculations`
  or `tests/validation` that reproduces the bug, then a fix, so the bug
  cannot silently reappear.
- Workflow bugs (a server action doing the wrong thing) should get a failing
  test in `tests/workflows` under the same principle.
- Run `pnpm build` and `pnpm test` before merging any fix — the build's
  TypeScript check has caught real bugs (e.g. mismatched Prisma field names)
  that tests alone would not.

## Adaptive Maintenance

Keeping the system working as its dependencies change.

- **Next.js / React**: this project pins to specific versions in
  `package.json` rather than floating on `latest`, precisely because a
  framework major version (Next.js 16, React 19) can change conventions
  (e.g. `middleware.ts` → `proxy.ts`, async `params`/`searchParams`). Upgrade
  deliberately, read the framework's migration guide, and re-run the full
  build + test suite before merging an upgrade.
- **Prisma**: pinned to the 6.x line deliberately (see `TECHNICAL_DEBT.md`
  is not the right place for this — see the note in `README.md`'s
  Technology Stack) because Prisma 7 changed how the client obtains its
  database connection (driver adapters, `prisma.config.ts`) in a way that
  is not yet a drop-in replacement for the classic `datasource { url = ... }`
  pattern this project uses. Revisit this pin once Prisma 7's driver-adapter
  workflow is stable and well-documented.
- **Auth.js (NextAuth) v5**: currently a beta release. Track the stable v5
  release and re-test the full login/logout/RBAC flow (see
  `tests/workflows/login.test.ts` and the manual RBAC checks in this
  project's development history) before upgrading.
- **Hosting platform**: if moving off Vercel/Neon, re-verify environment
  variable handling, connection pooling behavior (serverless Postgres
  connection limits matter — see Scalability below), and cold-start behavior.

## Perfective Maintenance

Improving usability, analytics, and reporting based on feedback.

- Track which parts of the UI generate support questions or confusion and
  simplify them — this is a dashboard for non-technical academic staff, and
  clarity beats feature count.
- Revisit `TECHNICAL_DEBT.md` regularly; several entries (configurable
  thresholds, CSV export, notifications) are exactly the kind of
  perfective work that should be prioritized by actual user feedback rather
  than guessed upfront.
- When adding a metric or chart, keep it in `lib/db/dashboard.ts` (or a new
  sibling module) rather than inlining queries in page components, so it
  stays testable and reusable.

## Preventive Maintenance

Refactoring, test coverage, dependency hygiene, and vulnerability monitoring.

- Run `pnpm audit` (or the equivalent for your package manager) periodically
  and before major releases.
- Keep business logic in `lib/calculations` and `lib/validation` free of
  framework and database imports — this is what makes it fast to unit test
  and safe to refactor.
- Prefer adding a new server action over growing an existing one when
  behavior diverges (e.g. don't overload `updateStudentAction` with
  unrelated bulk-import logic) — smaller, single-purpose actions are easier
  to test and reason about.
- Expand automated test coverage over time per `TECHNICAL_DEBT.md` (TD-02),
  particularly toward end-to-end coverage of the full examiner walkthrough.

## Database Backup Strategy

- **Hosted Postgres (Neon/Supabase)**: enable the provider's automated daily
  backups / point-in-time recovery. Both Neon and Supabase support this on
  their standard tiers — enable it explicitly, it is not always the default
  on free tiers.
- Before running destructive operations (a migration that drops a column, a
  bulk data fix) against production, take a manual snapshot/branch first.
- Local development: the seed script (`pnpm db:seed`) is destructive by
  design (it clears the schema before reseeding) — never point it at a
  database with real data.

## Dependency Update Strategy

- Review and update dependencies on a regular cadence (e.g. monthly for
  patch/minor versions), not just reactively.
- Major version upgrades (Next.js, React, Prisma, Auth.js) should be their
  own pull request, tested in isolation, with the full `pnpm build` +
  `pnpm test` run and a manual walkthrough of login, RBAC, and one full
  create → enroll → attendance → assessment → score cycle.
- Use `pnpm-workspace.yaml`'s `allowBuilds` list deliberately — only approve
  postinstall scripts for packages you've verified need them (Prisma's
  engine download, esbuild's native binary).

## Security Update Strategy

- Passwords are hashed with bcrypt (`bcryptjs`, 10 salt rounds) — never log,
  return, or store plaintext passwords anywhere, including in error
  messages.
- Every server action re-derives the caller's identity and role from the
  signed session (`lib/permissions`) rather than trusting any role or user
  ID passed from the client — preserve this pattern in all new actions.
- Rotate `AUTH_SECRET` if it is ever exposed, and immediately invalidate
  existing sessions (rotating the secret does this automatically, since it
  invalidates the JWT signature).
- Subscribe to security advisories for Next.js, Auth.js, and Prisma; apply
  security patches out-of-band from the regular update cadence above.

## Logging

- Server-side errors are logged via `console.error` in `app/error.tsx`'s
  client boundary and should be logged similarly in any new server action's
  catch blocks — log the underlying error server-side, but return only a
  generic, safe message to the client (see the `mapDbError`-style helpers in
  the existing server actions for the pattern).
- Never log password hashes, session tokens, or full request bodies that
  might contain credentials.
- When deployed on Vercel, use the platform's built-in function logs; for
  longer-term retention, forward logs to an external sink (e.g. Axiom,
  Logtail) as the system grows.

## Future Scalability

- The current data-access pattern (per-course queries with nested Prisma
  `include`s, aggregated in memory) is appropriate for the current scale
  (dozens of students, a handful of courses) and is covered in
  `TECHNICAL_DEBT.md` (TD-04) as needing revisit at larger scale.
- Serverless Postgres connection limits: if deploying to Vercel with a
  serverless Postgres provider, use the provider's connection pooler
  (Neon's pooled connection string, Supabase's `pgbouncer` mode) for
  `DATABASE_URL` in production to avoid exhausting connections under load.
- The dashboard/monitoring aggregation queries scale with the number of
  courses and their enrollments; if this becomes slow at larger scale,
  precomputing/caching risk classification (e.g. a nightly job writing a
  summary table) is the natural next step rather than optimizing the
  on-the-fly calculation.
