import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDIPage.css'; // Reusing PDI styles
import { API_BASE_URL, getFetchErrorMessage, getStoredUser } from '../services/api';

const SchoolsPage = ({ mode = 'pre-registration' }) => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolRegistrationId, setSelectedSchoolRegistrationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isSchoolRegistrationMode = mode === 'school-registration';
  const currentRole = getStoredUser()?.role || '';
  const canManagePreRegistration = ['admin', 'secretaria'].includes(currentRole);
  const canManageSchoolRegistration = ['admin', 'coordenacao'].includes(currentRole);
  const completedSchoolRegistrations = schools.filter((school) => school.school_registration_completed);
  const pendingSchoolRegistrations = schools.filter((school) => !school.school_registration_completed);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schools`);
      if (!response.ok) {
        const message = await getFetchErrorMessage(response, 'Erro ao carregar escolas');
        throw new Error(message);
      }
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar escolas. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate('/schools/new');
  };

  const handleView = (schoolId) => {
    navigate(`/schools/${schoolId}/view`);
  };

  const handleViewComplete = (schoolId) => {
    const sourceParam = isSchoolRegistrationMode ? '?source=cadastro-da-escola' : '';
    navigate(`/schools/${schoolId}/view/completo${sourceParam}`);
  };

  const handleStartSchoolRegistration = () => {
    if (!selectedSchoolRegistrationId) return;
    const sourceParam = '?source=cadastro-da-escola';
    navigate(`/schools/${selectedSchoolRegistrationId}/edit/completo${sourceParam}`);
  };

  const handleEdit = (schoolId) => {
    navigate(`/schools/${schoolId}/edit`);
  };

  const handleEditComplete = (schoolId) => {
    const sourceParam = isSchoolRegistrationMode ? '?source=cadastro-da-escola' : '';
    navigate(`/schools/${schoolId}/edit/completo${sourceParam}`);
  };

  const handleDelete = async (schoolId, schoolName) => {
    const confirmMessage = isSchoolRegistrationMode
      ? `Tem certeza que deseja excluir o Cadastro da Escola ${schoolName}?`
      : `Tem certeza que deseja excluir a escola ${schoolName}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const endpoint = isSchoolRegistrationMode
        ? `${API_BASE_URL}/schools/${schoolId}/registration`
        : `${API_BASE_URL}/schools/${schoolId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const message = await getFetchErrorMessage(response, 'Erro ao excluir registro');
        throw new Error(message);
      }
      loadSchools(); // Reload list
    } catch (err) {
      console.error(err);
      alert(err?.message || (isSchoolRegistrationMode ? 'Erro ao excluir Cadastro da Escola' : 'Erro ao excluir escola'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="pdi-page">
        <div className="loading">Carregando escolas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdi-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadSchools}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdi-page">
      <div className="page-header">
        <h1>
          {isSchoolRegistrationMode
            ? `Cadastro da Escola (${completedSchoolRegistrations.length})`
            : `Pré-cadastro de Escolas (${schools.length})`}
        </h1>
        {!isSchoolRegistrationMode && canManagePreRegistration && (
          <button className="btn-new-pdi" onClick={handleNew}>
            + Novo Pré-cadastro
          </button>
        )}
      </div>

      {isSchoolRegistrationMode && canManageSchoolRegistration && (
        <div className="new-pdi-modal" style={{ marginBottom: '16px' }}>
          <h3>Iniciar Cadastro da Escola</h3>
          <p>Selecione uma escola pré-cadastrada para abrir o formulário completo.</p>
          <select
            value={selectedSchoolRegistrationId}
            onChange={(e) => setSelectedSchoolRegistrationId(e.target.value)}
            disabled={pendingSchoolRegistrations.length === 0}
          >
            <option value="">Selecione uma escola</option>
            {pendingSchoolRegistrations.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <div className="modal-actions">
            <button
              className="btn-create"
              onClick={handleStartSchoolRegistration}
              disabled={!selectedSchoolRegistrationId || pendingSchoolRegistrations.length === 0}
            >
              Iniciar Cadastro da Escola
            </button>
          </div>
        </div>
      )}

      {(isSchoolRegistrationMode ? completedSchoolRegistrations.length : schools.length) === 0 ? (
        <div className="no-pdis-message">
          <p>{isSchoolRegistrationMode ? '📋 Nenhum Cadastro da Escola concluído ainda.' : '🏫 Nenhuma escola cadastrada ainda.'}</p>
          <p>
            {isSchoolRegistrationMode
              ? 'Selecione uma escola pré-cadastrada acima para iniciar o cadastro completo.'
              : 'Clique em "Novo Pré-cadastro" para começar.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="pdi-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Tipo</th>
                <th>Cidade</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(isSchoolRegistrationMode ? completedSchoolRegistrations : schools).map((school) => (
                <tr key={school.id}>
                  <td>{school.name}</td>
                  <td>{school.cnpj || '-'}</td>
                  <td>{school.institution_type || '-'}</td>
                  <td>{school.city || '-'}</td>
                  <td>{formatDate(school.updated_at)}</td>
                  <td className="actions-cell">
                    {!isSchoolRegistrationMode && (
                      <button
                        className="btn-action btn-view"
                        onClick={() => handleView(school.id)}
                        title="Visualizar Pré-cadastro"
                      >
                        👁️
                      </button>
                    )}
                    {isSchoolRegistrationMode && (
                      <button
                        className="btn-action btn-review"
                        onClick={() => handleViewComplete(school.id)}
                        title="Visualizar Cadastro da Escola"
                      >
                        📋
                      </button>
                    )}
                    {!isSchoolRegistrationMode && canManagePreRegistration && (
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(school.id)}
                        title="Editar Pré-cadastro"
                      >
                        ✏️
                      </button>
                    )}
                    {isSchoolRegistrationMode && canManageSchoolRegistration && (
                      <button
                        className="btn-action btn-review"
                        onClick={() => handleEditComplete(school.id)}
                        title="Editar Cadastro da Escola"
                      >
                        📝
                      </button>
                    )}
                    {((!isSchoolRegistrationMode && canManagePreRegistration) || (isSchoolRegistrationMode && canManageSchoolRegistration)) && (
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(school.id, school.name)}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SchoolsPage;
