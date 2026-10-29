# Holat: qabul mezonlari (docs/09) boʻyicha

Belgilar: ✅ avtomatik yoki skript bilan tekshirilgan · 🟡 kodda bor, lekin shu muhitda toʻliq tekshirib boʻlmadi (Windows/macOS yoki haqiqiy server kerak) · ⬜ MVP dan tashqari.

Tekshiruv usullari: Vitest (desktop 144, server 57), Rust `cargo test` (4), Playwright (haqiqiy server + Vite), axe-core (WCAG 2.1 AA), haqiqiy Tauri ilovasi Xvfb ostida (child webview va IPC izolyatsiyasi).

## Umumiy
- ✅ `npm run typecheck`, `npm test`, `npm run build`, `cargo check`, `cargo test` xatosiz
- ✅ GitHub Actions CI (node, rust, e2e) `main` da yashil
- ✅ Repozitoriyda parol, kalit, `.env` yoʻq (skan qilingan)

## Server
- ✅ `DATA_STORE=memory` bilan `xodim / demo12345` bilan kirish
- ✅ Notoʻgʻri parol → 401 «Login yoki parol notoʻgʻri»; 11-urinish → 429
- ✅ Tokensiz → 401; vazifa CRUD (201/200/204, boʻsh sarlavha → 400, `completedAt`)
- ✅ Xodim bildirishnoma yubora olmaydi (403); rahbar yuborsa WebSocket orqali ≤ 2 s da keladi
- ✅ `/api/catalog/modules` xodimga «Rahbar paneli» qaytarmaydi; modul maʼlumoti 403/404 qoidalari
- ✅ Valyuta/ob-havo: kesh, `stale: true`, 503 (soxta `fetch` bilan); 🟡 haqiqiy CBU/open-meteo bilan serverda tekshirish kerak
- ✅ Docker + HTTPS: https://my-desk.tajriba24.uz, `/health` → `ok` (postgres); migratsiyalar 0001–0004 qoʻllangan; `npm run smoke` 16/16 oʻtdi (serverda)
- 🟡 Avto-deploy: GitHub Secrets (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOMAIN`) kiritilmagan — hozircha `deploy/update-server.sh` bilan qoʻlda

## Desktop — qobiq va adaptivlik
- ✅ Menyu: 3 guruh, modul bitta qator, tarmoqlar yigʻiladi, 248 ↔ 72 px
- ✅ 1440 / 1100 / 800 / 390 da gorizontal scroll yoʻq (Playwright, barcha sahifalar)
- ✅ Tungi, yorugʻ, tizim temasi; Ixcham zichlik
- ✅ axe-core: 10 sahifa × 2 tema × 2 kenglik — 0 buzilish; hamma narsa klaviatura bilan
- ✅ Har blokda skelet / boʻsh / xato-oflayn / maʼlumot holatlari

## Bosh sahifa
- ✅ Salomlashuv, xulosa jumlasi, 5 koʻrsatkich, vazifani belgilash (optimistik, xatoda qaytadi)
- ✅ Oflayn tasma, keshdan koʻrsatish, qaytganda yangilanish
- ✅ «Bugungi jadval» — foydalanuvchining iCal (.ics) kalendaridan (Google/Outlook); ulanmagan boʻlsa aniq holat; SSRF himoyasi va 16 test
- 🟢 «Xabarlar» (ochiq brauzer tablaridagi oʻqilmagan), «Oylik reja %» (oylik rejadan bajarilgan vazifalar), «Ishni boshlagan vaqt» (ilova bugungi birinchi ochilishi) — haqiqiy maʼlumot; «Namuna» belgisi faqat demo rejimdagi kalendarda

## Vazifalar
- ✅ «ertaga 10:00 hisobot !yuqori @Karimov #ishreja» → toʻgʻri; quickAdd 32 test
- ✅ Kechikkan boʻlimi; oflayn navbat internet qaytganda serverga tushadi

## Ichki brauzer
- ✅ Rust: http/https dan boshqa sxema rad etiladi; tab webview'ida IPC yoʻq («not allowed»); sarlavhadan oʻqilmaganlar soni; yangi tab/guruh/uxlash/tiklash; Ctrl+T/W/L; manzilga soʻz → Google
- 🟡 Telegram, WhatsApp (QR), Instagram, YouTube, Lex.uz haqiqiy ochilishi va sessiyaning saqlanishi — Windows'da qoʻlda
- 🟡 `target=_blank` → yangi tab (foydalanuvchi bosishi kerak), webview joylashuvi (Linux'da Tauri qoʻllamaydi; Windows/macOS da kutiladi)

## Bildirishnomalar, qidiruv, sozlamalar
- ✅ Drawer: yorliqlar, guruhlar, amal tugmasi, «Hammasini oʻqildi», Esc, jonli keladi
- ✅ Ctrl+K: turkumlar, ↑↓/Enter/Tab/Esc, «vazifa yaratish», hujjatlar, Google → brauzer tabi
- ✅ Sozlamalar serverga saqlanadi (oflayn boʻlsa keyin yuboriladi), `settings.changed` boshqa oynada
- 🟡 Autostart/yagona nusxa/tizim bildirishnomasi — Rust tomoni kompilyatsiya va ishga tushish tekshirilgan, haqiqiy qayta yoqishni Windows'da tekshirish kerak

## Hujjat aylanishi moduli
- ✅ Menyuda bitta qator, 5 yorliq, bosh sahifa signali → yorliq, «Ruxsat yoʻq» holati
- ⬜ Amallar (imzolash, kelishish) — tashqi tizim va E-IMZO ulangach

## Integratsiyalar va xavfsizlik
- ✅ Katalog (13 xizmat), shifrlangan saqlash, rol boʻyicha boshqaruv, tekshirish, AI shlyuzi (3 lahja), webhook imzosi; server 23 test, e2e 2 test
- ✅ Kalit hech qayerda ochiq qaytmaydi (API, xato matni, jurnal) — testlar bilan tekshirilgan
- ✅ Zaifliklar: `fast-jwt` (critical) va `zod` (high) yangilandi; qolgani — `node-ical`→`uuid` (v3/v5/v6 ishlatilmaydi) va `prisma` CLI (faqat build/migratsiya)
- 🟡 Serverda `INTEGRATIONS_KEY` va migratsiya 0005 — `deploy/update-server.sh` bilan qoʻllanadi; haqiqiy provayderlarga (OpenAI, Anthropic…) ulanish kalit bilan qoʻlda sinaladi
- ⬜ OAuth2 oqimi, kalit rotatsiyasi, audit sahifasi (docs/11)

## Adaptivlik
- ✅ 11 oʻlcham (320×640 … 2560×1300, jumladan telefon gorizontal 667×375): gorizontal scroll yoʻq, barcha sahifalar
- ✅ Telefon/sensorli ekranda tugmalar ≥ 44 px
- ✅ axe-core 11 sahifa × 2 tema: 0 buzilish

## Tezlik (Linux, WebKitGTK, dasturiy render — Windows'da farq qiladi; docs/PERFORMANCE.md)
- ✅ Oyna ochilishi (kirish sahifasi) ≈ 1,0–1,2 s ≤ 1,5 s
- ✅ Boʻsh holatda xotira ≈ 217 MB ≤ 250 MB
- ✅/🟡 Ilova fayli 7,2 MB (gzip 3,3 MB); Windows oʻrnatma ≤ 20 MB — `release-desktop.yml` qurgach tasdiqlanadi
