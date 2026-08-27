import { useMemo, useCallback } from "react";
import { useMateriasStore } from "../../store/materiasStore.js";
import Switch from "../Switch.jsx";
import { HORA_OPTIONS, GENERATION_MODES } from "../../constants/sidebar.js";

export default function SidebarPreferences({
  generationMode,
  horaMinima,
  setHoraMinima,
  evitarHuecos,
  setEvitarHuecos,
  dragEnabled,
  setDragEnabled,
  isMobile,
}) {
  const {
    horariosGenerados = [],
    horarioActualIndex,
    manualBlocks = [],
    allowManualBlocks,
    setAllowManualBlocks,
    allowManualBlocksLocked,
    allowManualBlocksBySchedule,
    setAllowManualBlocksForSchedule,
    updateManualBlock,
  } = useMateriasStore();

  // Comprobar si hay bloques manuales en el horario actual
  const hasBlocksThisSchedule = useMemo(() => {
    return manualBlocks.some((b) => b.scheduleIndex === horarioActualIndex);
  }, [manualBlocks, horarioActualIndex]);

  // Estado del switch para bloques manuales por horario
  const currentAllowManualBlocksForCurrentSchedule = useMemo(() => {
    if (
      allowManualBlocksBySchedule &&
      typeof allowManualBlocksBySchedule[horarioActualIndex] !== "undefined"
    ) {
      return allowManualBlocksBySchedule[horarioActualIndex];
    }
    return hasBlocksThisSchedule;
  }, [allowManualBlocksBySchedule, horarioActualIndex, hasBlocksThisSchedule]);

  // Manejar el toggle de bloques en modo automático
  const handleToggleManualBlocksSchedule = useCallback(() => {
    const hasHorarios = horariosGenerados.length > 0;
    if (!hasHorarios) return;

    const nextState = !currentAllowManualBlocksForCurrentSchedule;
    setAllowManualBlocksForSchedule(horarioActualIndex, nextState);

    // Migrar bloques globales al horario actual si se activa
    if (nextState && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        if (b.scheduleIndex === undefined || b.scheduleIndex === null) {
          updateManualBlock(b.id, { scheduleIndex: horarioActualIndex });
        }
      });
    }
  }, [
    horariosGenerados,
    currentAllowManualBlocksForCurrentSchedule,
    horarioActualIndex,
    manualBlocks,
    setAllowManualBlocksForSchedule,
    updateManualBlock,
  ]);

  const isAutomaticMode = generationMode === GENERATION_MODES.AUTOMATICO;
  const isManualMode = generationMode === GENERATION_MODES.MANUAL && !isMobile;

  if (isAutomaticMode) {
    const hasHorarios = horariosGenerados.length > 0;
    return (
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
          Preferencias
        </p>

        <div className="space-y-3">
          {/* Selector de Hora Mínima */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Hora mínima de clases
              </span>
              <span className="text-xs font-bold text-primary">
                {horaMinima}:00
              </span>
            </div>
            <select
              value={horaMinima}
              onChange={(e) => setHoraMinima(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {HORA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Evitar Huecos */}
          <div
            className="flex items-center justify-between gap-2 cursor-pointer select-none"
            onClick={() => setEvitarHuecos(!evitarHuecos)}
          >
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Evitar horarios con huecos extensos
            </span>
            <Switch
              checked={evitarHuecos}
              onChange={() => setEvitarHuecos(!evitarHuecos)}
              label="Evitar horarios con huecos extensos"
            />
          </div>

          {/* Toggle Bloques Manuales (Desktop) */}
          {!isMobile && (
            <div
              className={`flex items-center justify-between gap-2 cursor-pointer select-none ${!hasHorarios ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => hasHorarios && handleToggleManualBlocksSchedule()}
            >
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Permitir crear bloques manuales (por horario)
              </span>
              <Switch
                checked={currentAllowManualBlocksForCurrentSchedule}
                onChange={handleToggleManualBlocksSchedule}
                disabled={!hasHorarios}
                label="Permitir crear bloques manuales por horario"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isManualMode) {
    return (
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
          Preferencias
        </p>

        <div className="space-y-3">
          {/* Toggle Drag & Drop */}
          <div
            className="flex items-center justify-between gap-2 cursor-pointer select-none"
            onClick={() => setDragEnabled(!dragEnabled)}
          >
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Permitir arrastrar materias al horario
            </span>
            <Switch
              checked={dragEnabled}
              onChange={() => setDragEnabled(!dragEnabled)}
              label="Permitir arrastrar materias al horario"
            />
          </div>

          {/* Toggle Bloques Manuales */}
          <div
            className={`flex items-center justify-between gap-2 cursor-pointer select-none ${allowManualBlocksLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !allowManualBlocksLocked && setAllowManualBlocks(!allowManualBlocks)}
          >
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Permitir crear bloques manuales
            </span>
            <Switch
              checked={allowManualBlocks}
              onChange={() =>
                !allowManualBlocksLocked && setAllowManualBlocks(!allowManualBlocks)
              }
              disabled={allowManualBlocksLocked}
              label="Permitir crear bloques manuales"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}