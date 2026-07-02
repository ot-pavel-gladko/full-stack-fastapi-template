# Implementation brief — TRRND-23 Time tracking (run pavel.gladko-20260702-144118-5a9c)

## Ground rules
- Work on branch **`feature/TRRND-23-time-tracking`** only. Run **verify-branch before every commit** (confirm HEAD is on this branch, never `master`). The PR targets **base_branch `master`** per the manifest (`.adlc/feature.json`).
- **One commit per story.** Commit message must start with the story key, e.g. `TRRND-24: add Project entity, CRUD API, and migration`.
- **Follow the Items-module patterns.** Backend: `backend/app/models.py`, `backend/app/crud.py`, `backend/app/api/routes/items.py` (mount new routers in `backend/app/api/main.py`). Frontend: `frontend/src/routes/_layout/items.tsx`, `frontend/src/components/Items/`.
- **Tests ONLY in existing frameworks:** pytest for backend, Playwright for frontend. Do not introduce new test frameworks.
- **Regenerate the API client with `bun`, never `npm`** (use the repo's `scripts/generate-client.sh` flow). Any backend route/model change requires a client regen + frontend type-check before FE work relies on it.
- The approved wireframe **`wireframes/TRRND-23.html`** on this branch is the **design of record**.
- Ownership scoping convention (from Items): regular users see/manage only their own rows; superusers see/manage all. UUID PKs; FKs use `ondelete=CASCADE`.

## Batch 1 — backend (TRRND-24, TRRND-25, TRRND-26)

### TRRND-24 [BE] Add Project entity, CRUD API, and migration
Introduce a `Project` entity that time can be logged against, following the Item module pattern.

Model — `Project` SQLModel table, fields:
- `id` (UUID), `name` (required, 1–255), `client` (optional, max 255), `description` (optional, max 255)
- `is_billable_default` (bool, default true), `status` (enum `active`/`archived`, default `active`)
- `owner_id` (FK → `user.id`, `ondelete=CASCADE`), `created_at`

Add schema variants `ProjectBase`/`ProjectCreate`/`ProjectUpdate`/`ProjectPublic`/`ProjectsPublic` mirroring the Item family in `backend/app/models.py`. Add CRUD (create/list/get/update/delete) in `backend/app/crud.py`. Add REST endpoints in **new** `backend/app/api/routes/projects.py` mounted under **`/api/v1/projects`**, mirroring `items.py` ownership scoping. Generate an Alembic migration for the `project` table.

Acceptance criteria:
1. pytest: `POST /api/v1/projects/` as an authenticated user returns success with the created project's `id`, `name`, and `status="active"`.
2. pytest: `GET /api/v1/projects/` returns only the requesting user's own projects (paginated `data`+`count` shape); a superuser sees projects across all users.
3. pytest: `PUT /api/v1/projects/{id}` and `DELETE /api/v1/projects/{id}` fail with 403/404 when called by a non-owner who is not a superuser.
4. pytest: `PUT /api/v1/projects/{id}` can update `status` to `archived` and the response reflects the change.
5. pytest: after the new Alembic migration runs, the `project` table exists with the fields listed above.

Out of scope: TimeEntry model/endpoints; summary endpoint; frontend. Depends on: none (first backend story).

### TRRND-25 [BE] Add Time Entry entity, CRUD API, and migration
Introduce a `TimeEntry` entity representing a single logged block of hours against a `Project`, following the Item CRUD pattern.

Model — `TimeEntry` SQLModel table, fields:
- `id` (UUID), `project_id` (FK → `project.id`, `ondelete=CASCADE`), `owner_id` (FK → `user.id`, `ondelete=CASCADE`)
- `entry_date` (date, required), `hours` (numeric, required, > 0), `description` (optional, max 255)
- `is_billable` (bool, default true), `created_at`

Add schema variants `TimeEntryBase`/`TimeEntryCreate`/`TimeEntryUpdate`/`TimeEntryPublic`/`TimeEntriesPublic`. Add CRUD + REST endpoints in **new** `backend/app/api/routes/time_entries.py` under **`/api/v1/time-entries`**, same ownership scoping as items. On create, validate `project_id` refers to a project the caller may log against (own project, or any project if superuser). Generate an Alembic migration for the `time_entry` table.

Acceptance criteria:
1. pytest: `POST /api/v1/time-entries/` with `project_id`, `entry_date`, `hours`, `description`, `is_billable` returns success with those fields echoed back.
2. pytest: creating an entry against a non-existent `project_id`, or one belonging to another user, returns 404/403.
3. pytest: `GET /api/v1/time-entries/` returns only the caller's own entries (paginated), most-recent `entry_date` first; a superuser sees entries across all users.
4. pytest: `PUT /api/v1/time-entries/{id}` updates `hours`, `description`, `is_billable`; a non-owner, non-superuser call is rejected with 403/404.
5. pytest: `DELETE /api/v1/time-entries/{id}` removes the entry and a subsequent `GET` for that id returns 404.
6. pytest: deleting a `Project` cascade-deletes its `TimeEntry` rows (per the `ondelete=CASCADE` convention).

Out of scope: summary endpoint; frontend Log Time screen. Depends on: TRRND-24.

### TRRND-26 [BE] Add hours summary endpoint for the Hours Dashboard
Add a read-only aggregation endpoint powering the Hours Dashboard.

Endpoint — **`GET /api/v1/time-entries/summary`**, `period` query param (`week`, `month`, `quarter`; default `week`). Returns:
- `total_hours`, `billable_hours`, `non_billable_hours`
- `active_project_count` (projects with status `active`), `total_project_count`
- `by_day` breakdown: date, total hours, billable hours — covering the period
- `by_project` breakdown: project name, total hours, billable hours, percent billable — for projects with ≥1 entry in the period

Scope results to the caller's own time entries (superusers see all), matching the Time Tracking ownership rule.

Acceptance criteria:
1. pytest: seed entries across ≥2 projects and ≥2 days, call with `period=week`; `total_hours` equals sum of seeded hours and `billable_hours + non_billable_hours == total_hours`.
2. pytest: `by_project` contains one row per project with entries in the period, `total_hours` matching that project's period entries sum.
3. pytest: `by_day` only includes days within the selected period's date range.
4. pytest: a regular user's summary reflects only their own entries; a superuser (with entries seeded for two different users) sees the combined total.
5. pytest: an unsupported `period` value returns a 422 validation error.

Out of scope: frontend Hours Dashboard; drill-down/detail views. Depends on: TRRND-24, TRRND-25.

## Backend mini-gate (after Batch 1, before any FE work)
- `alembic upgrade head` succeeds AND `alembic heads | wc -l` == **1** (single migration head — no divergent branches).
- App boots cleanly.
- pytest green (new + existing).
- Then stamp `timeline["5-be"]` in `.adlc/feature.json` and commit.
- Regenerate the typed API client with **bun** so FE work builds against the new Project / TimeEntry / summary types.

## Batch 2 — frontend (TRRND-30 first — nav routes; then TRRND-27, TRRND-28, TRRND-29)

### TRRND-30 [FE] Add "Time Tracking" sidebar navigation group  *(build first)*
Add the "Time Tracking" nav group to the authenticated sidebar (`frontend/src/components/Sidebar/Main.tsx`), per the wireframe: group label **"Time Tracking"** containing **Projects, Log Time, Hours Dashboard**, positioned below Dashboard/Items and above Admin, each with active-route highlighting consistent with the existing `Main.tsx` pattern. Cross-cutting prerequisite that makes the three screens reachable.

Acceptance criteria:
1. Playwright: sidebar shows a "Time Tracking" group label with three links: "Projects", "Log Time", "Hours Dashboard".
2. Playwright: clicking each link navigates to `/projects`, `/log-time`, `/hours-dashboard` respectively, and the sidebar highlights the active link.
3. Playwright: the group and its links are visible to both regular and superuser accounts (no permission gate, unlike Admin).

Out of scope: the three screens themselves; collapsible sidebar group (always visible). Depends on: none directly (the screen stories depend on this).

### TRRND-27 [FE] Build Projects screen with card/table view switch
Build the `/projects` route per the wireframe "Projects" screen: card-view grid (**default**), table view, a view switch, a "New Project" dialog, and an empty state.

Add `frontend/src/routes/_layout/projects.tsx` (TanStack Router + TanStack Query, following `items.tsx`). Add `frontend/src/components/Projects/`:
- `AddProject.tsx` — dialog form: name, client, description, "Billable by default" checkbox (`react-hook-form` + `zod`, mirroring `AddItem.tsx`)
- `columns.tsx` — table view columns: **Project, Client, Default billable badge, Status badge, "Hours logged (this month)"**
- project-card component — card view: name, client, billable/status badges, hours-this-month
- view-switch control (card/table); **card view is default**
- empty state "You don't have any projects yet" (with a New Project CTA) shown in both view modes when the list is empty

Acceptance criteria:
1. Playwright: navigating to Projects shows card view by default with a "New Project" button visible.
2. Playwright: clicking the table-view toggle shows headers "Project", "Client", "Default billable", "Status", "Hours logged (this month)"; clicking card-view returns to the card grid.
3. Playwright: opening "New Project", filling name (required) + client (optional), submitting → new project appears in the list and a success toast shows.
4. Playwright: submitting "New Project" with an empty name shows a validation error and does not close the dialog.
5. Playwright: with zero projects, the empty state ("You don't have any projects yet" + New Project CTA) is shown in place of the grid/table.

Out of scope: editing/archiving an existing project via a dialog (wireframe shows only a "More actions" placeholder); backend endpoints. Depends on: TRRND-24, TRRND-30.

### TRRND-28 [FE] Build Log Time screen with entry form and recent entries list
Build the `/log-time` route per the wireframe "Log Time" screen: new-time-entry form + "Recent entries" table.

Add `frontend/src/routes/_layout/log-time.tsx`. Add `frontend/src/components/TimeEntries/LogTimeForm.tsx` (`react-hook-form` + `zod`):
- Project (required), Date (required, **defaults to today**), Hours (required, > 0), Description (optional)
- Billable checkbox that **pre-fills from the selected project's default-billable flag but remains user-editable**
- Project select lists **only `status = active` projects** (archived excluded from select)
- "Recent entries" table: Date, Project, Hours, Description, Billable badge, edit action — most recent first
- Invalidate the entries query on successful create so "Recent entries" refreshes

Acceptance criteria:
1. Playwright: fill form (select project, set hours, add description), submit → new entry appears at top of "Recent entries" and a success confirmation shows.
2. Playwright: submitting without selecting a project shows a validation message and does not submit.
3. Playwright: submitting without entering hours shows a validation message and does not submit.
4. Playwright: selecting a project whose default-billable is true → Billable checkbox becomes checked automatically; user can still uncheck it before submitting.
5. Playwright: the Project select only offers `status = "Active"` projects (an archived project seeded via API does not appear).

Out of scope: editing an existing time entry via a dedicated dialog (row edit icon not built out); backend endpoints. Depends on: TRRND-24, TRRND-25, TRRND-30.

### TRRND-29 [FE] Build Hours Dashboard screen with period toggle and breakdowns
Build the `/hours-dashboard` route per the wireframe "Hours Dashboard" screen.

Add `frontend/src/routes/_layout/hours-dashboard.tsx`:
- Four summary metric cards: **Total hours, Billable hours, Non-billable hours, Active projects**
- "Hours by day" bar chart (billable vs non-billable split per day — wireframe's teal/gray split bars)
- Per-project breakdown table: **Project, Total hours, Billable, % billable, share-of-period progress bar**
- Period toggle: **This week / This month / This quarter (default "This week")** — re-fetches the summary from the backend aggregation endpoint and re-renders all widgets

Acceptance criteria:
1. Playwright: navigating to Hours Dashboard renders the four metric cards with numeric values sourced from the API.
2. Playwright: the "Hours by day" chart renders one bar per day in the selected period.
3. Playwright: the per-project table lists only projects with logged time in the period; "Total hours" matches the API response.
4. Playwright: clicking "This month" changes the metric-card values to reflect the month-scoped API response (distinct from week-scoped).
5. Playwright: "This week" is selected by default on first load.

Out of scope: drill-down/detail page beyond the summary widgets; backend aggregation logic. Depends on: TRRND-26, TRRND-30.

## Full runtime gate (before PR)
- Migrations: **single head** (`alembic heads | wc -l` == 1); `alembic upgrade head` succeeds.
- App boots via **docker compose**.
- End-to-end smoke: **create Project → log a TimeEntry against it → summary endpoint returns correct aggregates** (totals and billable split reflect the logged entry).
- pytest green (new + existing), Playwright green, frontend build succeeds, API client regenerated with bun (no drift).
- **"Could not verify" is NOT a pass** — each gate item must be positively confirmed before opening the PR.

## Excluded
- **TRRND-31 [WF]** — Document approved Time Tracking wireframe deliverable. Design/sign-off record only; no code changes. Stays at **Ready for Dev**; do **not** implement. (Its content — the wireframe as design-of-record and the two resolved PO assumptions — is captured in this brief and reflected in the FE stories.)

## PO decisions already made
- **Default-billable pre-fills (does not lock)** the Log Time Billable checkbox; the user can still change it before submitting.
- **Projects view-mode (card vs table) is not persisted** across sessions in this scope.
- **Archived projects are hidden from the Log Time project select** but **remain visible on the Projects screen** (for reporting).
