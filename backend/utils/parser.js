/**
 * Utilidades para parsear el HTML y extraer información
 */

import { JSDOM } from 'jsdom';
import { Programa, Horario, Grupo, Materia, DatosCompletos } from '../models/index.js';

/**
 * Extrae la lista de facultades del script facultades.php
 * El script contiene un array JavaScript con las facultades usando new Option()
 * @param {string} scriptContent - Contenido del script facultades.php
 * @returns {Array<{value: string, label: string}>} Lista de facultades
 */
function extraerFacultades(scriptContent) {
  try {
    // El script contiene algo como:
    // o[0] = new Option('FACULTAD DE INGENIERÍA', '25');
    // o[1] = new Option('FACULTAD DE CIENCIAS', '3');
    
    const facultades = [];
    
    // Expresión regular para capturar las líneas con new Option
    // Formato: o[0] = new Option('nombre', 'valor');
    const regex = /o\[\d+\]\s*=\s*new Option\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
    
    let match;
    while ((match = regex.exec(scriptContent)) !== null) {
      facultades.push({
        value: match[2],  // El valor es el segundo parámetro
        label: match[1]   // El label es el primer parámetro
      });
    }
    
    return facultades;
    
  } catch (error) {
    throw new Error(`Error al parsear facultades: ${error.message}`);
  }
}

/**
 * Extrae la lista de programas del script programas.php
 * El script contiene un array JavaScript con los programas usando new Option()
 * @param {string} scriptContent - Contenido del script programas.php
 * @returns {Array<{value: string, label: string}>} Lista de programas
 */
function extraerProgramas(scriptContent) {
  try {
    // El script contiene algo como:
    // o[0] = new Option('[00527] BIOINGENIERÍA', '527');
    // o[1] = new Option('[70044] DOC ING ELECTRÓNICA Y COM', '70044');
    
    const programas = [];
    
    // Expresión regular para capturar las líneas con new Option
    // Formato: o[0] = new Option('[codigo] nombre', 'valor');
    const regex = /o\[\d+\s*\]\s*=\s*new Option\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
    
    let match;
    while ((match = regex.exec(scriptContent)) !== null) {
      programas.push({
        value: match[2],  // El valor es el segundo parámetro
        label: match[1]   // El label es el primer parámetro (incluye [codigo] nombre)
      });
    }
    
    return programas;
    
  } catch (error) {
    throw new Error(`Error al parsear programas: ${error.message}`);
  }
}

/**
 * Parsea el HTML completo de horarios y retorna un objeto DatosCompletos
 * @param {string} htmlContent - HTML con la tabla de horarios
 * @returns {DatosCompletos} Objeto con toda la información parseada
 */
function parsearHorariosHTML(htmlContent) {
  try {
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;
    
    // Extraer información general
    const info = extraerInfoGeneral(doc);
    
    // Extraer materias y grupos
    const materias = extraerMaterias(doc);
    
    // Crear el objeto DatosCompletos con los modelos
    return new DatosCompletos(
      info.facultad,
      info.programa,
      info.semestre,
      info.fecha,
      materias
    );
    
  } catch (error) {
    throw new Error(`Error al parsear HTML de horarios: ${error.message}`);
  }
}

/**
 * Extrae información general del documento (facultad, programa, semestre, fecha)
 * @param {Document} doc - Documento DOM
 * @returns {Object} Información general
 */
function extraerInfoGeneral(doc) {
  const tableCell = doc.querySelector('table#prtTb td[colspan="6"]');
  const text = tableCell?.textContent || '';

  const facultadMatch = text.match(/Facultad:\s*(.+?)(?:\n|<br>)/i);
  const programaMatch = text.match(/Programa:\s*\[(\d+)\]\s*(.+?)(?:\n|<br>)/i);
  const semestreMatch = text.match(/Semestre:\s*(\d+)/i);
  const fechaMatch = text.match(/Fecha:\s*(.+?)(?:\n|<br>)/i);

  return {
    facultad: facultadMatch ? facultadMatch[1].trim() : '',
    programa: new Programa(
      programaMatch ? programaMatch[1] : '',
      programaMatch ? programaMatch[2].trim() : ''
    ),
    semestre: semestreMatch ? semestreMatch[1] : '',
    fecha: fechaMatch ? fechaMatch[1].trim() : ''
  };
}

