import React, { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useMateriasStore } from "../store/materiasStore.js";
import { generarHorarios } from "../services/horarios.js";
import MobileScheduleModal from "./MobileSchedule.jsx";
import { GENERATION_MODES } from "../constants/sidebar.js";

// Subcomponentes del sidebar de la aplicación
import ModeToggle from "./sidebar/ModeToggle.jsx";
import SubjectList from "./sidebar/SubjectList.jsx";
import GenerateAction from "./sidebar/GenerateAction.jsx";
import SidebarPreferences from "./sidebar/SidebarPreferences.jsx";
import ConfirmModeModal from "./sidebar/ConfirmModeModal.jsx";

export default function Sidebar() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [generationMode, setGenerationMode] = useState(GENERATION_MODES.MANUAL);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [horaMinima, setHoraMinima] = useState(6);
  const [evitarHuecos, setEvitarHuecos] = useState(false);
  const [showConfirmModeModal, setShowConfirmModeModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  // Estados de móvil
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSchedule, setShowMobileSchedule] = useState(false);

  const {
    materias,
    materiasSeleccionadas,
    gruposSeleccionados,
    selectGrupo,
    toggleMateriaSelected,
    resetMateriasSeleccionadas,
    setHorariosGenerados,
    clearHorariosGenerados,
    horariosGenerados,
    clearMaterias,
    clearRemovedGroups,
    darkTheme,
    syncThemeWithSystem,
    setAllowManualBlocks,
  } = useMateriasStore();

  // Sincronización del tema oscuro con el sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => syncThemeWithSystem(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [syncThemeWithSystem]);

  // Aplicar/remover clase dark del documento
  useEffect(() => {
    if (darkTheme) {
      document.querySelector("html")?.classList.add("dark");
    } else {
      document.querySelector("html")?.classList.remove("dark");
    }
  }, [darkTheme]);

  // Detección responsiva de dispositivo móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce del término de búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtrar y ordenar materias
  const materiasFiltradas = useMemo(() => {
    if (!materias) return [];

    let resultado = materias;

    if (debouncedSearchTerm.trim()) {
      const termino = debouncedSearchTerm.toLowerCase();
      resultado = materias.filter(
        (materia) =>
          materia.nombre.toLowerCase().includes(termino) ||
          materia.codigo.toLowerCase().includes(termino),
      );
    }

    if (generationMode === GENERATION_MODES.AUTOMATICO) {
      const seleccionadas = [];
      const noSeleccionadas = [];

      resultado.forEach((materia) => {
        if (materiasSeleccionadas[materia.codigo]) {
          seleccionadas.push(materia);
        } else {
          noSeleccionadas.push(materia);
        }
      });

      return [...seleccionadas, ...noSeleccionadas];
    }

    return resultado;
  }, [materias, debouncedSearchTerm, materiasSeleccionadas, generationMode]);

  // Generación automática de horarios
  const handleGenerate = async () => {
    const removedNames = [];
    Object.keys(materiasSeleccionadas).forEach((codigo) => {
      const materiaObj =
        materias && materias.find((m) => String(m.codigo) === String(codigo));
      if (!materiaObj) {
        if (gruposSeleccionados && gruposSeleccionados[codigo]) {
          selectGrupo(codigo, null);
        }
        toggleMateriaSelected(codigo);
        removedNames.push(codigo);
        return;
      }

      const hasValidGroup = (materiaObj.grupos || []).some((gr) =>
        (gr.horarios || []).some((h) => h.horaInicio >= horaMinima),
      );

      if (!hasValidGroup) {
        if (gruposSeleccionados && gruposSeleccionados[codigo]) {
          selectGrupo(codigo, null);
        }
        if (materiasSeleccionadas[codigo]) {
          toggleMateriaSelected(codigo);
        }
        removedNames.push(materiaObj.nombre || codigo);
      }
    });

    if (removedNames.length > 0) {
      const names = removedNames.join(", ");
      const message =
        removedNames.length === 1
          ? `La materia ${names} fue eliminada: no tiene grupos disponibles desde las ${horaMinima}:00.`
          : `Se eliminaron ${removedNames.length} materias por hora mínima (${horaMinima}:00): ${names}.`;
      toast.error(message, {
        duration: 8000,
        position: "bottom-center",
        style: { background: "#ff0000ab", color: "#fff" },
      });
    }

    setIsGenerating(true);

    try {
      const codigosSeleccionados = Object.keys(materiasSeleccionadas);
      const horarios = await generarHorarios(
        materias,
        codigosSeleccionados,
        { horaMinima, evitarHuecos },
      );

      if (horarios.length === 0) {
        toast.error(
          "No se pudieron generar horarios válidos. Verifica las selecciones.",
          {
            duration: 8000,
            position: "bottom-center",
            style: { background: "#ff0000ab", color: "#fff" },
          },
        );
      } else {
        setHorariosGenerados(horarios);
        if (isMobile) {
          setShowMobileSchedule(true);
        }
      }
    } catch (error) {
      toast.error("Error al generar horarios");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cambio de modo con confirmación si hay selecciones previas
  const requestModeChange = (targetMode) => {
    if (targetMode === generationMode) return;

    const scheduleCount = horariosGenerados ? horariosGenerados.length : 0;
    if (
      scheduleCount > 0
    ) {
      setPendingMode(targetMode);
      setShowConfirmModeModal(true);
      return;
    }

    const seleccionCount = materiasSeleccionadas
      ? Object.keys(materiasSeleccionadas).length
      : 0;

    if (
      seleccionCount >= 1
    ) {
      setPendingMode(targetMode);
      setShowConfirmModeModal(true);
      return;
    }

    setGenerationMode(targetMode);
    if (targetMode === GENERATION_MODES.AUTOMATICO) {
      setAllowManualBlocks(false);
    }
    resetMateriasSeleccionadas();
    clearHorariosGenerados();
  };

  const handleConfirmModeChange = () => {
    if (!pendingMode) return;
    setGenerationMode(pendingMode);
    if (pendingMode === GENERATION_MODES.AUTOMATICO) {
      setAllowManualBlocks(false);
    }
    setShowConfirmModeModal(false);
    resetMateriasSeleccionadas();
    clearHorariosGenerados();
    setPendingMode(null);
  };

  const handleCancelModeChange = () => {
    setPendingMode(null);
    setShowConfirmModeModal(false);
  };

  // Volver al menú inicial de selección de programa
  const handleResetToMenu = () => {
    try {
      resetMateriasSeleccionadas();
      clearHorariosGenerados();
      clearRemovedGroups?.();
      clearMaterias();
      localStorage.removeItem("selectedFacultad");
      localStorage.removeItem("selectedPrograma");
    } catch (err) {
      toast.error("No se pudo volver al menú");
    }
  };

  return (
    <>
      <Toaster />
      <aside className="w-full sm:w-80 h-full select-none md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background-dark flex flex-col relative overflow-hidden">
        {/* Botón: Volver al menú principal */}
        <div className="absolute top-3 right-3 z-50">
          <button
            onClick={handleResetToMenu}
            className="px-3 py-1 cursor-pointer rounded-md text-sm font-medium dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800 bg-white/80 text-zinc-900 border-zinc-200 hover:bg-zinc-100"
            title="Volver al menú principal"
          >
            Menú
          </button>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 space-y-6 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Selector de modo */}
            <ModeToggle
              generationMode={generationMode}
              onRequestModeChange={requestModeChange}
            />

            {/* Búsqueda y lista de materias */}
            <SubjectList
              materiasFiltradas={materiasFiltradas}
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              onClearSearch={() => setSearchTerm("")}
              debouncedSearchTerm={debouncedSearchTerm}
              generationMode={generationMode}
              dragEnabled={dragEnabled}
            />
          </div>

          {/* Acciones principales de generación / visualización */}
          <GenerateAction
            generationMode={generationMode}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            isMobile={isMobile}
            onShowMobileSchedule={() => setShowMobileSchedule(true)}
          />

          {/* Preferencias de configuración */}
          <SidebarPreferences
            generationMode={generationMode}
            horaMinima={horaMinima}
            setHoraMinima={setHoraMinima}
            evitarHuecos={evitarHuecos}
            setEvitarHuecos={setEvitarHuecos}
            dragEnabled={dragEnabled}
            setDragEnabled={setDragEnabled}
            isMobile={isMobile}
          />
        </div>

        {/* Modal de confirmación de cambio de modo */}
        <ConfirmModeModal
          isOpen={showConfirmModeModal}
          pendingMode={pendingMode}
          onConfirm={handleConfirmModeChange}
          onCancel={handleCancelModeChange}
        />
      </aside>

      {/* Modal de horarios para móvil */}
      <MobileScheduleModal
        isOpen={showMobileSchedule}
        onClose={() => setShowMobileSchedule(false)}
      />
    </>
  );
}
