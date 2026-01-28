import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMateriasStore } from '../store/materiasStore.js';

/**
 * Componente que representa una clase/materia dentro de una celda del grid
 * Se expande verticalmente según la duración de la clase
 */
export default function ClassBlock({ clase, onHover, onLeave, onDelete, onRename, autoEdit, onEditComplete }) {
  const { materia, grupo, horaInicio, horaFin, aula, profesor, color, duracion, isPreview, codigoMateria, source, manualId, pulsing } = clase;
  const blockRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const { materias, gruposSeleccionados, selectGrupo, toggleMateriaSelected } = useMateriasStore();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(materia || '');
  const [displayName, setDisplayName] = React.useState(materia || '');

  React.useEffect(() => {
    setEditText(materia || '');
    setDisplayName(materia || '');
  }, [materia]);

  // Solo considerar como 'manual' los bloques creados manualmente (tienen manualId)
  const isManual = source === 'manual' && !!manualId;

  // If parent requests autoEdit, enter edit mode and focus input (only for manual blocks)
  React.useEffect(() => {
    if (autoEdit && source === 'manual' && !!manualId) {
      setIsEditing(true);
      // focus on next tick when input renders
      setTimeout(() => {
        try { inputRef.current && inputRef.current.focus(); } catch (e) {}
      }, 0);
    }
  }, [autoEdit, source, manualId]);
  const isMobile = window.innerWidth <= 768;

  // Resolver código de materia si no viene en la clase
  const codigo = useMemo(() => {
    if (codigoMateria) return codigoMateria;
    if (!materia || !materias) return undefined;
    const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
    const found = materias.find(m => normalize(m.nombre) === normalize(String(materia)) || m.codigo === codigoMateria);
    return found ? found.codigo : undefined;
  }, [codigoMateria, materia, materias]);

  // Calcular color de fondo del icono como una versión más oscura del color del bloque
  const iconColors = useMemo(() => {
    const fallback = { bg: 'rgba(255,255,255,0.9)', text: '#111827' };
    if (!color) return fallback;
    try {
      const c = String(color).trim();
      const hexMatch = c.match(/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
          hex = hex.split('').map(x => x + x).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const darken = (amt) => {
          const dr = Math.max(0, Math.round(r * (1 - amt)));
          const dg = Math.max(0, Math.round(g * (1 - amt)));
          const db = Math.max(0, Math.round(b * (1 - amt)));
          return `rgb(${dr}, ${dg}, ${db})`;
        };
        const bg = darken(0.1); // 10% darker
        const luminance = (0.1126 * r + 0.1152 * g + 0.0722 * b) / 255;
        const text = luminance < 0.3 ? '#ffffff' : '#111827';
        return { bg, text };
      }
      // Fallback: use provided color but lower opacity
      return { bg: `${c}`, text: '#ffffff' };
    } catch (err) {
      return fallback;
    }
  }, [color]);

  const handleMouseEnter = () => {
    // No activar tooltip en móvil
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

  // Validar conflicto de horarios antes de seleccionar grupo
  const handleGrupoSelect = () => {
    // Si el grupo ya está seleccionado, deseleccionar
    const grupoSeleccionado = gruposSeleccionados[codigoMateria];

    if (grupoSeleccionado === grupo) {
      selectGrupo(codigoMateria, null);
      toggleMateriaSelected(codigoMateria);
      return;
    }
  };

  // Handlers for manual block actions
  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // If this block corresponds to a materia (has codigoMateria), treat delete as deselecting the group
    if (codigoMateria) {
      handleGrupoSelect();
      return;
    }

    // Otherwise (manual block), call parent-provided delete callback if available
    if (onDelete) {
      onDelete();
      return;
    }

    // Fallback: if we somehow have manualId and onDelete expects id, try that
    if (manualId && onDelete) {
      onDelete(manualId);
      return;
    }

    // Last resort, deselect group behavior
    handleGrupoSelect();
  };

  const commitEdit = () => {
    const newName = editText?.trim();
    if (newName && onRename) {
      // call parent-provided bound callback
      onRename(newName);
    }
    // update local display immediately and close editor (optimistic)
    setEditText(newName || '');
    setDisplayName(newName || '');
    setIsEditing(false);

    // notify parent that edit completed (useful to trigger confetti)
    try { if (onEditComplete) onEditComplete(newName); } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(materia || '');
    }
  };


  return (
    <motion.div
      ref={blockRef}
      // Slide enter/exit so permanent blocks animate visibly
      initial={{ x: '-80%', opacity: 0, scale: isPreview ? 0.95 : 0.98 }}
      animate={{ x: 0, opacity: isPreview ? 0.75 : 1, scale: 1 }}
      exit={{ x: '1000%', opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 20,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.15 }
      }}
      className={`absolute select-none inset-1 rounded-lg border-2 border-l-[6px] flex flex-col justify-center p-2.5 overflow-hidden hover:shadow-lg hover:z-20 cursor-pointer group ${isPreview ? 'border-dashed' : ''} ${pulsing ? 'pulse-animate' : ''}`}
      data-no-select
      style={{
        backgroundColor: color ? `${color}15` : '#3b82f615',
        borderColor: color || '#3b82f6',
        boxShadow: `0 2px 8px ${color ? `${color}30` : '#3b82f630'}, 0 1px 3px ${color ? `${color}20` : '#3b82f620'}`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <div className='absolute h-full right-0'>
        {/* Botón de eliminar (solo para grupos manuales) - Arriba */}
        {isManual && (
          <button
            onClick={handleDelete}
            title="Eliminar del horario"
            className="absolute -right-1 -top-0 cursor-pointer bg-red-600 w-7 h-7 rounded-sm flex items-center justify-center opacity-0 transition-opacity duration-150 ease-in-out group-hover:opacity-100 hover:opacity-100"
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
        
        {/* Botón Ver Cursum - Abajo */}
        {codigo && (
          <a
            href={`https://ingenieria2.udea.edu.co/cursum/#/publico/materias/${codigo}/programa_curso`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Ver en Cursum"
            className="absolute -right-1 -bottom-1 px-2 py-2 rounded-sm flex items-center justify-center gap-1 text-[12px] font-semibold whitespace-nowrap opacity-0 md:opacity-0 max-md:opacity-100 pointer-events-none md:pointer-events-none max-md:pointer-events-auto transition-opacity duration-150 ease-in-out group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
            style={{ backgroundColor: iconColors.bg, color: iconColors.text }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            <span>Ver Cursum</span>
          </a>
        )}
      </div>

      <div className="flex-shrink-0">
        {isPreview && (
          <span className="text-[9px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded mb-1 inline-block">
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
            className="w-full text-xs font-bold p-1 rounded border border-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 bg-white dark:bg-zinc-800"
            style={{ color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? '#ffffff' : '#111827', caretColor: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? '#ffffff' : '#111827' }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Editar nombre del bloque"
          />
        ) : (
          <p
            onDoubleClick={() => isManual && setIsEditing(true)}
            className="font-bold text-xs leading-tight mb-0.5 line-clamp-2 cursor-text"
            style={{ color: color || '#3b82f6' }}
          >
            {displayName}
          </p>
        )}
        {grupo ? (
          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
            Grupo {grupo}
          </p>
        ) : null}
      </div>

      <div className="space-y-0.5 mt-2 flex-shrink-0">
        {aula && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] text-zinc-500 font-medium truncate">
              {aula}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-zinc-500 font-medium">
            {horaInicio}:00 - {horaFin}:00
          </span>
        </div>
        {profesor && isMobile && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] text-zinc-500 font-medium truncate">
              {profesor}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
