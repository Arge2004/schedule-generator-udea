import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeHorarios, getFacultades, getProgramas } from './scraper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Middlewares
app.use(cors());
app.use(express.json());

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

/**
 * GET /api/facultades
 * Obtiene la lista de facultades disponibles
 */
app.get('/api/facultades', async (req, res) => {
  try {
    console.log('Obteniendo lista de facultades...');
    const facultades = await getFacultades();
    res.json({ success: true, data: facultades });
  } catch (error) {
    console.error('Error en /api/facultades:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/programas/:facultad
 * Obtiene la lista de programas para una facultad específica
 */
app.get('/api/programas/:facultad', async (req, res) => {
  try {
    const { facultad } = req.params;
    console.log(`Obteniendo programas para facultad: ${facultad}`);
    
    if (!facultad) {
      return res.status(400).json({ 
        success: false, 
        error: 'Facultad es requerida' 
      });
    }

    const programas = await getProgramas(facultad);
    res.json({ success: true, data: programas });
  } catch (error) {
    console.error('Error en /api/programas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/scrape-horarios
 * Realiza el scraping de horarios
 * Body: { facultad: string, programa: string }
 */
app.post('/api/scrape-horarios', async (req, res) => {
  try {
    const { facultad, programa } = req.body;

    console.log(`Iniciando scraping - Facultad: ${facultad}, Programa: ${programa}`);

    if (!facultad || !programa) {
      return res.status(400).json({ 
        success: false, 
        error: 'Facultad y programa son requeridos' 
      });
    }

    const html = await scrapeHorarios(facultad, programa);

    res.json({ 
      success: true, 
      data: { html },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en /api/scrape-horarios:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Servir archivos estáticos del frontend en producción
if (!isDevelopment) {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Fallback para SPA routing - cualquier ruta que no sea /api/* sirve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler para desarrollo (cuando frontend está en puerto separado)
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
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Modo: ${isDevelopment ? 'Desarrollo (API only)' : 'Producción (Monolito)'}`);
  console.log(`\nEndpoints API:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/facultades`);
  console.log(`  GET  /api/programas/:facultad`);
  console.log(`  POST /api/scrape-horarios`);
  if (!isDevelopment) {
    console.log(`\n🌐 Frontend: http://localhost:${PORT}`);
  }
  console.log();
});
