# Ish maydoni — Claude Code uchun toʻliq TZ toʻplami

Bu papka «Ish maydoni» desktop dasturini Claude Code yordamida yozish uchun kerakli barcha manbalarni oʻz ichiga oladi.

## Qanday ishlatiladi

1. Papkadagi hamma narsani GitHub repozitoriyingizning ildiziga nusxalang (`Dariko-HR-Marketing/My-Desktop`):
   - `CLAUDE.md` → repozitoriy ildiziga (Claude Code uni har safar avtomatik oʻqiydi).
   - `docs/` → `docs/` papkasiga.
   - `prototypes/` → `docs/prototypes/` papkasiga.
2. Claude Code'ni repozitoriyda oching.
3. `docs/08-BOSQICHLAR-VA-PROMPTLAR.md` faylidagi promptlarni tartib bilan bering — har bir bosqichdan keyin natijani tekshirib, keyingisiga oʻting.

## Tarkib

| Fayl | Nima uchun |
|---|---|
| `CLAUDE.md` | Claude Code uchun doimiy qoidalar: stek, tuzilma, kod uslubi, nima qilish mumkin emas |
| `docs/01-TEXNIK-TOPSHIRIQ.md` | Toʻliq TZ: maqsad, rollar, funksional va nofunksional talablar |
| `docs/02-ARXITEKTURA.md` | Texnologiyalar, monorepo tuzilmasi, modullar, platforma qatlami |
| `docs/03-UX-UI-SPEKTSIFIKATSIYA.md` | Axborot arxitekturasi, menyu, har bir ekranning batafsil tavsifi, holatlar, adaptivlik |
| `docs/04-DIZAYN-TIZIMI.md` + `docs/design-tokens.json` | Ranglar (yorugʻ/tungi), shriftlar, boʻshliqlar, komponentlar |
| `docs/05-API.md` | Server API: barcha endpointlar, soʻrov/javob shakllari, WebSocket |
| `docs/06-MALUMOTLAR-MODELI.md` | Maʼlumotlar bazasi sxemasi (PostgreSQL) |
| `docs/07-SERVER-VA-DEPLOY.md` | VPS (Ubuntu 24.04) ga joylashtirish, Docker, HTTPS, GitHub Actions |
| `docs/08-BOSQICHLAR-VA-PROMPTLAR.md` | Claude Code'ga beriladigan tartiblangan promptlar |
| `docs/09-QABUL-MEZONLARI.md` | Har bir bosqich tayyor deb hisoblanishi uchun tekshiruv roʻyxati |
| `docs/10-PROTOTIP-IZOHLARI.md` | Dizayn maydonidagi barcha izohlar (har bir ekran nima uchun shunday) |
| `prototypes/` | Maketlarning HTML manbalari — aniq rang, oʻlcham va joylashuv uchun maʼlumotnoma |

## Prototiplar haqida

`prototypes/` dagi `.dc.html` fayllar dizayn muharriri formatida: ular alohida brauzerda toʻgʻridan-toʻgʻri ochilmaydi, lekin ichidagi inline uslublar (rang, oʻlcham, boʻshliq) va matnlar aniq maʼlumotnoma boʻlib xizmat qiladi. Claude Code ularni oʻqib, interfeysni shunga mos quradi.

Interaktiv koʻrinish: Claude'dagi «Xodim ish maydoni — maketlar» dizayn maydoni, «Yakuniy UX/UI · adaptiv» sahifasi. Ekran rasmlari kerak boʻlsa, maydondan Export orqali PNG/PDF yuklab olib, `docs/prototypes/png/` ga qoʻshing — Claude Code rasmlarni ham oʻqiy oladi.

## Asosiy qarorlar (qisqacha)

- **Desktop:** Tauri 2 + React + TypeScript. Har bir kompyuterda agent sifatida ishlaydi.
- **Ichki brauzer:** YouTube, Telegram, WhatsApp, Instagram va boshqa saytlar dastur ichida, alohida tablarda ochiladi (Tauri child webview).
- **Hujjat aylanishi:** asosiy ekranda emas — alohida modul (plagin). Asosiy ekranga faqat qisqa signal beradi.
- **Markaz:** shaxsiy to-do va kun xulosasi.
- **Server:** Node.js (Fastify) + PostgreSQL + WebSocket, Docker Compose, Caddy (avtomatik HTTPS).
- **Adaptiv:** desktop ≥1280, noutbuk 1024–1279, planshet 600–1023, telefon <600.
