import React, { useEffect, useMemo, useState } from 'react';
import { studentAPI, teacherAPI } from '../services/api';
import './TeacherStudentManagementPage.css';

const normalizeTeacherIds = (student) => {
  const teacherIds = Array.isArray(student?.teacher_ids) ? student.teacher_ids : [];
  const normalized = teacherIds.map((item) => String(item || '').trim()).filter(Boolean);
  const legacy = String(student?.teacher_id || '').trim();
  if (legacy && !normalized.includes(legacy)) {
    normalized.push(legacy);
  }
  return normalized;
};

const TeacherStudentManagementPage = ({ user }) => {
  const role = user?.role || '';
  const canEdit = role === 'admin' || role === 'coordenacao';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedByStudent, setSelectedByStudent] = useState({});
  const [savingByStudent, setSavingByStudent] = useState({});

  const teacherById = useMemo(() => {
    return new Map(teachers.map((teacher) => [teacher.id, teacher]));
  }, [teachers]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [studentSummaries, teacherData] = await Promise.all([
        studentAPI.getAllStudents(),
        teacherAPI.getAllTeachers(),
      ]);

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
          teacher_ids: normalizeTeacherIds(student),
        }))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

      const initialSelected = {};
      normalizedStudents.forEach((student) => {
        initialSelected[student.id] = student.teacher_ids || [];
      });

      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setStudents(normalizedStudents);
      setSelectedByStudent(initialSelected);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados de vínculo docente x aluno.');
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
    const teacherIds = Array.isArray(selectedByStudent[studentId])
      ? selectedByStudent[studentId].map((value) => String(value || '').trim()).filter(Boolean)
      : [];

    if (teacherIds.length === 0) {
      setError('Selecione ao menos um docente para salvar o vínculo.');
      return;
    }

    try {
      setSavingByStudent((prev) => ({ ...prev, [studentId]: true }));
      setError('');
      await studentAPI.updateStudent(studentId, {
        teacher_ids: teacherIds,
        teacher_id: teacherIds[0],
      });
      await loadData();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || 'Erro ao salvar vínculo docente x aluno.';
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
          <h1>Gerenciamento Docentes x Alunos</h1>
          <button type="button" className="teacher-student-refresh" onClick={loadData}>
            Atualizar
          </button>
        </div>

        <p className="teacher-student-subtitle">
          {canEdit
            ? 'Coordenação/Admin podem editar vínculos docente-aluno dentro do escopo permitido.'
            : 'Secretaria possui visualização dos vínculos docente-aluno.'}
        </p>

        {error && <div className="teacher-student-error">{error}</div>}

        {students.length === 0 ? (
          <p>Nenhum aluno disponível no seu escopo.</p>
        ) : (
          <div className="teacher-student-table-wrap">
            <table className="teacher-student-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Escola</th>
                  <th>Docentes vinculados</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const selected = selectedByStudent[student.id] || [];
                  const isSaving = Boolean(savingByStudent[student.id]);
                  const selectedTeacherNames = selected
                    .map((teacherId) => teacherById.get(teacherId)?.name)
                    .filter(Boolean);

                  return (
                    <tr key={student.id}>
                      <td>{student.name || '-'}</td>
                      <td>{student.school_name || '-'}</td>
                      <td>
                        {canEdit ? (
                          <select
                            multiple
                            value={selected}
                            onChange={(event) => {
                              const values = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                              handleSelectionChange(student.id, values);
                            }}
                            size={Math.min(Math.max(teachers.length, 4), 8)}
                          >
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{selectedTeacherNames.length ? selectedTeacherNames.join(', ') : '-'}</span>
                        )}
                      </td>
                      <td>
                        {canEdit ? (
                          <button
                            type="button"
                            className="teacher-student-save"
                            disabled={isSaving}
                            onClick={() => handleSaveLinks(student.id)}
                          >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                        ) : (
                          <span>Visualização</span>
                        )}
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

export default TeacherStudentManagementPage;
