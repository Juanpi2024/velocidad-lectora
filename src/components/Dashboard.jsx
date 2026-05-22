import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, BookOpen, Activity, ChevronDown, 
  TrendingUp, Award, HelpCircle, AlertCircle 
} from 'lucide-react';

// Chilean MINEDUC Reading Speed Benchmark Constants (PPM upper limits per grade)
const BENCHMARKS = {
  '1º': { muyLenta: 21, lenta: 28, mediaBaja: 37, mediaAlta: 46, rapida: 55 },
  '2º': { muyLenta: 42, lenta: 53, mediaBaja: 63, mediaAlta: 73, rapida: 83 },
  '3º': { muyLenta: 63, lenta: 75, mediaBaja: 87, mediaAlta: 99, rapida: 111 },
  '4º': { muyLenta: 84, lenta: 95, mediaBaja: 110, mediaAlta: 124, rapida: 139 },
  '5º': { muyLenta: 103, lenta: 119, mediaBaja: 135, mediaAlta: 149, rapida: 167 },
  '6º': { muyLenta: 124, lenta: 125, mediaBaja: 160, mediaAlta: 177, rapida: 195 }, // Note: Mineduc Lenta for 6th is 125 or 142. We adjust according to the Excel image.
  '7º': { muyLenta: 134, lenta: 153, mediaBaja: 173, mediaAlta: 193, rapida: 213 },
  '8º': { muyLenta: 134, lenta: 153, mediaBaja: 173, mediaAlta: 193, rapida: 213 }
};

// Colors mapping matching the Excel sheet but styled with premium modern palettes
const SPEED_COLORS = {
  'Muy Lenta': '#94a3b8',   // Slate
  'Lenta': '#cbd5e1',       // Light Slate
  'Media Baja': '#93c5fd',  // Light Blue
  'Media Alta': '#3b82f6',  // Medium Blue
  'Rápida': '#0ea5e9',      // Sky Blue
  'Muy Rápida': '#10b981'   // Emerald
};

const LEVEL_COLORS = {
  'INICIAL': '#64748b',     // Slate Grey
  'INTERMEDIO': '#3b82f6',  // Royal Blue
  'AVANZADO': '#10b981'     // Emerald Green
};

