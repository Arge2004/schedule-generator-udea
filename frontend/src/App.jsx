import "./App.css";
import Sidebar from "./components/Sidebar";
import LoginSidebar from "./components/LoginSidebar";
import Schedule from "./components/Schedule";
import Background from "./components/Background";
import { useMateriasStore } from "./store/materiasStore";

function App() {
  const { materias } = useMateriasStore();
  const hasMaterias = materias && materias.length > 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
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
          {/* Sidebar de la aplicación a la izquierda (más estrecho) */}
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
