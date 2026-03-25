import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryAPI } from '../services/api';
import './DiaryPage.css';

// Mapeamento das perguntas (versão resumida para visualização)
const QUESTIONS_MAP = {
  'lanchou': '🍽️ Lanchou',
  'participou_brincadeira': '🎮 Participou atividade coletiva',
  'atencao_professora': '👂 Atenção à professora',
  'interesse_atividades': '✨ Interesse nas atividades',
  'realizou_atividades': '✅ Realizou atividades',
  'uso_banheiro': '🚻 Uso do banheiro',
  'cumpriu_combinados': '🤝 Cumpriu combinados'
};

const QUESTION_KEYS = Object.keys(QUESTIONS_MAP);
const ANSWER_OPTIONS = ['Sim', 'Parcialmente', 'Não'];

const DiaryPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEntries, setStudentEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStudentName, setImportStudentName] = useState('');
  const [previewEntries, setPreviewEntries] = useState([]);
  const [previewWarnings, setPreviewWarnings] = useState([]);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [studentEntries, dateFilter, customDate]);

  const applyDateFilter = () => {
    if (studentEntries.length === 0) {
      setFilteredEntries([]);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = [...studentEntries];

    switch (dateFilter) {
      case 'today':
        filtered = studentEntries.filter(entry => {
          const entryDate = new Date(entry.diary_date);
          return entryDate >= today;
        });
        break;
      
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = studentEntries.filter(entry => {
          const entryDate = new Date(entry.diary_date);
          return entryDate >= weekAgo;
        });
        break;
      
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = studentEntries.filter(entry => {
          const entryDate = new Date(entry.diary_date);
          return entryDate >= monthAgo;
        });
        break;
      
      case 'custom':
        if (customDate) {
          filtered = studentEntries.filter(entry => 
            entry.diary_date === customDate
          );
        }
        break;
      
      case 'all':
      default:
        filtered = studentEntries;
        break;
    }

    setFilteredEntries(filtered);
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await diaryAPI.getStudents();
      setStudents(data);
    } catch (err) {
      setError('Erro ao carregar diários. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewDiary = () => {
    setShowNewDiaryModal(true);
  };

  const handleCreateNewDiary = () => {
    if (newStudentName.trim()) {
      navigate(`/diario/${encodeURIComponent(newStudentName.trim())}/novo`);
    }
  };

  const handleStudentClick = async (studentName) => {
    try {
      const data = await diaryAPI.getStudentEntries(studentName);
      setStudentEntries(data);
      setSelectedStudent(studentName);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar entradas do aluno');
    }
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setStudentEntries([]);
    setFilteredEntries([]);
    setDateFilter('all');
    setCustomDate('');
  };

  const handleNewEntry = () => {
    navigate(`/diario/${encodeURIComponent(selectedStudent)}/novo`);
  };

  const handleFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setCustomDate('');
    }
  };

  const handleCustomDateChange = (date) => {
    setCustomDate(date);
    setDateFilter('custom');
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrada?')) return;
    
    try {
      await diaryAPI.deleteEntry(entryId);
      
      // Recarregar entradas
      const data = await diaryAPI.getStudentEntries(selectedStudent);
      setStudentEntries(data);
      
      // Se não há mais entradas, voltar para lista
      if (data.length === 0) {
        handleBackToList();
        loadStudents();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir entrada');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportStudentName('');
    setPreviewEntries([]);
    setPreviewWarnings([]);
    setPreviewMetadata(null);
    setImportLoading(false);
    setCommitLoading(false);
  };

  const handlePreviewImport = async () => {
    if (!importFile) {
      alert('Selecione um PDF para importar');
      return;
    }

    try {
      setImportLoading(true);
      const result = await diaryAPI.previewPdfImport(importFile, {
        student_name: importStudentName.trim() || undefined,
      });

      setPreviewEntries(result.entries || []);
      setPreviewWarnings(result.warnings || []);
      setPreviewMetadata(result.metadata || null);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar preview de importação.');
    } finally {
      setImportLoading(false);
    }
  };

  const updatePreviewEntry = (index, field, value) => {
    setPreviewEntries((prev) => {
      const cloned = [...prev];
      cloned[index] = {
        ...cloned[index],
        [field]: value,
      };
      return cloned;
    });
  };

  const updatePreviewAnswer = (entryIndex, questionKey, answerValue) => {
    setPreviewEntries((prev) => {
      const cloned = [...prev];
      const currentAnswers = cloned[entryIndex].answers || {};
      cloned[entryIndex] = {
        ...cloned[entryIndex],
        answers: {
          ...currentAnswers,
          [questionKey]: answerValue,
        },
      };
      return cloned;
    });
  };

  const handleSaveImport = async () => {
    if (previewEntries.length === 0) {
      alert('Não há entradas para importar');
      return;
    }

    try {
      setCommitLoading(true);
      const payloadEntries = previewEntries.map((entry) => ({
        student_id: entry.student_id || null,
        student_name: entry.student_name || '',
        diary_date: entry.diary_date || '',
        teachers: Array.isArray(entry.teachers)
          ? entry.teachers
          : String(entry.teachers || '')
              .split(',')
              .map((teacher) => teacher.trim())
              .filter(Boolean),
        answers: entry.answers || {},
        open_obs: entry.open_obs || '',
        status: entry.status || 'draft',
        parse_warnings: entry.parse_warnings || [],
      }));

      const result = await diaryAPI.commitPdfImport(payloadEntries);
      alert(`${result.saved_count || 0} entradas importadas com sucesso!`);
      resetImportModal();
      loadStudents();

      if (selectedStudent) {
        const data = await diaryAPI.getStudentEntries(selectedStudent);
        setStudentEntries(data);
      }
    } catch (err) {
      console.error(err);
      const backendMessage = err?.response?.data?.error;
      alert(backendMessage || 'Erro ao salvar importação.');
    } finally {
      setCommitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="diary-page">
        <div className="loading">Carregando diários...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diary-page">
        <div className="error-message">{error}</div>
        <button onClick={loadStudents} className="retry-button">Tentar Novamente</button>
      </div>
    );
  }

  // View: Student History
  if (selectedStudent) {
    return (
      <div className="diary-page">
        <div className="diary-header">
          <button onClick={handleBackToList} className="back-button">← Voltar</button>
          <h1>Diário de {selectedStudent}</h1>
          <button onClick={handleNewEntry} className="new-entry-button">
            + Nova Entrada
          </button>
        </div>

        {/* Filtros de Data */}
        <div className="date-filters">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              📅 Todo Período
            </button>
            <button 
              className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => handleFilterChange('today')}
            >
              📆 Hoje
            </button>
            <button 
              className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => handleFilterChange('week')}
            >
              📊 Última Semana
            </button>
            <button 
              className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => handleFilterChange('month')}
            >
              📈 Último Mês
            </button>
          </div>
          <div className="custom-date-filter">
            <label htmlFor="customDate">Data específica:</label>
            <input
              type="date"
              id="customDate"
              value={customDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* Contador de resultados */}
        {dateFilter !== 'all' && (
          <div className="filter-results">
            {filteredEntries.length === 0 ? (
              <p>Nenhuma entrada encontrada para este período</p>
            ) : (
              <p>Mostrando {filteredEntries.length} de {studentEntries.length} registros</p>
            )}
          </div>
        )}

        <div className="entries-list">
          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma entrada {dateFilter !== 'all' ? 'para este período' : 'ainda'}</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <h3>📅 {formatDate(entry.diary_date)}</h3>
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="delete-button"
                    title="Excluir entrada"
                  >
                    🗑️
                  </button>
                </div>
                <div className="entry-info">
                  <p><strong>Professor(es):</strong> {entry.teachers.join(', ')}</p>
                  <p><strong>Registrado em:</strong> {formatDate(entry.created_at)}</p>
                </div>
                <div className="entry-answers">
                  <h4>Atividades:</h4>
                  <div className="answers-list">
                    {Object.entries(entry.answers).map(([questionId, answer]) => (
                      <div key={questionId} className="answer-item">
                        <span className="question-text">
                          {QUESTIONS_MAP[questionId] || questionId}
                        </span>
                        <span className={`answer-badge ${answer.toLowerCase()}`}>
                          {answer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {entry.open_obs && (
                  <div className="entry-observations">
                    <h4>Observações:</h4>
                    <p>{entry.open_obs}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // View: Students List
  return (
    <div className="diary-page">
      <div className="diary-header">
        <h1>Diário de Acompanhamento Individual</h1>
        <p>Registros diários de atividades e comportamentos</p>
        <div className="diary-actions">
          <button onClick={() => setShowImportModal(true)} className="import-diary-button">
            ⬆️ Importar PDF
          </button>
          <button onClick={handleNewDiary} className="new-diary-button">
            + Novo Diário
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum diário criado ainda</p>
          <p>Clique em "Novo Diário" para começar</p>
        </div>
      ) : (
        <div className="students-grid">
          {students.map((student) => (
            <div
              key={student.student_name}
              className="student-card"
              onClick={() => handleStudentClick(student.student_name)}
            >
              <div className="student-icon">👤</div>
              <h3>{student.student_name}</h3>
              <div className="student-info">
                <p><strong>Última entrada:</strong> {formatDate(student.last_date)}</p>
                <p><strong>Professor(es):</strong> {student.last_teachers.join(', ')}</p>
                <p><strong>Total de registros:</strong> {student.total_entries}</p>
              </div>
              <button className="view-button">Ver Histórico →</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Diary */}
      {showNewDiaryModal && (
        <div className="modal-overlay" onClick={() => setShowNewDiaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Criar Novo Diário</h2>
            <p>Digite o nome do aluno:</p>
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Nome completo do aluno"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNewDiary()}
            />
            <div className="modal-buttons">
              <button onClick={() => setShowNewDiaryModal(false)} className="cancel-button">
                Cancelar
              </button>
              <button 
                onClick={handleCreateNewDiary} 
                className="confirm-button"
                disabled={!newStudentName.trim()}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={resetImportModal}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Importar Diário em PDF</h2>
            <p>Fluxo sem IA e sem OCR: extração por texto pesquisável + revisão manual.</p>

            <div className="import-config">
              <label>Arquivo PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />

              <label>Nome do aluno (opcional)</label>
              <input
                type="text"
                value={importStudentName}
                onChange={(e) => setImportStudentName(e.target.value)}
                placeholder="Usar para sincronizar com o cadastro"
              />

              <button
                className="confirm-button"
                onClick={handlePreviewImport}
                disabled={importLoading || !importFile}
              >
                {importLoading ? 'Gerando preview...' : 'Gerar Preview'}
              </button>
            </div>

            {previewMetadata && (
              <div className="import-metadata">
                <strong>Resumo:</strong>
                <span> blocos detectados: {previewMetadata.blocks_detected || 0}</span>
                <span> | texto extraível: {previewMetadata.extracted_text ? 'sim' : 'não'}</span>
              </div>
            )}

            {previewWarnings.length > 0 && (
              <div className="import-warnings">
                {previewWarnings.map((warning, index) => (
                  <p key={`preview-warning-${index}`}>⚠️ {warning}</p>
                ))}
              </div>
            )}

            {previewEntries.length > 0 && (
              <div className="preview-list">
                {previewEntries.map((entry, entryIndex) => (
                  <div key={entry.preview_id || entryIndex} className="preview-card">
                    <div className="preview-grid">
                      <div className="form-group">
                        <label>Aluno</label>
                        <input
                          type="text"
                          value={entry.student_name || ''}
                          onChange={(e) => updatePreviewEntry(entryIndex, 'student_name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Data</label>
                        <input
                          type="date"
                          value={entry.diary_date || ''}
                          onChange={(e) => updatePreviewEntry(entryIndex, 'diary_date', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Professores (separar por vírgula)</label>
                        <input
                          type="text"
                          value={(entry.teachers || []).join(', ')}
                          onChange={(e) => updatePreviewEntry(entryIndex, 'teachers', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select
                          value={entry.status || 'draft'}
                          onChange={(e) => updatePreviewEntry(entryIndex, 'status', e.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="final">Final</option>
                        </select>
                      </div>
                    </div>

                    <div className="preview-answers">
                      {QUESTION_KEYS.map((questionKey) => (
                        <div className="preview-answer-item" key={`${entryIndex}-${questionKey}`}>
                          <label>{QUESTIONS_MAP[questionKey]}</label>
                          <select
                            value={entry.answers?.[questionKey] || ''}
                            onChange={(e) => updatePreviewAnswer(entryIndex, questionKey, e.target.value)}
                          >
                            <option value="">Não definido</option>
                            {ANSWER_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label>Observações</label>
                      <textarea
                        rows="3"
                        value={entry.open_obs || ''}
                        onChange={(e) => updatePreviewEntry(entryIndex, 'open_obs', e.target.value)}
                      />
                    </div>

                    {(entry.parse_warnings || []).length > 0 && (
                      <div className="entry-warnings">
                        {entry.parse_warnings.map((warning, warningIndex) => (
                          <p key={`entry-${entryIndex}-warning-${warningIndex}`}>⚠️ {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-buttons">
              <button onClick={resetImportModal} className="cancel-button" disabled={commitLoading}>
                Fechar
              </button>
              <button
                onClick={handleSaveImport}
                className="confirm-button"
                disabled={commitLoading || previewEntries.length === 0}
              >
                {commitLoading ? 'Salvando...' : 'Salvar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryPage;
