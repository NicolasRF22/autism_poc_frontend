import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { schoolAPI, teacherAPI } from '../services/api';
import './TeacherFormNew.css';

const emptyForm = {
  name: '',
  school_id: '',
  school_name: '',
  specialization: '',
  email: '',
  phone: '',
  notes: '',
};

const TeacherFormNew = () => {
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
    if (isNewMode) return;

    const loadTeacher = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await teacherAPI.getTeacher(id);
        setFormData({
          name: data.name || '',
          school_id: data.school_id || '',
          school_name: data.school_name || '',
          specialization: data.specialization || '',
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
        });
      } catch (err) {
        setError('Erro ao carregar docente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [id, isNewMode]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isViewMode) return;

    if (!formData.name.trim()) {
      setError('Nome do docente é obrigatório.');
      return;
    }

    if (!formData.school_id) {
      setError('Selecione uma escola cadastrada para o docente.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isEditMode) {
        await teacherAPI.updateTeacher(id, formData);
      } else {
        await teacherAPI.createTeacher(formData);
      }

      navigate('/teachers');
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error;
      setError(message || 'Erro ao salvar docente.');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    if (isViewMode) return 'Visualizar Docente';
    if (isEditMode) return 'Editar Docente';
    return 'Novo Docente';
  };

  if (loading) {
    return (
      <div className="teacher-form-page">
        <div className="teacher-form-card">
          <p>Carregando docente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-form-page">
      <div className="teacher-form-card">
        <div className="teacher-form-header">
          <h1>{getTitle()}</h1>
          <button type="button" className="teacher-back-btn" onClick={() => navigate('/teachers')}>
            ← Voltar
          </button>
        </div>

        {error && <div className="teacher-form-error">{error}</div>}

        <form className="teacher-form" onSubmit={handleSubmit}>
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
            {!schoolsLoading && schools.length === 0 && (
              <small>Cadastre ao menos uma escola antes de cadastrar docentes.</small>
            )}
          </label>

          <label>
            Especialidade
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </label>

          <div className="teacher-form-row">
            <label>
              E-mail
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>

            <label>
              Telefone
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>
          </div>

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
            <div className="teacher-form-actions">
              <button type="button" className="teacher-cancel-btn" onClick={() => navigate('/teachers')}>
                Cancelar
              </button>
              <button type="submit" className="teacher-save-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TeacherFormNew;
