import React, { useState, useRef, useEffect, useMemo } from 'react'
import Subject from './subject.jsx';
import { parseHTMLFile } from '../logic/parser.js';
import { generarHorariosAutomaticos } from '../logic/generator.js';
import { useMateriasStore } from '../store/materiasStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import { getFacultades, getProgramas, scrapeHorarios } from '../services/api.js';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select';

export default function Sidebar() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [isLoadingFacultades, setIsLoadingFacultades] = useState(false);
    const [isLoadingProgramas, setIsLoadingProgramas] = useState(false);
    const [facultades, setFacultades] = useState([]);
    const [programas, setProgramas] = useState([]);
    const [selectedFacultad, setSelectedFacultad] = useState('');
    const [selectedPrograma, setSelectedPrograma] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [generationMode, setGenerationMode] = useState('manual'); // 'manual' o 'automatico'
    const [dragEnabled, setDragEnabled] = useState(false); // Habilitar/deshabilitar drag and drop
    const [horaMinima, setHoraMinima] = useState(6); // Hora mínima para las clases (6-22)
    // Modal para confirmar cambio de modo que puede borrar selecciones
    const [showConfirmModeModal, setShowConfirmModeModal] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);
    const [evitarHuecos, setEvitarHuecos] = useState(false);
    const [darkTheme, setDarkTheme] = useState(() => {
        // Inicializar desde localStorage o por defecto true
        const saved = localStorage.getItem('darkTheme');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const previousScrollPos = useRef(0);

    // Usar Zustand store
    const {
        materias,
        setMateriasData,
        materiasSeleccionadas,
        resetMateriasSeleccionadas,
        setHorariosGenerados,
        clearHorariosGenerados,
        horariosGenerados,
        clearMaterias,
        clearRemovedGroups
    } = useMateriasStore();

    // Aplicar/remover clase dark del documento
    useEffect(() => {
        if (darkTheme) {
            document.querySelector('html').classList.add('dark')
        } else {
            document.querySelector('html').classList.remove('dark')
        }
        localStorage.setItem('darkTheme', JSON.stringify(darkTheme));
    }, [darkTheme]);

    // Debounce del término de búsqueda (500ms de espera)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Guardar y restaurar la posición del scroll cuando cambian las materias seleccionadas
    useEffect(() => {
        if (scrollContainerRef.current && previousScrollPos.current > 0) {
            scrollContainerRef.current.scrollTop = previousScrollPos.current;
        }
    }, [materiasSeleccionadas]);

    // Filtrar y ordenar materias (seleccionadas primero solo en modo automático)
    const materiasFiltradas = useMemo(() => {
        if (!materias) {
            return [];
        }

        let resultado = materias;

        // Filtrar si hay término de búsqueda
        if (debouncedSearchTerm.trim()) {
            const termino = debouncedSearchTerm.toLowerCase();
            resultado = materias.filter(materia =>
                materia.nombre.toLowerCase().includes(termino) ||
                materia.codigo.toLowerCase().includes(termino)
            );
        }

        // Solo reordenar si NO está en modo manual
        if (generationMode !== 'manual') {
            // Separar en dos grupos manteniendo el orden original
            const seleccionadas = [];
            const noSeleccionadas = [];

            resultado.forEach(materia => {
                if (materiasSeleccionadas[materia.codigo]) {
                    seleccionadas.push(materia);
                } else {
                    noSeleccionadas.push(materia);
                }
            });

            // Concatenar: seleccionadas primero, luego no seleccionadas
            return [...seleccionadas, ...noSeleccionadas];
        }

        return resultado;
    }, [materias, debouncedSearchTerm, materiasSeleccionadas, generationMode]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];

        if (!file) {
            console.log('No se seleccionó ningún archivo');
            return;
        }

        if (!file.name.endsWith('.html')) {
            toast.error('Por favor, selecciona un archivo HTML válido', {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        try {
            setIsLoading(true);
            console.log('Parseando archivo:', file.name);
            const data = await parseHTMLFile(file);

            console.log('✅ Parseo exitoso!');
            console.log('Datos completos:', data);

            // Verificar si hay materias disponibles
            if (!data.materias || data.materias.length === 0) {
                toast('No hay horarios disponibles en este archivo', {
                    icon: 'ℹ️',
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        background: '#3b82f6',
                        color: '#fff',
                    },
                });
                return;
            }

            // Guardar en el store de Zustand
            setMateriasData(data);
            toast.success('¡Archivo procesado exitosamente!', {
                duration: 2000,
                position: 'top-center',
            });
        } catch (error) {
            console.error('❌ Error al parsear el archivo:', error);
            toast.error('Error al procesar el archivo. Verifica que sea un HTML válido.', {
                duration: 3000,
                position: 'top-center',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Simular el evento de cambio en el input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            fileInputRef.current.files = dataTransfer.files;
            handleFileUpload({ target: { files: dataTransfer.files } });
        }
    };

    // Cargar facultades al montar el componente
    useEffect(() => {
        const loadFacultades = async () => {
            try {
                setIsLoadingFacultades(true);
                const data = await getFacultades();
                setFacultades(data);
            } catch (error) {
                console.error('Error cargando facultades:', error);
            } finally {
                setIsLoadingFacultades(false);
            }
        };
        loadFacultades();
    }, []);

    // Cargar programas cuando cambia la facultad
    useEffect(() => {
        const loadProgramas = async () => {
            if (!selectedFacultad) {
                setProgramas([]);
                setSelectedPrograma('');
                return;
            }

            try {
                setIsLoadingProgramas(true);
                const data = await getProgramas(selectedFacultad);
                setProgramas(data);
                setSelectedPrograma(''); // Reset programa selection
            } catch (error) {
                console.error('Error cargando programas:', error);
                setProgramas([]);
            } finally {
                setIsLoadingProgramas(false);
            }
        };
        loadProgramas();
    }, [selectedFacultad]);

    const handleScrapeHorarios = async () => {
        // Prefer localStorage values to avoid async state race
        const facultadLS = localStorage.getItem('selectedFacultad');
        const programaLS = localStorage.getItem('selectedPrograma');
        const facultadToUse = facultadLS || selectedFacultad;
        const programaToUse = programaLS || selectedPrograma;

        if (!facultadToUse || !programaToUse) {
            toast.error('Por favor selecciona una facultad y un programa', {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        // Update UI state to reflect chosen values (doesn't affect the scraping inputs)
        setSelectedFacultad(facultadToUse);
        setSelectedPrograma(programaToUse);

        try {
            setIsScraping(true);
            console.log('🌐 Iniciando web scraping...');

            const html = await scrapeHorarios(facultadToUse, programaToUse);

            console.log('✅ HTML obtenido, parseando...');

            // Crear un File simulado a partir del HTML
            const blob = new Blob([html], { type: 'text/html' });
            const file = new File([blob], 'horarios.html', { type: 'text/html' });

            // Parsear el HTML usando la función existente
            const data = await parseHTMLFile(file);

            console.log('✅ Parseo exitoso!');
            console.log('Datos completos:', data);

            // Verificar si hay materias disponibles
            if (!data.materias || data.materias.length === 0) {
                toast('No hay horarios disponibles para la selección actual', {
                    icon: 'ℹ️',
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        background: '#3b82f6',
                        color: '#fff',
                    },
                });
                return;
            }

            // Guardar en el store de Zustand
            setMateriasData(data);
            // Asegurar limpieza y forzar re-evaluación visual
            resetMateriasSeleccionadas();
            clearHorariosGenerados();

            // Pequeño delay para permitir que Zustand actualice antes de revisar
            setTimeout(() => {
                const current = useMateriasStore.getState().materias;
                console.debug('[handleScrapeHorarios] store materias after set:', current ? current.length : 0);
            }, 20);

            toast.success(`Se actualizaron ${data.materias.length} materias — selecciones reseteadas`, {
                duration: 2500,
                position: 'top-center',
            });
        } catch (error) {
            console.error('❌ Error durante el scraping:', error);
            toast.error(`Error al obtener horarios: ${error.message}`, {
                duration: 4000,
                position: 'top-center',
            });
        } finally {
            setIsScraping(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            // Obtener códigos de materias seleccionadas
            const codigosSeleccionados = Object.keys(materiasSeleccionadas);

            console.log('🚀 Generando horarios automáticos...');
            console.log('📚 Materias seleccionadas:', codigosSeleccionados);
            console.log('⚙️ Opciones:', { horaMinima, evitarHuecos });

            // Generar horarios
            const horariosGenerados = generarHorariosAutomaticos(
                materias,
                codigosSeleccionados,
                {
                    horaMinima,
                    evitarHuecos
                }
            );

            console.log('\n✅ Horarios generados:', horariosGenerados.length);
            console.log('\n📊 MEJORES HORARIOS:\n');

            horariosGenerados.forEach((horario, index) => {
                console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`🏆 HORARIO #${index + 1} - Puntuación: ${horario.puntuacion} pts`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

                console.log('\n📝 Grupos seleccionados:');
                horario.grupos.forEach(grupo => {
                    console.log(`  • ${grupo.nombreMateria} (${grupo.codigoMateria}) - Grupo ${grupo.numeroGrupo}`);
                    grupo.horarios.forEach(h => {
                        console.log(`    ${h.dias.join(', ')}: ${h.horaInicio}:00 - ${h.horaFin}:00 ${h.aula ? `[${h.aula}]` : ''}`);
                    });
                });

                console.log('\n📈 Estadísticas:');
                console.log(`  • Días con clases: ${horario.detalles.diasConClases}`);
                console.log(`  • Total horas/semana: ${horario.detalles.totalHorasClase}h`);
                console.log(`  • Clase más temprana: ${horario.detalles.horaMasTempranaGlobal}:00`);
                console.log(`  • Clase más tarde: ${horario.detalles.horaMasTardeGlobal}:00`);

                console.log('\n📅 Horario por día:');
                Object.entries(horario.detalles.horariosPorDia).forEach(([dia, clases]) => {
                    if (clases.length > 0) {
                        console.log(`  ${dia}:`);
                        clases.forEach(clase => {
                            console.log(`    ${clase.horaInicio}:00-${clase.horaFin}:00 → ${clase.materia} (Grupo ${clase.grupo})`);
                        });
                    }
                });
            });

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            if (horariosGenerados.length === 0) {
                console.warn('⚠️ No se pudieron generar horarios válidos. Verifica que las materias seleccionadas tengan grupos compatibles.');
            } else {
                // Guardar los horarios generados en el store
                setHorariosGenerados(horariosGenerados);
                console.log('✨ Horarios guardados en el store. Mostrando el mejor horario en el grid.');
            }

        } catch (error) {
            console.error('❌ Error al generar horarios:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Solicita el cambio de modo; si hay un horario generado y se va de 'automático' a 'manual', pedir confirmación
    const requestModeChange = (targetMode) => {
        if (targetMode === generationMode) return;
        // Comprobar si hay horarios ya generados (solo importa al cambiar de 'automatico' a 'manual')
        const scheduleCount = horariosGenerados ? horariosGenerados.length : 0;
        if (generationMode === 'automatico' && targetMode === 'manual' && scheduleCount > 0) {
            setPendingMode(targetMode);
            setShowConfirmModeModal(true);
            return;
        }

        const seleccionCount = materiasSeleccionadas ? Object.keys(materiasSeleccionadas).length : 0;

        if (generationMode === 'manual' && targetMode === 'automatico' && seleccionCount >= 1) {
            setPendingMode(targetMode);
            setShowConfirmModeModal(true);
            return;
        }

        // Aplicar cambio y limpiar después de una pequeña espera para que la animación del toggle se complete
        setGenerationMode(targetMode);
        setTimeout(() => {
            resetMateriasSeleccionadas();
            clearHorariosGenerados();
        }, 220);
    }; 

    const handleConfirmModeChange = () => {
        if (!pendingMode) return;
        setGenerationMode(pendingMode);
        // Close modal immediately so user sees change, but delay heavy cleanup to let animation run
        setShowConfirmModeModal(false);
        setTimeout(() => {
            resetMateriasSeleccionadas();
            clearHorariosGenerados();
        }, 220);
        setPendingMode(null);
    };

    const handleCancelModeChange = () => {
        setPendingMode(null);
        setShowConfirmModeModal(false);
    };

    return (
        <>
            <Toaster />
            <motion.aside
                className="w-80 h-full select-none border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background-dark flex flex-col overflow-y-auto relative"
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            >
                {/* Botón: Volver al menú principal (limpia materias y estados) — sólo mostrar cuando hay materias cargadas */}
                {materias && materias.length > 0 && (
                    <div className="absolute top-3 right-3 z-50">
                        <button
                            onClick={() => {
                                try {
                                    resetMateriasSeleccionadas();
                                    clearHorariosGenerados();
                                    clearRemovedGroups && clearRemovedGroups();
                                    clearMaterias();
                                    setSelectedFacultad('');
                                    setSelectedPrograma('');
                                } catch (err) {
                                    console.error('Error al volver al menú:', err);
                                    toast.error('No se pudo volver al menú: ' + (err?.message || ''));
                                }
                            }}
                            className={`px-3 py-1 cursor-pointer rounded-md text-sm font-medium dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800 bg-white/80 text-zinc-900 border-zinc-200 hover:bg-zinc-100`}
                            title="Volver al menú principal"
                        >
                            Menú
                        </button>
                    </div>
                )}
                {!materias || materias.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-6">
                            {/* Web Scraping Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-center">
                                    Obtener Horarios UdeA
                                </h3>

                                {/* Facultad Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        Facultad
                                    </label>
                                    <Select
                                        options={facultades}
                                        value={facultades.find(f => f.value === selectedFacultad) || null}
                                        onChange={(option) => {
                                            const value = option ? option.value : '';
                                            setSelectedFacultad(value);
                                            localStorage.setItem('selectedFacultad', value);
                                        }}
                                        isDisabled={isScraping || isLoadingFacultades}
                                        placeholder={isLoadingFacultades ? 'Cargando facultades...' : 'Selecciona una facultad...'}
                                        className="w-full text-start text-sm border-1 border-zinc-300 rounded-lg"
                                        classNamePrefix="rs"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '40px',
                                                borderRadius: '0.5rem',
                                                background: 'transparent',
                                                borderColor: 'transparent',
                                                boxShadow: 'none'
                                            }),
                                            placeholder: (base) => ({ ...base, color: '#6b7280' }),
                                            option: (base) => ({ ...base, color: '#111827' }),
                                        }}
                                        theme={(t) => ({ ...t, colors: { ...t.colors, primary25: 'rgba(19,146,236,0.06)', primary: '#1392ec' } })}
                                    />
                                </div>

                                {/* Programa Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        Programa
                                    </label>
                                    <Select
                                        options={programas}
                                        value={programas.find(p => p.value === selectedPrograma) || null}
                                        onChange={(option) => {
                                            const value = option ? option.value : '';
                                            setSelectedPrograma(value);
                                            localStorage.setItem('selectedPrograma', value);
                                        }}
                                        isDisabled={!selectedFacultad || isScraping || isLoadingProgramas}
                                        placeholder={!selectedFacultad ? 'Primero selecciona una facultad...' : isLoadingProgramas ? 'Cargando programas...' : 'Selecciona un programa...'}
                                        className="w-full text-start text-sm border-1 border-zinc-300 rounded-lg" 
                                        classNamePrefix="rs"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '40px',
                                                borderRadius: '0.5rem',
                                                background: 'transparent',
                                                borderColor: 'transparent',
                                                boxShadow: 'none'
                                            }),
                                            placeholder: (base) => ({ ...base, color: '#6b7280' }),
                                            option: (base) => ({ ...base, color: '#111827' }),
                                        }}
                                        theme={(t) => ({ ...t, colors: { ...t.colors, primary25: 'rgba(19,146,236,0.06)', primary: '#1392ec' } })}
                                    />
                                </div>

                                {/* Scrape Button */}
                                <button
                                    onClick={handleScrapeHorarios}
                                    disabled={!selectedFacultad || !selectedPrograma || isScraping}
                                    className="w-full px-4 text-sm py-3 mt-10 bg-primary cursor-pointer hover:bg-primary/90 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isScraping ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Obteniendo horarios...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Obtener Horarios</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 space-y-6 flex flex-col flex-1 min-h-0">
                            {/* Mode Toggle */}
                            <div className="space-y-4">
                                <p className="text-xs text-start font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Modo de Generación</p>
                                <div className="relative flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 gap-1 overflow-hidden">
                                    {/* Fondo animado */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            x: generationMode === 'manual' ? 0 : '100%',
                                        }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                                        className="absolute top-0 left-0 w-1/2 h-full rounded-md bg-primary z-0 shadow-md"
                                        style={{
                                            // El fondo cubre el botón activo
                                            width: '50%',
                                        }}
                                    />
                                    <motion.button
                                        onClick={() => requestModeChange('manual')}
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.04 }}
                                        className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none relative z-10 ${generationMode === 'manual'
                                            ? 'text-white'
                                            : 'text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white'
                                            }`}
                                        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                                    >
                                        Manual
                                    </motion.button>
                                    <motion.button
                                        onClick={() => requestModeChange('automatico')}
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.04 }}
                                        className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none relative z-10 ${generationMode === 'automatico'
                                            ? 'text-white'
                                            : 'text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white'
                                            }`}
                                        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                                    >
                                        Automático
                                    </motion.button>
                                </div>
                            </div>
                            {/* Subject Search */}
                            <div className="space-y-4 flex flex-col flex-1 min-h-0">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Materias</p>
                                        <div className="flex items-center gap-1.5">
                                            {materiasSeleccionadas && Object.keys(materiasSeleccionadas).length > 0 && (
                                                <>
                                                    <span className="text-[12px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                                                        {Object.keys(materiasSeleccionadas).length}
                                                    </span>
                                                    <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-bold">/</span>
                                                </>
                                            )}
                                            <span className="text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                {materiasFiltradas.length}
                                            </span>

                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                className="w-full pl-4 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-500 dark:placeholder:text-zinc-500"
                                                placeholder="Buscar materias..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                resetMateriasSeleccionadas();
                                                clearHorariosGenerados();
                                            }}
                                            className="px-3 py-2 cursor-pointer bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 rounded-lg text-primary text-xs font-bold focus:outline-none"
                                            title="Deseleccionar todas"
                                        >
                                            RESET
                                        </button>
                                    </div>
                                </div>
                                <div
                                    ref={scrollContainerRef}
                                    onScroll={(e) => {
                                        previousScrollPos.current = e.target.scrollTop;
                                    }}
                                    className="space-y-1 flex-1 min-h-0 overflow-y-auto scrollbar-custom"
                                >
                                    <AnimatePresence>
                                        {!materias || materias.length === 0 ? (
                                            <motion.p
                                                className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                No hay materias cargadas. Sube un archivo HTML.
                                            </motion.p>
                                        ) : materiasFiltradas.length === 0 ? (
                                            <motion.p
                                                className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                No se encontraron materias con "{debouncedSearchTerm}"
                                            </motion.p>
                                        ) : (
                                            materiasFiltradas.map(materia => (
                                                <motion.div
                                                    key={materia.codigo}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.25 }}
                                                >
                                                    <Subject materia={materia} generationMode={generationMode} dragEnabled={dragEnabled} />
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={handleScrapeHorarios}
                                    disabled={isScraping}
                                    className="w-full px-4 py-2 text-sm text-primary border-primary border-1 cursor-pointer hover:bg-primary/10 disabled:bg-primary/20 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center gap-2"
                                    title="Actualizar horarios desde la UdeA"
                                >
                                    {isScraping ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            <span>Actualizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Actualizar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {/* Botón Generar Horario - Solo en modo automático */}
                        {generationMode === 'automatico' && (
                            <div className="px-4 pb-4">
                                <motion.button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || Object.keys(materiasSeleccionadas).length === 0}
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ scale: 1.03 }}
                                    className={`w-full py-3 ${isGenerating ? 'bg-[#1392ec] cursor-not-allowed' : 'cursor-pointer bg-[#1392ec] hover:bg-[#1392ec]/90 disabled:bg-zinc-100 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed'} text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none`}
                                    style={(Object.keys(materiasSeleccionadas).length === 0) ? {
                                        backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 4px,
                                        ${darkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 146, 236, 0.03)'} 5px,
                                        ${darkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 146, 236, 0.03)'} 6px,
                                        transparent 4px,
                                        transparent 10px
                                    )`
                                    } : {}}
                                    transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                                >
                                    {isGenerating ? (
                                        <motion.div
                                            className="rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                            style={{ display: 'inline-block' }}
                                        />
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className='text-sm font-semibold'>Generar Horario</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                        {/* Preferencias de Generación Automática */}
                        <AnimatePresence>
                            {generationMode === 'automatico' && (
                                <motion.div
                                    className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferencias</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Hora mínima de clases</span>
                                                <span className="text-xs font-bold text-primary">{horaMinima}:00</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={horaMinima}
                                                    onChange={(e) => setHoraMinima(Number(e.target.value))}
                                                    className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                                >
                                                    <option value={6}>6:00 AM</option>
                                                    <option value={7}>7:00 AM</option>
                                                    <option value={8}>8:00 AM</option>
                                                    <option value={9}>9:00 AM</option>
                                                    <option value={10}>10:00 AM</option>
                                                    <option value={11}>11:00 AM</option>
                                                    <option value={12}>12:00 PM</option>
                                                    <option value={13}>1:00 PM</option>
                                                    <option value={14}>2:00 PM</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Evitar horarios con huecos extensos</span>
                                            <button
                                                onClick={() => setEvitarHuecos(!evitarHuecos)}
                                                className={`w-8 h-4 outline-none rounded-full relative cursor-pointer transition-colors ${evitarHuecos ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                            >
                                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${evitarHuecos ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {generationMode === 'manual' && (
                                <motion.div
                                    className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferencias</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Permitir arrastrar materias al horario</span>
                                            <button
                                                onClick={() => {
                                                    setDragEnabled(!dragEnabled)
                                                }}
                                                className={`w-8 h-4 outline-none rounded-full relative cursor-pointer transition-colors ${dragEnabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                            >
                                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${dragEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                <AnimatePresence>
                    {showConfirmModeModal && (
                        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="absolute inset-0 bg-black/40" onClick={handleCancelModeChange} />
                            <motion.div className="bg-white dark:bg-zinc-900 rounded-lg p-6 z-10 w-full max-w-md" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
                                <h3 className="text-lg mb-2 text-primary">Cambiar modo de generación</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    <span className='block'>¿Estás seguro? Esto puede borrar tu horario actual.</span>
                                    <span className='block mt-1 text-white dark:text-zinc-900' >.</span>
                                    {horariosGenerados && horariosGenerados.length > 0 ? (
                                        <span><span className='text-red-600'>{horariosGenerados.length} horarios </span>generados serán eliminados al cambiar a <span className='font-bold text-primary/80'>{pendingMode === 'manual' ? 'Manual' : 'Automático'}</span>.</span>
                                    ) : (
                                        <span><span className='text-red-600'>{Object.keys(materiasSeleccionadas || {}).length} materias </span> seleccionadas serán eliminadas al cambiar a <span className='font-bold text-primary/80'>{pendingMode === 'manual' ? 'Manual' : 'Automático'}</span>.</span>
                                    )}
                                </p>
                                <div className="flex justify-center gap-2">
                                    <button onClick={handleCancelModeChange} className="px-4 py-2 w-[125px] rounded-md bg-zinc-300 text-zinc-900 hover:bg-zinc-300/80 cursor-pointer dark:text-white dark:bg-zinc-800 dark:hover:bg-zinc-700">Cancelar</button>
                                    <button onClick={handleConfirmModeChange} className="px-4 py-2 w-[125px] rounded-md bg-primary hover:bg-primary/80 cursor-pointer text-white">Sí, cambiar</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.aside>
        </>
    )
}
