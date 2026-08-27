import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useMateriasStore } from "../store/materiasStore.js";
import { TrashIcon, GripIcon } from "../icons/index.js";
import Tooltip from "./Tooltip.jsx";

const EXPLOSION_PARTICLES = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i / 24) * 360 + ((i % 5) * 8 - 16);
  const rad = (angle * Math.PI) / 180;
  const distance = 50 + ((i * 17) % 45); // Mayor dispersión (25px a 70px)
  const isShard = i % 3 === 0; // Esquirlas cuadradas
  const isSpark = i % 4 === 0; // Destellos brillantes

  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance + (isShard ? 12 : 0), // Simula caída por gravedad en esquirlas
    size: isShard ? 4 + (i % 3) * 3 : 3 + (i % 4) * 2,
    rotateX: (i % 2 === 0 ? 1 : -1) * (180 + i * 45),
    rotateZ: (i % 2 === 0 ? 1 : -1) * (90 + i * 30),
    duration: 0.38 + (i % 4) * 0.04,
    delay: (i % 5) * 0.008,
    type: isSpark ? "spark" : "shard",
  };
});

const ENTRANCE_PARTICLES = Array.from({ length: 14 }).map((_, i) => {
  const angle = (i / 14) * 360 + ((i % 3) * 10 - 10);
  const rad = (angle * Math.PI) / 180;
  const distance = 75 + ((i * 11) % 36);
  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    size: 3 + (i % 3) * 1.8,
    duration: 0.42 + (i % 3) * 0.05,
    delay: (i % 4) * 0.015,
  };
});

