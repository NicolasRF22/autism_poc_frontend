import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, teacherAPI } from '../services/api';
import './PDIPage.css';

const TeachersPage = ({ user }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const canManageTeachers = ['admin', 'secretaria'].includes(user?.role || '');

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherAPI.getAllTeachers();
      setTeachers(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao carregar docentes.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleDelete = async (teacherId, teacherName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de ${teacherName}?`)) {
      return;
    }

    try {
      await teacherAPI.deleteTeacher(teacherId);
      loadTeachers();
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, 'Erro ao excluir docente'));
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
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="pdi-page">
        <div className="loading">Carregando docentes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdi-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadTeachers}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdi-page">
      <div className="page-header">
        <h1>Cadastro de Docentes</h1>
        {canManageTeachers && (
          <button className="btn-new-pdi" onClick={() => navigate('/teachers/new')}>
            + Novo Docente
          </button>
        )}
      </div>

      {teachers.length === 0 ? (
        <div className="no-pdis-message">
          <p>👩‍🏫 Nenhum docente cadastrado ainda.</p>
          <p>Clique em "Novo Docente" para começar.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="pdi-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Escola</th>
                <th>Especialidade</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.school_name || '-'}</td>
                  <td>{teacher.specialization || '-'}</td>
                  <td>{formatDate(teacher.updated_at)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-view"
                      onClick={() => navigate(`/teachers/${teacher.id}/view`)}
                      title="Visualizar"
                    >
                      👁️
                    </button>
                    {canManageTeachers && (
                      <button
                        className="btn-action btn-edit"
                        onClick={() => navigate(`/teachers/${teacher.id}/edit`)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}
                    {canManageTeachers && (
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(teacher.id, teacher.name)}
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

export default TeachersPage;
