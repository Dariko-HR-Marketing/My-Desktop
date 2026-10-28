# 01 · Texnik topshiriq (TZ)

**Loyiha:** «Ish maydoni» — xodimning yagona desktop ish stoli
**Versiya:** 1.0 (MVP) · **Sana:** 28.10.2026
**Buyurtmachi:** [Tashkilot nomi]

---

## 1. Maqsad

Xodim kompyuterni yoqqanda bitta oynada quyidagilarni koʻrishi va bajarishi kerak:

- bugun nima qilishi kerak (to-do, muddatlar, kechikkan ishlar);
- kim undan nima kutyapti (topshiriqlar, imzo kutayotgan hujjatlar, xabarlar);
- kundalik ishlatadigan barcha saytlar, ijtimoiy tarmoqlar va messenjerlar — **tashqi brauzerga chiqmasdan**, dastur ichida;
- tashkilot tizimlari (hujjat aylanishi, kadrlar xizmatlari va boshqalar) — **alohida ulanadigan modullar** sifatida.

Asosiy tamoyil: **«Bitta kirish, bitta oyna, bitta bildirishnomalar markazi»**.

## 2. Foydalanuvchilar va rollar

| Rol | Kim | Nimaga kirish huquqi bor |
|---|---|---|
| `EMPLOYEE` | Oddiy xodim | Bosh sahifa, Vazifalarim, Kalendar, Brauzer, ruxsat berilgan modullar, Sozlamalar |
| `MANAGER` | Boʻlim rahbari | Xodim huquqlari + Rahbar paneli moduli + xodimlarga bildirishnoma/topshiriq yuborish |
| `ADMIN` | IT administrator | Hammasi + Admin panel: foydalanuvchilar, rollar, modullar, ilovalar katalogi, sayt siyosati |

## 3. Qamrov

### 3.1. MVP (1.0) ga kiradi

| № | Funksiya | Qisqacha |
|---|---|---|
| F1 | Kirish | Login/parol (JWT). OneID va E-IMZO — interfeys tayyor, integratsiya 2-bosqichda |
| F2 | Bosh sahifa | Kun xulosasi, 5 ta koʻrsatkich, «Diqqat talab qiladi», bugungi vazifalar, xabarlar, jadval, valyuta, ob-havo |
| F3 | Vazifalarim (to-do) | Roʻyxat, tez yozish (tabiiy til), holatlar, muddat, muhimlik, manba, filtrlar |
| F4 | Ichki brauzer | Tablar va tab guruhlari, manzil = qidiruv, Google, «rasm ichida rasm», yonma-yon, yuklab olishlar, uxlaydigan tablar |
| F5 | Tarmoqlar va messenjerlar | Telegram, WhatsApp, Instagram, Facebook, YouTube, LinkedIn — menyuda, oʻqilmaganlar soni bilan |
| F6 | Modullar tizimi | Plagin arxitekturasi: manifest, rollar, signal. Birinchi modul — Hujjat aylanishi (demo adapter) |
| F7 | Bildirishnomalar markazi | Ish / Xabarlar / Tizim, guruhlash, amal tugmasi, «Jim rejim», real vaqt (WebSocket) |
| F8 | Umumiy qidiruv (Ctrl+K) | Vazifalar, hujjatlar (moduldan), ilovalar, Google, AI so'rovi (AI — 2-bosqich) |
| F9 | Sozlamalar | Tema (yorugʻ/tungi/tizim), zichlik (qulay/ixcham), menyuda koʻrinadigan ilovalar, avtomatik ishga tushish |
| F10 | Adaptivlik | 4 ta oʻlcham (desktop, noutbuk, planshet, telefon) |
| F11 | Oflayn rejim | Oxirgi maʼlumot keshdan; amallar navbatga yoziladi |
| F12 | Agent xususiyatlari | Kompyuter yoqilganda avtomatik ishga tushish, bitta nusxa, tizim tray, avtomatik yangilanish |
| F13 | Server | API, PostgreSQL, WebSocket, Docker, HTTPS, avtomatik deploy |

### 3.2. Keyingi bosqichlar (MVP ga kirmaydi)

- OneID, E-IMZO bilan kirish va imzolash; real hujjat aylanishi tizimi bilan integratsiya.
- Kadrlar xizmatlari moduli (taʼtil, ish haqi varaqasi, davomat — Face ID/turniket integratsiyasi).
- Rahbar paneli moduli (ijro intizomi, yuklama, reyting) — maketlari tayyor.
- AI yordamchi: ertalabki brifing, hujjat qisqa mazmuni, xat loyihasi.
- Admin panel (veb), MDM orqali tarqatish, Ish/Shaxsiy profil ajratish.
- Mobil ilova (Android/iOS) — maketlari tayyor.
- Tillar: kirill, rus, ingliz.

