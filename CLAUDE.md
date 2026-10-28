# CLAUDE.md — «Ish maydoni» loyihasi qoidalari

Bu fayl Claude Code uchun. Har bir vazifadan oldin shu qoidalarga amal qil.

## Loyiha nima

Xodimning yagona desktop ish stoli: kompyuter yoqilganda ochiladi va kunlik ishlar (to-do), kalendar, bildirishnomalar, ichki brauzer (ijtimoiy tarmoqlar, messenjerlar, saytlar) va ulanadigan modullarni (hujjat aylanishi, kadrlar xizmatlari, rahbar paneli) bitta oynada jamlaydi.

Toʻliq talablar: `docs/01-TEXNIK-TOPSHIRIQ.md`. UX/UI: `docs/03-UX-UI-SPEKTSIFIKATSIYA.md`. Maketlar manbasi: `docs/prototypes/`.

## Stek (oʻzgartirma, kelishmasdan)

- Monorepo, npm workspaces: `apps/desktop`, `apps/server`, `packages/shared` (umumiy TypeScript turlari).
- Desktop: **Tauri 2** (Rust) + **React 19** + **TypeScript** (strict) + **Vite**. Holat: **Zustand**. Marshrutlash: **React Router**. Ikonkalar: **lucide-react**. Shrift: IBM Plex Sans/Mono (`@fontsource`, oflayn ishlashi uchun lokal).
- Server: **Node.js 22** + **Fastify 5** + **TypeScript** + **Prisma** + **PostgreSQL 16** + **WebSocket** (`@fastify/websocket`). Validatsiya: **zod**. Autentifikatsiya: JWT.
- Testlar: **Vitest** (server — `app.inject`, desktop — mantiqiy funksiyalar).
- Deploy: Docker Compose + Caddy (avtomatik HTTPS) + GitHub Actions.

## Tuzilma

```
apps/
  desktop/
    src/
      app/          # marshrutlar, AppShell
      components/   # umumiy UI komponentlar (Button, Badge, Card, Skeleton, EmptyState…)
      features/     # home, tasks, browser, notifications, search, settings, modules/*
      lib/          # api, realtime, platform (Tauri koʻprigi), format, quickAdd
      state/        # zustand doʻkonlari
      styles/       # tokens.css (design-tokens.json dan), base.css, layout.css
    src-tauri/      # Rust: browser.rs (child webview), autostart, single-instance
  server/
    src/ (config, domain, store, services, modules, routes, plugins)
    prisma/schema.prisma
packages/shared/    # API turlari — desktop va server bir xil turlardan foydalanadi
deploy/             # docker-compose.yml, Caddyfile, setup-server.sh
docs/
```

## Qoidalar

1. **Dizayn tokenlari** — ranglar, oʻlchamlar faqat `styles/tokens.css` dagi CSS oʻzgaruvchilari orqali. Komponentda qattiq yozilgan hex rang boʻlmasin. Manba: `docs/design-tokens.json`.
2. **Rang maʼnosi qatʼiy:** qizil — kechikkan, toʻq sariq — muddati yaqin, yashil — bajarilgan, koʻk — asosiy harakat/tanlangan. Rang hech qachon yolgʻiz emas — yonida matn.
3. **Interfeys matnlari oʻzbekcha (lotin)**, `i18n` lugʻatidan olinadi (keyin kirill, rus, ingliz qoʻshiladi). Kod, identifikatorlar, commit xabarlari — inglizcha.
4. **Kirish qulayligi:** haqiqiy `<button>`, `<a>`, `<input>` + `<label>`; ikonka-tugmalarda `aria-label`; matn kontrasti ≥ 4.5:1; hamma narsa klaviatura bilan ishlaydi.
5. **Har bir maʼlumot bloki 4 holatga ega:** yuklanish (skelet), boʻsh, xato/oflayn, maʼlumot. Spinner oʻrniga skelet.
6. **Adaptivlik:** `docs/03` dagi 4 ta oʻlcham qoidasi. Telefon kengligida gorizontal scroll boʻlmasin.
7. **Modul — mustaqil:** hujjat aylanishi va boshqa modullar `features/modules/<kalit>/` ichida, asosiy kodga faqat manifest va signal orqali bogʻlanadi.
8. **Xavfsizlik:** ichki brauzer faqat `http/https`; har bir sayt alohida webview; tashqi saytga Tauri IPC ruxsati berilmaydi; maxfiy maʼlumot (token) faqat xavfsiz saqlovda; server sirlari `.env` da, repozitoriyga tushmaydi.
9. **Tezlik byudjeti** (`docs/01`, 6-boʻlim) — buzilsa, sababini yoz va tuzat.
10. Har bir bosqich oxirida: `npm run typecheck`, `npm test`, `npm run build` oʻtishi shart; `cargo check` (src-tauri) oʻtishi shart.
11. Katta oʻzgarishdan oldin reja yoz va tasdiq ol. Talab noaniq boʻlsa — `docs/` ga qara, u yerda yoʻq boʻlsa — soʻra.
12. Rad etilgan konsepsiya: «chegarasiz mini panel / koʻrinmas ish stoli» varianti **ishlatilmaydi**. Asos — `docs/03` dagi yakuniy dizayn.

## Buyruqlar (loyiha tuzilgandan keyin)

```
npm install
npm run dev:server        # API: http://localhost:8080 (DATA_STORE=memory — demo)
npm run dev:desktop       # UI brauzerda: http://localhost:1420
npm run tauri:dev         # desktop ilova
npm run typecheck && npm test && npm run build
```
