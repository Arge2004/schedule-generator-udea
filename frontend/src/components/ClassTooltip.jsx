import { createPortal } from "react-dom";

export default function ClassTooltip({ clase, color, position }) {
  if (!clase || !position) return null;

  const { materia, grupo, horaInicio, horaFin, aula, profesor, codigoMateria } =
    clase;
  const solidColor = color || "#3b82f6";

  const isPlacementRight = position.placement === "right";

  const tooltipStyle = {
    position: "fixed",
    zIndex: 999999,
    left: isPlacementRight
      ? `${position.x + (position.width || 0) + 8}px`
      : `${position.x + (position.width || 0) / 2}px`,
    top: isPlacementRight ? `${position.y}px` : `${position.y - 8}px`,
    transform: isPlacementRight ? "translateY(0)" : "translate(-50%, -100%)",
    willChange: "transform, left, top",
  };

  const tooltipContent = (
    <div
      className="rounded-md shadow-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-w-[240px] max-w-xs pointer-events-none text-left select-none animate-in fade-in zoom-in-95 duration-75"
      style={tooltipStyle}
    >
      {grupo || codigoMateria || aula ? (
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 min-w-0">
          {grupo !== null && typeof grupo !== "undefined" && (
            <span
              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-2xs leading-none"
              style={{ backgroundColor: solidColor }}
            >
              G{grupo}
            </span>
          )}
          {codigoMateria && (
            <span className="font-mono text-[9.5px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded leading-none">
              #{codigoMateria}
            </span>
          )}
        </div>
        {aula && (
          <span className="font-mono text-[9.5px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 px-1.5 py-0.5 rounded leading-none truncate max-w-[100px]">
            {aula}
          </span>
        )}
      </div>
      ):null}

      {/* 2. Título de la Materia */}
      <h3 className="font-bold text-xs leading-snug text-zinc-900 dark:text-zinc-100 mb-2">
        {materia}
      </h3>

      {/* 3. Horario y Docente */}
      <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">Horario:</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
            {horaInicio}:00 - {horaFin}:00
          </span>
        </div>

        {profesor && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-zinc-400 dark:text-zinc-500">Docente:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
              {profesor}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(tooltipContent, document.body);
}
