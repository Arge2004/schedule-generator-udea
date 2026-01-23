import React, { useState, useRef, useEffect, useMemo } from 'react'
import Subject from './subject.jsx';
import { parseHTMLFile } from '../logic/parser.js';
import { generarHorariosAutomaticos } from '../logic/generator.js';
import { useMateriasStore } from '../store/materiasStore.js';

export default function Sidebar() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [generationMode, setGenerationMode] = useState('manual'); // 'manual' o 'automatico'
    const [horaMinima, setHoraMinima] = useState(6); // Hora mínima para las clases (6-22)
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
        setHorariosGenerados 
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
            alert('Por favor, selecciona un archivo HTML válido');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Parseando archivo:', file.name);
            const data = await parseHTMLFile(file);

            console.log('✅ Parseo exitoso!');
            console.log('Datos completos:', data);

            // Guardar en el store de Zustand
            setMateriasData(data);
        } catch (error) {
            console.error('❌ Error al parsear el archivo:', error);
            alert('Error al procesar el archivo. Verifica que sea un HTML válido.');
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

    return (
        <aside className="w-80 h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background-dark flex flex-col overflow-y-auto">
            {!materias || materias.length === 0 ?
                (
                    <div
                        onClick={handleUploadClick}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`group h-full relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 2px,
                                ${darkTheme ? 'rgba(4, 0, 255, 0.07)' : 'rgba(0, 132, 255, 0.07)'} 5px,
                                ${darkTheme ? 'rgba(4, 0, 255, 0.07)' : 'rgba(0, 132, 255, 0.07)'} 6px,
                                transparent 4px,
                                transparent 10px
                            )`
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".html"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <p className="text-xs font-medium text-center text-zinc-700 dark:text-zinc-300">Procesando archivo...</p>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary transition-colors text-xl mb-2">Subir Archivo</span>
                                <p className="text-sm font-medium text-center text-zinc-700 dark:text-zinc-300">Importar archivo HTML</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-1">Arrastrar el archivo o clickear para buscarlo</p>
                            </>
                        )}
                    </div>
                ) :
                (<>
                    <div className="p-4 space-y-6 flex flex-col flex-1 min-h-0">
                        {/* Mode Toggle */}
                        <div className="space-y-4">
                            <p className="text-xs text-start font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Modo de Generación</p>
                            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setGenerationMode('manual')}
                                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none ${generationMode === 'manual'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white'
                                        }`}
                                >
                                    Manual
                                </button>
                                <button
                                    onClick={() => setGenerationMode('automatico')}
                                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-semibold transition-all focus:outline-none ${generationMode === 'automatico'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-100/10 dark:hover:text-white'
                                        }`}
                                >
                                    Automático
                                </button>
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
                                        onClick={resetMateriasSeleccionadas}
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
                                {!materias || materias.length === 0 ? (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                                        No hay materias cargadas. Sube un archivo HTML.
                                    </p>
                                ) : materiasFiltradas.length === 0 ? (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                                        No se encontraron materias con "{debouncedSearchTerm}"
                                    </p>
                                ) : (
                                    materiasFiltradas.map(materia => (
                                        <Subject key={materia.codigo} materia={materia} generationMode={generationMode} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Botón Generar Horario - Solo en modo automático */}
                    {generationMode === 'automatico' && (
                        <div className="px-4 pb-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || Object.keys(materiasSeleccionadas).length === 0}
                                className={`w-full py-3 ${isGenerating ? 'bg-primary cursor-not-allowed' : 'cursor-pointer bg-primary hover:bg-primary/90 disabled:bg-zinc-100 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed'} text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none`}
                                style={(Object.keys(materiasSeleccionadas).length === 0) ? {
                                    backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 4px,
                                        ${darkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(25, 255, 0, 0.03)'} 5px,
                                        ${darkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(25, 255, 0, 0.03)'} 6px,
                                        transparent 4px,
                                        transparent 10px
                                    )`
                                } : {}}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span className='text-sm font-semibold'>Generando horario...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className='text-sm font-semibold'>Generar Horario</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Preferencias de Generación Automática */}
                    {generationMode === 'automatico' && (
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
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
                        </div>
                    )}
                </>)}
        </aside>
    )
}
