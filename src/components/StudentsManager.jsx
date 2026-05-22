import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, Trash2 } from 'lucide-react';

export default function StudentsManager() {
  const { students, addStudent, deleteStudent } = useData();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && grade.trim()) {
      addStudent(name, grade);
      setName('');
      setGrade('');
    }
  };

  return (
    <div className="students-manager">
      <h1 className="text-3xl mb-6">Gestión de Alumnos</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 className="text-2xl mb-4">Añadir Alumno</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Juan Pérez" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Curso / Grado</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. 5to Básico" 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <UserPlus size={18} /> Guardar Alumno
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-2xl mb-4">Lista de Alumnos ({students.length})</h2>
          {students.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Curso</th>
                    <th>Fecha Ingreso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td>{student.grade}</td>
                      <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar al alumno ${student.name}? Se borrarán también sus evaluaciones.`)) {
                              deleteStudent(student.id);
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
              No hay alumnos registrados todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
