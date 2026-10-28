# 03 · UX/UI spetsifikatsiyasi

Manba maketlar: `docs/prototypes/` (fayl nomlari quyida koʻrsatilgan). Har bir ekranning «nega shunday» izohlari: `docs/10-PROTOTIP-IZOHLARI.md`.

---

## 1. Axborot arxitekturasi

```
Ish maydoni
├─ ASOSIY
│  ├─ Bosh sahifa            /                 (UX_Desktop)
│  ├─ Vazifalarim            /tasks            (Vazifalar — roʻyxat qismi)
│  ├─ Kalendar               /calendar         (2-bosqich)
│  └─ Brauzer                /browser          (Brauzer_Start, UX_Laptop_Brauzer)
├─ MODULLAR (plaginlar, rolga qarab)
│  ├─ Hujjat aylanishi       /m/edo            (EDO_Modul)
│  │  ├─ Umumiy              /m/edo
│  │  ├─ Hujjatlar           /m/edo/documents  (Hujjatlar)
│  │  ├─ Ijro nazorati       /m/edo/control    (Ijro)
│  │  ├─ Topshiriqlar        /m/edo/assignments(Vazifalar — Kanban)
│  │  └─ Hisobotlar          /m/edo/reports
│  ├─ Kadrlar xizmatlari     /m/hr             (Xizmatlar — kadrlar qismi; 2-bosqich)
│  └─ Rahbar paneli          /m/manager        (Rahbar; faqat MANAGER/ADMIN; 2-bosqich)
├─ TARMOQLAR VA MESSENJERLAR → /browser?app=<key> (yangi yoki mavjud tab)
│  └─ Telegram · WhatsApp · Instagram · Facebook · YouTube · LinkedIn · (+ sozlanadi)
└─ TIZIM
   ├─ Umumiy qidiruv         Ctrl+K (oyna ustida)
   ├─ Bildirishnomalar       oʻngdan panel     (UX_Bildirishnoma)
   ├─ Sozlamalar             /settings         (UX_Sozlamalar)
   └─ Admin panel            (veb, 2-bosqich)
```

Qoida: har qanday joyga ≤ 2 bosishda yetiladi. Asosiy menyuda ≤ 12 qator.

## 2. Ilova qobigʻi (AppShell)

