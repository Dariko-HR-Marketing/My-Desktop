# 02 · Arxitektura

## 1. Umumiy koʻrinish

```
┌──────────────────────────── Xodim kompyuteri ────────────────────────────┐
│  Ish maydoni (Tauri agent)                                                 │
│  ┌─────────────── React UI (asosiy webview) ───────────────┐              │
│  │ AppShell · Bosh sahifa · Vazifalar · Bildirishnomalar · │              │
│  │ Qidiruv · Sozlamalar · Modullar (plaginlar)             │              │
│  └──────────────▲──────────────────────────────────────────┘              │
│                 │ invoke / events (faqat asosiy webview)                   │
│  ┌──────────────┴─────────── Rust qatlami ─────────────────┐              │
│  │ browser.rs (child webview: har tab — alohida webview)   │──► Saytlar   │
│  │ autostart · single-instance · tray · updater · notify   │   (YouTube,  │
│  │ secure storage (token) · oflayn kesh (SQLite)           │   Telegram…) │
│  └─────────────────────────────────────────────────────────┘              │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ HTTPS (REST) + WSS (real vaqt)
┌───────────────▼──────────────── VPS (Docker Compose) ─────────────────────┐
│ Caddy (HTTPS, Let's Encrypt) → API (Fastify) → PostgreSQL                  │
│                                   ├─ Modul adapterlari (EDO, HR …)         │
│                                   └─ Vidjet servislari (CBU kurs, ob-havo) │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2. Texnologiyalar va sabablari

| Qatlam | Tanlov | Nega |
|---|---|---|
| Desktop qobiq | Tauri 2 (Rust) | Oʻrnatma ~10–15 MB (Electron ~150 MB), kam xotira, tizim WebView2 dan foydalanadi |
| UI | React 19 + TypeScript + Vite | Keng tarqalgan, tez, kuchli tiplash |
| Holat | Zustand | Kichik, sodda, React'dan tashqarida ham ishlaydi |
| Ichki brauzer | Tauri child webview (`unstable` feature) | Haqiqiy brauzer dvigateli — iframe'ni taqiqlagan saytlar (Telegram, Instagram) ham ochiladi |
| Server | Fastify 5 + Prisma + PostgreSQL 16 | Tez, sxemaga asoslangan, migratsiyalar |
| Real vaqt | WebSocket (`@fastify/websocket`) | Bildirishnoma ≤ 2 s |
| Validatsiya | zod | Server va klient uchun bir xil sxemalar (`packages/shared`) |
| Deploy | Docker Compose + Caddy + GitHub Actions | 2 GB RAM VPS ga mos, avtomatik HTTPS |

## 3. Monorepo tuzilmasi

```
my-desktop/
├─ CLAUDE.md
├─ package.json                # npm workspaces
├─ apps/
│  ├─ desktop/
│  │  ├─ index.html, vite.config.ts, tsconfig.json
│  │  ├─ src/
│  │  │  ├─ main.tsx
│  │  │  ├─ app/               # App.tsx (marshrutlar), AppShell.tsx, Sidebar, Topbar, BottomNav
│  │  │  ├─ components/        # Button, IconButton, Badge, Chip, Card, Kpi, Skeleton, EmptyState, Switch, Tabs, Drawer, Tooltip
│  │  │  ├─ features/
│  │  │  │  ├─ auth/           # LoginPage
│  │  │  │  ├─ home/           # HomePage + vidjetlar
│  │  │  │  ├─ tasks/          # TasksPage, QuickAdd, TaskRow
│  │  │  │  ├─ browser/        # BrowserPage, NewTabPage, TabStrip, AddressBar, BrowserViewport
│  │  │  │  ├─ notifications/  # NotificationsDrawer
│  │  │  │  ├─ search/         # CommandPalette
│  │  │  │  ├─ settings/       # SettingsPage
│  │  │  │  └─ modules/
│  │  │  │     ├─ registry.ts  # modul manifestlari
│  │  │  │     └─ edo/         # Hujjat aylanishi: Overview, Documents, Control, Assignments, Reports
│  │  │  ├─ lib/               # api.ts, realtime.ts, platform.ts, quickAdd.ts, format.ts, i18n.ts
│  │  │  ├─ state/             # session.ts, data.ts, browser.ts, ui.ts
│  │  │  └─ styles/            # tokens.css, base.css, layout.css
│  │  └─ src-tauri/
│  │     ├─ Cargo.toml, tauri.conf.json, capabilities/default.json, icons/
│  │     └─ src/ (main.rs, lib.rs, browser.rs, system.rs)
│  └─ server/
│     ├─ prisma/schema.prisma, seed.ts
│     ├─ src/
│     │  ├─ index.ts, app.ts, config.ts
│     │  ├─ domain/types.ts
│     │  ├─ store/             # store.ts (interfeys), prisma.ts, memory.ts (demo/test), catalog.ts
│     │  ├─ services/          # realtime.ts (hub), cache.ts (TTL), widgets.ts (CBU, open-meteo)
│     │  ├─ modules/registry.ts# ModuleAdapter + edo demo adapter
│     │  ├─ plugins/auth.ts
│     │  └─ routes/            # auth, tasks, notifications, settings, catalog (+widgets, dashboard), realtime
│     ├─ scripts/create-user.ts
│     ├─ test/
│     └─ Dockerfile, docker-entrypoint.sh
├─ packages/shared/            # API turlari va zod sxemalari
├─ deploy/                     # docker-compose.yml, Caddyfile, .env.example, setup-server.sh
└─ .github/workflows/          # ci.yml, deploy-server.yml, release-desktop.yml
```

## 4. Muhim qarorlar

### 4.1. Saqlash qatlami interfeysi (server)
`Store` interfeysi: `users`, `tasks`, `notifications`, `settings`, `catalog`. Ikki amalga oshirish:
- `prisma.ts` — ishlab chiqarish (PostgreSQL);
- `memory.ts` — testlar va maʼlumotlar bazasisiz demo (`DATA_STORE=memory`).

### 4.2. Modul adapteri (server)
```ts
interface ModuleAdapter {
  key: string;                         // 'edo'
  signals(ctx: { userId: string; role: Role }): Promise<ModuleSignal[]>;
}
```
Tashqi tizim API'si berilganda faqat adapter fayli almashtiriladi. Bitta modul xato bersa — `Promise.allSettled`, qolganlari koʻrinadi.

### 4.3. Modul manifesti (desktop)
```ts
interface DesktopModule {
  key: string; name: string; icon: LucideIcon; roles: Role[];
  tabs: { key: string; label: string; element: ReactNode; badge?: () => number }[];
}
```

### 4.4. Ichki brauzer (Rust)
Buyruqlar (`invoke`):

| Buyruq | Parametrlar | Vazifasi |
|---|---|---|
| `browser_show` | `id, url, bounds{x,y,width,height}` | Tab webview'ini yaratadi yoki koʻrsatadi va joylashtiradi |
| `browser_hide` | `id` | Tabni yashiradi (uxlatish uchun ham) |
| `browser_hide_all` | — | Brauzer sahifasidan chiqilganda |
| `browser_navigate` | `id, url` | Manzilga oʻtish |
| `browser_history` | `id, action: back/forward/reload` | Tarix |
| `browser_close` | `id` | Tabni yopish (webview oʻchiriladi) |
| `autostart_get` / `autostart_set` | `enabled` | Kompyuter yoqilganda ishga tushish |

Hodisalar: `browser://page` → `{ id, url, loading }`; `browser://title` → `{ id, title, unread }`.

