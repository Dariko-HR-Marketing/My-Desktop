# 08 · Bosqichlar va Claude Code uchun promptlar

Har bir promptni Claude Code'ga **alohida** bering. Har bosqich oxirida `docs/09-QABUL-MEZONLARI.md` dagi tegishli bandlarni tekshiring, keyin commit qiling va keyingisiga oʻting.

Umumiy maslahat: birinchi xabarda Claude Code'dan reja soʻrang («Avval reja yoz, men tasdiqlayman»), tasdiqlagach yozsin.

---

## 0-bosqich · Tayyorgarlik

```
CLAUDE.md va docs/ papkasidagi barcha fayllarni oʻqib chiq. Keyin menga qisqacha ayt:
1) loyihani qanday tushunding, 2) qaysi joylarda savol yoki noaniqlik bor,
3) 1-bosqich uchun ish rejasi. Hali kod yozma.
```

## 1-bosqich · Monorepo va CI

```
docs/02-ARXITEKTURA.md (3-boʻlim) asosida monorepo skeletini yarat:
- npm workspaces: apps/desktop, apps/server, packages/shared;
- root package.json skriptlari: dev:server, dev:desktop, tauri:dev, typecheck, test, build, format;
- .gitignore, .editorconfig, .prettierrc, .nvmrc (22), README.md (oʻzbekcha);
- .github/workflows/ci.yml: Node 22 (install, typecheck, test, build) va Rust (webkit paketlari + cargo check).
Har bir workspace hozircha minimal boʻlsin, lekin typecheck/test/build oʻtsin.
```

## 2-bosqich · Server API (demo rejim bilan)

```
docs/05-API.md va docs/06-MALUMOTLAR-MODELI.md asosida apps/server ni yoz:
- Fastify 5 + TypeScript (NodeNext ESM) + zod + @fastify/jwt + @fastify/cors + @fastify/rate-limit + @fastify/websocket;
- config.ts (zod bilan muhit oʻzgaruvchilari, DATA_STORE=memory|postgres);
- Store interfeysi + memory (demo maʼlumotlar bilan) va Prisma amalga oshirishlari;
- barcha endpointlar, xato formati, WebSocket hub, vidjet servisi (CBU va open-meteo, TTL kesh, stale-if-error);
- ModuleAdapter + edo demo adapteri;
- Vitest testlari (app.inject, memory store, fetch mock): auth, tasks CRUD, validatsiya, bildirishnomalar, rollar, dashboard, vidjetlar, sozlamalar, kesh;
- packages/shared ga API turlarini chiqar.
DATA_STORE=memory bilan `npm run dev:server` ishlashi va barcha testlar oʻtishi shart.
```

## 3-bosqich · Desktop: dizayn tizimi va qobiq

```
docs/04-DIZAYN-TIZIMI.md va docs/design-tokens.json asosida apps/desktop da:
- Vite + React 19 + TypeScript strict, IBM Plex shriftlari (@fontsource), lucide-react;
- styles/tokens.css (light, dark, system, compact), base.css, layout.css (4 ta breakpoint);
- komponentlar: Button, IconButton, Badge, Chip, Card, Kpi, Skeleton, EmptyState, Banner, Switch, Tabs, Drawer, Tooltip;
- AppShell: Sidebar (248/72, guruhlar, yigʻiladigan TARMOQLAR, badge, tooltip), Topbar, BottomNav (<600);
- marshrutlar: /, /tasks, /browser, /m/:module/*, /settings, /login;
- zustand: session (token, user, settings), ui (navCollapsed, theme, density).
Maketlar uchun docs/prototypes/UX_Desktop.dc.html va UX_Adaptiv.dc.html dan aniq oʻlcham va ranglarni ol.
Oynani toraytirganda 4 ta oʻlcham docs/03 (5-boʻlim) dagidek ishlashi kerak.
```

## 4-bosqich · Kirish va Bosh sahifa

```
docs/03 (3.1, 3.2) va prototiplar Kirish.dc.html, UX_Desktop.dc.html asosida:
- LoginPage (login/parol; E-IMZO yorligʻi «Tez orada»);
- lib/api.ts (timeout, ApiError, NetworkError, 401 da chiqish), lib/realtime.ts (qayta ulanish);
- HomePage: salomlashuv, xulosa jumlasi, tezkor amallar, 5 koʻrsatkich, «Diqqat talab qiladi», «Bugungi vazifalar» (optimistik belgilash), «Xabarlar», «Bugungi jadval», ob-havo, valyuta («yangilandi» vaqti bilan);
- har bir blok uchun 4 holat (skelet, boʻsh, xato/oflayn, maʼlumot);
- server yoʻq boʻlsa — «Demo rejim» belgisi va lokal demo maʼlumotlar;
- oxirgi javoblar keshlanadi va ilova ochilganda avval keshdan koʻrsatiladi.
```

## 5-bosqich · Vazifalarim va tez yozish

