import React from "react";
import { useMateriasStore } from "../store/materiasStore";

//nombre,codigo,grupos
export default function Subject({materia}) {
  const { materiasSeleccionadas, toggleMateriaSelected } = useMateriasStore();
  const isSelected = !!materiasSeleccionadas[materia?.codigo];

  const handleChange = () => {
    if (materia?.codigo) {
      toggleMateriaSelected(materia.codigo);
    }
  };

  return (
    <label class={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer group transition-all border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}>
      <input
        class="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary bg-transparent checked:bg-primary checked:border-primary"
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
      />
      <div class="flex flex-col items-start">
        <span class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          {materia?.nombre ? materia.nombre : "Undefined Subject"}
        </span>
        <span class="text-[14px] text-zinc-500 font-medium">
          {materia?.codigo ? materia.codigo : "XXXXXX"} - {materia?.grupos ? materia.grupos.length + " grupos" : "undefined grupos"}
        </span>
      </div>
    </label>
  );
}

