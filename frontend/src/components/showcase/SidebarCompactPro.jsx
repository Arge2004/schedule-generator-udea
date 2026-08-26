/* Hallmark · Genre: Studio / Asymmetric Index · Theme: Studio
 * Principles:
 * - Asymmetric layout with alphabetical index anchors (A · C · D · G · I).
 * - Left accent indicator notch on selected items (no full background fill).
 * - Instant inline group pills on hover to eliminate unnecessary clicks.
 * - Pure typographic hierarchy with high-contrast human readability.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, CalendarIcon } from "../../icons/index.js";

export default function SidebarStudioIndex({
  materias = [],
  onSelectMateria,
  onSelectGrupo,
  materiasSeleccionadas = {},
  gruposSeleccionados = {},
}) {
  const [search, setSearch] = useState("");
  const [hoveredMateria, setHoveredMateria] = useState(null);

  // Group materias by first letter
  const groupedMaterias = useMemo(() => {
    const filtered = materias.filter(
      (m) =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.codigo.includes(search),
    );

    const groups = {};
    filtered.forEach((m) => {
      const letter = m.nombre.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(m);
    });

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        items: groups[letter],
      }));
  }, [materias, search]);

  const selectedCount = Object.keys(materiasSeleccionadas).length;

  return (
    <div className="w-full sm:w-[400px] h-full flex flex-col bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 border-r border-stone-200 dark:border-zinc-800 select-none font-sans">
      {/* 1. Studio Header */}
      <div className="p-4 pb-3 border-b border-stone-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-white">
            Materias Académicas
          </h2>
          <span className="text-[11px] font-mono text-stone-400 dark:text-zinc-500 tabular-nums">
            {selectedCount} seleccionadas
          </span>
        </div>

        {/* Minimalist Search Bar with Border Underline */}
        <div className="relative flex items-center">
          <SearchIcon className="w-3.5 h-3.5 text-stone-400 absolute left-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="w-full pl-6 pr-6 py-1 bg-transparent text-xs text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none border-b border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-white "
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-0 text-xs text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Asymmetric Letter Index List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-custom">
        {groupedMaterias.map(({ letter, items }) => (
          <div key={letter} className="space-y-1">
            {/* Letter Anchor */}
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200/50 dark:border-zinc-800/60">
              <span className="text-[11px] font-mono font-bold text-stone-400 dark:text-zinc-500">
                {letter}
              </span>
              <div className="flex-1 h-px bg-stone-200/40 dark:bg-zinc-800/40" />
            </div>

            {/* Subject Items */}
            <div className="space-y-1 pt-1">
              {items.map((materia) => {
                const isSelected = !!materiasSeleccionadas[materia.codigo];
                const chosenGroup = gruposSeleccionados[materia.codigo];
                const isHovered = hoveredMateria === materia.codigo;

                return (
                  <div
                    key={materia.codigo}
                    onMouseEnter={() => setHoveredMateria(materia.codigo)}
                    onMouseLeave={() => setHoveredMateria(null)}
                    className={`relative pl-3 pr-2 py-2 rounded-lg  duration-150 ${
                      isSelected
                        ? "bg-white dark:bg-zinc-900 shadow-xs text-stone-900 dark:text-white"
                        : "hover:bg-stone-200/40 dark:hover:bg-zinc-900/40"
                    }`}
                  >
                    {/* Left Accent Notch for Selected Items */}
                    {isSelected && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => onSelectMateria(materia.codigo)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                            #{materia.codigo}
                          </span>
                          {chosenGroup && (
                            <span className="text-[9.5px] font-mono font-bold text-primary bg-primary/10 px-1 rounded">
                              G{chosenGroup}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold leading-tight truncate mt-0.5">
                          {materia.nombre}
                        </h4>
                      </div>

                      {/* Right Checkbox / Toggle */}
                      <button
                        onClick={() => onSelectMateria(materia.codigo)}
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold  cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white"
                            : "text-stone-400 hover:text-stone-900 dark:hover:text-white"
                        }`}
                      >
                        {isSelected ? "✓" : "+"}
                      </button>
                    </div>

                    {/* Inline Group Pills on Click or Selection */}
                    {isSelected &&
                      materia.grupos &&
                      materia.grupos.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto">
                          <span className="text-[10px] font-mono text-stone-400 uppercase">
                            Grupos:
                          </span>
                          {materia.grupos.map((g) => {
                            const isGActive = chosenGroup === g.numero;
                            const noCupo = g.cupoDisponible === 0;

                            return (
                              <button
                                key={g.numero}
                                disabled={noCupo}
                                onClick={() =>
                                  onSelectGrupo(
                                    materia.codigo,
                                    isGActive ? null : g.numero,
                                  )
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold  cursor-pointer ${
                                  isGActive
                                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                                    : noCupo
                                      ? "opacity-30 line-through cursor-not-allowed bg-stone-100 dark:bg-zinc-800 text-stone-400"
                                      : "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700"
                                }`}
                                title={`Grupo ${g.numero}: ${g.cupoDisponible} cupos`}
                              >
                                G{g.numero} ({g.cupoDisponible})
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Studio Footer */}
      <div className="p-3.5 border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
        <span className="text-[11px] font-mono text-stone-500">
          {selectedCount > 0
            ? `${selectedCount} listas para combinar`
            : "Selecciona materias"}
        </span>
        <button
          disabled={selectedCount === 0}
          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 "
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Generar</span>
        </button>
      </div>
    </div>
  );
}
