import { useMateriasStore } from "../../store/materiasStore.js";
import { MODES } from "../../constants/sidebar.js";

export default function ConfirmModeModal({
  isOpen,
  pendingMode,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const { materiasSeleccionadas = {}, horariosGenerados = [] } = useMateriasStore();

  const scheduleCount = horariosGenerados.length;
  const count = scheduleCount > 0 ? scheduleCount : Object.keys(materiasSeleccionadas).length;
  const unitLabel = scheduleCount > 0 ? "horarios generados" : "materias seleccionadas";
  const targetMode = MODES.find((m) => m.id === pendingMode)?.label || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay para cerrar al hacer clic afuera */}
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />

      {/* Tarjeta Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl z-10 w-full max-w-md border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Cambiar modo de generación
        </h3>

        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 mb-6">
          <p>¿Estás seguro? Esto puede borrar tu configuración actual.</p>
          <p>
            <span className="font-semibold text-red-500 dark:text-red-400">
              {count} {unitLabel}
            </span>{" "}
            se eliminarán al cambiar al modo{" "}
            <span className="font-bold text-primary">{targetMode}</span>.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors
                       bg-zinc-100 text-zinc-700 hover:bg-zinc-200 
                       dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors
                       bg-primary hover:bg-primary/90 shadow-sm cursor-pointer"
          >
            Sí, cambiar
          </button>
        </div>
      </div>
    </div>
  );
}