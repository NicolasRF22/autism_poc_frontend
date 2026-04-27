import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getStoredUser, municipalityAPI, schoolAPI } from '../services/api';
import './SchoolPreForm.css';

const emptyForm = {
  name: '',
  cnpj: '',
  institution_type: '',
  municipio_id: '',
  notes: '',
};

const SchoolPreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isViewMode = location.pathname.endsWith('/view');
  const isEditMode = location.pathname.endsWith('/edit');
  const isNewMode = !id;
  const currentUser = getStoredUser();
  const isSecretariaScoped = currentUser?.role === 'secretaria' && Boolean(currentUser?.municipio_id);
  const isCoordenacao = currentUser?.role === 'coordenacao';
  const isMunicipioLocked = isSecretariaScoped || isCoordenacao;

  const [formData, setFormData] = useState(emptyForm);
  const [municipalities, setMunicipalities] = useState([]);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(true);
  const [loading, setLoading] = useState(!isNewMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        setMunicipalitiesLoading(true);
        const data = await municipalityAPI.getAllMunicipalities();
        const nextMunicipalities = Array.isArray(data) ? data : [];
        setMunicipalities(nextMunicipalities);

        if (isSecretariaScoped) {
          const userMunicipioId = String(currentUser?.municipio_id || '').trim();
          if (userMunicipioId) {
            setFormData((prev) => ({
              ...prev,
              municipio_id: prev.municipio_id || userMunicipioId,
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar municípios para o formulário de escola:', err);
      } finally {
        setMunicipalitiesLoading(false);
      }
    };

    loadMunicipalities();
  }, [isSecretariaScoped, currentUser?.municipio_id]);

  useEffect(() => {
    if (isNewMode) return;

    const loadSchool = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await schoolAPI.getSchool(id);
        setFormData({
          name: data.name || '',
          cnpj: data.cnpj || '',
          institution_type: data.institution_type || '',
          municipio_id: data.municipio_id || '',
          notes: data.notes || '',
        });
      } catch (err) {
        setError('Erro ao carregar escola.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSchool();
  }, [id, isNewMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isViewMode) return;

    if (!formData.name.trim()) {
      setError('Nome da escola é obrigatório.');
      return;
    }

    if (!String(formData.municipio_id || '').trim()) {
      setError('Município é obrigatório para o pré-cadastro da escola.');
      return;
    }

    const selectedMunicipality = municipalities.find((item) => item.id === formData.municipio_id);
    const municipalityLabel = selectedMunicipality?.name || formData.municipio_id;

    const payload = {
      name: formData.name,
      cnpj: formData.cnpj,
      institution_type: formData.institution_type,
      municipio_id: formData.municipio_id,
      address: {
        city: municipalityLabel,
      },
      notes: formData.notes,
    };

    try {
      setSaving(true);
      setError('');

      if (isEditMode) {
        await schoolAPI.updateSchool(id, payload);
      } else {
        await schoolAPI.createSchool(payload);
      }

      navigate('/schools');
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error;
      setError(message || 'Erro ao salvar escola.');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    if (isViewMode) return 'Visualizar Escola (Pré-cadastro)';
    if (isEditMode) return 'Editar Escola (Pré-cadastro)';
    return 'Nova Escola (Pré-cadastro)';
  };

  if (loading) {
    return (
      <div className="school-pre-page">
        <div className="school-pre-card">
          <p>Carregando escola...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="school-pre-page">
      <div className="school-pre-card">
        <div className="school-pre-header">
          <h1>{getTitle()}</h1>
          <button type="button" className="school-pre-back-btn" onClick={() => navigate('/schools')}>
            ← Voltar
          </button>
        </div>

        {error && <div className="school-pre-error">{error}</div>}

        <form className="school-pre-form" onSubmit={handleSubmit}>
          <label>
            Nome da escola *
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isViewMode}
              required
            />
          </label>

          <div className="school-pre-row">
            <label>
              CNPJ
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>

            <label>
              Tipo de instituição
              <input
                type="text"
                name="institution_type"
                value={formData.institution_type}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </label>
          </div>

          <label>
            Município *
            {isMunicipioLocked ? (
              <>
                <input
                  type="text"
                  value={municipalities.find((m) => m.id === formData.municipio_id)?.name || formData.municipio_id || ''}
                  disabled
                  readOnly
                />
                <small className="school-pre-help">Município atribuído à sua conta.</small>
              </>
            ) : (
              <>
                <select
                  name="municipio_id"
                  value={formData.municipio_id}
                  onChange={handleChange}
                  disabled={isViewMode || municipalitiesLoading}
                  required
                >
                  <option value="">{municipalitiesLoading ? 'Carregando municípios...' : 'Selecione um município'}</option>
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name} ({municipality.id})
                    </option>
                  ))}
                </select>
              </>
            )}
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
            <div className="school-pre-actions">
              <button type="button" className="school-pre-cancel-btn" onClick={() => navigate('/schools')}>
                Cancelar
              </button>
              <button type="submit" className="school-pre-save-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SchoolPreForm;
