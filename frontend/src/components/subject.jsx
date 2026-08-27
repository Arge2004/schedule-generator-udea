import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useMateriasStore } from "../store/materiasStore";
import { GENERATION_MODES } from "../constants/sidebar";
import { ChevronDownIcon, GripIcon, InfoIcon } from "../icons/index.js";
import Tooltip from "./Tooltip.jsx";
import SelectionParticles from "./SelectionParticles.jsx";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// Subcomponente aislado para los grupos expandidos: SOLO se monta y procesa cuando el acordeón está abierto
const SubjectAccordionGroups = memo(function SubjectAccordionGroups({
  materia,
  grupoSeleccionado,
  highlightedGrupo,
  activeFilters = {},
  grupoRefs,
  onGrupoSelect,
  showGroupParticles,
}) {
  const gruposSeleccionados = useMateriasStore((s) => s.gruposSeleccionados);
  const manualBlocks = useMateriasStore((s) => s.manualBlocks);
  const materias = useMateriasStore((s) => s.materias);

  const occupiedScheduleCells = useMemo(() => {
    if (!gruposSeleccionados) return new Map();
    const map = new Map();
    const allMaterias = Array.isArray(materias) ? materias : materia ? [materia] : [];

    Object.entries(gruposSeleccionados).forEach(([cod, numGrp]) => {
      if (!cod || !numGrp) return;
      const mat = allMaterias.find((m) => String(m.codigo) === String(cod));
      const g = mat?.grupos?.find((gr) => String(gr.numero) === String(numGrp));
      (g?.horarios || []).forEach((h) => {
        (h.dias || []).forEach((d) => {
          const dIdx = DIAS.indexOf(d);
          if (dIdx !== -1) {
            for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
              map.set(`${dIdx}-${hr}`, String(cod));
            }
          }
        });
      });
    });

    return map;
  }, [gruposSeleccionados, materias, materia]);

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

  const checkGroupConflict = useCallback(
    (grp) => {
      if (!grp || !grp.horarios || grp.horarios.length === 0) return false;
      return grp.horarios.some((horario) => {
        return (horario.dias || []).some((dia) => {
          const diaIndex = DIAS.indexOf(dia);
          if (diaIndex === -1) return false;
          for (let hr = horario.horaInicio; hr < horario.horaFin; hr++) {
            const cellKey = `${diaIndex}-${hr}`;
            const occupiedCod = occupiedScheduleCells.get(cellKey);
            if (occupiedCod && String(occupiedCod) !== String(materia?.codigo)) {
              return true;
            }
            if (occupiedManualCells.has(cellKey)) {
              return true;
            }
          }
          return false;
        });
      });
    },
    [occupiedScheduleCells, occupiedManualCells, materia?.codigo],
  );

  const hasActiveAdvancedFilters = Boolean(
    (activeFilters.selectedDias && activeFilters.selectedDias.length > 0) ||
      (activeFilters.horaMinimaFilter && activeFilters.horaMinimaFilter > 6) ||
      (activeFilters.horaMaximaFilter && activeFilters.horaMaximaFilter < 22) ||
      activeFilters.selectedJornada,
  );

  const checkGrupoMatchesFilter = useCallback(
    (grupo) => {
      if (!hasActiveAdvancedFilters || !grupo?.horarios) return true;

      if (activeFilters.selectedDias?.length > 0) {
        const hasDay = grupo.horarios.some((h) =>
          (h.dias || []).some((d) => activeFilters.selectedDias.includes(d)),
        );
        if (!hasDay) return false;
      }

      const minH = activeFilters.horaMinimaFilter ?? 6;
      const maxH = activeFilters.horaMaximaFilter ?? 22;
      if (minH > 6 || maxH < 22) {
        const hasValidHour = grupo.horarios.some(
          (h) => h.horaInicio >= minH && h.horaFin <= maxH,
        );
        if (!hasValidHour) return false;
      }

      if (activeFilters.selectedJornada) {
        const hasJornada = grupo.horarios.some((h) => {
          if (activeFilters.selectedJornada === "manana") return h.horaInicio < 12;
          if (activeFilters.selectedJornada === "tarde")
            return h.horaInicio >= 12 && h.horaInicio < 18;
          if (activeFilters.selectedJornada === "noche") return h.horaInicio >= 18;
          return true;
        });
        if (!hasJornada) return false;
      }

      return true;
    },
    [hasActiveAdvancedFilters, activeFilters],
  );

  return (
    <>
      {(materia.grupos || []).map((grupo, idx) => {
        const sinCupos = grupo.cupoDisponible === 0;
        const isGrupoSelected = grupoSeleccionado === grupo.numero;
        const tieneConflicto = checkGroupConflict(grupo);
        const disabled = sinCupos || tieneConflicto;
        const isFocusedGrupo =
          highlightedGrupo && String(highlightedGrupo) === String(grupo.numero);
        const matchesFilter = checkGrupoMatchesFilter(grupo);
        const isFilteredMatch =
          hasActiveAdvancedFilters &&
          matchesFilter &&
          !isGrupoSelected &&
          !isFocusedGrupo;
        const isFilteredNonMatch =
          hasActiveAdvancedFilters &&
          !matchesFilter &&
          !isGrupoSelected &&
          !isFocusedGrupo;

        return (
          <div
            key={idx}
            ref={(el) => {
              if (el) grupoRefs.current[String(grupo.numero)] = el;
            }}
            onClick={
              disabled ? undefined : () => onGrupoSelect(grupo.numero, tieneConflicto)
            }
            className={`relative p-2 rounded-md border text-xs duration-200 flex items-center justify-between gap-2.5 transition-all ${
              isFocusedGrupo
                ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-zinc-900 border-primary bg-primary/20 text-primary dark:text-blue-100 font-bold shadow-md scale-[1.02]"
                : disabled
                  ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40"
                  : isGrupoSelected
                    ? "border-primary bg-primary/10 text-primary dark:text-blue-100 font-semibold cursor-pointer shadow-2xs ring-1 ring-primary/30"
                    : isFilteredMatch
                      ? "border-purple-500 dark:border-purple-400/90 ring-1 ring-purple-500/20 bg-white dark:bg-zinc-900 hover:border-purple-600 dark:hover:border-purple-300 text-zinc-900 dark:text-zinc-100 cursor-pointer shadow-2xs"
                      : isFilteredNonMatch
                        ? "opacity-40 hover:opacity-75 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 cursor-pointer"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
            }`}
          >
            {/* EXTREMO IZQUIERDO: Check / Radio Indicator + Badge Grupo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    isGrupoSelected
                      ? "border-primary bg-primary text-white scale-110"
                      : isFilteredMatch
                        ? "border-purple-500 dark:border-purple-400 bg-white dark:bg-zinc-900 text-purple-600"
                        : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-transparent"
                  }`}
                >
                  {isGrupoSelected ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : isFilteredMatch ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                  ) : null}
                </div>
                {showGroupParticles === grupo.numero && (
                  <SelectionParticles
                    color="#1392ec"
                    count={10}
                    radius={22}
                  />
                )}
              </div>

              <span
                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                  isGrupoSelected
                    ? "bg-primary text-white"
                    : isFilteredMatch
                      ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs font-bold"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                }`}
              >
                G{grupo.numero}
              </span>
            </div>

            {/* CENTRO: Horarios divididos en filas por cada bloque */}
            <div className="flex-1 min-w-0 flex flex-col space-y-0.5 text-left font-mono">
              {grupo.horarios && grupo.horarios.length > 0 ? (
                grupo.horarios.map((h, hIdx) => {
                  const start = String(h.horaInicio).padStart(2, "0");
                  const end = String(h.horaFin).padStart(2, "0");

                  return (
                    <div
                      key={hIdx}
                      className="flex items-center gap-1 text-[10.5px] text-zinc-700 dark:text-zinc-300 truncate"
                    >
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {(h.dias || []).map((d, dIdx) => {
                          const isMatchingDay =
                            activeFilters.selectedDias?.includes(d);
                          return (
                            <React.Fragment key={d}>
                              {dIdx > 0 && ", "}
                              <span
                                className={
                                  isMatchingDay
                                    ? "px-1 py-0.2 rounded font-bold text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/50"
                                    : ""
                                }
                              >
                                {d.slice(0, 3)}
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {start}:00-{end}:00
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className="text-[10px] text-zinc-400">
                  Sin horario
                </span>
              )}
            </div>

            {/* EXTREMO DERECHO: Badge de Cupos + Botón de Info Cuadrado con Tooltip Reutilizable */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border tabular-nums ${
                  sinCupos
                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60"
                    : tieneConflicto
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                      : "bg-zinc-100 dark:bg-zinc-800 text-primary dark:text-blue-400 border border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {grupo.cupoDisponible}/{grupo.cupoMaximo}
              </span>

              <Tooltip
                position="top"
                content={
                  <div className="space-y-2 w-56">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-300 block mb-0.5">
                        Docente
                      </span>
                      <span className="text-xs font-semibold text-white block leading-snug">
                        {grupo.profesor || "Docente por asignar"}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-800">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-300 block mb-0.5">
                        Aula / Salón
                      </span>
                      <span className="text-xs font-mono text-primary dark:text-blue-400 font-bold block">
                        {grupo.aula || "Por asignar"}
                      </span>
                    </div>
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer flex items-center justify-center"
                  aria-label="Información del grupo"
                >
                  <InfoIcon className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </>
  );
});

function SubjectComponent({
  materia,
  generationMode,
  dragEnabled = true,
  activeFilters = {},
}) {
  const materiaCodigo = materia?.codigo ? String(materia.codigo) : "";

  // Selectores atómicos: SOLO re-renderizan si cambia el estado específico de ESTA materia
  const isSelected = useMateriasStore(
    (s) =>
      Boolean(s.materiasSeleccionadas?.[materiaCodigo]) ||
      Boolean(s.materiasSeleccionadas?.[materia?.codigo]),
  );
  const grupoSeleccionado = useMateriasStore(
    (s) =>
      s.gruposSeleccionados?.[materiaCodigo] ??
      s.gruposSeleccionados?.[materia?.codigo],
  );
  const isExpanded = useMateriasStore(
    (s) => Boolean(s.expandedSubjects?.[materiaCodigo]),
  );
  const toggleSubjectExpanded = useMateriasStore(
    (s) => s.toggleSubjectExpanded,
  );
  const toggleMateriaSelected = useMateriasStore(
    (s) => s.toggleMateriaSelected,
  );
  const selectGrupo = useMateriasStore((s) => s.selectGrupo);
  const setDraggingMateria = useMateriasStore((s) => s.setDraggingMateria);
  const clearDragState = useMateriasStore((s) => s.clearDragState);
  const focusedMateriaCodigo = useMateriasStore((s) => s.focusedMateriaCodigo);
  const focusedGrupoNumero = useMateriasStore((s) => s.focusedGrupoNumero);
  const focusTimestamp = useMateriasStore((s) => s.focusTimestamp);
  const shakeMateriaCodigo = useMateriasStore((s) => s.shakeMateriaCodigo);
  const shakeTimestamp = useMateriasStore((s) => s.shakeTimestamp);

  const setIsExpanded = (val) => toggleSubjectExpanded?.(materiaCodigo, val);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightedGrupo, setHighlightedGrupo] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showSelectParticles, setShowSelectParticles] = useState(false);
  const [showGroupParticles, setShowGroupParticles] = useState(null);
  const grupoRefs = useRef({});

  const lastShakeTimestampRef = useRef(shakeTimestamp || 0);

  useEffect(() => {
    if (
      shakeTimestamp &&
      shakeTimestamp !== lastShakeTimestampRef.current &&
      shakeMateriaCodigo &&
      String(shakeMateriaCodigo) === String(materia?.codigo)
    ) {
      lastShakeTimestampRef.current = shakeTimestamp;
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shakeMateriaCodigo, shakeTimestamp, materia?.codigo]);

  const centerFocusedGrupo = useCallback((grupoNum) => {
    if (!grupoNum) return;
    const targetEl = grupoRefs.current[String(grupoNum)];
    if (!targetEl) return;

    const containerEl = targetEl.closest(".overflow-y-auto");
    if (!containerEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    const targetCenter = targetRect.top + targetRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const offset = targetCenter - containerCenter;

    if (Math.abs(offset) > 4) {
      containerEl.scrollBy({
        top: offset,
        behavior: "smooth",
      });
    }
  }, []);

  // Auto-expandir, resaltar y centrar materia y grupo cada vez que se hace clic desde el horario
  useEffect(() => {
    if (
      focusedMateriaCodigo &&
      String(focusedMateriaCodigo) === String(materia?.codigo) &&
      focusTimestamp
    ) {
      setIsExpanded(true);
      setIsHighlighted(true);
      if (focusedGrupoNumero) {
        const grp = String(focusedGrupoNumero);
        setHighlightedGrupo(grp);

        const t1 = setTimeout(() => centerFocusedGrupo(grp), 40);
        const t2 = setTimeout(() => centerFocusedGrupo(grp), 180);
        const t3 = setTimeout(() => centerFocusedGrupo(grp), 360);

        const clearTimer = setTimeout(() => {
          setIsHighlighted(false);
          setHighlightedGrupo(null);
        }, 1800);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(clearTimer);
        };
      }

      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [
    focusedMateriaCodigo,
    focusedGrupoNumero,
    focusTimestamp,
    materia?.codigo,
    centerFocusedGrupo,
  ]);

  const isManualMode = generationMode === GENERATION_MODES.MANUAL;

  // Contar grupos disponibles vs totales
  const totalGrupos = materia?.grupos?.length || 0;
  const gruposConCupo = useMemo(() => {
    if (!materia?.grupos) return 0;
    return materia.grupos.filter((g) => (g.cupoDisponible || 0) > 0).length;
  }, [materia]);

  const totalCupos = useMemo(() => {
    if (!materia?.grupos || materia.grupos.length === 0) return 0;
    return materia.grupos.reduce((acc, g) => acc + (g.cupoDisponible || 0), 0);
  }, [materia]);

  const hasZeroCuposGlobally = totalCupos === 0;

  const handleChange = () => {
    if (materia?.codigo) {
      const willBeSelected = !isSelected;
      toggleMateriaSelected(materia.codigo);
      if (willBeSelected) {
        setShowSelectParticles(true);
        setTimeout(() => setShowSelectParticles(false), 500);
      } else {
        setIsExpanded(false);
      }
    }
  };

  const handleGrupoSelectCallback = (numeroGrupo, tieneConflicto) => {
    if (grupoSeleccionado === numeroGrupo) {
      selectGrupo(materia.codigo, null);
      toggleMateriaSelected(materia.codigo);
      return;
    }

    if (tieneConflicto) {
      const { notify } = useMateriasStore.getState();
      if (notify)
        notify("⚠️ No se puede seleccionar: conflicto con otra materia");
      toast.error("Conflicto con otra materia en el horario");
      return;
    }

    selectGrupo(materia.codigo, numeroGrupo);
    setShowGroupParticles(numeroGrupo);
    setTimeout(() => setShowGroupParticles(null), 500);

    if (!isSelected) {
      toggleMateriaSelected(materia.codigo);
    }
  };

  const handleItemClick = () => {
    if (isManualMode && !dragEnabled) {
      setIsExpanded(!isExpanded);
    } else if (!isManualMode && !hasZeroCuposGlobally) {
      handleChange();
    }
  };

  const handleDragStart = (e) => {
    if (!isManualMode) {
      e.preventDefault();
      return;
    }

    const hasAnyHorario = (materia?.grupos || []).some(
      (g) => g.horarios && g.horarios.length > 0,
    );
    if (!hasAnyHorario) {
      e.preventDefault();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error("Esta materia no tiene horarios registrados");
      return;
    }

    if (hasZeroCuposGlobally) {
      e.preventDefault();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error("Esta materia no tiene cupos disponibles");
      return;
    }

    // Comprobar conflictos con el estado global en el momento exacto del drag
    const storeState = useMateriasStore.getState();
    const currentGrupos = storeState.gruposSeleccionados || {};
    const allManual = storeState.manualBlocks || [];
    const allMaterias = storeState.materias || [];

    const occupiedByOthers = new Set();
    Object.entries(currentGrupos).forEach(([cod, numGrp]) => {
      if (!cod || !numGrp || String(cod) === String(materia?.codigo)) return;
      const mat = allMaterias.find((m) => String(m.codigo) === String(cod));
      const g = mat?.grupos?.find((gr) => String(gr.numero) === String(numGrp));
      (g?.horarios || []).forEach((h) => {
        (h.dias || []).forEach((d) => {
          const dIdx = DIAS.indexOf(d);
          if (dIdx !== -1) {
            for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
              occupiedByOthers.add(`${dIdx}-${hr}`);
            }
          }
        });
      });
    });

    allManual.forEach((b) => {
      for (let k = 0; k < b.duracion; k++) {
        occupiedByOthers.add(`${b.diaIndex}-${b.horaIndex + 6 + k}`);
      }
    });

    const availableGroups = (materia.grupos || []).filter((g) => {
      if (grupoSeleccionado && String(g.numero) === String(grupoSeleccionado)) {
        return false;
      }
      if (typeof g.cupoDisponible === "number" && g.cupoDisponible <= 0) {
        return false;
      }
      if (!g.horarios || g.horarios.length === 0) return false;
      return !g.horarios.some((horario) => {
        return (horario.dias || []).some((dia) => {
          const diaIndex = DIAS.indexOf(dia);
          if (diaIndex === -1) return false;
          for (let hr = horario.horaInicio; hr < horario.horaFin; hr++) {
            if (occupiedByOthers.has(`${diaIndex}-${hr}`)) {
              return true;
            }
          }
          return false;
        });
      });
    });

    if (availableGroups.length === 0) {
      e.preventDefault();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error("Todos los grupos tienen conflicto con tu horario actual");
      return;
    }

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", materia.codigo);

    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      const dragNode = document.createElement("div");
      dragNode.style.position = "fixed";
      dragNode.style.top = "-9999px";
      dragNode.style.left = "-9999px";
      dragNode.style.zIndex = "999999";
      dragNode.style.opacity = "1";
      dragNode.style.pointerEvents = "none";
      dragNode.style.background = isDark ? "#18181b" : "#ffffff";
      dragNode.style.color = isDark ? "#f4f4f5" : "#09090b";
      dragNode.style.border = isDark
        ? "1.5px solid #3f3f46"
        : "1.5px solid #cbd5e1";
      dragNode.style.borderRadius = "8px";
      dragNode.style.padding = "7px 12px";
      dragNode.style.boxShadow =
        "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)";
      dragNode.style.display = "flex";
      dragNode.style.alignItems = "center";
      dragNode.style.gap = "8px";
      dragNode.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
      dragNode.style.fontSize = "12px";
      dragNode.style.fontWeight = "600";
      dragNode.style.whiteSpace = "nowrap";

      dragNode.innerHTML = `
        <span style="
          background: #1392ec;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
        ">#${materia.codigo || ""}</span>
        <span>${materia.nombre}</span>
      `;

      document.body.appendChild(dragNode);
      e.dataTransfer.setDragImage(dragNode, 24, 18);
      setTimeout(() => {
        if (document.body.contains(dragNode)) {
          document.body.removeChild(dragNode);
        }
      }, 0);
    }

    setTimeout(() => {
      setDraggingMateria({
        codigo: materia.codigo,
        nombre: materia.nombre,
        grupos: materia.grupos,
      });
    }, 0);
  };

  const handleDragEnd = () => {
    const state = useMateriasStore.getState();
    if (!state.lastDropSuccessful && state.draggingMateria?.codigo) {
      state.triggerShakeMateria?.(state.draggingMateria.codigo);
    }
    state.clearDragState?.();
  };

  const isCardActive =
    (isManualMode && grupoSeleccionado) || (!isManualMode && isSelected);

  return (
    <motion.div
      id={`subject-card-${materia?.codigo}`}
      animate={isShaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className={`rounded-md border select-none duration-200 ${
        isHighlighted
          ? "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
          : isCardActive
            ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {/* Cabecera de la materia centrada verticalmente */}
      <div
        draggable={
          isManualMode &&
          dragEnabled &&
          materia?.grupos?.length > 0 &&
          !hasZeroCuposGlobally
        }
        onDragStart={
          isManualMode && dragEnabled && !hasZeroCuposGlobally
            ? handleDragStart
            : undefined
        }
        onDragEnd={isManualMode && dragEnabled ? handleDragEnd : undefined}
        onClick={handleItemClick}
        className="p-2.5 flex items-center justify-between gap-2.5 cursor-pointer"
      >
        <div className="flex-1 min-w-0 flex flex-col text-left space-y-1">
          {/* Fila 1: Badges superiores (Código gris, Grupos disp/total, Sin cupos, Grupo elegido en AZUL) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Badge gris con código */}
            {materia?.codigo && (
              <span className="font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                #{materia.codigo}
              </span>
            )}

            {/* Badge de grupos disponibles/totales solo números */}
            <span
              className="font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 tabular-nums"
              title={`${gruposConCupo} de ${totalGrupos} grupos con cupos`}
            >
              {gruposConCupo}/{totalGrupos}
            </span>

            {/* Badge Sin Cupos si aplica */}
            {hasZeroCuposGlobally && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/60">
                Sin cupos
              </span>
            )}

            {/* Badge de grupo seleccionado en AZUL */}
            {isManualMode && grupoSeleccionado && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                G{grupoSeleccionado}
              </span>
            )}
          </div>

          {/* Fila 2: Nombre de la Materia */}
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug truncate pr-1">
            {materia?.nombre || "Materia sin nombre"}
          </h3>
        </div>

        {/* Lado Derecho: Chevron / Checkbox Personalizado / Drag indicator (Perfectamente Centrado) */}
        <div className="flex items-center justify-center gap-1.5 flex-shrink-0 self-center">
          {isManualMode ? (
            dragEnabled ? (
              <Tooltip content="Arrastrar materia al horario" position="top">
                <div
                  className="p-1 rounded-md text-zinc-400 hover:text-primary cursor-grab"
                  aria-label="Arrastrar materia al horario"
                >
                  <GripIcon className="w-4 h-4" />
                </div>
              </Tooltip>
            ) : (
              <Tooltip
                content={isExpanded ? "Colapsar grupos" : "Expandir grupos"}
                position="top"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className={`p-1 rounded-md transition-transform duration-200 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ${
                    isExpanded ? "rotate-180" : "rotate-0"
                  }`}
                  aria-label={isExpanded ? "Colapsar" : "Expandir"}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            )
          ) : (
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasZeroCuposGlobally) handleChange();
                }}
                disabled={hasZeroCuposGlobally}
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-2xs scale-105"
                    : "bg-white dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 hover:border-primary/80 dark:hover:border-primary/80"
                } ${hasZeroCuposGlobally ? "opacity-30 cursor-not-allowed" : ""}`}
                aria-label={`Seleccionar ${materia?.nombre}`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                  </svg>
                )}
              </button>
              {showSelectParticles && (
                <SelectionParticles color="#1392ec" count={12} radius={26} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desplegable de Grupos: Acordeón optimizado con subcomponente aislado */}
      <AnimatePresence initial={false}>
        {isManualMode && !dragEnabled && materia?.grupos && isExpanded && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { duration: 0.15, ease: "easeOut" },
              opacity: { duration: 0.15, ease: "easeOut" },
            }}
            onAnimationComplete={() => {
              if (highlightedGrupo) {
                centerFocusedGrupo(highlightedGrupo);
              }
            }}
            className="px-2 pb-2.5 pt-0.5 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60"
          >
            <SubjectAccordionGroups
              materia={materia}
              grupoSeleccionado={grupoSeleccionado}
              highlightedGrupo={highlightedGrupo}
              activeFilters={activeFilters}
              grupoRefs={grupoRefs}
              onGrupoSelect={handleGrupoSelectCallback}
              showGroupParticles={showGroupParticles}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(SubjectComponent, (prev, next) => {
  return (
    prev.materia?.codigo === next.materia?.codigo &&
    prev.generationMode === next.generationMode &&
    prev.dragEnabled === next.dragEnabled &&
    prev.activeFilters === next.activeFilters
  );
});
