import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PlayCircle, StopCircle, Save, Clock, AlertTriangle, BookOpen } from 'lucide-react';

export default function EvaluationForm() {
  const { students, texts, addEvaluation } = useData();
  const [studentId, setStudentId] = useState('');
  const [textId, setTextId] = useState('');
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [errors, setErrors] = useState(0);
  const [compScore, setCompScore] = useState(100);

  // Timer logic
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const selectedText = texts.find(t => t.id === textId);

  const startTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      const id = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      setIntervalId(id);
    }
  };

  const stopTimer = () => {
    if (isTimerRunning) {
      clearInterval(intervalId);
      setIsTimerRunning(false);
      setMinutes(Math.floor(timerSeconds / 60));
      setSeconds(timerSeconds % 60);
    }
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalTimeSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    if (studentId && textId && totalTimeSeconds > 0) {
      addEvaluation(studentId, textId, totalTimeSeconds, parseInt(errors), parseInt(compScore));
      
      // Reset form
      setMinutes(0);
      setSeconds(0);
      setErrors(0);
      setCompScore(100);
      setStudentId('');
      setTextId('');
      resetTimer();
      alert("¡Evaluación guardada exitosamente!");
    } else {
      alert("Asegúrate de seleccionar un alumno, un texto y registrar el tiempo correctamente (mayor a 0).");
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
    <div className="evaluation-form">
      <h1 className="text-3xl mb-6">Registrar Evaluación</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 className="text-2xl mb-4">Datos de la Lectura</h2>
          <form onSubmit={handleSubmit} id="eval-form">
            <div className="form-group">
              <label className="form-label">Seleccionar Alumno</label>
              <select className="form-control" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">-- Elige un alumno --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Seleccionar Texto</label>
              <select className="form-control" value={textId} onChange={(e) => setTextId(e.target.value)} required>
                <option value="">-- Elige un texto --</option>
                {texts.map(t => <option key={t.id} value={t.id}>{t.title} - Nivel: {t.level} ({t.wordCount} palabras)</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Errores Cometidos</label>
                <input type="number" className="form-control" value={errors} onChange={(e) => setErrors(e.target.value)} min={0} required />
              </div>
              <div className="form-group">
                <label className="form-label">Comprensión (%)</label>
                <input type="number" className="form-control" value={compScore} onChange={(e) => setCompScore(e.target.value)} min={0} max={100} required />
              </div>
            </div>

            <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)' }} />

            <h3 className="mb-4">Tiempo de Lectura</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">Minutos</label>
                <input type="number" className="form-control" value={minutes} onChange={(e) => setMinutes(e.target.value)} min={0} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">Segundos</label>
                <input type="number" className="form-control" value={seconds} onChange={(e) => setSeconds(e.target.value)} min={0} max={59} required />
              </div>
            </div>

            <button type="submit" form="eval-form" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              <Save size={20} /> Guardar Resultado
            </button>
          </form>
        </div>

        <div>
          <div className="card glass-panel" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 className="mb-4 text-muted"><Clock size={20} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Cronómetro de Apoyo</h3>
            <div className="text-3xl" style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginBottom: '1.5rem' }}>
              {formatTimer(timerSeconds)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {!isTimerRunning ? (
                <button type="button" className="btn btn-primary" onClick={startTimer}><PlayCircle size={20}/> Iniciar</button>
              ) : (
                <button type="button" className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={stopTimer}><StopCircle size={20}/> Detener</button>
              )}
              <button type="button" className="btn btn-secondary" onClick={resetTimer}>Reiniciar</button>
            </div>
            <p className="text-muted mt-4" style={{ fontSize: '0.85rem' }}>*Detener el cronómetro copiará automáticamente el tiempo al formulario.</p>
          </div>

          {selectedText && (
            <div className="card" style={{ background: 'rgba(255, 255, 255, 0.4)', borderColor: 'var(--border)' }}>
              <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="var(--primary)" /> 
                Lectura Actual
              </h3>
              <p style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                {selectedText.content}
              </p>
              <div className="flex-between mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
                <span>Palabras: <strong>{selectedText.wordCount}</strong></span>
                <span>Nivel: <strong>{selectedText.level}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
