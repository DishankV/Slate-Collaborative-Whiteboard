# Slate — a shared team whiteboard

A real-time, multi-person whiteboard: teammates open the same board link, sketch
together on one canvas, see each other's cursors live, and talk it through in a
side chat panel. Everything drawn and said is saved to MongoDB, so refreshing
or reconnecting never loses work.

MERN stack: **M**ongoDB + **E**xpress + **R**eact + **N**ode, with Socket.io for
the real-time layer.

## What's included

- **Live drawing** — pen + eraser, adjustable color/width, undo-your-last-stroke,
  clear-the-board — synced instantly to everyone on the board.
- **Presence** — avatar list of who's connected, plus live colored cursors with
  names as people move around the canvas.
- **Discussion panel** — a persisted chat thread alongside the board.
- **Data safety** — every stroke and message is written to MongoDB as it
  happens (strokes are saved when a stroke finishes, not on every pixel, to
  keep writes efficient). Reload the page or come back tomorrow and the board
  is exactly as it was.
- **Access control** — boards get a short shareable code; the creator can
  optionally set a password, which is bcrypt-hashed server-side and verified
  on every join (never trust a client-only check).
- **Hardening** — helmet security headers, a CORS allowlist, rate limiting on
  the REST API, input length limits, and Mongo query sanitization.

## Project layout

```
mern-whiteboard/
├── backend/     Express API + Socket.io server + Mongoose models
├── frontend/    React (Vite) SPA
└── docker-compose.yml   Mongo + backend + frontend, wired together
```

## Local development (no Docker)

You'll need Node 18+ and a MongoDB instance (local `mongod`, or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster — Atlas is the easier
path since you don't have to install/manage Mongo yourself).

```bash
# Backend
cd backend
cp .env.example .env        # then set MONGO_URI to your Mongo connection string
npm install
npm run dev                 # http://localhost:4000

# Frontend, in a second terminal
cd frontend
cp .env.example .env        # VITE_SERVER_URL should point at the backend above
npm install
npm run dev                 # http://localhost:5173
```

Open two browser windows at `http://localhost:5173`, create a board in one,
and join it from the other with the board code — you should see both cursors
and strokes sync live.

## Running everything with Docker

This is the easiest way to run the full stack (Mongo included) as one unit,
with drawings persisted in a named Docker volume so they survive container
restarts and rebuilds.

```bash
cp .env.example .env
# edit .env: set a real MONGO_ROOT_PASSWORD, and CLIENT_ORIGIN/VITE_SERVER_URL
# if you're not just testing on localhost

docker compose up --build
```

- Frontend: http://localhost:8080
- Backend health check: http://localhost:4000/health

`docker compose down` stops everything; add `-v` only if you actually want to
delete the Mongo volume (and therefore every board).

## Deploying to production

**Be aware up front:** Vercel's serverless functions aren't a good fit for the
Socket.io backend — they don't hold long-lived WebSocket connections the way
this app needs, so drawing sync would be unreliable there. The practical split
is:

- **Frontend → Vercel.** It's a static Vite build, which is exactly what
  Vercel is built for.
- **Backend → a host that runs a persistent Node process.** Render, Railway,
  Fly.io, or your own VPS all work — and the `backend/Dockerfile` here deploys
  as-is to any of them.
- **Database → MongoDB Atlas.** Free tier is enough to start; enable network
  access restrictions and a strong password.

### Frontend on Vercel

1. Import this repo into Vercel, and set **Root Directory** to `frontend`.
   Vercel auto-detects Vite; no extra config needed.
2. Add an environment variable `VITE_SERVER_URL` set to your deployed
   backend's URL (e.g. `https://your-backend.onrender.com`). Vite env vars are
   baked in at build time, so set this *before* deploying.
3. Deploy.

### Backend on Render / Railway / Fly.io (Docker-based)

All three can build straight from `backend/Dockerfile`. In each case, set:

| Env var | Value |
|---|---|
| `MONGO_URI` | your Atlas connection string |
| `CLIENT_ORIGIN` | your Vercel frontend URL (e.g. `https://slate.vercel.app`) |
| `NODE_ENV` | `production` |
| `PORT` | usually injected automatically by the host |

Once it's live, update `VITE_SERVER_URL` on Vercel to match and redeploy the
frontend.

### Self-hosting both with Docker

If you'd rather keep everything on your own infrastructure, `docker-compose.yml`
at the repo root runs Mongo + backend + frontend together — see the section
above. Point a reverse proxy (nginx, Caddy, Traefik) with TLS at the frontend
container's port 80 for a real domain.

## Environment variables reference

**backend/.env**
- `PORT` — port the API/socket server listens on (default `4000`)
- `MONGO_URI` — MongoDB connection string
- `CLIENT_ORIGIN` — comma-separated list of origins allowed to call the API /
  open a socket connection
- `BCRYPT_SALT_ROUNDS` — cost factor for board password hashing (default `10`)

**frontend/.env**
- `VITE_SERVER_URL` — base URL of the backend (baked in at build time)

## Honest limitations / what I'd add next

- **No user accounts.** Access is by board link (+ optional password), which
  fits "teammates with a shared link" but doesn't give you per-user audit
  trails or org-level access control. Worth adding real auth (e.g. JWT +
  your team's SSO) if that matters for you.
- **Single-instance presence.** Who's-online tracking lives in the backend
  process's memory. That's fine for one backend container, but if you ever
  scale the backend horizontally (multiple instances behind a load balancer),
  you'd need a shared store for presence (e.g. the `socket.io-redis` adapter)
  so users on different instances still see each other.
- **Not load-tested.** The stroke-persistence pattern (save on stroke-end, not
  per-point) is designed to scale reasonably, but I haven't benchmarked it
  under many simultaneous heavy drawers on one board.
- **No automated tests yet.** I verified the backend with syntax checks and a
  clean startup against a real Mongo-shaped connection string, and verified
  the frontend with a full production build (`vite build` succeeds with no
  errors) — but I didn't have a live MongoDB instance available in the
  sandbox this was built in, so I couldn't run a true end-to-end draw → save →
  reload test. I'd recommend doing that pass yourself with `docker compose up`
  before rolling this out to your team.
