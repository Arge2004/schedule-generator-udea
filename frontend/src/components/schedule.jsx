import React, { useMemo, useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { TrashIcon } from "../icons/index.js";

import ColorBlobs from "./ColorBlobs.jsx";
import { ScheduleProvider } from "./ScheduleContext.jsx";
import ClassBlock from "./ClassBlock.jsx";
import ClassTooltip from "./ClassTooltip.jsx";
import ScheduleDropOverlay from "./ScheduleDropOverlay.jsx";
import GrupoSelectorModal from "./GrupoSelectorModal.jsx";
import ScheduleHeader from "./schedule/ScheduleHeader.jsx";
import ScheduleToolbar from "./schedule/ScheduleToolbar.jsx";

import { useMateriasStore } from "../store/materiasStore.js";
import {
  DIAS,
  HORAS,
  getSubjectColor,
  formatHoraCompact,
} from "../constants/schedule.js";

export default function Schedule() {
  const {
    horariosGenerados = [],
    horarioActualIndex = 0,
    setHorarioActualIndex,
    gruposSeleccionados = {},
    materiasSeleccionadas = {},
    materias = [],
    draggingMateria,
    availableHorarios = [],
    previewGrupo,
    setAvailableHorarios,
    selectGrupo,
    toggleMateriaSelected,
    setShowGrupoSelector,
    clearDragState,
    darkTheme,
    toggleDarkTheme,
    allowManualBlocks,
    allowManualBlocksBySchedule,
    manualBlocks = [],
    addManualBlock,
    removeManualBlock,
    renameManualBlock,
    clearManualBlocks,
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    clearAllowManualBlocksBySchedule,
    dragEnabled,
    setDraggingMateria,
    deleteMateriaFromSchedule,
  } = useMateriasStore();

  const [exporting, setExporting] = useState(false);
  const [editingManualId, setEditingManualId] = useState(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const [explodingCodigo, setExplodingCodigo] = useState(null);
  const [explodingManualId, setExplodingManualId] = useState(null);

  const handleDeleteSubjectWithAnimation = (codigoMateria) => {
    if (!codigoMateria) return;
    setExplodingCodigo(codigoMateria);
    setTimeout(() => {
      deleteMateriaFromSchedule(codigoMateria);
      setExplodingCodigo(null);
    }, 420);
  };

  const handleDeleteManualBlockWithAnimation = (manualId) => {
    if (!manualId) return;
    setExplodingManualId(manualId);
    setTimeout(() => {
      removeManualBlock(manualId);
      setExplodingManualId(null);
    }, 420);
  };

  // Tooltip flotante atómico
  const [tooltipState, setTooltipState] = useState(null);
  const hideTimeoutRef = useRef(null);

  // Refs de grid y selección
  const scheduleRef = useRef(null);
  const gridRef = useRef(null);
  const previewRef = useRef(null);
  const selectionStartRef = useRef(null);
  const selectionCurrentRef = useRef(null);
  const isSelectingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const hasLongPressedRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const rafRef = useRef(null);
  const gridRectRef = useRef(null);

  // Permiso efectivo para bloques manuales
  const effectiveAllowManualBlocks =
    horariosGenerados && horariosGenerados.length > 0
      ? Boolean(
          allowManualBlocksBySchedule &&
          allowManualBlocksBySchedule[horarioActualIndex],
        )
      : Boolean(allowManualBlocks);

  // Construir lista de clases a renderizar con colores deterministas y estables
  const clasesParaRenderizar = useMemo(() => {
    const clases = [];
    let gruposParaProcesar = [];

    const anyManualSelected =
      gruposSeleccionados &&
      Object.values(gruposSeleccionados).some(
        (v) => v !== null && v !== undefined,
      );

    if (anyManualSelected && materias) {
      Object.entries(gruposSeleccionados).forEach(
        ([codigoMateria, numeroGrupo]) => {
          if (numeroGrupo !== null) {
            const materia = materias.find(
              (m) => String(m.codigo) === String(codigoMateria),
            );
            if (materia) {
              const grupo = (materia.grupos || []).find(
                (g) => g.numero === numeroGrupo,
              );
              if (grupo) {
                gruposParaProcesar.push({
                  nombreMateria: materia.nombre,
                  numeroGrupo: grupo.numero,
                  horarios: grupo.horarios || [],
                  profesor: grupo.profesor,
                  codigoMateria: materia.codigo,
                  source: "manual",
                  color: getSubjectColor(materia.codigo || materia.nombre),
                });
              }
            }
          }
        },
      );
    } else if (horariosGenerados && horariosGenerados.length > 0) {
      const horarioSeleccionado = horariosGenerados[horarioActualIndex];
      if (horarioSeleccionado && horarioSeleccionado.grupos) {
        gruposParaProcesar = horarioSeleccionado.grupos.map((g) => ({
          nombreMateria: g.nombreMateria,
          numeroGrupo: g.numeroGrupo,
          horarios: g.horarios || [],
          profesor: g.profesor,
          codigoMateria: g.codigoMateria,
          source: "automatico",
          color: getSubjectColor(g.codigoMateria || g.nombreMateria),
        }));
      }
    }

    // Bloques manuales creados por el usuario
    if (manualBlocks && manualBlocks.length > 0) {
      manualBlocks.forEach((b) => {
        const belongsToCurrent =
          horariosGenerados && horariosGenerados.length > 0
            ? typeof b.scheduleIndex === "number"
              ? b.scheduleIndex === horarioActualIndex
              : false
            : true;
        if (!belongsToCurrent) return;

        gruposParaProcesar.push({
          nombreMateria: b.name || "Bloque manual",
          numeroGrupo: null,
          horarios: [
            {
              dias: [DIAS[b.diaIndex]],
              horaInicio: HORAS[b.horaIndex],
              horaFin: HORAS[b.horaIndex] + b.duracion,
            },
          ],
          profesor: "",
          codigoMateria: null,
          source: "manual",
          manualId: b.id,
          color: b.color || getSubjectColor(b.id || b.name),
        });
      });
    }

    // Preview de grupo (hover en sidebar)
    if (previewGrupo && !gruposSeleccionados[previewGrupo.codigo]) {
      gruposParaProcesar.push({
        nombreMateria: previewGrupo.nombre,
        numeroGrupo: previewGrupo.numeroGrupo,
        horarios: previewGrupo.horarios || [],
        profesor: previewGrupo.profesor,
        codigoMateria: previewGrupo.codigo,
        source: "manual",
        color: getSubjectColor(previewGrupo.codigo || previewGrupo.nombre),
        isPreview: true,
      });
    }

    // Aplanar cada grupo en bloques por día y hora
    gruposParaProcesar.forEach((grupo) => {
      let codigoMateria = grupo.codigoMateria || null;
      if (!codigoMateria && materias) {
        const mat = materias.find((m) => m.nombre === grupo.nombreMateria);
        if (mat) codigoMateria = mat.codigo;
      }

      (grupo.horarios || []).forEach((horario) => {
        (horario.dias || []).forEach((dia) => {
          const diaIndex = DIAS.indexOf(dia);
          if (diaIndex !== -1) {
            clases.push({
              materia: grupo.nombreMateria,
              codigoMateria: codigoMateria,
              grupo: grupo.numeroGrupo,
              aula: horario.aula,
              profesor: grupo.profesor,
              color: grupo.color,
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin,
              duracion: horario.horaFin - horario.horaInicio,
              diaIndex: diaIndex,
              horaIndex: HORAS.indexOf(horario.horaInicio),
              isPreview: Boolean(grupo.isPreview),
              source: grupo.source || (grupo.isPreview ? "preview" : "manual"),
              manualId: grupo.manualId,
            });
          }
        });
      });
    });

    return clases;
  }, [
    horariosGenerados,
    horarioActualIndex,
    gruposSeleccionados,
    materias,
    previewGrupo,
    manualBlocks,
    darkTheme,
  ]);

  // Mapa de celdas ocupadas
  const celdasOcupadas = useMemo(() => {
    const ocupadas = new Map();
    clasesParaRenderizar.forEach((clase) => {
      if (!clase.isPreview) {
        for (let i = 0; i < clase.duracion; i++) {
          ocupadas.set(
            `${clase.diaIndex}-${clase.horaIndex + i}`,
            clase.materia,
          );
        }
      }
    });
    return ocupadas;
  }, [clasesParaRenderizar]);

  // Mapa por código de materia
  const celdasMateria = useMemo(() => {
    const map = new Map();
    const normalize = (s = "") =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

    clasesParaRenderizar.forEach((clase) => {
      if (!clase.isPreview) {
        let codigo = clase.codigoMateria;
        if (!codigo && materias && Array.isArray(materias)) {
          const buscado = materias.find(
            (m) =>
              normalize(m.nombre) === normalize(clase.materia) ||
              m.codigo === clase.codigoMateria,
          );
          if (buscado) codigo = buscado.codigo;
        }

        const identifier = codigo || clase.materia;
        for (let i = 0; i < clase.duracion; i++) {
          map.set(`${clase.diaIndex}-${clase.horaIndex + i}`, identifier);
        }
      }
    });
    return map;
  }, [clasesParaRenderizar, materias]);

  const getCodigoFromValor = (valor) => {
    if (!valor) return undefined;
    if (materias && materias.find((m) => m.codigo === valor)) return valor;
    const normalize = (s = "") =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    const found =
      materias &&
      materias.find((m) => normalize(m.nombre) === normalize(String(valor)));
    return found ? found.codigo : undefined;
  };

  const [clearingExplosions, setClearingExplosions] = useState(new Set());
  const [isClearingSequence, setIsClearingSequence] = useState(false);

  // Limpiar horarios, selecciones y bloques con efecto dominó/explosión 1 por 1
  const handleClearSchedule = () => {
    if (isClearingSequence) return;

    if (!clasesParaRenderizar || clasesParaRenderizar.length === 0) {
      resetMateriasSeleccionadas();
      clearHorariosGenerados();
      clearManualBlocks();
      clearAllowManualBlocksBySchedule();
      toast.success("Horario limpiado correctamente");
      return;
    }

    setIsClearingSequence(true);
    setTooltipState(null);

    // Obtener keys únicas de todos los bloques a explotar en orden
    const blockKeys = clasesParaRenderizar.map((clase) =>
      clase.manualId
        ? `manual-${clase.manualId}`
        : `block-${clase.codigoMateria || clase.materia}-d${clase.diaIndex}-h${clase.horaInicio}-${clase.horaFin}-g${clase.grupo || "0"}-${clase.isPreview ? "prev" : "perm"}`,
    );

    const count = blockKeys.length;
    // Escalonamiento óptimo para cualquier cantidad de bloques y dispositivo
    const stagger = Math.min(80, Math.max(35, 550 / count));

    blockKeys.forEach((key, index) => {
      setTimeout(() => {
        setClearingExplosions((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }, index * stagger);
    });

    const totalTime = count * stagger + 380;
    setTimeout(() => {
      resetMateriasSeleccionadas();
      clearHorariosGenerados();
      clearManualBlocks();
      clearAllowManualBlocksBySchedule();
      setClearingExplosions(new Set());
      setIsClearingSequence(false);
      toast.success("Horario limpiado correctamente");
    }, totalTime);
  };

  const hasContentToClear =
    !isClearingSequence &&
    ((horariosGenerados && horariosGenerados.length > 0) ||
      (manualBlocks && manualBlocks.length > 0) ||
      (gruposSeleccionados &&
        Object.values(gruposSeleccionados).some(
          (v) => v !== null && v !== undefined,
        )) ||
      (materiasSeleccionadas && Object.keys(materiasSeleccionadas).length > 0));

  // Handlers para Tooltip con callback memorizado
  const handleClassHover = React.useCallback((clase, position) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const minSpaceAbove = 170;
    const spaceAbove = position.y;
    const spaceRight = window.innerWidth - (position.x + position.width);

    const finalPosition = {
      ...position,
      placement:
        spaceAbove < minSpaceAbove && spaceRight > 260 ? "right" : "top",
    };

    setTooltipState({ clase, position: finalPosition });
  }, []);

  const handleClassLeave = React.useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setTooltipState(null);
    }, 30);
  }, []);

  // Limpiar tooltip al hacer scroll, resize, blur o click
  useEffect(() => {
    if (!tooltipState) return;

    const clearTooltip = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setTooltipState(null);
    };

    window.addEventListener("scroll", clearTooltip, true);
    window.addEventListener("resize", clearTooltip);
    window.addEventListener("blur", clearTooltip);
    window.addEventListener("pointerdown", clearTooltip);

    return () => {
      window.removeEventListener("scroll", clearTooltip, true);
      window.removeEventListener("resize", clearTooltip);
      window.removeEventListener("blur", clearTooltip);
      window.removeEventListener("pointerdown", clearTooltip);
    };
  }, [tooltipState]);

  // Limpiar tooltip si cambia el horario actual o la interacción de drag o bloques
  useEffect(() => {
    setTooltipState(null);
  }, [horarioActualIndex, draggingMateria, manualBlocks]);

  // Exportar PNG
  const handleExportPNG = async () => {
    try {
      setExporting(true);
      const element = scheduleRef.current;
      if (!element) {
        toast.error("No se encontró el horario");
        return;
      }

      const isDark = document.documentElement.classList.contains("dark");
      const canvas = await html2canvas(element, {
        backgroundColor: isDark ? "#09090b" : "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = "mi_horario_udea.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Horario exportado como PNG");
    } catch (error) {
      toast.error("Error al exportar PNG");
    } finally {
      setExporting(false);
    }
  };

  // Exportar PDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const element = scheduleRef.current;
      if (!element) {
        toast.error("No se encontró el horario");
        return;
      }

      const isDark = document.documentElement.classList.contains("dark");
      const canvas = await html2canvas(element, {
        backgroundColor: isDark ? "#09090b" : "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("mi_horario_udea.pdf");
      toast.success("Horario exportado como PDF");
    } catch (error) {
      toast.error("Error al exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  // Alternar bolitas de fondo
  const handleToggleColorBlobs = () => {
    try {
      const cur = localStorage.getItem("colorBlobsDebug") === "true";
      localStorage.setItem("colorBlobsDebug", (!cur).toString());
      window.dispatchEvent(new Event("colorBlobs:update"));
      toast.success(
        !cur ? "Efectos de fondo activados" : "Efectos de fondo desactivados",
      );
    } catch (e) {}
  };

  // Drag and Drop & Manual selection coordinates
  const getCellFromClient = (clientX, clientY) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const leftDays = rect.left + 72;

    // Verificar si el puntero está dentro de la cuadrícula de días
    if (
      clientX < leftDays ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    const widthDays = rect.width - 72;
    const cellWidth = widthDays / 7;
    const cellHeight = rect.height / HORAS.length;
    const x = clientX - leftDays;
    const y = clientY - rect.top;
    const diaIndex = Math.floor(x / cellWidth);
    const horaIndex = Math.floor(y / cellHeight);

    if (
      isNaN(diaIndex) ||
      isNaN(horaIndex) ||
      diaIndex < 0 ||
      diaIndex > 6 ||
      horaIndex < 0 ||
      horaIndex >= HORAS.length
    ) {
      return null;
    }

    gridRectRef.current = { rect, cellWidth, cellHeight, leftDays };
    return { diaIndex, horaIndex, rect, cellWidth, cellHeight, leftDays };
  };

  const updatePreviewDOM = () => {
    if (!previewRef.current) return;
    const start = selectionStartRef.current;
    const current = selectionCurrentRef.current;
    if (!start || !current) return;

    const minRow = Math.min(start.horaIndex, current.horaIndex);
    const maxRow = Math.max(start.horaIndex, current.horaIndex);
    const span = maxRow - minRow + 1;

    const gridRectData = gridRectRef.current || {};
    const cellH =
      gridRectData.cellHeight ||
      gridRef.current?.getBoundingClientRect().height / HORAS.length;
    const cellW =
      gridRectData.cellWidth ||
      (gridRef.current?.getBoundingClientRect().width - 72) / 7;

    const leftDaysLocal =
      (gridRectData.leftDays ||
        gridRef.current?.getBoundingClientRect().left + 72) -
      (gridRectData.rect
        ? gridRectData.rect.left
        : gridRef.current?.getBoundingClientRect().left);
    const left = Math.round(leftDaysLocal + start.diaIndex * cellW);
    const top = Math.round(minRow * cellH);
    const width = Math.round(cellW);
    const height = Math.round(span * cellH);

    previewRef.current.style.left = `${left}px`;
    previewRef.current.style.top = `${top}px`;
    previewRef.current.style.width = `${width}px`;
    previewRef.current.style.height = `${height}px`;
    previewRef.current.style.display = "block";
  };

  const clampPreviewToFree = (startDia, startHora, targetHora) => {
    const occupied = new Set();
    celdasOcupadas.forEach((v, k) => occupied.add(k));
    const belongsToCurrent = (b) => {
      if (!(horariosGenerados && horariosGenerados.length > 0)) return true;
      return typeof b.scheduleIndex === "number"
        ? b.scheduleIndex === horarioActualIndex
        : false;
    };
    manualBlocks.forEach((b) => {
      if (!belongsToCurrent(b)) return;
      for (let i = 0; i < b.duracion; i++) {
        occupied.add(`${b.diaIndex}-${b.horaIndex + i}`);
      }
    });

    const dir = targetHora >= startHora ? 1 : -1;
    let current = startHora;

    while (true) {
      const next = current + dir;
      if (dir === 1 && next > targetHora) break;
      if (dir === -1 && next < targetHora) break;

      const key = `${startDia}-${next}`;
      if (occupied.has(key)) break;
      current = next;
    }

    return current;
  };

  const onPointerMove = (ev) => {
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const cell = getCellFromClient(clientX, clientY);
    if (!cell) return;

    const start = selectionStartRef.current;
    if (!start) return;

    const adjustedHora = clampPreviewToFree(
      start.diaIndex,
      start.horaIndex,
      cell.horaIndex,
    );

    selectionCurrentRef.current = {
      diaIndex: start.diaIndex,
      horaIndex: adjustedHora,
    };

    if (adjustedHora !== start.horaIndex || hasDraggedRef.current) {
      if (adjustedHora !== start.horaIndex && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (adjustedHora !== start.horaIndex) hasDraggedRef.current = true;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePreviewDOM);
    }
  };

  const endSelection = () => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const start = selectionStartRef.current;
    const current = selectionCurrentRef.current || start;
    if (!start) {
      if (previewRef.current) previewRef.current.style.display = "none";
      return;
    }

    if (!hasDraggedRef.current && !hasLongPressedRef.current) {
      if (previewRef.current) previewRef.current.style.display = "none";
      selectionStartRef.current = null;
      selectionCurrentRef.current = null;
      isSelectingRef.current = false;
      return;
    }

    const minRow = Math.min(start.horaIndex, current.horaIndex);
    const span = Math.abs(start.horaIndex - current.horaIndex) + 1;

    const newId = Date.now() + Math.round(Math.random() * 1000);

    addManualBlock({
      id: newId,
      name: "Bloque manual",
      diaIndex: start.diaIndex,
      horaIndex: minRow,
      duracion: span,
      color: "#3b82f6",
      pulsing: true,
      scheduleIndex:
        horariosGenerados && horariosGenerados.length > 0
          ? horarioActualIndex
          : null,
    });
    setEditingManualId(newId);

    hasLongPressedRef.current = false;
    if (previewRef.current) previewRef.current.style.display = "none";
    selectionStartRef.current = null;
    selectionCurrentRef.current = null;
  };

  const handleMouseDown = (e) => {
    const target = e.target;
    if (
      target &&
      target.closest &&
      (target.closest("[data-no-select]") ||
        target.closest("[data-class-block]"))
    ) {
      return;
    }
    if (!effectiveAllowManualBlocks) return;

    if (
      editingManualId &&
      typeof document !== "undefined" &&
      document.activeElement &&
      document.activeElement.tagName === "INPUT"
    ) {
      try {
        document.activeElement.blur();
      } catch (e) {}
    }

    if (e.button !== 0) return;
    e.preventDefault();

    const cell = getCellFromClient(e.clientX, e.clientY);
    if (!cell) return;

    selectionStartRef.current = {
      diaIndex: cell.diaIndex,
      horaIndex: cell.horaIndex,
    };
    selectionCurrentRef.current = { ...selectionStartRef.current };
    isSelectingRef.current = true;
    hasDraggedRef.current = false;
    hasLongPressedRef.current = false;

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener(
      "mouseup",
      () => {
        window.removeEventListener("mousemove", onPointerMove);
        endSelection();
      },
      { once: true },
    );
  };

  const groupHasConflict = (grupo, targetMateriaCodigo = null) => {
    const activeCodigo =
      targetMateriaCodigo ||
      useMateriasStore.getState().draggingMateria?.codigo ||
      draggingMateria?.codigo;

    for (const horario of grupo.horarios || []) {
      for (const dia of horario.dias || []) {
        const diaIndex = DIAS.indexOf(dia);
        if (diaIndex === -1) continue;
        const horaInicioIndex = HORAS.indexOf(horario.horaInicio);
        const duracion = horario.horaFin - horario.horaInicio;
        for (let i = 0; i < duracion; i++) {
          const celdaKey = `${diaIndex}-${horaInicioIndex + i}`;
          const materiaEnCelda = celdasMateria.get(celdaKey);
          if (
            materiaEnCelda &&
            String(materiaEnCelda) !== String(activeCodigo)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Actualizar inmediatamente availableHorarios al iniciar drag (solo grupos con cupos, sin conflicto y distintos al actual)
  useEffect(() => {
    if (draggingMateria) {
      const grupoActual =
        gruposSeleccionados[draggingMateria.codigo] ||
        gruposSeleccionados[String(draggingMateria.codigo)];

      const todosLosHorarios = [];
      (draggingMateria.grupos || []).forEach((grupo) => {
        // Excluir el grupo que ya está puesto actualmente en el schedule
        if (grupoActual && String(grupo.numero) === String(grupoActual)) return;
        // Excluir grupos sin cupos si tienen cupoDisponible === 0
        if (
          typeof grupo.cupoDisponible === "number" &&
          grupo.cupoDisponible <= 0
        )
          return;
        // Excluir grupos con conflicto con otras materias en el horario
        if (groupHasConflict(grupo, draggingMateria.codigo)) return;

        (grupo.horarios || []).forEach((horario) => {
          todosLosHorarios.push({
            ...horario,
            numeroGrupo: grupo.numero,
          });
        });
      });
      setAvailableHorarios(todosLosHorarios);
    } else {
      setAvailableHorarios([]);
    }
  }, [draggingMateria, celdasMateria, gruposSeleccionados]);

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
  };

  const handleDrop = (e, diaIndex, horaIndex, overrideMateria = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const storeState = useMateriasStore.getState();
    const currentDragging =
      overrideMateria || storeState.draggingMateria || draggingMateria;

    if (!currentDragging) return false;

    const dia = DIAS[diaIndex];
    const hora = HORAS[horaIndex];

    const grupoActual =
      storeState.gruposSeleccionados[currentDragging.codigo] ||
      storeState.gruposSeleccionados[String(currentDragging.codigo)];

    const gruposEnEstaCelda = (currentDragging.grupos || []).filter((grupo) => {
      // Excluir el grupo actual ya colocado
      if (grupoActual && String(grupo.numero) === String(grupoActual))
        return false;
      if (typeof grupo.cupoDisponible === "number" && grupo.cupoDisponible <= 0)
        return false;
      if (groupHasConflict(grupo, currentDragging.codigo)) return false;
      return (grupo.horarios || []).some((horario) => {
        return (
          (horario.dias || []).includes(dia) &&
          hora >= horario.horaInicio &&
          hora < horario.horaFin
        );
      });
    });

    if (gruposEnEstaCelda.length === 0) {
      storeState.triggerShakeMateria?.(currentDragging.codigo);

      // 1. ¿El grupo actual de esta materia ocupa esta celda?
      const grupoActualObj = (currentDragging.grupos || []).find(
        (g) => grupoActual && String(g.numero) === String(grupoActual),
      );
      const isCurrentGroupCell =
        grupoActualObj &&
        (grupoActualObj.horarios || []).some((h) => {
          return (
            (h.dias || []).includes(dia) &&
            hora >= h.horaInicio &&
            hora < h.horaFin
          );
        });

      // 2. ¿Hay otra materia o bloque manual ocupando esta celda?
      const celdaKey = `${diaIndex}-${horaIndex}`;
      const materiaEnCelda = celdasMateria?.get(celdaKey);
      const isOccupiedByOther =
        (materiaEnCelda &&
          String(materiaEnCelda) !== String(currentDragging.codigo)) ||
        (storeState.manualBlocks || []).some(
          (b) =>
            b.diaIndex === diaIndex &&
            horaIndex >= b.horaIndex &&
            horaIndex < b.horaIndex + b.duracion,
        );

      // 3. ¿Algún grupo de esta materia tiene clases aquí?
      const anyGroupAtThisTime = (currentDragging.grupos || []).some((g) =>
        (g.horarios || []).some(
          (h) =>
            (h.dias || []).includes(dia) &&
            hora >= h.horaInicio &&
            hora < h.horaFin,
        ),
      );

      if (isCurrentGroupCell) {
        toast.error("Este grupo ya está seleccionado en este horario");
      } else if (isOccupiedByOther) {
        toast.error("Este espacio ya está ocupado por otra materia");
      } else if (!anyGroupAtThisTime) {
        toast.error("Esta materia no tiene clases en este horario");
      } else {
        toast.error("⚠️ No hay grupos disponibles sin conflicto de horario");
      }

      clearDragState();
      return false;
    }

    if (gruposEnEstaCelda.length > 1) {
      // Asegurar que draggingMateria esté en el store antes de abrir el modal
      useMateriasStore.setState({
        draggingMateria: currentDragging,
        lastDropSuccessful: true,
      });
      setShowGrupoSelector(true, gruposEnEstaCelda);
      return true;
    } else if (gruposEnEstaCelda.length === 1) {
      const grupo = gruposEnEstaCelda[0];
      useMateriasStore.setState({ lastDropSuccessful: true });
      selectGrupo(currentDragging.codigo, grupo.numero);
      if (!storeState.gruposSeleccionados[currentDragging.codigo]) {
        toggleMateriaSelected(currentDragging.codigo);
      }
      clearDragState();
      toast.success(`Materia agregada: Grupo ${grupo.numero}`);
      return true;
    }
    return false;
  };

  return (
    <ScheduleProvider
      celdasMateria={celdasMateria}
      showToastMessage={(msg) => toast(msg)}
    >
      <div className="flex-1 h-full flex flex-col bg-white dark:bg-zinc-950 relative overflow-hidden select-none">
        <Toaster />

        {/* Área del Horario */}
        <div
          ref={scheduleRef}
          data-schedule-export
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {/* Bolitas de fondo sutiles */}
          <ColorBlobs dark={darkTheme} className="z-0 pointer-events-none" />

          {/* Cabecera de Días (Lunes - Domingo) */}
          <ScheduleHeader dias={DIAS} />

          {/* Cuadrícula interactiva de Horas x Días */}
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-custom relative z-10">
            <div
              ref={gridRef}
              className="grid h-full w-full relative min-h-full"
              style={{
                gridTemplateColumns: "72px repeat(7, minmax(120px, 1fr))",
                gridTemplateRows: `repeat(${HORAS.length}, 1fr)`,
                userSelect: "none",
              }}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onMouseDown={handleMouseDown}
            >
              {/* Celdas del grid */}
              {HORAS.map((hora, horaIdx) => (
                <React.Fragment key={hora}>
                  {/* Columna de hora vertical */}
                  <div
                    className="px-2 text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-900/40 border-r border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center select-none tabular-nums"
                    style={{
                      gridColumn: 1,
                      gridRow: horaIdx + 1,
                    }}
                  >
                    {formatHoraCompact(hora)}
                  </div>

                  {/* Celdas para cada día */}
                  {DIAS.map((dia, diaIdx) => {
                    const celdaKey = `${diaIdx}-${horaIdx}`;
                    const tieneClase = celdasOcupadas.has(celdaKey);

                    return (
                      <div
                        key={`${dia}-${hora}`}
                        data-cell={`${diaIdx}-${horaIdx}`}
                        data-day={diaIdx}
                        data-hour={horaIdx}
                        className="bg-transparent border-r border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/20"
                        style={{
                          gridColumn: diaIdx + 2,
                          gridRow: horaIdx + 1,
                          zIndex: 1,
                        }}
                        onDrop={(e) => handleDrop(e, diaIdx, horaIdx)}
                        onDragOver={(e) => e.preventDefault()}
                      />
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Preview de selección al arrastrar para crear bloque manual */}
              <div
                ref={previewRef}
                style={{
                  position: "absolute",
                  zIndex: 999,
                  pointerEvents: "none",
                  display: "none",
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.6)",
                  borderRadius: 6,
                  transition: "top 60ms linear, height 60ms linear",
                  boxSizing: "border-box",
                }}
                data-selection-preview
              />

              {/* Renderizar cada bloque de clase con animación individual contenida en su fila */}
              <AnimatePresence>
                {clasesParaRenderizar.map((clase) => {
                  const blockKey = clase.manualId
                    ? `manual-${clase.manualId}`
                    : `block-${clase.codigoMateria || clase.materia}-d${clase.diaIndex}-h${clase.horaInicio}-${clase.horaFin}-g${clase.grupo || "0"}-${clase.isPreview ? "prev" : "perm"}`;

                  return (
                    <div
                      data-manual-id={clase.manualId || undefined}
                      data-no-select
                      data-class-block="true"
                      key={blockKey}
                      className="relative rounded-md pointer-events-auto"
                      style={{
                        gridColumn: clase.diaIndex + 2,
                        gridRow: `${clase.horaIndex + 1} / span ${clase.duracion}`,
                        zIndex: clase.isPreview ? 6 : 10,
                        pointerEvents: isClearingSequence ? "none" : "auto",
                      }}
                    >
                      <ClassBlock
                        clase={clase}
                        onHover={handleClassHover}
                        onLeave={handleClassLeave}
                        onDelete={
                          clase.manualId
                            ? () =>
                                handleDeleteManualBlockWithAnimation(
                                  clase.manualId,
                                )
                            : () =>
                                handleDeleteSubjectWithAnimation(
                                  clase.codigoMateria,
                                )
                        }
                        onRename={
                          clase.manualId
                            ? (name) => renameManualBlock(clase.manualId, name)
                            : undefined
                        }
                        autoEdit={editingManualId === clase.manualId}
                        onEditComplete={() => setEditingManualId(null)}
                        isForceExploding={Boolean(
                          (clase.codigoMateria &&
                            explodingCodigo &&
                            String(explodingCodigo) ===
                              String(clase.codigoMateria)) ||
                          (clase.manualId &&
                            explodingManualId === clase.manualId),
                        )}
                      />
                    </div>
                  );
                })}
              </AnimatePresence>

              {/* Overlay de horarios disponibles durante drag */}
              {draggingMateria && (
                <ScheduleDropOverlay
                  availableHorarios={availableHorarios}
                  dias={DIAS}
                  horas={HORAS}
                  onBlockDrop={handleDrop}
                  celdasMateria={celdasMateria}
                />
              )}
            </div>
          </div>

          {/* Zona flotante para eliminar materia al arrastrar */}
          <AnimatePresence>
            {draggingMateria && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isHoveringTrash ? 1.06 : 1,
                }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border shadow-lg flex items-center gap-3 backdrop-blur-md cursor-pointer select-none transition-colors duration-150 ${
                  isHoveringTrash
                    ? "bg-red-500 text-white border-red-600 ring-4 ring-red-500/30"
                    : "bg-white/95 dark:bg-zinc-900/95 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 ring-1 ring-red-500/20"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (!isHoveringTrash) {
                    setIsHoveringTrash(true);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget)) return;
                  setIsHoveringTrash(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsHoveringTrash(false);
                  if (draggingMateria?.codigo) {
                    deleteMateriaFromSchedule?.(draggingMateria.codigo);
                    toast.success("Materia eliminada del horario");
                  }
                  clearDragState();
                }}
              >
                <TrashIcon
                  className="w-4 h-4 pointer-events-none"
                />
                <span className="text-sm pointer-events-none font-medium">
                  {isHoveringTrash
                    ? "¡Soltar para eliminar del horario!"
                    : "Arrastra aquí para eliminar del horario"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip global de información de clase */}
          {tooltipState && (
            <ClassTooltip
              clase={tooltipState.clase}
              color={tooltipState.clase.color}
              position={tooltipState.position}
            />
          )}
        </div>

        {/* Barra de Herramientas Inferior / Toolbar */}
        <ScheduleToolbar
          exporting={exporting}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          horariosGenerados={horariosGenerados}
          horarioActualIndex={horarioActualIndex}
          onSetHorarioActualIndex={setHorarioActualIndex}
          onClearSchedule={handleClearSchedule}
          hasContentToClear={hasContentToClear}
          darkTheme={darkTheme}
          onToggleDarkTheme={toggleDarkTheme}
          onToggleColorBlobs={handleToggleColorBlobs}
        />

        {/* Modal de selección de grupos */}
        <GrupoSelectorModal />
      </div>
    </ScheduleProvider>
  );
}
