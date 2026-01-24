/**
 * Parsea el archivo HTML de la Universidad de Antioquia y extrae
 * la información de materias, grupos, cupos y horarios
 * @param {string} htmlContent - Contenido del archivo HTML
 * @returns {Object} Objeto JSON con la información parseada
 */
export function parseUniversidadHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extraer información general
  const info = extractGeneralInfo(doc);
  
  // Extraer materias y grupos
  const materias = extractMaterias(doc);

  return {
    ...info,
    materias
  };
}

/**
 * Extrae información general del documento (facultad, programa, semestre, fecha)
 */
function extractGeneralInfo(doc) {
  const tableCell = doc.querySelector('table#prtTb td[colspan="6"]');
  const text = tableCell?.textContent || '';

  const facultadMatch = text.match(/Facultad:\s*(.+?)(?:\n|<br>)/i);
  const programaMatch = text.match(/Programa:\s*\[(\d+)\]\s*(.+?)(?:\n|<br>)/i);
  const semestreMatch = text.match(/Semestre:\s*(\d+)/i);
  const fechaMatch = text.match(/Fecha:\s*(.+?)(?:\n|<br>)/i);

  return {
    facultad: facultadMatch ? facultadMatch[1].trim() : '',
    programa: {
      codigo: programaMatch ? programaMatch[1] : '',
      nombre: programaMatch ? programaMatch[2].trim() : ''
    },
    semestre: semestreMatch ? semestreMatch[1] : '',
    fecha: fechaMatch ? fechaMatch[1].trim() : ''
  };
}

/**
 * Extrae todas las materias y sus grupos
 */
function extractMaterias(doc) {
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
    const horarios = parseHorarios(horarioText);

    // Crear objeto grupo
    const grupo = {
      numero: parseInt(grupoNum) || grupoNum,
      cupoMaximo,
      cupoDisponible,
      horarios,
      profesor: profesor || null
    };

    // Agregar a la materia correspondiente
    if (!materiasMap.has(codigoMateria)) {
      materiasMap.set(codigoMateria, {
        nombre: nombreMateria,
        codigo: codigoMateria,
        grupos: []
      });
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
 */
function parseHorarios(horarioText) {
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

      horarios.push({
        aula: aulaComun,
        dias,
        diasAbrev: diasStr,
        horaInicio,
        horaFin
      });
    }
  }

  return horarios;
}

/**
 * Función auxiliar para cargar y parsear el archivo HTML desde un input file
 * @param {File} file - Archivo HTML
 * @returns {Promise<Object>} Promise que resuelve con el JSON parseado
 */
export async function parseHTMLFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const htmlContent = e.target.result;
        const result = parseUniversidadHTML(htmlContent);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    // Especificar la codificación windows-1252 (Latin-1) para caracteres con acento
    reader.readAsText(file, 'windows-1252');
  });
}

