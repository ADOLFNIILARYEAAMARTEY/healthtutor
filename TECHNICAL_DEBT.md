# Technical Debt Register

This document records deliberate limitations accepted to ship the HealthTutor
MVP within a short development period. Each entry explains what was cut, why,
what it costs us, how urgent it is, and how we'd resolve it.

Format: **Debt**, **Cause**, **Impact**, **Priority**, **Resolution**.

---

## TD-01 Configurable Risk Thresholds

**Debt:** Attendance (75%) and academic (50%) risk thresholds are hard-coded
constants (`lib/calculations/risk.ts`), not stored per-institution or
per-course.

**Cause:** MVP time constraints — a threshold-configuration UI and the
authorization/audit trail around who can change grading policy was out of
scope.

**Impact:** Institutions with different academic policies (e.g. an 80%
attendance requirement) cannot self-serve that change; it requires a code
change and redeploy.

**Priority:** Medium.

**Resolution:** Add an administrator "Risk Settings" page backed by a
`RiskPolicy` table (system-wide default, optionally overridden per course);
`classifyRisk` already accepts a `thresholds` argument, so the calculation
layer needs no rework — only the settings UI and a lookup at call sites.

---

## TD-02 Limited Automated Testing

**Debt:** Automated tests cover business-rule calculations (attendance %,
academic average, risk classification), score validation, and the core
create/enroll/attendance/assessment/score workflows at the server-action
level. There is no browser-driven end-to-end test suite and no component-level
UI testing.

**Cause:** Limited development period; prioritized correctness of the
calculations that drive risk classification (the highest-stakes logic) and
the workflows that persist data, over UI regression coverage.

**Impact:** A visual or interaction regression (e.g. a broken dialog, a
misrouted link) would not be caught automatically — it requires manual
verification.

**Priority:** High.

**Resolution:** Add Playwright end-to-end tests for the Definition-of-Done
walkthrough (login → create student → create course → enroll → attendance →
assessment → scores → dashboard), and component tests for the more complex
client components (attendance marking grid, score entry form).

---

## TD-03 Notifications Not Implemented

**Debt:** At-risk students are identified and displayed on the dashboard and
monitoring page, but no email or SMS notification is sent to tutors or
administrators automatically.

**Cause:** Notification integration (email/SMS provider, delivery tracking,
opt-in preferences) was excluded from MVP scope to keep the system simple to
demonstrate and deploy without third-party service dependencies.

**Impact:** Tutors must actively check the dashboard or monitoring page to
discover at-risk students; nothing proactively surfaces the information.

**Priority:** Medium.

**Resolution:** Introduce email notifications (e.g. via Resend or similar)
triggered on a scheduled job that re-evaluates risk status and notifies the
assigned tutor when a student crosses into a risk category. SMS as a
follow-up enhancement.

---

## TD-04 Client-Side Search, Filtering, and Pagination

**Debt:** Students, Courses, and Monitoring tables fetch their full dataset
server-side and filter/sort/search it in the browser; there is no
server-side pagination.

**Cause:** At capstone/demo scale (tens of students, a handful of courses)
client-side filtering is instant and much simpler than building paginated,
sortable server queries with URL-driven state.

**Impact:** This will not scale gracefully to an institution with thousands
of students — the full dataset is sent to the client on every page load.

**Priority:** Low (for current scale), Medium if adopted institution-wide.

**Resolution:** Move filtering/sorting to server-side query parameters with
`skip`/`take` pagination once realistic data volumes are known, keeping the
same UI.

---

## TD-05 No Export or Reporting Output

**Debt:** All monitoring, attendance, and performance data is view-only in
the browser; there is no CSV or PDF export.

**Cause:** Explicitly out of MVP scope per the product requirements.

**Impact:** Tutors/administrators who need an offline copy (e.g. for a
department meeting) must copy data manually.

**Priority:** Medium.

**Resolution:** Add CSV export on the Students, Monitoring, and Course
Performance tables, and a printable PDF summary for a student's academic
profile.

---

## TD-06 Single Deployment Environment Assumed

**Debt:** There is no staging/production environment separation documented
beyond "set different environment variables"; no infrastructure-as-code.

**Cause:** Out of scope for a capstone MVP demonstrating one deployed
instance.

**Impact:** Promoting changes safely (staging → production) is a manual
process today.

**Priority:** Low.

**Resolution:** Add a second Vercel project (or preview deployments) pointed
at a separate Neon/Supabase branch database for staging before promoting to
production.
