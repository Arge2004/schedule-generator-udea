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
    <label className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-100/10 cursor-pointer group transition-all border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}>
      <input
        className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary bg-transparent checked:bg-primary checked:border-primary"
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        onFocus={(e) => e.preventDefault()}
      />
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          {materia?.nombre ? materia.nombre : "Undefined Subject"}
        </span>
        <span className="text-[14px] text-zinc-500 dark:text-zinc-400 font-medium">
          {materia?.codigo ? materia.codigo : "XXXXXX"} - {materia?.grupos ? materia.grupos.length + " grupos" : "undefined grupos"}
        </span>
      </div>
    </label>
  );
}

