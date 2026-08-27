import { createPortal } from "react-dom";
import { useMateriasStore } from "../../store/materiasStore.js";
import { MODES } from "../../constants/sidebar.js";

export default function ConfirmModeModal({
  isOpen,
  pendingMode,
  onConfirm,
  onCancel,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  const { materiasSeleccionadas = {}, horariosGenerados = [] } =
    useMateriasStore();

  const scheduleCount = horariosGenerados.length;
  const count =
    scheduleCount > 0
      ? scheduleCount
      : Object.keys(materiasSeleccionadas).length;
  const unitLabel =
    scheduleCount > 0 ? "horarios generados" : "materias seleccionadas";
  const targetMode = MODES.find((m) => m.id === pendingMode)?.label || "";

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-mode-title"
    >
      {/* Overlay para cerrar al hacer clic afuera */}
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />

      {/* Tarjeta Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl z-10 w-full max-w-sm border border-zinc-200/80 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 text-left">
        <h3
          id="confirm-mode-title"
          className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2"
        >
          ¿Cambiar a modo {targetMode}?
        </h3>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 mb-6">
          <p>
            Al cambiar de modo se reiniciará tu selección actual para evitar
            inconsistencias.
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
            Se descartarán{" "}
            <span className="font-bold font-mono text-amber-950 dark:text-amber-200">
              {count} {unitLabel}
            </span>
            .
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 h-9 px-4 rounded-xl text-xs font-semibold  duration-150
                       bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 
                       hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="flex-1 h-9 px-4 rounded-xl text-xs font-semibold text-white  duration-150
                       bg-primary hover:bg-primary/90 shadow-xs cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
