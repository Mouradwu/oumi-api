# ============================================================================
# Dockerfile - OUMI API (NestJS)
#
# Utilise par docker-compose.yml pour le developpement local. Railway ne
# passe PAS par ce fichier : le service @oumi/api y est configure avec
# rootDirectory=apps/api et un build Railpack (npm install && npm run build),
# qui fonctionne independamment de ce Dockerfile. Les deux chemins de build
# sont maintenus a jour separement ; si vous changez les dependances de
# apps/api, verifiez les deux.
# ============================================================================

FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @oumi/api...

FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm --filter @oumi/api build

# pnpm deploy produit un dossier autonome (node_modules a plat, sans
# symlinks vers le store pnpm) - le plus fiable pour une image de
# production independante du reste du monorepo.
RUN pnpm --filter @oumi/api deploy --prod --legacy /deploy

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./package.json

EXPOSE 3000
CMD ["sh", "-c", "node dist/migrate.js && node dist/seeds/seed-wilayas.js && node dist/main.js"]
