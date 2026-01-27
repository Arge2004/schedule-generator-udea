import './App.css'
import Sidebar from './components/sidebar'
import Schedule from './components/schedule'
import ParallaxBackground from './components/ParallaxBackground'
import { useMateriasStore } from './store/materiasStore'

function App() {
  const { materias } = useMateriasStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      {/* Main content (hidden on small screens so mobile only shows the sidebar) */}
      <div className="hidden sm:block sm:flex-1 h-screen overflow-auto">
        {!materias || materias.length === 0 ? (
          <ParallaxBackground />
        ) : (
          <Schedule />
        )}
      </div>
    </div>
  )
}

export default App