### 2.1. Chap menyu (Sidebar) — `UX_Desktop`
- Toʻliq: kenglik **248 px**, fon `--nav-bg` (#111827). Yigʻilgan: **72 px**, faqat ikonkalar.
- Tepada: logotip (36×36, `--accent-strong`), nom «Ish maydoni», ostida tashkilot nomi; «Menyuni yigʻish» tugmasi.
- Guruhlar (sarlavha 11 px, katta harf, `letter-spacing: .08em`): **ASOSIY**, **MODULLAR**, **TARMOQLAR** (yigʻiladigan).
- Qator: balandlik 40 px (ixcham: 36), ikonka 18 px, matn 14 px; faol qator fon `--nav-active` (#22304D), matn oq, `aria-current="page"`.
- Modul qatori ostida kichik izoh: «Hujjatlar · Ijro · Topshiriqlar».
- Tarmoq ilovalari: 24×24 rangli kvadrat ichida ikonka (har ilova oʻz rangida, `design-tokens.json → apps`).
- Raqamli belgi (badge): kulrang — umumiy son; qizil — oʻqilmagan xabar / kechikkan. Yigʻilgan rejimda raqam oʻrniga qizil nuqta; ustiga sichqoncha borganda tooltip: «Telegram · 12 ta yangi».
- Pastda: Sozlamalar.

### 2.2. Yuqori panel (Topbar)
- Balandlik 68 px, oq fon, pastki chegara.
- Chapda: umumiy qidiruv maydoni (≤ 560 px, 44 px balandlik, `Ctrl K` belgisi). Bosilganda Command Palette ochiladi.
- Oʻngda: sana va vaqt (vaqt — monospace), «AI» tugmasi (2-bosqichda faol), qoʻngʻiroqcha (oʻqilmaganlar soni), avatar.
- **Brauzer sahifasida** Topbar yoʻq — uning oʻrnini tablar va manzil satri oladi; AI, qoʻngʻiroqcha va avatar manzil satrining oʻng tomoniga koʻchadi.

### 2.3. Telefon: pastki menyu (BottomNav) — `UX_Telefon`
5 boʻlim: Bosh · Vazifalar · Brauzer · Modullar · Profil. Balandlik 76 px, faol — `--accent`.

## 3. Ekranlar

### 3.1. Kirish — `Kirish.dc.html`
- Ikki ustun: chapda (toʻq fon) dastur gʻoyasi va 3 afzallik; oʻngda karta (≤ 440 px).
- Yorliqlar: «E-IMZO kaliti» | «Login va parol» (MVP da login/parol faol, E-IMZO — «Tez orada»).
- Maydonlar 48 px; «Kirish» tugmasi 50 px, toʻliq kenglik.
- «Mobil ilova orqali QR-kod bilan» (2-bosqich), ikki bosqichli himoya haqida izoh, til tanlash, versiya va yordam raqami.
- Xato: maydon ostida qizil matn, fokus birinchi xato maydonga.

### 3.2. Bosh sahifa — `UX_Desktop.dc.html` (yakuniy)
Joylashuv (≥1280): kontent `max-width: 1240px`, chetdan 28 px.
1. **Sarlavha qatori:** chapda sana («Chorshanba, 28-oktabr 2026 · Ish kuni»), salomlashuv (28 px, 600), xulosa jumlasi; oʻngda 3 tugma (44 px).
2. **Koʻrsatkichlar qatori** (5 karta, `flex: 1 1 170px`, wrap): Bugungi vazifalar `1 / 5` + yashil progress; Muddati oʻtgan (qizil raqam) → Ijro nazorati; Imzo kutmoqda (koʻk raqam, «Hujjat aylanishi modulidan») → modul; Oylik ish rejasi `68%` + koʻk progress; Kelgan vaqtingiz `08:52` + «Oʻz vaqtida» (yashil).
3. **Ikki ustun** (`2fr` + `1fr`, 300 px dan torayganda pastga tushadi):
   - Chap: «Diqqat talab qiladi» (qizil son belgisi; qator: sarlavha + izoh, holat yorligʻi, amal tugmasi) → «Bugungi vazifalar» (katakcha 18 px, sarlavha + manba, vaqt monospace; bajarilgani chizilgan va kulrang).
   - Oʻng: «Xabarlar» (Telegram/WhatsApp/Pochta: rangli 36 px ikonka, nom, oxirgi xabar, qizil son) → «Bugungi jadval» (vaqt, nom, «Qoʻshilish») → ob-havo + «Valyuta kurslari · MB · yangilandi 09:00» (USD, EUR, RUB; oʻzgarish ↑/↓).
- Oʻzaro taʼsir: katakcha → darhol holat va progress yangilanadi (optimistik, xato boʻlsa qaytariladi); koʻrsatkich kartalari — havola.

### 3.3. Vazifalarim — `Vazifalar.dc.html` (roʻyxat qismi MVP da)
- Tepada: sarlavha + koʻrinish almashtirgichi (Roʻyxat | Kanban | Kalendar) + «Yangi vazifa».
- Tez yozish satri (QuickAdd): yozilganda ajratilgan qismlar chiplar sifatida (sana — koʻk, muhimlik — qizil, ijrochi — yashil, roʻyxat — kulrang), ostida maslahat va `Enter / Esc / Tab` belgilari.
- Filtrlar: Davr, Manba, Muhimlik, Ijrochi.
- Boʻlimlar (akkordeon): Kechikkan → Bugun → Keyingi kunlar → Bajarildi (yopiq).
- Vazifa bosilganda oʻng panel (≥1280) yoki toʻliq ekran (telefon): manba, muddat, holat, topshiriq beruvchi, tavsif, bosqichlar (progress), ilovalar, izohlar, ijro tarixi; tugmalar «Holatni oʻzgartirish», «Muddat soʻrash».

### 3.4. Brauzer — yangi tab — `Brauzer_Start.dc.html`
- Tablar qatori (fon #E9EBEF, faol tab oq, 36 px), manzil satri (36 px, yumaloq).
- Markazda: sana · vaqt · ob-havo; katta qidiruv (54 px, radius 27); almashtirgich «Internet (Google)» | «Tashkilot ichida».
- «Tarmoqlar va messenjerlar»: 8 plitka (48 px rangli ikonka, nom, qizil son).
- «Ish saytlari»: 6 ta (Lex.uz, my.gov.uz, soliq.uz, E-IMZO, Tashkilot sayti, Didox).
- «Oxirgi ochilganlar»: 4 qator (rangli nuqta, sarlavha, vaqt).

### 3.5. Brauzer — sayt ochiq — `UX_Laptop_Brauzer.dc.html`, `Brauzer.dc.html`
- Chap menyu avtomatik **72 px** ikonka rejimida.
- Tablar guruhlari: guruh yorligʻi (rangli chip «Muloqot», «Ish»), tablar tepasida guruh rangidagi 3 px chiziq; uxlagan tab xira (opacity .6) va «uxlamoqda» yozuvi; faol boʻlmagan tabda qizil son.
- Manzil satri: qulf (yashil, «Xavfsiz ulanish»), URL, `Ctrl K`; oʻngda: Rasm ichida rasm, Yonma-yon, Yuklab olishlar | AI, qoʻngʻiroqcha, avatar.
- Kontent maydoni = `BrowserViewport` (Tauri child webview shu elementning oʻrnida chiziladi).
- Pastda markazda vaqtinchalik izoh (masalan, «web.whatsapp.com — telefon QR orqali bir marta ulanadi»).

### 3.6. Hujjat aylanishi moduli — `EDO_Modul.dc.html` (+ `Hujjatlar`, `Ijro`, `Vazifalar` Kanban)
- Sarlavha: modul ikonkasi, «Hujjat aylanishi», «Modul · elektron hujjat aylanishi tizimiga ulangan»; oʻngda qidiruv, «Shablonlar», «+ Yangi hujjat».
- Yorliqlar: Umumiy · Hujjatlar (4) · Ijro nazorati (2) · Topshiriqlar (12) · Hisobotlar.
- Umumiy: 4 koʻrsatkich (Imzo kutmoqda, Kiruvchi, Kelishuvda, Muddati oʻtgan), «Imzo kutayotgan hujjatlar» (Imzolash), «Yaqin ijro muddatlari».
- Hujjatlar: 3 ustun (papkalar · roʻyxat · hujjat): rekvizitlar, harakatlar paneli («E-IMZO bilan imzolash» — yagona koʻk tugma), rezolyutsiya, AI qisqa mazmuni, kelishuv yoʻli.
- Ijro nazorati: shaxsiy ijro foizi (halqa), ogohlantirish bosqichlari (3 kun → 1 kun → bugun → kechikdi), turkum yorliqlari, shoshilinchlik boʻyicha saralangan jadval, AI tavsiyasi, murojaat muddati sanogʻi.
- MVP da modul maʼlumotlari server demo adapteridan keladi.

### 3.7. Bildirishnomalar — `UX_Bildirishnoma.dc.html`
- Oʻngdan 440 px panel, orqa fon `rgba(17,24,39,.32)`; Esc yoki tashqariga bosish — yopadi; fokus panel ichida.
- Sarlavha + «6 yangi» + «Hammasini oʻqildi» + sozlash + yopish.
- Yorliqlar: Hammasi 6 · Ish 3 · Xabarlar 2 · Tizim 1.
- Guruhlar «HOZIR», «BUGUN ERTAROQ»; qator: 36 px ikonka, sarlavha (oʻqilmagan — qalin, koʻk nuqta), matn, vaqt, amal tugmasi (34 px).
- Pastda: «Jim rejim» almashtirgichi va vaqt oraligʻi.

### 3.8. Umumiy qidiruv (Command Palette)
- Ekran markazida yuqoriroqda 640 px oyna, orqa fon xiralashgan.
- Kiritish maydoni 52 px; filtr chiplari: Hammasi, Vazifa, Hujjat, Web.
- Turkumlar va qatorlar (40 px): ikonka (28 px), sarlavha, izoh, oʻngda harakat belgisi («Enter», «Ochish», «Modulda», «Ctrl Enter»). Tanlangan qator fon `--accent-soft`.
- Pastki qator: `↑↓ tanlash · Enter ochish · Tab turkum · Esc yopish`.

### 3.9. Sozlamalar — `UX_Sozlamalar.dc.html`
- Chapda boʻlimlar (248 px): Koʻrinish, Menyu va ilovalar, Bildirishnomalar, Til va hudud, Brauzer, Xavfsizlik.
- Koʻrinish: tema kartalari (180 px, mini oldindan koʻrish; tanlangan — 2 px koʻk chegara), zichlik (Qulay 44 / Ixcham 36), shrift oʻlchami.
- Menyu: tarmoqlar roʻyxati (sudrash tutqichi, rangli ikonka, nom, almashtirgich `role="switch"`); admin majburiy qilgan — qulf va «Admin belgilagan», oʻchirib boʻlmaydi.
- Oʻngda 360 px «Oldindan koʻrish» — tema va zichlik darhol aks etadi.

### 3.10. Planshet — `UX_Planshet.dc.html` (834×1112)
- Menyu 72 px ikonka; kontent bitta ustun; qidiruv (44 px, yumaloq), qoʻngʻiroqcha, avatar; koʻrsatkichlar 2×2; «Diqqat», «Bugungi vazifalar» (qator 56 px), «Xabarlar» 3 ustun.

### 3.11. Telefon — `UX_Telefon.dc.html`, tungi — `UX_Telefon_Tun.dc.html`, brauzer — `UX_Telefon_Brauzer.dc.html`
- Bosh: avatar + salomlashuv + qoʻngʻiroqcha; qidiruv; koʻk «hero» karta (qolgan ishlar, progress, 3 qisqa koʻrsatkich); 5 ta ilova (52 px, radius 16, qizil son); «Diqqat» (2), «Bugungi vazifalar» (3, qator 52 px); BottomNav.
- Tungi rejim: faqat tokenlar almashadi (`design-tokens.json → color.dark`).
- Brauzer (telefon): tepada guruh chiplari; kontent; **pastda** manzil satri (44 px) va asboblar: Orqaga, Oldinga, Rasm ichida rasm, Tablar soni, Ilova menyusi (pastdan surib chaqiriladi).

## 4. Nostandart holatlar — `UX_Holatlar.dc.html`

| Holat | Koʻrinishi | Matn namunasi |
|---|---|---|
| Boʻsh | Yashil doira + ✓, sarlavha, izoh, 2 tugma | «Bugun hamma ishlar bajarildi» |
| Oflayn | Kontent ustida toʻq sariq tasma | «Internet yoʻq. 09:12 holatidagi maʼlumot koʻrsatilmoqda» + «Qayta urinish»; navbatdagi amal: «Navbatda: bajarildi» |
| Yuklanish | Skelet (kulrang shakllar), `aria-busy="true"` | Sahifa skeletdan maʼlumotga oʻtganda siljimaydi |
| Ruxsat yoʻq | Qulf ikonkasi, sabab, 2 tugma | «“Rahbar paneli” moduli sizga yoqilmagan» + «Admin'dan soʻrash» |
| Xato | Qizil tasma, qayta urinish | «Serverda xatolik. Keyinroq urinib koʻring» |

## 5. Adaptiv qoidalar

| Oʻlcham | Kenglik | Menyu | Toʻr | Kontent |
|---|---|---|---|---|
| Desktop | ≥ 1280 | Toʻliq 248 px (yigʻish mumkin) | 12 ustun, oraliq 24, chet 32 (kontentda 28) | 2 ustun |
| Noutbuk | 1024–1279 | Ikonka 72 px, hover'da nom | 12 ustun, oraliq 24, chet 24 | 2 ustun, oʻng ≤ 320 |
| Planshet | 600–1023 | Ikonka 72 px | 8 ustun, oraliq 16, chet 24 | 1 ustun, koʻrsatkichlar 2×2 |
| Telefon | < 600 | Pastki menyu (5) | 4 ustun, oraliq 16, chet 16 | 1 ustun, kartalar toʻliq kenglik |

- Brauzer sahifasi har qanday oʻlchamda menyuni ikonka rejimiga oʻtkazadi.
- Sensorli ekranda tugmalar ≥ 44 px; «Ixcham» rejim faqat sichqoncha uchun (≥1024).
- Oyna minimal oʻlchami (desktop ilova): 900×600.

## 6. Oʻzaro taʼsir va harakat

- Oʻtishlar 150–200 ms, `ease-out`; `prefers-reduced-motion` da oʻchadi.
- Hover: qator foni `--surface-hover`; fokus: 2 px `--focus-ring`.
- Klaviatura: `Ctrl+K` qidiruv, `Ctrl+T` yangi tab, `Ctrl+W` tabni yopish, `Ctrl+L` manzil satri, `N` yangi vazifa (roʻyxatda), `?` tugmalar roʻyxati, `Esc` panel/oynani yopish.
- Optimistik yangilanish: vazifa belgilash darhol koʻrinadi; server xato qaytarsa — holat qaytariladi va kichik xabar chiqadi.

## 7. Matnlar uslubi

- Qisqa, aniq, «siz» shaklida; tugmada fe'l: «Imzolash», «Qoʻshilish», «Ochish».
- Raqam formati: `12 640,25`; sana: `28.10.2026`, `28-oktabr`; vaqt: `09:02` (monospace).
- Oʻ, gʻ va tutuq belgisi: `oʻ`, `gʻ`, `ʼ` (U+02BB, U+02BC).
