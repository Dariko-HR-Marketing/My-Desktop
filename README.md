# Ish maydoni

Xodimning yagona desktop ish stoli: vazifalar, bildirishnomalar, ichki brauzer va ulanadigan modullar bitta oynada.

## Tuzilma

- `apps/desktop` — Tauri 2 + React 19 + TypeScript (Vite)
- `apps/server` — Fastify 5 + TypeScript (keyinroq Prisma/PostgreSQL)
- `packages/shared` — desktop va server uchun umumiy turlar
- `docs/` — texnik topshiriq, arxitektura, dizayn tizimi, maketlar
- `CLAUDE.md` — loyiha qoidalari

## Ishga tushirish

Talab: Node.js 22 (`.nvmrc`), Rust (faqat Tauri uchun).

```bash
npm install
npx -w @ish-maydoni/server prisma generate   # bir marta: Prisma klienti
npm run dev:server     # API: http://localhost:8080
npm run dev:desktop    # UI brauzerda: http://localhost:1420
npm run tauri:dev      # desktop ilova
```

## Tekshiruv

```bash
npm run typecheck && npm test && npm run build
cd apps/desktop/src-tauri && cargo check
```

Linux'da `cargo check` uchun: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`.

## Serverga joylashtirish (deploy)

Domen: `my-desk.tajriba24.uz` (A yozuv → `95.130.227.92`). Batafsil: `docs/07-SERVER-VA-DEPLOY.md`.

**Hozirgi holat.** Server qoʻlda joylashtirilgan va ishlayapti: `https://my-desk.tajriba24.uz/health` → `{"status":"ok","store":"postgres",…}`. Serverda boshqa saytlar ham bor, shuning uchun 80/443 portni umumiy Caddy ushlab turadi va u `my-desk` domenini `api` konteyneriga yoʻnaltiradi (`deploy/Caddyfile` — namuna).

**Yangilash (oddiy yoʻl).** Serverda repozitoriy papkasida:

```bash
git pull
cd deploy && docker compose --env-file .env up -d --build api
```

`api` konteyneri ishga tushganda `prisma migrate deploy` ni oʻzi bajaradi, shuning uchun yangi migratsiyalar (`0002_task_assignee_list`, `0003_settings_extra`) avtomatik qoʻllanadi. Natijani tekshirish: `curl -fsS https://my-desk.tajriba24.uz/health`.

**Deploydan keyingi tekshiruv.** Barcha asosiy endpointlarni (kirish, vazifa CRUD, sozlamalar, modul maʼlumoti, WebSocket) tekshiradi va hech qanday izoh qoldirmaydi:

```bash
SMOKE_URL=https://my-desk.tajriba24.uz SMOKE_LOGIN=admin SMOKE_STORE=postgres \
SMOKE_PASSWORD='<admin paroli>' npm run smoke -w @ish-maydoni/server
```

Parol faqat muhit oʻzgaruvchisida beriladi. Migratsiya 0002/0003 qoʻllanmagan boʻlsa, tegishli qadam aniq xabar bilan yiqiladi.

**Avtomatik yangilash (ixtiyoriy).** `.github/workflows/deploy-server.yml` `main` ga push boʻlganda serverga rsync + `docker compose up -d --build` qiladi. Uning uchun GitHub → Settings → Secrets → Actions: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (parolsiz ED25519 deploy kaliti), `DOMAIN`. Workflow serverdagi papka tuzilmasiga (`/opt/my-desktop`) bogʻliq: agar server boshqacha tuzilgan boʻlsa, workflowdagi yoʻllarni moslang.

**Xavfsizlik.** Admin paroli va boshqa sirlar chat yoki repozitoriyga yozilmaydi; `deploy/.env` faqat serverda turadi. Birinchi kirishdan keyin admin parolini almashtiring.

## Ichki brauzer: ma'lum cheklovlar

- Har bir tab alohida Tauri child webview (`unstable` xususiyati). Windows (WebView2) va macOS da webview'lar React'dagi `BrowserViewport` joyiga aniq joylashadi.
- **Linux (WebKitGTK):** Tauri child webview'larni joylashtirishni qoʻllamaydi — ular asosiy webview ostida ketma-ket turadi. Brauzer Linux'da ishlaydi (sahifalar yuklanadi, hodisalar keladi), lekin joylashuv toʻgʻri boʻlmaydi. Asosiy platforma — Windows.
- `target=_blank` / `window.open` → yangi tab (`on_new_window`) kodda bor, lekin foydalanuvchi bosishini talab qiladi: avtomatlashtirilgan sinovda tekshirib boʻlmadi, Windows'da qoʻlda tekshirish kerak (Telegram, WhatsApp, YouTube).
- Sessiya (cookie) tizim webview ma'lumotlar papkasida saqlanadi, shuning uchun Telegram/WhatsApp'ga bir marta kirish yetarli.

## Desktop ilovani chiqarish (reliz)

`v0.2.0` kabi teg qoʻyilsa, `.github/workflows/release-desktop.yml` Windows (`.msi`, `.exe`), macOS (`.dmg`) va Linux (`.deb`, `.AppImage`) oʻrnatmalarini quradi va GitHub Release ga qoʻyadi. Oʻrnatilgan ilovalar `latest.json` orqali yangilanishni oʻzlari topadi (Sozlamalar → Tizim).

Bir martalik tayyorgarlik:

```bash
npx tauri signer generate -w updater.key
```

Keyin GitHub Secrets ga: `TAURI_SIGNING_PRIVATE_KEY` (`updater.key` mazmuni), `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `TAURI_UPDATER_PUBKEY` (`updater.key.pub` mazmuni). Kalitni repozitoriyga qoʻymang. Windows kod imzosi (SmartScreen ogohlantirishini yoʻqotish uchun) sertifikat olingach alohida qoʻshiladi.

## Kalendar (bosh sahifadagi «Bugungi jadval»)

Sozlamalar → Kalendar: Google Calendar yoki Outlook'dagi **maxfiy iCal (.ics) manzili** kiritiladi. Server uni oʻqiydi (5 daqiqa kesh), takrorlanuvchi uchrashuvlarni ochadi (`RRULE`, `EXDATE`, koʻchirilgan nusxalar) va Meet/Zoom/Teams havolasi boʻlsa «Qoʻshilish» tugmasini koʻrsatadi. Ochiq kutubxonalar: [`node-ical`](https://github.com/jens-maus/node-ical) (+ `rrule`), [`undici`](https://github.com/nodejs/undici).

Xavfsizlik: manzilni foydalanuvchi kiritgani uchun server uni faqat `https://`, ommaviy domen nomi, loginsiz va ichki tarmoqqa olib bormaydigan holda yuklaydi (har bir DNS javobi va qayta yoʻnaltirish tekshiriladi, hajm 2 MB, vaqt 8 s). Manzilning oʻzi maxfiy: u jurnalga yozilmaydi va faqat egasining sozlamalarida saqlanadi.
