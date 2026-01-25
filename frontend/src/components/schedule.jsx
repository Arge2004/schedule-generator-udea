import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ColorBlobs from './ColorBlobs.jsx';
import { ScheduleProvider } from './ScheduleContext';
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
        setNotifier,
    } = useMateriasStore();

    // Estado local para hover durante drag
    const [hoveredCell, setHoveredCell] = useState(null); // { diaIndex, horaIndex }
    const [hoveredValidKeys, setHoveredValidKeys] = useState(new Set());
    const [hoveredValidGroupNumbers, setHoveredValidGroupNumbers] = useState(new Set());
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
        setToastMessage(message);
        setShowToast(true);

        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    // Registrar el notifier en el store para que otros componentes (ej. Subject) puedan usarlo
    useEffect(() => {
        setNotifier && setNotifier(showToastMessage);
    }, [setNotifier]);

    // Ref para el nodo del schedule que vamos a exportar
    const scheduleRef = React.useRef(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Refs para el botón y el menú de export, para cerrar al click fuera
    const exportButtonRef = React.useRef(null);
    const exportMenuRef = React.useRef(null);
    const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });

    // Cerrar menú si se hace click fuera
    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDocClick = (e) => {
            if (exportButtonRef.current?.contains(e.target)) return;
            if (exportMenuRef.current?.contains(e.target)) return;
            setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [exportMenuOpen]);

    // Recalcular posición del menú para que aparezca cerca del botón (encima si cabe, si no abajo)
    useEffect(() => {
        if (!exportMenuOpen) return;
        const compute = () => {
            const btn = exportButtonRef.current;
            const menu = exportMenuRef.current;
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const menuWidth = menu ? menu.offsetWidth : 160; // fallback
            const menuHeight = menu ? menu.offsetHeight : 80;
            const spacing = 8;

            // Preferir mostrar arriba del botón si hay espacio
            let top = rect.top - menuHeight - spacing;
            let left = rect.left;

            // Si no cabe arriba, mostrar abajo
            if (top < 8) {
                top = rect.bottom + spacing;
            }

            // Asegurar que el menú no salga del viewport a la derecha
            const maxLeft = window.innerWidth - menuWidth - 8;
            if (left > maxLeft) left = maxLeft;
            if (left < 8) left = 8;

            setMenuPos({ left, top });
        };

        compute();
        window.addEventListener('resize', compute);
        window.addEventListener('scroll', compute, true);
        return () => {
            window.removeEventListener('resize', compute);
            window.removeEventListener('scroll', compute, true);
        };
    }, [exportMenuOpen]);

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
            // Buscar el código de materia correspondiente
            let codigoMateria = null;
            if (materias) {
                const materiaObj = materias.find(m => m.nombre === grupo.nombreMateria || m.codigo === grupo.codigoMateria);
                if (materiaObj) codigoMateria = materiaObj.codigo;
            }
            grupo.horarios.forEach(horario => {
                horario.dias.forEach(dia => {
                    const diaIndex = dias.indexOf(dia);
                    if (diaIndex !== -1) {
                        clases.push({
                            materia: grupo.nombreMateria,
                            codigoMateria: codigoMateria,
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

    // Mapa por código de materia (más fiable) y helper para obtener código desde un valor (código o nombre)
    const celdasMateria = useMemo(() => {
        const map = new Map();
        // Helper para normalizar nombres (quita mayúsculas y diacríticos básicos)
        const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
        clasesParaRenderizar.forEach(clase => {
            if (!clase.isPreview) {
                // Intentar usar el codigo si existe, si no buscar por nombre en materias
                let codigo = clase.codigoMateria;
                if (!codigo && materias && Array.isArray(materias)) {
                    const buscado = materias.find(m => normalize(m.nombre) === normalize(clase.materia) || m.codigo === clase.codigoMateria);
                    if (buscado) codigo = buscado.codigo;
                }
                if (codigo) {
                    for (let i = 0; i < clase.duracion; i++) {
                        const key = `${clase.diaIndex}-${clase.horaIndex + i}`;
                        map.set(key, codigo);
                    }
                } else {
                    // Si aún no tenemos codigo, marcar con el nombre para no perder información
                    for (let i = 0; i < clase.duracion; i++) {
                        const key = `${clase.diaIndex}-${clase.horaIndex + i}`;
                        map.set(key, clase.materia);
                    }
                }
            }
        });
        return map;
    }, [clasesParaRenderizar, materias]);

    const getCodigoFromValor = (valor) => {
        if (!valor) return undefined;
        // Si ya parece un código existente, devolverlo
        if (materias && materias.find(m => m.codigo === valor)) return valor;
        // Intentar normalizar y buscar por nombre
        const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
        const found = materias && materias.find(m => normalize(m.nombre) === normalize(String(valor)));
        return found ? found.codigo : undefined;
    };

    const formatHora = (hora) => {
        const ampm = hora < 12 ? 'AM' : 'PM';
        const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
        return `${hora12}:00 ${ampm}`;
    };

    // Handlers para drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!draggingMateria) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const leftDays = rect.left + 80; // primera columna fija 80px
        const widthDays = rect.width - 80;
        const cellWidth = widthDays / 7;
        const cellHeight = rect.height / horas.length;
        const x = e.clientX - leftDays;
        const y = e.clientY - rect.top;
        const diaIndex = Math.floor(x / cellWidth);
        const horaIndex = Math.floor(y / cellHeight);

        if (isNaN(diaIndex) || isNaN(horaIndex) || diaIndex < 0 || diaIndex > 6 || horaIndex < 0 || horaIndex >= horas.length) {
            // Fuera del área de días, no cambiar
            return;
        }

        // Guardar celda hover para que el overlay pueda marcar o ocultar bloques que no sean válidos en esta celda
        setHoveredCell({ diaIndex, horaIndex });

        // Calcular qué horarios (de los availableHorarios) serían válidos para esta celda sin modificar la lista global
        const validHorarios = [];
        draggingMateria.grupos.forEach(grupo => {
            grupo.horarios.forEach(horario => {
                // Comprobar solapamiento con la celda
                // Incluir si hay solapamiento interior (horario.horaInicio < cellEnd && horario.horaFin > cellStart)
                // Además *incluir* si el grupo empieza justo después de la celda (horario.horaInicio === cellEnd)
                // Pero *NO* incluir si el grupo termina justo antes de la celda (horario.horaFin === cellStart)
                const cellStart = horas[horaIndex];
                const cellEnd = cellStart + 1;
                const overlaps = horario.dias.includes(dias[diaIndex]) && (
                    (horario.horaInicio < cellEnd && horario.horaFin > cellStart) ||
                    horario.horaInicio === cellEnd
                );
                if (!overlaps) return;

                // Verificar conflicto en todas las celdas que ocupa el horario
                let tieneConflicto = false;
                horario.dias.forEach(diaHorario => {
                    const diaIdx = dias.indexOf(diaHorario);
                    if (diaIdx === -1) return;
                    const horaInicioIdx = horas.indexOf(horario.horaInicio);
                    const duracion = horario.horaFin - horario.horaInicio;
                    for (let i = 0; i < duracion; i++) {
                        const celdaKey = `${diaIdx}-${horaInicioIdx + i}`;
                        const materiaEnCeldaValor = celdasMateria.get(celdaKey);
                        const materiaEnCeldaCodigo = getCodigoFromValor(materiaEnCeldaValor);
                        if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== draggingMateria.codigo) {
                            tieneConflicto = true;
                            break;
                        }
                    }
                });

                if (!tieneConflicto) {
                    validHorarios.push({ ...horario, numeroGrupo: grupo.numero });
                }
            });
        });

        // Generar set de keys válidas para esta celda (para chequear bloques)
        const validKeys = new Set();
        const validGroupNums = new Set();
        validHorarios.forEach(h => {
            const horaInicioIdx = horas.indexOf(h.horaInicio);
            const duracion = h.horaFin - h.horaInicio;
            validGroupNums.add(h.numeroGrupo);
            h.dias.forEach(d => {
                const diaIdx = dias.indexOf(d);
                for (let i = 0; i < duracion; i++) {
                    validKeys.add(`${diaIdx}-${horaInicioIdx + i}`);
                }
            });
        });
        setHoveredValidKeys(validKeys);
        setHoveredValidGroupNumbers(validGroupNums);
    };

    // Helper: verifica si un grupo TIENE conflicto con el schedule actual (celdasMateria)
    const groupHasConflict = (grupo) => {
        for (const horario of grupo.horarios) {
            for (const dia of horario.dias) {
                const diaIndex = dias.indexOf(dia);
                if (diaIndex === -1) continue;
                const horaInicioIndex = horas.indexOf(horario.horaInicio);
                const duracion = horario.horaFin - horario.horaInicio;
                for (let i = 0; i < duracion; i++) {
                    const celdaKey = `${diaIndex}-${horaInicioIndex + i}`;
                    const materiaEnCeldaValor = celdasMateria.get(celdaKey);
                    const materiaEnCeldaCodigo = getCodigoFromValor(materiaEnCeldaValor);
                    if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== draggingMateria.codigo) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const handleDragEnter = (e) => {
        e.preventDefault();

        // Cuando se arrastra sobre el schedule, mostrar los horarios disponibles
        if (draggingMateria && availableHorarios.length === 0) {
            const todosLosHorarios = [];
            draggingMateria.grupos.forEach(grupo => {
                // Si el grupo tiene conflicto en alguna de sus clases, NO mostrar NINGUNA de sus clases
                if (groupHasConflict(grupo)) {
                    return;
                }
                // Agregar todos los horarios del grupo (porque el grupo es globalmente válido)
                grupo.horarios.forEach(horario => {
                    todosLosHorarios.push({
                        ...horario,
                        numeroGrupo: grupo.numero,
                    });
                });
            });
            setAvailableHorarios(todosLosHorarios);
        }
    };

    const handleDrop = (e, diaIndex, horaIndex) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggingMateria) {
            return;
        }

        const dia = dias[diaIndex];
        const hora = horas[horaIndex];

        // Buscar los grupos que tienen clases en esta celda específica Y que no causan conflictos
        const gruposEnEstaCelda = draggingMateria.grupos.filter(grupo => {
            // Excluir grupos que ya tienen conflicto global
            if (groupHasConflict(grupo)) return false;
            return grupo.horarios.some(horario => {
                // Comprobar solapamiento con la celda (incluir touch-after pero no touch-before)
                const cellStart = hora;
                const cellEnd = hora + 1;
                const overlaps = horario.dias.includes(dia) && (
                    (horario.horaInicio < cellEnd && horario.horaFin > cellStart) ||
                    horario.horaInicio === cellEnd
                );
                if (!overlaps) {
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
                            const materiaEnCeldaValor = celdasMateria.get(celdaKey);
                            const materiaEnCeldaCodigo = getCodigoFromValor(materiaEnCeldaValor);
                            // Solo es conflicto si hay otra materia diferente (por código)
                            if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== draggingMateria.codigo) {
                                tieneConflicto = true;
                                break;
                            }
                        }
                    }
                });

                return !tieneConflicto;
            });
        });

        if (gruposEnEstaCelda.length === 0) {
            // Verificar si es porque no hay horarios en esta celda o porque todos causan conflictos
            let algunGrupoTieneHorarioAqui = false;
            let hayConflictos = false;

            draggingMateria.grupos.forEach(grupo => {
                grupo.horarios.forEach(horario => {
                    // Verificar si este horario solapa (o toca después) la celda donde se soltó
                    const cellStart = hora;
                    const cellEnd = hora + 1;
                    const overlaps = horario.dias.includes(dia) && (
                        (horario.horaInicio < cellEnd && horario.horaFin > cellStart) ||
                        horario.horaInicio === cellEnd
                    );
                    if (overlaps) {
                        algunGrupoTieneHorarioAqui = true;

                        // Ahora verificar si tiene conflictos con otras materias
                        horario.dias.forEach(diaHorario => {
                            const diaIdx = dias.indexOf(diaHorario);
                            if (diaIdx !== -1) {
                                const horaInicioIdx = horas.indexOf(horario.horaInicio);
                                const duracion = horario.horaFin - horario.horaInicio;

                                for (let i = 0; i < duracion; i++) {
                                    const celdaKey = `${diaIdx}-${horaInicioIdx + i}`;
                                    const materiaEnCeldaValor = celdasMateria.get(celdaKey);
                                    const materiaEnCeldaCodigo = getCodigoFromValor(materiaEnCeldaValor);
                                    if (materiaEnCeldaCodigo && materiaEnCeldaCodigo !== draggingMateria.codigo) {
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
                showToastMessage('⚠️ No se puede colocar: hay un conflicto con otra materia');
            } else if (!algunGrupoTieneHorarioAqui) {
                showToastMessage('⚠️ Esta materia no tiene clases en este horario');
            } else {
                console.log('Estado inesperado:', { algunGrupoTieneHorarioAqui, hayConflictos });
            }

            clearDragState();
            setHoveredCell(null);
            setHoveredValidKeys(new Set());
            setHoveredValidGroupNumbers(new Set());
            return;
        }

        // Si hay múltiples grupos disponibles, siempre mostrar el selector (incluso si ya hay uno seleccionado)
        if (gruposEnEstaCelda.length > 1) {
            // Múltiples grupos con el mismo horario, mostrar selector para elegir o cambiar
            setShowGrupoSelector(true, gruposEnEstaCelda);
        } else if (gruposEnEstaCelda.length === 1) {
            // Solo hay un grupo, seleccionarlo directamente
            const grupo = gruposEnEstaCelda[0];

            selectGrupo(draggingMateria.codigo, grupo.numero);

            // Marcar la materia como seleccionada
            const isSelected = gruposSeleccionados[draggingMateria.codigo];
            if (!isSelected) {
                toggleMateriaSelected(draggingMateria.codigo);
            }

            clearDragState();
            setHoveredCell(null);
            setHoveredValidKeys(new Set());
        }
    };

    const handleDragLeave = (e) => {
        // Solo limpiar si realmente salimos del schedule (no solo entre celdas)
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        setAvailableHorarios([]);
        setHoveredCell(null);
        setHoveredValidKeys(new Set());
    };

    return (
        <ScheduleProvider celdasMateria={celdasMateria} showToastMessage={showToastMessage}>
            <div ref={scheduleRef} className="flex-1 flex flex-col bg-white dark:bg-background-dark relative" style={{ overflow: (draggingMateria || (availableHorarios && availableHorarios.length > 0)) ? 'visible' : 'hidden' }}>
                {/* Subtle color blobs for schedule background */}
                <ColorBlobs dark={darkTheme} className="z-10" />

                {/* Área del Schedule (ocupa el espacio disponible) */}
                <div className="flex-1 flex flex-col" style={{ overflow: (draggingMateria || (availableHorarios && availableHorarios.length > 0)) ? 'visible' : 'hidden' }}>
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
                                                className={`bg-white dark:bg-background-dark ${tieneClase
                                                    ? ''
                                                    : 'border-r border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-100/5'
                                                    }`}
                                                style={{
                                                    gridColumn: diaIdx + 2,
                                                    gridRow: horaIdx + 1,
                                                    zIndex: 1,
                                                }}
                                                onDrop={(e) => {
                                                    handleDrop(e, diaIdx, horaIdx);
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
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
                                    celdasMateria={celdasMateria}
                                    hoveredCell={hoveredCell}
                                    hoveredValidKeys={hoveredValidKeys}
                                    hoveredValidGroupNumbers={hoveredValidGroupNumbers}
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
                            {/* Export dropdown (PNG / PDF) */}
                            <div className="absolute left-2 bottom-2 z-[9999]">
                                <button
                                    ref={exportButtonRef}
                                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                                    className="p-2 bg-primary px-4 hover:bg-primary/90 rounded-lg transition-all cursor-pointer group flex items-center gap-2"
                                    title="Exportar horario"
                                >
                                    {exporting ? 'Exportando...' : 'Exportar'}
                                    <svg className={`w-4 h-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {exportMenuOpen && createPortal(
                                    <div ref={exportMenuRef} style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, zIndex: 10000 }} className="bg-white dark:bg-zinc-900 rounded-md shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                        <button className="w-full cursor-pointer text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3">
                                            <img src="/png.png" alt="PNG" className="w-4 h-4" />
                                            <span className='text-zinc-900 dark:text-white'>PNG</span>
                                        </button>
                                        <button className="w-full cursor-pointer text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3">
                                            <img src="/pdf.png" alt="PDF" className="w-4 h-4" />
                                            <span className='text-zinc-900 dark:text-white'>PDF</span>
                                        </button>
                                    </div>,
                                    document.body
                                )}
                            </div>

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

                            {/* Debug: toggle colored blobs visibility */}
                            <button
                                onClick={() => {
                                    try {
                                        const cur = localStorage.getItem('colorBlobsDebug') === 'true';
                                        localStorage.setItem('colorBlobsDebug', (!cur).toString());
                                        window.dispatchEvent(new Event('colorBlobs:update'));
                                    } catch (e) {
                                        console.error('Error toggling color blobs debug', e);
                                    }
                                }}
                                className="p-2 absolute top-4 right-12 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer group"
                                title="Mostrar bolitas en movimiento"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-zinc-300 group-hover:text-amber-500 dark:group-hover:text-violet-400 transition-colors">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                </svg>
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
        </ScheduleProvider>
    );
}
