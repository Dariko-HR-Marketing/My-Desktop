# 04 · Dizayn tizimi

Barcha qiymatlar manbasi: `docs/design-tokens.json`. Kodda — faqat CSS oʻzgaruvchilari (`var(--accent)`), qattiq yozilgan rang yoʻq.

## 1. Tamoyillar

1. **Ierarxiya:** eng muhim maʼlumot yuqori-chapda (kun xulosasi, kechikkanlar).
2. **Rang = maʼno:** qizil — kechikkan; toʻq sariq — muddati yaqin/bugun; yashil — bajarilgan; koʻk — harakat, tanlangan, maʼlumot. Rang yonida doim matn.
3. **Bitta asosiy tugma** ekran yoki blokda (koʻk, toʻla); qolganlari — ikkinchi darajali (oq, chegarali) yoki matnli.
4. **Zichlik** ikki rejimda: Qulay (44 px) va Ixcham (36 px).
5. **Tungi rejim** — faqat tokenlar almashadi; maket va joylashuv oʻzgarmaydi.

## 2. Tokenlarni CSS ga oʻtkazish

```css
:root {                     /* light */
  --bg: #F3F4F6; --surface: #FFFFFF; --text: #15171C; --accent: #1D4ED8; /* … */
  --control-h: 44px; --row-h: 52px; --nav-item-h: 40px;
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
}
:root[data-theme='dark'] { --bg: #14161B; /* … color.dark */ }
@media (prefers-color-scheme: dark) { :root[data-theme='system'] { /* … color.dark */ } }
:root[data-density='compact'] { --control-h: 36px; --row-h: 40px; --nav-item-h: 36px; }
```

## 3. Tipografiya

| Token | Oʻlcham / qalinlik | Ishlatilishi |
|---|---|---|
| display | 28 / 600 | Sahifa salomlashuvi, katta sarlavha |
| title | 20 / 600 | Panel/oyna sarlavhasi |
| section | 17 / 600 | Karta sarlavhasi |
| body | 14 / 400 | Asosiy matn, qatorlar |
| caption | 12 / 500 | Izoh, metamaʼlumot |
| overline | 11 / 600, katta harf, .08em | Menyu guruhlari, boʻlim belgilari |
| kpi | 28 / 600 | Koʻrsatkich raqami |

Vaqt, sana raqamlari, kurslar — `--font-mono` (IBM Plex Mono). Shrift kirill va `oʻ gʻ ʼ` ni toʻgʻri koʻrsatadi.

## 4. Komponentlar

| Komponent | Spetsifikatsiya |
|---|---|
| **Button** | Variantlar: `primary` (fon accent, matn onAccent), `secondary` (oq, 1 px borderStrong), `ghost`, `danger-ghost`. Balandlik `--control-h`, radius 10, padding 0 16, 14/600. Ikonka 18 px, gap 8. |
| **IconButton** | 44×44 (ixcham 36), radius 10, `aria-label` majburiy. Belgi (badge) yuqori-oʻng burchakda. |
| **Badge (son)** | min 18–22 px, radius pill, 11–12/600–700. Turlar: neutral (navActive fonda), danger (dangerSolid, oq). |
| **Chip (holat)** | Balandlik 24, radius 12, 12/600. danger / warning / success / info / neutral — har biri «Soft» fon + asosiy rang matn. |
| **Card** | Fon surface, 1 px border, radius 12, padding 18–20. Sarlavha (section) + «Hammasi →» havolasi oʻngda. |
| **Kpi** | Card ichida: yorliq (13/500 textSecondary), raqam (kpi), ostida izoh yoki progress (6 px, radius 3). |
| **TaskRow** | Balandlik `--row-h`; katakcha 18 px (accent-color); sarlavha 14/500 + manba 12; oʻngda vaqt (mono) va holat chip. Bajarilgan: chizilgan, textMuted. |
| **AppTile** | Rangli kvadrat (24 menyuda / 36 roʻyxatda / 48–52 plitkada), radius 7/10/14–16, ichida oq ikonka. Qizil son burchakda. |
| **Tabs (yorliqlar)** | Balandlik 40–48, faol — 600 + pastda 2 px accent chiziq; son — kichik chip. |
| **Switch** | 44×26, `role="switch"`, `aria-checked`; yoqilgan — accent. |
| **Drawer** | Oʻngdan, 440 px, shadow.drawer, orqa fon overlay, fokus tuzogʻi, Esc yopadi. |
| **Dialog / Palette** | Markazda, 640 px, radius 14, shadow.dialog. |
| **Skeleton** | Fon skeleton, radius 4–10; animatsiya — yengil «toʻlqin», reduced-motion da yoʻq. |
| **EmptyState** | 64 px doira ikonka, sarlavha 18/600, izoh 14, 1–2 tugma. |
| **Banner (oflayn/xato)** | Toʻliq kenglik, 44 px, warningSoft/dangerSoft fon, ikonka + matn + amal. |
| **Tooltip** | Toʻq fon (#15171C), oq matn 12/500, radius 7, 5×10 padding. |

## 5. Ikonkalar

`lucide-react`, qalinlik 1.8, oʻlcham 16–20. Tarmoqlar uchun umumiy belgilar ishlatiladi (masalan, xabar pufagi, kamera, video). Haqiqiy ilovalarda rasmiy logotiplar faqat tegishli brendning foydalanish qoidalariga muvofiq qoʻyiladi — buni yuridik jihatdan tekshirish kerak.

## 6. Kirish qulayligi (WCAG 2.1 AA)

- Matn kontrasti ≥ 4.5:1 (katta matn ≥ 3:1) — ikkala temada tekshirilgan qiymatlar tokenlarda.
- Har bir interaktiv element klaviaturadan ishlaydi; fokus koʻrinadi (2 px focusRing, 2 px offset).
- Ikonka-tugmada `aria-label`; dekorativ SVG `aria-hidden`.
- Holat faqat rang bilan berilmaydi.
- `prefers-reduced-motion` hurmat qilinadi.
