import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMateriasStore } from "../../store/materiasStore";
import { DIAS, getSubjectColor } from "../../constants/schedule";

/**
 * Previsualizador fijo del horario en el sidebar móvil (modo manual).
 * - Ubicado de forma fija arriba del botón "Ver Horario".
 * - Comprime la lista de materias hacia arriba sin superposiciones ni flotantes.
 * - Al tocarlo abre la vista completa de horario.
 */
export default function MobileMiniSchedulePreview({ onOpenSchedule }) {
  const {
    materias,
    gruposSeleccionados,
    manualBlocks,
  } = useMateriasStore();

  // Recopilar bloques ocupados con su color y coordenadas (día [0-6], hora [0-15], duración)
  const miniBlocks = useMemo(() => {
    const blocks = [];

    // 1. Grupos seleccionados en manual
    if (gruposSeleccionados && materias) {
      Object.entries(gruposSeleccionados).forEach(([codigo, numGrupo]) => {
        if (numGrupo === null || numGrupo === undefined) return;
        const mat = materias.find((m) => String(m.codigo) === String(codigo));
        if (!mat) return;
        const grp = (mat.grupos || []).find((g) => g.numero === numGrupo);
        if (!grp) return;
        const color = getSubjectColor(mat.codigo || mat.nombre);

        (grp.horarios || []).forEach((h) => {
          (h.dias || []).forEach((dia) => {
            const dIdx = DIAS.indexOf(dia);
            if (dIdx !== -1 && dIdx < 7) {
              const startIdx = Math.max(0, h.horaInicio - 6);
              const duration = Math.max(1, h.horaFin - h.horaInicio);
              blocks.push({
                key: `m-${codigo}-${dIdx}-${startIdx}`,
                diaIndex: dIdx,
                startIdx,
                duration,
                color,
              });
            }
          });
        });
      });
    }

    // 2. Bloques manuales
    if (manualBlocks && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        const color = b.color || getSubjectColor(b.id || b.name);
        blocks.push({
          key: `b-${b.id}`,
          diaIndex: b.diaIndex,
          startIdx: b.horaIndex,
          duration: b.duracion,
          color,
        });
      });
    }

    return blocks;
  }, [gruposSeleccionados, materias, manualBlocks]);

  const totalSelectedCount = useMemo(() => {
    let count = 0;
    if (gruposSeleccionados) {
      count += Object.values(gruposSeleccionados).filter(
        (v) => v !== null && v !== undefined,
      ).length;
    }
    if (manualBlocks) {
      count += manualBlocks.length;
    }
    return count;
  }, [gruposSeleccionados, manualBlocks]);

  const totalDays = useMemo(() => {
    const hasSunday = miniBlocks.some((b) => b.diaIndex === 6);
    return hasSunday ? 7 : 6;
  }, [miniBlocks]);

  return (
    <AnimatePresence>
      {totalSelectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.96 }}
          animate={{ opacity: 1, height: "auto", scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full px-3 pt-2 overflow-hidden flex-shrink-0"
        >
          <div
            onClick={onOpenSchedule}
            className="w-full bg-zinc-50 dark:bg-zinc-900/90 rounded-2xl p-2.5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col gap-1.5 cursor-pointer active:scale-[0.985] transition-transform select-none group"
            title="Toca para ver el horario completo"
          >
            {/* Cabecera miniatura */}
            <div className="flex items-center justify-between px-0.5 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  Previsualización
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-zinc-400 dark:text-zinc-500">
                {totalSelectedCount}{" "}
                {totalSelectedCount === 1 ? "materia" : "materias"}
              </span>
            </div>

            {/* Cuadrícula semanal miniatura */}
            <div className="w-full bg-white dark:bg-zinc-950/70 rounded-xl p-1.5 border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col">
              {/* Cabecera de días (L, M, M, J, V, S, D) */}
              <div
                className="grid text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mb-1"
                style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}
              >
                {DIAS.slice(0, totalDays).map((dia) => (
                  <span key={dia}>{dia.slice(0, 1)}</span>
                ))}
              </div>

              {/* Cuadrícula con todas las 16 filas de horas visibles */}
              <div
                className="relative w-full h-28 bg-zinc-50/50 dark:bg-zinc-900/60 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
                  gridTemplateRows: "repeat(16, 1fr)",
                }}
              >
                {/* Todas las 16 líneas guía horizontales */}
                {Array.from({ length: 16 }).map((_, rIdx) => (
                  <div
                    key={rIdx}
                    className="border-b border-zinc-100 dark:border-zinc-800/30 col-span-full pointer-events-none"
                    style={{ gridRow: rIdx + 1 }}
                  />
                ))}

                {/* Bloques coloreados en miniatura */}
                {miniBlocks.map((b) => {
                  if (b.diaIndex >= totalDays) return null;
                  return (
                    <div
                      key={b.key}
                      style={{
                        gridColumn: b.diaIndex + 1,
                        gridRow: `${b.startIdx + 1} / span ${b.duration}`,
                        backgroundColor: b.color,
                      }}
                      className="rounded-[3px] m-[0.5px] shadow-xs"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
