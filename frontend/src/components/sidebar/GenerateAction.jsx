import React from "react";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function GenerateAction({
  generationMode,
  isGenerating,
  onGenerate,
  isMobile,
  onShowMobileSchedule,
}) {
  const { materiasSeleccionadas, gruposSeleccionados, darkTheme } =
    useMateriasStore();

  const selectedCount = materiasSeleccionadas
    ? Object.keys(materiasSeleccionadas).length
    : 0;

  // Botón Generar Horario - Solo en modo automático
  if (generationMode === "automatico") {
    return (
      <div className="px-4 pb-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating || selectedCount === 0}
          className={`w-full py-3 ${
            isGenerating
              ? "bg-[#1392ec] cursor-not-allowed"
              : "cursor-pointer bg-[#1392ec] hover:bg-[#1392ec]/90 disabled:bg-zinc-100 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed"
          } text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none`}
          style={
            selectedCount === 0
              ? {
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 4px,
                    ${darkTheme ? "rgba(255, 255, 255, 0.03)" : "rgba(19, 146, 236, 0.03)"} 5px,
                    ${darkTheme ? "rgba(255, 255, 255, 0.03)" : "rgba(19, 146, 236, 0.03)"} 6px,
                    transparent 4px,
                    transparent 10px
                  )`,
                }
              : {}
          }
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block" />
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-semibold">Generar Horarios</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Botón Visualizar Horario - Solo en modo manual y móvil
  if (
    generationMode === "manual" &&
    isMobile &&
    gruposSeleccionados &&
    Object.keys(gruposSeleccionados).length > 0
  ) {
    return (
      <div className="px-4 pb-4">
        <button
          onClick={onShowMobileSchedule}
          className="w-full py-3 cursor-pointer bg-[#1392ec] hover:bg-[#1392ec]/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="text-sm font-semibold">Visualizar Horario</span>
        </button>
      </div>
    );
  }

  return null;
}