Qoidalar:
- Faqat `http`/`https` (va `about:blank`); boshqa sxemalar rad etiladi (`on_navigation`).
- Tab webview'lariga Tauri IPC ruxsati **berilmaydi** (capabilities faqat `main` webview uchun).
- Joylashuv: React tomonida `BrowserViewport` elementining `getBoundingClientRect()` → `ResizeObserver` bilan doimiy yangilanadi.
- Windows'da webview yaratish `async` buyruqda (deadlock oldini olish).
- Bitta tab ichidagi sayt yangi oyna ochmoqchi boʻlsa (`target=_blank`) — yangi tab sifatida ochiladi.

### 4.5. Oflayn va kesh
- Desktop: oxirgi API javoblari lokal saqlanadi; ilova ochilganda avval keshdan koʻrsatiladi, keyin yangilanadi.
- Oflayn qilingan amallar (vazifa belgilash, qoʻshish) navbatga yoziladi va internet qaytganda yuboriladi.
- Server: tashqi vidjetlar (CBU, ob-havo) TTL kesh — 30 / 15 daqiqa; tashqi manba ishlamasa oxirgi qiymat `stale: true` bilan.

### 4.6. Real vaqt
`/ws?token=<JWT>`; hodisalar: `notification.created`, `notifications.read`, `task.changed`, `task.deleted`, `settings.changed`. Klient qayta ulanishi: 1 s → 2 s → … → 30 s; `online` hodisasida darhol.
