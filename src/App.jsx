import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import Dashboard from './components/Dashboard';
import StudentsManager from './components/StudentsManager';
import TextsManager from './components/TextsManager';
import EvaluationForm from './components/EvaluationForm';
import { LayoutDashboard, Users, BookOpen, Clock, Settings } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <StudentsManager />;
      case 'texts': return <TextsManager />;
      case 'evaluation': return <EvaluationForm />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar glass-panel" style={{ borderLeft: 'none', borderTop: 'none', borderBottom: 'none', borderRadius: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
            <BookOpen size={24} />
            Velocidad Lectora
          </h2>
        </div>
        
        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
            <LayoutDashboard size={20} /> Panel Principal
          </button>
          <button className={`nav-item ${activeTab === 'evaluation' ? 'active' : ''}`} onClick={() => setActiveTab('evaluation')} style={{ background: activeTab === 'evaluation' ? 'var(--primary)' : 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
            <Clock size={20} /> Evaluar Lectura
          </button>
          <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')} style={{ background: activeTab === 'students' ? 'var(--primary)' : 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
            <Users size={20} /> Alumnos
          </button>
          <button className={`nav-item ${activeTab === 'texts' ? 'active' : ''}`} onClick={() => setActiveTab('texts')} style={{ background: activeTab === 'texts' ? 'var(--primary)' : 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
            <BookOpen size={20} /> Textos y Niveles
          </button>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p>App v1.0.0</p>
          <p>Datos almacenados localmente.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
