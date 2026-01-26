/**
 * Rutas para gestión de horarios, facultades y programas
 */

import express from 'express';
import * as horariosController from '../controllers/horariosController.js';

const router = express.Router();

/**
 * GET /facultades
 * Obtiene la lista de todas las facultades disponibles
 */
router.get('/facultades', horariosController.getFacultades);

/**
 * GET /programas/:facultad
 * Obtiene la lista de programas para una facultad específica
 */
router.get('/programas/:facultad', horariosController.getProgramas);

/**
 * GET /horarios/:facultad/:programa
 * Obtiene y parsea los horarios para un programa específico
 * Query params: nombreFacultad, nombrePrograma
 */
router.get('/horarios/:facultad/:programa', horariosController.getHorarios);


export default router;
