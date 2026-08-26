import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMateriasStore } from "../store/materiasStore.js";
import { TrashIcon } from "../icons/index.js";

export default function ClassBlock({
  clase,
  onHover,
  onLeave,
  onDelete,
  onRename,
  autoEdit,
  onEditComplete,
}) {
  const {
    materia,
    grupo,
    horaInicio,
    horaFin,
    aula,
    profesor,
    color,
    duracion,
    isPreview,
    codigoMateria,
    source,
    manualId,
    pulsing,
  } = clase;

  const blockRef = useRef(null);
  const inputRef = useRef(null);
  const { materias, gruposSeleccionados, selectGrupo, toggleMateriaSelected } =
    useMateriasStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(materia || "");
  const [displayName, setDisplayName] = useState(materia || "");

  useEffect(() => {
    setEditText(materia || "");
    setDisplayName(materia || "");
  }, [materia]);

  const isManual = source === "manual" && Boolean(manualId);

  useEffect(() => {
    if (autoEdit && isManual) {
      setIsEditing(true);
      setTimeout(() => {
        try {
          inputRef.current?.focus();
        } catch (e) {}
      }, 0);
    }
  }, [autoEdit, isManual]);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const codigo = useMemo(() => {
    if (codigoMateria) return codigoMateria;
    if (!materia || !materias) return undefined;
    const normalize = (s = "") =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    const found = materias.find(
      (m) =>
        normalize(m.nombre) === normalize(String(materia)) ||
        m.codigo === codigoMateria,
    );
    return found ? found.codigo : undefined;
  }, [codigoMateria, materia, materias]);

  const handleMouseEnter = () => {
    if (isMobile) return;
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
    const grupoSeleccionado = gruposSeleccionados[codigoMateria];
    if (grupoSeleccionado === grupo) {
      selectGrupo(codigoMateria, null);
      toggleMateriaSelected(codigoMateria);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (codigoMateria) {
      handleGrupoSelect();
      return;
    }

    if (onDelete) {
      onDelete();
      return;
    }

    handleGrupoSelect();
  };

  const commitEdit = () => {
    const newName = editText?.trim();
    const finalName = newName && newName.length > 0 ? newName : "Bloque manual";
    if (onRename) {
      try {
        onRename(finalName);
      } catch (err) {}
    }
    setEditText(finalName);
    setDisplayName(finalName);
    setIsEditing(false);

    try {
      if (onEditComplete) onEditComplete(finalName);
    } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(materia || "");
    }
  };

  const blockColor = color || "#3b82f6";

  return (
    <motion.div
      ref={blockRef}
      // Animación en su propia celda/fila sin saltos ni vuelos desde fuera
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: isPreview ? 0.75 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{
        duration: 0.18,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.1 },
      }}
      className={`absolute inset-1 rounded-md border border-l-4 flex flex-col justify-between p-2 overflow-hidden hover:shadow-md hover:z-20 cursor-pointer select-none group transition-shadow ${
        isPreview ? "border-dashed" : ""
      } ${pulsing ? "pulse-animate" : ""}`}
      data-no-select
      style={{
        backgroundColor: `${blockColor}15`,
        borderColor: blockColor,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      {/* Botón de eliminar (para bloques manuales) */}
      {isManual && (
        <button
          type="button"
          onClick={handleDelete}
          title="Eliminar bloque"
          aria-label="Eliminar bloque"
          className="absolute right-1 top-1 h-5 w-5 rounded-md bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-30"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      )}

      {/* Contenido Superior: Nombre de Materia / Grupo / Preview */}
      <div className="flex-1 min-w-0">
        {isPreview && (
          <span className="text-[9px] font-bold text-white bg-black/60 px-1 py-0.5 rounded-sm mb-1 inline-block">
            PREVIEW
          </span>
        )}

        {isEditing && isManual ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-xs font-bold p-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Editar nombre del bloque"
          />
        ) : (
          <p
            onDoubleClick={() => isManual && setIsEditing(true)}
            className="font-bold text-xs leading-tight line-clamp-2"
            style={{ color: blockColor }}
          >
            {displayName}
          </p>
        )}

        {grupo ? (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-medium mt-0.5">
            Grupo {grupo}
          </p>
        ) : null}
      </div>

      {/* Contenido Inferior: Aula y Horario */}
      <div className="space-y-0.5 mt-1.5 flex-shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
        {aula && (
          <div className="flex items-center gap-1 truncate">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">
              Aula:
            </span>
            <span className="truncate">{aula}</span>
          </div>
        )}
        <div className="flex items-center gap-1 tabular-nums">
          <span>
            {horaInicio}:00 - {horaFin}:00
          </span>
        </div>
      </div>
    </motion.div>
  );
}
