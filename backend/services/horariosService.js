/**
 * Servicio para gestionar las operaciones de scraping y parsing de horarios
 */

import { cargarScriptFacultades, cargarScriptProgramas, obtenerHorariosHTML } from '../utils/scraper.js';
import { extraerFacultades, extraerProgramas, parsearHorariosHTML } from '../utils/parser.js';

/**
 * Obtiene la lista de todas las facultades disponibles
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
async function obtenerFacultades() {
  try {
    const scriptFacultades = await cargarScriptFacultades();
    const facultades = extraerFacultades(scriptFacultades);
    return facultades;
  } catch (error) {
    throw new Error(`Error al obtener facultades: ${error.message}`);
  }
}

/**
 * Obtiene la lista de programas para una facultad específica
 * @param {string} facultadId - ID de la facultad
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
async function obtenerProgramas(facultadId) {
  try {
    if (!facultadId) {
      throw new Error('El ID de facultad es requerido');
    }

    const scriptProgramas = await cargarScriptProgramas(facultadId);
    const programas = extraerProgramas(scriptProgramas);
    return programas;
  } catch (error) {
    throw new Error(`Error al obtener programas: ${error.message}`);
  }
}

/**
 * Obtiene y parsea los horarios de un programa específico
 * @param {string} facultadId - ID de la facultad
 * @param {string} programaId - ID del programa
 * @param {string} nombreFacultad - Nombre completo de la facultad
 * @param {string} nombrePrograma - Nombre completo del programa
 * @returns {Promise<DatosCompletos>} Objeto con todos los datos parseados
 */
async function obtenerHorarios(facultadId, programaId, nombreFacultad, nombrePrograma) {
  try {
    if (!facultadId || !programaId) {
      throw new Error('Los IDs de facultad y programa son requeridos');
    }

    // Obtener HTML con horarios
    const htmlHorarios = await obtenerHorariosHTML(
      facultadId,
      programaId,
      nombreFacultad,
      nombrePrograma
    );

    // Parsear el HTML y retornar DatosCompletos
    const datosCompletos = parsearHorariosHTML(htmlHorarios);
    
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
