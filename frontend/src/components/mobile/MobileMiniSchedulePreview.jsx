import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMateriasStore } from "../../store/materiasStore";
import { DIAS, getSubjectColor } from "../../constants/schedule";

const CARD_WIDTH = 240;
const CARD_HEIGHT = 200;

/**
 * Previsualizador flotante único del horario para modo manual en móvil.
 * - Un solo elemento en el DOM (cero duplicados, cero desalineaciones).
 * - Tamaño fijo y persistente en el viewport (240px x 200px).
 * - Arrastrable libremente por toda la pantalla.
 * - Transición de expansión y contracción 100% fluida y continua.
 */
export default function MobileMiniSchedulePreview({ onOpenSchedule }) {
  const cardRef = useRef(null);
  const constraintsRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const {
    materias,
    gruposSeleccionados,
    manualBlocks,
    setMobileActiveView,
    mobileActiveView,
    miniPreviewPos,
    setMiniPreviewPos,
    mobileTransition,
    setMobileTransition,
  } = useMateriasStore();

  // Obtener posición persistente o inicial por defecto
  const currentPos = useMemo(() => {
    if (
      miniPreviewPos &&
      typeof miniPreviewPos.top === "number" &&
      typeof miniPreviewPos.left === "number"
    ) {
      return miniPreviewPos;
    }
    if (typeof window !== "undefined") {
      return {
        left: Math.max(8, window.innerWidth - CARD_WIDTH - 16),
        top: Math.max(8, window.innerHeight - CARD_HEIGHT - 96),
      };
    }
    return { left: 100, top: 400 };
  }, [miniPreviewPos]);

  useEffect(() => {
    if (mobileActiveView === "sidebar") {
      setIsExpanding(false);
    }
  }, [mobileActiveView]);

  // Recopilar bloques ocupados con su color y coordenadas
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

  const handleOpen = () => {
    if (isExpanding || isDraggingRef.current) return;

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - CARD_WIDTH - 8);
      const maxTop = Math.max(8, window.innerHeight - CARD_HEIGHT - 8);
      const clampedLeft = Math.max(8, Math.min(maxLeft, Math.round(rect.left)));
      const clampedTop = Math.max(8, Math.min(maxTop, Math.round(rect.top)));
      setMiniPreviewPos({ top: clampedTop, left: clampedLeft });
    }

    setIsExpanding(true);

    setTimeout(() => {
      if (onOpenSchedule) {
        onOpenSchedule();
      } else {
        setMobileActiveView("schedule");
      }
      setTimeout(() => {
        setIsExpanding(false);
      }, 50);
    }, 320);
  };

  const isShrinking = mobileTransition === "shrinking";

  return (
    <>
      {/* Contenedor invisible para limitar el arrastre dentro de la pantalla */}
      <div
        ref={constraintsRef}
        className="fixed inset-2 pointer-events-none z-0"
        style={{ top: 8, left: 8, right: 8, bottom: 8 }}
      />

      <AnimatePresence>
        {totalSelectedCount > 0 && (
          <motion.div
            key={isShrinking ? "shrinking-card" : "idle-card"}
            ref={cardRef}
            drag={!isExpanding && !isShrinking}
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={() => {
              isDraggingRef.current = true;
            }}
            onDragEnd={() => {
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 120);
              if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                const maxLeft = Math.max(8, window.innerWidth - CARD_WIDTH - 8);
                const maxTop = Math.max(8, window.innerHeight - CARD_HEIGHT - 8);
                const clampedLeft = Math.max(
                  8,
                  Math.min(maxLeft, Math.round(rect.left)),
                );
                const clampedTop = Math.max(
                  8,
                  Math.min(maxTop, Math.round(rect.top)),
                );
                setMiniPreviewPos({ top: clampedTop, left: clampedLeft });
              }
            }}
            onClick={() => {
              if (!isDraggingRef.current) {
                handleOpen();
              }
            }}
            initial={
              isShrinking
                ? {
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100dvh",
                    borderRadius: "0px",
                    opacity: 1,
                  }
                : {
                    top: currentPos.top,
                    left: currentPos.left,
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    borderRadius: "1rem",
                    scale: 0.8,
                    opacity: 0,
                  }
            }
            animate={
              isExpanding
                ? {
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100dvh",
                    borderRadius: "0px",
                    opacity: 1,
                    scale: 1,
                  }
                : {
                    top: currentPos.top,
                    left: currentPos.left,
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    borderRadius: "1rem",
                    scale: 1,
                    opacity: 1,
                  }
            }
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
            }}
            onAnimationComplete={() => {
              if (isShrinking) {
                setMobileTransition(null);
              }
            }}
            style={{
              position: "fixed",
              zIndex: isExpanding || isShrinking ? 999999 : 30,
              touchAction: "none",
            }}
            className="cursor-grab active:cursor-grabbing select-none overflow-hidden"
            title="Toca para ver el horario completo. Puedes arrastrar esta miniatura por toda la pantalla."
          >
            <div className="w-full h-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-zinc-200/90 dark:border-zinc-800 flex flex-col gap-1.5 overflow-hidden relative group">
              {/* Cabecera miniatura */}
              <div className="flex items-center justify-between px-0.5 pb-1 border-b border-zinc-200/80 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                    Horario
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-zinc-400 dark:text-zinc-500">
                  {totalSelectedCount}{" "}
                  {totalSelectedCount === 1 ? "materia" : "materias"}
                </span>
              </div>

              {/* Cuadrícula semanal miniatura */}
              <div className="w-full bg-zinc-50 dark:bg-zinc-950/80 rounded-xl p-1.5 border border-zinc-200/60 dark:border-zinc-800/60 flex-1 flex flex-col min-h-0">
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
                  className="relative w-full flex-1 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50"
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

              {/* Footer con indicador touch */}
              <div className="text-[10px] text-center font-medium text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1">
                <span>Toca para expandir</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
