import React, { useMemo, useState } from 'react';
import ClassBlock from './ClassBlock';
import ClassTooltip from './ClassTooltip';
import { useMateriasStore } from '../store/materiasStore';

export default function Schedule() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM a 10 PM (22:00)

    const { horariosGenerados, horarioActualIndex, gruposSeleccionados, materias } = useMateriasStore();
    
    // Estado global del tooltip
    const [tooltipData, setTooltipData] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const hideTimeoutRef = React.useRef(null);

    const handleClassHover = (clase, position) => {
        // Cancelar cualquier timeout de ocultación
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        
        // Calcular el mejor posicionamiento del tooltip
        const minSpaceAbove = window.innerHeight * 0.25; // 15% de la altura del viewport
        const spaceAbove = position.y;
        const spaceRight = window.innerWidth - (position.x + position.width);
        
        let finalPosition = { ...position };
        
        // Si no hay suficiente espacio arriba, intentar posicionar a la derecha
        if (spaceAbove < minSpaceAbove && spaceRight > 300) {
            finalPosition.placement = 'right';
        } else {
            finalPosition.placement = 'top';
        }
        
        setTooltipData(clase);
        setTooltipPosition(finalPosition);
    };

    const handleClassLeave = () => {
        // Esperar un poco antes de ocultar por si pasa a otra clase
        hideTimeoutRef.current = setTimeout(() => {
            setTooltipData(null);
        }, 100);
    };

    // Colores predefinidos para las materias
    const colores = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#10b981', // green
        '#f59e0b', // amber
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
    ];

    // Construir lista de clases para renderizar
    const clasesParaRenderizar = useMemo(() => {
        const clases = [];
        let gruposParaProcesar = [];

        // Si hay horarios generados, usar el horario actual
        if (horariosGenerados && horariosGenerados.length > 0) {
            const horarioSeleccionado = horariosGenerados[horarioActualIndex];
            if (horarioSeleccionado && horarioSeleccionado.grupos) {
                gruposParaProcesar = horarioSeleccionado.grupos.map((g, idx) => ({
                    nombreMateria: g.nombreMateria,
                    numeroGrupo: g.numeroGrupo,
                    horarios: g.horarios,
                    color: colores[idx % colores.length],
                }));
            }
        }
        // Si no, usar grupos seleccionados manualmente
        else if (gruposSeleccionados && materias) {
            let colorIndex = 0;
            Object.entries(gruposSeleccionados).forEach(([codigoMateria, numeroGrupo]) => {
                if (numeroGrupo !== null) {
                    const materia = materias.find(m => m.codigo === codigoMateria);
                    if (materia) {
                        const grupo = materia.grupos.find(g => g.numero === numeroGrupo);
                        if (grupo) {
                            gruposParaProcesar.push({
                                nombreMateria: materia.nombre,
                                numeroGrupo: grupo.numero,
                                horarios: grupo.horarios,
                                color: colores[colorIndex % colores.length],
                            });
                            colorIndex++;
                        }
                    }
                }
            });
        }

        // Procesar cada grupo y sus horarios
        gruposParaProcesar.forEach(grupo => {
            grupo.horarios.forEach(horario => {
                horario.dias.forEach(dia => {
                    const diaIndex = dias.indexOf(dia);
                    if (diaIndex !== -1) {
                        clases.push({
                            materia: grupo.nombreMateria,
                            grupo: grupo.numeroGrupo,
                            aula: horario.aula,
                            color: grupo.color,
                            horaInicio: horario.horaInicio,
                            horaFin: horario.horaFin,
                            duracion: horario.horaFin - horario.horaInicio,
                            diaIndex: diaIndex, // 0-6
                            horaIndex: horas.indexOf(horario.horaInicio), // posición en el array de horas
                        });
                    }
                });
            });
        });

        return clases;
    }, [horariosGenerados, horarioActualIndex, gruposSeleccionados, materias]);

    // Crear un mapa de celdas ocupadas por clases
    const celdasOcupadas = useMemo(() => {
        const ocupadas = new Set();
        clasesParaRenderizar.forEach(clase => {
            // Marcar todas las celdas que ocupa esta clase
            for (let i = 0; i < clase.duracion; i++) {
                const key = `${clase.diaIndex}-${clase.horaIndex + i}`;
                ocupadas.add(key);
            }
        });
        return ocupadas;
    }, [clasesParaRenderizar]);

    const formatHora = (hora) => {
        const ampm = hora < 12 ? 'AM' : 'PM';
        const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
        return `${hora12}:00 ${ampm}`;
    };

    return (
        <div className="flex-1 h-full bg-white dark:bg-background-dark flex flex-col overflow-hidden">
            {/* Header con los días */}
            <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                {/* Celda vacía en la esquina */}
                <div className="border-r border-zinc-200 dark:border-zinc-800 py-4"></div>

                {/* Días de la semana */}
                {dias.map((dia) => (
                    <div
                        key={dia}
                        className="py-4 px-4 text-center font-bold text-sm text-zinc-700 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 select-none"
                    >
                        {dia}
                    </div>
                ))}
            </div>

            {/* Grid de horarios con posicionamiento explícito */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div 
                    className="grid h-full w-full"
                    style={{
                        gridTemplateColumns: '80px repeat(7, minmax(140px, 1fr))',
                        gridTemplateRows: `repeat(${horas.length}, 1fr)`,
                    }}
                >
                    {/* Generar todas las celdas del grid */}
                    {horas.map((hora, horaIdx) => (
                        <React.Fragment key={hora}>
                            {/* Columna de hora */}
                            <div 
                                className="px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border-r border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center select-none"
                                style={{
                                    gridColumn: 1,
                                    gridRow: horaIdx + 1,
                                }}
                            >
                                {formatHora(hora)}
                            </div>

                            {/* Celdas vacías para cada día */}
                            {dias.map((dia, diaIdx) => {
                                const celdaKey = `${diaIdx}-${horaIdx}`;
                                const tieneClase = celdasOcupadas.has(celdaKey);
                                
                                return (
                                    <div
                                        key={`${dia}-${hora}`}
                                        className={`bg-white dark:bg-background-dark ${
                                            tieneClase 
                                                ? '' 
                                                : 'border-r border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-100/5'
                                        }`}
                                        style={{
                                            gridColumn: diaIdx + 2,
                                            gridRow: horaIdx + 1,
                                        }}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Renderizar las clases sobre el grid */}
                    {clasesParaRenderizar.map((clase, idx) => (
                        <div
                            key={idx}
                            className="relative pointer-events-auto"
                            style={{
                                gridColumn: clase.diaIndex + 2, // +2 porque la primera columna es la de horas
                                gridRow: `${clase.horaIndex + 1} / span ${clase.duracion}`,
                                zIndex: 10,
                            }}
                        >
                            <ClassBlock 
                                clase={clase} 
                                onHover={handleClassHover}
                                onLeave={handleClassLeave}
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Tooltip global */}
            {tooltipData && (
                <ClassTooltip 
                    clase={tooltipData} 
                    color={tooltipData.color} 
                    position={tooltipPosition}
                />
            )}
        </div>
    );
}
