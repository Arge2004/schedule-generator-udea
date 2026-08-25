import React, { useState, useEffect, useMemo, useCallback } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  getFacultades,
  getProgramas,
  getHorarios,
} from "../../services/horarios.js";
import { useMateriasStore } from "../../store/materiasStore.js";

export default function ProgramSelector({ onMenuOpenChange }) {
  const [facultades, setFacultades] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [selectedFacultad, setSelectedFacultad] = useState("");
  const [selectedPrograma, setSelectedPrograma] = useState("");
  const [isLoadingFacultades, setIsLoadingFacultades] = useState(false);
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const {
    setMateriasData,
    resetMateriasSeleccionadas,
    clearHorariosGenerados,
    darkTheme,
  } = useMateriasStore();

  // Cargar facultades al montar el componente
  useEffect(() => {
    const loadFacultades = async () => {
      try {
        setIsLoadingFacultades(true);
        const data = await getFacultades();
        setFacultades(data);
      } catch (error) {
        toast.error("Error al cargar facultades");
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
        setSelectedPrograma("");
        return;
      }

      try {
        setIsLoadingProgramas(true);
        const data = await getProgramas(selectedFacultad);
        setProgramas(data);
        setSelectedPrograma("");
      } catch (error) {
        toast.error("Error al cargar programas");
        setProgramas([]);
      } finally {
        setIsLoadingProgramas(false);
      }
    };
    loadProgramas();
  }, [selectedFacultad]);

  const lightSelectStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        minHeight: "40px",
        borderRadius: "0.5rem",
        background: "#ffffff",
        borderColor: "#e6e6e9",
        boxShadow: "none",
        color: "#111827",
      }),
      placeholder: (base) => ({ ...base, color: "#6b7280" }),
      option: (base, state) => ({
        ...base,
        color: "#111827",
        backgroundColor: state.isFocused ? "#f8fafc" : "#ffffff",
      }),
      singleValue: (base) => ({ ...base, color: "#111827" }),
      menu: (base) => ({ ...base, background: "#ffffff" }),
      menuList: (base) => ({ ...base, maxHeight: "240px" }),
    }),
    [],
  );

  const lightSelectTheme = useMemo(
    () => (t) => ({
      ...t,
      colors: {
        ...t.colors,
        primary25: "rgba(19,146,236,0.06)",
        primary: "#1392ec",
        neutral80: "#111827",
      },
    }),
    [],
  );

  const lightWatermarkStyles = useMemo(
    () => ({
      fontSize: "clamp(5rem, 7vw, 15rem)",
      fontWeight: 900,
      lineHeight: 1,
      backgroundImage: `
      linear-gradient(
        to top,
        #c4c4c4 0%,
        #c4c4c4 35%,
        color-mix(in srgb, #c4c4c4 65%, transparent) 45%,
        color-mix(in srgb, #c4c4c4 15%, transparent) 65%,
        transparent 70%
      )
    `,
      opacity: 0.3,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      position: "absolute",
      bottom: "-2.5%",
      left: "0",
      right: "0",
      zIndex: 0,
      pointerEvents: "none",
    }),
    [],
  );

  const memoFacultades = useMemo(() => facultades || [], [facultades]);
  const memoProgramas = useMemo(() => programas || [], [programas]);

  const handleFacultadChange = useCallback((option) => {
    const value = option ? option.value : "";
    setSelectedFacultad(value);
    localStorage.setItem("selectedFacultad", value);
  }, []);

  const handleProgramaChange = useCallback((option) => {
    const value = option ? option.value : "";
    setSelectedPrograma(value);
    localStorage.setItem("selectedPrograma", value);
  }, []);

  const handleScrapeHorarios = async () => {
    const facultadLS = localStorage.getItem("selectedFacultad");
    const programaLS = localStorage.getItem("selectedPrograma");
    const facultadToUse = facultadLS || selectedFacultad;
    const programaToUse = programaLS || selectedPrograma;

    if (!facultadToUse || !programaToUse) {
      toast.error("Por favor selecciona una facultad y un programa", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setSelectedFacultad(facultadToUse);
    setSelectedPrograma(programaToUse);

    try {
      setIsScraping(true);

      const facultadObj = facultades.find((f) => f.value === facultadToUse);
      const programaObj = programas.find((p) => p.value === programaToUse);

      const data = await getHorarios(
        facultadToUse,
        programaToUse,
        facultadObj?.label || "",
        programaObj?.label || "",
      );

      if (!data.materias || data.materias.length === 0) {
        toast("No hay horarios disponibles para la selección actual", {
          icon: "ℹ️",
          duration: 4000,
          position: "top-center",
          style: {
            background: "#3b82f6",
            color: "#fff",
          },
        });
        return;
      }

      setMateriasData(data);
      resetMateriasSeleccionadas();
      clearHorariosGenerados();

      const successStyle = darkTheme
        ? { background: "#065f46", color: "#fff" }
        : { background: "#16a34a", color: "#fff" };
      toast.success(
        `Se actualizaron ${data.materias.length} materias y se reiniciaron las selecciones`,
        { duration: 5000, position: "bottom-center", style: successStyle },
      );
    } catch (error) {
      toast.error(`Error al obtener horarios: ${error.message}`, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-14 overflow-hidden relative select-none">
      <div className="w-full h-full max-w-md flex flex-col relative justify-center overflow-hidden">
        {/* Formulario de selección */}
        <div className="relative z-10 space-y-4">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-center">
            Obtener Horarios UdeA
          </h3>

          {/* Selector de Facultad */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Facultad
            </label>
            <Select
              options={memoFacultades}
              value={
                memoFacultades.find((f) => f.value === selectedFacultad) || null
              }
              onChange={handleFacultadChange}
              isDisabled={isScraping || isLoadingFacultades}
              placeholder={
                isLoadingFacultades
                  ? "Cargando facultades..."
                  : "Selecciona una facultad..."
              }
              className="w-full text-start text-sm border-1 border-zinc-300 rounded-lg"
              classNamePrefix="rs"
              styles={lightSelectStyles}
              theme={lightSelectTheme}
              onMenuOpen={() => onMenuOpenChange?.(true)}
              onMenuClose={() => onMenuOpenChange?.(false)}
              menuShouldScrollIntoView={false}
              isClearable
            />
          </div>

          {/* Selector de Programa */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Programa
            </label>
            <Select
              options={memoProgramas}
              value={
                memoProgramas.find((p) => p.value === selectedPrograma) || null
              }
              onChange={handleProgramaChange}
              isDisabled={!selectedFacultad || isScraping || isLoadingProgramas}
              placeholder={
                !selectedFacultad
                  ? "Primero selecciona una facultad..."
                  : isLoadingProgramas
                    ? "Cargando programas..."
                    : "Selecciona un programa..."
              }
              className="w-full text-start text-sm border-1 border-zinc-300 rounded-lg"
              classNamePrefix="rs"
              styles={lightSelectStyles}
              theme={lightSelectTheme}
              onMenuOpen={() => onMenuOpenChange?.(true)}
              onMenuClose={() => onMenuOpenChange?.(false)}
              menuShouldScrollIntoView={false}
              isClearable
            />
          </div>

          {/* Botón de obtención */}
          <button
            onClick={handleScrapeHorarios}
            disabled={!selectedFacultad || !selectedPrograma || isScraping}
            className="w-full px-4 text-sm py-3 mt-10 bg-primary cursor-pointer hover:bg-primary/90 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isScraping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Obteniendo horarios...</span>
              </>
            ) : (
              <span>Obtener Horarios</span>
            )}
          </button>
        </div>

        {/* Marca de agua UdeA */}
        <span style={lightWatermarkStyles}>UdeA</span>
      </div>
    </div>
  );
}
