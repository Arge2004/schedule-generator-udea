function generarHorariosAutomaticos(todasLasMaterias, codigosSeleccionados, opciones = {}) {
  const { horaMinima = 6, evitarHuecos = false } = opciones;

  let materiasSeleccionadas = todasLasMaterias.filter(m => 
    codigosSeleccionados.includes(m.codigo)
  );

  if (materiasSeleccionadas.length === 0) {
    return [];
  }

  if (horaMinima > 6) {
    materiasSeleccionadas = materiasSeleccionadas.map(materia => ({
      ...materia,
      grupos: materia.grupos.filter(grupo => {
        return grupo.horarios.every(horario => horario.horaInicio >= horaMinima);
      })
    })).filter(materia => materia.grupos.length > 0);
  }

  if (materiasSeleccionadas.length === 0) {
    return [];
  }

  const combinacionesValidas = generarCombinacionesConPoda(materiasSeleccionadas, 10000, 5000);

  if (combinacionesValidas.length === 0) {
    return [];
  }

  const combinacionesConPuntuacion = combinacionesValidas.map(combinacion => ({
    grupos: combinacion,
    puntuacion: calcularPuntuacion(combinacion, horaMinima, evitarHuecos),
    detalles: obtenerDetallesCombinacion(combinacion)
  }));

  combinacionesConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion);
  
  return combinacionesConPuntuacion.slice(0, 10);
}

function generarIdCombinacion(combinacion) {
  const sorted = [...combinacion].sort((a, b) => a.codigoMateria.localeCompare(b.codigoMateria));
  return sorted.map(g => `${g.codigoMateria}-${g.numeroGrupo}`).join('|');
}

function generarCombinacionesConPoda(materias, maxCombinaciones = 10000, maxTimeMs = 5000) {
  const combinaciones = [];
  const combinacionesVistas = new Set();
  const startTime = Date.now();
  
  function backtrack(index, combinacionActual) {
    if (combinaciones.length >= maxCombinaciones || Date.now() - startTime > maxTimeMs) {
      return;
    }

    if (index === materias.length) {
      const idCombinacion = generarIdCombinacion(combinacionActual);
      if (!combinacionesVistas.has(idCombinacion)) {
        combinacionesVistas.add(idCombinacion);
        combinaciones.push([...combinacionActual]);
      }
      return;
    }

    const materiaActual = materias[index];
    for (const grupo of materiaActual.grupos) {
      if (grupo.cupoDisponible > 0 && grupo.horarios && grupo.horarios.length > 0) {
        const nuevoGrupo = {
          codigoMateria: materiaActual.codigo,
          nombreMateria: materiaActual.nombre,
          numeroGrupo: grupo.numero,
          horarios: grupo.horarios,
          profesor: grupo.profesor,
          cupoDisponible: grupo.cupoDisponible
        };
        
        if (!tieneConflictoConCombinacionActual(nuevoGrupo, combinacionActual)) {
          combinacionActual.push(nuevoGrupo);
          backtrack(index + 1, combinacionActual);
          combinacionActual.pop();
        }
      }
    }
  }

  backtrack(0, []);
  return combinaciones;
}

function tieneConflictoConCombinacionActual(nuevoGrupo, combinacionActual) {
  for (const grupoExistente of combinacionActual) {
    for (const h1 of nuevoGrupo.horarios) {
      const diasH1Set = new Set(h1.dias);
      
      for (const h2 of grupoExistente.horarios) {
        const hayDiasComunes = h2.dias.some(dia => diasH1Set.has(dia));
        
        if (hayDiasComunes) {
          if (!(h1.horaFin <= h2.horaInicio || h2.horaFin <= h1.horaInicio)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function calcularPuntuacion(combinacion, horaMinima, evitarHuecos) {
  let puntuacion = 1000;

  const horariosPorDia = organizarHorariosPorDia(combinacion);

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
    if (horaPromedioInicio >= 10) {
      puntuacion += 40;
    } else if (horaPromedioInicio >= 8) {
      puntuacion += 20;
    }
  }

  if (evitarHuecos) {
    let totalHuecos = 0;
    
    Object.values(horariosPorDia).forEach(horariosDelDia => {
      if (horariosDelDia.length > 1) {
        horariosDelDia.sort((a, b) => a.horaInicio - b.horaInicio);
        
        for (let i = 0; i < horariosDelDia.length - 1; i++) {
          const hueco = horariosDelDia[i + 1].horaInicio - horariosDelDia[i].horaFin;
          
          if (hueco > 2) {
            totalHuecos += (hueco - 2);
          }
        }
      }
    });
    
    puntuacion -= totalHuecos * 20;
  }

  const diasDeLaSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diasLibres = diasDeLaSemana.filter(dia => !horariosPorDia[dia] || horariosPorDia[dia].length === 0);
  puntuacion += diasLibres.length * 50;

  Object.values(horariosPorDia).forEach(horariosDelDia => {
    if (horariosDelDia.length > 0) {
      const horaMinima = Math.min(...horariosDelDia.map(h => h.horaInicio));
      const horaMaxima = Math.max(...horariosDelDia.map(h => h.horaFin));
      const rangoHoras = horaMaxima - horaMinima;
      
      if (rangoHoras <= 4) {
        puntuacion += 30;
      } else if (rangoHoras <= 6) {
        puntuacion += 15;
      }
    }
  });

  return Math.round(puntuacion);
}

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

function obtenerDetallesCombinacion(combinacion) {
  const horariosPorDia = organizarHorariosPorDia(combinacion);
  
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

export {
  generarHorariosAutomaticos
};
