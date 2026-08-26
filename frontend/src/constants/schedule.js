/* Hallmark · constants: schedule · genre: modern-minimal
 * Shared constants, days, hours and palette for the schedule grid.
 */

export const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const HORAS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM (6:00) a 9 PM (21:00)

export const SCHEDULE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#ef4444", // red
];

/**
 * Retorna un color determinista y persistente para cada materia según su código o identificador.
 * Esto asegura que al agregar o remover otras materias, los colores ya asignados nunca cambien.
 */
export function getSubjectColor(identifier) {
  if (!identifier) return SCHEDULE_COLORS[0];
  const str = String(identifier).trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SCHEDULE_COLORS.length;
  return SCHEDULE_COLORS[index];
}

export const formatHora = (hora) => {
  const ampm = hora < 12 ? "AM" : "PM";
  const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
  return `${hora12}:00 ${ampm}`;
};

export const formatHoraCompact = (hora) => {
  return `${String(hora).padStart(2, "0")}:00`;
};
