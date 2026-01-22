import './App.css'
import Sidebar from './components/sidebar'
import Schedule from './components/schedule'

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <Schedule />
    </div>
  )
}

export default App
