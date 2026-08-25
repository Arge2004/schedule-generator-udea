import "./App.css";
import Sidebar from "./components/Sidebar";
import Schedule from "./components/Schedule";
import ParallaxBackground from "./components/Background";
import { useMateriasStore } from "./store/materiasStore";

function App() {
  const { materias } = useMateriasStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Main content (hidden on small screens so mobile only shows the sidebar) */}
      <div className="hidden sm:block sm:flex-1 h-dvh overflow-auto">
        {!materias || materias.length === 0 ? (
          <ParallaxBackground />
        ) : (
          <Schedule />
        )}
      </div>

      <Sidebar />
    </div>
  );
}

export default App;
