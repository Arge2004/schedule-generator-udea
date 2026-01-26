/**
 * Servicio para gestionar las operaciones de scraping y parsing de horarios
 */

import { cargarScriptFacultades, cargarScriptProgramas, obtenerHorariosHTML } from '../utils/scraper.js';
import { extraerFacultades, extraerProgramas, parsearHorariosHTML } from '../utils/parser.js';
import * as cache from '../utils/cache.js';

const CACHE_TTL = {
  FACULTADES: 86400,  // 24 horas
  PROGRAMAS: 43200,   // 12 horas
  HORARIOS: 21600,    // 6 horas
};

async function obtenerFacultades() {
  try {
    const cacheKey = 'facultades';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const scriptFacultades = await cargarScriptFacultades();
    const facultades = extraerFacultades(scriptFacultades);
    
    await cache.set(cacheKey, facultades, CACHE_TTL.FACULTADES);
    
    return facultades;
  } catch (error) {
    throw new Error(`Error al obtener facultades: ${error.message}`);
  }
}

async function obtenerProgramas(facultadId) {
  try {
    if (!facultadId) {
      throw new Error('El ID de facultad es requerido');
    }

    const cacheKey = `programas:${facultadId}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const scriptProgramas = await cargarScriptProgramas(facultadId);
    const programas = extraerProgramas(scriptProgramas);
    
    await cache.set(cacheKey, programas, CACHE_TTL.PROGRAMAS);
    
    return programas;
  } catch (error) {
    throw new Error(`Error al obtener programas: ${error.message}`);
  }
}

async function obtenerHorarios(facultadId, programaId, nombreFacultad, nombrePrograma) {
  try {
    if (!facultadId || !programaId) {
      throw new Error('Los IDs de facultad y programa son requeridos');
    }

    const cacheKey = `horarios:${facultadId}:${programaId}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const htmlHorarios = await obtenerHorariosHTML(
      facultadId,
      programaId,
      nombreFacultad,
      nombrePrograma
    );

    const datosCompletos = parsearHorariosHTML(htmlHorarios);
    
    await cache.set(cacheKey, datosCompletos, CACHE_TTL.HORARIOS);
    
    return datosCompletos;
  } catch (error) {
    throw new Error(`Error al obtener horarios: ${error.message}`);
  }
}

/**
 * Parsea un HTML de horarios proporcionado directamente
 * @param {string} htmlContent - Contenido HTML
 * @returns {Promise<DatosCompletos>} Objeto con todos los datos parseados
 */
async function parsearHTML(htmlContent) {
  try {
    if (!htmlContent) {
      throw new Error('El contenido HTML es requerido');
    }

    const datosCompletos = parsearHorariosHTML(htmlContent);
    return datosCompletos;
  } catch (error) {
    throw new Error(`Error al parsear HTML: ${error.message}`);
  }
}

export {
  obtenerFacultades,
  obtenerProgramas,
  obtenerHorarios,
  parsearHTML
};
