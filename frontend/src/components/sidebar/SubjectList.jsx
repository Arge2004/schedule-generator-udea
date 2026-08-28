import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Subject from "../subject.jsx";
import FilterPopover from "./FilterPopover.jsx";
import PreferencesPopover from "./PreferencesPopover.jsx";
import Tooltip from "../Tooltip.jsx";
import { useMateriasStore } from "../../store/materiasStore.js";
import {
  SearchIcon,
  TrashIcon,
  FilterIcon,
  GearIcon,
  ChevronDownIcon,
} from "../../icons/index.js";

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

  // Objeto de filtros avanzados activo para propagar a cada componente Subject
  const activeFilters = useMemo(
    () => ({
      selectedDias,
      horaMinimaFilter,
      horaMaximaFilter,
      selectedJornada,
    }),
    [selectedDias, horaMinimaFilter, horaMaximaFilter, selectedJornada],
  );

  // Letra activa en el scroll
  const [activeLetter, setActiveLetter] = useState(null);

  // Selectores atómicos: SOLO se re-renderiza cuando cambian sus valores específicos
  const focusedMateriaCodigo = useMateriasStore((s) => s.focusedMateriaCodigo);
  const focusTimestamp = useMateriasStore((s) => s.focusTimestamp);
  const collapseAllSubjects = useMateriasStore((s) => s.collapseAllSubjects);
  const requestClearSchedule = useMateriasStore((s) => s.requestClearSchedule);
  const resetMateriasSeleccionadas = useMateriasStore(
    (s) => s.resetMateriasSeleccionadas,
  );
  const clearHorariosGenerados = useMateriasStore(
    (s) => s.clearHorariosGenerados,
  );
  const setAllowManualBlocks = useMateriasStore((s) => s.setAllowManualBlocks);
  const clearAllowManualBlocksBySchedule = useMateriasStore(
    (s) => s.clearAllowManualBlocksBySchedule,
  );
  const unlockAllowManualBlocks = useMateriasStore(
    (s) => s.unlockAllowManualBlocks,
  );
  const materias = useMateriasStore((s) => s.materias || []);
  const manualBlocks = useMateriasStore((s) => s.manualBlocks || []);
  const materiasSeleccionadas = useMateriasStore(
    (s) => s.materiasSeleccionadas || {},
  );
  const gruposSeleccionados = useMateriasStore(
    (s) => s.gruposSeleccionados || {},
  );

  const hasExpandedSubjects = useMateriasStore(
    (s) => Object.keys(s.expandedSubjects || {}).length > 0,
  );

  const selectedCount = useMemo(() => {
    if (generationMode === "manual") {
      return Object.values(gruposSeleccionados).filter(
        (v) => v !== null && typeof v !== "undefined",
      ).length;
    }
    return Object.values(materiasSeleccionadas).filter(Boolean).length;
  }, [gruposSeleccionados, materiasSeleccionadas, generationMode]);

  const DIAS_LIST = useMemo(
    () => [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ],
    [],
  );

  // Mapa centralizado de celdas ocupadas en el horario (calculado 1 sola vez para todas las materias)
  const occupiedScheduleCells = useMemo(() => {
    if (generationMode !== "manual" || !gruposSeleccionados) return new Map();
    const map = new Map();
    const allMaterias = Array.isArray(materias) ? materias : [];

    Object.entries(gruposSeleccionados).forEach(([cod, numGrp]) => {
      if (!cod || !numGrp) return;
      const mat = allMaterias.find((m) => String(m.codigo) === String(cod));
      const g = mat?.grupos?.find((gr) => String(gr.numero) === String(numGrp));
      (g?.horarios || []).forEach((h) => {
        (h.dias || []).forEach((d) => {
          const dIdx = DIAS_LIST.indexOf(d);
          if (dIdx !== -1) {
            for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
              map.set(`${dIdx}-${hr}`, String(cod));
            }
          }
        });
      });
    });

    return map;
  }, [gruposSeleccionados, generationMode, materias, DIAS_LIST]);

  const occupiedManualCells = useMemo(() => {
    const set = new Set();
    if (manualBlocks && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        for (let k = 0; k < b.duracion; k++) {
          set.add(`${b.diaIndex}-${b.horaIndex + 6 + k}`);
        }
      });
    }
    return set;
  }, [manualBlocks]);

  const hasAnySelection = useMateriasStore((s) => {
    const hasSchedules =
      Array.isArray(s.horariosGenerados) && s.horariosGenerados.length > 0;
    if (hasSchedules) return true;
    if (generationMode === "manual") {
      return Object.values(s.gruposSeleccionados || {}).some(
        (v) => v !== null && typeof v !== "undefined",
      );
    }
    return Object.values(s.materiasSeleccionadas || {}).some(Boolean);
  });

  const handleReset = useCallback(() => {
    if (requestClearSchedule) {
      requestClearSchedule();
    } else {
      resetMateriasSeleccionadas();
      clearHorariosGenerados();
      setAllowManualBlocks(false);
      clearAllowManualBlocksBySchedule();
      unlockAllowManualBlocks();
    }
  }, [
    requestClearSchedule,
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
        const cod = String(materia.codigo);
        const isSel =
          generationMode === "manual"
            ? (gruposSeleccionados[cod] !== null &&
                typeof gruposSeleccionados[cod] !== "undefined") ||
              (gruposSeleccionados[materia.codigo] !== null &&
                typeof gruposSeleccionados[materia.codigo] !== "undefined")
            : Boolean(
                materiasSeleccionadas[cod] ||
                  materiasSeleccionadas[materia.codigo],
              );
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
              h.horaInicio >= horaMinimaFilter && h.horaFin <= horaMaximaFilter,
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

  const isProgrammaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef(null);
  const targetLetterRef = useRef(null);

  // Observer para detectar qué sección de letra está activa durante el scroll
  const handleScroll = useCallback(() => {
    // Si estamos en un scroll programático por clic en una letra, renovar el detector de finalización de scroll
    if (isProgrammaticScrollRef.current) {
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
      // Cuando no haya eventos de scroll por 150ms consecutivos, el scroll suave ha terminado totalmente
      scrollEndTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        if (targetLetterRef.current) {
          setActiveLetter(targetLetterRef.current);
        }
      }, 150);
      return;
    }

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

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  // Navegar y hacer scroll automáticamente hacia la materia seleccionada desde el horario
  useEffect(() => {
    if (!focusedMateriaCodigo || !focusTimestamp) return;

    // Verificar si la materia está oculta por los filtros actuales
    const isVisibleInCurrentFilter = finalFilteredMaterias.some(
      (m) => String(m.codigo) === String(focusedMateriaCodigo),
    );

    if (!isVisibleInCurrentFilter) {
      if (quickFilter !== "all") setQuickFilter("all");
      if (selectedLetter !== null) setSelectedLetter(null);
      if (searchTerm) onClearSearch();
    }

    // Scroll suave hacia la materia en el sidebar
    const timer = setTimeout(() => {
      const el = document.getElementById(
        `subject-card-${focusedMateriaCodigo}`,
      );
      const container = scrollContainerRef.current;
      if (el && container) {
        const targetRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset =
          targetRect.top +
          targetRect.height / 2 -
          (containerRect.top + containerRect.height / 2);
        container.scrollBy({ top: offset, behavior: "smooth" });
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [focusTimestamp, focusedMateriaCodigo]);

  // Scroll suave hacia una letra seleccionada con activación visual instantánea y retención estricta
  const scrollToLetter = (letter) => {
    const el = sectionRefs.current[letter];
    if (el && scrollContainerRef.current) {
      // Activar la letra instantáneamente sin retraso ni parpadeo
      setActiveLetter(letter);
      targetLetterRef.current = letter;
      isProgrammaticScrollRef.current = true;

      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }

      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Timeout de respaldo por si el scroll ya estaba en la posición y no dispara eventos
      scrollEndTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        setActiveLetter(letter);
      }, 200);
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
                       h-8"
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
              className={`h-8 w-8 rounded-md border flex items-center justify-center  cursor-pointer ${
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
              className={`h-8 w-8 rounded-md border flex items-center justify-center  cursor-pointer ${
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
                className={`px-2 py-1 rounded-md text-[11px] font-semibold  cursor-pointer ${
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
      <div className="flex-1  flex min-h-0 gap-1.5 pt-1">
        {/* Columna Fija A-Z a la izquierda más grande para clickear fácilmente */}
        {availableLetters.length > 0 && (
          <div className="w-8 flex flex-col items-center justify-between py-0.5 select-none flex-shrink-0 border-r border-zinc-200/70 dark:border-zinc-800/80 pr-1 h-full min-h-0 overflow-hidden">
            <div className="flex-1 w-full flex flex-col items-center space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar min-h-0">
              {availableLetters.map((letter) => {
                const isActive =
                  (activeLetter || availableLetters[0]) === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => scrollToLetter(letter)}
                    className={`w-5.5 h-5.5 rounded-md text-xs font-mono font-bold flex items-center justify-center cursor-pointer flex-shrink-0 ${
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

            {/* Sección Inferior: Colapsables + Limpiar selecciones */}
            <div className="w-full flex flex-col items-center gap-1.5 pt-1.5 flex-shrink-0">
              {/* Botón en vertical abajo del todo con texto volteado que solo sale cuando hay colapsables abiertos */}
              <AnimatePresence>
                {hasExpandedSubjects && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full flex flex-col items-stretch flex-shrink-0 overflow-hidden"
                  >
                    <Tooltip
                      content="Cerrar todos los grupos abiertos"
                      position="right"
                      className="w-full"
                    >
                      <button
                        type="button"
                        onClick={() => collapseAllSubjects?.()}
                        className="w-full py-2.5 px-0.5 rounded-md bg-zinc-100/90 hover:bg-red-50 dark:bg-zinc-800/90 dark:hover:bg-red-950/40 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700/80 hover:border-red-300 dark:hover:border-red-800/60 shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 group select-none"
                        aria-label="Cerrar colapsables"
                      >
                        <ChevronDownIcon className="w-3.5 h-3.5 rotate-180 transition-transform duration-150 group-hover:-translate-y-0.5 flex-shrink-0" />
                        <span
                          className="text-[8.5px] font-bold uppercase tracking-wider text-center select-none block"
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                          }}
                        >
                          Cerrar todos los colapsables
                        </span>
                      </button>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón solo icono de limpiar: SOLO aparece cuando hasAnySelection es true */}
              <AnimatePresence>
                {hasAnySelection && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.8 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full flex justify-center flex-shrink-0 overflow-hidden"
                  >
                    <Tooltip
                      content="Limpiar selecciones y horarios"
                      position="right"
                      className="w-full flex justify-center"
                    >
                      <button
                        type="button"
                        onClick={handleReset}
                        aria-label="Limpiar selecciones y horarios"
                        className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800/60 shadow-xs flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                      activeFilters={activeFilters}
                      occupiedScheduleCells={occupiedScheduleCells}
                      occupiedManualCells={occupiedManualCells}
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
