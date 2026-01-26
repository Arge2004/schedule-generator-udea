# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=256

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000

CMD ["node", "app.js"]