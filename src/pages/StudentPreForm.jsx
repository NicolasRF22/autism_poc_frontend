import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { schoolAPI, studentAPI, teacherAPI } from '../services/api';
import './StudentPreForm.css';

const emptyForm = {
  name: '',
  age: '',
  school_id: '',
  school_name: '',
  teacher_ids: [],
  teachers: [],
  teacher_id: '',
  teacher_name: '',
  grade: '',
  class: '',
  guardians: [],
  notes: '',
};

const StudentPreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isViewMode = location.pathname.endsWith('/view');
  const isEditMode = location.pathname.endsWith('/edit');
  const isNewMode = !id;

  const [formData, setFormData] = useState(emptyForm);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [loading, setLoading] = useState(!isNewMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [guardianInput, setGuardianInput] = useState('');

  const normalizeArrayField = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  useEffect(() => {
    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        const data = await schoolAPI.getAllSchools();
        setSchools(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar escolas para seleção:', err);
      } finally {
        setSchoolsLoading(false);
      }
    };

    loadSchools();
  }, []);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setTeachersLoading(true);
        const data = await teacherAPI.getAllTeachers();
        setTeachers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar docentes para seleção:', err);
      } finally {
        setTeachersLoading(false);
      }
    };

    loadTeachers();
  }, []);

  useEffect(() => {
    if (!schools.length) return;
    if (formData.school_id || !formData.school_name) return;

    const normalizedCurrentName = formData.school_name.trim().toLowerCase();
    const matchedSchool = schools.find(
      (school) => String(school.name || '').trim().toLowerCase() === normalizedCurrentName,
    );

    if (matchedSchool) {
      setFormData((prev) => ({
        ...prev,
        school_id: matchedSchool.id,
      }));
    }
  }, [schools, formData.school_id, formData.school_name]);

  useEffect(() => {
    if (!teachers.length) return;
    if (Array.isArray(formData.teacher_ids) && formData.teacher_ids.length > 0) return;

    const normalizedTeacherNames = normalizeArrayField(formData.teachers);
    if (normalizedTeacherNames.length === 0 && !formData.teacher_name) return;

    const nameCandidates = normalizedTeacherNames.length > 0
      ? normalizedTeacherNames
      : [String(formData.teacher_name || '').trim()].filter(Boolean);

    const matchedTeacherIds = teachers
      .filter((teacher) => nameCandidates.some(
        (teacherName) => String(teacher.name || '').trim().toLowerCase() === teacherName.toLowerCase(),
      ))
      .map((teacher) => teacher.id);

    if (matchedTeacherIds.length > 0) {
      const firstTeacher = teachers.find((teacher) => teacher.id === matchedTeacherIds[0]);
      const matchedTeacherNames = teachers
        .filter((teacher) => matchedTeacherIds.includes(teacher.id))
        .map((teacher) => teacher.name);

      setFormData((prev) => ({
        ...prev,
        teacher_ids: matchedTeacherIds,
        teachers: matchedTeacherNames,
        teacher_id: matchedTeacherIds[0],
        teacher_name: firstTeacher?.name || '',
      }));
    }
  }, [teachers, formData.teacher_ids, formData.teachers, formData.teacher_name]);

  useEffect(() => {
    if (isNewMode) return;

    const loadStudent = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await studentAPI.getStudent(id);
        const teacherIds = Array.isArray(data.teacher_ids)
          ? data.teacher_ids.filter(Boolean)
          : [data.teacher_id].filter(Boolean);
        const teacherNames = normalizeArrayField(data.teachers || data.teacher_name);
        const firstTeacherName = teacherNames[0] || '';
        setFormData({
          name: data.name || data.studentName || '',
          age: data.age || data.studentAge || '',
          school_id: data.school_id || '',
          school_name: data.school_name || data.schoolName || '',
          teacher_ids: teacherIds,
          teachers: teacherNames,
          teacher_id: teacherIds[0] || '',
          teacher_name: firstTeacherName,
          grade: data.grade || data.schoolYear || '',
          class: data.class || data.className || '',
          guardians: Array.isArray(data.guardians) ? data.guardians : [],
          notes: data.notes || '',
        });
      } catch (err) {
        setError('Erro ao carregar aluno.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id, isNewMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolChange = (event) => {
    const schoolId = event.target.value;
    const selectedSchool = schools.find((school) => school.id === schoolId);

    setFormData((prev) => ({
      ...prev,
      school_id: schoolId,
      school_name: selectedSchool?.name || '',
    }));
  };

  const handleTeacherChange = (event) => {
    const selectedTeacherIds = Array.from(event.target.selectedOptions || []).map((option) => option.value);
    const selectedTeachers = teachers.filter((teacher) => selectedTeacherIds.includes(teacher.id));
    const selectedTeacherNames = selectedTeachers.map((teacher) => teacher.name);

    setFormData((prev) => ({
      ...prev,
      teacher_ids: selectedTeacherIds,
      teachers: selectedTeacherNames,
      teacher_id: selectedTeacherIds[0] || '',
      teacher_name: selectedTeacherNames[0] || '',
    }));
  };

  const handleAddGuardian = (event) => {
    event.preventDefault();
    const trimmed = guardianInput.trim();
    if (!trimmed) return;

    setFormData((prev) => {
      if (prev.guardians.includes(trimmed)) return prev;
      return { ...prev, guardians: [...prev.guardians, trimmed] };
    });
    setGuardianInput('');
  };

  const handleRemoveGuardian = (guardianToRemove) => {
    setFormData((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((guardian) => guardian !== guardianToRemove),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isViewMode) return;

    const normalizedGuardians = Array.isArray(formData.guardians)
      ? formData.guardians.map((guardian) => String(guardian || '').trim()).filter(Boolean)
      : [];
    const pendingGuardian = guardianInput.trim();
    const finalGuardians = pendingGuardian && !normalizedGuardians.includes(pendingGuardian)
      ? [...normalizedGuardians, pendingGuardian]
      : normalizedGuardians;

    if (!formData.name.trim()) {
      setError('Nome do aluno é obrigatório.');
      return;
    }

    if (finalGuardians.length === 0) {
      setError('Informe pelo menos uma filiação para o aluno.');
      return;
    }

    if (!formData.school_id) {
      setError('Selecione uma escola cadastrada para o aluno.');
      return;
    }

    if (!Array.isArray(formData.teacher_ids) || formData.teacher_ids.length === 0) {
      setError('Selecione pelo menos um docente cadastrado para o aluno.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...formData,
        guardians: finalGuardians,
      };

      if (isEditMode) {
        await studentAPI.updateStudent(id, payload);
      } else {
        await studentAPI.createStudent(payload);
      }

      navigate('/students');
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error;
      setError(message || 'Erro ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    if (isViewMode) return 'Visualizar Aluno (Pré-cadastro)';
    if (isEditMode) return 'Editar Aluno (Pré-cadastro)';
    return 'Novo Aluno (Pré-cadastro)';
  };

  if (loading) {
    return (
      <div className="student-pre-page">
        <div className="student-pre-card">
          <p>Carregando aluno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-pre-page">
      <div className="student-pre-card">
        <div className="student-pre-header">
          <h1>{getTitle()}</h1>
          <button type="button" className="student-pre-back-btn" onClick={() => navigate('/students')}>
            ← Voltar
          </button>
        </div>

        {error && <div className="student-pre-error">{error}</div>}

        <form className="student-pre-form" onSubmit={handleSubmit}>
          <label>
            Nome *
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isViewMode}
              required
            />
          </label>

          <div className="student-pre-row">
            <label>
              Idade
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>

            <label>
              Escola *
              <select
                name="school_id"
                value={formData.school_id}
                onChange={handleSchoolChange}
                disabled={isViewMode || schoolsLoading}
                required
              >
                <option value="">{schoolsLoading ? 'Carregando escolas...' : 'Selecione uma escola cadastrada'}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="student-pre-row">
            <label>
              Ano
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>

            <label>
              Turma
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>
          </div>

          <label>
            Docente(s) Vinculado(s) *
            <select
              name="teacher_ids"
              value={formData.teacher_ids}
              onChange={handleTeacherChange}
              disabled={isViewMode || teachersLoading}
              required
              multiple
              size={Math.min(Math.max(teachers.length, 4), 8)}
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {!teachersLoading && teachers.length > 0 && (
              <small>Segure Ctrl (Windows) para selecionar múltiplos docentes.</small>
            )}
            {!teachersLoading && teachers.length === 0 && (
              <small>Cadastre ao menos um docente antes de vincular o aluno.</small>
            )}
          </label>

          <label>
            Filiação(ões)
            <div className="student-pre-guardians-box">
              <div className="student-pre-guardians-list">
                {(formData.guardians || []).map((guardian, idx) => (
                  <span key={`${guardian}-${idx}`} className="student-pre-guardian-tag">
                    {guardian}
                    {!isViewMode && (
                      <button
                        type="button"
                        className="student-pre-guardian-remove"
                        onClick={() => handleRemoveGuardian(guardian)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {!isViewMode && (
                <div className="student-pre-guardians-input">
                  <input
                    type="text"
                    value={guardianInput}
                    onChange={(event) => setGuardianInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddGuardian(event)}
                    placeholder="Nome do responsável"
                  />
                  <button type="button" onClick={handleAddGuardian}>
                    + Adicionar
                  </button>
                </div>
              )}
            </div>
          </label>

          <label>
            Observações
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </label>

          {!isViewMode && (
            <div className="student-pre-actions">
              <button type="button" className="student-pre-cancel-btn" onClick={() => navigate('/students')}>
                Cancelar
              </button>
              <button type="submit" className="student-pre-save-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentPreForm;
