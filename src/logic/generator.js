
/**
 * Genera horarios automáticos optimizados basados en preferencias del usuario
 * @param {Array} todasLasMaterias - Array completo de todas las materias disponibles
 * @param {Array} codigosSeleccionados - Array de códigos de materias seleccionadas
 * @param {Object} opciones - Opciones de filtrado { horaMinima: number (6-22), evitarHuecos: boolean }
 * @returns {Array} Array de los mejores horarios (máximo 5), cada uno con sus grupos y puntuación
 */
export function generarHorariosAutomaticos(todasLasMaterias, codigosSeleccionados, opciones = {}) {
  const { horaMinima = 6, evitarHuecos = false } = opciones;

  // Filtrar solo las materias seleccionadas
  let materiasSeleccionadas = todasLasMaterias.filter(m => 
    codigosSeleccionados.includes(m.codigo)
  );

  if (materiasSeleccionadas.length === 0) {
    return [];
  }

  // Filtrar grupos que tengan clases antes de la hora mínima (optimización temprana)
  if (horaMinima > 6) {
    materiasSeleccionadas = materiasSeleccionadas.map(materia => ({
      ...materia,
      grupos: materia.grupos.filter(grupo => {
        // Verificar si todos los horarios del grupo empiezan después de la hora mínima
        return grupo.horarios.every(horario => horario.horaInicio >= horaMinima);
      })
    })).filter(materia => materia.grupos.length > 0);
  }

  if (materiasSeleccionadas.length === 0) {
    return []; // No hay grupos disponibles con la hora mínima especificada
  }

  // Generar combinaciones válidas con poda (backtracking inteligente)
  const combinacionesValidas = generarCombinacionesConPoda(materiasSeleccionadas, 500);

  if (combinacionesValidas.length === 0) {
    return [];
  }

  // Calcular puntuación para cada combinación válida
  const combinacionesConPuntuacion = combinacionesValidas.map(combinacion => ({
    grupos: combinacion,
    puntuacion: calcularPuntuacion(combinacion, horaMinima, evitarHuecos),
    detalles: obtenerDetallesCombinacion(combinacion)
  }));

  // Ordenar por puntuación (mayor es mejor) y retornar top 5
  combinacionesConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion);
  
  return combinacionesConPuntuacion.slice(0, 5);
}

/**
 * Genera combinaciones válidas con poda de backtracking
 * Solo genera combinaciones SIN conflictos, descartando ramas inválidas inmediatamente
 * @param {Array} materias - Materias seleccionadas
 * @param {number} maxCombinaciones - Número máximo de combinaciones válidas a generar
 */
function generarCombinacionesConPoda(materias, maxCombinaciones = 500) {
  const combinaciones = [];
  
  function backtrack(index, combinacionActual) {
    // Límite de combinaciones alcanzado
    if (combinaciones.length >= maxCombinaciones) {
      return;
    }

    // Caso base: hemos seleccionado un grupo de cada materia
    if (index === materias.length) {
      combinaciones.push([...combinacionActual]);
      return;
    }

    // Probar cada grupo de la materia actual
    const materiaActual = materias[index];
    for (const grupo of materiaActual.grupos) {
      // Solo considerar grupos con cupos disponibles Y con horarios definidos
      if (grupo.cupoDisponible > 0 && grupo.horarios && grupo.horarios.length > 0) {
        const nuevoGrupo = {
          codigoMateria: materiaActual.codigo,
          nombreMateria: materiaActual.nombre,
          numeroGrupo: grupo.numero,
          horarios: grupo.horarios,
          profesor: grupo.profesor,
          cupoDisponible: grupo.cupoDisponible
        };
        
        // PODA: Verificar conflictos ANTES de continuar el backtracking
        if (!tieneConflictoConCombinacionActual(nuevoGrupo, combinacionActual)) {
          combinacionActual.push(nuevoGrupo);
          backtrack(index + 1, combinacionActual);
          combinacionActual.pop();
        }
        // Si hay conflicto, esta rama se descarta completamente (poda)
      }
    }
  }

  backtrack(0, []);
  return combinaciones;
}

/**
 * Verifica si un nuevo grupo tiene conflictos con la combinación actual
 * Optimizado para detección temprana (early exit)
 */
function tieneConflictoConCombinacionActual(nuevoGrupo, combinacionActual) {
  for (const grupoExistente of combinacionActual) {
    for (const h1 of nuevoGrupo.horarios) {
      const diasH1Set = new Set(h1.dias);
      
      for (const h2 of grupoExistente.horarios) {
        // Verificar días en común
        const hayDiasComunes = h2.dias.some(dia => diasH1Set.has(dia));
        
        if (hayDiasComunes) {
          // Verificar solapamiento de horas
          if (!(h1.horaFin <= h2.horaInicio || h2.horaFin <= h1.horaInicio)) {
            return true; // Conflicto encontrado
          }
        }
      }
    }
  }
  return false;
}

/**
 * Calcula la puntuación de una combinación basada en las preferencias
 * Mayor puntuación = mejor horario
 */
