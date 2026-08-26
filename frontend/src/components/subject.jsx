import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMateriasStore } from "../store/materiasStore";
import { GENERATION_MODES } from "../constants/sidebar";
import { ChevronDownIcon, GripIcon, InfoIcon } from "../icons/index.js";
import Tooltip from "./Tooltip.jsx";

export default function Subject({
  materia,
  generationMode,
  dragEnabled = true,
}) {
  const {
    materiasSeleccionadas,
    toggleMateriaSelected,
    gruposSeleccionados,
    selectGrupo,
    resetKey,
    setDraggingMateria,
    materias,
    manualBlocks,
  } = useMateriasStore();

  const isSelected = !!materiasSeleccionadas[materia?.codigo];
  const [isExpanded, setIsExpanded] = useState(false);
  const grupoSeleccionado = gruposSeleccionados[materia?.codigo];
  const [celdasMateriaHorario, setCeldasMateriaHorario] = useState(new Map());

  const isManualMode = generationMode === GENERATION_MODES.MANUAL;

  // Sincronizar celdas ocupadas con los grupos seleccionados
  useEffect(() => {
    if (isManualMode && gruposSeleccionados) {
      const diasArr = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ];
      const horasArr = Array.from({ length: 16 }, (_, i) => i + 6);
      const map = new Map();
      let todasMaterias = [];
      if (materias && Array.isArray(materias)) {
        todasMaterias = materias;
      } else if (materia) {
        todasMaterias = [materia];
      }

      Object.entries(gruposSeleccionados).forEach(([codigo, grupoNum]) => {
        if (!codigo || !grupoNum) return;
        const mat = todasMaterias.find((m) => m.codigo === codigo);
        if (!mat) return;
        const grupo = mat.grupos?.find((g) => g.numero === grupoNum);
        if (!grupo || !grupo.horarios) return;

        grupo.horarios.forEach((horario) => {
          horario.dias?.forEach((dia) => {
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
    } else {
      setCeldasMateriaHorario(new Map());
    }
  }, [gruposSeleccionados, isManualMode, materia, materias]);

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
      toggleMateriaSelected(materia.codigo);
      if (isSelected) {
        setIsExpanded(false);
      }
    }
  };

  const handleGrupoSelect = (numeroGrupo) => {
    if (grupoSeleccionado === numeroGrupo) {
      selectGrupo(materia.codigo, null);
      toggleMateriaSelected(materia.codigo);
      return;
    }

    const dias = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const horas = Array.from({ length: 16 }, (_, i) => i + 6);
    const grupo = materia.grupos?.find((g) => g.numero === numeroGrupo);
    let tieneConflicto = false;

    if (grupo) {
      const occupiedManual = new Set();
      if (manualBlocks && manualBlocks.length > 0) {
        manualBlocks.forEach((b) => {
          for (let k = 0; k < b.duracion; k++) {
            occupiedManual.add(`${b.diaIndex}-${b.horaIndex + k}`);
          }
        });
      }

      grupo.horarios?.forEach((horario) => {
        horario.dias?.forEach((dia) => {
          const diaIndex = dias.indexOf(dia);
          if (diaIndex !== -1) {
            const horaInicioIdx = horas.indexOf(horario.horaInicio);
            const duracion = horario.horaFin - horario.horaInicio;
            for (let i = 0; i < duracion; i++) {
              const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
              const materiaEnCeldaCodigo =
                celdasMateriaHorario.get(celdaKey);
              if (
                (materiaEnCeldaCodigo &&
                  materiaEnCeldaCodigo !== materia.codigo) ||
                occupiedManual.has(celdaKey)
              ) {
                tieneConflicto = true;
                break;
              }
            }
          }
        });
      });
    }

    if (tieneConflicto) {
      const { notify } = useMateriasStore.getState();
      if (notify)
        notify("⚠️ No se puede seleccionar: conflicto con otra materia");
      return;
    }

    selectGrupo(materia.codigo, numeroGrupo);
    if (!isSelected) {
      toggleMateriaSelected(materia.codigo);
    }
  };

  useEffect(() => {
    setIsExpanded(false);
  }, [resetKey]);

  useEffect(() => {
    if (dragEnabled) {
      setIsExpanded(false);
    }
  }, [dragEnabled]);

  const handleItemClick = () => {
    if (isManualMode && !dragEnabled) {
      setIsExpanded(!isExpanded);
    } else if (!isManualMode && !hasZeroCuposGlobally) {
      handleChange();
    }
  };

  const handleDragStart = (e) => {
    if (hasZeroCuposGlobally || !isManualMode || !materia?.grupos?.length) {
      e.preventDefault();
      return;
    }
    setDraggingMateria({
      codigo: materia.codigo,
      nombre: materia.nombre,
      grupos: materia.grupos,
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", materia.codigo);
  };

  const isCardActive =
    (isManualMode && grupoSeleccionado) || (!isManualMode && isSelected);

  return (
    <div
      className={`rounded-md border transition-all duration-150 select-none ${
        isCardActive
          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20"
          : hasZeroCuposGlobally
            ? "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/30 opacity-60"
            : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700"
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
        onClick={handleItemClick}
        className="p-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
      >
        <div className="flex-1 min-w-0 flex flex-col text-left space-y-1">
          {/* Fila 1: Badges superiores (Código gris, Grupos disp/total, Sin cupos, Grupo elegido en AZUL) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Badge gris con código */}
            <span className="font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
              #{materia?.codigo}
            </span>

            {/* Badge de grupos disponibles/totales solo números */}
            <span
              className="font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 tabular-nums"
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
                  className="p-1 rounded-md text-zinc-400 hover:text-primary transition-colors cursor-grab"
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
                  className="p-1 rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label={isExpanded ? "Colapsar grupos" : "Expandir grupos"}
                >
                  <ChevronDownIcon
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
              </Tooltip>
            )
          ) : (
            /* Checkbox Personalizado: Fondo blanco en light mode, azul al marcarse y centrado verticalmente */
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={hasZeroCuposGlobally}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasZeroCuposGlobally) {
                  handleChange();
                }
              }}
              className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-2xs"
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
          )}
        </div>
      </div>

      {/* Desplegable de Grupos: Acordeón */}
      <AnimatePresence initial={false}>
        {isManualMode && !dragEnabled && materia?.grupos && isExpanded && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="px-2 pb-2.5 pt-0.5 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30"
          >
            {materia.grupos.map((grupo, idx) => {
              const sinCupos = grupo.cupoDisponible === 0;
              const isGrupoSelected = grupoSeleccionado === grupo.numero;

              // Validar conflicto de horario
              let tieneConflicto = false;
              const diasArr = [
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo",
              ];
              const horasArr = Array.from({ length: 16 }, (_, i) => i + 6);
              const occupiedManual = new Set();
              if (manualBlocks && manualBlocks.length > 0) {
                manualBlocks.forEach((b) => {
                  for (let k = 0; k < b.duracion; k++) {
                    occupiedManual.add(`${b.diaIndex}-${b.horaIndex + k}`);
                  }
                });
              }

              if (grupo.horarios) {
                for (const horario of grupo.horarios) {
                  for (const dia of horario.dias || []) {
                    const diaIndex = diasArr.indexOf(dia);
                    if (diaIndex === -1) continue;
                    const horaInicioIdx = horasArr.indexOf(horario.horaInicio);
                    const duracion = horario.horaFin - horario.horaInicio;
                    for (let i = 0; i < duracion; i++) {
                      const celdaKey = `${diaIndex}-${horaInicioIdx + i}`;
                      const materiaEnCeldaCodigo =
                        celdasMateriaHorario.get(celdaKey);
                      if (
                        (materiaEnCeldaCodigo &&
                          materiaEnCeldaCodigo !== materia.codigo) ||
                        occupiedManual.has(celdaKey)
                      ) {
                        tieneConflicto = true;
                        break;
                      }
                    }
                  }
                }
              }

              const disabled = sinCupos || tieneConflicto;

              return (
                <div
                  key={idx}
                  onClick={
                    disabled
                      ? undefined
                      : () => handleGrupoSelect(grupo.numero)
                  }
                  className={`relative p-2 rounded-md border text-xs transition-all duration-150 flex items-center justify-between gap-2.5 ${
                    disabled
                      ? "opacity-40 cursor-not-allowed border-zinc-200/50 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/20"
                      : isGrupoSelected
                        ? "border-primary bg-primary/10 text-primary dark:text-blue-100 font-semibold cursor-pointer shadow-2xs ring-1 ring-primary/30"
                        : "border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  }`}
                >
                  {/* EXTREMO IZQUIERDO: Check / Radio Indicator + Badge Grupo */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                        isGrupoSelected
                          ? "border-primary bg-primary text-white"
                          : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-transparent"
                      }`}
                    >
                      {isGrupoSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                        isGrupoSelected
                          ? "bg-primary text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
                      }`}
                    >
                      G{grupo.numero}
                    </span>
                  </div>

                  {/* CENTRO: Horarios divididos en filas por cada bloque */}
                  <div className="flex-1 min-w-0 flex flex-col space-y-0.5 text-left font-mono">
                    {grupo.horarios && grupo.horarios.length > 0 ? (
                      grupo.horarios.map((h, hIdx) => {
                        const diasStr = (h.dias || [])
                          .map((d) => d.slice(0, 3))
                          .join(", ");
                        const start = String(h.horaInicio).padStart(2, "0");
                        const end = String(h.horaFin).padStart(2, "0");

                        return (
                          <div
                            key={hIdx}
                            className="flex items-center gap-1 text-[10.5px] text-zinc-700 dark:text-zinc-300 truncate"
                          >
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {diasStr}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {start}:00-{end}:00
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-zinc-400">Sin horario</span>
                    )}
                  </div>

                  {/* EXTREMO DERECHO: Badge de Cupos + Botón de Info Cuadrado con Tooltip Reutilizable */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Badge de Cupos */}
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border tabular-nums ${
                        sinCupos
                          ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60"
                          : tieneConflicto
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                            : "bg-zinc-100 dark:bg-zinc-800 text-primary dark:text-blue-400 border-zinc-200/60 dark:border-zinc-700/60"
                      }`}
                    >
                      {grupo.cupoDisponible}/{grupo.cupoMaximo}
                    </span>

                    {/* Botón de Información Cuadrado envuelto en Tooltip */}
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
                        className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                        aria-label="Información del grupo"
                      >
                        <InfoIcon className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
