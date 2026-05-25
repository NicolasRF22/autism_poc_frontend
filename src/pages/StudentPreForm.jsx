import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { schoolAPI, studentAPI } from '../services/api';
import './StudentPreForm.css';
import { GRADES } from '../constants/grades';

const emptyForm = {
  name: '',
  birth_date: '',
  age: '',
  school_id: '',
  school_name: '',
  grade: '',
  class: '',
  guardians: [],
  diagnosis: '',
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
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [loading, setLoading] = useState(!isNewMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [guardianInput, setGuardianInput] = useState('');

  const computeAge = (birthDateStr) => {
    if (!birthDateStr) return '';
    // normalize and avoid timezone issues
    const b = new Date(birthDateStr + 'T00:00:00');
    if (Number.isNaN(b.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    if (age < 0) return '';
    return String(age);
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
    if (isNewMode) return;

    const loadStudent = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await studentAPI.getStudent(id);
        const computedAge = data.birth_date
          ? computeAge(data.birth_date)
          : (data.age || data.studentAge || '');

        setFormData({
          name: data.name || data.studentName || '',
          birth_date: data.birth_date || data.birthDate || data.date_of_birth || '',
          age: computedAge,
          school_id: data.school_id || '',
          school_name: data.school_name || data.schoolName || '',
          grade: data.grade || data.schoolYear || '',
          class: data.class || data.className || '',
          guardians: Array.isArray(data.guardians) ? data.guardians : [],
          diagnosis: data.diagnosis || '',
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
    if (name === 'birth_date') {
      const newAge = computeAge(value);
      setFormData((prev) => ({ ...prev, birth_date: value, age: newAge }));
      return;
    }
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


    if (!formData.grade || !String(formData.grade).trim()) {
      setError('Selecione o ano escolar do aluno.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Nome do aluno é obrigatório.');
      return;
    }
    if (!formData.birth_date) {
      setError('Data de nascimento é obrigatória.');
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

          <label>
            Data de nascimento *
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
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
                readOnly
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
              Ano *
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                disabled={isViewMode}
                required
              >
                <option value="">Selecione o ano escolar</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
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
            Diagnóstico
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              disabled={isViewMode}
            />
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
