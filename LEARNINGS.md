# Post-Implementation Notes / Learnings

These notes are from actual execution of this assignment. Apply them to avoid known pitfalls.

## 1. Do NOT Use Docker Compose for Local Dev (Port Allocation Bug)

Docker Engine has a known bug where `docker-proxy` processes become orphaned when containers fail to start. This causes persistent "port already allocated" errors even when nothing is listening. The IPv6 dual-stack binding (`0.0.0.0` + `::`) makes it worse.

**Symptoms:** `Bind for 0.0.0.0:5173 failed: port is already allocated` even after `docker compose down` and `systemctl restart docker`.

**Root cause:** Docker creates `docker-proxy` listeners *before* starting the container. If the container start fails for any reason, the proxies remain orphaned and block subsequent attempts.

**Solution:** Run the app directly on the host instead of Docker:
```bash
# Backend
cd backend && uv run fastapi run --reload app/main.py

# Frontend
cd frontend && npx vite --host 127.0.0.1
```

**If you must use Docker**, the nuclear fix:
```bash
docker compose down
sudo pkill -9 -f docker-proxy
sudo systemctl restart docker
sleep 5
docker compose up -d
```

## 2. IPv6 localhost Issue

On systems where `localhost` resolves to `::1` (IPv6), the browser cannot reach uvicorn (which binds IPv4 only). Symptoms: browser shows connection refused or 404, but `curl http://127.0.0.1:8000/...` works fine.

**Detection:**
```bash
getent hosts localhost
# If it shows "::1 localhost" — apply the fix
```

**Fix before starting the app:**
- `frontend/.env`: change `VITE_API_URL=http://127.0.0.1:8000`
- `.env`: add `http://127.0.0.1:5173` to `BACKEND_CORS_ORIGINS`
- Start Vite with `--host 127.0.0.1`
- Access the app at `http://127.0.0.1:5173`, not `http://localhost:5173`

## 3. Fix recover-password.tsx BEFORE Starting Frontend

`frontend/src/routes/recover-password.tsx` may have a pre-existing bug — `z.object({` unclosed. This crashes Vite's TanStack Router code-splitter and blocks ALL routes, not just recover-password. Fix it before any frontend work:

```typescript
// Line 33-35: Ensure proper closure
const formSchema = z.object({
  email: z.string().email(),
})
```

## 4. Backend Subagents Must NOT Run `alembic upgrade`

Generate the migration only (`alembic revision --autogenerate`), NOT apply it (`alembic upgrade head`). Migrations should be applied once, manually, after all models are in place. If a subagent runs upgrade and it fails, the migration state gets corrupted.

**If migration state is corrupted** (error like `Can't locate revision identified by 'xxxxx'`):
```bash
sudo -u postgres psql -c "DROP DATABASE app;"
sudo -u postgres psql -c "CREATE DATABASE app;"
cd backend && uv run alembic upgrade head
```

## 5. Regenerate Frontend Client BEFORE Frontend Stories

After all backend stories are complete, run `npm run generate-client` in the frontend directory ONCE. This generates TypeScript types and service classes from the OpenAPI spec. Frontend subagents need these types to exist.

## 6. Run `init_db` After Migrations

Outside Docker, the superuser is not created automatically. After running `alembic upgrade head`, also run:
```bash
cd backend && uv run python app/initial_data.py
```
Without this, login will fail with "Incorrect email or password".

## 7. Kill Stale Processes Before Starting

Repeated starts/stops leave orphan processes. Always clean up first:
```bash
lsof -ti:8000 -ti:5173 | xargs kill -9 2>/dev/null
```

## 8. Clear Vite Cache If Errors Don't Match Code

If Vite shows errors for code you've already fixed, the TanStack Router generator cached the old version at startup:
```bash
cd frontend && rm -rf node_modules/.vite
```
Then restart Vite.

## 9. Verify Backend Routes Before Frontend

After starting the backend, confirm all routes are registered:
```bash
curl -s http://127.0.0.1:8000/api/v1/openapi.json | python3 -c "import sys,json; print(len(json.load(sys.stdin)['paths']), 'routes')"
```
Expected: 20 routes (including projects and time-entries). If 0, the backend loaded an old version — kill and restart.

## 10. PostgreSQL Setup (Non-Docker)

The app expects a local PostgreSQL with these settings (from `.env`):
```
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
```

Setup:
```bash
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'changethis';"
sudo -u postgres psql -c "CREATE DATABASE app;"
```

## Quick Start (Complete Sequence)

```bash
cd /home/pgladko/projects/AIDLSWorkshop/src/full-stack-fastapi-template

# 1. Kill stale processes
lsof -ti:8000 -ti:5173 | xargs kill -9 2>/dev/null

# 2. Start postgres
sudo service postgresql start

# 3. Run migrations + seed
cd backend && uv run alembic upgrade head && uv run python app/initial_data.py

# 4. Start backend
uv run fastapi run --reload app/main.py &

# 5. Start frontend
cd ../frontend && npx vite --host 127.0.0.1 &

# 6. Access
# Frontend: http://127.0.0.1:5173
# Backend API: http://127.0.0.1:8000
# API Docs: http://127.0.0.1:8000/docs
# Login: admin@example.com / changethis
```
