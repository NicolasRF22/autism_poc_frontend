import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDIPage.css'; // Reusing PDI styles
import { API_BASE_URL } from '../services/api';

const SchoolsPage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schools`);
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      setError('Erro ao carregar escolas. Verifique se o backend está rodando.');
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
    navigate(`/schools/${schoolId}/view/completo`);
  };

  const handleEdit = (schoolId) => {
    navigate(`/schools/${schoolId}/edit`);
  };

  const handleEditComplete = (schoolId) => {
    navigate(`/schools/${schoolId}/edit/completo`);
  };

  const handleDelete = async (schoolId, schoolName) => {
    if (!window.confirm(`Tem certeza que deseja excluir a escola ${schoolName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/schools/${schoolId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir escola');
      loadSchools(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir escola');
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
        <h1>Cadastro de Escolas</h1>
        <button className="btn-new-pdi" onClick={handleNew}>
          + Nova Escola
        </button>
      </div>

      {schools.length === 0 ? (
        <div className="no-pdis-message">
          <p>🏫 Nenhuma escola cadastrada ainda.</p>
          <p>Clique em "Nova Escola" para começar.</p>
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
              {schools.map((school) => (
                <tr key={school.id}>
                  <td>{school.name}</td>
                  <td>{school.cnpj || '-'}</td>
                  <td>{school.institution_type || '-'}</td>
                  <td>{school.city || '-'}</td>
                  <td>{formatDate(school.updated_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleView(school.id)}
                      title="Visualizar Pré-cadastro"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-action btn-review"
                      onClick={() => handleViewComplete(school.id)}
                      title="Visualizar Cadastro Completo"
                    >
                      📋
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(school.id)}
                      title="Editar Pré-cadastro"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-review"
                      onClick={() => handleEditComplete(school.id)}
                      title="Editar Cadastro Completo"
                    >
                      📝
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(school.id, school.name)}
                      title="Excluir"
                    >
                      🗑️
                    </button>
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
