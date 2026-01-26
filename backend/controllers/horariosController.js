/**
 * Controlador para manejar las peticiones relacionadas con horarios,
 * facultades y programas de la Universidad de Antioquia
 */

import * as horariosService from '../services/horariosService.js';
import * as generadorService from '../services/generadorService.js';

/**
 * Obtiene la lista de todas las facultades disponibles
 * GET /facultades
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 * 
 * Respuesta esperada:
 * [
 *   { value: "1", label: "Facultad de Ingeniería" },
 *   { value: "2", label: "Facultad de Ciencias" }
 * ]
 */
async function getFacultades(req, res) {
  try {
    const facultades = await horariosService.obtenerFacultades();
    
    res.status(200).json({
      success: true,
      data: facultades,
      message: 'Facultades obtenidas exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener las facultades',
      details: error.message
    });
  }
}

/**
 * Obtiene la lista de programas para una facultad específica
 * GET /programas/:facultad
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 * 
 * Parámetros:
 * - facultad (string): ID/valor de la facultad
 * 
 * Respuesta esperada:
 * [
 *   { value: "101", label: "Ingeniería de Sistemas" },
 *   { value: "102", label: "Ingeniería Civil" }
 * ]
 */
async function getProgramas(req, res) {
  try {
    const { facultad } = req.params;

    if (!facultad) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro facultad es requerido'
      });
    }

    const programas = await horariosService.obtenerProgramas(facultad);
    
    res.status(200).json({
      success: true,
      data: programas,
      message: 'Programas obtenidos exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener los programas',
      details: error.message
    });
  }
}



/**
 * Obtiene y parsea los horarios para un programa específico
 * GET /horarios/:facultad/:programa
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 * 
 * Parámetros:
 * - facultad (string): ID/valor de la facultad
 * - programa (string): ID/valor del programa
 * 
 * Respuesta esperada:
 * {
 *   facultad: "Ingeniería",
 *   programa: { codigo: "0123", nombre: "Ingeniería de Sistemas" },
 *   semestre: "2026-1",
 *   fecha: "2026-01-26",
 *   materias: [
 *     {
 *       codigo: "0808017",
 *       nombre: "Estructuras de Datos",
 *       grupos: [
 *         {
 *           numero: 1,
 *           cupoMaximo: 40,
 *           cupoDisponible: 15,
 *           horarios: [
 *             {
 *               aula: "19314",
 *               dias: ["Lunes", "Miércoles"],
 *               diasAbrev: "LW",
 *               horaInicio: 8,
 *               horaFin: 10
 *             }
 *           ],
 *           profesor: "Juan Pérez"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
async function getHorarios(req, res) {
  try {
    const { facultad, programa } = req.params;
    const { nombreFacultad, nombrePrograma } = req.query;

    if (!facultad || !programa) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros facultad y programa son requeridos'
      });
    }

    if (!nombreFacultad || !nombrePrograma) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros nombreFacultad y nombrePrograma son requeridos'
      });
    }
    
    const datosCompletos = await horariosService.obtenerHorarios(
      facultad,
      programa,
      nombreFacultad,
      nombrePrograma
    );
    
    res.status(200).json({
      success: true,
      data: datosCompletos.toJSON(),
      message: 'Horarios obtenidos exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener los horarios',
      details: error.message
    });
  }
}

async function generarHorarios(req, res) {
  try {
    const { materias, codigosSeleccionados, opciones } = req.body;

    if (!materias || !Array.isArray(materias)) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro materias es requerido y debe ser un array'
      });
    }

    if (!codigosSeleccionados || !Array.isArray(codigosSeleccionados)) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro codigosSeleccionados es requerido y debe ser un array'
      });
    }

    const horariosGenerados = generadorService.generarHorariosAutomaticos(
      materias,
      codigosSeleccionados,
      opciones || {}
    );

    res.json({
      success: true,
      data: horariosGenerados,
      message: `Se generaron ${horariosGenerados.length} horarios`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al generar horarios',
      details: error.message
    });
  }
}

export {
  getFacultades,
  getProgramas,
  getHorarios,
  generarHorarios
};
