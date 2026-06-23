#!/usr/bin/env bash
#
# dev.sh — one command to run the whole stack in Docker (macOS, Linux, Windows WSL).
#
# Postgres, backend, and frontend run in containers via Docker Compose — nothing
# is installed on your machine except Docker. Your source is bind-mounted into the
# containers, so edits to ./backend and ./frontend apply LIVE (the backend reloads,
# the frontend hot-reloads in the browser). The stack runs in the background, so
# you do NOT need to keep a terminal open.
#
#   ./scripts/dev.sh           build + start the stack (detached), print URLs
#   ./scripts/dev.sh logs      follow the logs
#   ./scripts/dev.sh down      stop and remove the containers (keeps the DB data)
#   ./scripts/dev.sh reset     down + delete the database volume (fresh DB)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$SCRIPT_DIR")"
cd "$REPO"

# compose.yml = base, compose.override.yml = local dev (build/ports),
# compose.dev.yml = workshop tweaks (internal Postgres, uncommon ports, live mounts).
# Passing -f disables auto-loading, so we list all three explicitly.
COMPOSE="docker compose -f compose.yml -f compose.override.yml -f compose.dev.yml"

# Host ports — uncommon by default so they're very likely free. Override per-run:
#   BACKEND_PORT=18500 FRONTEND_PORT=15500 ./scripts/dev.sh
# Exported so Docker Compose interpolates the same values in compose.dev.yml.
export BACKEND_PORT="${BACKEND_PORT:-18000}"
export FRONTEND_PORT="${FRONTEND_PORT:-15173}"
# Referenced only by the (unused) playwright service; define it so Compose
# doesn't print a "variable is not set" warning on every command.
export CI="${CI:-}"

# Only what the workshop demo needs: Postgres, backend, frontend. We skip
# `proxy` (traefik), `playwright`, `adminer`, and `mailcatcher` to keep the
# footprint small. `prestart` (migrations + superuser seed) and `db` are pulled
# in automatically as backend's dependencies, but we list them for clarity.
SERVICES="db prestart backend frontend"

c_blue=$'\033[34m'; c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_red=$'\033[31m'; c_off=$'\033[0m'
log()  { printf '%s==>%s %s\n' "$c_blue"   "$c_off" "$*"; }
ok()   { printf '%s ok%s  %s\n' "$c_green"  "$c_off" "$*"; }
warn() { printf '%swarn%s %s\n' "$c_yellow" "$c_off" "$*"; }
die()  { printf '%serror%s %s\n' "$c_red"   "$c_off" "$*" >&2; exit 1; }

port_busy() { # returns 0 (true) if something is already listening on 127.0.0.1:$1
  python3 - "$1" 2>/dev/null <<'PY'
import socket, sys
s = socket.socket(); busy = s.connect_ex(("127.0.0.1", int(sys.argv[1]))) == 0; s.close()
sys.exit(0 if busy else 1)
PY
}

case "${1:-up}" in
  down)  exec $COMPOSE down ;;
  reset) exec $COMPOSE down -v ;;
  logs)  exec $COMPOSE logs -f $SERVICES ;;
  up|"") ;;
  *) die "unknown command: $1 (use: up | logs | down | reset)" ;;
esac

# --- preflight ----------------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "Docker not found — install Docker Desktop / Rancher Desktop"
docker info >/dev/null 2>&1 || die "Docker is installed but not running — start Docker Desktop / Rancher Desktop"

# Backend/frontend publish these host ports (Postgres is internal — not here).
conflict=0
for entry in "$BACKEND_PORT:backend" "$FRONTEND_PORT:frontend"; do
  port="${entry%%:*}"; svc="${entry##*:}"
  var="$(echo "$svc" | tr '[:lower:]' '[:upper:]')_PORT"
  if port_busy "$port"; then warn "port $port ($svc) is already in use — set $var=<free port> or stop whatever owns it"; conflict=1; fi
done
[ "$conflict" -eq 1 ] && warn "resolve the port conflicts above, then re-run ./scripts/dev.sh"

# --- build + start (detached) -------------------------------------------------
log "building and starting the stack"
warn "the first run builds images — a few minutes ONCE; later runs are cached and start in seconds"
$COMPOSE up -d --build $SERVICES

# --- wait for the backend to be healthy ---------------------------------------
log "waiting for the backend (migrations + superuser seed run automatically)"
healthy=0
for _ in $(seq 1 90); do
  if curl -fsS -m 2 "http://localhost:$BACKEND_PORT/api/v1/utils/health-check/" >/dev/null 2>&1; then healthy=1; break; fi
  sleep 2
done
if [ "$healthy" -eq 1 ]; then ok "backend healthy"; else warn "backend not ready yet — check: ./scripts/dev.sh logs"; fi

cat <<BANNER

${c_green}────────────────────────────────────────────────────────${c_off}
  Frontend   ${c_blue}http://localhost:$FRONTEND_PORT${c_off}
  API docs   ${c_blue}http://localhost:$BACKEND_PORT/docs${c_off}
  Login      admin@example.com  /  changethis
${c_green}────────────────────────────────────────────────────────${c_off}
  The stack runs in the background — no need to keep this terminal open.
  Edit ./backend or ./frontend and just save — changes apply live.
  Follow logs:      ./scripts/dev.sh logs
  Stop everything:  ./scripts/dev.sh down
${c_green}────────────────────────────────────────────────────────${c_off}

BANNER
