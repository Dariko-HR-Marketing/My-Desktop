# Build context: repository root (see deploy/docker-compose.yml).
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/server apps/server
# The lockfile covers every workspace; only the desktop manifest is needed for `npm ci` to resolve it.
COPY apps/desktop/package.json apps/desktop/package.json
RUN npm ci --workspace @ish-maydoni/shared --workspace @ish-maydoni/server \
 && npm run build -w @ish-maydoni/shared \
 && npx -w @ish-maydoni/server prisma generate \
 && npm run build -w @ish-maydoni/server

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini && rm -rf /var/lib/apt/lists/*
# Prisma CLI and tsx (migrations, seed) are dev dependencies, so node_modules is copied whole.
COPY --from=build --chown=node:node /app /app
COPY --chown=node:node apps/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER node
WORKDIR /app/apps/server
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
