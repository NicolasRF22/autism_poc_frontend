import React, { useEffect, useMemo, useState } from 'react';
import { authAPI, studentAPI } from '../services/api';
import './TeacherStudentManagementPage.css';

const normalizeParentIds = (student) => {
  const parentIds = Array.isArray(student?.parent_ids) ? student.parent_ids : [];
  return parentIds.map((item) => String(item || '').trim()).filter(Boolean);
};

const ParentStudentManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedByStudent, setSelectedByStudent] = useState({});
  const [savingByStudent, setSavingByStudent] = useState({});

  const parentById = useMemo(() => {
    return new Map(parents.map((parent) => [parent.id, parent]));
  }, [parents]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [studentSummaries, users] = await Promise.all([
        studentAPI.getAllStudents(),
        authAPI.listUsers(),
      ]);

      const parentUsers = (Array.isArray(users) ? users : []).filter((u) => u.role === 'pais');

      const summaries = Array.isArray(studentSummaries) ? studentSummaries : [];
      const fullStudents = await Promise.all(
        summaries.map(async (summary) => {
          try {
            return await studentAPI.getStudent(summary.id);
          } catch {
            return summary;
          }
        }),
      );

      const normalizedStudents = fullStudents
        .map((student) => ({
          ...student,
          parent_ids: normalizeParentIds(student),
        }))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

      const initialSelected = {};
      normalizedStudents.forEach((student) => {
        initialSelected[student.id] = student.parent_ids || [];
      });

      setParents(parentUsers);
      setStudents(normalizedStudents);
      setSelectedByStudent(initialSelected);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados de vínculo pais x aluno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectionChange = (studentId, selectedValues) => {
    setSelectedByStudent((prev) => ({
      ...prev,
      [studentId]: selectedValues,
    }));
  };

  const handleSaveLinks = async (studentId) => {
    const parentIds = Array.isArray(selectedByStudent[studentId])
      ? selectedByStudent[studentId].map((value) => String(value || '').trim()).filter(Boolean)
      : [];

    try {
      setSavingByStudent((prev) => ({ ...prev, [studentId]: true }));
      setError('');
      await studentAPI.updateStudent(studentId, {
        parent_ids: parentIds,
      });
      await loadData();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || 'Erro ao salvar vínculo pais x aluno.';
      setError(message);
    } finally {
      setSavingByStudent((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="teacher-student-page">
        <div className="teacher-student-card">
          <p>Carregando vínculos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-student-page">
      <div className="teacher-student-card">
        <div className="teacher-student-header">
          <h1>Gerenciamento Pais x Alunos</h1>
          <button type="button" className="teacher-student-refresh" onClick={loadData}>
            Atualizar
          </button>
        </div>

        <p className="teacher-student-subtitle">
          Vincule usuários com perfil "Pais" aos alunos correspondentes. Somente admin pode editar.
        </p>

        {error && <div className="teacher-student-error">{error}</div>}

        {parents.length === 0 && (
          <p>Nenhum usuário com perfil "Pais" cadastrado ainda. Crie um em Administração.</p>
        )}

        {students.length === 0 ? (
          <p>Nenhum aluno disponível.</p>
        ) : (
          <div className="teacher-student-table-wrap">
            <table className="teacher-student-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Escola</th>
                  <th>Responsáveis vinculados</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const selected = selectedByStudent[student.id] || [];
                  const isSaving = Boolean(savingByStudent[student.id]);

                  return (
                    <tr key={student.id}>
                      <td>{student.name || '-'}</td>
                      <td>{student.school_name || '-'}</td>
                      <td>
                        <select
                          multiple
                          value={selected}
                          onChange={(event) => {
                            const values = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                            handleSelectionChange(student.id, values);
                          }}
                          size={Math.min(Math.max(parents.length, 4), 8)}
                        >
                          {parents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name || parent.username}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="teacher-student-save"
                          disabled={isSaving}
                          onClick={() => handleSaveLinks(student.id)}
                        >
                          {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentStudentManagementPage;
