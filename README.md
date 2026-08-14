# HealthTutor

Student Attendance and Academic Monitoring System — an Advanced Software
Engineering capstone project.

## Overview

HealthTutor is a web-based system that lets tutors and administrators manage
students, courses, attendance, and assessments, and automatically identifies
students who may be academically at risk. It replaces manual spreadsheets and
ad-hoc tracking with a single dashboard-driven system that computes attendance
percentages and academic averages on the fly and classifies each student into
a risk category.

## Problem Statement

Tutors and academic coordinators typically track attendance and grades in
disconnected spreadsheets, making it slow and error-prone to spot students who
are falling behind — whether through poor attendance, weak academic
performance, or both — before it becomes a serious problem. HealthTutor
centralizes this data and surfaces at-risk students automatically, so
intervention can happen earlier.

## Features

- Student management (create, edit, view, delete, search, filter by risk)
- Course management and tutor assignment
- Student enrollment into courses
- Class session creation and attendance marking (with editing)
- Assessment creation with weighted grading and score entry
- Automatic attendance percentage and weighted academic average calculation
- Automatic risk classification (Good Standing / Attendance Risk / Academic
  Risk / High Risk)
- Role-scoped dashboard with attendance/performance charts and an at-risk
  students table
- Academic Monitoring page with filters, sorting, and per-risk-category
  summary counts
- Individual student academic profile with attendance and performance history
- Tutor management and general user management (administrator only)
- Fully responsive layout (desktop sidebar, mobile drawer navigation)

## User Roles

**Administrator** — manages students, courses, tutor assignments, and user
accounts; can view (and, like tutors, act on) attendance, assessments, and
monitoring data system-wide.

**Tutor** — manages class sessions, attendance, assessments, and scores for
the courses assigned to them; views students, statistics, and at-risk
students scoped to those courses.

Students do not have login access in this version. **Student login is a
documented future feature** — see `TECHNICAL_DEBT.md`.

## Technology Stack

| Layer          | Technology                                   |
| -------------- | --------------------------------------------- |
| Frontend       | Next.js (App Router), React, TypeScript       |
| Styling        | Tailwind CSS, shadcn/ui, Lucide icons          |
| Charts         | Recharts                                       |
| Backend        | Next.js Server Actions & Route Handlers        |
| Database       | PostgreSQL                                     |
| ORM            | Prisma                                         |
| Authentication | Auth.js (NextAuth) v5, Credentials + JWT        |
| Password hashing | bcryptjs                                      |
| Validation     | Zod                                            |
| Testing        | Vitest                                         |

## Architecture

```
app/
  login/                Login page + server action
  (dashboard)/           Authenticated shell (sidebar/header layout)
    dashboard/           Dashboard page
    students/             Students list, profile, server actions
    courses/               Courses list, detail, server actions
    attendance/            Session picker + attendance marking, server actions
    assessments/            Assessments + score entry, server actions
    monitoring/              Academic Monitoring page
    tutors/                   Tutor management (admin)
    users/                     User management (admin)
  unauthorized/, not-found, error   Error/edge states
  api/auth/[...nextauth]/            Auth.js route handler

components/
  ui/          shadcn/ui primitives
  layout/       Sidebar, header, mobile nav
  dashboard/     Stat cards, charts, risk badge, confirm dialog
  students/, courses/, attendance/, assessments/, tutors/, users/, monitoring/
                 Feature-specific UI components

lib/
  auth/          Auth.js config, credential verification, session actions
  db/             Prisma client + data-access/query functions per feature
  validation/      Zod schemas per feature
  calculations/     Pure business-logic functions (attendance %, academic
                     average, risk classification)
  permissions/       Server-side authorization helpers (RBAC)

prisma/
  schema.prisma    Data model
  seed.ts           Demonstration seed data

tests/
  calculations/    Unit tests for business rules
  validation/       Unit tests for score validation
  workflows/         Integration tests exercising server actions end-to-end
```

Business logic (attendance %, academic averages, risk classification, score
validation) lives in pure functions under `lib/calculations` and
`lib/validation`, independent of the UI and of Next.js request context, so it
can be unit tested directly. Data access is centralized in `lib/db/*.ts`.
Authorization is enforced server-side in `lib/permissions` and re-checked
inside every server action — the UI hides buttons a role shouldn't see, but
the server never trusts that alone.

## Installation

