# 10 · Prototip izohlari

Dizayn maydonidagi har bir ekran yonida yozilgan izohlar (nima uchun shunday qilingan). Fayl nomlari — `prototypes/` papkasidagi manbalar.

## Yakuniy UX/UI · adaptiv (asosiy manba)

### A · Axborot arxitekturasi — `UX_Arxitektura.dc.html`

A · Axborot arxitekturasi

Dastur toʻrt boʻlimdan va bitta platforma qatlamidan iborat:

① ASOSIY — har kuni ishlatiladigan: Bosh sahifa, Vazifalarim, Kalendar, Brauzer.
② MODULLAR — alohida ulanadigan servislar. Hujjat aylanishi shulardan biri; uning ichida Hujjatlar, Ijro, Topshiriqlar, Hisobotlar. Modullar lavozimga qarab yoqiladi.
③ TARMOQLAR VA SAYTLAR — hammasi ichki brauzerda ochiladi.
④ TIZIM — qidiruv, AI, bildirishnomalar, sozlamalar, admin panel.

Pastdagi platforma qatlami — har bir kompyuterga oʻrnatiladigan agent: kirish, brauzer dvigateli, bildirishnomalar, oflayn kesh, yangilanish, xavfsizlik.

Arxitektura qoidalari

• Har qanday boʻlimga 2 bosishdan koʻp boʻlmagan yoʻl bilan yetiladi.
• Asosiy menyuda 12 tadan koʻp qator boʻlmaydi; ortigʻi yigʻiladigan guruhda.
• Modul — mustaqil plagin: oʻz menyusi, oʻz ruxsatlari, oʻz yangilanishi. Asosiy ekranga faqat qisqa signal beradi («Imzo kutmoqda: 4»).
• Har bir tarmoq va sayt — brauzer tabi; alohida ekran yozilmaydi.
• Umumiy qidiruv hamma boʻlimni va Google'ni qamrab oladi.

### B · Adaptiv tizim va dizayn tokenlari — `UX_Adaptiv.dc.html`

B · Adaptiv qoidalar

≥1280 px (desktop): toʻliq menyu 248 px, kontent 12 ustunli toʻrda, 2 ustun (asosiy + yordamchi).
1024–1279 (noutbuk): menyu ikonkalarga qisqaradi (72 px), nom hover'da. Brauzer ochilganda shu holat avtomatik.
600–1023 (planshet): ikonka-menyu, kontent 1 ustun, koʻrsatkichlar 2×2.
<600 (telefon): menyu pastki panelga oʻtadi (5 ta boʻlim), sarlavha qisqaradi, kartalar toʻliq kenglikda.

Toʻr va boʻshliqlar: 12 / 8 / 4 ustun; oraliq 24 / 16 / 16 px; chetdan 32 / 24 / 16 px.
Tugmalar: sensorli ekranda kamida 44 px, «Ixcham» rejimda sichqoncha uchun 36 px.

Optimizatsiya va tezlik byudjeti

• Oyna ochilishi ≤ 1,5 s (agent fonda tayyor turadi); bosh sahifa birinchi koʻrinishi ≤ 1 s — oxirgi holat keshdan.
• Avval keshdagi maʼlumot koʻrsatiladi, fonda yangilanadi; real vaqt xabarlari WebSocket orqali, faqat oʻzgargan qismi.
• Vidjetlar ekranga kirganda yuklanadi; pastdagilar scroll'da.
• Faol boʻlmagan brauzer tablari 10 daqiqadan keyin «uxlaydi» — xotira tejaladi.
• Xotira: boʻsh holatda ≤ 250 MB; har bir faol tab alohida hisoblanadi.
• Tarmoq: siqish (brotli), rasmlar WebP/AVIF, ikonkalar bitta SVG toʻplamida, shrift faqat kerakli harflar bilan.
• Oflayn: oxirgi holat lokal bazada; internet qaytganda kutib turgan amallar yuboriladi.
• Yangilanish: fonda, faqat oʻzgargan qism; qayta ishga tushirish vaqtini xodim tanlaydi.
• Batareyada: animatsiya va fon yangilanishi kamayadi.
• Har versiyada tezlik avtomatik oʻlchanadi; byudjetdan oshsa reliz toʻxtatiladi.

