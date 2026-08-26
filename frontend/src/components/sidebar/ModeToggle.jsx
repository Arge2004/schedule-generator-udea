/* Hallmark · component: ModeToggle · genre: modern-minimal
 * Segmented control with rounded-md and tactile states.
 */
import { motion } from "framer-motion";
import { MODES } from "../../constants/sidebar.js";

export default function ModeToggle({ generationMode, onRequestModeChange }) {
  return (
    <div
      role="group"
      aria-label="Modo de generación de horarios"
      className="relative flex flex-1 h-8 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-md p-0.5 gap-0.5 items-stretch select-none"
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
              relative z-10 flex-1 h-full cursor-pointer flex items-center justify-center px-2.5 
              rounded-md text-xs font-semibold tracking-tight  duration-150 outline-none
              focus-visible:ring-1 focus-visible:ring-primary
              ${
                isActive
                  ? "text-zinc-900 dark:text-white font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="active-mode-pill"
                className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-md shadow-xs border border-zinc-200/80 dark:border-zinc-700 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? id === "manual"
                      ? "bg-primary"
                      : "bg-emerald-500"
                    : "bg-zinc-400 dark:bg-zinc-600"
                }`}
                aria-hidden="true"
              />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
