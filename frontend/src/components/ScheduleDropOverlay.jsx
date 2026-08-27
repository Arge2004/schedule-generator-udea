import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMateriasStore } from "../store/materiasStore";

/**
 * Componente que muestra una superposición visual sobre el schedule
 * cuando se está arrastrando una materia, resaltando los horarios disponibles
 */
export default function ScheduleDropOverlay({
  availableHorarios,
  dias,
  horas,
  onBlockDrop,
  showToastMessage,
  celdasMateria,
  hoveredCell,
  hoveredValidKeys,
  hoveredValidGroupNumbers,
}) {
  const { setPreviewGrupo, draggingMateria, clearDragState } =
    useMateriasStore();

  if (!availableHorarios || availableHorarios.length === 0) {
    return null;
  }

  // Handler para drops en el backdrop (áreas sin horarios disponibles)
  const handleBackdropDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Calcular celda sobre la que se soltó
    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / 7; // 7 días
    const cellHeight = rect.height / horas.length;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const diaIndex = Math.floor(x / cellWidth);
    const horaIndex = Math.floor(y / cellHeight);

    if (
      diaIndex >= 0 &&
      diaIndex < 7 &&
      horaIndex >= 0 &&
      horaIndex < horas.length
    ) {
      // Delegar al mismo handler de drop que maneja solapamientos y modal
      if (onBlockDrop) {
        onBlockDrop(e, diaIndex, horaIndex);
        return;
      }

      // Fallback — si no hay handler, mostrar mensajes simples
      const celdaKey = `${diaIndex}-${horaIndex}`;
      const materiaEnCeldaCodigo = celdasMateria?.get(celdaKey);
      if (
        materiaEnCeldaCodigo &&
        materiaEnCeldaCodigo !== draggingMateria?.codigo
      ) {
        showToastMessage?.(
          "⚠️ No se puede colocar: hay un conflicto con otra materia",
        );
      } else {
        showToastMessage?.("⚠️ Esta materia no tiene clases en este horario");
      }
    }

    clearDragState();
  };

  // Agrupar horarios disponibles por ranura de tiempo única (día, horaInicio, duración)
  const slotMap = new Map();
  availableHorarios.forEach((horario) => {
    (horario.dias || []).forEach((dia) => {
      const diaIndex = dias.indexOf(dia);
      if (diaIndex !== -1) {
        const horaInicioIndex = horas.indexOf(horario.horaInicio);
        const duracion = horario.horaFin - horario.horaInicio;
        if (horaInicioIndex !== -1 && duracion > 0) {
          const slotKey = `${diaIndex}-${horaInicioIndex}-${duracion}`;
          if (!slotMap.has(slotKey)) {
            slotMap.set(slotKey, {
              key: slotKey,
              diaIndex,
              horaInicioIndex,
              duracion,
              grupos: [horario.numeroGrupo],
            });
          } else {
            const existing = slotMap.get(slotKey);
            if (!existing.grupos.includes(horario.numeroGrupo)) {
              existing.grupos.push(horario.numeroGrupo);
            }
          }
        }
      }
    });
  });

  const bloques = Array.from(slotMap.values());

  const handleDrop = (e, bloque) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBlockDrop) {
      onBlockDrop(e, bloque.diaIndex, bloque.horaInicioIndex);
    }
  };

  return (
    <>
      {/* Backdrop para capturar drops en áreas sin horarios disponibles */}
      <div
        className="absolute inset-0"
        style={{
          gridColumn: "2 / span 7",
          gridRow: "1 / -1",
          zIndex: 12,
          pointerEvents: "auto",
        }}
        onDrop={handleBackdropDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
      />

      {/* Bloques agrupados de horarios disponibles */}
      <AnimatePresence>
        {bloques.map((bloque, idx) => (
          <motion.div
            key={bloque.key}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{
              duration: 0.25,
              delay: idx * 0.02,
              ease: "easeOut",
            }}
            className="bg-primary/15 dark:bg-primary/20 border-2 border-dashed border-primary/70 dark:border-primary/80 rounded-md flex flex-col items-center justify-center p-1.5 text-center shadow-xs select-none hover:bg-primary/25 dark:hover:bg-primary/30 transition-colors"
            style={{
              gridColumn: bloque.diaIndex + 2,
              gridRow: `${bloque.horaInicioIndex + 1} / span ${bloque.duracion}`,
              zIndex: 15,
              pointerEvents: "auto",
              cursor: "copy",
            }}
            onDrop={(e) => handleDrop(e, bloque)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
          >
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs text-primary dark:text-primary-foreground font-mono">
                {bloque.grupos.length > 1
                  ? `${bloque.grupos.length} grupos`
                  : `Grupo ${bloque.grupos[0]}`}
              </span>
            </div>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
              Soltar para colocar
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
