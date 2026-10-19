FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY public/ ./public/

ENV NODE_ENV=production
# Render inyecta PORT. OJITO_DB solo se usa sin Turso.
EXPOSE 3000

CMD ["node", "src/server.js"]
