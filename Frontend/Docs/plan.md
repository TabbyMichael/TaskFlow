
# TaskFlow Enterprise — Implementation Plan

This is a large portfolio-scale build. Before I start writing ~80+ files, I want to align on a few things so the result matches your intent.

## Important: routing stack

Your spec lists **React Router**, but this template is built on **TanStack Start** (file-based routing in `src/routes/`, SSR-ready). Two options:

- **A. Keep TanStack Start** (recommended): I adapt the architecture — routes live in `src/routes/`, feature folders still own UI/hooks/api/types/schemas/store. You get SSR, type-safe routing, and the same DX. Auth guard via `_authenticated` layout.
- **B. Rip out TanStack Start and install React Router DOM**: matches your spec literally, but loses SSR + the template's built-in router conventions, and adds risk.

I'll proceed with **A** unless you say otherwise.

## Architecture

Feature-sliced as you described, adapted to TanStack:

```text
src/
├── routes/                      # TanStack file-based routes (thin — delegate to features)
│   ├── __root.tsx
│   ├── index.tsx                # redirects to /dashboard or /login
│   ├── login.tsx, register.tsx, forgot-password.tsx, reset-password.tsx
│   └── _authenticated/
│       ├── route.tsx            # guard + DashboardLayout
│       ├── dashboard.tsx
│       ├── projects.tsx, projects.$id.tsx
│       ├── tasks.tsx
│       ├── kanban.tsx
│       ├── sprints.tsx
│       ├── team.tsx
│       ├── reports.tsx
│       ├── notifications.tsx
│       ├── settings.tsx
│       └── admin.tsx
│
├── app/
│   ├── providers/               # query-provider, theme-provider, auth-provider
│   ├── layouts/                 # dashboard-layout, auth-layout
│   └── store/                   # ui-store (sidebar, theme), app-store
│
├── shared/
│   ├── api/                     # mock client, query-client, delay/error simulation
│   ├── components/ui/           # shadcn (already present) + wrappers
│   ├── components/{data-table,charts,feedback,forms}/
│   ├── hooks/                   # use-debounce, use-media-query, use-local-storage
│   ├── utils/                   # dates, formatting, permissions
│   ├── constants/               # routes, roles, statuses
│   └── types/                   # api, pagination, common
│
├── entities/                    # user, task, project, sprint — types + base api
│
├── features/
│   ├── auth/                    # api, components (login/register forms), schemas, hooks
│   ├── projects/                # list/grid views, project card, details tabs
│   ├── tasks/                   # table, filters, drawer, schemas
│   ├── kanban/                  # board, columns, cards, dnd-kit drag/drop
│   ├── sprints/                 # list, burndown/velocity charts
│   ├── team/                    # members table, invite modal
│   ├── notifications/           # list, store (unread count)
│   ├── reports/                 # productivity dashboard, export buttons (UI only)
│   ├── settings/                # profile, security, preferences sections
│   ├── admin/                   # user management, org settings
│   └── dashboard/               # KPI cards, charts, activity feed, deadlines
│
└── widgets/                     # cross-feature compositions (recent-activity, workload-chart)
```

## Tech choices

- **Styling**: Tailwind v4 + shadcn (already installed). Extend `src/styles.css` with enterprise tokens (refined neutrals, brand indigo accent, sidebar tokens already present).
- **State**: TanStack Query (already installed) for "server" state against the mock API; Zustand for UI state (sidebar collapsed, theme, filters).
- **Forms**: react-hook-form + zod (need to install).
- **Charts**: recharts (need to install).
- **Drag & drop**: @dnd-kit/core + sortable (need to install).
- **Icons**: lucide-react (already installed).
- **Theme**: next-themes pattern via a tiny custom provider — toggles `.dark` class. Light + Dark only (no system flicker concerns since no auth flash).
- **Mock API**: in-memory data in `shared/api/mock/` with simulated latency. Auth is fake (localStorage token), routes guarded via `_authenticated` `beforeLoad`.

## Design direction

Enterprise SaaS, dense-but-clean, Linear/Height-inspired:
- Neutral slate base, single saturated accent (indigo `oklch(0.55 0.22 265)`)
- Compact spacing scale, sharp 8px radius, subtle borders over heavy shadows
- Inter for UI, JetBrains Mono for IDs/numbers
- Skeleton loaders everywhere, framer-motion for drawer/modal transitions

## Scope realism

This is genuinely 60–90 files. I'll build it in one pass but prioritize:
1. **Tier 1 (fully functional)**: Layout, sidebar, theme switcher, dashboard, projects list+detail, tasks table+drawer, kanban with DnD, auth pages
2. **Tier 2 (functional but lighter)**: sprints, team, notifications, reports, settings, admin
3. All pages will render with real mock data and proper empty/loading states — no `// TODO` stubs.

## What I need from you

1. **Confirm TanStack Start (option A) is OK** — or insist on React Router DOM.
2. Any brand color preference, or should I go with the indigo-on-slate enterprise palette?

Reply "go" with any tweaks and I'll build it.
