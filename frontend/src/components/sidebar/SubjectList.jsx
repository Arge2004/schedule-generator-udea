import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Subject from "../subject.jsx";
import FilterPopover from "./FilterPopover.jsx";
import PreferencesPopover from "./PreferencesPopover.jsx";
import Tooltip from "../Tooltip.jsx";
import { useMateriasStore } from "../../store/materiasStore.js";
import { SearchIcon, TrashIcon, FilterIcon, GearIcon } from "../../icons/index.js";

function getNormalizedInitialLetter(str) {
  if (!str) return "#";
  const trimmed = str.trim();
  if (!trimmed) return "#";
  const firstChar = trimmed.charAt(0).toUpperCase();
  return firstChar.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function SubjectList({
  materiasFiltradas = [],
  searchTerm,
  onSearchChange,
  onClearSearch,
  generationMode,
  dragEnabled,
  setDragEnabled,
  horaMinima,
  setHoraMinima,
  evitarHuecos,
  setEvitarHuecos,
  isMobile,
}) {
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef({});

  // Estados de filtros y popovers
  const [quickFilter, setQuickFilter] = useState("all"); // "all" | "available" | "selected"
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [horaMinimaFilter, setHoraMinimaFilter] = useState(6);
  const [horaMaximaFilter, setHoraMaximaFilter] = useState(22);
  const [selectedJornada, setSelectedJornada] = useState(null);
  const [selectedDias, setSelectedDias] = useState([]);

  // Letra activa en el scroll
  const [activeLetter, setActiveLetter] = useState(null);

  const {
    materias,
    materiasSeleccionadas = {},
    gruposSeleccionados = {},
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    horariosGenerados = [],
    setAllowManualBlocks,
    clearAllowManualBlocksBySchedule,
    unlockAllowManualBlocks,
  } = useMateriasStore();

  const selectedCount = useMemo(() => {
    if (generationMode === "manual") {
      return Object.keys(gruposSeleccionados).filter(
        (k) =>
          gruposSeleccionados[k] !== null &&
          typeof gruposSeleccionados[k] !== "undefined",
      ).length;
    }
    return Object.keys(materiasSeleccionadas).length;
  }, [materiasSeleccionadas, gruposSeleccionados, generationMode]);

  const hasGeneratedSchedules =
    Array.isArray(horariosGenerados) && horariosGenerados.length > 0;
  const hasAnySelection = selectedCount > 0 || hasGeneratedSchedules;

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

  const handleResetAdvancedFilters = () => {
    setSelectedLetter(null);
    setHoraMinimaFilter(6);
    setHoraMaximaFilter(22);
    setSelectedJornada(null);
    setSelectedDias([]);
  };

  const handleToggleDia = (dia) => {
    setSelectedDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  // Filtrado compuesto
  const finalFilteredMaterias = useMemo(() => {
    return materiasFiltradas.filter((materia) => {
      // 1. Filtro Rápido
      if (quickFilter === "selected") {
        const isSel =
          generationMode === "manual"
            ? gruposSeleccionados[materia.codigo] !== null &&
              typeof gruposSeleccionados[materia.codigo] !== "undefined"
            : !!materiasSeleccionadas[materia.codigo];
        if (!isSel) return false;
      } else if (quickFilter === "available") {
        const hasCupos = (materia.grupos || []).some(
          (g) => (g.cupoDisponible || 0) > 0,
        );
        if (!hasCupos) return false;
      }

      // 2. Filtro por Letra (normalizada: A incluye Á, E incluye É, etc.)
      if (selectedLetter) {
        const firstLetter = getNormalizedInitialLetter(materia.nombre);
        if (firstLetter !== selectedLetter) return false;
      }

      // 3. Filtro por Intervalo Horario
      if (horaMinimaFilter > 6 || horaMaximaFilter < 22) {
        const hasValidSchedule = (materia.grupos || []).some((g) =>
          (g.horarios || []).some(
            (h) =>
              h.horaInicio >= horaMinimaFilter &&
              h.horaFin <= horaMaximaFilter,
          ),
        );
        if (!hasValidSchedule) return false;
      }

      // 4. Filtro por Días
      if (selectedDias.length > 0) {
        const hasMatchingDay = (materia.grupos || []).some((g) =>
          (g.horarios || []).some((h) =>
            (h.dias || []).some((d) => selectedDias.includes(d)),
          ),
        );
        if (!hasMatchingDay) return false;
      }

      return true;
    });
  }, [
    materiasFiltradas,
    quickFilter,
    selectedLetter,
    horaMinimaFilter,
    horaMaximaFilter,
    selectedDias,
    generationMode,
    gruposSeleccionados,
    materiasSeleccionadas,
  ]);

  // Agrupar materias alfabéticamente (con A y Á al mismo nivel)
  const groupedSections = useMemo(() => {
    const groups = {};
    finalFilteredMaterias.forEach((materia) => {
      const letter = getNormalizedInitialLetter(materia.nombre);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(materia);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
      .map((letter) => ({
        letter,
        items: groups[letter].sort((a, b) =>
          (a.nombre || "").localeCompare(b.nombre || "", "es", {
            sensitivity: "base",
          }),
        ),
      }));
  }, [finalFilteredMaterias]);

  const availableLetters = useMemo(() => {
    return groupedSections.map((s) => s.letter);
  }, [groupedSections]);

  // Observer para detectar qué sección de letra está activa durante el scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;

    let currentLetter = availableLetters[0] || null;
    for (const letter of availableLetters) {
      const el = sectionRefs.current[letter];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 40) {
          currentLetter = letter;
        } else {
          break;
        }
      }
    }
    setActiveLetter(currentLetter);
  }, [availableLetters]);

  // Scroll suave hacia una letra seleccionada
  const scrollToLetter = (letter) => {
    const el = sectionRefs.current[letter];
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveLetter(letter);
    }
  };

  const hasAdvancedFilters =
    Boolean(selectedLetter) ||
    horaMinimaFilter > 6 ||
    horaMaximaFilter < 22 ||
    Boolean(selectedJornada) ||
    selectedDias.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2 relative">
      {/* 1. Barra de Búsqueda, Filtros, Preferencias y Limpiar */}
      <div className="flex items-center gap-1.5 flex-shrink-0 relative">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            className="w-full pl-8 pr-7 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs 
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 
                       focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary 
                       transition-all h-8"
            placeholder="Buscar por nombre o código…"
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            aria-label="Buscar materias"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Limpiar término de búsqueda"
              className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botón de Filtros Avanzados envuelto en Tooltip */}
        <div className="relative flex-shrink-0">
          <Tooltip content="Filtros avanzados" position="top">
            <button
              type="button"
              onClick={() => {
                setIsFilterPopoverOpen(!isFilterPopoverOpen);
                setIsPreferencesOpen(false);
              }}
              aria-label="Filtros avanzados"
              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                hasAdvancedFilters || isFilterPopoverOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Popover de Filtros sobresaliendo hacia la derecha */}
          <FilterPopover
            isOpen={isFilterPopoverOpen}
            onClose={() => setIsFilterPopoverOpen(false)}
            selectedLetter={selectedLetter}
            onSelectLetter={setSelectedLetter}
            horaMinimaFilter={horaMinimaFilter}
            onSetHoraMinimaFilter={setHoraMinimaFilter}
            horaMaximaFilter={horaMaximaFilter}
            onSetHoraMaximaFilter={setHoraMaximaFilter}
            selectedJornada={selectedJornada}
            onSelectJornada={setSelectedJornada}
            selectedDias={selectedDias}
            onToggleDia={handleToggleDia}
            onResetFilters={handleResetAdvancedFilters}
          />
        </div>

        {/* Botón de Preferencias (con Popover hacia la derecha) */}
        <div className="relative flex-shrink-0">
          <Tooltip content="Preferencias" position="top">
            <button
              type="button"
              onClick={() => {
                setIsPreferencesOpen(!isPreferencesOpen);
                setIsFilterPopoverOpen(false);
              }}
              aria-label="Preferencias de generación y horarios"
              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                isPreferencesOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <GearIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Popover de Preferencias sobresaliendo hacia la derecha */}
          <PreferencesPopover
            isOpen={isPreferencesOpen}
            onClose={() => setIsPreferencesOpen(false)}
            generationMode={generationMode}
            horaMinima={horaMinima}
            setHoraMinima={setHoraMinima}
            evitarHuecos={evitarHuecos}
            setEvitarHuecos={setEvitarHuecos}
            dragEnabled={dragEnabled}
            setDragEnabled={setDragEnabled}
            isMobile={isMobile}
          />
        </div>

        {/* Botón Limpiar Selecciones y Horarios envuelto en Tooltip */}
        <div className="relative flex-shrink-0">
          <Tooltip
            content="Limpiar selecciones y horarios generados"
            position="top"
            disabled={!hasAnySelection}
          >
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasAnySelection}
              aria-label="Limpiar selecciones y horarios"
              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors ${
                hasAnySelection
                  ? "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  : "border-transparent bg-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
              }`}
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Filtros Rápidos (Todas | Disponibles | Seleccionadas) */}
      <div className="flex items-center justify-between gap-1 flex-shrink-0 pt-0.5">
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "Todas" },
            { id: "available", label: "Disponibles" },
            { id: "selected", label: `Seleccionadas (${selectedCount})` },
          ].map((tab) => {
            const isActive = quickFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickFilter(tab.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-white"
                    : "border border-zinc-200/80 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {hasAdvancedFilters && (
          <button
            onClick={handleResetAdvancedFilters}
            className="text-[11px] rounded-md px-2 py-1 text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
            title="Quitar filtros avanzados"
          >
            Quitar filtro
          </button>
        )}
      </div>

      {/* 3. Contenedor Principal: Columna Fija A-Z a la izquierda + Lista de Materias a la derecha */}
      <div className="flex-1 flex min-h-0 gap-1.5 pt-1">
        {/* Columna Fija A-Z a la izquierda más grande para clickear fácilmente */}
        {availableLetters.length > 1 && (
          <div className="w-6 flex flex-col items-center justify-start py-0.5 space-y-1 select-none flex-shrink-0 border-r border-zinc-200/70 dark:border-zinc-800/80 pr-1">
            {availableLetters.map((letter) => {
              const isActive = (activeLetter || availableLetters[0]) === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => scrollToLetter(letter)}
                  className={`w-5.5 h-5.5 rounded-md text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-2xs"
                      : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  title={`Ir a letra ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de Materias agrupadas con letras centradas y líneas a ambos lados */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="space-y-3 flex-1 min-h-0 pr-1 pl-0.5 overflow-y-auto scrollbar-custom"
        >
          {groupedSections.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
              <p className="font-semibold">No se encontraron materias</p>
              <p className="text-[11px] mt-0.5">Prueba cambiando los filtros</p>
            </div>
          ) : (
            groupedSections.map(({ letter, items }) => (
              <div
                key={letter}
                ref={(el) => (sectionRefs.current[letter] = el)}
                id={`section-letter-${letter}`}
                className="space-y-1.5 scroll-mt-2"
              >
                {/* Encabezado con Letra en la mitad y líneas a izquierda y derecha */}
                <div className="sticky top-0 z-10 py-1.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs flex items-center gap-2 select-none">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1.5">
                    {letter}
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* Materias */}
                <div className="space-y-1.5">
                  {items.map((materia) => (
                    <Subject
                      key={materia.codigo}
                      materia={materia}
                      generationMode={generationMode}
                      dragEnabled={dragEnabled}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
