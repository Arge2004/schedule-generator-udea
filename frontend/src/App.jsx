import { useLayoutEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import LoginSidebar from "./components/LoginSidebar";
import Schedule from "./components/Schedule";
import Background from "./components/Background";
import { useMateriasStore } from "./store/materiasStore";

function App() {
  const { materias, darkTheme } = useMateriasStore();
  const hasMaterias = materias && materias.length > 0;

  // Aplicar/remover clase dark del documento síncronamente antes del paint
  useLayoutEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkTheme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      {!hasMaterias ? (
        <>
          {/* Fondo / Dither a la izquierda en el login */}
          <div className="hidden sm:block sm:flex-1 h-dvh overflow-hidden">
            <Background />
          </div>

          {/* Sidebar del login a la derecha (más ancho) */}
          <LoginSidebar />
        </>
      ) : (
        <>
          {/* Sidebar de la aplicación a la izquierda */}
          <Sidebar />

          {/* Horario a la derecha */}
          <div className="hidden sm:block sm:flex-1 h-dvh overflow-auto">
            <Schedule />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
