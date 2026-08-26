/* Hallmark · Component Showcase & Lab · Anti-slop comparison hub */
import { useState } from "react";
import { MOCK_MATERIAS } from "./mockData.js";
import SidebarEditorialLedger from "./SidebarLinearMinimal.jsx";
import SidebarWorkbench from "./SidebarTabbedStudio.jsx";
import SidebarStudioIndex from "./SidebarCompactPro.jsx";
import Schedule from "../Schedule.jsx";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function SidebarShowcase({
  onExitShowcase,
  onSelectVariantAsMain,
}) {
  const [activeVariant, setActiveVariant] = useState("editorial"); // "editorial" | "workbench" | "studio" | "compare"
  const [showcaseMateriasSeleccionadas, setMateriasSeleccionadas] = useState({
    2508101: true,
    2508102: true,
  });
  const [showcaseGruposSeleccionados, setGruposSeleccionados] = useState({
    2508101: 1,
    2508102: 2,
  });

  const { darkTheme, setDarkTheme, materias } = useMateriasStore();

  const handleToggleMateria = (codigo) => {
    setMateriasSeleccionadas((prev) => {
      const next = { ...prev };
      if (next[codigo]) {
        delete next[codigo];
      } else {
        next[codigo] = true;
      }
      return next;
    });
  };

  const handleSelectGrupo = (codigo, numero) => {
    setGruposSeleccionados((prev) => ({
      ...prev,
      [codigo]: numero,
    }));
    if (!showcaseMateriasSeleccionadas[codigo]) {
      handleToggleMateria(codigo);
    }
  };

  const materiasToUse =
    materias && materias.length > 0 ? materias : MOCK_MATERIAS;

  const VARIANTS = [
    {
      id: "editorial",
      title: "1. Editorial Ledger (Atelier)",
      tagline: "Cero cajas dentro de cajas • Reglas hairline continuas",
      desc: "Diseño editorial sobrio: elimina las tarjetas burbuja y usa líneas divisorias sutiles, números tabulares y tipografía con jerarquía pura.",
    },
    {
      id: "workbench",
      title: "2. Workbench Terminal (CLI)",
      tagline: "Matriz técnica de alta densidad • Ajustes inline",
      desc: "Enfoque utilitario de terminal: búsqueda con prompt, filtros directos, capacidades en corchetes y drawer de ajustes sin popovers.",
    },
    {
      id: "studio",
      title: "3. Studio Asymmetric Index",
      tagline: "Anclaje alfabético • Selector de grupos inline",
      desc: "Índice visual ordenado por letras (A, C, D...), indicador izquierdo de acento y chips de grupo horizontales en una sola línea.",
    },
    {
      id: "compare",
      title: "Comparar las 3 en vivo",
      tagline: "Vista de matriz lado a lado",
      desc: "Prueba la interacción de las 3 alternativas simultáneamente en pantalla.",
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top Showcase Toolbar */}
      <header className="h-14 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 flex-shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              Laboratorio de Variantes Hallmark
            </h1>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            Anti-AI-Slop System
          </span>
        </div>

        {/* Variant Selector Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVariant(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold  cursor-pointer ${
                activeVariant === v.id
                  ? "bg-white dark:bg-zinc-900 text-primary shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>

        {/* Utilities: Dark Mode + Apply / Back */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkTheme(!darkTheme)}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            title="Alternar tema claro/oscuro"
          >
            {darkTheme ? "🌙 Oscuro" : "☀️ Claro"}
          </button>
          {onSelectVariantAsMain && activeVariant !== "compare" && (
            <button
              onClick={() => onSelectVariantAsMain(activeVariant)}
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95 "
            >
              Aplicar esta al Sidebar ✓
            </button>
          )}
          {onExitShowcase && (
            <button
              onClick={onExitShowcase}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              Volver a la App ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeVariant === "compare" ? (
          /* Lado a Lado: Comparación de las 3 variantes */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Col 1 */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                    1. Editorial Ledger
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Reglas hairline, cero cajas burbuja
                  </p>
                </div>
                {onSelectVariantAsMain && (
                  <button
                    onClick={() => onSelectVariantAsMain("editorial")}
                    className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary hover:text-white "
                  >
                    Usar
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarEditorialLedger
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              </div>
            </div>

            {/* Col 2 */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                    2. Workbench Terminal
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Matriz técnica de alta densidad
                  </p>
                </div>
                {onSelectVariantAsMain && (
                  <button
                    onClick={() => onSelectVariantAsMain("workbench")}
                    className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary hover:text-white "
                  >
                    Usar
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarWorkbench
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              </div>
            </div>

            {/* Col 3 */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                    3. Studio Index
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Anclaje alfabético, notch de acento
                  </p>
                </div>
                {onSelectVariantAsMain && (
                  <button
                    onClick={() => onSelectVariantAsMain("studio")}
                    className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary hover:text-white "
                  >
                    Usar
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarStudioIndex
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Vista Individual con la Cuadrícula del Horario para Probar en Contexto Real */
          <>
            <div className="h-full flex-shrink-0">
              {activeVariant === "editorial" && (
                <SidebarEditorialLedger
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              )}
              {activeVariant === "workbench" && (
                <SidebarWorkbench
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              )}
              {activeVariant === "studio" && (
                <SidebarStudioIndex
                  materias={materiasToUse}
                  materiasSeleccionadas={showcaseMateriasSeleccionadas}
                  gruposSeleccionados={showcaseGruposSeleccionados}
                  onSelectMateria={handleToggleMateria}
                  onSelectGrupo={handleSelectGrupo}
                />
              )}
            </div>

            {/* Panel derecho: Descripción y Horario */}
            <div className="flex-1 h-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-background-dark">
              <div className="p-4 bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {VARIANTS.find((v) => v.id === activeVariant)?.title} —{" "}
                    <span className="font-normal text-zinc-500">
                      {VARIANTS.find((v) => v.id === activeVariant)?.tagline}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {VARIANTS.find((v) => v.id === activeVariant)?.desc}
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  Interactivo en vivo
                </span>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <Schedule />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