Texnik arxitektura (tavsiya)

• Desktop: Tauri (Rust) + tizim brauzer dvigateli — Windows'da WebView2, macOS'da WKWebView. Oʻrnatma ~10–15 MB.
• Interfeys: React + TypeScript, yagona dizayn tizimi (tokenlar: rang, shrift, boʻshliq, zichlik, tema).
• Mobil: Flutter yoki React Native — dizayn tokenlari umumiy.
• Backend: API gateway + servislar (Kirish, Bildirishnomalar, Vidjetlar, Modullar, Qidiruv), WebSocket.
• Modullar plagin sifatida: manifest, ruxsatlar, alohida versiya.
• Kirish: SSO (OneID / Active Directory), E-IMZO.
• Tarqatish: guruh siyosati yoki MDM orqali hamma kompyuterga bir vaqtda.
• Maʼlumotlar respublika hududidagi serverlarda.

### 1 · Desktop — Bosh sahifa (≥1280) — `UX_Desktop.dc.html`

1 · Desktop — Bosh sahifa (yakuniy)

Barcha oʻzgarishlar jamlangan:
① Yangi menyu: Asosiy · Modullar · Tarmoqlar. Hujjat aylanishi — bitta qator.
② Menyuni yigʻish tugmasi (yuqorida) — ikonka rejimiga oʻtadi. Maketda bosib koʻring.
③ Tarmoqlar guruhi yigʻiladi; qaysi ilovalar koʻrinishini xodim Sozlamalarda tanlaydi.
④ Yuqori panel hamma ekranda bir xil: umumiy qidiruv (Ctrl+K), AI, bildirishnomalar, profil.
⑤ «Xabarlar» vidjeti — Telegram, WhatsApp, pochtadagi oʻqilmaganlar; bosilsa brauzer tabi ochiladi.

Davomi

⑥ Har bir vidjetda «yangilandi» vaqti — maʼlumot qanchalik yangiligi koʻrinadi.
⑦ Imzo kutayotgan hujjatlar — moduldan kelgan signal; «Modulga oʻtish» havolasi.
⑧ Vazifalarda katakchani bosing — hisob va progress yangilanadi.
⑨ Sahifa oynaning kengligiga moslashadi: oynani toraytirsangiz, oʻng ustun pastga tushadi, menyu tepaga oʻtadi.

Maket Play rejimida toʻliq oynada ham ochiladi.

### 2 · Noutbuk — ichki brauzer (1024–1279) — `UX_Laptop_Brauzer.dc.html`

2 · Noutbuk — ichki brauzer

Brauzer ochilganda menyu avtomatik ikonkalarga qisqaradi (72 px) — sayt uchun maksimal joy.

① Ikonka ustiga sichqoncha borganda nom chiqadi; raqam — oʻqilmaganlar.
② Tablar guruhlangan: «Muloqot» (Telegram, WhatsApp) va «Ish» (Lex.uz, Google) — rangli chiziq bilan.
③ Manzil satri = umumiy qidiruv: manzil, Google yoki tashkilot ichidan qidirish bitta joyda.
④ AI va bildirishnomalar manzil satrining oʻng tomonida — boshqa ekranlardagidek.

Play rejimida

Tablar va chapdagi tarmoq ikonkalari bosiladi — kontent almashadi.

• «Rasm ichida rasm», «Yonma-yon» va yuklab olishlar — manzil satri yonida.
• Har bir sayt alohida konteynerda; sessiya dastur yopilganda ham saqlanadi.
• Faol boʻlmagan tab xira koʻrinadi — u «uxlab» xotirani boʻshatgan.

