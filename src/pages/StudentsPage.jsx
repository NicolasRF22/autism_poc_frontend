import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDIPage.css'; // Reusing PDI styles
import { API_BASE_URL } from '../services/api';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    navigate(`/students/${studentId}/view/completo`);
  };

  const handleEdit = (studentId) => {
    navigate(`/students/${studentId}/edit`);
  };

  const handleEditComplete = (studentId) => {
    navigate(`/students/${studentId}/edit/completo`);
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de ${studentName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir aluno');
      loadStudents(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir aluno');
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
        <h1>Cadastro de Alunos</h1>
        <button className="btn-new-pdi" onClick={handleNew}>
          + Novo Aluno
        </button>
      </div>

      {students.length === 0 ? (
        <div className="no-pdis-message">
          <p>👨‍🎓 Nenhum aluno cadastrado ainda.</p>
          <p>Clique em "Novo Aluno" para começar.</p>
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
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.age || '-'}</td>
                  <td>{student.school_name || '-'}</td>
                  <td>{student.grade || '-'}</td>
                  <td>{student.class || '-'}</td>
                  <td>{formatDate(student.updated_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleView(student.id)}
                      title="Visualizar Pré-cadastro"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-action btn-review"
                      onClick={() => handleViewComplete(student.id)}
                      title="Visualizar Cadastro Completo"
                    >
                      📋
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(student.id)}
                      title="Editar Pré-cadastro"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-review"
                      onClick={() => handleEditComplete(student.id)}
                      title="Editar Cadastro Completo"
                    >
                      📝
                    </button>
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
