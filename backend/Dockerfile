# Stage di build (installa tutte le dipendenze e genera Prisma client)
FROM node:18-slim AS builder
WORKDIR /app

# Copia package-lock per npm ci (più riproducibile)
COPY package*.json ./

# Installa tutte le dipendenze (dev + prod)
RUN npm ci

# Copia il sorgente e prisma schema
COPY prisma ./prisma
COPY src ./src
COPY .env* ./

# Genera Prisma client (non richiede DB)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Stage finale (runtime snello)
FROM node:18-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Installo strumenti di utilità (bash, curl) necessari per wait-script e healthcheck
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash curl ca-certificates netcat \
  && rm -rf /var/lib/apt/lists/*

# Copio solo quello che serve dal builder (node_modules + prisma client + sorgente)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copia helper
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Cartelle runtime
RUN mkdir -p uploads logs

# Espongo porta
EXPOSE 3000

# Healthcheck: richiede curl (installato sopra)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Avvio: parametrico per Render (senza wait-for-it)
CMD ["node", "src/server.js"]
