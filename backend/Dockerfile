# Etapa 1: Build
# Usamos la imagen oficial de Node 20 Alpine (más liviana)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos primero solo los package files para aprovechar el cache de Docker
# Si el código cambia pero las dependencias no, esta capa no se rebuildeará
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production=false

# Copiamos el código fuente y compilamos TypeScript
COPY src/ ./src/
RUN npm run build

# ---

# Etapa 2: Producción
# Imagen final liviana, sin herramientas de desarrollo
FROM node:20-alpine AS production

WORKDIR /app

# Solo copiamos las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiamos el código compilado de la etapa anterior
COPY --from=builder /app/dist ./dist

# Cloud Run inyecta el puerto via variable de entorno PORT
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]