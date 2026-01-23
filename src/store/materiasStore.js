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

  // Acciones
  setMateriasData: (data) => set({
    materias: data.materias,
    facultad: data.facultad,
    programa: data.programa,
    semestre: data.semestre,
    fecha: data.fecha,
    isLoaded: true,
  }),

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
}))

