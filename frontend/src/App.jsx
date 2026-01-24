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
      {!materias || materias.length === 0 ? (
        <ParallaxBackground />
      ) : (
        <Schedule />
      )}
    </div>
  )
}

export default App
