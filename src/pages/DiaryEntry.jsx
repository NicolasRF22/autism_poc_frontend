import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './DiaryEntry.css';
import { diaryAPI, studentAPI } from '../services/api';

const QUESTIONS = [
  { id: 'lanchou', text: 'Lanchou?' },
  { id: 'participou_brincadeira', text: 'Participou da brincadeira/atividade coletiva?' },
  { id: 'atencao_professora', text: 'Deu atenção à fala da professora?' },
  { id: 'interesse_atividades', text: 'Demonstrou interesse para as atividades?' },
  { id: 'realizou_atividades', text: 'Realizou as atividades propostas?' },
  { id: 'uso_banheiro', text: 'Fez uso do banheiro?' },
  { id: 'cumpriu_combinados', text: 'Cumpriu os combinados?' }
];

const ANSWER_OPTIONS = ['Sim', 'Não', 'Parcialmente'];

const DiaryEntry = () => {
  const { studentName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = new URLSearchParams(location.search).get('studentId') || '';
  
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [diaryDate, setDiaryDate] = useState('');
  const [answers, setAnswers] = useState({});
  const [openObs, setOpenObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeArrayField = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\n|,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const extractTeachersFromStudent = (student) => {
    const direct = normalizeArrayField(student?.teachers || student?.docentes);
    if (direct.length > 0) return Array.from(new Set(direct));

    const fallback = [student?.teacher_name, student?.teacherName]
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    return Array.from(new Set(fallback));
  };

  useEffect(() => {
    // Carregar docentes vinculados ao pré-cadastro do aluno
    loadLinkedTeachers();
    
    // Definir data de hoje como padrão
    const today = new Date().toISOString().split('T')[0];
    setDiaryDate(today);
  }, [studentName, studentId]);

  const loadLinkedTeachers = async () => {
    try {
      if (!studentId) {
        setAvailableTeachers([]);
        setTeachers([]);
        return;
      }

      const student = await studentAPI.getStudent(studentId);
      const linkedTeachers = extractTeachersFromStudent(student);
      setAvailableTeachers(linkedTeachers);

      if (linkedTeachers.length > 0) {
        setTeachers([linkedTeachers[0]]);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error('Erro ao carregar docentes vinculados:', err);
      setAvailableTeachers([]);
      setTeachers([]);
    }
  };

  const handleTeacherSelectionChange = (event) => {
    const selected = Array.from(event.target.selectedOptions || []).map((option) => option.value);
    setTeachers(selected);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentId) {
      alert('Este diário ainda não está vinculado ao cadastro do aluno. Volte e selecione um aluno cadastrado para continuar.');
      return;
    }

    if (availableTeachers.length === 0) {
      alert('Este aluno não possui docentes vinculados no pré-cadastro. Atualize o pré-cadastro do aluno para continuar.');
      return;
    }
    
    // Validação
    if (teachers.length === 0) {
      alert('Selecione pelo menos um docente vinculado');
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
      await diaryAPI.createEntry({
        student_id: studentId,
        student_name: studentName,
        teachers: teachers,
        diary_date: diaryDate,
        answers: answers,
        open_obs: openObs
      });

      alert('Entrada de diário salva com sucesso!');
      navigate('/diario');
    } catch (err) {
      console.error(err);
      const backendMessage = err?.response?.data?.error;
      setError(backendMessage || 'Erro ao salvar entrada. Tente novamente.');
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
            <label>Docente(s) vinculado(s):</label>
            <div className="teachers-container">
              {availableTeachers.length > 0 ? (
                <>
                  <select
                    multiple
                    value={teachers}
                    onChange={handleTeacherSelectionChange}
                    className="teachers-select"
                    size={Math.min(Math.max(availableTeachers.length, 3), 6)}
                  >
                    {availableTeachers.map((teacher) => (
                      <option key={teacher} value={teacher}>
                        {teacher}
                      </option>
                    ))}
                  </select>
                  <small className="teachers-help">Segure Ctrl (Windows) para selecionar mais de um docente.</small>
                </>
              ) : (
                <div className="no-teachers-warning">
                  ⚠️ Nenhum docente vinculado ao aluno no pré-cadastro.
                </div>
              )}
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