### 3–6 · Planshet va telefon — `UX_Planshet`, `UX_Telefon`, `UX_Telefon_Tun`, `UX_Telefon_Brauzer`

3–6 · Planshet va telefon

Planshet: ikonka-menyu chapda, kontent bitta ustunda, koʻrsatkichlar 2×2. Barmoq bilan bosish uchun hamma tugma 44 px.

Telefon: menyu pastki panelga oʻtadi — Bosh, Vazifalar, Brauzer, Modullar, Profil. Bosh barmoq yetadigan joyda.
• Yuqorida faqat kun xulosasi va kechikkan ishlar.
• Messenjerlar qatori — bir bosishda Telegram yoki WhatsApp.
• Vazifa katakchasini bosing — hisob yangilanadi.

Tungi rejim va telefon brauzeri

Tungi rejim — xuddi shu ekran, faqat rang tokenlari almashadi. Fon qora emas, toʻq kulrang (#14161B): matn kontrasti saqlanadi, koʻz charchamaydi. Holat ranglari yorqinroq tusda.

Telefon brauzeri: manzil satri pastda (bosh barmoq uchun), tablar soni tugmasi, «orqaga» va «rasm ichida rasm». Ilova pastki menyusi brauzer ichida yashirinadi va pastdan surib chaqiriladi.

### 7 · Bildirishnomalar markazi — `UX_Bildirishnoma.dc.html`

7 · Bildirishnomalar markazi

Qoʻngʻiroqcha bosilganda oʻngdan panel chiqadi; sahifa oʻz joyida qoladi.

① Yorliqlar: Hammasi · Ish · Xabarlar · Tizim — ish xabarlari tarmoq xabarlaridan ajratilgan.
② Guruhlash: «Hozir», «Bugun ertaroq». Bir manbadan kelgan bir nechta xabar bitta qatorga yigʻiladi.
③ Har bir xabarda bitta asosiy amal: Imzolash, Ochish, Javob berish — panelning oʻzida.
④ «Jim rejim» — belgilangan vaqtda faqat shoshilinch xabarlar keladi.
⑤ «Hammasini oʻqildi» va sozlash tugmasi tepada.

### 8 · Sozlamalar — koʻrinish va menyu — `UX_Sozlamalar.dc.html`

8 · Sozlamalar

Chapda boʻlimlar: Koʻrinish, Menyu va ilovalar, Bildirishnomalar, Til va hudud, Brauzer, Xavfsizlik.

«Koʻrinish»: tema (Yorugʻ / Tungi / Tizim boʻyicha), zichlik (Qulay / Ixcham), shrift oʻlchami. Tanlov darhol oldindan koʻrishda aks etadi. Maketda tema va zichlikni bosib koʻring.

«Menyu va ilovalar»

• Tarmoqlar va messenjerlar roʻyxatini xodim oʻzi yoqadi-oʻchiradi va sudrab tartiblaydi.
• Admin belgilagan majburiy modullar qulf belgisi bilan — oʻchirib boʻlmaydi.
• Tashkilot rangi va logotipi admin paneldan keladi; xodim uni oʻzgartirmaydi.

### 9 · Holatlar: boʻsh, oflayn, yuklanish, ruxsat yoʻq — `UX_Holatlar.dc.html`

9 · Nostandart holatlar

Har bir vidjet va sahifa uchun 4 holat oldindan chiziladi:

① Boʻsh — «Bugun hamma ishlar bajarildi» + keyingi foydali amal.
② Oflayn — oxirgi saqlangan maʼlumot va uning vaqti koʻrinadi; amallar navbatga yoziladi.
③ Yuklanish — skelet (kulrang shakllar), aylanuvchi belgi emas: sahifa sakramaydi.
④ Ruxsat yoʻq — sababi va «Admin'dan soʻrash» tugmasi.

Bu holatlar boʻlmasa, dastur xato qilganda xodim nima boʻlganini tushunmaydi.

## Ekranlar: kirish, modul ichidagi sahifalar, brauzer

### 1 · Kirish ekrani — `Kirish.dc.html`

1-ekran · Kirish

• Ekran ikkiga boʻlingan: chapda dastur gʻoyasi, oʻngda faqat bitta harakat — kirish. Xodim hech narsaga chalgʻimaydi.
• Birinchi oʻrinda E-IMZO kaliti bilan kirish turadi: bu davlat va korporativ tizimlarda eng ishonchli, yuridik kuchga ega usul. Login-parol ikkinchi variant (yorliqlar maketda bosiladi).
• Bir marta kirish (SSO): shundan keyin barcha ichki tizimlar parolsiz ochiladi. Xodim kuniga 5–10 marta parol terishdan qutuladi.
• Mobil ilova orqali QR-kod bilan kirish — kalit yonida boʻlmasa ham kirish mumkin.
• Pastda til tanlash, versiya va yordam raqami: muammo boʻlsa xodim kimga murojaat qilishni darhol biladi.

«Kirish» tugmasi bosh sahifaga olib oʻtadi.

Umumiy dizayn tamoyillari (barcha ekranlar uchun)

• Tuzilma: chapda doimiy menyu, tepada qidiruv va bildirishnomalar, markazda ish maydoni. Bu Windows va macOS dasturlarida koʻnikilgan tartib — oʻrgatish deyarli shart emas.
• Koʻz harakati: odam ekranni yuqori-chapdan boshlab «F» shaklida oʻqiydi. Eng muhim narsa (kun xulosasi, kechikkan ishlar) shu yerda turadi.
• Ranglar maʼnosi qatʼiy: koʻk — harakat va tanlangan holat; qizil — kechikkan; toʻq sariq — muddati yaqin; yashil — bajarilgan; kulrang — oddiy maʼlumot. Rang hech qachon yolgʻiz emas, yonida doim matn bor.
• Shrift: IBM Plex Sans — oʻ, gʻ, ʼ harflarini va kirill yozuvini toʻgʻri koʻrsatadi, raqamlari jadvalda tekis turadi.
• Barcha tugmalar kamida 44 px balandlikda — sichqoncha bilan ham, sensorli ekranda ham oson bosiladi.
• Chap menyudagi raqamli belgilar (badge) — qayerda ish kutayotganini sahifaga kirmasdan koʻrsatadi.
• Maketlardagi barcha ism, raqam va matnlar namuna uchun.

### 2 · Bosh sahifa (1-variant, tarixiy — yakuniysi: `UX_Desktop.dc.html`)

2-ekran · Bosh sahifa «Bugungi kun»

Kompyuter yoqilganda birinchi shu ekran ochiladi. Vazifasi — 10 soniyada «bugun nima qilishim kerak?» savoliga javob berish.

① Salomlashuv va kun xulosasi (yuqori-chap): koʻz birinchi tushadigan joy. Bitta jumlada butun kun manzarasi.
② Tezkor amallar (yuqori-oʻng): eng koʻp bajariladigan 3 ta ish — yangi vazifa, ariza, hujjat. Menyuga kirmasdan bir bosishda.
③ Koʻrsatkichlar qatori: 5 ta raqam — vazifalar, kechikkanlar, imzo kutayotganlar, ish rejasi foizi, kelgan vaqt. Har biri bosilsa tegishli sahifaga olib boradi.
④ «Diqqat talab qiladi» bloki eng yuqorida, chunki kechikkan ish — eng qimmat ish. Bu yerga faqat muddati oʻtgan yoki bugun tugaydigan ishlar tushadi, 3–5 tadan oshmaydi.

Davomi

⑤ Bugungi vazifalar: belgilash katakchasi chap tomonda — ish bajarilishi bilan darhol belgilanadi (maketda bosib koʻring, hisob ham yangilanadi). Manba yorligʻi (Rahbar topshirigʻi / Ish rejasi / Shaxsiy) ish kimdan kelganini koʻrsatadi.
⑥ Oʻng ustun — yordamchi maʼlumot: jadval, ob-havo va valyuta, eʼlonlar. Ular kerak, lekin asosiy ishdan muhimroq emas, shuning uchun torroq ustunda.
⑦ Yigʻilish kartasida «Qoʻshilish» tugmasi — havolani pochtadan qidirish shart emas.
⑧ Eʼlonda «Tanishdim» tugmasi — rahbariyat kim tanishganini biladi, qogʻozga imzo yigʻilmaydi.
⑨ Tezkor ilovalar pastda: ular kun davomida ishlatiladi, ertalabki birinchi qarash uchun emas. Har bir xodim roʻyxatni oʻzi sozlaydi.

Tepadagi qidiruv (Ctrl K) va «AI yordamchi» tugmasi barcha ekranlarda bir xil joyda turadi.

### 3 · Vazifalar va ish rejasi — `Vazifalar.dc.html`

3-ekran · Vazifalar va ish rejasi

① Ish rejasi chizigʻi eng tepada: oy rejasining necha foizi bajarilgani birinchi koʻrinadi. Kunlik / haftalik / oylik / choraklik almashtirgichi — bitta reja, turli davr.
② Koʻrinish almashtirgichi (Roʻyxat / Kanban / Kalendar): har kim oʻziga qulay usulda ishlaydi, maʼlumot esa bitta.
③ Kanban doskasi ishning hayotiy yoʻlini takrorlaydi: Yangi → Jarayonda → Tekshiruvda → Bajarildi. Kartochkani keyingi ustunga surish holatni oʻzgartiradi, alohida forma toʻldirish shart emas.
④ Kartochkada faqat qaror uchun keraklisi: nom, manba, muddat, ustuvorlik, ijrochi, bosqichlar soni. Qolgani — oʻng paneldagi tafsilotda.

Davomi

⑤ Oʻng tafsilot paneli: kartochka bosilganda shu yerda ochiladi (maketda bosib koʻring). Sahifadan chiqmasdan vazifani koʻrish, bosqichlarni kuzatish, izoh yozish mumkin — sahifalar orasida sakrash yoʻqoladi.
⑥ Muddat yorliqlari: qizil — kechikdi, toʻq sariq — bugun/ertaga, kulrang — vaqt bor. Har birida matn bilan yozilgan.
⑦ Ijro tarixi panel pastida: kim, qachon, nimani oʻzgartirgani koʻrinadi — tortishuvli holatda dalil boʻladi.
⑧ Filtrlar (davr, manba, ustuvorlik, ijrochi) doska ustida bir qatorda — vazifa koʻp boʻlganda keraklisini tez topish uchun.
⑨ «Muddat soʻrash» tugmasi — muddatni uzaytirish ogʻzaki emas, rasmiy soʻrov orqali boʻladi.

### 4 · Ijro nazorati va qarzdorliklar — `Ijro.dc.html`

4-ekran · Ijro nazorati va qarzdorliklar

Bu ekran «nima kechikyapti va qancha vaqt qoldi?» savoliga javob beradi.

① Shaxsiy ijro intizomi foizi katta raqam bilan, yonida boʻlim oʻrtachasi — xodim oʻzini solishtira oladi, bu ichki motivatsiya beradi.
② Ogohlantirish bosqichlari: 3 kun → 1 kun → bugun → kechikdi. Har bosqichda nechta ish turgani va tizim nima qilishi (eslatma, pochta, rahbarga xabar) koʻrinadi. Xodim qoidani oldindan biladi.
③ Turkum yorliqlari: topshiriqlar, murojaatlar, hisobotlar, moliyaviy qarzdorlik — alohida, lekin bitta joyda (maketda bosiladi).

Davomi

④ Jadval shoshilinchlik boʻyicha avtomatik saralangan: eng kechikkani eng tepada. Xodim nimadan boshlashni oʻylab oʻtirmaydi.
⑤ «Qoldi» ustunida manfiy son (−2 kun) — «muddati oʻtgan» degan umumiy soʻzdan aniqroq.
⑥ Har qatorda ikki amal: «Bajarish» va «Muddat soʻrash» — eng koʻp kerak boʻladigan harakatlar qatorning oʻzida.
⑦ Oʻngda AI tavsiyasi: muddat va muhimlikdan kelib chiqib, qaysi ishni birinchi qilishni taklif qiladi. Bu maslahat, qaror xodimda qoladi.
⑧ Murojaatlar uchun qonuniy muddat sanogʻi alohida — fuqarolar murojaatida kechikish javobgarlikka olib keladi.

### 5 · Hujjatlar va imzolash — `Hujjatlar.dc.html`

5-ekran · Hujjatlar va imzolash

Pochta dasturlaridan koʻnikilgan uch ustunli tuzilma: papkalar → roʻyxat → hujjatning oʻzi. Xodim yangi narsa oʻrganmaydi.

① Chap ustun — papkalar va sonlar. «Imzo kutmoqda» alohida papka, chunki bu eng koʻp kutilayotgan harakat.
② Oʻrta ustun — roʻyxat: oʻqilmaganlar qalin shrift va nuqta bilan, muddat yorligʻi bilan. Hujjat tanlansa, oʻngda darhol ochiladi (maketda bosib koʻring).
③ Hujjat sarlavhasida rasmiy rekvizitlar: raqam, sana, yuboruvchi, muddat — kanselyariya talablariga mos.

Davomi

④ Harakatlar paneli hujjat tepasida — uzun hujjatni oxirigacha aylantirmasdan imzolash mumkin.
⑤ «E-IMZO bilan imzolash» — yagona koʻk asosiy tugma. Kelishish, yoʻnaltirish, rad etish — ikkinchi darajali; xato bosib qoʻyish xavfi kamayadi.
⑥ Rezolyutsiya hujjat matnidan oldin — ijrochi uchun eng muhimi rahbar nima deb yozgani.
⑦ AI qisqa mazmuni: koʻp betli hujjatning 3 qatorlik mazmuni. Toʻliq matn doim pastda turadi.
⑧ Kelishuv yoʻli: hujjat kimlardan oʻtgani va hozir kimda turgani — «hujjat qayerda qoldi?» degan qoʻngʻiroqlar kamayadi.

### 6 · Ilovalar va xizmatlar — `Xizmatlar.dc.html`

6-ekran · Ilovalar va xizmatlar

Barcha tizim, sayt va xizmatlar bitta «doʻkon» kabi joyda.

① Mening ilovalarim — eng koʻp ishlatiladigan tizimlar. «SSO» belgisi — parolsiz ochiladi. Lavozimga qarab admin avtomatik qoʻshadi, xodim oʻzi ham qoʻshadi.
② Davlat portallari va tashqi saytlar alohida guruhda — ichki tizim bilan tashqi sayt aralashmaydi; tashqi havolalarda «tashqi sayt» belgisi bor.
③ Kadrlar xizmatlari: taʼtil qoldigʻi, ish haqi varaqasi, davomat, maʼlumotnoma, malaka oshirish — kadrlar boʻlimiga borish shart emas. Har kartada bitta asosiy raqam va bitta harakat tugmasi.

Davomi

④ Ofis xizmatlari: majlislar zali, xizmat avtomobili, IT yordam, mehmon ruxsatnomasi — qogʻoz ariza oʻrniga bir bosish.
⑤ Ijtimoiy tarmoqlar: tashkilotning rasmiy sahifalari va haftalik oʻsish. PR va rahbariyat uchun foydali; oddiy xodim uchun admin yoqib-oʻchiradi.
⑥ Guruhlar tartibi foydalanish chastotasiga koʻra: kundalik → haftalik → oylik. Eng koʻp keraklisi eng yuqorida.

### 7 · Rahbar paneli — `Rahbar.dc.html`

7-ekran · Rahbar paneli

Faqat rahbar lavozimidagilarga koʻrinadi (rolga asoslangan kirish).

① Yuqoridagi 4 koʻrsatkich — boʻlimning «salomatlik holati»: ijro intizomi, kechikkan topshiriqlar, davomat, oʻrtacha bajarilish muddati. Har birida oʻtgan oyga nisbatan farq.
② Ijro intizomi dinamikasi: 6 oylik ustunli diagramma va 90% maqsad chizigʻi — vaziyat yaxshilanyaptimi, bir qarashda.
③ Boʻlimlar reytingi: raqam yonida chiziqli koʻrsatkich — jadvalni oʻqimasdan ham kim oldinda ekani koʻrinadi.

Davomi

④ Xodimlar yuklamasi: kim ortiqcha band, kim boʻsh. Yangi topshiriq berishdan oldin rahbar shu yerga qaraydi — ish adolatli taqsimlanadi.
⑤ Kechikayotgan topshiriqlar — rahbar aralashuvi kerak boʻlgan joylar. «Eslatish» tugmasi ijrochiga bildirishnoma yuboradi.
⑥ «Hisobotni yuklab olish» tepada: yigʻilishga PDF yoki Excel bir bosishda.

Muhim: bu panel qaror qabul qilish uchun, xodimni kuzatish uchun emas. Ish haqi, kasallik kabi shaxsiy maʼlumotlar bu yerda koʻrsatilmaydi.

### 8 · Mobil ilova (1-variant, tarixiy — yakuniysi: `UX_Telefon.dc.html`)

8-ekran · Mobil ilova

Mobil versiya desktopning nusxasi emas — u «yoʻlda tez qaror» uchun.

① Pastki menyu bosh barmoq yetadigan joyda: Bosh, Vazifalar, Hujjatlar, Xizmatlar, Profil.
② Yuqorida faqat eng muhimi: kun xulosasi va kechikkan ishlar.
③ «Imzo kutmoqda» kartasi — rahbar yigʻilishda yoki safarda boʻlsa ham telefonda mobil E-IMZO orqali imzolay oladi.
④ Murakkab ishlar (hisobot, katta jadval) desktopda qoladi — telefon ekrani ortiqcha yuklanmaydi.

### 9 · Ichki brauzer — yangi tab — `Brauzer_Start.dc.html`

9-ekran · Ichki brauzer — yangi tab

Brauzer ochilganda yoki yangi tab ochilganda shu sahifa chiqadi.

① Brauzer rejimida yuqori panel oʻrniga tablar va manzil satri turadi — sahifaga maksimal joy.
② Markazda katta qidiruv satri: Google'da qidirish yoki sayt manzili. Tashkilot ichidan qidirish ham shu yerda (almashtirgich).
③ «Tarmoqlar va messenjerlar» — kundalik ishlatiladigan 8 ta ilova. Raqam — oʻqilmagan xabarlar.
④ «Ish saytlari» — davlat portallari va tashkilot saytlari.
⑤ Oxirgi ochilganlar va yuklab olinganlar — davom ettirish uchun.

Nega aynan shunday

• Xodim tashqi brauzerga chiqmaydi: hamma narsa bitta oynada, ish va muloqot yonma-yon.
• Plitkalar katta (bosish oson) va har biri oʻz rangida — 1 soniyada topiladi.
• Plitkalar roʻyxatini xodim oʻzi sozlaydi; admin esa ruxsat etilgan saytlar roʻyxatini belgilaydi.
• Maketda plitkani bosing — 10-ekrandagi brauzerga oʻtadi.

Yangi chap menyu tuzilmasi (9–11-ekranlar)

Avval chap menyuning deyarli hammasi hujjat aylanishi boʻlimlari edi: Vazifalar, Ijro nazorati, Hujjatlar. Endi menyu uch guruhga ajratildi:

① ASOSIY — Bosh sahifa, Vazifalarim (shaxsiy to-do), Kalendar, Brauzer.
② MODULLAR — Hujjat aylanishi bitta qator boʻlib qoldi. Hujjatlar, ijro nazorati va topshiriqlar uning ichida. Kadrlar xizmatlari va Rahbar paneli ham alohida modul.
③ TARMOQLAR VA MESSENJERLAR — Telegram, WhatsApp, Instagram, Facebook, YouTube. Har biri ichki brauzerda ochiladi, yonida oʻqilmagan xabarlar soni.

Modullarni admin lavozimga qarab yoqadi: hujjat bilan ishlamaydigan xodimda bu qator umuman koʻrinmaydi.

### 10 · Ichki brauzer — tarmoqlar va messenjerlar — `Brauzer.dc.html`

10-ekran · Ichki brauzer — tarmoqlar va messenjerlar

Desktop toʻliq brauzer vazifasini bajaradi: YouTube, Telegram, Instagram, WhatsApp, Google va boshqa saytlar shu oyna ichida ochiladi.

① Tablar — har bir sayt alohida tabda, ikonka va nom bilan. Yopish, yangi tab (+).
② Manzil satri: ortga, oldinga, yangilash, xavfsiz ulanish belgisi, sevimlilarga qoʻshish.
③ Oʻng tomonda: «Rasm ichida rasm» (video kichik oynada qoladi), «Yonma-yon» (ikki sayt yoki sayt + vazifalar), yuklab olinganlar.
④ Chap menyudagi tarmoq bosilsa, uning tabi ochiladi yoki faollashadi.

Play rejimida sinab koʻring

Tablarni yoki chap menyudagi Telegram, WhatsApp, Instagram, YouTube'ni bosing — kontent almashadi.

Texnik tomoni
• Ichida haqiqiy brauzer dvigateli (Chromium yoki WebView2) — saytlar oddiy brauzerdagidek ishlaydi, kirish bir marta.
• Telegram, WhatsApp, Instagram ularning rasmiy veb-versiyalari orqali ochiladi; maketda ular sxematik koʻrsatilgan.
• Har bir sayt alohida konteynerda: cookie va sessiyalar ajratilgan.
• Fon rejimida ham bildirishnomalar keladi — xabar menyudagi raqamda koʻrinadi.
• Admin saytlar ruxsat roʻyxatini va «tashqi brauzerda ochish» huquqini boshqaradi.

### 11 · Hujjat aylanishi — alohida modul — `EDO_Modul.dc.html`

11-ekran · Hujjat aylanishi — alohida modul

Hujjat aylanishi endi chap menyuda bitta qator. Bosilganda modul oʻz ichki menyusi bilan ochiladi.

① Modul sarlavhasi va ichki yorliqlar: Umumiy · Hujjatlar · Ijro nazorati · Topshiriqlar · Hisobotlar. Avvalgi 3–5-ekranlar shu yorliqlar ichiga oʻtadi (maketda «Hujjatlar» va «Ijro nazorati» yorliqlari ularga olib boradi).
② Umumiy koʻrinish: 4 ta koʻrsatkich — imzo kutmoqda, kiruvchi, kelishuvda, muddati oʻtgan.
③ Imzo kutayotgan hujjatlar va yaqin ijro muddatlari — eng koʻp kerak boʻladigan ikki roʻyxat.

Nega alohida modul

• Asosiy ekran yengillashadi — u faqat hujjat aylanishiga bogʻliq boʻlib qolmaydi.
• Modulni mustaqil yangilash, boshqa tashkilotga alohida berish yoki boshqa tizim (Didox, ijro tizimi) bilan almashtirish mumkin — servis sifatida ulanadi.
• Bosh sahifaga moduldan faqat qisqa signal chiqadi: «Imzo kutmoqda: 4», «Muddati oʻtgan: 2».
• Tezkor amallar oʻng yuqorida: yangi hujjat, shablonlar, E-IMZO.
