import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { teacherAPI } from '../services/api';
import './TeacherFormNew.css';

const emptyForm = {
  name: '',
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
  const [loading, setLoading] = useState(!isNewMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNewMode) return;

    const loadTeacher = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await teacherAPI.getTeacher(id);
        setFormData({
          name: data.name || '',
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isViewMode) return;

    if (!formData.name.trim()) {
      setError('Nome do docente é obrigatório.');
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
            Escola
            <input
              type="text"
              name="school_name"
              value={formData.school_name}
              onChange={handleChange}
              disabled={isViewMode}
            />
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
