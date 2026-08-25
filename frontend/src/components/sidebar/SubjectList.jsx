import { useRef, useEffect, useMemo, useCallback } from "react";
import Subject from "../Subject.jsx";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function SubjectList({
  materiasFiltradas = [],
  searchTerm,
  onSearchChange,
  onClearSearch,
  debouncedSearchTerm,
  generationMode,
  dragEnabled,
}) {
  const scrollContainerRef = useRef(null);
  const previousScrollPos = useRef(0);

  const {
    materias,
    materiasSeleccionadas = {},
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    setAllowManualBlocks,
    clearAllowManualBlocksBySchedule,
    unlockAllowManualBlocks,
  } = useMateriasStore();

  const selectedCount = useMemo(
    () => Object.keys(materiasSeleccionadas).length,
    [materiasSeleccionadas],
  );

  // Restaurar scroll position tras actualizaciones en selecciones
  useEffect(() => {
    if (scrollContainerRef.current && previousScrollPos.current > 0) {
      scrollContainerRef.current.scrollTop = previousScrollPos.current;
    }
  }, [materiasSeleccionadas]);

  const handleScroll = useCallback((e) => {
    previousScrollPos.current = e.currentTarget.scrollTop;
  }, []);

  const handleReset = useCallback(() => {
    resetMateriasSeleccionadas();
    clearHorariosGenerados();
    setAllowManualBlocks(false);
    clearAllowManualBlocksBySchedule();
    unlockAllowManualBlocks();
  }, [
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    setAllowManualBlocks,
    clearAllowManualBlocksBySchedule,
    unlockAllowManualBlocks,
  ]);

  return (
    <div className="space-y-4 flex flex-col flex-1 min-h-0">
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 mr-15 md:mr-0">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Materias
          </span>
          <div className="flex items-center gap-1.5 font-bold">
            {selectedCount > 0 && (
              <>
                <span className="text-[11px] bg-primary text-white px-2 py-0.5 rounded-full">
                  {selectedCount}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">
                  /
                </span>
              </>
            )}
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {materiasFiltradas.length}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="w-full pl-4 pr-8 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm 
                         text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-500 transition-all"
              placeholder="Buscar materias..."
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Limpiar búsqueda"
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-zinc-400 
                           hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 cursor-pointer bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 
                       dark:hover:bg-zinc-800 rounded-lg text-primary text-xs font-bold 
                       transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            title="Deseleccionar todas las materias"
          >
            RESET
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="space-y-1 flex-1 min-h-0 pr-1 overflow-y-auto scrollbar-custom"
      >
        {!materias || materias.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-6">
            No hay materias cargadas. Selecciona una facultad y programa.
          </p>
        ) : materiasFiltradas.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-6">
            No se encontraron materias con "{debouncedSearchTerm}"
          </p>
        ) : (
          materiasFiltradas.map((materia) => (
            <Subject
              key={materia.codigo}
              materia={materia}
              generationMode={generationMode}
              dragEnabled={dragEnabled}
            />
          ))
        )}
      </div>
    </div>
  );
}
