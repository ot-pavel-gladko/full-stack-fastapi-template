# Implementation Brief — TRRND-68 Time tracking (run pavel.gladko-20260715-155517-27ec)

Branch: feature/TRRND-68-time-tracking (base: master). Wireframe (source of truth for all UI): wireframes/TRRND-68.html. Follow the existing Items-module patterns throughout: backend SQLModel + FastAPI CRUD + Alembic; frontend TanStack Router/Query + React Hook Form + shadcn/ui. Keep it simple: no approval workflows, invoicing, CSV export, or timer/stopwatch.

## Slice plan (consecutive)
- Slice 1 — Projects: TRRND-69 (BE) + TRRND-72 (FE) + TRRND-75 (FE nav, cross-cutting)
- Slice 2 — Log Time: TRRND-70 (BE) + TRRND-73 (FE)
- Slice 3 — Hours Dashboard: TRRND-71 (BE) + TRRND-74 (FE)
- TRRND-76 (WF) is already delivered (approved wireframe) — no work.

## TRRND-69 [BE] Project entity, CRUD API + migration
Project (SQLModel, Item pattern: UUID PK, owner scoping, Base/Create/Update/Public + list schema split). Fields: name (required, 1-255), client (optional, ≤255), description (optional), status ("active"|"archived", default "active"), owner_id (FK user.id, cascade delete), created_at (UTC, tz-aware). Routes at /api/v1/projects/ (CRUD). ACs: POST creates owned row, returns ProjectPublic 201; non-owner non-superuser GET/PUT/DELETE → 403/404 per Item rule; superuser GET lists all users' projects; Alembic migration creates `project` table, downgrade removes cleanly. New pytest tests in backend/tests/api/routes/test_projects.py: test_create_project, test_read_project, test_read_projects, test_update_project, test_delete_project, test_non_owner_cannot_access_project.

## TRRND-70 [BE] TimeEntry entity, CRUD API + migration
TimeEntry fields: project_id (FK project.id, cascade delete), date (required), hours (required, decimal 0.25–24, step 0.25), description (required), billable (bool, default true), owner_id, created_at. Routes at /api/v1/time-entries/ (CRUD; GET supports ?project_id= filter), owner-scoped (superuser sees all). ACs: valid POST → 201 TimeEntryPublic; hours outside 0.25–24 → 422; project delete cascades to its time entries. New pytest tests in backend/tests/api/routes/test_time_entries.py: test_create_time_entry, test_create_time_entry_invalid_hours, test_read_time_entries_by_project, test_update_time_entry, test_delete_time_entry, test_cascade_delete_on_project_delete.

## TRRND-71 [BE] Hours-summary endpoint
Read-only summary backing the dashboard: total_hours, billable_hours, non_billable_hours, entries_count, plus per-project breakdown (billable/non-billable/total hours), filterable by range=week|month|all. Exact path is an implementation decision (e.g. /api/v1/time-entries/summary). ACs: totals reconcile (sum of per-project totals = total_hours); range changes the aggregation window; non-superuser gets only own entries aggregated. New pytest tests in backend/tests/api/routes/test_time_entries_summary.py: test_summary_totals_reconcile, test_summary_range_filter, test_summary_scoped_to_owner.

## TRRND-72 [FE] Projects screen (table + cards view toggle)
Per wireframe screen-projects. Page header + "New Project" dialog (name, client, description) → POST /api/v1/projects/, success toast, TanStack Query invalidation (Items AddItem pattern). Default TABLE view: columns Project, Client, Status, Hours logged, Billable %, "Log time" row action. CARDS view via segmented toggle (PO-APPROVED — must not be dropped): cards show name, status badge, client, hours logged, billable %, "Log time" button; toggle shows active state; view state persists during session; empty state ("You don't have any projects yet") works in BOTH views. Hours logged / billable % are backend aggregates, not client-computed (until slice 3's summary exists, showing 0/— from available data is acceptable; wire real aggregates when the summary endpoint lands). Follow Items pattern: columns.tsx + shared DataTable.

## TRRND-73 [FE] Log Time screen
Per wireframe screen-logtime. Form: Project select (user's projects), Date, Hours, Billable checkbox, Description; react-hook-form + zod validation blocks missing required fields. Save → POST /api/v1/time-entries/, success toast, form resets ("Clear" button also resets). Recent-entries table below: Date, Project, Description, Hours, Billable badge (Billable / Non-billable); refetches after create.

## TRRND-74 [FE] Hours dashboard
Per wireframe screen-dashboard. Range tabs (This week / This month / All time, default week) re-query the summary endpoint. Four stat cards: Total hours, Billable hours, Non-billable hours, Entries logged. "Hours by project" bars with billable/non-billable segments + legend. "Totals per project" table (Billable, Non-billable, Total columns) with Total footer row reconciling with the cards.

## TRRND-75 [FE] Time Tracking sidebar navigation
"Time Tracking" group in the sidebar BETWEEN Items and Admin: clock icon, expand/collapse chevron, submenu Projects / Log Time / Hours Dashboard. Active-state: submenu item highlighted on its route, parent also marked active. Collapsed (icon-only) sidebar keeps the icon, hides submenu. Mirror existing sidebar behavior (frontend-layout-common).

## Protocol (mandatory, from measured runs)
1. One commit per story, story key first (e.g. "TRRND-69: Project model + CRUD"), push after each commit.
2. Backend-first within a slice; regenerate the API client with `bun` (NEVER npm — it leaves a stray package-lock.json).
3. Set `__tablename__` explicitly whenever the migration names the table in snake_case (TimeEntry → "time_entry"); SQLModel's default lowercased class name silently mismatches.
4. Implement + build once — do NOT self-verify. No pytest runs, no migration up/down cycles, no smoke tests, no lint/typecheck sweeps by the code agent. All verification happens exactly once at the facilitator-run slice gate.
5. No e2e suite (workshop fast profile). FE verification = gate's HTTP smoke + learner click-through.
6. Dev DB note: the compose db publishes on host port 5434 (5432 is taken); inside the compose network it's still db:5432.
