import React from "react";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function ConfirmModeModal({
  isOpen,
  pendingMode,
  onConfirm,
  onCancel,
}) {
  const { materiasSeleccionadas, horariosGenerados } = useMateriasStore();

  if (!isOpen) return null;

  const scheduleCount = horariosGenerados ? horariosGenerados.length : 0;
  const subjectsCount = materiasSeleccionadas
    ? Object.keys(materiasSeleccionadas).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 z-10 w-full max-w-md">
        <h3 className="text-lg mb-2 text-primary">
          Cambiar modo de generación
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          <span className="block">
            ¿Estás seguro? Esto puede borrar tu horario actual.
          </span>
          <span className="block mt-1 text-white dark:text-zinc-900">.</span>
          {scheduleCount > 0 ? (
            <span>
              <span className="text-red-600">
                {scheduleCount} horarios{" "}
              </span>
              generados serán eliminados al cambiar a{" "}
              <span className="font-bold text-primary/80">
                {pendingMode === "manual" ? "Manual" : "Automático"}
              </span>
              .
            </span>
          ) : (
            <span>
              <span className="text-red-600">
                {subjectsCount} materias{" "}
              </span>
              seleccionadas serán eliminadas al cambiar a{" "}
              <span className="font-bold text-primary/80">
                {pendingMode === "manual" ? "Manual" : "Automático"}
              </span>
              .
            </span>
          )}
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 w-[125px] rounded-md bg-zinc-300 text-zinc-900 hover:bg-zinc-300/80 cursor-pointer dark:text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 w-[125px] rounded-md bg-primary hover:bg-primary/80 cursor-pointer text-white"
          >
            Sí, cambiar
          </button>
        </div>
      </div>
    </div>
  );
}
