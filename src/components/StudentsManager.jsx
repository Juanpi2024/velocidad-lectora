import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, Trash2, Upload, Clipboard, FileText, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';

export default function StudentsManager() {
  const { students, addStudent, deleteStudent } = useData();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'

  // Single Student Mode states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');

  // Bulk Student Mode states
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkMode, setBulkMode] = useState('paste'); // 'paste', 'word', 'csv'
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [importedNames, setImportedNames] = useState([]);

  // Intelligent Student Name Parser
  const parseStudentNames = (text) => {
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map(line => {
        if (!line.trim()) return '';
        
        // Handle copy-paste from Excel/CSV (tab or comma/semicolon separators)
        let parts = line.split(/\t+|[,;]+/);
        let namePart = parts[0];
        
        if (parts.length > 1) {
          // Find the column that contains alphabetical names (not just IDs, numbers, or percentages)
          // We look for a string that is at least 3 characters long, has letters, and isn't purely numeric
          const candidate = parts.find(p => {
            const trimmed = p.trim();
            return trimmed.length > 2 && 
                   /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed) && 
                   !/^\d+$/.test(trimmed) && 
                   !trimmed.includes('%');
          });
          if (candidate) namePart = candidate;
        }
        
        let clean = namePart.trim();
        
        // Remove numbering prefixes at the start: "1.", "2.-", "3)", "04 -", "5. ", "6 "
        clean = clean.replace(/^\s*\d+\s*[\.\-\)\s]+\s*/, '');
        
        // Remove general bullet marks and leading spaces
        clean = clean.replace(/^[\s•\-\*]+/, '');
        
        return clean.trim();
      })
      .filter(name => {
        const lower = name.toLowerCase();
        return name.length > 2 && 
               !lower.includes('nombre') && 
               !lower.includes('apellido') && 
               !lower.includes('student') && 
               !lower.includes('alumnos') && 
               !lower.includes('nomina') && 
               !lower.includes('nómina');
      });
  };

  // Run parser reactively when text changes in "paste" mode
  useEffect(() => {
    if (activeTab === 'bulk' && bulkMode === 'paste') {
      const parsed = parseStudentNames(pastedText);
      setImportedNames(parsed);
    }
  }, [pastedText, bulkMode, activeTab]);

  // Handle manual/single submit
  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && grade.trim()) {
      addStudent(name.trim(), grade);
      setName('');
      setGrade('');
      alert("¡Alumno guardado con éxito!");
    }
  };

  // Handle Word .docx file upload
  const handleWordUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const names = parseStudentNames(result.value);
        setImportedNames(names);
      } catch (err) {
        console.error(err);
        alert("Error al leer el archivo de Word. Asegúrate de subir un archivo .docx válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle CSV or text file upload
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const names = parseStudentNames(text);
      setImportedNames(names);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle bulk submission
  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (!bulkGrade) {
      alert("Por favor, selecciona el curso al que deseas asociar los alumnos.");
      return;
    }
    if (importedNames.length === 0) {
      alert("No se han detectado nombres válidos para importar. Revisa la lista o archivo subido.");
      return;
    }

    importedNames.forEach(studentName => {
      addStudent(studentName, bulkGrade);
    });

    alert(`¡Éxito! Se han importado ${importedNames.length} alumnos al curso ${bulkGrade} Básico.`);
    
    // Reset state
    setPastedText('');
    setFileName('');
    setImportedNames([]);
  };

  return (
    <div className="students-manager">
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
        Gestión de Alumnos
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ADD STUDENT WIZARD (WITH PREMIUM TABS) */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--surface-solid)' }}>
          
          {/* Tab Navigation Buttons */}
          <div style={{ 
            display: 'flex', 
            borderRadius: '10px', 
            background: '#f1f5f9', 
            padding: '0.25rem', 
            marginBottom: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <button 
              type="button" 
              onClick={() => setActiveTab('single')}
              style={{ 
                flex: 1, 
                padding: '0.6rem 0.5rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '0.9rem',
                fontWeight: activeTab === 'single' ? 600 : 500,
                background: activeTab === 'single' ? 'white' : 'transparent',
                color: activeTab === 'single' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'single' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              Registro Individual
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('bulk')}
              style={{ 
                flex: 1, 
                padding: '0.6rem 0.5rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '0.9rem',
                fontWeight: activeTab === 'bulk' ? 600 : 500,
                background: activeTab === 'bulk' ? 'white' : 'transparent',
                color: activeTab === 'bulk' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'bulk' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              🚀 Importación Masiva
            </button>
          </div>

          {/* TAB 1: INDIVIDUAL REGISTRY */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                Añadir Alumno Individual
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 500 }}>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Juan Pérez González" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  style={{ fontSize: '1rem', padding: '0.7rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 500 }}>Curso / Grado</label>
                <select 
                  className="form-control" 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)} 
                  style={{ fontSize: '1rem', padding: '0.7rem', cursor: 'pointer' }}
                  required
                >
                  <option value="">-- Seleccionar Curso --</option>
                  <option value="1º">1º Básico</option>
                  <option value="2º">2º Básico</option>
                  <option value="3º">3º Básico</option>
                  <option value="4º">4º Básico</option>
                  <option value="5º">5º Básico</option>
                  <option value="6º">6º Básico</option>
                  <option value="7º">7º Básico</option>
                  <option value="8º">8º Básico</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> Guardar Alumno
              </button>
            </form>
          )}

          {/* TAB 2: BULK IMPORTATION */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSubmit}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                Asistente de Importación Masiva
              </h3>

              {/* 1. Grade Select */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  1. Curso de Destino
                </label>
                <select 
                  className="form-control" 
                  value={bulkGrade} 
                  onChange={(e) => setBulkGrade(e.target.value)} 
                  style={{ fontSize: '1rem', padding: '0.7rem', border: '1.5px solid var(--primary)', cursor: 'pointer' }}
                  required
                >
                  <option value="">-- Selecciona el Curso para vincular --</option>
                  <option value="1º">1º Básico</option>
                  <option value="2º">2º Básico</option>
                  <option value="3º">3º Básico</option>
                  <option value="4º">4º Básico</option>
                  <option value="5º">5º Básico</option>
                  <option value="6º">6º Básico</option>
                  <option value="7º">7º Básico</option>
                  <option value="8º">8º Básico</option>
                </select>
              </div>

              {/* 2. Channel Selector buttons */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  2. Método de Importación
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    onClick={() => { setBulkMode('paste'); setImportedNames([]); setFileName(''); }}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '8px',
                      border: '1.5px solid ' + (bulkMode === 'paste' ? 'var(--primary)' : 'var(--border)'),
                      fontSize: '0.85rem',
                      fontWeight: bulkMode === 'paste' ? 600 : 500,
                      background: bulkMode === 'paste' ? 'rgba(59, 130, 246, 0.08)' : 'white',
                      color: bulkMode === 'paste' ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Clipboard size={14} /> Pegar Lista
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => { setBulkMode('word'); setImportedNames([]); setFileName(''); }}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '8px',
                      border: '1.5px solid ' + (bulkMode === 'word' ? '#10b981' : 'var(--border)'),
                      fontSize: '0.85rem',
                      fontWeight: bulkMode === 'word' ? 600 : 500,
                      background: bulkMode === 'word' ? 'rgba(16, 185, 129, 0.08)' : 'white',
                      color: bulkMode === 'word' ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <FileText size={14} /> Word (.docx)
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => { setBulkMode('csv'); setImportedNames([]); setFileName(''); }}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '8px',
                      border: '1.5px solid ' + (bulkMode === 'csv' ? '#fb923c' : 'var(--border)'),
                      fontSize: '0.85rem',
                      fontWeight: bulkMode === 'csv' ? 600 : 500,
                      background: bulkMode === 'csv' ? 'rgba(251, 146, 60, 0.08)' : 'white',
                      color: bulkMode === 'csv' ? '#fb923c' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Upload size={14} /> Excel / CSV
                  </button>
                </div>
              </div>

              {/* 3. Input Areas based on Bulk Mode */}
              
              {/* Method A: Paste list */}
              {bulkMode === 'paste' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>3. Pega los nombres aquí</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Ej.&#10;1. Juan Pérez González&#10;2. María Soto Domínguez&#10;3. Carlos Rojas Alarcón&#10;(Puedes copiar columnas completas directamente desde Excel)"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{ fontSize: '0.9rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.4' }}
                  />
                </div>
              )}

              {/* Method B: Word document */}
              {bulkMode === 'word' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>3. Carga el archivo Word (.docx)</label>
                  <div style={{
                    border: '2px dashed #10b981',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#fcfdfd',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="file" 
                      accept=".docx"
                      onChange={handleWordUpload}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <FileText size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                    <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>
                      {fileName ? fileName : 'Seleccionar o arrastrar archivo .docx'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Extrae e importa todos los nombres de tu documento
                    </span>
                  </div>
                </div>
              )}

              {/* Method C: CSV document */}
              {bulkMode === 'csv' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>3. Carga el archivo Excel CSV (.csv o .txt)</label>
                  <div style={{
                    border: '2px dashed #fb923c',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#fcfdfd',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="file" 
                      accept=".csv,.txt"
                      onChange={handleCsvUpload}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <Upload size={32} color="#fb923c" style={{ margin: '0 auto 0.5rem' }} />
                    <span style={{ display: 'block', fontSize: '0.9rem', color: '#854d0e', fontWeight: 500 }}>
                      {fileName ? fileName : 'Seleccionar o arrastrar archivo .csv o .txt'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Soporta nóminas de Excel exportadas a formato CSV
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Active Preview card */}
              {importedNames.length > 0 && (
                <div style={{ 
                  marginTop: '1.25rem', 
                  marginBottom: '1.5rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '1rem',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Previsualización Nómina
                    </strong>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> {importedNames.length} Alumnos
                    </span>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '140px', 
                    overflowY: 'auto', 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    paddingRight: '4px'
                  }}>
                    {importedNames.map((importedName, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        fontSize: '0.85rem',
                        background: 'white',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        color: 'var(--text-main)',
                        fontWeight: 500
                      }}>
                        <span style={{ color: 'var(--text-muted)', width: '20px', textAlign: 'right' }}>{idx + 1}.</span>
                        <span>{importedName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Trigger import Button */}
              <button 
                type="submit" 
                className="btn" 
                disabled={importedNames.length === 0 || !bulkGrade}
                style={{ 
                  width: '100%', 
                  padding: '0.8rem', 
                  fontSize: '1rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: importedNames.length > 0 && bulkGrade ? 'var(--success)' : '#cbd5e1',
                  color: 'white',
                  cursor: importedNames.length > 0 && bulkGrade ? 'pointer' : 'not-allowed',
                  border: 'none',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
              >
                <CheckCircle2 size={18} /> Importar {importedNames.length > 0 ? importedNames.length : ''} Alumnos {bulkGrade ? `a ${bulkGrade}` : ''}
              </button>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN: REGISTERED STUDENTS NOMINA (Spreadsheet style) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Nómina de Alumnos ({students.length})</span>
            <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '20px', background: 'var(--background)', color: 'var(--text-muted)', fontWeight: 500 }}>
              Base de Datos Local
            </span>
          </h2>
          
          {students.length > 0 ? (
            <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nombre</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', width: '100px' }}>Curso</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', width: '120px' }}>Ingreso</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', width: '80px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontWeight: 500, padding: '0.75rem', color: 'var(--text-main)' }}>
                        {student.name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--primary)' 
                        }}>
                          {student.grade} Básico
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(student.createdAt).toLocaleDateString('es-CL')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.4rem', 
                            background: 'var(--danger)', 
                            color: 'white', 
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar al alumno ${student.name}? Se borrarán permanentemente sus evaluaciones históricas.`)) {
                              deleteStudent(student.id);
                            }
                          }}
                          title="Eliminar Estudiante"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No hay alumnos registrados todavía.</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                Usa el formulario de la izquierda o carga una nómina en masa para comenzar.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