/**
 * Extrae todas las materias y sus grupos del documento
 * @param {Document} doc - Documento DOM
 * @returns {Materia[]} Array de materias
 */
function extraerMaterias(doc) {
  const rows = doc.querySelectorAll('table#prtTb tr');
  const materiasMap = new Map();

  // Saltamos el header (primeras filas)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    
    // Las filas de datos tienen 6 celdas
    if (cells.length !== 6) continue;

    const materiaText = cells[0].textContent.trim();
    const grupoNum = cells[1].textContent.trim();
    const cupoMaximo = parseInt(cells[2].textContent.trim());
    const cupoDisponible = parseInt(cells[3].textContent.trim());
    const horarioText = cells[4].textContent.trim();
    const profesor = cells[5].textContent.trim();

    // Extraer nombre y código de la materia
    const materiaMatch = materiaText.match(/(.+?)\s*\((\d+)\)/);
    if (!materiaMatch) continue;

    const nombreMateria = materiaMatch[1].trim();
    const codigoMateria = materiaMatch[2];

    // Parsear horarios
    const horarios = parsearHorarios(horarioText);

    // Crear objeto grupo usando el modelo
    const grupo = new Grupo(
      parseInt(grupoNum) || grupoNum,
      cupoMaximo,
      cupoDisponible,
      horarios,
      profesor || null
    );

    // Agregar a la materia correspondiente
    if (!materiasMap.has(codigoMateria)) {
      materiasMap.set(codigoMateria, new Materia(
        codigoMateria,
        nombreMateria,
        []
      ));
    }

    materiasMap.get(codigoMateria).grupos.push(grupo);
  }

  return Array.from(materiasMap.values());
}

/**
 * Parsea el texto de horarios que puede tener varios formatos:
 * - "MJ6-8" -> Martes y Jueves de 6 a 8
 * - "19314 MJ6-8" -> Aula 19314, Martes y Jueves de 6 a 8
 * - "INGENIA M12-14; 19213 J10-12; 20238 L14-16" -> Múltiples horarios con ;
 * - "19207 W8-10 J10-12" -> Mismo salón, múltiples horarios sin ;
 * @param {string} horarioText - Texto con la información de horarios
 * @returns {Horario[]} Array de objetos Horario
 */
function parsearHorarios(horarioText) {
  if (!horarioText || horarioText.trim() === '') {
    return [];
  }

  const horarios = [];
  
  // Dividir por punto y coma para horarios múltiples
  const segmentos = horarioText.split(';').map(s => s.trim());

  for (const segmento of segmentos) {
    // Buscar TODOS los patrones de horario en el segmento
    // Puede haber: "19207 W8-10 J10-12" (mismo aula, múltiples horarios)
    // O simplemente: "W8-10" o "19207 W8-10"
    
    // Primero intentar extraer el aula/lugar del inicio (si existe)
    const aulaMatch = segmento.match(/^(\S+)\s+([LMWJVS])/);
    const aulaComun = aulaMatch ? aulaMatch[1] : null;
    
    // Buscar todos los patrones de día-hora en el segmento
    const patronHorario = /([LMWJVS]+)(\d+)-(\d+)/g;
    let match;
    
    while ((match = patronHorario.exec(segmento)) !== null) {
      const diasStr = match[1];
      const horaInicio = parseInt(match[2]);
      const horaFin = parseInt(match[3]);

      // Convertir string de días en array
      const dias = diasStr.split('').map(d => {
        const diasMap = {
          'L': 'Lunes',
          'M': 'Martes',
          'W': 'Miércoles',
          'J': 'Jueves',
          'V': 'Viernes',
          'S': 'Sábado'
        };
        return diasMap[d] || d;
      });

      // Crear objeto Horario usando el modelo
      horarios.push(new Horario(
        aulaComun,
        dias,
        diasStr,
        horaInicio,
        horaFin
      ));
    }
  }

  return horarios;
}

export {
  extraerFacultades,
  extraerProgramas,
  parsearHorariosHTML
};
