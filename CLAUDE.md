# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Byeori (별이) is a landing/waitlist site for an AI Supervision OS — a native macOS app that provides an IDE-native Context Layer for developers. The site is Korean-audience focused (`lang="ko"`), dark-mode only with a warm charcoal + coral-orange theme inspired by 능소화 (Neungsohwa/trumpet vine).

## Commands

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint (next lint)
pnpm test         # Vitest run (single pass)
pnpm test:watch   # Vitest watch mode
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 18
- **Package manager**: pnpm
- **Styling**: Tailwind CSS 3 + shadcn/ui (default style, CSS variables, slate base)
- **Animations**: Framer Motion
- **Backend**: Cloudflare Pages Functions (waitlist signup → Resend API)
- **Email**: Resend (waitlist signup confirmation + Audience management)
- **State**: TanStack React Query
- **Testing**: Vitest + jsdom + React Testing Library
- **Deployment**: Cloudflare Pages (static export + Pages Functions)

## Architecture

**Path alias**: `@/*` maps to `./src/*`

- `src/app/` — Next.js App Router: layout, pages, not-found
- `src/components/` — Landing page sections (Navbar, HeroSection, ProblemSection, FeaturesSection, RiskDemo, Footer, WaitlistForm)
- `src/components/ui/` — shadcn/ui primitives (do not manually edit; use `npx shadcn-ui@latest add <component>`)
- `src/components/icons/` — Custom SVG icon components (e.g. ByeoriLogo)
- `src/components/Providers.tsx` — Client-side provider tree: QueryClientProvider, TooltipProvider, Toasters
- `src/hooks/` — Custom React hooks
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `functions/api/` — Cloudflare Pages Functions (e.g. `waitlist-signup.ts`)
- `wrangler.json` — Cloudflare Pages configuration

## Key Conventions

- **Dark-mode only**: The theme is hardcoded `className="dark"` on `<html>`. All color tokens are defined as HSL CSS variables in `src/index.css`.
- **Custom design tokens**: `surface`, `surface-raised`, `risk-low/medium/high` colors, plus utility classes `glow-primary`, `glow-line`, `gradient-text`, `net-bg` defined in `src/index.css`.
- **Fonts**: Inter (sans) and JetBrains Mono (mono) loaded via `next/font/google` in layout.tsx.
- **shadcn/ui config**: `components.json` — RSC disabled (`rsc: false`), aliases under `@/components/ui`.
- **Client components**: Landing page sections use `"use client"` for Framer Motion animations and interactivity.
- **Environment variables** (set in Cloudflare dashboard, locally in `.dev.vars`):
  - `RESEND_API_KEY` — Resend API key
  - `RESEND_AUDIENCE_ID` — Resend Audience ID for waitlist contacts
  - `RESEND_FROM_EMAIL` — Verified sender address used in Resend email API (`"Name <email@your-domain>"`)
- **Never use `any` type** — create proper type interfaces instead.
