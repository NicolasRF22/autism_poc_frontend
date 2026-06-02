import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './DiaryEntry.css';
import { buildAuthenticatedUrl, diaryAPI, studentAPI } from '../services/api';

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

const getEntryLoadErrorMessage = (err) => {
  const status = err?.response?.status;
  const backendMessage = err?.response?.data?.error;

  if (status === 404) {
    return backendMessage || 'Entrada não encontrada para edição.';
  }

  if (status === 403) {
    return backendMessage || 'Você não tem permissão para editar esta entrada.';
  }

  if (status >= 500) {
    return 'Erro interno ao carregar a entrada. Tente novamente em instantes.';
  }

  return backendMessage || 'Erro ao carregar a entrada para edição.';
};

const DiaryEntry = () => {
  const { studentName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStudentId = queryParams.get('studentId') || '';
  const entryIdParam = queryParams.get('entryId') || '';
  const isEditMode = Boolean(entryIdParam);
  
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [diaryDate, setDiaryDate] = useState('');
  const [answers, setAnswers] = useState({});
  const [openObs, setOpenObs] = useState('');
  const [attendance, setAttendance] = useState('presente');
  const [absenceReason, setAbsenceReason] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [resolvedStudentId, setResolvedStudentId] = useState(initialStudentId);
  const [resolvedStudentName, setResolvedStudentName] = useState(studentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeAnswerValue = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const normalized = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (normalized === 'sim') return 'Sim';
    if (normalized === 'nao') return 'Não';
    if (normalized === 'parcialmente') return 'Parcialmente';
    return raw;
  };

  const normalizeAnswersMap = (value) => {
    if (!value || typeof value !== 'object') return {};
    return Object.entries(value).reduce((acc, [key, answer]) => {
      acc[key] = normalizeAnswerValue(answer);
      return acc;
    }, {});
  };

  const buildReturnUrl = () => {
    const params = new URLSearchParams();
    if (resolvedStudentName) params.set('student', resolvedStudentName);
    if (resolvedStudentId) params.set('studentId', resolvedStudentId);
    const query = params.toString();
    return query ? `/diario?${query}` : '/diario';
  };

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
    loadLinkedTeachers();

    if (!isEditMode) {
      const today = new Date().toISOString().split('T')[0];
      setDiaryDate(today);
    }
  }, [resolvedStudentId, studentName, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadEntry = async () => {
      try {
        setLoading(true);
        const entry = await diaryAPI.getEntry(entryIdParam);
        setResolvedStudentId(entry?.student_id || initialStudentId);
        setResolvedStudentName(entry?.student_name || studentName);
        setDiaryDate(entry?.diary_date || '');
        setTeachers(Array.isArray(entry?.teachers) ? entry.teachers : []);
        setAnswers(normalizeAnswersMap(entry?.answers));
        setOpenObs(entry?.open_obs || '');
        setAttendance(entry?.attendance || 'presente');
        setAbsenceReason(entry?.absence_explanation || '');

        const images = await diaryAPI.listEntryImages(entryIdParam);
        setExistingImages(Array.isArray(images) ? images : []);
      } catch (err) {
        console.error('Erro ao carregar entrada:', err);
        setError(getEntryLoadErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [entryIdParam, isEditMode, initialStudentId, studentName]);

  const loadLinkedTeachers = async () => {
    try {
      if (!resolvedStudentId) {
        setAvailableTeachers([]);
        setTeachers([]);
        return;
      }

      const student = await studentAPI.getStudent(resolvedStudentId);
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

  const handleAttendanceChange = (value) => {
    setAttendance(value);
    if (value !== 'falta_justificada') {
      setAbsenceReason('');
    }

    if (value !== 'presente') {
      setImageFiles([]);
      setExistingImages([]);
    }
  };

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      alert('Apenas arquivos de imagem são permitidos');
    }

    if (validFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const openPreview = (url, title = 'Imagem') => {
    setPreviewImage(url);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewTitle('');
  };

  const handleRemoveImage = (index) => {
    setImageFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resolvedStudentId) {
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
    
    // Verificar se todas as perguntas foram respondidas quando presente
    if (attendance === 'presente') {
      const unanswered = QUESTIONS.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        alert('Por favor, responda todas as perguntas');
        return;
      }
    }

    if (!attendance) {
      alert('Selecione Presente / Falta Justificada / Falta Injustificada');
      return;
    }

    if (attendance === 'falta_justificada' && !absenceReason.trim()) {
      alert('Explique o motivo da falta justificada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let entryId = entryIdParam;

      if (isEditMode) {
        await diaryAPI.updateEntry(entryIdParam, {
          student_id: resolvedStudentId,
          student_name: resolvedStudentName,
          teachers: teachers,
          diary_date: diaryDate,
          answers: attendance === 'presente' ? answers : {},
          open_obs: attendance === 'presente' ? openObs : '',
          attendance: attendance,
          absence_explanation: attendance === 'falta_justificada' ? absenceReason : ''
        });
      } else {
        const created = await diaryAPI.createEntry({
          student_id: resolvedStudentId,
          student_name: resolvedStudentName,
          teachers: teachers,
          diary_date: diaryDate,
          answers: attendance === 'presente' ? answers : {},
          open_obs: attendance === 'presente' ? openObs : '',
          attendance: attendance,
          absence_explanation: attendance === 'falta_justificada' ? absenceReason : ''
        });
        entryId = created?.entry?.id || created?.id || '';
      }

      if (entryId && imageFiles.length > 0) {
        try {
          await diaryAPI.uploadEntryImages(entryId, imageFiles);
        } catch (uploadErr) {
          alert('Entrada salva, mas houve erro ao enviar as imagens.');
        }
      }

      alert(isEditMode ? 'Entrada atualizada com sucesso!' : 'Entrada de diário salva com sucesso!');
      navigate(buildReturnUrl());
    } catch (err) {
      console.error(err);
      const backendMessage = err?.response?.data?.error;
      setError(backendMessage || 'Erro ao salvar entrada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(buildReturnUrl());
  };

  return (
    <div className="diary-entry-page">
      <div className="entry-header">
        <h1>{isEditMode ? '✏️ Editar Entrada do Diário' : '📖 Diário de Acompanhamento Individual'}</h1>
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
              value={resolvedStudentName}
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

          <div className="form-group">
            <label>Presenca do aluno:</label>
            <div className="attendance-options">
              <label className={`attendance-option ${attendance === 'presente' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="attendance"
                  value="presente"
                  checked={attendance === 'presente'}
                  onChange={() => handleAttendanceChange('presente')}
                />
                Presente
              </label>
              <label className={`attendance-option ${attendance === 'falta_justificada' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="attendance"
                  value="falta_justificada"
                  checked={attendance === 'falta_justificada'}
                  onChange={() => handleAttendanceChange('falta_justificada')}
                />
                Falta Justificada
              </label>
              <label className={`attendance-option ${attendance === 'falta_injustificada' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="attendance"
                  value="falta_injustificada"
                  checked={attendance === 'falta_injustificada'}
                  onChange={() => handleAttendanceChange('falta_injustificada')}
                />
                Falta Injustificada
              </label>
            </div>

            {attendance === 'falta_justificada' && (
              <div className="attendance-reason">
                <label className="question-label">Motivo da falta justificada:</label>
                <textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  rows="3"
                  placeholder="Descreva o motivo da falta..."
                  className="observations-textarea"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {attendance === 'presente' && (
          <>
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
          </>
        )}

        {attendance === 'presente' && (
          <div className="form-section">
            <h2>Anexar imagens</h2>
            <div className="image-upload">
              <label className="image-upload-button">
                Selecionar imagens
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelection}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="image-upload-hint">Formatos aceitos: JPG, PNG, GIF, WEBP.</span>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={previewUrl} className="image-preview-item">
                    <button
                      type="button"
                      className="image-preview-button"
                      onClick={() => openPreview(previewUrl, `Imagem ${index + 1}`)}
                    >
                      <img src={previewUrl} alt={`Imagem ${index + 1}`} />
                    </button>
                    <button
                      type="button"
                      className="image-remove-button"
                      onClick={() => handleRemoveImage(index)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {existingImages.length > 0 && (
              <div className="image-preview-grid existing-images">
                {existingImages.map((image) => {
                  const viewUrl = buildAuthenticatedUrl(image.view_url);
                  return (
                    <div key={image.image_id} className="image-preview-item">
                      <button
                        type="button"
                        className="image-preview-button"
                        onClick={() => openPreview(viewUrl, image.file_name)}
                      >
                        <img src={viewUrl} alt={image.file_name} />
                      </button>
                      <span className="image-file-name">{image.file_name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {attendance === 'presente' && (
          <>
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
          </>
        )}

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
            {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Entrada')}
          </button>
        </div>
      </form>

      {previewImage && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div className="image-preview-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="image-preview-modal-header">
              <h3>{previewTitle}</h3>
              <button type="button" onClick={closePreview}>
                ✕
              </button>
            </div>
            <img src={previewImage} alt={previewTitle} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryEntry;
