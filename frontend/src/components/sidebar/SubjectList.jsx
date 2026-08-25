import React, { useRef, useEffect } from "react";
import Subject from "../Subject.jsx";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function SubjectList({
  materiasFiltradas,
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
    materiasSeleccionadas,
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    setAllowManualBlocks,
    clearAllowManualBlocksBySchedule,
    unlockAllowManualBlocks,
  } = useMateriasStore();

  // Guardar y restaurar la posición del scroll cuando cambian las materias seleccionadas
  useEffect(() => {
    if (scrollContainerRef.current && previousScrollPos.current > 0) {
      scrollContainerRef.current.scrollTop = previousScrollPos.current;
    }
  }, [materiasSeleccionadas]);

  const selectedCount = materiasSeleccionadas
    ? Object.keys(materiasSeleccionadas).length
    : 0;

  const handleReset = () => {
    resetMateriasSeleccionadas();
    clearHorariosGenerados();
    setAllowManualBlocks(false);
    clearAllowManualBlocksBySchedule();
    unlockAllowManualBlocks();
  };

  return (
    <div className="space-y-4 flex flex-col flex-1 min-h-0">
      {/* Cabecera y Barra de búsqueda */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 mr-15 md:mr-0">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Materias
          </p>
          <div className="flex items-center gap-1.5">
            {selectedCount > 0 && (
              <>
                <span className="text-2xs md:text-[12px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                  {selectedCount}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-bold">
                  /
                </span>
              </>
            )}
            <span className="text-2xs md:text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {materiasFiltradas.length}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="w-full pl-4 pr-8 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-500 dark:placeholder:text-zinc-500"
              placeholder="Buscar materias..."
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-2 cursor-pointer bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 rounded-lg text-primary text-xs font-bold focus:outline-none"
            title="Deseleccionar todas"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Contenedor de lista de materias con scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={(e) => {
          previousScrollPos.current = e.target.scrollTop;
        }}
        className="space-y-1 flex-1 min-h-0 pr-1 overflow-y-auto scrollbar-custom"
      >
        {!materias || materias.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
            No hay materias cargadas. Sube un archivo HTML.
          </p>
        ) : materiasFiltradas.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
            No se encontraron materias con "{debouncedSearchTerm}"
          </p>
        ) : (
          materiasFiltradas.map((materia) => (
            <div key={materia.codigo}>
              <Subject
                materia={materia}
                generationMode={generationMode}
                dragEnabled={dragEnabled}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
