import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMateriasStore } from "../../store/materiasStore";
import { DIAS, HORAS, getSubjectColor } from "../../constants/schedule";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "../../icons";

/**
 * Vista de Horario completa para dispositivos móviles.
 * - Muestra un solo día a la vez con columna de horas a la izquierda.
 * - Soporta navegación por swipe con física de rebote elástico.
 * - Barra flotante inferior para navegación rápida entre días y retorno al sidebar.
 * - En modo automático, permite alternar entre los horarios generados.
 */
export default function MobileScheduleView() {
  const [activeDay, setActiveDay] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedBlockDetails, setSelectedBlockDetails] = useState(null);
  const [showMiniPreviewPopup, setShowMiniPreviewPopup] = useState(false);
  const scrollContainerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const isFirstMountRef = useRef(true);

  const {
    materias,
    gruposSeleccionados,
    horariosGenerados,
    horarioActualIndex,
    setHorarioActualIndex,
    manualBlocks,
    deleteMateriaFromSchedule,
    removeManualBlock,
    setMobileActiveView,
    setMobileTransition,
  } = useMateriasStore();

  const isManualMode =
    (!horariosGenerados || horariosGenerados.length === 0) &&
    gruposSeleccionados &&
    Object.keys(gruposSeleccionados).length > 0;

  // Obtener todas las clases activas en el horario actual
  const allCurrentClasses = useMemo(() => {
    const list = [];

    // 1. Modo manual
    if (isManualMode && materias) {
      Object.entries(gruposSeleccionados).forEach(
        ([codigoMateria, numeroGrupo]) => {
          if (numeroGrupo === null || numeroGrupo === undefined) return;
          const mat = materias.find(
            (m) => String(m.codigo) === String(codigoMateria),
          );
          if (!mat) return;
          const grp = (mat.grupos || []).find((g) => g.numero === numeroGrupo);
          if (!grp) return;
          const color = getSubjectColor(mat.codigo || mat.nombre);

          (grp.horarios || []).forEach((h) => {
            (h.dias || []).forEach((dia) => {
              const diaIndex = DIAS.indexOf(dia);
              if (diaIndex !== -1) {
                list.push({
                  id: `man-${mat.codigo}-${grp.numero}-${dia}-${h.horaInicio}`,
                  codigoMateria: mat.codigo,
                  nombreMateria: mat.nombre,
                  numeroGrupo: grp.numero,
                  profesor: grp.profesor || "Sin profesor asignado",
                  aula: h.aula || "Por definir",
                  dia,
                  diaIndex,
                  horaInicio: h.horaInicio,
                  horaFin: h.horaFin,
                  duracion: h.horaFin - h.horaInicio,
                  color,
                  isManual: false,
                });
              }
            });
          });
        },
      );
    } else if (horariosGenerados && horariosGenerados.length > 0) {
      // 2. Modo automático
      const schedule =
        horariosGenerados[horarioActualIndex] || horariosGenerados[0];
      if (schedule && schedule.grupos) {
        schedule.grupos.forEach((g) => {
          const color = getSubjectColor(g.codigoMateria || g.nombreMateria);
          (g.horarios || []).forEach((h) => {
            (h.dias || []).forEach((dia) => {
              const diaIndex = DIAS.indexOf(dia);
              if (diaIndex !== -1) {
                list.push({
                  id: `auto-${g.codigoMateria}-${g.numeroGrupo}-${dia}-${h.horaInicio}`,
                  codigoMateria: g.codigoMateria,
                  nombreMateria: g.nombreMateria,
                  numeroGrupo: g.numeroGrupo,
                  profesor: g.profesor || "Sin profesor asignado",
                  aula: h.aula || "Por definir",
                  dia,
                  diaIndex,
                  horaInicio: h.horaInicio,
                  horaFin: h.horaFin,
                  duracion: h.horaFin - h.horaInicio,
                  color,
                  isManual: false,
                });
              }
            });
          });
        });
      }
    }

    // 3. Bloques manuales del usuario
    if (manualBlocks && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        const belongsToCurrent =
          horariosGenerados && horariosGenerados.length > 0
            ? typeof b.scheduleIndex === "number"
              ? b.scheduleIndex === horarioActualIndex
              : false
            : true;
        if (!belongsToCurrent) return;

        const dia = DIAS[b.diaIndex];
        const horaInicio = HORAS[b.horaIndex];
        const horaFin = horaInicio + b.duracion;
        const color = b.color || getSubjectColor(b.id || b.name);

        list.push({
          id: `manual-block-${b.id}`,
          manualId: b.id,
          codigoMateria: null,
          nombreMateria: b.name || "Bloque manual",
          numeroGrupo: null,
          profesor: "",
          aula: "Manual",
          dia,
          diaIndex: b.diaIndex,
          horaInicio,
          horaFin,
          duracion: b.duracion,
          color,
          isManual: true,
        });
      });
    }

    return list;
  }, [
    isManualMode,
    materias,
    gruposSeleccionados,
    horariosGenerados,
    horarioActualIndex,
    manualBlocks,
  ]);

  // Clases filtradas para el día actualmente seleccionado
  const classesForActiveDay = useMemo(() => {
    return allCurrentClasses
      .filter((c) => c.diaIndex === activeDay)
      .sort((a, b) => a.horaInicio - b.horaInicio);
  }, [allCurrentClasses, activeDay]);

  // Conteo de clases por cada día para los badges de los tabs
  const classCountByDay = useMemo(() => {
    const counts = Array(DIAS.length).fill(0);
    allCurrentClasses.forEach((c) => {
      if (c.diaIndex >= 0 && c.diaIndex < DIAS.length) {
        counts[c.diaIndex]++;
      }
    });
    return counts;
  }, [allCurrentClasses]);

  // Manejo de cambio de día por swipe
  const handleDragEnd = (event, info) => {
    const threshold = 45;
    const velocityThreshold = 350;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Arrastre hacia la derecha (ir al día anterior)
      if (activeDay > 0) {
        setDirection(-1);
        setActiveDay((prev) => prev - 1);
      }
    } else if (
      info.offset.x < -threshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Arrastre hacia la izquierda (ir al día siguiente)
      if (activeDay < DIAS.length - 1) {
        setDirection(1);
        setActiveDay((prev) => prev + 1);
      }
    }
  };

  const goToDay = (idx) => {
    setDirection(idx > activeDay ? 1 : -1);
    setActiveDay(idx);
  };

  // Regresar el scroll hacia arriba cuando cambia el día o el horario
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeDay, horarioActualIndex]);

  // Mini bloques para la previsualización flotante temporal entre horarios generados
  const popupMiniBlocks = useMemo(() => {
    if (!horariosGenerados || horariosGenerados.length === 0) return [];
    const schedule =
      horariosGenerados[horarioActualIndex] || horariosGenerados[0];
    if (!schedule || !schedule.grupos) return [];

    const blocks = [];
    schedule.grupos.forEach((g) => {
      const color = getSubjectColor(g.codigoMateria || g.nombreMateria);
      (g.horarios || []).forEach((h) => {
        (h.dias || []).forEach((dia) => {
          const dIdx = DIAS.indexOf(dia);
          if (dIdx !== -1 && dIdx < 7) {
            const startIdx = Math.max(0, h.horaInicio - 6);
            const duration = Math.max(1, h.horaFin - h.horaInicio);
            blocks.push({
              key: `auto-${g.codigoMateria}-${g.numeroGrupo}-${dia}-${h.horaInicio}`,
              diaIndex: dIdx,
              startIdx,
              duration,
              color,
              nombre: g.nombreMateria,
            });
          }
        });
      });
    });

    if (manualBlocks && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        const belongsToCurrent =
          typeof b.scheduleIndex === "number"
            ? b.scheduleIndex === horarioActualIndex
            : true;
        if (!belongsToCurrent) return;
        const color = b.color || getSubjectColor(b.id || b.name);
        blocks.push({
          key: `man-${b.id}`,
          diaIndex: b.diaIndex,
          startIdx: b.horaIndex,
          duration: b.duracion,
          color,
          nombre: b.name,
        });
      });
    }

    return blocks;
  }, [horariosGenerados, horarioActualIndex, manualBlocks]);

  const popupTotalDays = useMemo(() => {
    const hasSunday = popupMiniBlocks.some((b) => b.diaIndex === 6);
    return hasSunday ? 7 : 6;
  }, [popupMiniBlocks]);

  // Al cambiar de horario generado, mostrar la miniatura que crece y luego desaparece automáticamente
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (horariosGenerados && horariosGenerados.length > 1) {
      setShowMiniPreviewPopup(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setShowMiniPreviewPopup(false);
      }, 2000);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [horarioActualIndex, horariosGenerados]);

  const handlePreviousSchedule = () => {
    if (!horariosGenerados || horariosGenerados.length <= 1) return;
    const nextIdx =
      horarioActualIndex > 0
        ? horarioActualIndex - 1
        : horariosGenerados.length - 1;
    setHorarioActualIndex(nextIdx);
  };

  const handleNextSchedule = () => {
    if (!horariosGenerados || horariosGenerados.length <= 1) return;
    const nextIdx =
      horarioActualIndex < horariosGenerados.length - 1
        ? horarioActualIndex + 1
        : 0;
    setHorarioActualIndex(nextIdx);
  };

  // Regresar a materias con animación inversa delegada al previsualizador del sidebar
  const handleBackToMaterias = () => {
    setMobileTransition("shrinking");
    setMobileActiveView("sidebar");
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative select-none">
      {/* Barra superior / Header con botones de igual tamaño */}
      <header className="px-3 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 z-30 flex-shrink-0 select-none">
        {/* Botón Volver a Materias */}
        <button
          type="button"
          onClick={handleBackToMaterias}
          className="flex-1 h-9 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Materias</span>
        </button>

        {/* Botón Día Anterior */}
        <button
          type="button"
          disabled={activeDay === 0}
          onClick={() => goToDay(activeDay - 1)}
          className="flex-1 h-9 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        {/* Botón Día Siguiente */}
        <button
          type="button"
          disabled={activeDay === DIAS.length - 1}
          onClick={() => goToDay(activeDay + 1)}
          className="flex-1 h-9 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform cursor-pointer"
        >
          <span>Siguiente</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Tabs superiores de Días: 7 columnas de igual tamaño, todos visibles simultáneamente */}
      <div className="grid grid-cols-7 gap-1 px-2 py-1.5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex-shrink-0 z-20 w-full select-none">
        {DIAS.map((dia, idx) => {
          const isActive = activeDay === idx;
          const count = classCountByDay[idx];
          return (
            <button
              key={dia}
              type="button"
              onClick={() => goToDay(idx)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-center transition-all w-full relative ${
                isActive
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold"
              }`}
            >
              <span className="text-[11px] leading-tight tracking-tight">
                {dia.slice(0, 3)}
              </span>
              {/* Indicador de clases */}
              <div className="h-1.5 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-white" : "bg-primary"
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Área del Horario con Gesto de Arrastre Elástico (Rubber-band swipe) */}
      <motion.div
        key={activeDay}
        ref={scrollContainerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, x: direction * 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -direction * 40 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="flex-1 overflow-y-auto relative w-full pb-16 pt-2 px-3 touch-pan-y"
      >
        {/* Encabezado del día activo */}
        <div className="flex items-center justify-between pb-2 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {DIAS[activeDay]}
            </h2>
          </div>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            Desliza para cambiar de día
          </span>
        </div>

        {/* Cuadrícula de Horas del Día */}
        <div
          className="relative min-w-full"
          style={{
            display: "grid",
            gridTemplateRows: `repeat(16, 56px)`,
            gridTemplateColumns: "54px 1fr",
          }}
        >
          {/* Filas de horas a la izquierda y líneas de guía */}
          {HORAS.map((hora, horaIdx) => (
            <React.Fragment key={hora}>
              {/* Columna de Horas a la izquierda */}
              <div
                className="flex items-start pt-1 pr-2 border-t border-zinc-200/60 dark:border-zinc-800/60"
                style={{
                  gridColumn: 1,
                  gridRow: horaIdx + 1,
                }}
              >
                <span className="font-mono text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {String(hora).padStart(2, "0")}:00
                </span>
              </div>

              {/* Celda de fondo */}
              <div
                className="border-t border-dashed border-zinc-200/60 dark:border-zinc-800/60"
                style={{
                  gridColumn: 2,
                  gridRow: horaIdx + 1,
                }}
              />
            </React.Fragment>
          ))}

          {/* Bloques de Clase posicionados en el día */}
          {classesForActiveDay.map((clase) => {
            const startHour = Math.floor(clase.horaInicio);
            const startIdx = Math.max(0, startHour - 6);
            const duration = Math.max(1, clase.duracion);

            return (
              <div
                key={clase.id}
                onClick={() => setSelectedBlockDetails(clase)}
                style={{
                  gridColumn: 2,
                  gridRow: `${startIdx + 1} / span ${duration}`,
                  zIndex: 10,
                  padding: "2px",
                }}
                className="relative cursor-pointer select-none active:scale-[0.99] transition-transform"
              >
                <div
                  style={{
                    backgroundColor: `${clase.color}18`,
                    borderColor: `${clase.color}60`,
                    borderLeftColor: clase.color,
                    borderLeftWidth: "4px",
                  }}
                  className="relative w-full h-full rounded-lg border p-2 flex items-center justify-center overflow-hidden shadow-xs select-none"
                >
                  {/* Fila superior en posición absolute (arriba) */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {clase.codigoMateria && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                          #{clase.codigoMateria}
                        </span>
                      )}
                      {clase.numeroGrupo && (
                        <span
                          style={{ color: clase.color }}
                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-700/80"
                        >
                          Grupo {clase.numeroGrupo}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                      {String(clase.horaInicio).padStart(2, "0")}:00 -{" "}
                      {String(clase.horaFin).padStart(2, "0")}:00
                    </span>
                  </div>

                  {/* Nombre de la Materia centrado en vertical y horizontal en la mitad de todo */}
                  <div className="w-full flex items-center justify-center text-center px-1 py-4 z-0 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 text-center">
                      {clase.nombreMateria}
                    </h4>
                  </div>

                  {/* Fila inferior en posición absolute (abajo) */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium z-10 pointer-events-none">
                    <span className="truncate max-w-[150px]">
                      {clase.profesor}
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {clase.aula}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Previsualizador miniatura emergente temporal al cambiar de horario */}
      <AnimatePresence>
        {showMiniPreviewPopup &&
          horariosGenerados &&
          horariosGenerados.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 20 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="fixed bottom-20 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 select-none"
            >
              <div
                onClick={() => setShowMiniPreviewPopup(false)}
                className="pointer-events-auto w-64 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-2.5 flex flex-col gap-2 cursor-pointer active:scale-98 transition-transform"
              >
                {/* Encabezado del mini preview */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                      Horario {horarioActualIndex + 1} de{" "}
                      {horariosGenerados.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 dark:text-zinc-500">
                    {popupMiniBlocks.length} clases
                  </span>
                </div>

                {/* Cuadrícula semanal miniatura */}
                <div className="w-full bg-zinc-50 dark:bg-zinc-950/80 rounded-xl p-1.5 border border-zinc-200/60 dark:border-zinc-800/60">
                  {/* Cabecera de días (L, M, M, J, V, S, D) */}
                  <div
                    className="grid text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mb-1"
                    style={{
                      gridTemplateColumns: `repeat(${popupTotalDays}, 1fr)`,
                    }}
                  >
                    {DIAS.slice(0, popupTotalDays).map((dia) => (
                      <span key={dia}>{dia.slice(0, 1)}</span>
                    ))}
                  </div>

                  {/* Cuadrícula con bloques */}
                  <div
                    className="relative w-full h-28 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${popupTotalDays}, 1fr)`,
                      gridTemplateRows: "repeat(16, 1fr)",
                    }}
                  >
                    {/* Líneas guía */}
                    {Array.from({ length: 16 }).map((_, rIdx) => (
                      <div
                        key={rIdx}
                        className="border-b border-zinc-100 dark:border-zinc-800/30 col-span-full pointer-events-none"
                        style={{ gridRow: rIdx + 1 }}
                      />
                    ))}

                    {/* Bloques de clases con animación fluida */}
                    {popupMiniBlocks.map((b) => (
                      <motion.div
                        key={b.key}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          gridColumn: b.diaIndex + 1,
                          gridRow: `${b.startIdx + 1} / span ${b.duration}`,
                          backgroundColor: b.color,
                        }}
                        className="rounded-[3px] m-[0.5px] shadow-xs"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Botón / Pill flotante centrado en el medio abajo para Horarios Generados */}
      <div className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-4 select-none">
        {horariosGenerados && horariosGenerados.length > 0 ? (
          <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl px-2.5 py-1.5 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 gap-1.5 text-xs">
            <button
              type="button"
              onClick={handlePreviousSchedule}
              disabled={horariosGenerados.length <= 1}
              className="p-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer"
              aria-label="Horario anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                Horarios generados:
              </span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {horarioActualIndex + 1} de {horariosGenerados.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextSchedule}
              disabled={horariosGenerados.length <= 1}
              className="p-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer"
              aria-label="Horario siguiente"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl px-3.5 py-1.5 shadow-xl border border-zinc-200/80 dark:border-zinc-800 gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              Horario Manual
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">
              ({allCurrentClasses.length}{" "}
              {allCurrentClasses.length === 1 ? "clase" : "clases"})
            </span>
          </div>
        )}
      </div>

      {/* Modal / Bottom Sheet con detalles de la clase */}
      <AnimatePresence>
        {selectedBlockDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBlockDetails(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4"
            >
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2" />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedBlockDetails.codigoMateria && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        #{selectedBlockDetails.codigoMateria}
                      </span>
                    )}
                    {selectedBlockDetails.numeroGrupo && (
                      <span
                        style={{ color: selectedBlockDetails.color }}
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20"
                      >
                        Grupo {selectedBlockDetails.numeroGrupo}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedBlockDetails.nombreMateria}
                  </h3>
                </div>

                {/* Botón eliminar si estamos en manual */}
                {isManualMode && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedBlockDetails.codigoMateria) {
                        deleteMateriaFromSchedule?.(
                          selectedBlockDetails.codigoMateria,
                        );
                      } else if (selectedBlockDetails.manualId) {
                        removeManualBlock?.(selectedBlockDetails.manualId);
                      }
                      setSelectedBlockDetails(null);
                    }}
                    className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/60 active:scale-95"
                    title="Eliminar del horario"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Información detallada */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="block text-zinc-400 dark:text-zinc-500 font-medium text-[10px]">
                    HORARIO
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedBlockDetails.dia} (
                    {String(selectedBlockDetails.horaInicio).padStart(2, "0")}
                    :00 -{" "}
                    {String(selectedBlockDetails.horaFin).padStart(2, "0")}
                    :00)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="block text-zinc-400 dark:text-zinc-500 font-medium text-[10px]">
                    AULA
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedBlockDetails.aula}
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="block text-zinc-400 dark:text-zinc-500 font-medium text-[10px]">
                    PROFESOR
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedBlockDetails.profesor}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBlockDetails(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300 active:scale-98"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
