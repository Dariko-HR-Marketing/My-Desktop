# Tezlik byudjeti — oʻlchov natijalari

Oʻlchangan: 2026-10-28, bu bulutli muhitda (Linux, WebKitGTK 4.1, Xvfb, **dasturiy render**, GPU yoʻq). Windows (WebView2) da natijalar farq qiladi — quyidagi qiymatlar yuqori chegara emas, balki ishlayotganini tasdiqlovchi yoʻl-yoʻriq. `release-desktop.yml` qurgach Windows oʻrnatmasini shu jadval uchun qayta oʻlchang.

| Koʻrsatkich (docs/01 §6) | Maqsad | Natija | Holat |
|---|---|---|---|
| Oyna ochilishi (agent fonda) | ≤ 1,5 s | **1,0–1,2 s** — jarayon boshlanishidan kirish sahifasi chizilguncha (1 ta piksel navbat bilan tekshirilgan, 3+2 marta) | ✅ |
| Xotira (boʻsh holat, brauzer tablarisiz) | ≤ 250 MB | **≈ 217 MB** PSS: ilova 70 + WebKit veb-jarayon + tarmoq jarayoni | ✅ |
| Oʻrnatma hajmi | ≤ 20 MB | ilova fayli **7,2 MB** (gzip 3,3 MB) + interfeys **0,85 MB**; oʻrnatma (`.msi`/`.deb`) taxminan 4–8 MB | 🟡 Windows oʻrnatmasi qurilgach tasdiqlanadi |
| Bosh sahifa birinchi koʻrinishi | ≤ 1 s (keshdan) | keshdan darhol chiziladi (skelet → keshdagi maʼlumot), alohida oʻlchanmagan | 🟡 |
| API javobi (p95) | ≤ 300 ms | alohida yuk sinovi oʻtkazilmagan | 🟡 |
| Real vaqt xabari | ≤ 2 s | testda xabar yuborilgandan keyin odatda < 100 ms | ✅ |

## Interfeys hajmi (`npm run build`)

- `index` JS: ≈ 400 kB (gzip ≈ 130 kB); `EdoModule` (lazy) ≈ 25 kB (gzip 7,7 kB) — modul faqat ochilganda yuklanadi.
- Shriftlar: IBM Plex Sans (lotin + kirill) va Mono, faqat kerakli qalinliklar; ular `woff2` va `woff` koʻrinishida ikki marta qadoqlanadi (≈ 0,5 MB). Zarur boʻlsa `woff` ni olib tashlash mumkin: WebView2 va WebKit `woff2` ni qoʻllaydi.

## Qanday takrorlash

```bash
npm run build
cd apps/desktop/src-tauri
cargo build --release --features tauri/custom-protocol   # profil: opt-level "s", LTO, strip, panic=abort
ls -l target/release/ish-maydoni
```

Xotira va birinchi chizish: ilovani `xvfb-run` ostida ishga tushirib, `/proc/<pid>/smaps_rollup` dagi `Pss` ni (ilova, `WebKitWebProcess`, `WebKitNetworkProcess`) yigʻing; kirish sahifasining chap paneli (`#111827`) paydo boʻlish vaqtini 100 ms qadam bilan skrinshot piksel tekshiruvi orqali oling.

## Ishlatilgan usullar

Keshdan darhol koʻrsatish + fonda yangilash; vidjetlar alohida va xato boʻlsa ham sahifa ishlaydi; modul kodi lazy; uxlaydigan tablar (standart 10 daqiqa, Sozlamalarda oʻzgaradi; Telegram/WhatsApp uxlamaydi); `prefers-reduced-motion` hurmat qilinadi; release profil: LTO va `strip`.
