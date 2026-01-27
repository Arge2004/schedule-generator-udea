import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClassBlock from './ClassBlock';
import ClassTooltip from './ClassTooltip';
import { useMateriasStore } from '../store/materiasStore';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SHORT = ['L', 'M', 'Mi', 'J', 'V', 'S'];

export default function MobileScheduleModal({ isOpen, onClose }) {
    const [activeDay, setActiveDay] = useState(0);
    const [tooltipData, setTooltipData] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const hideTimeoutRef = React.useRef(null);
    
    // Usar el store directamente
    const { horariosGenerados, horarioActualIndex, setHorarioActualIndex, gruposSeleccionados, materias } = useMateriasStore();

    // Determinar si estamos en modo manual (gruposSeleccionados) o automático (horariosGenerados)
    const isManualMode = (!horariosGenerados || horariosGenerados.length === 0) && 
                         gruposSeleccionados && 
                         Object.keys(gruposSeleccionados).length > 0;
    
    const hasSchedule = (horariosGenerados && horariosGenerados.length > 0) || isManualMode;
    
    if (!hasSchedule) return null;

    let currentSchedule;
    
    if (isManualMode) {
        // Construir el horario desde gruposSeleccionados (modo manual)
        currentSchedule = { grupos: [] };
        let colorIndex = 0;
        Object.entries(gruposSeleccionados).forEach(([codigoMateria, numeroGrupo]) => {
            if (numeroGrupo !== null && numeroGrupo !== undefined) {
                const materia = materias.find(m => String(m.codigo) === String(codigoMateria));
                if (materia) {
                    const grupo = materia.grupos.find(g => g.numero === numeroGrupo);
                    if (grupo) {
                        currentSchedule.grupos.push({
                            nombreMateria: materia.nombre,
                            codigoMateria: materia.codigo,
                            profesor: grupo.profesor,
                            numeroGrupo: grupo.numero,
                            horarios: grupo.horarios,
                            color: materia.color
                        });
                        colorIndex++;
                    }
                }
            }
        });
    } else {
        // Usar el horario generado (modo automático)
        currentSchedule = horariosGenerados[horarioActualIndex] || horariosGenerados[0];
    }

    const handlePreviousSchedule = () => {
        const newIndex = horarioActualIndex > 0 
            ? horarioActualIndex - 1 
            : horariosGenerados.length - 1;
        setHorarioActualIndex(newIndex);
    };

    const handleNextSchedule = () => {
        const newIndex = horarioActualIndex < horariosGenerados.length - 1 
            ? horarioActualIndex + 1 
            : 0;
        setHorarioActualIndex(newIndex);
    };

    // Manejar swipe para cambiar de día
    const handleDragEnd = (event, info) => {
        const threshold = 50; // Mínimo desplazamiento para cambiar de día
        
        if (Math.abs(info.offset.x) > threshold) {
            if (info.offset.x > 0 && activeDay > 0) {
                // Swipe derecha - día anterior
                setActiveDay(activeDay - 1);
            } else if (info.offset.x < 0 && activeDay < DIAS.length - 1) {
                // Swipe izquierda - día siguiente
                setActiveDay(activeDay + 1);
            }
        }
    };

    const handleClassHover = (clase, position) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        
        // Calcular el mejor posicionamiento del tooltip
        const minSpaceAbove = window.innerHeight * 0.25;
        const spaceAbove = position.y;
        const spaceRight = window.innerWidth - (position.x + position.width);

        let finalPosition = { ...position };

        // Si no hay suficiente espacio arriba, intentar posicionar a la derecha
        if (spaceAbove < minSpaceAbove && spaceRight > 300) {
            finalPosition.placement = "right";
        } else {
            finalPosition.placement = "top";
        }

        setTooltipData(clase);
        setTooltipPosition(finalPosition);
    };

    const handleClassLeave = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setTooltipData(null);
        }, 100);
    };

    // Organizar clases por día
    const getClassesByDay = (dayIndex) => {
        const classes = [];
        
        if (currentSchedule && currentSchedule.grupos) {
            currentSchedule.grupos.forEach((grupo, idx) => {
                if (grupo.horarios) {
                    grupo.horarios.forEach(horario => {
                        // horario.dias es un array de strings como ["Lunes", "Miércoles"]
                        if (horario.dias && horario.dias.includes(DIAS[dayIndex])) {
                            classes.push({
                                horaInicio: horario.horaInicio,
                                horaFin: horario.horaFin,
                                duracion: horario.horaFin - horario.horaInicio,
                                aula: horario.aula,
                                materia: grupo.nombreMateria,
                                codigo: grupo.codigoMateria,
                                profesor: grupo.profesor,
                                grupo: grupo.numeroGrupo,
                                color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'][idx % 8]
                            });
                        }
                    });
                }
            });
        }

        // Ordenar por hora de inicio
        return classes.sort((a, b) => a.horaInicio - b.horaInicio);
    };

    const formatHora = (hora) => {
        const h = Math.floor(hora);
        const m = Math.round((hora - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[101] bg-white dark:bg-background-dark flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <div className="flex-1 text-center">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {isManualMode ? 'Horario Manual' : 'Horarios Generados'}
                                </h2>
                                {!isManualMode && horariosGenerados.length > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-2">
                                        <button
                                            onClick={handlePreviousSchedule}
                                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 min-w-[60px]">
                                            {horarioActualIndex + 1} de {horariosGenerados.length}
                                        </span>
                                        <button
                                            onClick={handleNextSchedule}
                                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-10"></div> {/* Spacer para centrar el título */}
                        </div>

                        {/* Tabs de días */}
                        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background-dark">
                            {DIAS.map((dia, index) => {
                                const classes = getClassesByDay(index);
                                const hasClasses = classes.length > 0;
                                
                                return (
                                    <button
                                        key={dia}
                                        onClick={() => setActiveDay(index)}
                                        className={`flex-1 min-w-[60px] py-3 px-2 text-sm font-medium transition-all relative
                                            ${activeDay === index 
                                                ? 'text-primary' 
                                                : hasClasses 
                                                    ? 'text-zinc-900 dark:text-zinc-300' 
                                                    : 'text-zinc-400 dark:text-zinc-600'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="hidden sm:inline">{dia}</span>
                                            <span className="sm:hidden">{DIAS_SHORT[index]}</span>
                                            {hasClasses && (
                                                <span className={`w-1.5 h-1.5 rounded-full ${activeDay === index ? 'bg-primary' : 'bg-zinc-400'}`} />
                                            )}
                                        </div>
                                        {activeDay === index && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Contenido del día activo */}
                        <motion.div 
                            className="flex-1 overflow-y-auto p-4"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeDay}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    {getClassesByDay(activeDay).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-600">
                                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="font-medium">Sin clases este día</p>
                                        </div>
                                    ) : (
                                        <div 
                                            className="relative"
                                            style={{
                                                display: 'grid',
                                                gridTemplateRows: `repeat(16, minmax(60px, 1fr))`,
                                                gridTemplateColumns: '64px 1fr',
                                            }}
                                        >
                                            {/* Grid de horas */}
                                            {Array.from({ length: 16 }, (_, i) => i + 6).map((hora, horaIdx) => (
                                                <React.Fragment key={hora}>
                                                    {/* Indicador de hora */}
                                                    <div 
                                                        className="flex items-start pt-1 pr-3 border-t border-zinc-200 dark:border-zinc-800"
                                                        style={{
                                                            gridColumn: 1,
                                                            gridRow: horaIdx + 1,
                                                        }}
                                                    >
                                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                                            {hora.toString().padStart(2, '0')}:00
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Celda vacía para el área de clases */}
                                                    <div 
                                                        className="border-t border-zinc-200 dark:border-zinc-800"
                                                        style={{
                                                            gridColumn: 2,
                                                            gridRow: horaIdx + 1,
                                                        }}
                                                    />
                                                </React.Fragment>
                                            ))}
                                            
                                            {/* Clases posicionadas sobre el grid */}
                                            {getClassesByDay(activeDay).map((clase, idx) => {
                                                const horaIndex = Math.floor(clase.horaInicio) - 6;
                                                
                                                return (
                                                    <div
                                                        key={`${clase.materia}-${clase.grupo}-${idx}`}
                                                        className="relative"
                                                        style={{
                                                            gridColumn: 2,
                                                            gridRow: `${horaIndex + 1} / span ${clase.duracion}`,
                                                            zIndex: 10,
                                                            padding: '4px',
                                                        }}
                                                    >
                                                        <ClassBlock
                                                            clase={{
                                                                ...clase,
                                                                horaIndex: horaIndex,
                                                                diaIndex: activeDay,
                                                            }}
                                                            onHover={handleClassHover}
                                                            onLeave={handleClassLeave}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    {/* Tooltip global */}
                    {tooltipData && (
                        <ClassTooltip
                            clase={tooltipData}
                            color={tooltipData.color}
                            position={tooltipPosition}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
