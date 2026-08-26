/* Hallmark · component: FilterPopover · genre: modern-minimal
 * Protruding advanced filter popover with:
 * - A-Z letter selector
 * - Time interval range (start hour / end hour)
 * - Shift / Jornada presets (Mañana, Tarde, Noche)
 * - Day of the week filters (L, M, W, J, V, S)
 * - Clean soft borders, rounded-md everywhere.
 */
import { HORA_OPTIONS } from "../../constants/sidebar.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIAS_SEMANA = [
  { id: "Lunes", label: "Lun" },
  { id: "Martes", label: "Mar" },
  { id: "Miércoles", label: "Mié" },
  { id: "Jueves", label: "Jue" },
  { id: "Viernes", label: "Vie" },
  { id: "Sábado", label: "Sáb" },
];

export default function FilterPopover({
  isOpen,
  onClose,
  selectedLetter,
  onSelectLetter,
  horaMinimaFilter,
  onSetHoraMinimaFilter,
  horaMaximaFilter,
  onSetHoraMaximaFilter,
  selectedJornada,
  onSelectJornada,
  selectedDias = [],
  onToggleDia,
  onResetFilters,
}) {
  if (!isOpen) return null;

  const hasActiveFilters =
    Boolean(selectedLetter) ||
    horaMinimaFilter > 6 ||
    horaMaximaFilter < 22 ||
    Boolean(selectedJornada) ||
    selectedDias.length > 0;

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover protruding to the right of the sidebar */}
      <div className="absolute left-[calc(100%+8px)] top-0 z-50 w-80 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 space-y-4 text-xs select-none animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
            <span>Filtros Avanzados</span>
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] dark:border-zinc-800 px-4 py-1 rounded-md font-semibold text-primary hover:bg-zinc-100 cursor-pointer"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 1. Filter by Initial Letter (A-Z) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            <span>Letra inicial</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {ALPHABET.map((letter) => {
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => onSelectLetter(isSelected ? null : letter)}
                  className={`h-6 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Filter by Shift / Jornada */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
            Jornada / Franja horaria
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                id: "manana",
                label: "Mañana",
                range: "06:00 - 12:00",
                min: 6,
                max: 12,
              },
              {
                id: "tarde",
                label: "Tarde",
                range: "12:00 - 18:00",
                min: 12,
                max: 18,
              },
              {
                id: "noche",
                label: "Noche",
                range: "18:00 - 22:00",
                min: 18,
                max: 22,
              },
            ].map((jornada) => {
              const isActive = selectedJornada === jornada.id;
              return (
                <button
                  key={jornada.id}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      onSelectJornada(null);
                      onSetHoraMinimaFilter(6);
                      onSetHoraMaximaFilter(22);
                    } else {
                      onSelectJornada(jornada.id);
                      onSetHoraMinimaFilter(jornada.min);
                      onSetHoraMaximaFilter(jornada.max);
                    }
                  }}
                  className={`p-1.5 rounded-md border text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-[11px] font-semibold">
                    {jornada.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {jornada.range}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Filter by Day of the Week */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
            Días con clase
          </span>
          <div className="grid grid-cols-6 gap-1">
            {DIAS_SEMANA.map((d) => {
              const isSelected = selectedDias.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onToggleDia(d.id)}
                  className={`h-6 rounded-md font-mono text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Filter by Exact Time Range */}
        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
            Rango de horas personalizado
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 block">
                Inicio desde
              </label>
              <select
                value={horaMinimaFilter}
                onChange={(e) => {
                  onSetHoraMinimaFilter(Number(e.target.value));
                  onSelectJornada(null);
                }}
                className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {HORA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 block">
                Fin antes de
              </label>
              <select
                value={horaMaximaFilter}
                onChange={(e) => {
                  onSetHoraMaximaFilter(Number(e.target.value));
                  onSelectJornada(null);
                }}
                className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {[...HORA_OPTIONS, { value: 22, label: "22:00" }].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
