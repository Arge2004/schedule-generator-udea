import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import horariosRoutes from './routes/horariosRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Rutas de la API
app.use('/api', horariosRoutes);

// Servir archivos estáticos del frontend en producción
if (!isDevelopment) {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Fallback para SPA routing - cualquier ruta que no sea /api/* sirve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler para desarrollo
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'Ruta no encontrada' 
    });
  });
}

// Error handler
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo...`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Modo: ${isDevelopment ? 'Desarrollo (API only)' : 'Producción'}`);
  if (!isDevelopment) {
    console.log(`\n🌐 Frontend: http://localhost:${PORT}`);
  }
});
