# 09 · Qabul mezonlari

Har bir band bajarilgani tekshirilib, belgilanadi.

## Umumiy (har bosqichda)
- [ ] `npm run typecheck`, `npm test`, `npm run build` xatosiz
- [ ] `cargo check` (src-tauri) xatosiz
- [ ] CI yashil
- [ ] Repozitoriyda parol, kalit, `.env` yoʻq

## Server
- [ ] `DATA_STORE=memory` bilan serverni ishga tushirib `xodim / demo12345` bilan kirish mumkin
- [ ] Notoʻgʻri parol → 401, «Login yoki parol notoʻgʻri»; 10+ urinish/daqiqa → 429
- [ ] Tokensiz himoyalangan endpoint → 401
- [ ] Vazifa: yaratish (201), `DONE` → `completedAt` qoʻyiladi, oʻchirish (204), boʻsh sarlavha → 400
- [ ] Xodim bildirishnoma yubora olmaydi (403); rahbar yubora oladi va u WebSocket orqali ≤ 2 s da keladi
- [ ] `/api/catalog/modules` — xodimga «Rahbar paneli» qaytmaydi
- [ ] Valyuta: USD, EUR, RUB…; tashqi manba oʻchsa — oxirgi qiymat `stale: true`
- [ ] Docker: `docker compose up -d --build` → `https://vps12546.eskiz.uz/health` = `ok`, HTTPS sertifikati haqiqiy

## Desktop — qobiq va adaptivlik
- [ ] Chap menyu: 3 guruh, modul bitta qator, tarmoqlar yigʻiladi, yigʻish tugmasi 248 ↔ 72 px
- [ ] Oyna kengligi 1440 / 1100 / 800 / 390 da docs/03 (5-boʻlim) qoidalari bajariladi; gorizontal scroll yoʻq
- [ ] Tungi, yorugʻ, tizim temasi; Ixcham zichlik — hamma ekranda
- [ ] Klaviatura bilan butun interfeys boshqariladi, fokus koʻrinadi
- [ ] Har bir blokda skelet, boʻsh, xato/oflayn holatlari bor

## Bosh sahifa
- [ ] Salomlashuv vaqtga mos, xulosa jumlasidagi raqamlar haqiqiy
- [ ] 5 koʻrsatkich; muddati oʻtgan — qizil; «Imzo kutmoqda» moduldan
- [ ] Vazifani belgilash darhol aks etadi, server xatosida qaytadi
- [ ] Valyuta va ob-havoda «yangilandi HH:MM»
- [ ] Internet uzilsa — oflayn tasma, oxirgi maʼlumot koʻrinadi; qaytganda oʻzi yangilanadi

## Vazifalar
- [ ] «ertaga 10:00 hisobot !yuqori @Karimov #ishreja» → toʻgʻri sana, vaqt, muhimlik, ijrochi, roʻyxat
- [ ] quickAdd unit testlari (≥ 6 holat) oʻtadi
- [ ] Kechagi bajarilmagan ish «Kechikkan» boʻlimida
- [ ] Oflayn qoʻshilgan vazifa internet qaytganda serverga tushadi

## Ichki brauzer
- [ ] Telegram, WhatsApp (QR), Instagram, YouTube, Google, Lex.uz dastur ichida ochiladi va ishlaydi
- [ ] Dastur qayta ochilganda Telegram/WhatsApp'ga qayta kirish shart emas
- [ ] Tablar: yangi, yopish, guruh, uxlash (10 daqiqa) va tiklash; Ctrl+T / Ctrl+W / Ctrl+L
- [ ] Manzilga soʻz yozilsa — Google qidiruv
- [ ] `file:`, `javascript:` va boshqa sxemalar ochilmaydi
- [ ] Sayt sahifasidan Tauri buyruqlarini chaqirib boʻlmaydi
- [ ] Oʻqilmaganlar soni menyuda (sarlavhadan)
- [ ] Brauzer sahifasidan chiqilganda webview'lar yashirinadi, oyna oʻlchami oʻzgarsa toʻgʻri joylashadi

## Bildirishnomalar, qidiruv, sozlamalar
- [ ] Drawer: yorliqlar, guruhlar, amal tugmasi, «Hammasini oʻqildi», Esc yopadi
- [ ] Ctrl+K: turkumlar, ↑↓/Enter/Tab/Esc; «vazifa yaratish» ishlaydi; Google → brauzer tabi
- [ ] Sozlamalar oʻzgarishi boshqa ochiq oynada ham darhol aks etadi
- [ ] Autostart yoqilsa — kompyuter qayta yoqilganda dastur ochiladi; ikkinchi nusxa ochilmaydi (birinchisi oldinga chiqadi)

## Hujjat aylanishi moduli
- [ ] Menyuda bitta qator; ichida 5 yorliq
- [ ] Bosh sahifadagi signal → tegishli yorliq
- [ ] Ruxsat yoʻq rol uchun «Ruxsat yoʻq» holati

## Tezlik
- [ ] Oyna ochilishi ≤ 1,5 s; bosh sahifa ≤ 1 s (keshdan)
- [ ] Boʻsh holatda xotira ≤ 250 MB
- [ ] Windows oʻrnatma ≤ 20 MB
