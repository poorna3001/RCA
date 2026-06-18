import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import RootCauseExplorer from './components/RootCauseExplorer'; // Adjust path if your folder structure is different
import './styles/index.css';

// We extract the main layout into a sub-component so we can use Router hooks like useLocation
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if the current URL starts with /rca to keep the button highlighted during deep-linking
  const isRcaActive = location.pathname.startsWith('/rca');

  return (
    <>
      {/* Background Elements */}
      <div className="bg-c"></div>
      <div className="bg-g"></div>
      <div className="orb o1"></div>
      <div className="orb o2"></div>
      <div className="orb o3"></div>

      {/* Navigation */}
      <nav className="nav" style={{ justifyContent: 'space-between' }}>
        
        {/* 1. Top Left Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Left Logo" 
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* 2. Center Content (Root Cause Explorer Button) */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/rca')}
            style={{
              background: isRcaActive 
                ? 'linear-gradient(120deg, #3b9eff, #00d4aa)' 
                : 'transparent',
              border: '1px solid rgba(59, 158, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              color: isRcaActive ? 'white' : 'var(--blue)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all .2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isRcaActive ? '0 4px 16px rgba(59, 158, 255, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isRcaActive) e.target.style.borderColor = 'rgba(59, 158, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              if (!isRcaActive) e.target.style.borderColor = 'rgba(59, 158, 255, 0.3)';
            }}
          >
            🔍 Root Cause Explorer
          </button>
        </div>

        {/* 3. Top Right Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo2.png" 
            alt="Right Logo" 
            style={{ height: '40px', width: 'auto', objectFit: 'contain', background: 'var(--card)', padding: '4px', borderRadius: '6px', border: '1px solid var(--bdr)' }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

      </nav>

      {/* Main Content Area handled by React Router */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Default route redirects to /rca */}
          <Route path="/" element={<Navigate to="/rca" replace />} />
          
          {/* The /* is crucial! It tells the router that RootCauseExplorer 
            will handle all nested URLs like /rca/exception_name/parent 
          */}
          <Route path="/rca/*" element={<RootCauseExplorer />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;