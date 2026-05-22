import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BookOpen, Users, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const { students, texts, evaluations } = useData();

  const stats = [
    { label: 'Total Alumnos', value: students.length, icon: Users, color: '#0ea5e9' },
    { label: 'Total Textos', value: texts.length, icon: BookOpen, color: '#8b5cf6' },
    { label: 'Evaluaciones', value: evaluations.length, icon: Activity, color: '#10b981' },
    { 
      label: 'Promedio PPM', 
      value: evaluations.length ? Math.round(evaluations.reduce((acc, curr) => acc + curr.ppm, 0) / evaluations.length) : 0, 
      icon: TrendingUp, 
      color: '#4f46e5' 
    },
  ];

  // Agrupar evaluaciones por fecha para el gráfico general
  const chartData = useMemo(() => {
    const dataByDate = {};
    
    // Sort by date ascending
    const sortedEvals = [...evaluations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedEvals.forEach(ev => {
      const dateStr = new Date(ev.date).toLocaleDateString();
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, totalPpm: 0, count: 0, avgComp: 0, totalComp: 0 };
      }
      dataByDate[dateStr].totalPpm += ev.ppm;
      dataByDate[dateStr].totalComp += parseInt(ev.comprehensionScore || 0);
      dataByDate[dateStr].count += 1;
    });

    return Object.values(dataByDate).map(d => ({
      name: d.date,
      PPM: Math.round(d.totalPpm / d.count),
      Comprension: Math.round(d.totalComp / d.count)
    }));
  }, [evaluations]);

  // Mejores alumnos
  const topStudents = useMemo(() => {
    const studentStats = {};
    evaluations.forEach(ev => {
      if (!studentStats[ev.studentId]) {
        studentStats[ev.studentId] = { maxPpm: 0, name: students.find(s => s.id === ev.studentId)?.name || 'Desconocido' };
      }
      if (ev.ppm > studentStats[ev.studentId].maxPpm) {
        studentStats[ev.studentId].maxPpm = ev.ppm;
      }
    });
    return Object.values(studentStats).sort((a, b) => b.maxPpm - a.maxPpm).slice(0, 5);
  }, [evaluations, students]);

  return (
    <div className="dashboard">
      <h1 className="text-3xl mb-6">Panel de Control</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card flex-between">
            <div>
              <p className="form-label" style={{ marginBottom: '0.25rem' }}>{stat.label}</p>
              <h2 className="text-2xl" style={{ margin: 0 }}>{stat.value}</h2>
            </div>
            <div style={{ background: `${stat.color}20`, padding: '1rem', borderRadius: '12px', color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="mb-4">Evolución de Velocidad Lectora (Promedio General)</h3>
          {chartData.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="PPM" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Comprension" stroke="var(--success)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No hay suficientes datos para graficar. Agrega evaluaciones.
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4">Top 5 Alumnos (Max PPM)</h3>
          {topStudents.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudents} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-muted)" />
                  <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={12} width={80} />
                  <Tooltip cursor={{fill: 'var(--background)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Bar dataKey="maxPpm" fill="var(--secondary)" radius={[0, 4, 4, 0]} barSize={24} name="Max PPM" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              Agrega evaluaciones para ver el ranking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
