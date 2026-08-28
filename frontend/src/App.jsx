import { useLayoutEffect } from "react";
import { Toaster } from "react-hot-toast";
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
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{
          top: 24,
          zIndex: 99999999,
        }}
        toastOptions={{
          duration: 3200,
          style: {
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "10px",
            padding: "8px 14px",
            color: "#ffffff",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          },
          success: {
            style: {
              background: "#059669",
              color: "#ffffff",
              border: "1px solid #10b981",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#059669",
            },
          },
          error: {
            style: {
              background: "#e11d48",
              color: "#ffffff",
              border: "1px solid #f43f5e",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#e11d48",
            },
          },
        }}
      />
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
