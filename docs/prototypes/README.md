# Prototiplar — maketlarning manba fayllari

Bu fayllar dizayn muharriri formatida (`.dc.html`). Ular **alohida brauzerda ishga tushmaydi** (muharrirning ichki kutubxonasiga bogʻliq), lekin har bir elementning aniq rangi, oʻlchami, boʻshligʻi, shrifti va matni inline uslublarda yozilgan. Claude Code ulardan interfeysni aniq qurish uchun maʼlumotnoma sifatida foydalanadi.

O'qish bo'yicha eslatmalar:
- `{{...}}` — maʼlumot oʻrni; qiymatlari faylning pastidagi `renderVals()` funksiyasida (namuna maʼlumotlar, rang va uslub qatorlari).
- `<sc-for>` — roʻyxat (takrorlanuvchi element), `<sc-if>` — shartli koʻrsatish.
- SVG `path d="..."` — ikonkalar; haqiqiy kodda `lucide-react` ishlatiladi.

## Qaysi fayl nima

### `yakuniy/` — asosiy manba (ustuvor)
| Fayl | Ekran |
|---|---|
| `UX_Arxitektura.dc.html` | Axborot arxitekturasi diagrammasi |
| `UX_Adaptiv.dc.html` | 4 ta oʻlcham qoidalari va dizayn tokenlari |
| `UX_Desktop.dc.html` | Desktop — Bosh sahifa (yangi menyu, yigʻish tugmasi) |
| `UX_Laptop_Brauzer.dc.html` | Noutbuk — ichki brauzer (ikonka menyu, tab guruhlari, uxlagan tab) |
| `UX_Planshet.dc.html` | Planshet — Bosh sahifa |
| `UX_Telefon.dc.html` | Telefon — Bosh sahifa (`dark` parametri bilan tungi rejim) |
| `UX_Telefon_Tun.dc.html` | Telefon — tungi rejim (yuqoridagini `dark=true` bilan chaqiradi) |
| `UX_Telefon_Brauzer.dc.html` | Telefon — ichki brauzer |
| `UX_Bildirishnoma.dc.html` | Bildirishnomalar markazi |
| `UX_Sozlamalar.dc.html` | Sozlamalar |
| `UX_Holatlar.dc.html` | Boʻsh, oflayn, yuklanish, ruxsat yoʻq holatlari |

### `brauzer/`
| `Brauzer_Start.dc.html` | Yangi tab sahifasi |
|---|---|
| `Brauzer.dc.html` | Brauzer toʻliq menyu bilan (YouTube, Telegram, Instagram, WhatsApp, Google tablari) |

### `modul-ekranlari/`
| Fayl | Ekran | Izoh |
|---|---|---|
| `Kirish.dc.html` | Kirish | |
| `EDO_Modul.dc.html` | Hujjat aylanishi — Umumiy | Yangi menyu bilan |
| `Hujjatlar.dc.html` | Modul → Hujjatlar | Eski menyu — faqat kontent qismini oling |
| `Ijro.dc.html` | Modul → Ijro nazorati | Eski menyu — faqat kontent qismini oling |
| `Vazifalar.dc.html` | Modul → Topshiriqlar (Kanban) va Vazifalarim | Eski menyu — faqat kontent qismini oling |
| `Xizmatlar.dc.html` | Kadrlar va ofis xizmatlari (2-bosqich) | Eski menyu |
| `Rahbar.dc.html` | Rahbar paneli (2-bosqich) | Eski menyu |

**Muhim:** «eski menyu» yozilgan ekranlarda chap menyu va yuqori panel eskirgan. Hamma joyda `yakuniy/UX_Desktop.dc.html` dagi menyu va qobiq ishlatiladi.
