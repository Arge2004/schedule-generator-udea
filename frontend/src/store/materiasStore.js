import { create } from 'zustand'

/**
 * Store global para manejar los datos de materias parseadas
 */
export const useMateriasStore = create((set) => ({
  // Estado inicial
  materias: null,
  facultad: '',
  programa: { codigo: '', nombre: '' },
  semestre: '',
  fecha: '',
  isLoaded: false,
  materiasSeleccionadas: {}, // { codigoMateria: true/false }
  gruposSeleccionados: {}, // { codigoMateria: numeroGrupo }
  horariosGenerados: [], // Array de horarios generados automáticamente
  horarioActualIndex: 0, // Índice del horario que se está visualizando
  resetKey: 0, // Incrementa cada vez que se hace reset
  
  // Bloques manuales creados por el usuario (click+drag)
  manualBlocks: [], // { id, name, diaIndex, horaIndex, duracion, color, pulsing }
  
  // Preferencias del usuario
  // Permitir crear bloques manuales en el horario (click+drag)
  allowManualBlocks: (() => {
    try { const v = localStorage.getItem('allowManualBlocks'); return v === null ? false : JSON.parse(v); } catch (e) { return false; }
  })(),
  // Estado para bloquear la preferencia temporalmente (ej. al pasar a modo automático)
  allowManualBlocksLocked: false,
  previousAllowManualBlocks: null, // almacena valor previo cuando se bloquea la preferencia

  // Estado del tema
  darkTheme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false,
  themeSyncEnabled: true, // Si true, sigue la preferencia del sistema; si false, usa preferencia manual
  
  // Estados de drag and drop
  draggingMateria: null, // { codigo, nombre, grupos } - Materia que se está arrastrando
  hoveredScheduleCell: null, // { diaIndex, horaIndex } - Celda sobre la que se está hovering
  availableHorarios: [], // Array de horarios disponibles de la materia siendo arrastrada
  showGrupoSelector: false, // Mostrar modal de selección de grupos
  gruposConflicto: [], // Grupos que tienen el mismo horario al soltar
  previewGrupo: null, // Preview del grupo al hacer hover { codigo, numeroGrupo, horarios, color }
  pendingModal: false, // Flag para indicar que hay un modal pendiente
  // Notifier para mensajes (puede ser seteado por Schedule)
  notify: (message) => { console.log('Notify:', message); },
  setNotifier: (fn) => set({ notify: fn }),

  // Acciones de tema
  setDarkTheme: (isDark) => set({ darkTheme: isDark }),
  toggleDarkTheme: () => set((state) => ({ 
    darkTheme: !state.darkTheme, 
    themeSyncEnabled: false // Desactivar sincronización cuando el usuario cambia manualmente
  })),
  syncThemeWithSystem: (isDark) => set((state) => 
    state.themeSyncEnabled ? { darkTheme: isDark } : {}
  ),

  // Acciones
  setMateriasData: (data) => set((state) => ({
    materias: data.materias,
    facultad: data.facultad,
    programa: data.programa,
    semestre: data.semestre,
    fecha: data.fecha,
    isLoaded: true,
    // Reset selections and generated schedules when loading new data
    materiasSeleccionadas: {},
    gruposSeleccionados: {},
    horariosGenerados: [],
    horarioActualIndex: 0,
    previewGrupo: null,
    removedGroups: state.removedGroups ? [] : undefined,
    resetKey: (state.resetKey || 0) + 1,
  })),


  // Limpiar el store
  clearMaterias: () => set({
    materias: null,
    facultad: '',
    programa: { codigo: '', nombre: '' },
    semestre: '',
    fecha: '',
    isLoaded: false,
    materiasSeleccionadas: {},
  }),

  // Toggle selección de una materia
  toggleMateriaSelected: (codigoMateria) => set((state) => {
    const newSeleccionadas = { ...state.materiasSeleccionadas };
    
    if (newSeleccionadas[codigoMateria]) {
      delete newSeleccionadas[codigoMateria];
    } else {
      newSeleccionadas[codigoMateria] = true;
    }
    
    return { materiasSeleccionadas: newSeleccionadas };
  }),

  // Resetear todas las materias seleccionadas
  resetMateriasSeleccionadas: () => set((state) => ({
    materiasSeleccionadas: {},
    gruposSeleccionados: {},
    resetKey: state.resetKey + 1,
  })),

  // Seleccionar un grupo específico para una materia
  selectGrupo: (codigoMateria, numeroGrupo) => set((state) => ({
    gruposSeleccionados: { ...state.gruposSeleccionados, [codigoMateria]: numeroGrupo }
  })),

  // Verificar si una materia está seleccionada
  isMateriaSelected: (codigoMateria) => (state) => {
    return !!state.materiasSeleccionadas[codigoMateria];
  },

  // Obtener array de códigos de materias seleccionadas
  getMateriasSeleccionadas: () => (state) => {
    return Object.keys(state.materiasSeleccionadas);
  },

  // Guardar horarios generados automáticamente
  setHorariosGenerados: (horarios) => set({
    horariosGenerados: horarios,
    horarioActualIndex: 0,
  }),

  // Cambiar el horario que se está visualizando
  setHorarioActualIndex: (index) => set({
    horarioActualIndex: index,
  }),

  // Limpiar horarios generados
  clearHorariosGenerados: () => set({
    horariosGenerados: [],
    horarioActualIndex: 0,
  }),

  // Acciones de drag and drop
  setDraggingMateria: (materia) => set({
    draggingMateria: materia,
    availableHorarios: materia ? [] : [],
  }),

  setHoveredScheduleCell: (cell) => set({
    hoveredScheduleCell: cell,
  }),

  setAvailableHorarios: (horarios) => set({
    availableHorarios: horarios,
  }),

  setShowGrupoSelector: (show, grupos = []) => {
    console.log('setShowGrupoSelector llamado:', { show, grupos });
    set({
      showGrupoSelector: show,
      gruposConflicto: grupos,
      pendingModal: show && grupos.length > 0, // Setear flag si vamos a mostrar modal
    });
  },

  setPreviewGrupo: (preview) => set({
    previewGrupo: preview,
  }),

  // Acciones para manejar bloques manuales
  addManualBlock: (block) => set((state) => ({ manualBlocks: [...(state.manualBlocks || []), block] })),
  removeManualBlock: (id) => set((state) => ({ manualBlocks: (state.manualBlocks || []).filter(b => b.id !== id) })),
  renameManualBlock: (id, name) => set((state) => ({ manualBlocks: (state.manualBlocks || []).map(b => b.id === id ? { ...b, name } : b) })),
  updateManualBlock: (id, props) => set((state) => ({ manualBlocks: (state.manualBlocks || []).map(b => b.id === id ? { ...b, ...props } : b) })),
  clearManualBlocks: () => set({ manualBlocks: [] }),

  // Preferencias: permitir crear bloques manuales
  setAllowManualBlocks: (value) => {
    try { localStorage.setItem('allowManualBlocks', JSON.stringify(value)); } catch (e) {}
    set({ allowManualBlocks: !!value });
  },
  toggleAllowManualBlocks: () => set((state) => {
    // No permitir toggle si la preferencia está bloqueada
    if (state.allowManualBlocksLocked) return state;
    const next = !state.allowManualBlocks;
    try { localStorage.setItem('allowManualBlocks', JSON.stringify(next)); } catch (e) {}
    return { allowManualBlocks: next };
  }),

  // Bloquear temporalmente la preferencia (p. ej. al pasar a modo automático)
  lockAllowManualBlocks: () => set((state) => ({
    previousAllowManualBlocks: state.allowManualBlocks,
    allowManualBlocks: false,
    allowManualBlocksLocked: true,
  })),

  // Desbloquear y restaurar el valor previo
  unlockAllowManualBlocks: () => set((state) => ({
    allowManualBlocks: state.previousAllowManualBlocks !== null ? state.previousAllowManualBlocks : false,
    allowManualBlocksLocked: false,
    previousAllowManualBlocks: null,
  })),

  clearDragState: () => set((state) => {
    // Si hay un modal pendiente, NO limpiar nada todavía
    if (state.pendingModal) {
      console.log('clearDragState: Modal pendiente, no limpiando nada');
      return state; // No cambiar el estado
    }
    
    console.log('clearDragState: Limpiando todo');
    return {
      draggingMateria: null,
      hoveredScheduleCell: null,
      availableHorarios: [],
      previewGrupo: null,
      showGrupoSelector: false,
      gruposConflicto: [],
      pendingModal: false,
    };
  }),
}))


