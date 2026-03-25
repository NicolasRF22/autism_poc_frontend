import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DiaryEntry.css';
import { API_BASE_URL } from '../services/api';

const QUESTIONS = [
  { id: 'lanchou', text: 'Lanchou?' },
  { id: 'participou_brincadeira', text: 'Participou da brincadeira/atividade coletiva?' },
  { id: 'atencao_professora', text: 'Deu atenção à fala da professora?' },
  { id: 'interesse_atividades', text: 'Demonstrou interesse para as atividades?' },
  { id: 'realizou_atividades', text: 'Realizou as atividades propostas?' },
  { id: 'uso_banheiro', text: 'Fez uso do banheiro?' },
  { id: 'cumpriu_combinados', text: 'Cumpriu os combinados?' }
];

const ANSWER_OPTIONS = ['Sim', 'Parcialmente', 'Não'];

const DiaryEntry = () => {
  const { studentName } = useParams();
  const navigate = useNavigate();
  
  const [teachers, setTeachers] = useState([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [diaryDate, setDiaryDate] = useState('');
  const [answers, setAnswers] = useState({});
  const [openObs, setOpenObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carregar professores anteriores se o aluno já tiver diário
    loadLastTeachers();
    
    // Definir data de hoje como padrão
    const today = new Date().toISOString().split('T')[0];
    setDiaryDate(today);
  }, [studentName]);

  const loadLastTeachers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/diary/last-teachers/${encodeURIComponent(studentName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.teachers && data.teachers.length > 0) {
          setTeachers(data.teachers);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar professores anteriores:', err);
    }
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (teacherInput.trim() && !teachers.includes(teacherInput.trim())) {
      setTeachers([...teachers, teacherInput.trim()]);
      setTeacherInput('');
    }
  };

  const handleRemoveTeacher = (teacherToRemove) => {
    setTeachers(teachers.filter(t => t !== teacherToRemove));
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (teachers.length === 0) {
      alert('Adicione pelo menos um professor');
      return;
    }
    
    if (!diaryDate) {
      alert('Selecione a data do registro');
      return;
    }
    
    // Verificar se todas as perguntas foram respondidas
    const unanswered = QUESTIONS.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert('Por favor, responda todas as perguntas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/diary/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_name: studentName,
          teachers: teachers,
          diary_date: diaryDate,
          answers: answers,
          open_obs: openObs
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar entrada');
      }

      alert('Entrada de diário salva com sucesso!');
      navigate('/diario');
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar entrada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/diario');
  };

  return (
    <div className="diary-entry-page">
      <div className="entry-header">
        <h1>📖 Diário de Acompanhamento Individual</h1>
        <button onClick={handleCancel} className="back-link">
          ← Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="diary-form">
        {/* Cabeçalho do Formulário */}
        <div className="form-section">
          <h2>Informações do Registro</h2>
          
          <div className="form-group">
            <label>Aluno:</label>
            <input
              type="text"
              value={studentName}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Professor(a):</label>
            <div className="teachers-container">
              <div className="teachers-tags">
                {teachers.map((teacher, index) => (
                  <span key={index} className="teacher-tag">
                    {teacher}
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(teacher)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="add-teacher">
                <input
                  type="text"
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  placeholder="Nome do professor"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTeacher(e)}
                />
                <button
                  type="button"
                  onClick={handleAddTeacher}
                  className="add-button"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Dia Letivo:</label>
            <input
              type="date"
              value={diaryDate}
              onChange={(e) => setDiaryDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Perguntas de Atividade */}
        <div className="form-section">
          <h2>ATIVIDADE</h2>
          
          {QUESTIONS.map((question) => (
            <div key={question.id} className="question-group">
              <label className="question-label">{question.text}</label>
              <div className="answer-options">
                {ANSWER_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`option-button ${answers[question.id] === option ? 'selected' : ''} ${option.toLowerCase()}`}
                    onClick={() => handleAnswerChange(question.id, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Observações Abertas */}
        <div className="form-section">
          <h2>Observações</h2>
          <label className="question-label">
            Registrar se o aluno apresentou crise, birra ou outro comportamento distinto dos mencionados anteriormente:
          </label>
          <textarea
            value={openObs}
            onChange={(e) => setOpenObs(e.target.value)}
            rows="5"
            placeholder="Descreva aqui qualquer comportamento adicional observado..."
            className="observations-textarea"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiaryEntry;