```
docs/01 (F3) va docs/03 (3.3) asosida:
- lib/quickAdd.ts: tabiiy til tahlilchisi (sana, vaqt, hafta kunlari, «5-noyabr», «28.10», !yuqori/!past, @ijrochi, #roʻyxat; tipografik apostroflar) + toʻliq unit testlar;
- TasksPage: QuickAdd (chiplar bilan oldindan koʻrish, Enter/Esc), filtrlar, akkordeon boʻlimlar (Kechikkan, Bugun, Keyingi, Bajarildi), vazifa tafsiloti paneli;
- oflayn amallar navbati (internet qaytganda yuboriladi).
```

## 6-bosqich · Ichki brauzer (eng muhim qism)

```
docs/02 (4.4) va docs/03 (3.4, 3.5) asosida:
Rust (src-tauri):
- tauri 2 + "unstable" feature; browser.rs: browser_show / hide / hide_all / navigate / history / close;
- har tab — asosiy oynaga add_child qilingan alohida Webview; faqat http/https (on_navigation);
- on_page_load → "browser://page" hodisasi; sarlavha oʻzgarishi → "browser://title" (oʻqilmaganlar soni sarlavhadagi «(12)» dan);
- target=_blank → yangi tab hodisasi;
- tab webview'lariga IPC ruxsati yoʻq (capabilities faqat "main");
- plaginlar: single-instance, autostart (autostart_get/set buyruqlari), notification, window-state.
React:
- state/browser.ts: tablar, guruhlar, faol tab, uxlash (10 daqiqa), sessiyani tiklash;
- NewTabPage (Brauzer_Start.dc.html), BrowserPage (UX_Laptop_Brauzer.dc.html): TabStrip (guruh rangli chiziq, uxlagan tab xira), AddressBar (URL yoki Google), asboblar;
- BrowserViewport: ResizeObserver bilan koordinatalarni Rust'ga yuboradi; brauzerdan chiqilganda hide_all;
- vite dev (Tauri'siz) da iframe va «ba'zi saytlar faqat desktop ilovada ochiladi» izohi;
- chap menyudagi tarmoq bosilsa — mavjud tab faollashadi yoki yangisi ochiladi; brauzerda menyu 72 px.
cargo check va tauri dev da Telegram, YouTube, WhatsApp ochilishini tekshir.
```

## 7-bosqich · Bildirishnomalar, qidiruv, sozlamalar

```
docs/03 (3.7, 3.8, 3.9) va UX_Bildirishnoma, UX_Sozlamalar prototiplari asosida:
- NotificationsDrawer (yorliqlar, guruhlash, amal tugmasi, hammasini oʻqildi, jim rejim), WebSocket orqali real vaqt, shoshilinchlari tizim bildirishnomasi;
- CommandPalette (Ctrl+K): turkumlar, klaviatura boshqaruvi, «vazifa yaratish», Google qidiruv → brauzer tabi;
- SettingsPage: tema, zichlik, shrift; menyudagi tarmoqlar (yoqish/oʻchirish, sudrab tartiblash, majburiylari qulfda); autostart; server manzili; oldindan koʻrish;
- sozlamalar serverga saqlanadi va settings.changed hodisasida yangilanadi.
```

## 8-bosqich · Hujjat aylanishi moduli

```
docs/03 (3.6) va EDO_Modul, Hujjatlar, Ijro, Vazifalar prototiplari asosida:
- features/modules/registry.ts (manifest: key, name, icon, roles, tabs);
- features/modules/edo: Umumiy, Hujjatlar (3 ustun), Ijro nazorati, Topshiriqlar (Kanban), Hisobotlar (boʻsh holat);
- maʼlumotlar server demo adapteridan; ruxsat yoʻq holati;
- bosh sahifadagi signallar modulga olib boradi (module://edo/... havolalari).
```

## 9-bosqich · Server deploy

```
docs/07-SERVER-VA-DEPLOY.md asosida:
- apps/server/Dockerfile (multi-stage, tini, healthcheck, non-root), docker-entrypoint.sh;
- deploy/docker-compose.yml (postgres, api, caddy, xotira chegaralari), Caddyfile, .env.example, setup-server.sh;
- Prisma migratsiyalari (prisma migrate dev bilan birinchi migratsiya);
- .github/workflows/deploy-server.yml (rsync + docker compose, secrets: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, DOMAIN; /health tekshiruvi);
- README ga serverni tayyorlash boʻyicha qadamlar.
Hech qanday parol yoki kalitni repozitoriyga yozma.
```

## 10-bosqich · Reliz va optimizatsiya

```
- .github/workflows/release-desktop.yml (tauri-action, Windows/macOS/Linux, updater);
- tezlik byudjetini oʻlcha (docs/01, 6-boʻlim): ishga tushish vaqti, xotira, bundle hajmi; natijalarni docs/PERFORMANCE.md ga yoz;
- tungi rejim va 4 ta oʻlchamda barcha ekranlarni tekshir; WCAG kontrast va klaviatura;
- topilgan muammolarni tuzat.
```
