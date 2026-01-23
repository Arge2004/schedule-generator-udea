import React, { useMemo, useState, useEffect } from 'react';
import ClassBlock from './ClassBlock';
import ClassTooltip from './ClassTooltip';
import { useMateriasStore } from '../store/materiasStore';

export default function Schedule() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM a 10 PM (22:00)

    const { horariosGenerados, horarioActualIndex, gruposSeleccionados, materias } = useMateriasStore();
    const [darkTheme, setDarkTheme] = useState(() => {
        const saved = localStorage.getItem('darkTheme');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Aplicar/remover clase dark del documento
    useEffect(() => {
        if (darkTheme) {
            document.querySelector('html').classList.add('dark');
        } else {
            document.querySelector('html').classList.remove('dark');
        }
        localStorage.setItem('darkTheme', JSON.stringify(darkTheme));
    }, [darkTheme]);

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
                    profesor: g.profesor,
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
                                profesor: grupo.profesor,
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
                            profesor: grupo.profesor,
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
        <div className="flex-1 flex flex-col bg-white dark:bg-background-dark overflow-hidden">
            {/* Área del Schedule (ocupa el espacio disponible) */}
            <div className="flex-1 flex flex-col overflow-hidden">
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

            {/* Barra de herramientas inferior */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-sm px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-center">
                    <div className="flex justify-center gap-4">
                        {/* Navegación entre horarios */}
                        {horariosGenerados && horariosGenerados.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const newIndex = horarioActualIndex > 0 ? horarioActualIndex - 1 : horariosGenerados.length - 1;
                                        useMateriasStore.getState().setHorarioActualIndex(newIndex);
                                    }}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group"
                                    title="Horario anterior"
                                >
                                    <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <div className="px-3 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {horarioActualIndex + 1} / {horariosGenerados.length}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        const newIndex = horarioActualIndex < horariosGenerados.length - 1 ? horarioActualIndex + 1 : 0;
                                        useMateriasStore.getState().setHorarioActualIndex(newIndex);
                                    }}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group"
                                    title="Horario siguiente"
                                >
                                    <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Botón de tema oscuro */}
                        <button
                            onClick={() => setDarkTheme(!darkTheme)}
                            className="p-2 absolute top-4 right-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer group"
                            title={darkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        >
                            {darkTheme ? (
                                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-zinc-600 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
