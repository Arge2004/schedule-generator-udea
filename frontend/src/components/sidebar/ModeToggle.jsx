import React from "react";

export default function ModeToggle({ generationMode, onRequestModeChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-start font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
        Modo de Generación
      </p>
      <div className="relative flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 gap-1">
        <button
          onClick={() => onRequestModeChange("manual")}
          className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none ${
            generationMode === "manual"
              ? "bg-primary text-white shadow-sm"
              : "text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white"
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => onRequestModeChange("automatico")}
          className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none ${
            generationMode === "automatico"
              ? "bg-primary text-white shadow-sm"
              : "text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white"
          }`}
        >
          Automático
        </button>
      </div>
    </div>
  );
}