## 4. Funksional talablar (batafsil)

### F1. Kirish
- Login + parol; xato boʻlsa — «Login yoki parol notoʻgʻri» (qaysi biri xato ekanini aytmaslik).
- Muvaffaqiyatli kirishdan keyin token xavfsiz saqlanadi; keyingi safar avtomatik kiriladi.
- 1 daqiqada 10 tadan ortiq urinish — vaqtincha bloklash.
- Kirish ekranida: E-IMZO yorligʻi (2-bosqichda faollashadi), QR orqali kirish (2-bosqich), til tanlash, yordam raqami.

### F2. Bosh sahifa
- Salomlashuv vaqtga qarab: «Xayrli tong / kun / kech, [Ism]» + bitta jumla: «N ta vazifa qoldi · M tasi kechikkan · HH:MM da uchrashuv».
- Tezkor amallar: «+ Yangi vazifa», «Brauzerni ochish», «Hujjat yaratish» (modulga).
- Koʻrsatkichlar (5): bugungi vazifalar (progress), muddati oʻtgan (qizil), imzo kutmoqda (moduldan), oylik ish rejasi %, kelgan vaqt.
- «Diqqat talab qiladi»: faqat muddati oʻtgan yoki bugun tugaydigan ishlar, eng koʻpi 5 ta, eng kechikkani tepada; har birida bitta amal tugmasi.
- «Bugungi vazifalar»: katakcha bilan belgilash, manba yorligʻi, vaqt.
- «Xabarlar»: messenjer va pochtadagi oʻqilmaganlar; bosilsa — ichki brauzer tabi.
- «Bugungi jadval»: uchrashuvlar; onlayn uchrashuvda «Qoʻshilish».
- Valyuta (Markaziy bank, USD/EUR/RUB) va ob-havo — **«yangilandi HH:MM»** belgisi bilan.

### F3. Vazifalarim (to-do)
- Holatlar: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`. Muhimlik: `LOW`, `NORMAL`, `HIGH`. Manba: `PLAN`, `MANAGER`, `PERSONAL`, `MODULE`.
- **Tez yozish** — bitta satr, tizim oʻzi ajratadi:
  - sana: `bugun`, `ertaga`, `indinga`, hafta kunlari (`dushanba`…`yakshanba`), `5-noyabr`, `5 noyabr`, `28.10`, `28.10.2026`;
  - vaqt: `10:00`, `10.00`; vaqt yozilmasa — 18:00; faqat vaqt yozilib, u oʻtgan boʻlsa — ertaga;
  - muhimlik: `!yuqori`, `!muhim`, `!past`, `!oddiy`;
  - ijrochi: `@ism`; roʻyxat: `#nom`;
  - yozayotganda ajratilgan qismlar yorliq (chip) koʻrinishida koʻrsatiladi; Enter — saqlash, Esc — bekor.
- Kechagi bajarilmagan ishlar avtomatik bugunga «kechikkan» belgisi bilan oʻtadi.
- Moduldan kelgan topshiriqlar (`source=MODULE`) «Hujjat» belgisi bilan avtomatik tushadi.
- Bajarilganlar pastga yigʻiladi.
- Koʻrinishlar: Roʻyxat (MVP), Kanban va Kalendar (2-bosqich; maketlar tayyor).

### F4. Ichki brauzer
- Har bir sayt alohida tab; tablar rangli guruhlarga birlashadi («Muloqot», «Ish»).
- Manzil satri: URL yoki soʻz (soʻz → Google qidiruv); xavfsiz ulanish belgisi; sevimlilarga qoʻshish.
- Asboblar: orqaga/oldinga/yangilash, «rasm ichida rasm», «yonma-yon», yuklab olishlar.
- Faol boʻlmagan tab 10 daqiqadan keyin «uxlaydi» (xotira boʻshatiladi), bosilganda tiklanadi.
- Brauzer ochilganda chap menyu avtomatik ikonka rejimiga qisqaradi.
- Sessiyalar saqlanadi: Telegram/WhatsApp'ga bir marta kiriladi.
- Yuklab olingan fayllar Windows Defender (yoki tashkilot antivirusi) orqali tekshiriladi.
- Admin siyosati: ruxsat etilgan / taqiqlangan saytlar roʻyxati; «tashqi brauzerda ochish» huquqi.
- «Yangi tab» sahifasi: katta qidiruv, 8 ta tarmoq/messenjer plitkasi, ish saytlari, oxirgi ochilganlar.

