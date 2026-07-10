# Implementation Brief — TRRND-50 Time Tracking
Run: pavel.gladko-20260710-144144-0fba · Branch: feature/TRRND-50-time-tracking · Base: master
Design source of truth: wireframes/TRRND-50.html (PO-approved, incl. Projects table/cards switcher)

## Slice plan (vertical, one per screen; consecutive)
- Slice 1 — Projects: TRRND-51 (BE) + TRRND-54 (FE) + TRRND-57 (nav, cross-cutting)
- Slice 2 — Log Time: TRRND-52 (BE) + TRRND-55 (FE)
- Slice 3 — Hours Dashboard: TRRND-53 (BE) + TRRND-56 (FE)
- TRRND-58 (WF) — already delivered in Session 1; stays Ready for Dev.

## Global rules
- Follow the Items-module patterns: backend/app/models.py, crud.py, api/routes/items.py, tests/api/routes/test_items.py; frontend/src/components/Items/, routes/_layout/items.tsx, Sidebar/Main.tsx.
- Backend-first within each slice; Alembic migration authored by hand mirroring existing versions/ files (down_revision = current head).
- Regenerate the typed frontend client with bun (never npm — stray package-lock.json).
- One commit per story, story key first (e.g. "TRRND-51: Project model + CRUD"); push after each commit.
- Stay on feature/TRRND-50-time-tracking; verify-branch before every commit.
- Implement + build once — do NOT self-verify (no pytest runs, no migration up/down cycles, no smoke tests, no lint sweeps). All verification happens once at the slice gate, run by the facilitator.

## TRRND-51 [BE] Project entity, CRUD API + migration
Fields: name (req, 1-255), description (opt, ≤255), client (opt, ≤255), status (default "active"; not in create dialog), owner_id (FK user.id, CASCADE), created_at.
ACs: POST /api/v1/projects/ creates owned row, status defaults active, 201 ProjectPublic · GET lists own only (superuser: all), skip/limit, ProjectsPublic {data,count} · GET/PUT/DELETE /{id} owner-or-superuser; non-owner → 404 · deleting a project cascade-deletes its TimeEntry rows (DB-level) · Alembic migration creates project table · new pytest tests mirroring test_items.py: CRUD + ownership scoping.

## TRRND-52 [BE] TimeEntry entity, CRUD API + migration
Fields: project_id (FK project.id, req, CASCADE), entry_date (date, req), hours (numeric, req, >0, step 0.25), description (opt, ≤255), billable (bool default true), owner_id (FK user.id, CASCADE), created_at.
ACs: POST /api/v1/time-entries/ valid → 201 TimeEntryPublic · hours ≤ 0 / missing required → 422 · nonexistent or non-owned project_id (non-superuser) → 404 · GET lists own only (superuser all), optional project_id filter, skip/limit, TimeEntriesPublic · GET/PUT/DELETE /{id} owner-or-superuser; else 404 · migration creates time_entry table · new pytest tests: CRUD, hours validation, ownership scoping.

## TRRND-53 [BE] Hours-summary endpoint
GET /api/v1/time-entries/summary?period=week|month|quarter (default month). Scoped to current user (superuser: all). Returns total_hours, billable_hours, non_billable_hours, entries_count, hours_by_project [{project_id, project_name, total_hours}] for entries in period.
ACs: aggregation math correct (total = sum; billable/non-billable split; count) · period windows filter by entry_date · one hours_by_project row per project, correct sums · per-user scoping · new pytest tests: math, breakdown, period filter, scoping.

## TRRND-54 [FE] Projects screen (incl. table/cards view switcher)
Per wireframe view-projects. Table default: Project, Description, Client, Total Hours, Status badge. Toggle (shadcn ToggleGroup, list/grid icons) switches table ⇄ card grid (name, status badge, description, client, total hours, "Log time" button); client-side only, not persisted — PO-approved requirement. Total Hours values come from hours-summary hours_by_project (TRRND-53), not the Project entity (until slice 3 lands, render the column gracefully empty/0). "New Project" dialog: Name (req), Description, Client → POST, close + invalidate on success. "Log time" navigates to Log Time screen. No e2e suite.

## TRRND-55 [FE] Log Time screen
Per wireframe view-log. Form: Project (req select from GET /projects/), Date (req, default today), Hours (req, numeric, step 0.25, >0), Description (opt textarea), Billable checkbox (default checked). Save → POST, reset form, success toast (useCustomToast), invalidate time-entries + hours-summary caches. Invalid → zod inline errors. Clear resets. Recent Entries table: Date, Project, Description, Hours, Billable badge, Edit action; own entries, date desc, last 5. Edit → pre-filled dialog → PUT /{id}, invalidate. No e2e suite.

## TRRND-56 [FE] Hours dashboard
Per wireframe view-dashboard. 4 stat cards: Total, Billable, Non-Billable, Entries Logged (from summary endpoint, default month). Period tabs week/month/quarter (month default) re-fetch with period param. Hours-by-Project panel: row per project with proportional progress bar. Billable-vs-Non-Billable panel: split percentages + hours with simple visual. No e2e suite.

## TRRND-57 [FE] "Time Tracking" sidebar navigation (cross-cutting; slice 1)
Sidebar item between Items and Admin, icon consistent with existing style; expandable submenu: Projects, Log Time, Hours Dashboard → respective routes. Active-state highlight on parent + matching sub-item, mirroring the existing active-route pattern. No e2e suite.
