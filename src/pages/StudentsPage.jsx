import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDIPage.css'; // Reusing PDI styles
import { API_BASE_URL } from '../services/api';

const StudentsPage = ({ mode = 'pre-registration' }) => {
  const [students, setStudents] = useState([]);
  const [selectedCaseStudyStudentId, setSelectedCaseStudyStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isCaseStudyMode = mode === 'case-study';
  const completedCaseStudies = students.filter((student) => student.case_study_completed);
  const pendingCaseStudyStudents = students.filter((student) => !student.case_study_completed);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/students`);
      if (!response.ok) throw new Error('Erro ao carregar alunos');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Erro ao carregar alunos. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate('/students/new');
  };

  const handleView = (studentId) => {
    navigate(`/students/${studentId}/view`);
  };

  const handleViewComplete = (studentId) => {
    const sourceParam = isCaseStudyMode ? '?source=estudo-de-caso' : '';
    navigate(`/students/${studentId}/view/completo${sourceParam}`);
  };

  const handleStartCaseStudy = () => {
    if (!selectedCaseStudyStudentId) return;
    const sourceParam = '?source=estudo-de-caso';
    navigate(`/students/${selectedCaseStudyStudentId}/edit/completo${sourceParam}`);
  };

  const handleEdit = (studentId) => {
    navigate(`/students/${studentId}/edit`);
  };

  const handleEditComplete = (studentId) => {
    const sourceParam = isCaseStudyMode ? '?source=estudo-de-caso' : '';
    navigate(`/students/${studentId}/edit/completo${sourceParam}`);
  };

  const handleDelete = async (studentId, studentName) => {
    const confirmMessage = isCaseStudyMode
      ? `Tem certeza que deseja excluir o Estudo de Caso de ${studentName}?`
      : `Tem certeza que deseja excluir o cadastro de ${studentName}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const endpoint = isCaseStudyMode
        ? `${API_BASE_URL}/students/${studentId}/case-study`
        : `${API_BASE_URL}/students/${studentId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir registro');
      loadStudents(); // Reload list
    } catch (err) {
      console.error(err);
      alert(isCaseStudyMode ? 'Erro ao excluir Estudo de Caso' : 'Erro ao excluir aluno');
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
        <div className="loading">Carregando alunos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdi-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadStudents}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdi-page">
      <div className="page-header">
        <h1>
          {isCaseStudyMode
            ? `Estudo de Caso (${completedCaseStudies.length})`
            : `Pré-cadastro de Alunos (${students.length})`}
        </h1>
        {!isCaseStudyMode && (
          <button className="btn-new-pdi" onClick={handleNew}>
            + Novo Pré-cadastro
          </button>
        )}
      </div>

      {isCaseStudyMode && (
        <div className="new-pdi-modal" style={{ marginBottom: '16px' }}>
          <h3>Iniciar Estudo de Caso</h3>
          <p>Selecione um aluno pré-cadastrado para abrir o formulário completo.</p>
          <select
            value={selectedCaseStudyStudentId}
            onChange={(e) => setSelectedCaseStudyStudentId(e.target.value)}
            disabled={pendingCaseStudyStudents.length === 0}
          >
            <option value="">Selecione um aluno</option>
            {pendingCaseStudyStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          <div className="modal-actions">
            <button
              className="btn-create"
              onClick={handleStartCaseStudy}
              disabled={!selectedCaseStudyStudentId || pendingCaseStudyStudents.length === 0}
            >
              Iniciar Estudo de Caso
            </button>
          </div>
        </div>
      )}

      {(isCaseStudyMode ? completedCaseStudies.length : students.length) === 0 ? (
        <div className="no-pdis-message">
          <p>{isCaseStudyMode ? '📋 Nenhum Estudo de Caso concluído ainda.' : '👨‍🎓 Nenhum aluno cadastrado ainda.'}</p>
          <p>
            {isCaseStudyMode
              ? 'Selecione um aluno pré-cadastrado acima para iniciar o estudo de caso.'
              : 'Clique em "Novo Pré-cadastro" para começar.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="pdi-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Idade</th>
                <th>Escola</th>
                <th>Ano</th>
                <th>Turma</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(isCaseStudyMode ? completedCaseStudies : students).map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.age || '-'}</td>
                  <td>{student.school_name || '-'}</td>
                  <td>{student.grade || '-'}</td>
                  <td>{student.class || '-'}</td>
                  <td>{formatDate(student.updated_at)}</td>
                  <td className="actions-cell">
                    {!isCaseStudyMode && (
                      <button
                        className="btn-action btn-view"
                        onClick={() => handleView(student.id)}
                        title="Visualizar Pré-cadastro"
                      >
                        👁️
                      </button>
                    )}
                    {isCaseStudyMode && (
                      <button
                        className="btn-action btn-review"
                        onClick={() => handleViewComplete(student.id)}
                        title="Visualizar Estudo de Caso"
                      >
                        📋
                      </button>
                    )}
                    {!isCaseStudyMode && (
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(student.id)}
                        title="Editar Pré-cadastro"
                      >
                        ✏️
                      </button>
                    )}
                    {isCaseStudyMode && (
                      <button
                        className="btn-action btn-review"
                        onClick={() => handleEditComplete(student.id)}
                        title="Editar Estudo de Caso"
                      >
                        📝
                      </button>
                    )}
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(student.id, student.name)}
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

export default StudentsPage;
