/* Hallmark · Genre: Modern-Minimal / Workbench · Theme: Terminal
 * Principles:
 * - High-efficiency density without clutter: information structured like a technical workbench.
 * - Monospace schedule columns, real-time availability capacity indicators.
 * - Single-stroke icons, tight 4pt spacing scale, zero fake cards.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchIcon,
  ChevronDownIcon,
  CalendarIcon,
  GearIcon,
} from "../../icons/index.js";
import Switch from "../Switch.jsx";

export default function SidebarWorkbench({
  materias = [],
  onSelectMateria,
  onSelectGrupo,
  materiasSeleccionadas = {},
  gruposSeleccionados = {},
}) {
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // "all" | "open" | "chosen"
  const [showSettings, setShowSettings] = useState(false);
  const [horaMinima, setHoraMinima] = useState(6);
  const [evitarHuecos, setEvitarHuecos] = useState(false);

  const filtered = useMemo(() => {
    return materias.filter((m) => {
      const match =
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.codigo.includes(search);
      if (!match) return false;

      if (filterMode === "chosen") return !!materiasSeleccionadas[m.codigo];
      if (filterMode === "open")
        return m.grupos.some((g) => g.cupoDisponible > 0);
      return true;
    });
  }, [materias, search, filterMode, materiasSeleccionadas]);

  const selectedCount = Object.keys(materiasSeleccionadas).length;

  return (
    <div className="w-full sm:w-[400px] h-full flex flex-col bg-zinc-950 text-zinc-100 border-r border-zinc-800 select-none font-mono text-xs">
      {/* 1. Workbench Command Strip */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="font-bold tracking-tight text-zinc-200 uppercase text-[11px]">
              HORARIOS / UDEA
            </span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded border  ${
              showSettings
                ? "bg-zinc-800 border-zinc-600 text-white"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Ajustes de generación"
          >
            <GearIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input with monospaced prompt */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded focus-within:border-zinc-600">
          <span className="text-zinc-500 text-[11px]">&gt;</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="buscar_materia(codigo | nombre)…"
            className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          {[
            { id: "all", label: `[TODAS ${materias.length}]` },
            { id: "open", label: `[DISPONIBLES]` },
            { id: "chosen", label: `[SELECCIÓN ${selectedCount}]` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-2 py-0.5 rounded  ${
                filterMode === f.id
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-zinc-900 border-b border-zinc-800 space-y-2 text-[11px]"
          >
            <div className="flex items-center justify-between text-zinc-300">
              <span>Hora_Minima:</span>
              <select
                value={horaMinima}
                onChange={(e) => setHoraMinima(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-zinc-200 text-xs"
              >
                {[6, 7, 8, 9, 10, 12, 14].map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-zinc-300 pt-1">
              <span>Evitar_Huecos_Extensos:</span>
              <Switch
                checked={evitarHuecos}
                onChange={() => setEvitarHuecos(!evitarHuecos)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Technical Matrix Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 scrollbar-custom">
        {filtered.map((materia) => {
          const isSelected = !!materiasSeleccionadas[materia.codigo];
          const isExpanded = expandedCode === materia.codigo;
          const chosenGroup = gruposSeleccionados[materia.codigo];
          const totalAvail = materia.grupos.reduce(
            (a, g) => a + g.cupoDisponible,
            0,
          );

          return (
            <div key={materia.codigo} className="">
              <div
                onClick={() =>
                  setExpandedCode(isExpanded ? null : materia.codigo)
                }
                className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-900/60 ${
                  isSelected ? "bg-zinc-900/90 text-white" : "text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMateria(materia.codigo);
                    }}
                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-black font-bold text-[9px]"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    #{materia.codigo}
                  </span>
                  <span className="font-semibold text-xs truncate max-w-[200px]">
                    {materia.nombre}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500 flex-shrink-0">
                  {chosenGroup ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded">
                      G{chosenGroup}
                    </span>
                  ) : (
                    <span>{materia.grupos.length}G</span>
                  )}
                  <span
                    className={
                      totalAvail === 0
                        ? "text-red-500 font-bold"
                        : "text-zinc-400"
                    }
                  >
                    [{totalAvail}]
                  </span>
                </div>
              </div>

              {/* Matrix Group Breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/60 border-t border-zinc-900 px-3 py-2 space-y-1"
                  >
                    {materia.grupos.map((g) => {
                      const isGActive = chosenGroup === g.numero;
                      const soldOut = g.cupoDisponible === 0;

                      return (
                        <div
                          key={g.numero}
                          onClick={() =>
                            !soldOut &&
                            onSelectGrupo(
                              materia.codigo,
                              isGActive ? null : g.numero,
                            )
                          }
                          className={`p-1.5 rounded flex items-center justify-between text-[11px] cursor-pointer  ${
                            isGActive
                              ? "bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 font-bold"
                              : soldOut
                                ? "opacity-30 cursor-not-allowed text-zinc-500"
                                : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center">G{g.numero}</span>
                            <span className="text-[10px] text-zinc-300">
                              {g.horarios
                                .map(
                                  (h) =>
                                    `${h.dias[0]?.slice(0, 3)} ${String(h.horaInicio).padStart(2, "0")}-${String(h.horaFin).padStart(2, "0")}`,
                                )
                                .join(" ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] ${soldOut ? "text-red-500" : "text-emerald-500"}`}
                            >
                              {g.cupoDisponible}/{g.cupoMaximo}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              {isGActive ? "●" : "○"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 3. Workbench Action Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between gap-3">
        <span className="text-[10px] text-zinc-500">
          STATUS: {selectedCount > 0 ? `${selectedCount} READY` : "IDLE"}
        </span>
        <button
          disabled={selectedCount === 0}
          className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 "
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>EJECUTAR GENERACIÓN</span>
        </button>
      </div>
    </div>
  );
}
