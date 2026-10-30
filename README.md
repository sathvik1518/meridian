# Meridian — full-stack React dashboard

A multi-page retail operations dashboard: **React** front end, **Express** back end, **Postgres** database, deployed on **Vercel**.

| Layer | What | Where it lives |
|---|---|---|
| Frontend | React 19, React Router, Context API, Zustand, TanStack Query, Formik + Yup, Tailwind | `src/` |
| Backend | Express REST API, JWT cookie auth, role checks, zod validation | `server/` |
| Database | Postgres (Neon in production, embedded PGlite on your laptop) | `server/schema.js`, `server/seed.js` |
| Deployment | Vercel (static site + one serverless function) | `vercel.json`, `api/index.js` |

**Live demo:** https://meridian-vert-seven.vercel.app

Demo logins: **admin@meridian.dev / admin123** (full access) · **viewer@meridian.dev / viewer123** (read only)

---

## Use your own data (no sample data)

The app starts with sample data so it looks full. To enter your own instead:

1. Sign in as admin → **Team** page → **Workspace data** → **Clear all data**. (Logins stay.)
2. **Products → New product** to add items (name, brand, category, price, stock, description).
3. **Orders → New order** to enter a customer and pick products. Stock goes down automatically, and the order is refused if you ask for more than is in stock.
4. The **Dashboard** fills in by itself from what you typed. **Load sample data** on the Team page brings the samples back (only into an empty workspace).

Want a brand-new database to start empty with no clearing step? Set the environment variable `SEED_DEMO=off` before the first start (on Vercel: add it next to `DATABASE_URL`).

## 1. Run it on your laptop (works with NO internet after `npm install`)

```bash
npm install        # needs internet ONCE. Keep the node_modules folder afterwards.
npm run dev        # starts API on :4000 and the website on :5173
```

Open http://localhost:5173. The database is created and filled with demo data on first start (saved in `.data/`). No Postgres install, no Docker, no `.env` needed.

Reset the data: stop the server, delete the `.data` folder, start again.

Other commands: `npm test` (31 tests) · `npm run build` (production build into `dist/`) · `npm start` (serve the built site + API together on :4000 — do `npm run build` first).

## 2. Deploy to Vercel (needs internet; do it once)

1. **Database** — create a free account at neon.tech → New project → copy the *connection string* (starts with `postgres://`).
2. **GitHub** — push this folder to a new repository (`.gitignore` already skips `node_modules`, `.data`, `dist`).
3. **Vercel** — vercel.com → Add New → Project → import the repo. Framework preset: *Vite* (auto-detected). Before pressing Deploy, add two Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = any long random text (e.g. 40 random characters)
4. Deploy. Then open `https://YOUR-APP.vercel.app/api/health` — you should see `{"ok":true,"database":"postgres"}`. Open the site root and sign in with the demo logins.

Tables and demo data are created automatically on the first request, so the very first page load can take 5 to 15 seconds.

> Variable names must be exactly `DATABASE_URL` and `JWT_SECRET`. Variables only apply to **new** deployments, so after adding or changing one, go to Deployments → ⋯ → **Redeploy**.

## 3. How the pieces connect

```
Browser ── /api/* ──► Express app (server/app.js) ──► Postgres
   ▲                     │  routes: auth, products, orders, insights
   │                     │  middleware: helmet, cookie-parser, requireAuth, requireRole, zod, error handler
   └── React (src/) ◄────┘  services/api.js is the ONLY file that calls fetch
```

- **Dev:** Vite (5173) proxies `/api` to Express (4000), so the browser sees one origin and the login cookie just works.
- **Vercel:** static files are served by Vercel; `vercel.json` rewrites `/api/*` to `api/index.js`, which exports the same Express app as a serverless function. Everything else falls back to `index.html` so React Router handles page URLs.

## 4. Concepts → where to find them

| Concept | File(s) |
|---|---|
| React Router: nested routes, lazy pages, URL params | `src/App.jsx`, `src/pages/ProductDetail.jsx` |
| Protected + role-based routes | `src/components/layout/RouteGuards.jsx` |
| Context API (auth, theme) | `src/context/AuthContext.jsx`, `ThemeContext.jsx` |
| State management (Zustand) | `src/store/*.js` (toasts, UI, restock queue) |
| Server data fetching + caching | `src/hooks/queries.js`, `mutations.js`, `src/services/api.js` |
| Filters kept in the URL (shareable links) | `src/hooks/useProductFilters.js` |
| Forms + validation | `src/components/products/ProductForm.jsx`, `src/validation/productSchema.js` |
| Auth: bcrypt hashes, JWT in httpOnly cookie | `server/routes/auth.js`, `server/http.js` |
| Server-side search, filter, sort, pagination | `server/routes/products.js` |
| SQL transactions (an order or restock updates many rows, or none) | `server/routes/orders.js` (`POST /orders`, `POST /restock`) |
| Input validation on the server | `server/validation.js` |
| Database schema + seed | `server/schema.js`, `server/seed.js` |

## 5. API

`POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
`GET /api/products` (q, category, stock, sort, page, pageSize) · `GET /api/products/:id` · `POST|PATCH|DELETE /api/products` *(admin)*
`GET /api/categories` · `GET /api/orders` · `PATCH /api/orders/:id` *(admin)* · `POST /api/orders` *(admin)* · `POST /api/restock` *(admin)* · `POST /api/admin/clear-data`, `/api/admin/load-demo` *(admin)*
`GET /api/analytics/summary` · `GET /api/activity` · `GET|POST /api/users`, `PATCH /api/users/:id` *(admin)* · `GET /api/health`

## 6. Troubleshooting

- **The site loads but sign-in or `/api/auth/me` returns 500** — the API cannot start. Check both variable names for typos, confirm the Neon string starts with `postgresql://` and ends with `?sslmode=require`, then Redeploy. The exact error is under Vercel → Logs.
- **`/api/health` on Vercel says 500** — `DATABASE_URL` or `JWT_SECRET` is missing in Project → Settings → Environment Variables. Add it, then Redeploy.
- **Port already in use** — stop the old `npm run dev` (Ctrl+C) or set `PORT=4001`.
- **Login works on localhost but not over plain http elsewhere** — set `COOKIE_SECURE=0` (production mode only sends the cookie over https).
- **Blank page after refresh on Vercel** — make sure `vercel.json` is in the repo root.