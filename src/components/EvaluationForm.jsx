import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PlayCircle, StopCircle, Save, AlertTriangle, BookOpen, User, Maximize2, Minimize2 } from 'lucide-react';

export default function EvaluationForm() {
  const { students, texts, addEvaluation } = useData();
  const [studentId, setStudentId] = useState('');
  const [textId, setTextId] = useState('');
  const [errors, setErrors] = useState(0);
  const [compScore, setCompScore] = useState(100);

  // Timer logic
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const selectedText = texts.find(t => t.id === textId);

  const startTimer = (e) => {
    e.preventDefault();
    setIsTimerRunning(true);
  };

  const stopTimer = (e) => {
    e.preventDefault();
    setIsTimerRunning(false);
  };

  const resetTimer = (e) => {
    e.preventDefault();
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (studentId && textId && timerSeconds > 0) {
      addEvaluation(studentId, textId, timerSeconds, parseInt(errors), parseInt(compScore));
      
      // Reset form
      setErrors(0);
      setCompScore(100);
      setStudentId('');
      setTextId('');
      resetTimer(e);
      alert("¡Evaluación guardada exitosamente!");
    } else {
      alert("Asegúrate de seleccionar un alumno, un texto y que el tiempo sea mayor a 0 segundos.");
    }
  };

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (students.length === 0 || texts.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="text-2xl mb-2">Faltan Datos</h2>
        <p className="text-muted">Necesitas registrar al menos un alumno y un texto antes de poder realizar una evaluación.</p>
      </div>
    );
  }

  return (
    <div className={`evaluation-form ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {!isFullscreen && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ flex: 1 }}>
            <label className="form-label"><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Estudiante</label>
            <select className="form-control" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ fontSize: '1.1rem', padding: '0.5rem' }}>
              <option value="">-- Seleccionar --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <label className="form-label"><BookOpen size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Texto a Leer</label>
            <select className="form-control" value={textId} onChange={(e) => setTextId(e.target.value)} style={{ fontSize: '1.1rem', padding: '0.5rem' }}>
              <option value="">-- Seleccionar --</option>
              {texts.map(t => <option key={t.id} value={t.id}>{t.title} ({t.wordCount} pal.)</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr' : '2fr 1fr', gap: '2rem', height: isFullscreen ? '100vh' : 'auto' }}>
        
        {/* LADO IZQUIERDO: TEXTO PARA EL ALUMNO */}
        <div className="card" style={{ 
          background: 'var(--surface-solid)', 
          border: '2px solid var(--primary)', 
          display: 'flex', 
          flexDirection: 'column',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          zIndex: isFullscreen ? 9999 : 1,
          borderRadius: isFullscreen ? 0 : 'var(--radius)',
          margin: 0
        }}>
          <div className="flex-between mb-4" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)', margin: 0 }}>
              {selectedText ? selectedText.title : 'Selecciona un texto para comenzar'}
            </h3>
            <button className="btn btn-secondary" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>} 
              {isFullscreen ? 'Salir Pantalla Completa' : 'Modo Lectura'}
            </button>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: isFullscreen ? '2rem 10%' : '1rem',
          }}>
            <p style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: isFullscreen ? '2.5rem' : '1.5rem', 
              lineHeight: '1.8', 
              color: '#000',
              fontFamily: 'serif' // Mejor para lectura
            }}>
              {selectedText ? selectedText.content : 'El texto aparecerá aquí en un tamaño grande para que el estudiante pueda leer cómodamente.'}
            </p>
          </div>
        </div>

        {/* LADO DERECHO: CONTROLES DEL PROFESOR */}
        {!isFullscreen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cronómetro */}
            <div className="card glass-panel" style={{ textAlign: 'center' }}>
              <h3 className="mb-2 text-muted">Tiempo Transcurrido</h3>
              <div style={{ fontSize: '4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', lineHeight: 1 }}>
                {formatTimer(timerSeconds)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                {!isTimerRunning ? (
                  <button type="button" className="btn btn-primary" onClick={startTimer} style={{ flex: 1, padding: '1rem' }}><PlayCircle size={24}/> Iniciar</button>
                ) : (
                  <button type="button" className="btn" style={{ background: 'var(--danger)', color: 'white', flex: 1, padding: '1rem' }} onClick={stopTimer}><StopCircle size={24}/> Pausa</button>
                )}
                <button type="button" className="btn btn-secondary" onClick={resetTimer} style={{ padding: '1rem' }}>00:00</button>
              </div>
            </div>

            {/* Formulario de Evaluación */}
            <div className="card">
              <h3 className="mb-4">Resultados</h3>
              <form onSubmit={handleSubmit} id="eval-form">
                <div className="form-group">
                  <label className="form-label">Errores cometidos (omisiones, sustituciones, etc.)</label>
                  <input type="number" className="form-control" value={errors} onChange={(e) => setErrors(e.target.value)} min={0} style={{ fontSize: '1.2rem', padding: '0.75rem' }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Porcentaje de Comprensión (%)</label>
                  <input type="number" className="form-control" value={compScore} onChange={(e) => setCompScore(e.target.value)} min={0} max={100} style={{ fontSize: '1.2rem', padding: '0.75rem' }} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem', marginTop: '1rem' }}>
                  <Save size={24} /> Guardar Evaluación
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
