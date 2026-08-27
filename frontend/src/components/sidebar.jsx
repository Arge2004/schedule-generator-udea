import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useMateriasStore } from "../store/materiasStore.js";
import { generarHorarios } from "../services/horarios.js";
import MobileScheduleModal from "./MobileSchedule.jsx";
import { GENERATION_MODES } from "../constants/sidebar.js";
import { ArrowLeftIcon } from "../icons/index.js";
import Tooltip from "./Tooltip.jsx";

// Subcomponentes del sidebar
import ModeToggle from "./sidebar/ModeToggle.jsx";
import SubjectList from "./sidebar/SubjectList.jsx";
import GenerateAction from "./sidebar/GenerateAction.jsx";
import ConfirmModeModal from "./sidebar/ConfirmModeModal.jsx";

export default function Sidebar() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [generationMode, setGenerationMode] = useState(GENERATION_MODES.MANUAL);
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
    setAllowManualBlocks,
    dragEnabled,
    setDragEnabled,
  } = useMateriasStore();

  // Detección responsiva de dispositivo móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce del término de búsqueda (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtrar materias respetando orden natural (sin mover seleccionadas al principio)
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

    return resultado;
  }, [materias, debouncedSearchTerm]);

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
          ? `La materia ${names} fue omitida: no tiene grupos desde las ${horaMinima}:00.`
          : `Se omitieron ${removedNames.length} materias por hora mínima (${horaMinima}:00): ${names}.`;
      toast.error(message, {
        duration: 6000,
        position: "bottom-center",
        style: {
          background: "#18181b",
          color: "#f4f4f5",
          border: "1px solid #27272a",
          fontSize: "12px",
        },
      });
    }

    setIsGenerating(true);

    try {
      const codigosSeleccionados = Object.keys(materiasSeleccionadas);
      const horarios = await generarHorarios(materias, codigosSeleccionados, {
        horaMinima,
        evitarHuecos,
      });

      if (horarios.length === 0) {
        toast.error(
          "No se pudieron generar horarios válidos con las materias seleccionadas.",
          {
            duration: 6000,
            position: "bottom-center",
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              fontSize: "12px",
            },
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
    if (scheduleCount > 0) {
      setPendingMode(targetMode);
      setShowConfirmModeModal(true);
      return;
    }

    const seleccionCount = materiasSeleccionadas
      ? Object.keys(materiasSeleccionadas).length
      : 0;

    if (seleccionCount >= 1) {
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
      <aside className="w-full sm:w-sm h-full select-none md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col relative z-20">
        {/* Cabecera: Mode Toggle + Botón Volver envuelto con Tooltip */}
        <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 flex-shrink-0 bg-white dark:bg-zinc-950">
          <ModeToggle
            generationMode={generationMode}
            onRequestModeChange={requestModeChange}
          />
          <Tooltip
            content="Volver al menú de facultades y programas"
            position="bottom"
          >
            <button
              type="button"
              onClick={handleResetToMenu}
              className="h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white  cursor-pointer"
              aria-label="Volver al menú de facultades y programas"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Cuerpo principal: Lista de materias */}
        <div className="flex-1 min-h-0 p-3 flex flex-col">
          <SubjectList
            materiasFiltradas={materiasFiltradas}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onClearSearch={() => setSearchTerm("")}
            generationMode={generationMode}
            dragEnabled={dragEnabled}
            setDragEnabled={setDragEnabled}
            horaMinima={horaMinima}
            setHoraMinima={setHoraMinima}
            evitarHuecos={evitarHuecos}
            setEvitarHuecos={setEvitarHuecos}
            isMobile={isMobile}
          />
        </div>

        {/* Dock Flotante Inferior: Solo visible en modo Automático */}
        <GenerateAction
          generationMode={generationMode}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />

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