### F5. Tarmoqlar va messenjerlar
- Standart katalog: Telegram, WhatsApp, Instagram, Facebook, YouTube, LinkedIn, Google, Lex.uz, my.gov.uz, soliq.uz.
- Xodim menyuda qaysilari koʻrinishini oʻzi tanlaydi (Sozlamalar); admin majburiy ilovalar belgilaydi (qulf belgisi).
- Oʻqilmaganlar soni: sahifa sarlavhasidan olinadi (masalan, «(12) Telegram») — Rust tomonida sarlavha oʻzgarishini kuzatish.

### F6. Modullar
- Modul manifesti: `key`, `name`, `description`, `roles[]`, `version`, `routes`, `signals()`.
- Menyuda modul bitta qator; ichida oʻz yorliqlari (masalan, Hujjat aylanishi: Umumiy · Hujjatlar · Ijro nazorati · Topshiriqlar · Hisobotlar).
- Bosh sahifaga faqat signal: «Imzo kutmoqda: 4», «Muddati oʻtgan: 2».
- Modul ishlamay qolsa, boshqa qismlar ishlashda davom etadi.
- Ruxsat yoʻq boʻlsa — «Ruxsat yoʻq» holati va «Admin'dan soʻrash» tugmasi.

### F7. Bildirishnomalar
- Oʻngdan chiqadigan panel (440 px); yorliqlar: Hammasi · Ish · Xabarlar · Tizim.
- Guruhlash: «Hozir», «Bugun ertaroq»; bir manbadan kelgan bir nechta xabar bitta qatorga yigʻiladi.
- Har xabarda bitta asosiy amal (Imzolash, Ochish, Qoʻshilish).
- «Hammasini oʻqildi»; «Jim rejim» (vaqt oraligʻi — faqat shoshilinch).
- Shoshilinch xabarlar (kechikish, imzo, uchrashuvga 15 daqiqa) — tizim bildirishnomasi ham.

### F8. Umumiy qidiruv
- `Ctrl+K` (macOS: `Cmd+K`) har qanday ekranda.
- Natijalar turkum boʻyicha: Amallar → Vazifalar → Hujjatlar → Xodimlar → Ilovalar → Web (Google) → AI.
- Birinchi qator: «“<soʻz>” nomli vazifa yaratish».
- ↑↓ tanlash, Enter ochish, Tab turkum, Esc yopish.

### F9. Sozlamalar
- Koʻrinish: tema, zichlik, shrift oʻlchami; oʻngda darhol oldindan koʻrish.
- Menyu va ilovalar: tarmoqlarni yoqish/oʻchirish, sudrab tartiblash.
- Bildirishnomalar: jim rejim vaqti, turkumlar.
- Til va hudud.
- Brauzer: uxlash vaqti, yuklab olish papkasi, tozalash.
- Tizim: kompyuter yoqilganda ishga tushish; server manzili.
- Sozlamalar serverda saqlanadi va boshqa qurilmalarga sinxronlanadi.

## 5. Nofunksional talablar

- **Platformalar:** Windows 10/11 (asosiy), macOS 13+, Linux (Ubuntu 22.04+). Mobil — 2-bosqich.
- **Xavfsizlik:** HTTPS/WSS; JWT (12 soat); parollar bcrypt (≥12); sirlar `.env` da; brauzer saytlari Tauri IPC ga kira olmaydi; audit jurnali (2-bosqich); shaxsga doir maʼlumotlar Oʻzbekiston hududidagi serverda.
- **Maxfiylik:** xodimning shaxsiy tarmoq faoliyati (qaysi sayt, qancha vaqt) rahbarga koʻrsatilmaydi — bu qoida hujjatda va interfeysda ochiq yoziladi.
- **Kirish qulayligi:** WCAG 2.1 AA.
- **Til:** oʻzbek (lotin) — MVP; tuzilma 4 tilga tayyor.

## 6. Tezlik byudjeti

| Koʻrsatkich | Maqsad |
|---|---|
| Oynaning ochilishi (agent fonda) | ≤ 1,5 s |
| Bosh sahifa birinchi koʻrinishi | ≤ 1 s (keshdan) |
| Xotira (boʻsh holat, brauzer tablarisiz) | ≤ 250 MB |
| Oʻrnatma hajmi (Windows) | ≤ 20 MB |
| API javobi (p95) | ≤ 300 ms |
| Real vaqt xabari yetib kelishi | ≤ 2 s |

Usullar: keshdan darhol koʻrsatish + fonda yangilash; vidjetlar ekranga kirganda yuklanadi; uxlaydigan tablar; brotli siqish; shrift — kerakli harflar toʻplami; fondagi delta-yangilanish; batareyada animatsiya kamayadi.

## 7. Qabul qilish

`docs/09-QABUL-MEZONLARI.md` dagi barcha bandlar bajarilganda MVP qabul qilinadi.
