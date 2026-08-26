import { DIAS } from "../../constants/schedule.js";

export default function ScheduleHeader({ dias = DIAS }) {
  return (
    <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] bg-zinc-50/90 dark:bg-zinc-900/60 border-b border-zinc-200/80 dark:border-zinc-800 flex-shrink-0 select-none">
      {/* Esquina superior izquierda (celda vacía) */}
      <div className="border-r border-zinc-200/80 dark:border-zinc-800 py-2.5 px-2 flex items-center justify-center">
        <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          Hora
        </span>
      </div>

      {/* Columnas de los Días de la semana */}
      {dias.map((dia) => (
        <div
          key={dia}
          className="py-2.5 px-3 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200/80 dark:border-zinc-800/80 last:border-r-0 tracking-tight flex items-center justify-center"
        >
          {dia}
        </div>
      ))}
    </div>
  );
}
