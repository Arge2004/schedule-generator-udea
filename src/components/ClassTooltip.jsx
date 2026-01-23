import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip con información detallada de una clase
 */
export default function ClassTooltip({ clase, color, position }) {
  const { materia, grupo, horaInicio, horaFin, aula, profesor } = clase;

  // Asegurar que el color no tenga transparencia
  const solidColor = color || '#3b82f6';

  // Convertir hex a rgba para transparencias válidas
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Calcular estilo según el placement
  const getTooltipStyle = () => {
    const baseStyle = {
      borderColor: solidColor,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      zIndex: 9999,
    };

    if (position.placement === 'right') {
      return {
        ...baseStyle,
        left: `${position.x + (position.width || 0) + 10}px`,
        top: `${position.y}px`,
        transform: 'translateY(0)',
      };
    }

    // Default: top
    return {
      ...baseStyle,
      left: `${position.x}px`,
      top: `${position.y - 10}px`,
      transform: 'translateY(-100%)',
    };
  };

  const tooltipContent = (
    <div 
      className="fixed rounded-lg shadow-2xl border-2 p-4 min-w-[280px] pointer-events-none transition-all duration-300 ease-out bg-white dark:bg-zinc-900"
      style={getTooltipStyle()}
    >
      {/* Header */}
      <div className="mb-3 pb-3 border-b-2 transition-colors duration-300" style={{ borderColor: solidColor }}>
        <h3 
          className="font-bold text-base leading-tight mb-1 transition-colors duration-300"
          style={{ color: solidColor }}
        >
          {materia}
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          Grupo {grupo}
        </p>
      </div>

      {/* Detalles */}
      <div className="space-y-2.5 transition-opacity duration-200">
        {/* Horario y Salón en la misma línea */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: solidColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-zinc-900 dark:text-white font-medium">
            {horaInicio}:00 - {horaFin}:00
          </p>
          {aula && (
            <>
              <span className="text-zinc-400">•</span>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: solidColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-zinc-900 dark:text-white font-medium">
                {aula}
              </p>
            </>
          )}
        </div>

        {/* Profesor */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: solidColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className={`text-sm font-medium ${profesor ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 italic'}`}>
            {profesor || 'Profesor no asignado'}
          </p>
        </div>
      </div>
    </div>
  );

  // Renderizar el tooltip en un portal al nivel del body
  return createPortal(tooltipContent, document.body);
}