Prerequisites: Node.js 20+, pnpm, and a PostgreSQL server (local or hosted).

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable        | Description                                                |
| --------------- | ------------------------------------------------------------ |
| `DATABASE_URL`  | PostgreSQL connection string                                |
| `AUTH_SECRET`   | Secret used to sign session tokens (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`  | Base URL of the app (`http://localhost:3000` locally)       |

## Database Setup

Any PostgreSQL 14+ server works — a local install, Docker, or a hosted
provider such as [Neon](https://neon.tech) or [Supabase](https://supabase.com).

For a local Postgres server, create a dedicated role and database:

```sql
CREATE ROLE healthtutor LOGIN PASSWORD 'healthtutor';
CREATE DATABASE healthtutor OWNER healthtutor;
```

Then set `DATABASE_URL` in `.env` to point at it (see `.env.example` for the
format). For a hosted provider, just paste the connection string it gives you.

## Prisma Migration

```bash
pnpm db:migrate
```

This applies `prisma/migrations` and regenerates the Prisma Client. For
production deploys, use `npx prisma migrate deploy` instead (it does not
prompt and does not create new migrations).

## Seed Database

```bash
pnpm db:seed
```

Populates the database with the demonstration data described below. Seeding
is destructive — it clears existing rows in this schema first — so only run
it against a development or demo database.

## Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`.

## Demo Credentials

> **These are demonstration credentials only. Change them (or remove the
> seeded accounts) before using this system with real data.**

| Role          | Email                    | Password    |
| ------------- | ------------------------- | ----------- |
| Administrator | admin@healthtutor.com     | Admin123!   |
| Tutor         | tutor@healthtutor.com     | Tutor123!   |

The seed script also creates a second tutor (`tutor2@healthtutor.com` /
`Tutor123!`) and ~16 students spread across 3 courses, with attendance and
scores deliberately varied so the dashboard and monitoring page show students
in Good Standing, Attendance Risk, Academic Risk, and High Risk from the
first login.

## Testing

```bash
pnpm test
```

Tests run against a **separate** database (`.env.test` / a `healthtutor_test`
database) so they never touch your development data. Create that database and
apply migrations to it once:

```sql
CREATE DATABASE healthtutor_test OWNER healthtutor;
```

```bash
DATABASE_URL="postgresql://healthtutor:healthtutor@localhost:5432/healthtutor_test?schema=public" npx prisma migrate deploy
```

Test coverage includes:

- **Business logic** — attendance percentage, weighted academic average, and
  risk classification, including the exact boundary cases from the product
  spec (e.g. 74% vs. 75% attendance, 49% vs. 50% academic average).
- **Validation** — score-entry boundaries (`0 <= score <= maximumScore`).
- **Workflows** — login, create student, create course, enroll student,
  record and edit attendance, create assessment, record and edit scores, and
  the corresponding permission checks (e.g. a tutor cannot record attendance
  for a course they don't teach).

## Deployment

**Render (blueprint):** this repo includes a `render.yaml` that provisions a
free Postgres database and a web service in one step.

1. Push this repository to GitHub (Render deploys from a Git repo).
2. In the Render dashboard: **New → Blueprint**, point it at the repo. Render
   reads `render.yaml` and creates both the `healthtutor-db` database and the
   `healthtutor` web service, wiring `DATABASE_URL` between them and
   generating `AUTH_SECRET` automatically.
3. The build command (`pnpm prisma migrate deploy && pnpm build`) applies
   migrations on every deploy — no separate migration step needed.
4. Once live, optionally run `pnpm db:seed` against the Render database's
   external connection string (from the Render dashboard) to populate demo
   data: `DATABASE_URL="<external connection string>" pnpm db:seed`.
5. `AUTH_TRUST_HOST=true` is set so Auth.js infers the callback URL from
   Render's own domain — no `NEXTAUTH_URL` to configure.

Without the blueprint: create the web service and Postgres database
separately in the Render dashboard, set `DATABASE_URL` (from the database's
"Internal Connection String"), `AUTH_SECRET` (`openssl rand -base64 32`), and
`AUTH_TRUST_HOST=true` as environment variables, and use the same build/start
commands as above.

**Web app (Vercel):**

1. Push this repository to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Set the `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` environment
   variables in the Vercel project settings (`NEXTAUTH_URL` should be your
   production domain).
4. Deploy. Run `npx prisma migrate deploy` against the production database
   (via a one-off Vercel build step or locally with the production
   `DATABASE_URL`) before or during the first deploy.

**Database (Neon/Supabase):** create a Postgres database with either
provider, copy the connection string into `DATABASE_URL`, and run
`npx prisma migrate deploy` against it. Optionally run `pnpm db:seed` once for
a populated demo environment.

## Technical Debt

See [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) for deliberate MVP limitations,
their impact, and planned resolutions.

## Future Improvements

Documented, not implemented in this MVP: student/parent portals, email/SMS
notifications, QR-code or biometric attendance, configurable institutional
risk thresholds, PDF reports, CSV export, semester comparison and attendance
trend charts, predictive analytics, LMS integration, and a mobile app. See
`TECHNICAL_DEBT.md` for details on several of these.

## Known Limitations

- Risk thresholds (75% attendance, 50% academic) are fixed system-wide, not
  configurable per institution.
- No email/SMS notifications are sent to tutors about at-risk students —
  monitoring is dashboard-pull, not push.
- Students have no login of their own in this version.
- Reporting is on-screen only; there is no CSV/PDF export yet.
- Automated test coverage focuses on business logic and core workflows, not
  full UI end-to-end coverage.
#   h e a l t h t u t o r  
 #   h e a l t h t u t o r  
 