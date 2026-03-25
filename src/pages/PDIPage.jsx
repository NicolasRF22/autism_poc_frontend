import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdiAPI } from '../services/api';
import './PDIPage.css';

const PDIPage = () => {
  const [pdis, setPdis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPDIs();
  }, []);

  const loadPDIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pdiAPI.getAllPDIs();
      setPdis(data);
    } catch (err) {
      setError('Erro ao carregar PDIs. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPDI = () => {
    navigate('/pdi/novo');
  };

  const handleView = (pdiId) => {
    navigate(`/pdi/${pdiId}/view`);
  };

  const handleReview = (pdiId) => {
    navigate(`/pdi/${pdiId}/view?step=4`);
  };

  const handleEdit = (pdiId) => {
    navigate(`/pdi/${pdiId}/edit`);
  };

  const handleDelete = async (pdiId, studentName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o PDI de ${studentName}?`)) {
      return;
    }

    try {
      await pdiAPI.deletePDI(pdiId);
      loadPDIs(); // Recarregar lista
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir PDI');
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
        <div className="loading">Carregando PDIs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdi-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadPDIs}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdi-page">
      <div className="page-header">
        <h1>Planos de Desenvolvimento Individual (PDI)</h1>
        <button className="btn-new-pdi" onClick={handleNewPDI}>
          + Novo PDI
        </button>
      </div>

      {pdis.length === 0 ? (
        <div className="no-pdis-message">
          <p>📑 Nenhum PDI cadastrado ainda.</p>
          <p>Clique em "Novo PDI" para começar.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="pdi-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Diagnóstico</th>
                <th>Docentes</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pdis.map((pdi) => (
                <tr key={pdi.id}>
                  <td className="student-name">{pdi.student_name}</td>
                  <td>{pdi.class}</td>
                  <td className="diagnosis">{pdi.diagnosis}</td>
                  <td className="teachers-cell">
                    <div className="teachers-list">
                      {pdi.teachers.map((teacher, idx) => (
                        <span key={idx} className="teacher-badge">
                          {teacher}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="date-cell">{formatDate(pdi.updated_at)}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-action btn-review" 
                      onClick={() => handleReview(pdi.id)}
                      title="Ver Revisão/Resumo"
                    >
                      📊
                    </button>
                    <button 
                      className="btn-action btn-view" 
                      onClick={() => handleView(pdi.id)}
                      title="Visualizar"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-action btn-edit" 
                      onClick={() => handleEdit(pdi.id)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-action btn-delete" 
                      onClick={() => handleDelete(pdi.id, pdi.student_name)}
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

export default PDIPage;
