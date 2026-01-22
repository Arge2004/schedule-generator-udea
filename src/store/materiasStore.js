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

  // Verificar si una materia está seleccionada
  isMateriaSelected: (codigoMateria) => (state) => {
    return !!state.materiasSeleccionadas[codigoMateria];
  },

  // Obtener array de códigos de materias seleccionadas
  getMateriasSeleccionadas: () => (state) => {
    return Object.keys(state.materiasSeleccionadas);
  },
}))