export default function Dashboard() {
  const { students, texts, evaluations } = useData();
  const [selectedGrade, setSelectedGrade] = useState('2º');

  // Helper to normalize entered student grade to match benchmarks
  const normalizeGrade = (gradeStr) => {
    if (!gradeStr) return '2º';
    const clean = gradeStr.toString().toLowerCase().trim();
    if (clean.includes('1') || clean.includes('primero')) return '1º';
    if (clean.includes('2') || clean.includes('segundo')) return '2º';
    if (clean.includes('3') || clean.includes('tercero')) return '3º';
    if (clean.includes('4') || clean.includes('cuarto')) return '4º';
    if (clean.includes('5') || clean.includes('quinto')) return '5º';
    if (clean.includes('6') || clean.includes('sexto')) return '6º';
    if (clean.includes('7') || clean.includes('septimo') || clean.includes('séptimo')) return '7º';
    if (clean.includes('8') || clean.includes('octavo')) return '8º';
    return '2º'; // fallback
  };

  // Get unique grades from registered students to populate grade selector
  const availableGrades = useMemo(() => {
    const grades = new Set(students.map(s => normalizeGrade(s.grade)));
    // Ensure 2º is in the list, and sort them
    if (grades.size === 0) grades.add('2º');
    return Array.from(grades).sort();
  }, [students]);

  // Categorize a student's speed based on their PPM and grade
  const getSpeedCategory = (grade, ppm) => {
    if (ppm === null || ppm === undefined) return { speed: '-', level: '-' };
    const cleanGrade = grade ? grade.trim() : '2º';
    const limits = BENCHMARKS[cleanGrade] || BENCHMARKS['2º'];
    
    let speed = '';
    let level = '';
    
    if (ppm <= limits.muyLenta) {
      speed = 'Muy Lenta';
      level = 'INICIAL';
    } else if (ppm <= limits.lenta) {
      speed = 'Lenta';
      level = 'INICIAL';
    } else if (ppm <= limits.mediaBaja) {
      speed = 'Media Baja';
      level = 'INTERMEDIO';
    } else if (ppm <= limits.mediaAlta) {
      speed = 'Media Alta';
      level = 'INTERMEDIO';
    } else if (ppm <= limits.rapida) {
      speed = 'Rápida';
      level = 'AVANZADO';
    } else {
      speed = 'Muy Rápida';
      level = 'AVANZADO';
    }
    
    return { speed, level };
  };

  // Fetch the latest evaluation for each student in the selected grade
  const studentEvaluations = useMemo(() => {
    const courseStudents = students.filter(s => normalizeGrade(s.grade) === selectedGrade);
    
    return courseStudents.map((student, index) => {
      // Find all evaluations of this student, sort by date descending to get the latest one
      const studentEvals = evaluations.filter(ev => ev.studentId === student.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const latestEval = studentEvals[0] || null;
      const ppm = latestEval ? latestEval.ppm : null;
      
      // Handle wordsRead fallback to ppm if wordsRead is not defined
      const wordsRead = latestEval 
        ? (latestEval.wordsRead !== undefined && latestEval.wordsRead !== null ? latestEval.wordsRead : ppm) 
        : null;
      
      const { speed, level } = getSpeedCategory(selectedGrade, ppm);
      
      return {
        id: student.id,
        num: index + 1,
        name: student.name.toUpperCase(),
        wordsRead: wordsRead !== null ? wordsRead : '-',
        ppm: ppm,
        speedCategory: speed,
        readingLevel: level,
        hasEvaluation: latestEval !== null
      };
    });
  }, [students, evaluations, selectedGrade]);

  // Compute overall summary statistics for the course
  const summaryStats = useMemo(() => {
    const evaluated = studentEvaluations.filter(se => se.hasEvaluation && se.ppm !== null);
    if (evaluated.length === 0) {
      return { avgSpeed: 0, avgWords: 0, generalLevel: '-' };
    }
    
    const totalPpm = evaluated.reduce((acc, curr) => acc + curr.ppm, 0);
    const totalWords = evaluated.reduce((acc, curr) => {
      const w = parseInt(curr.wordsRead);
      return acc + (isNaN(w) ? curr.ppm : w);
    }, 0);
    
    const avgSpeed = Math.round(totalPpm / evaluated.length);
    // Keep decimal precision for average words like in Excel
    const avgWords = Math.round((totalWords / evaluated.length) * 100) / 100; 
    const generalLevel = getSpeedCategory(selectedGrade, avgSpeed).level;
    
    return { avgSpeed, avgWords, generalLevel };
  }, [studentEvaluations, selectedGrade]);

  // Data for Chart 1: VELOCIDAD LECTORA distribution (Pie/Donut)
  const speedDistributionData = useMemo(() => {
    const evaluated = studentEvaluations.filter(se => se.hasEvaluation && se.ppm !== null);
    if (evaluated.length === 0) return [];
    
    const counts = {
      'Muy Lenta': 0,
      'Lenta': 0,
      'Media Baja': 0,
      'Media Alta': 0,
      'Rápida': 0,
      'Muy Rápida': 0
    };
    
    evaluated.forEach(se => {
      if (counts[se.speedCategory] !== undefined) {
        counts[se.speedCategory]++;
      }
    });

    const total = evaluated.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 1000) / 10 // e.g., 64.3
      }))
      .filter(item => item.value > 0); // Only show categories with students
  }, [studentEvaluations]);

  // Data for Chart 2: NIVEL DE LECTURA distribution (Bar)
  const levelDistributionData = useMemo(() => {
    const evaluated = studentEvaluations.filter(se => se.hasEvaluation && se.ppm !== null);
    if (evaluated.length === 0) return [];
    
    const counts = {
      'INICIAL': 0,
      'INTERMEDIO': 0,
      'AVANZADO': 0
    };
    
    evaluated.forEach(se => {
      if (counts[se.readingLevel] !== undefined) {
        counts[se.readingLevel]++;
      }
    });

    const total = evaluated.length;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      'Alumnos': value,
      'Porcentaje': Math.round((value / total) * 100),
      'color': LEVEL_COLORS[name]
    }));
  }, [studentEvaluations]);

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Title & Grade Filter Panel */}
      <div className="card glass-panel" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>
            Resultados Velocidad Lectora
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Visualización estadística del rendimiento lector bajo estándares de velocidad
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ fontWeight: 600, margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
            CURSO:
          </label>
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)} 
              className="form-control"
              style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                padding: '0.5rem 2rem 0.5rem 1rem', 
                borderRadius: '10px',
                borderColor: 'var(--primary)',
                background: 'white',
                minWidth: '100px',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              {availableGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <ChevronDown size={18} color="var(--primary)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Nómina (Left) vs Graphs & Averages (Right) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1fr', 
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: NÓMINA DE ALUMNOS (Spreadsheet Style) */}
        <div className="card" style={{ padding: '1.5rem 0', overflow: 'hidden' }}>
          <div style={{ padding: '0 1.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>NÓMINA DE ALUMNOS</h3>
            <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem', borderRadius: '20px', background: 'var(--background)', color: 'var(--text-muted)', fontWeight: 500 }}>
              {studentEvaluations.length} alumnos registrados en {selectedGrade}
            </span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 5 }}>
                  <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem 0.5rem', borderBottom: '2px solid var(--border)' }}>Nº</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '2px solid var(--border)' }}>NÓMINA DE ALUMNOS</th>
                  <th style={{ width: '120px', textAlign: 'center', padding: '0.75rem 0.5rem', borderBottom: '2px solid var(--border)' }}>CANT. PALABRAS</th>
                  <th style={{ width: '150px', textAlign: 'left', padding: '0.75rem 0.75rem', borderBottom: '2px solid var(--border)' }}>VELOCIDAD LECTORA</th>
                  <th style={{ width: '120px', textAlign: 'center', padding: '0.75rem 0.5rem', borderBottom: '2px solid var(--border)' }}>NIVEL LECTOR</th>
                </tr>
              </thead>
              <tbody>
                {studentEvaluations.length > 0 ? (
                  studentEvaluations.map((se) => (
                    <tr key={se.id} style={{ transition: 'background 0.15s' }}>
                      <td style={{ textAlign: 'center', padding: '0.65rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)' }}>
                        {se.num}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: 'var(--text-main)' }}>
                        {se.name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem 0.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>
                        {se.wordsRead}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        {se.hasEvaluation ? (
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '6px', 
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            background: `${SPEED_COLORS[se.speedCategory]}15`, 
                            color: SPEED_COLORS[se.speedCategory]
                          }}>
                            {se.speedCategory}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        {se.hasEvaluation ? (
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '6px', 
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: se.readingLevel === 'AVANZADO' ? 'rgba(16, 185, 129, 0.1)' : 
                                        se.readingLevel === 'INTERMEDIO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: LEVEL_COLORS[se.readingLevel]
                          }}>
                            {se.readingLevel}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                      No hay alumnos registrados en el curso <strong>{selectedGrade}</strong>.
                      <br />
                      Registra alumnos y configúralos en este curso para ver la nómina.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: GRAPHS & AVERAGES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Chart 1: VELOCIDAD LECTORA Donut Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', textAlign: 'center', color: 'var(--text-main)' }}>
              DISTRIBUCIÓN VELOCIDAD LECTORA
            </h3>
            
            {speedDistributionData.length > 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speedDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {speedDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SPEED_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} Alumnos (${props.payload.percentage}%)`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={10} 
                      fontSize={11}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Evalúa alumnos de {selectedGrade} para activar este gráfico.
              </div>
            )}
          </div>

          {/* Chart 2: NIVEL DE LECTURA Column Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', textAlign: 'center', color: 'var(--text-main)' }}>
              NIVELES GENERALES DE LECTURA
            </h3>
            
            {levelDistributionData.length > 0 ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                    <YAxis type="number" domain={[0, 100]} unit="%" stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip 
                      formatter={(value, name, props) => [`${props.payload.Alumnos} Alumnos (${value}%)`, 'Proporción']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
                    />
                    <Bar dataKey="Porcentaje" radius={[6, 6, 0, 0]} barSize={40} name="Nivel">
                      {levelDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Evalúa alumnos de {selectedGrade} para activar este gráfico.
              </div>
            )}
          </div>

          {/* SUMMARY STATISTICS BOARD (Matches the Excel table) */}
          <div className="card" style={{ 
            padding: 0, 
            overflow: 'hidden', 
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ 
              background: 'linear-gradient(to right, #1e293b, #334155)', 
              color: 'white', 
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              textAlign: 'center',
              letterSpacing: '0.05em'
            }}>
              RESUMEN CONSOLIDADO CURSO
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Nivel General Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border)' 
              }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>NIVEL GENERAL CURSO :</strong>
                {summaryStats.generalLevel !== '-' ? (
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.05rem', 
                    color: LEVEL_COLORS[summaryStats.generalLevel] || 'var(--text-main)',
                    background: `${LEVEL_COLORS[summaryStats.generalLevel]}15`,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '8px',
                    letterSpacing: '0.02em',
                    border: `1px solid ${LEVEL_COLORS[summaryStats.generalLevel]}40`
                  }}>
                    {summaryStats.generalLevel}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>SIN DATOS</span>
                )}
              </div>

              {/* Velocidad Promedio Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc'
              }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>VELOCIDAD PROMEDIO (PPM) :</strong>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {summaryStats.avgSpeed > 0 ? `${summaryStats.avgSpeed} PPM` : '-'}
                </span>
              </div>

              {/* Palabras Promedio Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem 1.5rem' 
              }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>PALABRAS PROMEDIO LEÍDAS :</strong>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  {summaryStats.avgWords > 0 ? summaryStats.avgWords.toLocaleString('es-CL') : '-'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
