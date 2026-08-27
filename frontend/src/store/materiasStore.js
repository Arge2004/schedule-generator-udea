import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store global para manejar los datos de materias parseadas y estado de la aplicación
 */
export const useMateriasStore = create(
  persist(
    (set) => ({
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
      allowManualBlocks: false,
      allowManualBlocksLocked: false,
      previousAllowManualBlocks: null,

      // Estado del tema: Siempre light por defecto
      darkTheme: false,
      themeSyncEnabled: false,
      
      // Estados transitorios de drag and drop y navegación
      dragEnabled: false,
      draggingMateria: null,
      hoveredScheduleCell: null,
      availableHorarios: [],
      showGrupoSelector: false,
      gruposConflicto: [],
      previewGrupo: null,
      pendingModal: false,
      focusedMateriaCodigo: null,
      focusTimestamp: 0,
      expandedSubjects: {},
      toggleSubjectExpanded: (codigo, isExpanded) =>
        set((state) => {
          const current = { ...(state.expandedSubjects || {}) };
          const key = String(codigo);
          const shouldExpand =
            typeof isExpanded === "boolean" ? isExpanded : !current[key];
          if (shouldExpand) {
            current[key] = true;
          } else {
            delete current[key];
          }
          return { expandedSubjects: current };
        }),
      collapseAllSubjects: () => set({ expandedSubjects: {} }),
      shakeMateriaCodigo: null,
      shakeTimestamp: 0,
      lastDropSuccessful: false,
      setLastDropSuccessful: (val) => set({ lastDropSuccessful: Boolean(val) }),
      triggerShakeMateria: (codigo) => {
        set({ shakeMateriaCodigo: codigo, shakeTimestamp: Date.now() });
        setTimeout(() => {
          set((state) => (state.shakeMateriaCodigo === codigo ? { shakeMateriaCodigo: null } : state));
        }, 500);
      },
      notify: (message) => { console.log('Notify:', message); },
      setNotifier: (fn) => set({ notify: fn }),

      // Navegación y scroll interactivo hacia materias
      focusMateria: (codigo) => set({ focusedMateriaCodigo: codigo, focusTimestamp: Date.now() }),
      clearFocusedMateria: () => set({ focusedMateriaCodigo: null }),

      // Acciones de tema con actualización síncrona del DOM
      setDarkTheme: (isDark) => {
        if (typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ darkTheme: isDark });
      },
      toggleDarkTheme: () => set((state) => {
        const nextDark = !state.darkTheme;
        if (typeof document !== 'undefined') {
          if (nextDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { 
          darkTheme: nextDark, 
          themeSyncEnabled: false 
        };
      }),
      syncThemeWithSystem: (isDark) => set((state) => {
        if (state.themeSyncEnabled) {
          if (typeof document !== 'undefined') {
            if (isDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return { darkTheme: isDark };
        }
        return {};
      }),

      // Acciones de carga de datos
      setMateriasData: (data) => set((state) => ({
        materias: data.materias,
        facultad: data.facultad,
        programa: data.programa,
        semestre: data.semestre,
        fecha: data.fecha,
        isLoaded: true,
        materiasSeleccionadas: {},
        gruposSeleccionados: {},
        horariosGenerados: [],
        horarioActualIndex: 0,
        previewGrupo: null,
        removedGroups: state.removedGroups ? [] : undefined,
        resetKey: (state.resetKey || 0) + 1,
      })),

      // Limpiar el store al volver al menú principal
      clearMaterias: () => set({
        materias: null,
        facultad: '',
        programa: { codigo: '', nombre: '' },
        semestre: '',
        fecha: '',
        isLoaded: false,
        materiasSeleccionadas: {},
        gruposSeleccionados: {},
        horariosGenerados: [],
        horarioActualIndex: 0,
        manualBlocks: [],
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
        expandedSubjects: {},
        resetKey: state.resetKey + 1,
      })),

      // Seleccionar un grupo específico para una materia
      selectGrupo: (codigoMateria, numeroGrupo) => set((state) => ({
        gruposSeleccionados: { ...state.gruposSeleccionados, [codigoMateria]: numeroGrupo }
      })),

      // Eliminar una materia completamente del horario (manual)
      deleteMateriaFromSchedule: (codigoMateria) => set((state) => {
        const newGrupos = { ...state.gruposSeleccionados };
        delete newGrupos[codigoMateria];
        delete newGrupos[String(codigoMateria)];
        delete newGrupos[Number(codigoMateria)];

        const newMaterias = { ...state.materiasSeleccionadas };
        delete newMaterias[codigoMateria];
        delete newMaterias[String(codigoMateria)];
        delete newMaterias[Number(codigoMateria)];

        const newExpanded = { ...(state.expandedSubjects || {}) };
        delete newExpanded[codigoMateria];
        delete newExpanded[String(codigoMateria)];

        return {
          gruposSeleccionados: newGrupos,
          materiasSeleccionadas: newMaterias,
          expandedSubjects: newExpanded,
          resetKey: (state.resetKey || 0) + 1,
        };
      }),

      // Verificar si una materia está seleccionada
      isMateriaSelected: (codigoMateria) => (state) => {
        return !!state.materiasSeleccionadas[codigoMateria];
      },

      // Obtener array de códigos de materias seleccionadas
      getMateriasSeleccionadas: () => (state) => {
        return Object.keys(state.materiasSeleccionadas);
      },

      // Guardar horarios generados automáticamente
      setHorariosGenerados: (horarios) => set((state) => {
        const allowMap = {};
        if (horarios && horarios.length > 0) {
          for (let i = 0; i < horarios.length; i++) {
            if (state.allowManualBlocksBySchedule && typeof state.allowManualBlocksBySchedule[i] !== 'undefined') {
              allowMap[i] = !!state.allowManualBlocksBySchedule[i];
            } else {
              allowMap[i] = !!state.allowManualBlocks;
            }
          }
        }

        return {
          horariosGenerados: horarios,
          horarioActualIndex: 0,
          allowManualBlocksBySchedule: allowMap,
          manualBlocks: (state.manualBlocks || []).map((b) => ({
            ...b,
            scheduleIndex: (horarios && horarios.length > 0) ? (typeof b.scheduleIndex === 'number' ? b.scheduleIndex : 0) : b.scheduleIndex,
          })),
        };
      }),

      // Cambiar el horario que se está visualizando
      setHorarioActualIndex: (index) => set({
        horarioActualIndex: index,
      }),

      // Limpiar horarios generados
      clearHorariosGenerados: () => set({
        horariosGenerados: [],
        horarioActualIndex: 0,
        allowManualBlocksBySchedule: {},
      }),

      // Acciones de drag and drop
      setDragEnabled: (value) => set({ dragEnabled: !!value }),

      setDraggingMateria: (materia) => set({
        draggingMateria: materia,
        availableHorarios: materia ? [] : [],
        lastDropSuccessful: false,
      }),

      setHoveredScheduleCell: (cell) => set({
        hoveredScheduleCell: cell,
      }),

      setAvailableHorarios: (horarios) => set({
        availableHorarios: horarios,
      }),

      setShowGrupoSelector: (show, grupos = []) => {
        set({
          showGrupoSelector: show,
          gruposConflicto: grupos,
          pendingModal: show && grupos.length > 0,
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
      setAllowManualBlocks: (value) => set({ allowManualBlocks: !!value }),
      toggleAllowManualBlocks: () => set((state) => {
        if (state.allowManualBlocksLocked) return state;
        return { allowManualBlocks: !state.allowManualBlocks };
      }),

      // Bloquear temporalmente la preferencia
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

      // Preferencias de bloques manuales por horario
      allowManualBlocksBySchedule: {},
      setAllowManualBlocksForSchedule: (index, value) => set((state) => ({
        allowManualBlocksBySchedule: { ...(state.allowManualBlocksBySchedule || {}), [index]: !!value }
      })),
      clearAllowManualBlocksBySchedule: () => set({ allowManualBlocksBySchedule: {} }),

      clearDragState: () => set((state) => {
        if (state.pendingModal) {
          return state;
        }
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
    }),
    {
      name: 'udea-schedule-store',
      partialize: (state) => ({
        materias: state.materias,
        facultad: state.facultad,
        programa: state.programa,
        semestre: state.semestre,
        fecha: state.fecha,
        isLoaded: state.isLoaded,
        materiasSeleccionadas: state.materiasSeleccionadas,
        gruposSeleccionados: state.gruposSeleccionados,
        horariosGenerados: state.horariosGenerados,
        horarioActualIndex: state.horarioActualIndex,
        manualBlocks: state.manualBlocks,
        allowManualBlocks: state.allowManualBlocks,
        allowManualBlocksBySchedule: state.allowManualBlocksBySchedule,
        darkTheme: state.darkTheme,
      }),
    }
  )
)
