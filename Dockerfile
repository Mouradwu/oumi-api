# Étape 1 : Build
FROM node:22-alpine AS builder

WORKDIR /app

# Installation de pnpm v9.4.0 (version stable recommandée pour NestJS)
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Compilation TypeScript
RUN pnpm --filter @oumi/api run build

# Étape 2 : Production
FROM node:22-alpine AS production

WORKDIR /app

# Installation de pnpm v9.4.0
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copie des dépendances de production uniquement
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod

# Copie du code compilé
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Variables d'environnement
ENV NODE_ENV=production
ENV API_PORT=3000

# Exposition du port
EXPOSE 3000

# Démarrage de l'application
CMD ["node", "apps/api/dist/main.js"]