function calcularPuntuacion(combinacion, horaMinima, evitarHuecos) {
  let puntuacion = 1000; // Puntuación base

  // Obtener todos los horarios de la combinación organizados por día
  const horariosPorDia = organizarHorariosPorDia(combinacion);

  // BONIFICACIÓN: Clases que empiezan más tarde son mejores (respecto a horaMinima)
  // Ya fueron filtradas las que empiezan antes de horaMinima, pero bonificamos las tardías
  let horaPromedioInicio = 0;
  let totalClases = 0;
  combinacion.forEach(grupo => {
    grupo.horarios.forEach(horario => {
      horaPromedioInicio += horario.horaInicio * horario.dias.length;
      totalClases += horario.dias.length;
    });
  });
  if (totalClases > 0) {
    horaPromedioInicio /= totalClases;
    // Bonificar horarios que empiecen más tarde (después de las 8 AM)
    if (horaPromedioInicio >= 10) {
      puntuacion += 40; // Bonus para horarios que empiezan después de las 10 AM
    } else if (horaPromedioInicio >= 8) {
      puntuacion += 20; // Bonus menor para horarios que empiezan después de las 8 AM
    }
  }

  // PENALIZACIÓN: Huecos extensos entre clases (>2 horas)
  if (evitarHuecos) {
    let totalHuecos = 0;
    
    Object.values(horariosPorDia).forEach(horariosDelDia => {
      if (horariosDelDia.length > 1) {
        // Ordenar por hora de inicio
        horariosDelDia.sort((a, b) => a.horaInicio - b.horaInicio);
        
        // Calcular huecos entre clases consecutivas
        for (let i = 0; i < horariosDelDia.length - 1; i++) {
          const hueco = horariosDelDia[i + 1].horaInicio - horariosDelDia[i].horaFin;
          
          if (hueco > 2) {
            totalHuecos += (hueco - 2); // Solo penalizar el tiempo extra después de 2 horas
          }
        }
      }
    });
    
    puntuacion -= totalHuecos * 20; // Penalización de 20 puntos por cada hora de hueco extra
  }

  // BONIFICACIÓN: Días completos libres
  const diasDeLaSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diasLibres = diasDeLaSemana.filter(dia => !horariosPorDia[dia] || horariosPorDia[dia].length === 0);
  puntuacion += diasLibres.length * 50; // Bonus de 50 puntos por día libre

  // BONIFICACIÓN: Horarios compactos (menor rango de horas por día)
  Object.values(horariosPorDia).forEach(horariosDelDia => {
    if (horariosDelDia.length > 0) {
      const horaMinima = Math.min(...horariosDelDia.map(h => h.horaInicio));
      const horaMaxima = Math.max(...horariosDelDia.map(h => h.horaFin));
      const rangoHoras = horaMaxima - horaMinima;
      
      // Bonificar horarios más compactos (menor rango)
      if (rangoHoras <= 4) {
        puntuacion += 30; // Horario muy compacto
      } else if (rangoHoras <= 6) {
        puntuacion += 15; // Horario medianamente compacto
      }
    }
  });

  return Math.round(puntuacion);
}

/**
 * Organiza todos los horarios de una combinación por día de la semana
 */
function organizarHorariosPorDia(combinacion) {
  const horariosPorDia = {};

  combinacion.forEach(grupo => {
    grupo.horarios.forEach(horario => {
      horario.dias.forEach(dia => {
        if (!horariosPorDia[dia]) {
          horariosPorDia[dia] = [];
        }
        horariosPorDia[dia].push({
          materia: grupo.nombreMateria,
          grupo: grupo.numeroGrupo,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          aula: horario.aula
        });
      });
    });
  });

  return horariosPorDia;
}

/**
 * Obtiene detalles adicionales de una combinación para mostrar al usuario
 */
function obtenerDetallesCombinacion(combinacion) {
  const horariosPorDia = organizarHorariosPorDia(combinacion);
  
  // Calcular estadísticas
  const diasConClases = Object.keys(horariosPorDia).filter(dia => 
    horariosPorDia[dia] && horariosPorDia[dia].length > 0
  ).length;

  let totalHorasClase = 0;
  combinacion.forEach(grupo => {
    grupo.horarios.forEach(horario => {
      const duracion = horario.horaFin - horario.horaInicio;
      totalHorasClase += duracion * horario.dias.length;
    });
  });

  // Calcular hora más temprana y más tarde
  let horaMasTempranaGlobal = 24;
  let horaMasTardeGlobal = 0;
  
  Object.values(horariosPorDia).forEach(horariosDelDia => {
    if (horariosDelDia.length > 0) {
      const horaMin = Math.min(...horariosDelDia.map(h => h.horaInicio));
      const horaMax = Math.max(...horariosDelDia.map(h => h.horaFin));
      horaMasTempranaGlobal = Math.min(horaMasTempranaGlobal, horaMin);
      horaMasTardeGlobal = Math.max(horaMasTardeGlobal, horaMax);
    }
  });

  return {
    diasConClases,
    totalHorasClase,
    horaMasTempranaGlobal,
    horaMasTardeGlobal,
    horariosPorDia
  };
}