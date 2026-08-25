import React from "react";
import { useMateriasStore } from "../../store/materiasStore.js";

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
    horariosGenerados,
    horarioActualIndex,
    manualBlocks,
    allowManualBlocks,
    setAllowManualBlocks,
    allowManualBlocksLocked,
    allowManualBlocksBySchedule,
    setAllowManualBlocksForSchedule,
    updateManualBlock,
  } = useMateriasStore();

  const hasBlocksThisSchedule =
    manualBlocks &&
    manualBlocks.some(
      (b) =>
        typeof b.scheduleIndex === "number" &&
        b.scheduleIndex === horarioActualIndex,
    );
  const currentAllowManualBlocksForCurrentSchedule =
    allowManualBlocksBySchedule &&
    typeof allowManualBlocksBySchedule[horarioActualIndex] !== "undefined"
      ? allowManualBlocksBySchedule[horarioActualIndex]
      : !!hasBlocksThisSchedule;

  // Preferencias de Generación Automática
  if (generationMode === "automatico") {
    return (
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Preferencias
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Hora mínima de clases
              </span>
              <span className="text-xs font-bold text-primary">
                {horaMinima}:00
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={horaMinima}
                onChange={(e) => setHoraMinima(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={6}>6:00 AM</option>
                <option value={7}>7:00 AM</option>
                <option value={8}>8:00 AM</option>
                <option value={9}>9:00 AM</option>
                <option value={10}>10:00 AM</option>
                <option value={11}>11:00 AM</option>
                <option value={12}>12:00 PM</option>
                <option value={13}>1:00 PM</option>
                <option value={14}>2:00 PM</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Evitar horarios con huecos extensos
            </span>
            <button
              onClick={() => setEvitarHuecos(!evitarHuecos)}
              className={`w-8 h-4 outline-none rounded-full relative cursor-pointer transition-colors ${
                evitarHuecos ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${
                  evitarHuecos ? "right-0.5" : "left-0.5"
                }`}
              ></div>
            </button>
          </div>
          {!isMobile && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Permitir crear bloques manuales (por horario)
              </span>
              <button
                onClick={() => {
                  if (!(horariosGenerados && horariosGenerados.length > 0))
                    return;
                  const enable = !currentAllowManualBlocksForCurrentSchedule;
                  setAllowManualBlocksForSchedule(horarioActualIndex, enable);
                  // If enabling per-schedule manual blocks, migrate any global blocks to this schedule
                  if (enable && manualBlocks && manualBlocks.length > 0) {
                    try {
                      manualBlocks.forEach((b) => {
                        if (
                          typeof b.scheduleIndex === "undefined" ||
                          b.scheduleIndex === null
                        ) {
                          updateManualBlock(b.id, {
                            scheduleIndex: horarioActualIndex,
                          });
                        }
                      });
                    } catch (e) {
                      console.error(
                        "Error migrating global manual blocks:",
                        e,
                      );
                    }
                  }
                }}
                className={`w-8 h-4 outline-none rounded-full relative transition-colors ${
                  currentAllowManualBlocksForCurrentSchedule
                    ? "bg-primary"
                    : "bg-zinc-300 dark:bg-zinc-700"
                } ${
                  !(horariosGenerados && horariosGenerados.length > 0)
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div
                  className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${
                    currentAllowManualBlocksForCurrentSchedule
                      ? "right-0.5"
                      : "left-0.5"
                  }`}
                ></div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Preferencias de Generación Manual
  if (generationMode === "manual" && !isMobile) {
    return (
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Preferencias
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Permitir arrastrar materias al horario
            </span>
            <button
              onClick={() => {
                setDragEnabled(!dragEnabled);
              }}
              className={`w-8 h-4 outline-none rounded-full relative cursor-pointer transition-colors ${
                dragEnabled ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${
                  dragEnabled ? "right-0.5" : "left-0.5"
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Permitir crear bloques manuales
            </span>
            <button
              onClick={() => {
                if (!allowManualBlocksLocked)
                  setAllowManualBlocks(!allowManualBlocks);
              }}
              className={`w-8 h-4 outline-none rounded-full relative transition-colors ${
                allowManualBlocks ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
              } ${allowManualBlocksLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div
                className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${
                  allowManualBlocks ? "right-0.5" : "left-0.5"
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
