import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { BookPlus, Trash2 } from 'lucide-react';

export default function TextsManager() {
  const { texts, addText, deleteText } = useData();
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [content, setContent] = useState('');

  const countWords = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setWordCount(countWords(newContent));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && level.trim() && wordCount > 0) {
      addText(title, level, wordCount, content);
      setTitle('');
      setLevel('');
      setWordCount('');
      setContent('');
    }
  };

  return (
    <div className="texts-manager">
      <h1 className="text-3xl mb-6">Gestión de Textos</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 className="text-2xl mb-4">Añadir Texto</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Título del Texto</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. El León y el Ratón" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nivel de Lectura</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Nivel 1, Básico, 5to Año" 
                value={level} 
                onChange={(e) => setLevel(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contenido del Texto</label>
              <textarea 
                className="form-control" 
                placeholder="Pega el texto aquí..." 
                rows={6}
                value={content} 
                onChange={handleContentChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad de Palabras</label>
              <input 
                type="number" 
                className="form-control" 
                value={wordCount} 
                onChange={(e) => setWordCount(e.target.value)} 
                required 
                min={1}
              />
              <small className="text-muted">Calculado automáticamente, pero puedes editarlo.</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <BookPlus size={18} /> Guardar Texto
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-2xl mb-4">Lista de Textos ({texts.length})</h2>
          {texts.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Nivel</th>
                    <th>Palabras</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {texts.map(text => (
                    <tr key={text.id}>
                      <td style={{ fontWeight: 500 }}>{text.title}</td>
                      <td><span style={{ background: 'var(--background)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem' }}>{text.level}</span></td>
                      <td>{text.wordCount}</td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el texto "${text.title}"? Se borrarán también las evaluaciones asociadas.`)) {
                              deleteText(text.id);
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
              No hay textos registrados todavía. Añade uno para comenzar a evaluar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
