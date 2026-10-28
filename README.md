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
