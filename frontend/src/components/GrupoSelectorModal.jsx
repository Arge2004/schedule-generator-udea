import React, { useEffect } from 'react';
import { useScheduleContext } from './ScheduleContext';
import { useMateriasStore } from '../store/materiasStore';

/**
 * Modal que aparece cuando hay múltiples grupos con el mismo horario
 * Permite al usuario seleccionar cuál grupo quiere agregar
 */

export default function GrupoSelectorModal() {
  const {
    showGrupoSelector,
    gruposConflicto,
    draggingMateria,
    selectGrupo,
    toggleMateriaSelected,
    gruposSeleccionados,
    setShowGrupoSelector,
    clearDragState,
    materias,
  } = useMateriasStore();

  const { celdasMateria, showToastMessage, checkGrupoConflict } = useScheduleContext();
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horas = Array.from({ length: 16 }, (_, i) => i + 6);

  // Filtrar grupos que no tengan conflicto usando la función centralizada
  const gruposSinConflicto = gruposConflicto.filter(grupo => {
    if (!draggingMateria) return false;
    if (grupo.cupoDisponible === 0) return false; // Excluir grupos sin cupo
   // Buscar la materia original por código
    const materiaOriginal = materias?.find(m => m.codigo === draggingMateria.codigo);
    if (!materiaOriginal) return false;
    return !checkGrupoConflict(
      materiaOriginal,
      grupo,
      gruposSeleccionados[draggingMateria.codigo]
    );
  });

  // Auto-selección si solo hay un grupo sin conflicto
  useEffect(() => {
    if (showGrupoSelector && gruposSinConflicto.length === 1 && draggingMateria) {
      const grupo = gruposSinConflicto[0];
      selectGrupo(draggingMateria.codigo, grupo.numero);
      const isSelected = gruposSeleccionados[draggingMateria.codigo];
      if (!isSelected) {
        toggleMateriaSelected(draggingMateria.codigo);
      }
      setShowGrupoSelector(false, []);
      useMateriasStore.setState({
        draggingMateria: null,
        hoveredScheduleCell: null,
        availableHorarios: [],
        previewGrupo: null,
        showGrupoSelector: false,
        gruposConflicto: [],
        pendingModal: false,
      });
    }
  }, [showGrupoSelector, gruposSinConflicto, draggingMateria]);

  if (!showGrupoSelector || gruposSinConflicto.length === 0) {
    if (showGrupoSelector && gruposConflicto.length > 0 && showToastMessage) {
      showToastMessage('⚠️ No hay grupos disponibles sin conflicto de horario');
    }
    return null;
  }

  const handleSelectGrupo = (numeroGrupo) => {
    if (!draggingMateria) {
      console.error('No hay draggingMateria disponible');
      return;
    }

    // Seleccionar el grupo
    selectGrupo(draggingMateria.codigo, numeroGrupo);

    // Marcar la materia como seleccionada si no lo está
    const isSelected = gruposSeleccionados[draggingMateria.codigo];
    if (!isSelected) {
      toggleMateriaSelected(draggingMateria.codigo);
    }

    // Cerrar el modal y limpiar TODO el estado
    setShowGrupoSelector(false, []);
    // Ahora sí limpiar completamente incluyendo draggingMateria
    useMateriasStore.setState({
      draggingMateria: null,
      hoveredScheduleCell: null,
      availableHorarios: [],
      previewGrupo: null,
      showGrupoSelector: false,
      gruposConflicto: [],
      pendingModal: false,
    });
  };

  const handleCancel = () => {
    setShowGrupoSelector(false, []);
    // Limpiar completamente todo el estado
    useMateriasStore.setState({
      draggingMateria: null,
      hoveredScheduleCell: null,
      availableHorarios: [],
      previewGrupo: null,
      showGrupoSelector: false,
      gruposConflicto: [],
      pendingModal: false,
    });
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm" style={{ zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" style={{ zIndex: 100000 }}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
            Seleccionar Grupo
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hay múltiples grupos disponibles para <span className="font-semibold text-primary">{draggingMateria?.nombre}</span> en este horario
          </p>
        </div>

        {/* Lista de grupos sin conflicto */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {gruposSinConflicto.map((grupo, idx) => {
            const sinCupos = grupo.cupoDisponible === 0;
            const isSelected = draggingMateria && gruposSeleccionados[draggingMateria.codigo] === grupo.numero;
            return (
              <button
                key={idx}
                onClick={() => !sinCupos && handleSelectGrupo(grupo.numero)}
                disabled={sinCupos}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${sinCupos
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50'
                    : isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 cursor-pointer shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer'
                  }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-800 dark:text-zinc-100">
                      Grupo {grupo.numero}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Seleccionado
                      </span>
                    )}
                    {!isSelected && idx === 0 && !sinCupos && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                    {sinCupos && (
                      <span className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Agotado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${sinCupos ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {grupo.cupoDisponible} / {grupo.cupoMaximo} cupos
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {grupo.horarios && grupo.horarios.length > 0 && (
                    <div className="space-y-1.5">
                      {grupo.horarios.map((h, hidx) => (
                        <div key={hidx} className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex flex-col">
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                              {h.dias?.join(', ')}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                              {h.horaInicio}:00 - {h.horaFin}:00 {h.aula && `• ${h.aula}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {grupo.profesor && (
                    <div className="flex items-center gap-2 pt-1">
                      <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-zinc-500 dark:text-zinc-400 italic">
                        {grupo.profesor}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
