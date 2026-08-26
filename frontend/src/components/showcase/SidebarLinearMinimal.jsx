/* Hallmark · Genre: Editorial / Ledger · Theme: Atelier
 * Principles:
 * - NO card-in-card nesting: pure typographic rhythm separated by hairline rules.
 * - Tabular numbers for all codes, quotas, and hours.
 * - Single accent hue used strictly as a highlighter (< 3% surface).
 * - Honest, breathable editorial layout with asymmetric metadata columns.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchIcon,
  ChevronDownIcon,
  CalendarIcon,
  ClockIcon,
} from "../../icons/index.js";

export default function SidebarEditorialLedger({
  materias = [],
  onSelectMateria,
  onSelectGrupo,
  materiasSeleccionadas = {},
  gruposSeleccionados = {},
}) {
  const [mode, setMode] = useState("manual");
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState(null);

  const filtered = useMemo(() => {
    return materias.filter(
      (m) =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.codigo.includes(search),
    );
  }, [materias, search]);

  const selectedCount = Object.keys(materiasSeleccionadas).length;

  return (
    <div className="w-full sm:w-[400px] h-full flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 select-none font-sans text-zinc-900 dark:text-zinc-100">
      {/* 1. Header: Clean Editorial Masthead */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3.5 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Catálogo
            </span>
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">
              ({filtered.length} materias)
            </span>
          </div>

          {/* Mode Switcher: Understated Editorial Segment */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-white dark:bg-zinc-900 text-[11px] font-medium">
            <button
              onClick={() => setMode("manual")}
              className={`px-2.5 py-1 rounded-md  ${
                mode === "manual"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode("auto")}
              className={`px-2.5 py-1 rounded-md  ${
                mode === "auto"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              Automático
            </button>
          </div>
        </div>

        {/* Search: Typographic rule input without heavy box chrome */}
        <div className="relative flex items-center border-b border-zinc-300 dark:border-zinc-700 pb-1.5 focus-within:border-primary ">
          <SearchIcon className="w-3.5 h-3.5 text-zinc-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nombre o código…"
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Body: Continuous Editorial Ledger (No Bubble Cards!) */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/70 dark:divide-zinc-800/80 scrollbar-custom">
        {filtered.map((materia) => {
          const isSelected = !!materiasSeleccionadas[materia.codigo];
          const isExpanded = expandedCode === materia.codigo;
          const chosenGroup = gruposSeleccionados[materia.codigo];
          const totalCupos = materia.grupos.reduce(
            (acc, g) => acc + g.cupoDisponible,
            0,
          );

          return (
            <div
              key={materia.codigo}
              className={` ${
                isSelected
                  ? "bg-zinc-50 dark:bg-zinc-900/50"
                  : "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30"
              }`}
            >
              {/* Row Header */}
              <div
                onClick={() => {
                  if (mode === "manual") {
                    setExpandedCode(isExpanded ? null : materia.codigo);
                  } else {
                    onSelectMateria(materia.codigo);
                  }
                }}
                className="p-3.5 flex items-start gap-3 cursor-pointer"
              >
                {/* Left Margin Column: Code & State Indicator */}
                <div className="w-16 flex-shrink-0 pt-0.5">
                  <span className="font-mono text-[11px] font-medium text-zinc-400 dark:text-zinc-500 block">
                    {materia.codigo}
                  </span>
                  {chosenGroup && (
                    <span className="inline-block mt-1 font-mono text-[10px] font-bold text-primary bg-primary/10 px-1 rounded">
                      G{chosenGroup}
                    </span>
                  )}
                </div>

                {/* Center Column: Subject Title */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {materia.nombre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>{materia.grupos.length} grupos</span>
                    <span>•</span>
                    <span
                      className={
                        totalCupos === 0
                          ? "text-red-500 font-semibold"
                          : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {totalCupos === 0 ? "Sin cupos" : `${totalCupos} cupos`}
                    </span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex-shrink-0 pt-0.5">
                  {mode === "manual" ? (
                    <ChevronDownIcon
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={totalCupos === 0}
                      onChange={() => onSelectMateria(materia.codigo)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Accordion: Structured Typographic Table */}
              <AnimatePresence initial={false}>
                {mode === "manual" && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden bg-zinc-100/60 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs font-mono">
                      {materia.grupos.map((g) => {
                        const isGroupActive = chosenGroup === g.numero;
                        const noQuota = g.cupoDisponible === 0;

                        return (
                          <div
                            key={g.numero}
                            onClick={() =>
                              !noQuota &&
                              onSelectGrupo(
                                materia.codigo,
                                isGroupActive ? null : g.numero,
                              )
                            }
                            className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer  ${
                              isGroupActive
                                ? "bg-primary/10 text-primary font-bold"
                                : noQuota
                                  ? "opacity-40 cursor-not-allowed text-zinc-400"
                                  : "hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 font-bold">
                                G{String(g.numero).padStart(2, "0")}
                              </span>
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] text-zinc-800 dark:text-zinc-200">
                                  {g.horarios
                                    .map(
                                      (h) =>
                                        `${h.dias.map((d) => d.slice(0, 3)).join(", ")} ${String(h.horaInicio).padStart(2, "0")}:00-${String(h.horaFin).padStart(2, "0")}:00`,
                                    )
                                    .join(" | ")}
                                </span>
                                {g.profesor && (
                                  <span className="text-[10px] text-zinc-400 font-sans truncate max-w-[170px]">
                                    {g.profesor}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`text-[11px] tabular-nums ${noQuota ? "text-red-500 font-bold" : "text-emerald-600 dark:text-emerald-400"}`}
                              >
                                {g.cupoDisponible}/{g.cupoMaximo}
                              </span>
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  isGroupActive
                                    ? "border-primary bg-primary"
                                    : "border-zinc-400 dark:border-zinc-600"
                                }`}
                              >
                                {isGroupActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 3. Dock: Honest Typographic Close */}
      <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-mono text-zinc-500">
            {selectedCount} de {materias.length} seleccionadas
          </span>
        </div>
        <button
          disabled={selectedCount === 0}
          className="h-9 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white active:scale-95  disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Generar Horarios</span>
        </button>
      </div>
    </div>
  );
}
