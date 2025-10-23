# opensurf.ai

## Summary

This is the source for opensurf.ai

OpenSurf is the open, privacy-first runtime that lets AI agents safely use the web on behalf of humans. It bridges the gap between local intelligence and the online world — giving developers a transparent, auditable layer for automation, browsing, and action. Built for trust and interoperability, OpenSurf turns the web into a programmable, agent-ready surface while keeping users in full control of their data, context, and consent.

The website also has a completely unecessary water simulation on it, because @dpeek is a god-tier procrastinator!

## Running

Run `bun dev` (you might have to setup alchemy? not sure)

Add `?debug` for simulation gui and expose parameters in `params.ts`

Contributions (including sharks) welcome!

## What's inside

- **Framework**: React 19 with **@tanstack/react-start** (SSR/SSG) and **@tanstack/react-router** (file-based routing)
- **Build**: **Vite 7** with **@tailwindcss/vite**, **vite-tsconfig-paths**, **@cloudflare/vite-plugin**
- **Styling**: **Tailwind CSS v4**
- **3D / Effects**: **three** (custom water sim, skybox, particles)
- **Server runtime**: Cloudflare Workers via **alchemy** integration
- **Forms/Email**: **Resend** (waitlist), **Cloudflare Turnstile** (bot protection)

## Project layout

```
src/
  routes/               # File-based routes for TanStack Router
    __root.tsx          # Document shell, head meta, scripts (Turnstile preload)
    index.tsx           # Home route → renders `page/home.tsx`
  router.tsx            # `createRouter` configured with generated routeTree
  page/home.tsx         # Landing page UI and sections; mounts water sim via <ClientOnly>
  server/waitlist.tsx   # Server function (createServerFn) for waitlist + Turnstile verify + Resend
  utils/utils.ts        # `cn` helper (clsx + tailwind-merge)
  water/                # Three.js water simulation (see below)
    init.ts             # Main scene/camera/renderer loop and debug hooks
    layers/             # Materials/meshes: water, fog, skybox, ground, particles
    params.ts           # Tweakable parameters (exposed via `?debug` UI)
public/                 # Static assets (icons, sim textures, domain badges)
dist/                   # Build output (client + server bundles)
vite.config.ts          # Vite + TanStack Start + Tailwind + paths
alchemy.run.ts          # Alchemy app + Cloudflare bindings + dev server config
```

## Scripts

```bash
# Dev (spawns Vite via Alchemy)
bun dev

# Build and preview
bun run build
bun run serve

# Deploy / Destroy (via Alchemy → Cloudflare Workers)
bun run deploy
bun run destroy
```

Local dev runs on `http://localhost:5005` (configured in `alchemy.run.ts`).

## Environment variables

Client (Vite):

```bash
# .env.local
VITE_TURNSTILE_SITE_KEY=pk_xxxxxxxxxxxxxxxxx
```

Server (Cloudflare Worker bindings via Alchemy):

- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`

These are wired in `alchemy.run.ts` and consumed in `src/server/waitlist.tsx`.

## Routing and SSR

- File routes live in `src/routes`. The root document (`__root.tsx`) sets meta, links, Turnstile script preload, and a shell.
- `src/router.tsx` creates the router with generated `routeTree`.
- `@tanstack/react-start` handles server functions and server rendering. The waitlist form posts to `createServerFn` (`src/server/waitlist.tsx`), which:
  - Validates email + Turnstile token
  - Verifies token against Turnstile API
  - Adds the email to a Resend audience

## Water simulation (the fun bit)

- Implemented with Three.js under `src/water/`:
  - `init.ts` bootstraps the scene, camera, render targets (planar + mirror), and the animation loop
  - `layers/` contains `water`, `waterfog`, `skybox`, `ground`, `particles`, etc.
  - `params.ts` exposes tunable controls
- It only runs on the client via `<ClientOnly>` in `page/home.tsx`.
- Append `?debug` to the URL to enable stats and the parameter UI.

## Tech highlights

- **Tailwind v4** with the official Vite plugin
- **Cloudflare Workers** deployment via **Alchemy** (`alchemy/cloudflare/tanstack-start`)
- **Turnstile** script is preloaded in `__root.tsx` for fast widget render
- **Resend** used server-side only (dynamic import inside server function)

## Developing locally

1. Install deps: `bun install`
2. Create `.env.local` with `VITE_TURNSTILE_SITE_KEY`
3. Start dev server: `bun dev`
4. Visit `http://localhost:5005` (add `?debug` to tweak the sim)

## Deployment

Deploys are driven by `alchemy.run.ts`:

- Provisions a TanStack Start app on Cloudflare Workers
- Binds required secrets (`TURNSTILE_SECRET_KEY`, `RESEND_*`)
- Adopts the `opensurf.ai` domain (see `domains` array)

Run `bun run deploy` and ensure required secrets are present in your environment.

---

Questions, ideas, or fixes? PRs and sharks welcome 🦈
