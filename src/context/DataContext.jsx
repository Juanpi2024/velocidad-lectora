import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import initialTexts from '../data/initialTexts.json';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('vl_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [texts, setTexts] = useState(() => {
    const saved = localStorage.getItem('vl_texts');
    if (saved && JSON.parse(saved).length > 0) {
      return JSON.parse(saved);
    }
    // Load defaults if empty
    return initialTexts.map(t => ({...t, createdAt: new Date().toISOString()}));
  });

  const [evaluations, setEvaluations] = useState(() => {
    const saved = localStorage.getItem('vl_evaluations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vl_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('vl_texts', JSON.stringify(texts));
  }, [texts]);

  useEffect(() => {
    localStorage.setItem('vl_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  const addStudent = (name, grade) => {
    setStudents([...students, { id: uuidv4(), name, grade, createdAt: new Date().toISOString() }]);
  };

  const deleteStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    setEvaluations(evaluations.filter(e => e.studentId !== id));
  };

  const addText = (title, level, wordCount, content) => {
    setTexts([...texts, { id: uuidv4(), title, level, wordCount: parseInt(wordCount), content, createdAt: new Date().toISOString() }]);
  };

  const deleteText = (id) => {
    setTexts(texts.filter(t => t.id !== id));
    setEvaluations(evaluations.filter(e => e.textId !== id));
  };

  const addEvaluation = (studentId, textId, timeSeconds, errors, comprehensionScore, wordsRead = null) => {
    const text = texts.find(t => t.id === textId);
    if (!text) return;
    
    // PPM = (Words Read - Errors) / (Time in minutes)
    const actualWords = wordsRead !== null ? parseInt(wordsRead) : text.wordCount;
    const timeMinutes = timeSeconds / 60;
    const ppm = timeMinutes > 0 ? Math.round((actualWords - errors) / timeMinutes) : 0;

    setEvaluations([...evaluations, {
      id: uuidv4(),
      studentId,
      textId,
      timeSeconds,
      errors,
      ppm: ppm > 0 ? ppm : 0,
      comprehensionScore,
      wordsRead: actualWords,
      date: new Date().toISOString()
    }]);
  };

  const deleteEvaluation = (id) => {
    setEvaluations(evaluations.filter(e => e.id !== id));
  };

  return (
    <DataContext.Provider value={{
      students, addStudent, deleteStudent,
      texts, addText, deleteText,
      evaluations, addEvaluation, deleteEvaluation
    }}>
      {children}
    </DataContext.Provider>
  );
}
