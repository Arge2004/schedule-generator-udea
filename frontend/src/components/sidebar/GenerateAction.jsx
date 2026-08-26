/* Hallmark · component: GenerateAction · genre: modern-minimal
 * Bottom action dock:
 * - If generationMode is MANUAL: renders nothing (returns null).
 * - If generationMode is AUTOMATICO: renders the primary Generate Schedule action.
 * - Selection count rendered as a clean badge without parentheses.
 */
import { useMateriasStore } from "../../store/materiasStore.js";
import { CalendarIcon } from "../../icons/index.js";
import { GENERATION_MODES } from "../../constants/sidebar.js";

export default function GenerateAction({
  generationMode,
  isGenerating,
  onGenerate,
}) {
  const { materiasSeleccionadas = {} } = useMateriasStore();

  // En modo manual, no mostrar nada en la parte inferior según requerimiento
  if (generationMode === GENERATION_MODES.MANUAL) {
    return null;
  }

  const selectedMateriasCount = Object.keys(materiasSeleccionadas).length;
  const isDisabled = isGenerating || selectedMateriasCount === 0;

  return (
    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 flex-shrink-0">
      {/* Botón Generar Horarios (Full Width y Prominente) */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isDisabled}
        className={`
          flex-1 h-9 px-4 rounded-md font-bold text-xs transition-all 
          flex items-center justify-center gap-2 shadow-xs cursor-pointer
          ${
            isDisabled
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200/50 dark:border-zinc-700/50 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white active:scale-[0.99]"
          }
        `}
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            <span>Generando…</span>
          </div>
        ) : (
          <>
            <CalendarIcon className="w-4 h-4" />
            <span>Generar Horarios</span>
            {selectedMateriasCount > 0 && (
              <span className="font-mono text-[10.5px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-md tabular-nums border border-white/20">
                {selectedMateriasCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}