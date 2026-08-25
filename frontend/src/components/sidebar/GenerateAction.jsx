import { useMateriasStore } from "../../store/materiasStore.js";
import { CalendarIcon, EyeIcon } from "../../icons";
import { GENERATION_MODES } from "../../constants/sidebar.js";

export default function GenerateAction({
  generationMode,
  isGenerating,
  onGenerate,
  isMobile,
  onShowMobileSchedule,
}) {
  const { materiasSeleccionadas = {}, gruposSeleccionados = {}, darkTheme } = useMateriasStore();

  const hasSelectedGrupos = Object.keys(gruposSeleccionados).length > 0;
  const isAutomaticMode = generationMode === GENERATION_MODES.AUTOMATICO;
  const isManualMode = generationMode === GENERATION_MODES.MANUAL && isMobile && hasSelectedGrupos;

  if (isAutomaticMode) {
    const hasSelectedMaterias = Object.keys(materiasSeleccionadas).length > 0;
    const isDisabled = isGenerating || !hasSelectedMaterias;
    const stripeColor = darkTheme
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(19, 146, 236, 0.03)";

    return (
      <div className="px-4 pb-4">
        <button
          onClick={onGenerate}
          disabled={isDisabled}
          style={
            !hasSelectedMaterias
              ? {
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, ${stripeColor} 5px, ${stripeColor} 6px, transparent 4px, transparent 10px)`,
                }
              : undefined
          }
          className={`
            w-full py-3 text-white font-bold rounded-lg transition-all 
            flex items-center justify-center gap-2 shadow-sm 
            bg-primary hover:bg-primary/90 
            disabled:bg-zinc-100 dark:disabled:bg-zinc-700 
            disabled:cursor-not-allowed disabled:shadow-none
            ${isGenerating ? "cursor-wait" : "cursor-pointer"}
          `}
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <CalendarIcon />
              <span className="text-sm font-semibold">Generar Horarios</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (isManualMode) {
    return (
      <div className="px-4 pb-4">
        <button
          onClick={onShowMobileSchedule}
          className="w-full py-3 cursor-pointer bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <EyeIcon />
          <span className="text-sm font-semibold">Visualizar Horario</span>
        </button>
      </div>
    );
  }

  return null;
}