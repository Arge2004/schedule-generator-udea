import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ClassBlock from './ClassBlock';
import ClassTooltip from './ClassTooltip';
import ScheduleDropOverlay from './ScheduleDropOverlay';
import GrupoSelectorModal from './GrupoSelectorModal';
import { useMateriasStore } from '../store/materiasStore';

export default function Schedule() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM a 10 PM (22:00)

    const { 
        horariosGenerados, 
        horarioActualIndex, 
        gruposSeleccionados, 
        materias,
        draggingMateria,
        availableHorarios,
        previewGrupo,
        setAvailableHorarios,
        selectGrupo,
        toggleMateriaSelected,
        setShowGrupoSelector,
        clearDragState,
    } = useMateriasStore();
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
    
    // Estado para el toast
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const toastTimeoutRef = React.useRef(null);
    
    const showToastMessage = (message) => {
        console.log('📢 showToastMessage llamado con:', message);
        setToastMessage(message);
        setShowToast(true);
        console.log('Toast state actualizado a true');
        
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        
        toastTimeoutRef.current = setTimeout(() => {
            console.log('Toast timeout - ocultando');
            setShowToast(false);
        }, 3000);
    };

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

        // Agregar preview si existe y no está ya seleccionado
        if (previewGrupo && !gruposSeleccionados[previewGrupo.codigo]) {
            gruposParaProcesar.push({
                nombreMateria: previewGrupo.nombre,
                numeroGrupo: previewGrupo.numeroGrupo,
                horarios: previewGrupo.horarios,
                profesor: previewGrupo.profesor,
                color: previewGrupo.color.bg.includes('blue') ? '#3b82f6' :
                       previewGrupo.color.bg.includes('emerald') ? '#10b981' :
                       previewGrupo.color.bg.includes('violet') ? '#8b5cf6' :
                       previewGrupo.color.bg.includes('amber') ? '#f59e0b' :
                       previewGrupo.color.bg.includes('pink') ? '#ec4899' :
                       previewGrupo.color.bg.includes('cyan') ? '#06b6d4' :
                       previewGrupo.color.bg.includes('red') ? '#ef4444' : '#f97316',
                isPreview: true, // Marcar como preview para estilo diferente
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
                            isPreview: grupo.isPreview || false,
                        });
                    }
                });
            });
        });

        return clases;
    }, [horariosGenerados, horarioActualIndex, gruposSeleccionados, materias, previewGrupo]);

    // Crear un mapa de celdas ocupadas por clases (con información de qué materia las ocupa)
    const celdasOcupadas = useMemo(() => {
        const ocupadas = new Map(); // key -> nombre de materia
        clasesParaRenderizar.forEach(clase => {
            // No incluir previews en el mapa de ocupadas
            if (!clase.isPreview) {
                // Marcar todas las celdas que ocupa esta clase
                for (let i = 0; i < clase.duracion; i++) {
                    const key = `${clase.diaIndex}-${clase.horaIndex + i}`;
                    ocupadas.set(key, clase.materia);
                }
            }
        });
        return ocupadas;
    }, [clasesParaRenderizar]);

    const formatHora = (hora) => {
        const ampm = hora < 12 ? 'AM' : 'PM';
        const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
        return `${hora12}:00 ${ampm}`;
    };

    // Handlers para drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        
        console.log('Drag enter schedule', { draggingMateria, availableHorarios: availableHorarios.length });
        
        // Cuando se arrastra sobre el schedule, mostrar los horarios disponibles
        if (draggingMateria && availableHorarios.length === 0) {
            const todosLosHorarios = [];
            draggingMateria.grupos.forEach(grupo => {
                grupo.horarios.forEach(horario => {
                    // Verificar si este horario se sobrepone con alguna celda ocupada
                    let tieneConflicto = false;
                    
                    horario.dias.forEach(dia => {
                        const diaIndex = dias.indexOf(dia);
                        if (diaIndex !== -1) {
                            const horaInicioIndex = horas.indexOf(horario.horaInicio);
                            const duracion = horario.horaFin - horario.horaInicio;
                            
                            // Verificar cada celda que ocuparía este horario
                            for (let i = 0; i < duracion; i++) {
                                const celdaKey = `${diaIndex}-${horaInicioIndex + i}`;
                                const materiaEnCelda = celdasOcupadas.get(celdaKey);
                                // Solo es conflicto si hay otra materia diferente
                                if (materiaEnCelda && materiaEnCelda !== draggingMateria.nombre) {
                                    tieneConflicto = true;
                                    break;
                                }
                            }
                        }
                    });
                    
                    // Solo agregar horarios sin conflictos
                    if (!tieneConflicto) {
                        todosLosHorarios.push({
                            ...horario,
                            numeroGrupo: grupo.numero,
                        });
                    }
                });
            });
            console.log('Estableciendo horarios disponibles (sin conflictos):', todosLosHorarios);
            setAvailableHorarios(todosLosHorarios);
        }
    };

    const handleDrop = (e, diaIndex, horaIndex) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Drop detectado!', { diaIndex, horaIndex, draggingMateria });

        if (!draggingMateria) {
            console.log('No hay materia arrastrando');
            return;
        }

        const dia = dias[diaIndex];
        const hora = horas[horaIndex];

        console.log('Buscando grupos para:', { dia, hora });

        // Buscar los grupos que tienen clases en esta celda específica Y que no causan conflictos
        const gruposEnEstaCelda = draggingMateria.grupos.filter(grupo => {
            return grupo.horarios.some(horario => {
                // Verificar que el horario aplica a esta celda
                if (!horario.dias.includes(dia) || horario.horaInicio > hora || horario.horaFin <= hora) {
                    return false;
                }
                
                // Verificar que no haya conflictos con celdas ocupadas
                let tieneConflicto = false;
                horario.dias.forEach(diaHorario => {
                    const diaIdx = dias.indexOf(diaHorario);
                    if (diaIdx !== -1) {
                        const horaInicioIdx = horas.indexOf(horario.horaInicio);
                        const duracion = horario.horaFin - horario.horaInicio;
                        
                        for (let i = 0; i < duracion; i++) {
                            const celdaKey = `${diaIdx}-${horaInicioIdx + i}`;
                            const materiaEnCelda = celdasOcupadas.get(celdaKey);
                            // Solo es conflicto si hay otra materia diferente
                            if (materiaEnCelda && materiaEnCelda !== draggingMateria.nombre) {
                                tieneConflicto = true;
                                break;
                            }
                        }
                    }
                });
                
                return !tieneConflicto;
            });
        });

        console.log('Grupos encontrados (sin conflictos):', gruposEnEstaCelda);

        if (gruposEnEstaCelda.length === 0) {
            // Verificar si es porque no hay horarios en esta celda o porque todos causan conflictos
            let algunGrupoTieneHorarioAqui = false;
            let hayConflictos = false;
            
            draggingMateria.grupos.forEach(grupo => {
                grupo.horarios.forEach(horario => {
                    // Verificar si este horario aplica a la celda donde se soltó
                    if (horario.dias.includes(dia) && horario.horaInicio <= hora && horario.horaFin > hora) {
                        algunGrupoTieneHorarioAqui = true;
                        
                        // Ahora verificar si tiene conflictos con otras materias
                        horario.dias.forEach(diaHorario => {
                            const diaIdx = dias.indexOf(diaHorario);
                            if (diaIdx !== -1) {
                                const horaInicioIdx = horas.indexOf(horario.horaInicio);
                                const duracion = horario.horaFin - horario.horaInicio;
                                
                                for (let i = 0; i < duracion; i++) {
                                    const celdaKey = `${diaIdx}-${horaInicioIdx + i}`;
                                    const materiaEnCelda = celdasOcupadas.get(celdaKey);
                                    if (materiaEnCelda && materiaEnCelda !== draggingMateria.nombre) {
                                        hayConflictos = true;
                                        break;
                                    }
                                }
                            }
                        });
                    }
                });
            });
            
            if (algunGrupoTieneHorarioAqui && hayConflictos) {
                console.log('🔴 CONFLICTO: La celda está ocupada por otra materia');
                console.log('Llamando showToastMessage con mensaje de conflicto');
                showToastMessage('⚠️ No se puede colocar: hay un conflicto con otra materia');
            } else if (!algunGrupoTieneHorarioAqui) {
                console.log('⚠️ No hay horarios válidos en esta celda');
                console.log('Llamando showToastMessage con mensaje de horario no válido');
                showToastMessage('⚠️ Esta materia no tiene clases en este horario');
            } else {
                console.log('Estado inesperado:', { algunGrupoTieneHorarioAqui, hayConflictos });
            }
            
            console.log('Estado del toast:', { showToast, toastMessage });
            
            clearDragState();
            return;
        }
        console.log('Procesando selección de grupo...', { gruposEnEstaCelda });
        
        // Si hay múltiples grupos disponibles, siempre mostrar el selector (incluso si ya hay uno seleccionado)
        if (gruposEnEstaCelda.length > 1) {
            // Múltiples grupos con el mismo horario, mostrar selector para elegir o cambiar
            console.log('Múltiples grupos, mostrando modal:', gruposEnEstaCelda);
            console.log('Llamando setShowGrupoSelector...');
            setShowGrupoSelector(true, gruposEnEstaCelda);
            console.log('setShowGrupoSelector llamado - verificando estado...');
            
            // Verificar que el estado se estableció
            setTimeout(() => {
              const state = useMateriasStore.getState();
              console.log('Estado después de setShowGrupoSelector:', {
                showGrupoSelector: state.showGrupoSelector,
                gruposConflicto: state.gruposConflicto,
                pendingModal: state.pendingModal,
                draggingMateria: state.draggingMateria
              });
            }, 0);
        } else if (gruposEnEstaCelda.length === 1) {
            // Solo hay un grupo, seleccionarlo directamente
            const grupo = gruposEnEstaCelda[0];
            console.log('Un solo grupo, seleccionando:', grupo);
            
            selectGrupo(draggingMateria.codigo, grupo.numero);
            
            // Marcar la materia como seleccionada
            const isSelected = gruposSeleccionados[draggingMateria.codigo];
            if (!isSelected) {
                toggleMateriaSelected(draggingMateria.codigo);
            }
            
            clearDragState();
        }
    };

    const handleDragLeave = (e) => {
        // Solo limpiar si realmente salimos del schedule (no solo entre celdas)
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        setAvailableHorarios([]);
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
                    className="grid h-full w-full relative"
                    style={{
                        gridTemplateColumns: '80px repeat(7, minmax(140px, 1fr))',
                        gridTemplateRows: `repeat(${horas.length}, 1fr)`,
                    }}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
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
                                            zIndex: 1,
                                        }}
                                        onDrop={(e) => {
                                            console.log('🎯 DROP EN CELDA:', { dia, hora, diaIdx, horaIdx });
                                            handleDrop(e, diaIdx, horaIdx);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            console.log('Drag over celda:', dia, hora);
                                        }}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Renderizar las clases sobre el grid */}
                    <AnimatePresence mode="popLayout">
                        {clasesParaRenderizar.map((clase, idx) => (
                            <div
                                key={`${clase.materia}-${clase.grupo}-${clase.diaIndex}-${clase.horaIndex}-${clase.isPreview ? 'preview' : 'permanent'}`}
                                className="relative"
                                style={{
                                    gridColumn: clase.diaIndex + 2, // +2 porque la primera columna es la de horas
                                    gridRow: `${clase.horaIndex + 1} / span ${clase.duracion}`,
                                    zIndex: clase.isPreview ? 6 : 10,
                                    pointerEvents: draggingMateria ? 'none' : 'auto', // Permitir drops cuando se arrastra
                                }}
                            >
                                <ClassBlock 
                                    clase={clase} 
                                    onHover={handleClassHover}
                                    onLeave={handleClassLeave}
                                />
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* Overlay de horarios disponibles durante drag */}
                    {draggingMateria && (
                        <ScheduleDropOverlay 
                            availableHorarios={availableHorarios}
                            dias={dias}
                            horas={horas}
                            onBlockDrop={handleDrop}
                            showToastMessage={showToastMessage}
                            celdasOcupadas={celdasOcupadas}
                        />
                    )}
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
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-sm px-6 py-3 flex-shrink-0 min-h-[60px]">
                <div className="flex items-center justify-center h-full">
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

            {/* Modal de selección de grupos - fuera del contenedor principal */}
            <GrupoSelectorModal />
            
            {/* Toast para mensajes de error */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-zinc-900 dark:bg-zinc-800 text-white px-6 py-3 rounded-lg shadow-lg border border-zinc-700 flex items-center gap-3 max-w-md">
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
