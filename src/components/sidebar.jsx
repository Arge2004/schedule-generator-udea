import React, {useState, useRef, useEffect, useMemo} from 'react'
import Subject from './subject.jsx';
import { parseHTMLFile } from '../logic/parser.js';
import { useMateriasStore } from '../store/materiasStore.js';

export default function Sidebar() {
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [darkTheme, setDarkTheme] = useState(() => {
        // Inicializar desde localStorage o por defecto true
        const saved = localStorage.getItem('darkTheme');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const fileInputRef = useRef(null);
    
    // Usar Zustand store
    const { materias, setMateriasData, materiasSeleccionadas } = useMateriasStore();

    // Aplicar/remover clase dark del documento
    useEffect(() => {
        if (darkTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
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

    // Filtrar y ordenar materias (seleccionadas primero)
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
    }, [materias, debouncedSearchTerm, materiasSeleccionadas]);

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

    return (
        <aside class="w-80 h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background-dark flex flex-col overflow-y-auto">
            <div class="p-4 space-y-6 flex flex-col flex-1 min-h-0">
                {/* Upload Area */}
                <div 
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    class={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
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
                            <p class="text-xs font-medium text-center">Procesando archivo...</p>
                        </>
                    ) : (
                        <>
                            <span class="material-symbols-outlined text-zinc-400 group-hover:text-primary transition-colors text-xl mb-2">Subir Archivo</span>
                            <p class="text-sm font-medium text-center">Importar archivo HTML</p>
                            <p class="text-xs text-zinc-500 dark:text-zinc-500 text-center mt-1">Arrastrar el archivo o clickear para buscarlo</p>
                        </>
                    )}
                </div>

                {/* Mode Toggle */}
                <div class="space-y-4">
                    <p class="text-xs text-start font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Modo de Generación</p>
                    <div class="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-zinc-800 shadow-sm rounded-md text-sm font-semibold">
                            Manual
                        </button>
                        <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-zinc-500 dark:text-zinc-400 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors">
                            Automático
                        </button>
                    </div>
                </div>

                {/* Subject Search */}
                <div class="space-y-4 flex flex-col flex-1 min-h-0">
                    <div class="flex items-center justify-between px-1">
                        <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-start">Materias</p>
                        <span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            {materiasFiltradas.length} ENCONTRADAS
                        </span>
                    </div>
                    <div class="relative">
                        <input 
                            class="w-full pl-4 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-500" 
                            placeholder="Buscar materias..." 
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div class="space-y-1 flex-1 min-h-0 overflow-y-auto">
                        {!materias || materias.length === 0 ? (
                            <p class="text-xs text-zinc-500 text-center py-4">
                                No hay materias cargadas. Sube un archivo HTML.
                            </p>
                        ) : materiasFiltradas.length === 0 ? (
                            <p class="text-xs text-zinc-500 text-center py-4">
                                No se encontraron materias con "{debouncedSearchTerm}"
                            </p>
                        ) : (
                            materiasFiltradas.map(materia => (
                                <Subject key={materia.codigo} materia={materia}/>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div class="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div class="flex items-center justify-between mb-4">
                    <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferencias</p>
                    <button class="text-primary text-[10px] font-bold hover:underline">RESET</button>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-medium">Evitar en las mañanas</span>
                        <div class="w-8 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full relative">
                            <div class="absolute left-0.5 top-0.5 size-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-medium">Evitar horarios con huecos extensos</span>
                        <div class="w-8 h-4 bg-primary rounded-full relative">
                            <div class="absolute right-0.5 top-0.5 size-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-medium">Tema Oscuro</span>
                        <button 
                            onClick={() => setDarkTheme(!darkTheme)}
                            class={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${darkTheme ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        >
                            <div class={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${darkTheme ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}
