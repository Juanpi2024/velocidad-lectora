import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { 
  AlertTriangle, BookOpen, User, Maximize2, Minimize2, 
  Check, X, HelpCircle, Info, Plus, Minus, CheckCircle2, RotateCcw
} from 'lucide-react';

export default function EvaluationForm() {
  const { students, texts, addEvaluation } = useData();
  const [studentId, setStudentId] = useState('');
  const [textId, setTextId] = useState('');
  
  // Reading Flow States
  // 'idle' = selection & waiting
  // 'reading' = timer running secretly
  // 'stopped' = timer stopped, waiting for teacher to click last word
  const [readingState, setReadingState] = useState('idle');
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Interactive word selection
  const [hoveredWordIdx, setHoveredWordIdx] = useState(null);
  const [clickedWordIdx, setClickedWordIdx] = useState(null);
  
  // Modal Evaluation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState(0);
  const [compScore, setCompScore] = useState(100);

  // Background timer for visual feedback of time elapsed (only for teacher)
  const timerRef = useRef(null);

  // Reset evaluation flow if student or text changes
  useEffect(() => {
    resetFlow();
  }, [studentId, textId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectedText = texts.find(t => t.id === textId);
  const selectedStudent = students.find(s => s.id === studentId);

  // Split text into words safely
  const wordsArray = selectedText 
    ? selectedText.content.trim().split(/\s+/).filter(w => w.length > 0)
    : [];

  const handleStart = () => {
    if (!studentId || !textId) {
      alert("Por favor, selecciona un estudiante y un texto antes de iniciar.");
      return;
    }
    setReadingState('reading');
    setClickedWordIdx(null);
    setHoveredWordIdx(null);
    const start = Date.now();
    setStartTimestamp(start);
    setElapsedSeconds(0);

    // Subtle background ticker for the teacher
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  };

  const handleStop = () => {
    if (readingState !== 'reading') return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const end = Date.now();
    const duration = Math.max(1, Math.round((end - startTimestamp) / 1000));
    setElapsedSeconds(duration);
    setReadingState('stopped');
  };

  const handleReset = () => {
    resetFlow();
  };

  const resetFlow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setReadingState('idle');
    setStartTimestamp(null);
    setElapsedSeconds(0);
    setClickedWordIdx(null);
    setHoveredWordIdx(null);
    setIsModalOpen(false);
    setErrors(0);
    setCompScore(100);
  };

  const handleWordClick = (index) => {
    if (readingState !== 'stopped') return;
    setClickedWordIdx(index);
    setIsModalOpen(true);
  };

  const handleSaveEvaluation = () => {
    if (clickedWordIdx === null) return;
    
    const wordsReadCount = clickedWordIdx + 1;
    
    addEvaluation(
      studentId, 
      textId, 
      elapsedSeconds, 
      parseInt(errors), 
      parseInt(compScore), 
      wordsReadCount
    );

    setIsModalOpen(false);
    resetFlow();
    alert("¡Evaluación registrada y guardada con éxito!");
  };

  // PPM calculation helper for live preview in modal
  const getLivePpm = () => {
    if (clickedWordIdx === null || elapsedSeconds <= 0) return 0;
    const wordsRead = clickedWordIdx + 1;
    const minutes = elapsedSeconds / 60;
    const ppm = Math.round((wordsRead - errors) / minutes);
    return ppm > 0 ? ppm : 0;
  };

  // Helper to format time to mm:ss or seconds
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s} (${totalSeconds}s)`;
  };

  if (students.length === 0 || texts.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="text-2xl mb-2">Faltan Datos</h2>
        <p className="text-muted">Necesitas registrar al menos un estudiante y un texto antes de poder realizar una evaluación.</p>
      </div>
    );
  }

  return (
    <div className={`evaluation-form ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* 1. Instruction Banner */}
      {!isFullscreen && (
        <div className="instruction-banner">
          <Info size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>Flujo de Evaluación Distractor-Zero</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span className="instruction-step">1</span> Activa la <b>Luz Verde</b> para iniciar la lectura secreta. 
              <span className="instruction-step" style={{ marginLeft: '0.5rem' }}>2</span> Usa la <b>Luz Roja</b> para detener. 
              <span className="instruction-step" style={{ marginLeft: '0.5rem' }}>3</span> Toca la <b>última palabra leída</b> en el texto para abrir el modal de registro.
            </p>
          </div>
        </div>
      )}

      {/* 2. Selection Bar */}
      {!isFullscreen && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <User size={16} color="var(--primary)"/> Estudiante
            </label>
            <select 
              className="form-control" 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)} 
              style={{ fontSize: '1.1rem', padding: '0.5rem' }}
              disabled={readingState !== 'idle'}
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
            </select>
          </div>
          
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BookOpen size={16} color="var(--secondary)"/> Texto a Leer
            </label>
            <select 
              className="form-control" 
              value={textId} 
              onChange={(e) => setTextId(e.target.value)} 
              style={{ fontSize: '1.1rem', padding: '0.5rem' }}
              disabled={readingState !== 'idle'}
            >
              <option value="">-- Seleccionar Texto --</option>
              {texts.map(t => <option key={t.id} value={t.id}>{t.title} ({t.wordCount} palabras)</option>)}
            </select>
          </div>
        </div>
      )}

      {/* 3. Main Workspace: Text vs Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isFullscreen ? '1fr' : '2fr 1.2fr', 
        gap: '1.5rem', 
        height: isFullscreen ? '100vh' : 'auto' 
      }}>
        
        {/* LEFT COLUMN: INTERACTIVE TEXT PANEL */}
        <div className="card" style={{ 
          background: 'var(--surface-solid)', 
          border: readingState === 'stopped' ? '2px solid var(--success)' : '1px solid var(--border)', 
          display: 'flex', 
          flexDirection: 'column',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          zIndex: isFullscreen ? 9999 : 1,
          borderRadius: isFullscreen ? 0 : 'var(--radius)',
          padding: isFullscreen ? '2.5rem' : '1.5rem',
          margin: 0,
          transition: 'border-color 0.3s ease'
        }}>
          {/* Header of Text Panel */}
          <div className="flex-between mb-4" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                {selectedText ? selectedText.title : 'Elige un texto para comenzar'}
              </h3>
              {selectedText && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Nivel: {selectedText.level} | Total: {selectedText.wordCount} palabras
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Floating Fullscreen Traffic Lights */}
              {isFullscreen && selectedText && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: '#1e293b', 
                  padding: '0.35rem 0.8rem', 
                  borderRadius: '30px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  marginRight: '1rem'
                }}>
                  <div 
                    onClick={readingState === 'idle' ? handleStart : undefined}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: readingState === 'reading' ? '#34d399' : '#064e3b',
                      cursor: readingState === 'idle' ? 'pointer' : 'default',
                      boxShadow: readingState === 'reading' ? '0 0 10px #10b981' : 'none',
                      border: '2px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.2s'
                    }}
                    title="Verde - Iniciar"
                  />
                  <div 
                    onClick={readingState === 'reading' ? handleStop : undefined}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: readingState === 'stopped' ? '#f87171' : (readingState === 'reading' ? '#ef4444' : '#7f1d1d'),
                      cursor: readingState === 'reading' ? 'pointer' : 'default',
                      boxShadow: readingState === 'stopped' ? '0 0 10px #ef4444' : 'none',
                      border: '2px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.2s'
                    }}
                    title="Rojo - Detener"
                  />
                  {readingState === 'stopped' && (
                    <button 
                      onClick={handleReset} 
                      className="btn" 
                      style={{ 
                        padding: '0.2rem 0.5rem', 
                        fontSize: '0.75rem', 
                        background: '#475569', 
                        color: 'white', 
                        borderRadius: '15px' 
                      }}
                    >
                      Reiniciar
                    </button>
                  )}
                </div>
              )}

              <button 
                className="btn btn-secondary" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{ padding: '0.5rem 1rem' }}
              >
                {isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} 
                <span style={{ marginLeft: '0.25rem' }}>{isFullscreen ? 'Salir' : 'Modo Lectura'}</span>
              </button>
            </div>
          </div>
          
          {/* Scrollable Text Body */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: isFullscreen ? '1rem 8%' : '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {selectedText ? (
              <div className="interactive-text-container">
                {wordsArray.map((word, idx) => {
                  // Determine styling classes
                  let wordClass = "interactive-word";
                  
                  if (readingState === 'stopped') {
                    wordClass += " clickable";
                    
                    // Hover-range highlighting
                    if (hoveredWordIdx !== null && idx <= hoveredWordIdx) {
                      wordClass += " highlight-hover-range";
                    }
                    
                    // Permanent read highlighting once clicked
                    if (clickedWordIdx !== null && idx < clickedWordIdx) {
                      wordClass += " read-selected";
                    }
                    if (clickedWordIdx !== null && idx === clickedWordIdx) {
                      wordClass += " last-word-clicked";
                    }
                  }
                  
                  return (
                    <span 
                      key={idx}
                      className={wordClass}
                      onMouseEnter={() => readingState === 'stopped' && setHoveredWordIdx(idx)}
                      onMouseLeave={() => readingState === 'stopped' && setHoveredWordIdx(null)}
                      onClick={() => handleWordClick(idx)}
                      style={{ 
                        fontSize: isFullscreen ? '2.4rem' : '1.65rem', 
                        lineHeight: '1.8', 
                        color: '#0f172a',
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        marginRight: '0.25rem'
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', strokeWidth: 1.5 }} />
                <p style={{ fontSize: '1.2rem' }}>El texto se cargará aquí.</p>
                <p style={{ fontSize: '0.95rem' }}>Selecciona un estudiante y un texto arriba para comenzar la evaluación.</p>
              </div>
            )}
          </div>
          
          {/* Bottom helper bar for stopped state */}
          {readingState === 'stopped' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#065f46',
              fontWeight: 500
            }}>
              <CheckCircle2 size={18} />
              <span>Paso Final: Toca la última palabra leída por el estudiante para registrar resultados.</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TEACHER CONTROLS & TRAFFIC LIGHT */}
        {!isFullscreen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* The Traffic Light (Semáforo) Card */}
            <div className="traffic-light-card">
              <h3 style={{ fontSize: '1.25rem', margin: 0, textAlign: 'center' }}>Semáforo de Control</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                Reemplaza el cronómetro tradicional para evitar la ansiedad del estudiante.
              </p>
              
              <div className="traffic-light-box">
                {/* Green Light Button */}
                <div 
                  className={`light-bulb green ${readingState === 'reading' ? 'active' : ''}`}
                  onClick={readingState === 'idle' ? handleStart : undefined}
                  style={{ cursor: readingState === 'idle' ? 'pointer' : 'not-allowed' }}
                >
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>VERDE</span>
                </div>
                
                {/* Red Light Button */}
                <div 
                  className={`light-bulb red ${readingState === 'stopped' ? 'active' : ''}`}
                  onClick={readingState === 'reading' ? handleStop : undefined}
                  style={{ cursor: readingState === 'reading' ? 'pointer' : 'not-allowed' }}
                >
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>ROJO</span>
                </div>
              </div>

              {/* Status Message */}
              <div style={{ textAlign: 'center', width: '100%', marginTop: '0.5rem' }}>
                {readingState === 'idle' && (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Listo para comenzar. Presiona el botón Verde.
                  </div>
                )}
                {readingState === 'reading' && (
                  <div style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'fadeIn 1s infinite alternate' }}/>
                    Evaluación en progreso (Tiempo transcurriendo...)
                  </div>
                )}
                {readingState === 'stopped' && (
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    ⏱️ Lectura detenida en {elapsedSeconds} segundos.
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              {readingState !== 'idle' && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleReset} 
                  style={{ width: '100%', marginTop: '0.5rem', gap: '0.5rem' }}
                >
                  <RotateCcw size={16} /> Reiniciar Evaluación
                </button>
              )}
            </div>

            {/* Helper Card when selected */}
            {selectedStudent && selectedText && (
              <div className="card glass-panel" style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', margin: 0 }}>Datos de la Ficha</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
                  <span className="text-muted">Estudiante:</span>
                  <span style={{ fontWeight: 500 }}>{selectedStudent.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
                  <span className="text-muted">Texto:</span>
                  <span style={{ fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedText.title}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Estado del Flujo:</span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: readingState === 'reading' ? 'var(--success)' : (readingState === 'stopped' ? 'var(--primary)' : 'var(--text-muted)') 
                  }}>
                    {readingState === 'idle' && 'Esperando Inicio'}
                    {readingState === 'reading' && 'Leyendo'}
                    {readingState === 'stopped' && 'Seleccionar Última Palabra'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL: REGISTRAR ERRORES Y RESULTADOS */}
      {isModalOpen && clickedWordIdx !== null && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 color="var(--primary)" size={22} />
                Registrar Resultados
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setClickedWordIdx(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Summary Stats Grid */}
              <div style={{ 
                background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', 
                padding: '1rem', 
                borderRadius: '10px', 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '0.75rem',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Estudiante</span>
                  <strong style={{ fontSize: '0.95rem' }}>{selectedStudent?.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Tiempo de lectura</span>
                  <strong style={{ fontSize: '0.95rem' }}>{formatTime(elapsedSeconds)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Palabras leídas</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--success)' }}>
                    {clickedWordIdx + 1} de {selectedText?.wordCount}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Última palabra</span>
                  <strong style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>
                    "{wordsArray[clickedWordIdx]}"
                  </strong>
                </div>
              </div>

              {/* Calculated Live PPM Display */}
              <div style={{ 
                textAlign: 'center', 
                background: 'rgba(79, 70, 229, 0.05)', 
                border: '2px dashed var(--primary)', 
                borderRadius: '12px', 
                padding: '1rem' 
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
                  Velocidad Lectora Estimada:
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1, margin: '0.25rem 0' }}>
                  {getLivePpm()} <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>PPM</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Palabras por Minuto (PPM) = (Palabras Leídas - Errores) / Tiempo
                </span>
              </div>

              {/* Errors Input with Easy Clicker Controls */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Errores cometidos:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(omisiones, sustituciones, etc.)</span>
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setErrors(prev => Math.max(0, prev - 1))}
                    style={{ padding: '0.75rem 1rem', borderRadius: '8px' }}
                  >
                    <Minus size={16} />
                  </button>
                  
                  <input 
                    type="number" 
                    className="form-control" 
                    value={errors} 
                    onChange={(e) => setErrors(Math.max(0, parseInt(e.target.value) || 0))} 
                    min={0} 
                    style={{ fontSize: '1.3rem', textAlign: 'center', padding: '0.6rem' }} 
                    required 
                  />
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setErrors(prev => prev + 1)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '8px' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Comprehension Input with Quick Selector Chips */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Comprensión Lectora:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Porcentaje del 0 al 100%</span>
                </label>
                
                <input 
                  type="number" 
                  className="form-control" 
                  value={compScore} 
                  onChange={(e) => setCompScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} 
                  min={0} 
                  max={100} 
                  style={{ fontSize: '1.1rem', marginBottom: '0.75rem', padding: '0.6rem' }} 
                  required 
                />

                {/* Quick Selection Chips */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[0, 25, 50, 75, 100].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setCompScore(score)}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        background: compScore === score ? 'var(--primary)' : 'white',
                        color: compScore === score ? 'white' : 'var(--text-main)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {score}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setIsModalOpen(false); setClickedWordIdx(null); }}
              >
                Cancelar
              </button>
              
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveEvaluation}
                style={{ gap: '0.5rem' }}
              >
                <Check size={18} /> Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
