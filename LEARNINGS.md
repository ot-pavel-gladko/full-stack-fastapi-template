# Workshop Quickstart

Everything runs in Docker — you don't install Postgres, Node, or Python on your
machine. Works the same on **macOS, Linux, and Windows (WSL)**.

## 1. Prerequisites

- **Docker**, running — [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Rancher Desktop](https://rancherdesktop.io/).
- **uv** — [install](https://docs.astral.sh/uv/getting-started/installation/). Only needed for running backend tooling/tests outside Docker; the app itself doesn't require it.
- **Windows:** run everything inside your **WSL** shell, with Docker Desktop's WSL integration enabled.

## 2. Start it

```bash
cd src/full-stack-fastapi-template
./scripts/dev.sh
```

First run builds the images — **a few minutes, once**. After that it starts in
seconds. The stack runs **in the background**, so the command returns to your
prompt — **you don't need to keep a terminal open**. When it's up:

| What | URL | |
|------|-----|--|
| Frontend | http://localhost:15173 | login `admin@example.com` / `changethis` |
| API docs | http://localhost:18000/docs | Swagger UI |

> Uncommon ports (15173 / 18000) are used on purpose so they don't collide with
> whatever else you run. Need to change them? `BACKEND_PORT=18500 FRONTEND_PORT=15500 ./scripts/dev.sh`

**Both the backend and the frontend reload live as you edit** — the source is
bind-mounted into the containers, so saving a file in `backend/` or `frontend/`
applies immediately (backend restarts via `--reload`; frontend hot-reloads in the
browser via Vite HMR). No command, no terminal to keep open.

## 3. Stop / reset

```bash
./scripts/dev.sh down     # stop & remove containers (keeps DB data)
./scripts/dev.sh reset    # also wipe the database (fresh start)
./scripts/dev.sh logs     # follow all logs
```

## What the script does for you

- Runs only what the demo needs — Postgres (**internal to Docker, no host port**), backend, and frontend — via Docker Compose, in the background.
- Bind-mounts `./backend` and `./frontend` into the containers and runs each dev server with file-polling, so your edits apply live.
- Runs DB **migrations** and creates the **superuser** automatically (the `prestart` service) — you never run `alembic` or `init_db` by hand.
- Skips the Traefik proxy, Playwright, Adminer, and Mailcatcher to keep the footprint small.

## Building features during the workshop

- **Editing UI or API code?** Just save — the running stack reloads both (backend via `--reload`, frontend via Vite HMR). No command needed.
- **Changed the database models?** Generate a migration, then it's applied automatically: `docker compose exec backend alembic revision --autogenerate -m "..."` — `prestart` runs `alembic upgrade head` on the next start, or apply now with `docker compose exec backend alembic upgrade head`.
- **Changed the backend API and need the typed frontend client regenerated?** With the stack running: `docker compose exec frontend bun run generate-client` (or, with Node locally, `cd frontend && npm run generate-client`).
- **Added a Python or JS dependency?** That needs a rebuild — re-run `./scripts/dev.sh` (it always builds; `package.json`/`pyproject.toml` changes trigger an image rebuild).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `port 18000 / 15173 already in use` | Pick others: `BACKEND_PORT=18500 FRONTEND_PORT=15500 ./scripts/dev.sh`. |
| Backend never becomes healthy | `./scripts/dev.sh logs` — the `prestart` service must finish migrations before `backend` starts. |
| Edited a file but nothing reloaded | Make sure the stack is running (`./scripts/dev.sh logs`). Reloads use polling, so they apply within ~1s of saving. |
| Corrupted migration state / want a clean DB | `./scripts/dev.sh reset` |
| "Docker is installed but not running" | Start Docker Desktop / Rancher Desktop, then re-run. |
| Need to look inside the DB | `docker compose exec db psql -U postgres -d app` (Postgres has no host port; this opens a shell inside the container). |
