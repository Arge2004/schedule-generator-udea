
/**
 * Genera horarios automáticos optimizados basados en preferencias del usuario
 * @param {Array} todasLasMaterias - Array completo de todas las materias disponibles
 * @param {Array} codigosSeleccionados - Array de códigos de materias seleccionadas
 * @param {Object} opciones - Opciones de filtrado { evitarMananas: boolean, evitarHuecos: boolean }
 * @returns {Array} Array de los mejores horarios (máximo 5), cada uno con sus grupos y puntuación
 */
export function generarHorariosAutomaticos(todasLasMaterias, codigosSeleccionados, opciones = {}) {
  const { evitarMananas = false, evitarHuecos = false } = opciones;

  // Filtrar solo las materias seleccionadas
  const materiasSeleccionadas = todasLasMaterias.filter(m => 
    codigosSeleccionados.includes(m.codigo)
  );

  if (materiasSeleccionadas.length === 0) {
    return [];
  }

  // Generar todas las combinaciones posibles
  const combinaciones = generarCombinaciones(materiasSeleccionadas);
  
  // Filtrar combinaciones válidas (sin conflictos de horario)
  const combinacionesValidas = combinaciones.filter(combinacion => 
    !tieneConflictos(combinacion)
  );

  if (combinacionesValidas.length === 0) {
    return [];
  }

  // Calcular puntuación para cada combinación válida
  const combinacionesConPuntuacion = combinacionesValidas.map(combinacion => ({
    grupos: combinacion,
    puntuacion: calcularPuntuacion(combinacion, evitarMananas, evitarHuecos),
    detalles: obtenerDetallesCombinacion(combinacion)
  }));

  // Ordenar por puntuación (mayor es mejor) y retornar top 5
  combinacionesConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion);
  
  return combinacionesConPuntuacion.slice(0, 5);
}

/**
 * Genera todas las combinaciones posibles de grupos para las materias seleccionadas
 * Usa backtracking para generar el producto cartesiano de todos los grupos
 */
function generarCombinaciones(materias) {
  const combinaciones = [];
  
  function backtrack(index, combinacionActual) {
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
        combinacionActual.push({
          codigoMateria: materiaActual.codigo,
          nombreMateria: materiaActual.nombre,
          numeroGrupo: grupo.numero,
          horarios: grupo.horarios,
          profesor: grupo.profesor,
          cupoDisponible: grupo.cupoDisponible
        });
        
        backtrack(index + 1, combinacionActual);
        
        combinacionActual.pop();
      }
    }
  }

  backtrack(0, []);
  return combinaciones;
}

/**
 * Verifica si una combinación de grupos tiene conflictos de horario (solapamientos)
 */
function tieneConflictos(combinacion) {
  // Comparar cada par de grupos en la combinación
  for (let i = 0; i < combinacion.length; i++) {
    for (let j = i + 1; j < combinacion.length; j++) {
      const grupo1 = combinacion[i];
      const grupo2 = combinacion[j];

      // Verificar cada horario del grupo1 contra cada horario del grupo2
      for (const h1 of grupo1.horarios) {
        for (const h2 of grupo2.horarios) {
          // Verificar si hay días en común
          const diasComunes = h1.dias.some(dia => h2.dias.includes(dia));
          
          if (diasComunes) {
            // Verificar si hay solapamiento de horas
            const solapa = !(h1.horaFin <= h2.horaInicio || h2.horaFin <= h1.horaInicio);
            
            if (solapa) {
              return true; // Hay conflicto
            }
          }
        }
      }
    }
  }
  
  return false; // No hay conflictos
}

/**
 * Calcula la puntuación de una combinación basada en las preferencias
 * Mayor puntuación = mejor horario
 */
function calcularPuntuacion(combinacion, evitarMananas, evitarHuecos) {
  let puntuacion = 1000; // Puntuación base

  // Obtener todos los horarios de la combinación organizados por día
  const horariosPorDia = organizarHorariosPorDia(combinacion);

  // PENALIZACIÓN: Clases en la mañana (antes de las 10:00)
  if (evitarMananas) {
    let clasesEnManana = 0;
    combinacion.forEach(grupo => {
      grupo.horarios.forEach(horario => {
        if (horario.horaInicio < 10) {
          clasesEnManana += horario.dias.length; // Contar cada día
        }
      });
    });
    puntuacion -= clasesEnManana * 30; // Penalización de 30 puntos por cada clase en la mañana
  }

  // PENALIZACIÓN: Huecos extensos entre clases (>2 horas)
  if (evitarHuecos) {
    let totalHuecos = 0;
    
    Object.values(horariosPorDia).forEach(horariosDelDia => {
      if (horariosDelDia.length > 1) {
        // Ordenar por hora de inicio
        horariosDelDia.sort((a, b) => a.horaInicio - a.horaInicio);
        
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