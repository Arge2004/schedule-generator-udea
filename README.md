# Generador de Horarios UdeA

Aplicación web para generar horarios automáticos de la Universidad de Antioquia mediante web scraping.

## 🚀 Inicio Rápido

### Desarrollo (Frontend y Backend separados)

```bash
# Instalar dependencias
npm run install:all

# Modo desarrollo (ambos servidores)
npm run dev

# O ejecutar por separado:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

### Producción (Monolito)

```bash
# Build y deploy
npm run deploy

# O paso por paso:
npm run build  # Compila frontend
npm start      # Inicia servidor en http://localhost:3001
```

## 📁 Estructura

```
/
├── frontend/        # React + Vite
│   ├── src/
│   └── dist/        # Build de producción
├── backend/         # Express + Playwright
│   ├── server.js
│   └── scraper.js
└── package.json     # Scripts principales
```

## 🛠️ Tecnologías

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Express, Playwright
- **Scraping:** Playwright (headless Chrome)

## 📝 Variables de Entorno

### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
# Desarrollo
VITE_API_URL=http://localhost:3001

# Producción (usa .env.production)
VITE_API_URL=
```

## 🌐 Endpoints API

- `GET /api/health` - Health check
- `GET /api/facultades` - Lista de facultades
- `GET /api/programas/:facultad` - Programas por facultad
- `POST /api/scrape-horarios` - Scraping de horarios

## 📦 Despliegue

En producción, el backend sirve el frontend compilado en `/dist`.
Todo funciona desde un solo puerto (3001 por defecto).

## 🔧 Desarrollo

- Frontend hot reload en puerto 5173
- Backend API en puerto 3001
- CORS habilitado para desarrollo
