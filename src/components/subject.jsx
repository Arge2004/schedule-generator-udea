import React, { useState, useEffect } from "react";
import { useMateriasStore } from "../store/materiasStore";

//nombre,codigo,grupos
export default function Subject({materia, generationMode}) {
  const { materiasSeleccionadas, toggleMateriaSelected, gruposSeleccionados, selectGrupo, resetKey } = useMateriasStore();
  const isSelected = !!materiasSeleccionadas[materia?.codigo];
  const [isExpanded, setIsExpanded] = useState(false);
  const grupoSeleccionado = gruposSeleccionados[materia?.codigo];

  const handleChange = () => {
    if (materia?.codigo) {
      toggleMateriaSelected(materia.codigo);
      // Si está deseleccionando, cerrar el desplegable
      if (isSelected) {
        setIsExpanded(false);
      }
    }
  };

  const handleGrupoSelect = (numeroGrupo) => {
    // Si el grupo ya está seleccionado, deseleccionar
    if (grupoSeleccionado === numeroGrupo) {
      selectGrupo(materia.codigo, null);
      // Quitar la materia de seleccionadas
      toggleMateriaSelected(materia.codigo);
    } else {
      // Seleccionar el nuevo grupo
      selectGrupo(materia.codigo, numeroGrupo);
      // Marcar la materia como seleccionada al seleccionar un grupo
      if (!isSelected) {
        toggleMateriaSelected(materia.codigo);
      }
    }
  };

  // Cerrar desplegable cuando se hace reset
  useEffect(() => {
    setIsExpanded(false);
  }, [resetKey]);

  const handleItemClick = () => {
    if (generationMode === 'manual') {
      // En modo manual, solo expandir/contraer, NO seleccionar
      setIsExpanded(!isExpanded);
    }
  };

  const toggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
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
            onClick={handleItemClick}
            className="flex items-center gap-3 p-2.5 hover:bg-zinc-200 rounded dark:hover:bg-zinc-100/10 cursor-pointer group"
          >
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {materia?.nombre ? materia.nombre : "Undefined Subject"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {materia?.codigo ? materia.codigo : "XXXXXX"} • <span className="text-primary">{materia?.grupos ? materia.grupos.length + " Grupos disponibles" : "Sin grupos"}</span>
              </span>
            </div>
            {materia?.grupos && (
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
          <label className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 rounded-lg dark:hover:bg-zinc-100/10 cursor-pointer group">
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {materia?.nombre ? materia.nombre : "Undefined Subject"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {materia?.codigo ? materia.codigo : "XXXXXX"} • <span className="text-primary">{materia?.grupos ? materia.grupos.length + " Grupos disponibles" : "Sin grupos"}</span>
              </span>
            </div>
            <input
              className="w-5 h-5 rounded cursor-pointer border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary bg-transparent checked:bg-primary checked:border-primary"
              type="checkbox"
              checked={isSelected}
              onChange={handleChange}
              onFocus={(e) => e.preventDefault()}
            />
          </label>
        )}
        
        {/* Mostrar grupos solo si en modo manual y expandido */}
        {generationMode === 'manual' && materia?.grupos && isExpanded && (
          <div className="px-4 pb-3 space-y-2.5">
            {materia.grupos.map((grupo, idx) => {
              const sinCupos = grupo.cupoDisponible === 0;
              const isGrupoSelected = grupoSeleccionado === grupo.numero;
              
              return (
                <div 
                  key={idx}
                  onClick={() => !sinCupos && handleGrupoSelect(grupo.numero)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isGrupoSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : sinCupos 
                        ? 'border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/40 bg-white dark:bg-zinc-900/50'
                  }`}
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
          </div>
        )}
      </div>
    </div>
  );
}

