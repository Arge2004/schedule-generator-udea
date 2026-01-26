import React, { createContext, useContext } from 'react';

// Creamos el contexto
const ScheduleContext = createContext({
  celdasMateria: new Map(),
  showToastMessage: () => {},
  checkGrupoConflict: () => false,
});

// Hook para usar el contexto

export const useScheduleContext = () => useContext(ScheduleContext);

// Provider para envolver Schedule y pasar los valores
export const ScheduleProvider = ({ celdasMateria, showToastMessage, children }) => {
  // Función para validar conflicto de grupo
  const checkGrupoConflict = (materia, grupo, grupoSeleccionado) => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 16 }, (_, i) => i + 6);
    // Crear una copia del mapa sin las celdas del grupo actualmente seleccionado
    const celdasMateriaSinActual = new Map(celdasMateria);
    if (grupoSeleccionado) {
      const grupoActual = materia.grupos.find(g => g.numero === grupoSeleccionado);
      if (grupoActual) {
        grupoActual.horarios.forEach(horario => {
          horario.dias.forEach(dia => {
            const diaIndex = dias.indexOf(dia);
            if (diaIndex !== -1) {
              const horaInicioIdx = horas.indexOf(horario.horaInicio);
              const duracion = horario.horaFin - horario.horaInicio;
              for (let i = 0; i < duracion; i++) {
                const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
                if (celdasMateriaSinActual.get(celdaKey) === materia.codigo) {
                  celdasMateriaSinActual.delete(celdaKey);
                }
              }
            }
          });
        });
      }
    }
    // Validar el nuevo grupo
    let tieneConflicto = false;
    if (grupo) {
      grupo.horarios.forEach(horario => {
        horario.dias.forEach(dia => {
          const diaIndex = dias.indexOf(dia);
          if (diaIndex !== -1) {
            const horaInicioIdx = horas.indexOf(horario.horaInicio);
            const duracion = horario.horaFin - horario.horaInicio;
            for (let i = 0; i < duracion; i++) {
              const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
              const materiaEnCeldaCodigo = celdasMateriaSinActual.get(celdaKey);
              if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== materia.codigo) {
                tieneConflicto = true;
                break;
              }
            }
          }
        });
      });
    }
    return tieneConflicto;
  };
  return (
    <ScheduleContext.Provider value={{ celdasMateria, showToastMessage, checkGrupoConflict }}>
      {children}
    </ScheduleContext.Provider>
  );
};
