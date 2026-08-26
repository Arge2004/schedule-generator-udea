import { useState, useEffect, useRef, memo } from "react";
import { useMateriasStore } from "../store/materiasStore.js";
import { TrashIcon } from "../icons/index.js";

function ClassBlockComponent({
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

  const handleBlockClick = (e) => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    if (codigoMateria) {
      const { focusMateria } = useMateriasStore.getState();
      if (focusMateria) focusMateria(codigoMateria);
    }
  };

  const blockColor = color || "#3b82f6";

  return (
    <div
      ref={blockRef}
      onClick={handleBlockClick}
      className={`absolute inset-1 rounded-md border border-l-[3.5px] flex flex-col justify-between items-center py-1 px-1.5 overflow-hidden hover:shadow-md hover:scale-[1.01] hover:z-20 cursor-pointer select-none group transition-transform duration-75 ease-out ${
        isPreview ? "border-dashed opacity-80" : ""
      } ${pulsing ? "pulse-animate" : ""}`}
      data-no-select
      style={{
        backgroundColor: `${blockColor}12`,
        borderColor: blockColor,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      {/* 1. Fila Superior: Badges (Grupo, Aula, Preview) */}
      <div className="flex absolute left-1 items-start w-full justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          {/* Badge de Grupo */}
          {grupo !== null && typeof grupo !== "undefined" && (
            <span
              className="font-mono text-xs font-bold px-1.5 py-0.5 rounded leading-none text-white shadow-2xs"
              style={{ backgroundColor: blockColor }}
            >
              G{grupo}
            </span>
          )}

          {/* Badge de Aula */}
          {aula && (
            <span className="font-mono text-xs font-medium text-primary dark:text-zinc-100 bg-primary/5 border-primary/40 dark:border-primary/40 border px-1 py-0.5 rounded leading-none truncate max-w-[85px]">
              {aula}
            </span>
          )}

          {/* Badge de Preview */}
          {isPreview && (
            <span className="font-mono text-[8.5px] font-bold text-white bg-primary px-1.5 py-0.5 rounded leading-none">
              PREVIEW
            </span>
          )}
        </div>

        {/* Botón de eliminar (para bloques manuales) */}
        {isManual && (
          <button
            type="button"
            onClick={handleDelete}
            title="Eliminar bloque"
            aria-label="Eliminar bloque"
            className="h-4.5 w-4.5 rounded bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <TrashIcon className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* 2. Cuerpo: Nombre de la Materia */}
      <div className="flex-1 min-w-0 my-1 flex items-center">
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
    </div>
  );
}

export default memo(ClassBlockComponent);
