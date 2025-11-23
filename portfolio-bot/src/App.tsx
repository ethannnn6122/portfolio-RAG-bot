
import PortfolioChat from './PortfolioChat'
import './App.css'

function App() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#222', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', textAlign: 'center' }}>Welcome to Portfolio Bot</h1>
      {/* COMPONENT */}
      <PortfolioChat />
    </div>
  )
}

export default App
