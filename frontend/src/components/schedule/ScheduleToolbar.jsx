import { useState, useRef, useEffect } from "react";
import Tooltip from "../Tooltip.jsx";
import {
  DownloadIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
} from "../../icons/index.js";

export default function ScheduleToolbar({
  exporting,
  onExportPNG,
  onExportPDF,
  horariosGenerados = [],
  horarioActualIndex = 0,
  onSetHorarioActualIndex,
  onClearSchedule,
  hasContentToClear = false,
  darkTheme,
  onToggleDarkTheme,
  onToggleColorBlobs,
}) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportContainerRef = useRef(null);

  // Cerrar menú de exportar al hacer clic fuera
  useEffect(() => {
    if (!exportMenuOpen) return;
    const onDocClick = (e) => {
      if (exportContainerRef.current?.contains(e.target)) return;
      setExportMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [exportMenuOpen]);

  const scheduleCount = horariosGenerados ? horariosGenerados.length : 0;

  return (
    <div className="h-12 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs px-4 flex items-center justify-between flex-shrink-0 select-none z-20">
      {/* Lado Izquierdo: Botón Exportar + Menú Popover anclado directamente */}
      <div className="flex items-center gap-2">
        <div ref={exportContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={exporting}
            className="h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center gap-1.5  cursor-pointer disabled:opacity-50"
            aria-label="Exportar horario"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>{exporting ? "Exportando…" : "Exportar"}</span>
            <ChevronDownIcon
              className={`w-3 h-3 transition-transform duration-150 ${
                exportMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú Popover de Exportación directamente anclado sobre el botón */}
          {exportMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-36 bg-white dark:bg-zinc-900 rounded-md shadow-2xl border border-zinc-200 dark:border-zinc-800 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportPNG();
                }}
                className="w-full px-3 py-1.5 text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <img src="/png.png" alt="PNG" className="w-3.5 h-3.5" />
                <span>Imagen PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportPDF();
                }}
                className="w-full px-3 py-1.5 text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <img src="/pdf.png" alt="PDF" className="w-3.5 h-3.5" />
                <span>Documento PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Centro: Navegación de Horarios Generados (< 1 / N >) */}
      {scheduleCount > 1 && (
        <div className="flex items-center gap-1.5">
          <Tooltip content="Horario anterior" position="top">
            <button
              type="button"
              onClick={() => {
                const newIndex =
                  horarioActualIndex > 0
                    ? horarioActualIndex - 1
                    : scheduleCount - 1;
                onSetHorarioActualIndex(newIndex);
              }}
              className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white  cursor-pointer flex items-center justify-center"
              aria-label="Horario anterior"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
            {horarioActualIndex + 1} / {scheduleCount}
          </div>

          <Tooltip content="Horario siguiente" position="top">
            <button
              type="button"
              onClick={() => {
                const newIndex =
                  horarioActualIndex < scheduleCount - 1
                    ? horarioActualIndex + 1
                    : 0;
                onSetHorarioActualIndex(newIndex);
              }}
              className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white  cursor-pointer flex items-center justify-center"
              aria-label="Horario siguiente"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Lado Derecho: Limpiar Horario + Efectos de Fondo + Theme Toggle */}
      <div className="flex items-center gap-1.5">
        {/* Botón Limpiar Horario */}
        <button
          type="button"
          onClick={onClearSchedule}
          disabled={!hasContentToClear}
          className={`h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-medium  ${
            hasContentToClear
              ? "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              : "border-transparent bg-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
          }`}
          aria-label="Limpiar horario"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Limpiar horario</span>
        </button>

        {/* Botón Efectos de Fondo (Sparkles) */}
        <Tooltip content="Efectos de fondo dinámicos" position="top-left">
          <button
            type="button"
            onClick={onToggleColorBlobs}
            className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200  cursor-pointer flex items-center justify-center"
            aria-label="Alternar efectos de fondo"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Botón Tema Claro/Oscuro */}
        <Tooltip
          content={darkTheme ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          position="top-left"
        >
          <button
            type="button"
            onClick={onToggleDarkTheme}
            className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200  cursor-pointer flex items-center justify-center"
            aria-label={
              darkTheme ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
            }
          >
            {darkTheme ? (
              <SunIcon className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <MoonIcon className="w-3.5 h-3.5 text-indigo-500" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
