import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMateriasStore } from '../store/materiasStore';

/**
 * Componente que muestra una superposición visual sobre el schedule
 * cuando se está arrastrando una materia, resaltando los horarios disponibles
 */
export default function ScheduleDropOverlay({ availableHorarios, dias, horas, onBlockDrop, showToastMessage, celdasMateria, hoveredCell, hoveredValidKeys, hoveredValidGroupNumbers }) {
  const { setPreviewGrupo, draggingMateria, clearDragState } = useMateriasStore();
  
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

    if (diaIndex >= 0 && diaIndex < 7 && horaIndex >= 0 && horaIndex < horas.length) {
      // Delegar al mismo handler de drop que maneja solapamientos y modal
      if (onBlockDrop) {
        onBlockDrop(e, diaIndex, horaIndex);
        return;
      }

      // Fallback — si no hay handler, mostrar mensajes simples
      const celdaKey = `${diaIndex}-${horaIndex}`;
      const materiaEnCeldaCodigo = celdasMateria?.get(celdaKey);
      if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== draggingMateria?.codigo) {
        showToastMessage?.('⚠️ No se puede colocar: hay un conflicto con otra materia');
      } else {
        showToastMessage?.('⚠️ Esta materia no tiene clases en este horario');
      }
    }

    clearDragState();
  };

  // Colores diferentes para cada horario
  const colores = [
    { bg: 'bg-blue-400/40', border: 'border-blue-500', dark: 'dark:bg-blue-500/50' },
    { bg: 'bg-emerald-400/40', border: 'border-emerald-500', dark: 'dark:bg-emerald-500/50' },
    { bg: 'bg-violet-400/40', border: 'border-violet-500', dark: 'dark:bg-violet-500/50' },
    { bg: 'bg-amber-400/40', border: 'border-amber-500', dark: 'dark:bg-amber-500/50' },
    { bg: 'bg-pink-400/40', border: 'border-pink-500', dark: 'dark:bg-pink-500/50' },
    { bg: 'bg-cyan-400/40', border: 'border-cyan-500', dark: 'dark:bg-cyan-500/50' },
    { bg: 'bg-red-400/40', border: 'border-red-500', dark: 'dark:bg-red-500/50' },
    { bg: 'bg-orange-400/40', border: 'border-orange-500', dark: 'dark:bg-orange-500/50' },
  ];

  // Crear bloques completos para cada horario
  const bloques = [];
  let colorIndex = 0;

  availableHorarios.forEach((horario, idx) => {
    const color = colores[colorIndex % colores.length];
    colorIndex++;

    horario.dias.forEach(dia => {
      const diaIndex = dias.indexOf(dia);
      if (diaIndex !== -1) {
        const horaInicioIndex = horas.indexOf(horario.horaInicio);
        const duracion = horario.horaFin - horario.horaInicio;
        
        if (horaInicioIndex !== -1) {
          bloques.push({
            key: `${idx}-${diaIndex}-${horaInicioIndex}`,
            diaIndex,
            horaInicioIndex,
            duracion,
            color,
            numeroGrupo: horario.numeroGrupo,
          });
        }
      }
    });
  });

  const handleMouseEnter = (bloque) => {
    if (!draggingMateria) return;
    
    // Buscar el grupo completo
    const grupo = draggingMateria.grupos.find(g => g.numero === bloque.numeroGrupo);
    if (grupo) {
      setPreviewGrupo({
        codigo: draggingMateria.codigo,
        nombre: draggingMateria.nombre,
        numeroGrupo: grupo.numero,
        horarios: grupo.horarios,
        profesor: grupo.profesor,
        color: bloque.color,
      });
    }
  };

  const handleMouseLeave = () => {
    setPreviewGrupo(null);
  };

  const handleDrop = (e, bloque) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop en overlay bloque:', bloque);
    
    // Llamar a la función de drop pasada como prop
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
          gridColumn: '2 / span 7', // Todas las columnas de días
          gridRow: '1 / -1', // Todas las filas
          zIndex: 12, // Entre las celdas (1) y los bloques de color (15)
          pointerEvents: 'auto',
        }}
        onDrop={handleBackdropDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
      />
      
      {/* Bloques de horarios disponibles */}
      <AnimatePresence>
        {bloques.map(bloque => {
          // Si hay una celda hovered y esa celda está dentro del bloque pero NO está válida -> ocultar ese bloque
          let hideBloqueAtHoveredCell = false;
          if (hoveredCell) {
            const hoveredKey = `${hoveredCell.diaIndex}-${hoveredCell.horaIndex}`;
            // Si el bloque cubre la columna/row del hoveredKey y hoveredValidKeys no incluye hoveredKey
            const coversHovered = (bloque.diaIndex === hoveredCell.diaIndex) && (hoveredCell.horaIndex >= bloque.horaInicioIndex && hoveredCell.horaIndex < bloque.horaInicioIndex + bloque.duracion);
            console.log('Covers hovered?', coversHovered, 'HoveredKey:', hoveredKey, 'ValidKeys:', hoveredValidKeys);
            if (coversHovered && hoveredValidKeys && !hoveredValidKeys.has(hoveredKey)) {
              hideBloqueAtHoveredCell = true;
            }
          }

          if (hideBloqueAtHoveredCell) return null;

          return (
            <motion.div
              key={bloque.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              transition={{
                duration: 0.4,
                delay: bloques.indexOf(bloque) * 0.05,
                ease: "easeOut"
              }}
              className={`${bloque.color.bg} ${bloque.color.dark} ${bloque.color.border} border-2 border-dashed rounded-md flex items-center justify-center`}
              style={{
                gridColumn: bloque.diaIndex + 2,
                gridRow: `${bloque.horaInicioIndex + 1} / span ${bloque.duracion}`,
                zIndex: 15, // Mayor que backdrop (12) y ClassBlock (10)
                pointerEvents: 'auto',
                cursor: 'copy',
                backgroundImage: `repeating-linear-gradient(
                                  45deg,
                                  transparent 0px,
                                  transparent 4px,
                                  rgba(255, 255, 255, 0.15) 4px,
                                  rgba(255, 255, 255, 0.15) 8px
                              )`
              }}
              onMouseEnter={() => handleMouseEnter(bloque)}
              onMouseLeave={handleMouseLeave}
              onDrop={(e) => handleDrop(e, bloque)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
            >
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}
