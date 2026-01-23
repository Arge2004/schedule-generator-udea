import React from 'react';

/**
 * Componente que representa una clase/materia dentro de una celda del grid
 * Se expande verticalmente según la duración de la clase
 */
export default function ClassBlock({ clase, onHover, onLeave }) {
  const { materia, grupo, horaInicio, horaFin, aula, color, duracion } = clase;
  const blockRef = React.useRef(null);

  const handleMouseEnter = () => {
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

  return (
    <div
      ref={blockRef}
      className="absolute inset-1 rounded-lg border-2 border-l-[6px] flex flex-col justify-center p-2.5 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 hover:z-20 cursor-pointer"
      style={{
        backgroundColor: color ? `${color}15` : '#3b82f615',
        borderColor: color || '#3b82f6',
        boxShadow: `0 2px 8px ${color ? `${color}30` : '#3b82f630'}, 0 1px 3px ${color ? `${color}20` : '#3b82f620'}`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <div className="flex-shrink-0">
        <p 
          className="font-bold text-xs leading-tight mb-0.5 line-clamp-2"
          style={{ color: color || '#3b82f6' }}
        >
          {materia}
        </p>
        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
          Grupo {grupo}
        </p>
      </div>
      
      <div className="space-y-0.5 mt-2 flex-shrink-0">
        {aula && (
          <div className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[9px] text-zinc-500 font-medium truncate">
              {aula}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px] text-zinc-500 font-medium">
            {horaInicio}:00 - {horaFin}:00
          </span>
        </div>
      </div>
    </div>
  );
}
