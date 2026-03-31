import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdiAPI, studentAPI } from '../services/api';
import './PDIPage.css';

const PDIPage = () => {
  const [pdis, setPdis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPDIModal, setShowNewPDIModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableStudentsError, setAvailableStudentsError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const navigate = useNavigate();

  const normalizeName = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

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

  const loadAvailableStudents = async () => {
    setAvailableStudentsError('');

    try {
      const data = await pdiAPI.getAvailableStudents();
      setAvailableStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      try {
        const [allStudents, allPdis] = await Promise.all([
          studentAPI.getAllStudents(),
          pdiAPI.getAllPDIs(),
        ]);

        const usedIds = new Set(
          (allPdis || [])
            .map((pdi) => String(pdi?.student_id || '').trim())
            .filter(Boolean)
        );
        const usedNames = new Set(
          (allPdis || [])
            .map((pdi) => normalizeName(pdi?.student_name))
            .filter(Boolean)
        );

        const eligible = (allStudents || []).filter((student) => {
          const studentId = String(student?.id || '').trim();
          const studentName = normalizeName(student?.name || student?.studentName);
          if (studentId && usedIds.has(studentId)) return false;
          if (studentName && usedNames.has(studentName)) return false;
          return true;
        });

        setAvailableStudents(eligible);
      } catch (fallbackErr) {
        console.error('Erro ao carregar alunos elegíveis para PDI:', fallbackErr);
        setAvailableStudents([]);
        setAvailableStudentsError('Não foi possível carregar alunos elegíveis para novo PDI.');
      }
    }
  };

  const handleNewPDI = async () => {
    await loadAvailableStudents();
    setSelectedStudentId('');
    setShowNewPDIModal(true);
  };

  const handleCreateNewPDI = () => {
    const selected = availableStudents.find((student) => student.id === selectedStudentId);
    if (!selected) return;

    navigate(`/pdi/novo?studentId=${encodeURIComponent(selected.id)}`);
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

      {showNewPDIModal && (
        <div className="modal-overlay" onClick={() => setShowNewPDIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Criar Novo PDI</h2>
            <p>Selecione um aluno cadastrado sem PDI:</p>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              autoFocus
            >
              <option value="">Selecione um aluno</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            {!availableStudentsError && availableStudents.length === 0 && (
              <p>Todos os alunos cadastrados já possuem PDI.</p>
            )}
            {availableStudentsError && <p>{availableStudentsError}</p>}

            <div className="modal-buttons">
              <button onClick={() => setShowNewPDIModal(false)} className="cancel-button">
                Cancelar
              </button>
              <button
                onClick={handleCreateNewPDI}
                className="confirm-button"
                disabled={!selectedStudentId}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDIPage;
