import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from 'framer-motion';
import { useMateriasStore } from "../store/materiasStore";

//nombre,codigo,grupos
export default function Subject({materia, generationMode, dragEnabled = true}) {
  const { 
    materiasSeleccionadas, 
    toggleMateriaSelected, 
    gruposSeleccionados, 
    selectGrupo, 
    resetKey,
    setDraggingMateria,
    clearDragState,
    materias,
  } = useMateriasStore();
  const isSelected = !!materiasSeleccionadas[materia?.codigo];
  const [isExpanded, setIsExpanded] = useState(false);
  const grupoSeleccionado = gruposSeleccionados[materia?.codigo];
  const [celdasMateriaHorario, setCeldasMateriaHorario] = useState(new Map());

  // Sincronizar celdas ocupadas con los grupos seleccionados antes de renderizar el dropdown
  useEffect(() => {
    if (generationMode === 'manual' && gruposSeleccionados) {
      const diasArr = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const horasArr = Array.from({ length: 16 }, (_, i) => i + 6);
      const map = new Map();
      // Obtener todas las materias desde el store (estado global)
      let todasMaterias = [];
      if (materias && Array.isArray(materias)) {
        todasMaterias = materias;
      } else if (materia) {
        todasMaterias = [materia];
      }
      Object.entries(gruposSeleccionados).forEach(([codigo, grupoNum]) => {
        if (!codigo || !grupoNum) return;
        // Buscar la materia y grupo correspondiente en la lista global
        const mat = todasMaterias.find(m => m.codigo === codigo);
        if (!mat) return;
        const grupo = mat.grupos.find(g => g.numero === grupoNum);
        if (!grupo) return;
        grupo.horarios.forEach(horario => {
          horario.dias.forEach(dia => {
            const diaIndex = diasArr.indexOf(dia);
            if (diaIndex !== -1) {
              const horaInicioIdx = horasArr.indexOf(horario.horaInicio);
              const duracion = horario.horaFin - horario.horaInicio;
              for (let i = 0; i < duracion; i++) {
                const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
                map.set(celdaKey, codigo);
              }
            }
          });
        });
      });
      setCeldasMateriaHorario(map);
    }
  }, [gruposSeleccionados, generationMode, materia]);

  const handleChange = () => {
    if (materia?.codigo) {
      toggleMateriaSelected(materia.codigo);
      // Si está deseleccionando, cerrar el desplegable
      if (isSelected) {
        setIsExpanded(false);
      }
    }
  };

  // Validar conflicto de horarios antes de seleccionar grupo
  const handleGrupoSelect = (numeroGrupo) => {
    // Si el grupo ya está seleccionado, deseleccionar
    if (grupoSeleccionado === numeroGrupo) {
      selectGrupo(materia.codigo, null);
      toggleMateriaSelected(materia.codigo);
      return;
    }

    // Obtener celdas ocupadas del schedule desde el estado local
    const celdasMateria = celdasMateriaHorario;
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 16 }, (_, i) => i + 6);
    const grupo = materia.grupos.find(g => g.numero === numeroGrupo);
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
              const materiaEnCeldaCodigo = celdasMateria.get(celdaKey);
              if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== materia.codigo) {
                tieneConflicto = true;
                break;
              }
            }
          }
        });
      });
    }
    if (tieneConflicto) {
      // Mostrar notificación (usando el notifier registrado en el store)
      const { notify } = useMateriasStore.getState();
      if (notify) notify('⚠️ No se puede seleccionar: hay un conflicto con otra materia');
      return;
    }
    selectGrupo(materia.codigo, numeroGrupo);
    if (!isSelected) {
      toggleMateriaSelected(materia.codigo);
    }
  };

  // Cerrar desplegable cuando se hace reset
  useEffect(() => {
    setIsExpanded(false);
  }, [resetKey]);

  useEffect(() => {
    if (dragEnabled){
      setIsExpanded(false);
    }
  }, [dragEnabled]);

  const handleItemClick = () => {
    if (generationMode === 'manual') {
      // En modo manual, solo expandir/contraer, NO seleccionar
      setIsExpanded(!isExpanded);
    }
  };

  // Calcular si existe al menos un grupo disponible (sin conflictos) para esta materia
  const anyGrupoAvailable = (() => {
    if (!materia?.grupos || materia.grupos.length === 0) return false;
    const diasArr = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horasArr = Array.from({ length: 16 }, (_, i) => i + 6);
    return materia.grupos.some(gr => {
      if (gr.cupoDisponible === 0) return false;
      // Si el grupo no tiene horarios, considerarlo disponible
      if (!gr.horarios || gr.horarios.length === 0) return true;
      // Verificar si alguno de sus horarios choca con el mapa de celdas
      for (const horario of gr.horarios) {
        for (const dia of horario.dias) {
          const diaIndex = diasArr.indexOf(dia);
          if (diaIndex === -1) continue;
          const horaInicioIdx = horasArr.indexOf(horario.horaInicio);
          const duracion = horario.horaFin - horario.horaInicio;
          for (let i = 0; i < duracion; i++) {
            const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
            const materiaEnCeldaCodigo = celdasMateriaHorario.get(celdaKey);
            if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== materia.codigo) {
              // Tiene conflicto, este grupo no está disponible
              return false;
            }
          }
        }
      }
      // No se detectaron conflictos para este grupo
      return true;
    });
  })();
  const subjectDisabled = !anyGrupoAvailable;

  const toggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  // Handlers para drag and drop (solo en modo manual)
  const handleDragStart = (e) => {
    if (generationMode !== 'manual' || !materia?.grupos || materia.grupos.length === 0) {
      e.preventDefault();
      return;
    }
        
    // Guardar datos de la materia en el store
    setDraggingMateria({
      codigo: materia.codigo,
      nombre: materia.nombre,
      grupos: materia.grupos,
    });
    
    // Configurar el efecto visual del drag
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', materia.codigo);
  };

  const handleDragEnd = () => {
    // Limpiar después de un delay MÁS LARGO para que el drop tenga tiempo de procesar
  };

  return (
    <div className="space-y-2">
      <div className={`rounded-lg transition-all border-2 flex flex-col gap-2 ${
        (generationMode === 'manual' && grupoSeleccionado) || (generationMode !== 'manual' && isSelected) 
          ? 'border-primary' 
          : 'border-transparent'
      }`}>
        {generationMode === 'manual' ? (
          <div 
            draggable={dragEnabled && materia?.grupos && materia.grupos.length > 0}
            onDragStart={dragEnabled ? handleDragStart : undefined}
            onDragEnd={dragEnabled ? handleDragEnd : undefined}
            onClick={!dragEnabled ? handleItemClick : undefined}
            className={`flex items-center gap-3 p-2.5 hover:bg-zinc-200 rounded dark:hover:bg-zinc-100/10 group ${
              dragEnabled && materia?.grupos && materia.grupos.length > 0 ? 'cursor-move' : 'cursor-pointer'
            }`}
            style={subjectDisabled && !isSelected ? {
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(220,38,38,0.18) 0px,
                rgba(220,38,38,0.18) 6px,
                transparent 6px,
                transparent 12px
              )`
            } : undefined}
          >
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {materia?.nombre ? materia.nombre : "Undefined Subject"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {materia?.codigo ? materia.codigo : "XXXXXX"} • <span className="text-primary">{materia?.grupos ? materia.grupos.length + " Grupos disponibles" : "Sin grupos"}</span>
              </span>
            </div>
            {materia?.grupos && !dragEnabled && (
              <svg 
                className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        ) : (
          <label
            className={`flex items-center gap-3 p-2.5 hover:bg-zinc-50 rounded-lg dark:hover:bg-zinc-100/10 cursor-pointer group ${subjectDisabled && !isSelected ? 'opacity-90' : ''}`}
            style={subjectDisabled && !isSelected ? {
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(220,38,38,0.18) 0px,
                rgba(220,38,38,0.18) 6px,
                transparent 6px,
                transparent 12px
              )`
            } : undefined}
          >
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {materia?.nombre ? materia.nombre : "Undefined Subject"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {materia?.codigo ? materia.codigo : "XXXXXX"} • <span className="text-primary">{materia?.grupos ? materia.grupos.length + " Grupos disponibles" : "Sin grupos"}</span>
              </span>
            </div>
            {subjectDisabled && !isSelected && (
              // efecto de rayas diagonales aplicado vía style del contenedor
              null
            )}
            <input
              className={`w-5 h-5 rounded border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 focus:ring-primary ${subjectDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              type="checkbox"
              checked={isSelected}
              disabled={subjectDisabled}
              onChange={handleChange}
              onFocus={(e) => e.preventDefault()}
              style={{
                backgroundColor: isSelected ? '#1392ec' : '#fff', // primary-600 o blanco
                borderColor: '#d1d5db', // zinc-300
                color: isSelected ? '#fff' : '#1392ec', // check blanco sobre azul, azul sobre blanco
                WebkitAppearance: 'none',
                appearance: 'none',
                display: 'grid',
                placeContent: 'center',
                transition: 'background 0.2s, border 0.2s',
              }}
            />
            <style>{`
              input[type="checkbox"].rounded:checked {
                background-color: #1392ec !important;
                border-color: #1392ec !important;
                color: #fff !important;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='4 8.5 7 11.5 12 5.5'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: center;
                background-size: 1.2em 1.2em;
              }
            `}</style>
          </label>
        )}
        
        {/* Mostrar grupos solo si en modo manual y expandido, animado */}
        <AnimatePresence>
          {generationMode === 'manual' && materia?.grupos && isExpanded && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="px-4 pb-3 space-y-2.5 overflow-hidden"
            >
              {materia.grupos.map((grupo, idx) => {
                const sinCupos = grupo.cupoDisponible === 0;
                const isGrupoSelected = grupoSeleccionado === grupo.numero;
                // Validar conflicto para este grupo
                let tieneConflicto = false;
                if (grupo) {
                  grupo.horarios.forEach(horario => {
                    horario.dias.forEach(dia => {
                      const diasArr = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      const horasArr = Array.from({ length: 16 }, (_, i) => i + 6);
                      const diaIndex = diasArr.indexOf(dia);
                      if (diaIndex !== -1) {
                        const horaInicioIdx = horasArr.indexOf(horario.horaInicio);
                        const duracion = horario.horaFin - horario.horaInicio;
                        for (let i = 0; i < duracion; i++) {
                          const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
                          const materiaEnCeldaCodigo = celdasMateriaHorario.get(celdaKey);
                          if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== materia.codigo) {
                            tieneConflicto = true;
                            break;
                          }
                        }
                      }
                    });
                  });
                }
                const disabled = sinCupos || tieneConflicto;
                return (
                  <div 
                    key={idx}
                    onClick={disabled ? undefined : () => handleGrupoSelect(grupo.numero)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      disabled
                        ? 'bg-zinc-200 dark:bg-zinc-800 opacity-60 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                        : isGrupoSelected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/40 bg-white dark:bg-zinc-900/50 cursor-pointer'
                    }`}
                    aria-disabled={disabled}
                    tabIndex={disabled ? -1 : 0}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">Grupo {grupo.numero}</span>
                        {idx === 0 && !sinCupos && (
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
                      <div className={`w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                        isGrupoSelected
                          ? 'border-primary bg-primary'
                          : sinCupos 
                            ? 'border-zinc-300 dark:border-zinc-700' 
                            : 'border-zinc-300 dark:border-zinc-600'
                      }`}>
                        {isGrupoSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs mb-3 text-start">
                      {grupo.horarios && grupo.horarios.length > 0 && (
                        <div className="space-y-1.5">
                          {grupo.horarios.map((h, hidx) => (
                            <div key={hidx} className="flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="flex flex-col">
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium text-start">
                                  {h.dias?.join(', ')}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                                  {h.horaInicio}:00 - {h.horaFin}:00
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

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${sinCupos ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        <span className={`text-xs font-semibold ${sinCupos ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {sinCupos ? 'Sin cupos' : 'Cupos disponibles'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-bold text-zinc-700 dark:text-white">
                          {grupo.cupoDisponible} <span className="dark:text-zinc-400 text-[11px]"> / {grupo.cupoMaximo}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

