import { MODES } from "../../constants/sidebar.js";

export default function ModeToggle({ generationMode, onRequestModeChange }) {
  return (
    <div className="space-y-2">
      <span className="block text-xs text-start font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
        Modo de Generación
      </span>

      <div
        role="group"
        aria-label="Modo de generación"
        className="relative flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 gap-1"
      >
        {MODES.map(({ id, label }) => {
          const isActive = generationMode === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onRequestModeChange(id)}
              aria-pressed={isActive}
              className={`
                flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 
                rounded-md text-sm font-semibold transition-all outline-none
                focus-visible:ring-2 focus-visible:ring-primary/50
                ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 dark:hover:text-white"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}