function ClassBlockComponent({
  clase,
  onHover,
  onLeave,
  onDelete,
  onRename,
  autoEdit,
  onEditComplete,
  isForceExploding = false,
  onInitDrag,
  onPointerDown: onPointerDownProp,
}) {
  const {
    materia,
    grupo,
    aula,
    color,
    isPreview,
    codigoMateria,
    source,
    manualId,
    pulsing,
  } = clase;

  const blockRef = useRef(null);
  const inputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(materia || "");
  const [displayName, setDisplayName] = useState(materia || "");
  const [isExploding, setIsExploding] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showEntranceParticles, setShowEntranceParticles] =
    useState(!isPreview);

  const shakeMateriaCodigo = useMateriasStore((s) => s.shakeMateriaCodigo);
  const shakeTimestamp = useMateriasStore((s) => s.shakeTimestamp);
  const lastShakeTimestampRef = useRef(shakeTimestamp || 0);

  useEffect(() => {
    if (
      shakeTimestamp &&
      shakeTimestamp !== lastShakeTimestampRef.current &&
      shakeMateriaCodigo &&
      (String(shakeMateriaCodigo) === String(codigoMateria) ||
        (materia && String(shakeMateriaCodigo) === String(materia)))
    ) {
      lastShakeTimestampRef.current = shakeTimestamp;
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shakeMateriaCodigo, shakeTimestamp, codigoMateria, materia]);

  useEffect(() => {
    if (isForceExploding && !isExploding) {
      onLeave?.();
      setIsExploding(true);
    }
  }, [isForceExploding]);

  useEffect(() => {
    if (!isPreview) {
      const timer = setTimeout(() => setShowEntranceParticles(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isPreview]);

  useEffect(() => {
    setEditText(materia || "");
    setDisplayName(materia || "");
  }, [materia]);

  const isManual = source === "manual" && Boolean(manualId);

  useEffect(() => {
    return () => onLeave?.();
  }, [onLeave]);

  useEffect(() => {
    if (autoEdit && isManual) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [autoEdit, isManual]);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const handleMouseEnter = () => {
    if (isMobile || isExploding) return;
    if (blockRef.current && onHover) {
      const rect = blockRef.current.getBoundingClientRect();
      onHover(clase, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const handleGrupoSelect = () => {
    const { gruposSeleccionados, selectGrupo, toggleMateriaSelected } =
      useMateriasStore.getState();
    const grupoSeleccionado = gruposSeleccionados[codigoMateria];
    if (grupoSeleccionado === grupo) {
      selectGrupo(codigoMateria, null);
      toggleMateriaSelected(codigoMateria);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onLeave?.();

    if (codigoMateria) {
      handleGrupoSelect();
      return;
    }

    if (onDelete) {
      if (isManual) {
        setIsExploding(true);
        setTimeout(() => onDelete(), 420);
        return;
      }
      onDelete();
      return;
    }

    handleGrupoSelect();
  };

  const handleRemoveSubject = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onLeave?.();

    if (onDelete) {
      onDelete();
      return;
    }

    setIsExploding(true);
    setTimeout(() => {
      if (manualId) {
        if (onDelete) onDelete();
      } else if (codigoMateria) {
        const state = useMateriasStore.getState();
        state.deleteMateriaFromSchedule?.(codigoMateria);
      }
    }, 420);
  };

  const commitEdit = () => {
    const newName = editText?.trim();
    const finalName = newName && newName.length > 0 ? newName : "Bloque manual";
    if (onRename) onRename(finalName);
    setEditText(finalName);
    setDisplayName(finalName);
    setIsEditing(false);
    if (onEditComplete) onEditComplete(finalName);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(materia || "");
    }
  };

  const handleBlockClick = (e) => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    onLeave?.();
    if (codigoMateria) {
      const { focusMateria } = useMateriasStore.getState();
      if (focusMateria) focusMateria(codigoMateria);
    }
  };

  const dragEnabled = useMateriasStore((s) => s.dragEnabled);

  const isDraggable =
    Boolean(codigoMateria || materia) &&
    !isEditing &&
    !isExploding &&
    !isPreview &&
    !manualId &&
    dragEnabled;

  const checkGroupConflict = (grupoToTest, activeCodigo) => {
    const state = useMateriasStore.getState();
    const { materias: todasMaterias, gruposSeleccionados } = state;
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

    const celdasOtras = new Set();
    Object.entries(gruposSeleccionados || {}).forEach(([cod, gNum]) => {
      if (!gNum || String(cod) === String(activeCodigo)) return;
      const mat = (todasMaterias || []).find(
        (m) => String(m.codigo) === String(cod),
      );
      const grp = mat?.grupos?.find((g) => String(g.numero) === String(gNum));
      (grp?.horarios || []).forEach((h) => {
        (h.dias || []).forEach((d) => {
          const dIdx = diasArr.indexOf(d);
          if (dIdx !== -1) {
            const hIdx = horasArr.indexOf(h.horaInicio);
            const dur = h.horaFin - h.horaInicio;
            for (let i = 0; i < dur; i++) {
              celdasOtras.add(`${dIdx}-${hIdx + i}`);
            }
          }
        });
      });
    });

    return (grupoToTest.horarios || []).some((h) => {
      return (h.dias || []).some((d) => {
        const dIdx = diasArr.indexOf(d);
        if (dIdx === -1) return false;
        const hIdx = horasArr.indexOf(h.horaInicio);
        const dur = h.horaFin - h.horaInicio;
        for (let i = 0; i < dur; i++) {
          if (celdasOtras.has(`${dIdx}-${hIdx + i}`)) return true;
        }
        return false;
      });
    });
  };

  const handleDragStart = (e) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }

    const state = useMateriasStore.getState();
    const mat =
      state.materias?.find((m) => String(m.codigo) === String(codigoMateria)) ||
      state.materias?.find((m) => m.nombre === materia);

    if (!mat || !mat.grupos || mat.grupos.length === 0) {
      e.preventDefault();
      return;
    }

    // Verificar si existen grupos disponibles válidos (distintos al actual, con cupo y sin conflicto)
    const grupoActual =
      grupo !== null && typeof grupo !== "undefined"
        ? grupo
        : state.gruposSeleccionados[mat.codigo];

    const availableGroups = (mat.grupos || []).filter((g) => {
      if (
        grupoActual !== null &&
        typeof grupoActual !== "undefined" &&
        String(g.numero) === String(grupoActual)
      ) {
        return false;
      }
      if (typeof g.cupoDisponible === "number" && g.cupoDisponible <= 0) {
        return false;
      }
      return !checkGroupConflict(g, mat.codigo);
    });

    if (availableGroups.length === 0) {
      e.preventDefault();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error("No hay otros horarios disponibles para esta materia");
      return;
    }

    onLeave?.();

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(mat.codigo));

    // Crear un drag preview sólido, nítido y 100% opaco idéntico al del sidebar
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
        ">#${mat.codigo || ""}</span>
        <span>${mat.nombre}</span>
      `;

      document.body.appendChild(dragNode);
      e.dataTransfer.setDragImage(dragNode, 24, 18);
      setTimeout(() => {
        if (document.body.contains(dragNode)) {
          document.body.removeChild(dragNode);
        }
      }, 0);
    }

    // Actualizar el estado en el siguiente tick para que dragstart se complete en <1ms
    setTimeout(() => {
      state.setDraggingMateria({
        codigo: mat.codigo,
        nombre: mat.nombre,
        grupos: mat.grupos,
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

  const blockColor = color || "#3b82f6";

  return (
    <div
      data-no-select
      data-class-block="true"
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      className={`absolute inset-1 rounded-md pointer-events-auto select-none ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
    >
      {/* Contenedor principal con animación de destructuración física */}
      <motion.div
        ref={blockRef}
        onClick={handleBlockClick}
        initial={false}
        animate={
          isExploding
            ? {
                scale: [1, 1.18, 0],
                opacity: [1, 1, 0],
                rotate: [0, -6, 8, -4],
                filter: [
                  "brightness(1) drop-shadow(0 0 0px transparent)",
                  "brightness(2.5) contrast(1.5) drop-shadow(0 0 12px rgba(255,255,255,0.9))",
                  "brightness(4) blur(8px)",
                ],
              }
            : isShaking
              ? { x: [0, -9, 9, -7, 7, -4, 4, 0] }
              : { x: 0 }
        }
        transition={
          isExploding
            ? { duration: 0.4, ease: [0.05, 0.7, 0.1, 1] }
            : isShaking
              ? { duration: 0.45, ease: "easeInOut" }
              : { duration: 0.15 }
        }
        className={`w-full h-full rounded-md border border-l-[3.5px] flex flex-col justify-between items-center py-1 px-1.5 overflow-hidden hover:shadow-md select-none group transition-shadow duration-100 ease-out ${
          isPreview ? "border-dashed ring-2 ring-primary/40 shadow-md" : ""
        } ${pulsing ? "pulse-animate" : ""}`}
        data-no-select
        style={{
          backgroundColor: isPreview ? `${blockColor}22` : `${blockColor}12`,
          borderColor: blockColor,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onLeave}
      >
        {/* Badges y Acciones (Grip & Delete) */}
        <div className="flex items-start w-full justify-between gap-1 z-10">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {grupo !== null && typeof grupo !== "undefined" && (
              <span
                className="font-mono text-xs font-bold px-1.5 py-0.5 rounded leading-none text-white shadow-2xs"
                style={{ backgroundColor: blockColor }}
              >
                G{grupo}
              </span>
            )}
            {aula && (
              <span className="font-mono text-xs font-medium text-primary dark:text-zinc-100 bg-primary/5 border-primary/40 border px-1 py-0.5 rounded leading-none truncate max-w-[85px]">
                {aula}
              </span>
            )}
            {isPreview && (
              <span className="font-mono text-[8.5px] font-bold text-white bg-primary px-1.5 py-0.5 rounded leading-none">
                PREVIEW
              </span>
            )}
          </div>

          {!isPreview && !isExploding && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-auto flex items-center gap-0.5">
              {isDraggable && (
                <Tooltip content="Arrastrar materia al horario" position="top">
                  <div
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-primary cursor-grab"
                    aria-label="Arrastrar materia al horario"
                  >
                    <GripIcon className="w-3.5 h-3.5" />
                  </div>
                </Tooltip>
              )}
              <Tooltip
                content={
                  manualId
                    ? "Eliminar bloque manual"
                    : "Quitar materia del horario"
                }
                position="top"
              >
                <button
                  type="button"
                  onClick={handleRemoveSubject}
                  className="p-1 absolute top-1 right-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/10 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label={
                    manualId ? "Eliminar bloque manual" : "Quitar del horario"
                  }
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Nombre del Bloque */}
        <div className="flex-1 min-w-0 my-1 flex items-center w-full">
          {isEditing && isManual ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-xs font-semibold p-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Editar nombre del bloque"
            />
          ) : (
            <p
              onDoubleClick={() => isManual && setIsEditing(true)}
              className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2"
            >
              {displayName}
            </p>
          )}
        </div>
      </motion.div>

      {/* 💥 EXPLOSIÓN MEJORADA */}
      {isExploding && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-visible">
          {/* Flash Blanco Inicial (Impacto) */}
          <motion.div
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute w-12 h-12 rounded-full bg-white shadow-[0_0_25px_#ffffff]"
          />

          {/* Shockwave Principal (Onda rápida) */}
          <motion.div
            initial={{ scale: 0.1, opacity: 1, borderWidth: "4px" }}
            animate={{ scale: 3.2, opacity: 0, borderWidth: "0.5px" }}
            transition={{ duration: 0.38, ease: [0.1, 0.8, 0.3, 1] }}
            className="absolute w-14 h-14 rounded-full border"
            style={{
              borderColor: blockColor,
              boxShadow: `0 0 15px ${blockColor}`,
            }}
          />

          {/* Shockwave Secundaria (Onda expansiva suave) */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8, borderWidth: "2px" }}
            animate={{ scale: 2.4, opacity: 0, borderWidth: "0px" }}
            transition={{ duration: 0.42, delay: 0.04, ease: "easeOut" }}
            className="absolute w-14 h-14 rounded-full border border-white"
          />

          {/* Sistema de Partículas Avanzado */}
          {EXPLOSION_PARTICLES.map((p) => {
            const isSpark = p.type === "spark";
            const isShard = p.type === "shard";

            return (
              <motion.div
                key={p.id}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0.2,
                  opacity: 1,
                  rotateX: 0,
                  rotateZ: 0,
                }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0.4, 1.4, 0],
                  opacity: [1, 1, 0],
                  rotateX: p.rotateX,
                  rotateZ: p.rotateZ,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.05, 0.85, 0.15, 1],
                }}
                className={`absolute pointer-events-none ${
                  isShard ? "rounded-xs" : "rounded-full"
                }`}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: isSpark
                    ? "#ffffff"
                    : p.id % 3 === 0
                      ? "#fbbf24"
                      : blockColor,
                  boxShadow: isSpark
                    ? `0 0 10px #ffffff, 0 0 18px ${blockColor}`
                    : `0 0 8px ${blockColor}`,
                  clipPath: isSpark
                    ? "polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)"
                    : "none",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Partículas de entrada */}
      {showEntranceParticles && !isExploding && !isPreview && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible">
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9, borderWidth: "2.5px" }}
            animate={{ scale: 1.9, opacity: 0, borderWidth: "1px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute w-12 h-12 rounded-full border pointer-events-none"
            style={{ borderColor: blockColor }}
          />

          {ENTRANCE_PARTICLES.map((p) => (
            <motion.div
              key={`enter-${p.id}`}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0.4, 1.25, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.id % 2 === 0 ? "#ffffff" : blockColor,
                boxShadow: `0 0 6px ${blockColor}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ClassBlockComponent);
