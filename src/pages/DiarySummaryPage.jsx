import React, { useEffect, useMemo, useState } from 'react';
import { diarySummaryAPI, getStoredUser, ragAPI } from '../services/api';
import './DiaryEntry.css';
import './DiaryPage.css';
import './TesteRAG.css';
import './DiarySummaryPage.css';

const PROMPT_SCOPE = 'diary_summary';

const KICKOFF_MESSAGE = 'Gere um resumo deste período com base nas entradas selecionadas.';

const SAVED_SUMMARY_PREVIEW_LENGTH = 220;

const truncateText = (text, maxLength) => {
  const value = text || '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}…`;
};

// Sempre monta/lê datas a partir dos componentes locais (ano/mês/dia) em vez de
// new Date(string)/toISOString() — evita o desvio de 1 dia que ocorre em fusos
// negativos (ex.: Brasil, UTC-3) quando se mistura parsing UTC com leitura local.
const parseISODateLocal = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatISODateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => formatISODateLocal(new Date());

// Semana: sempre começa no domingo da semana atual e vai até hoje — por isso a
// quantidade de dias varia conforme o dia em que a página é acessada (1 a 7 dias).
const getSundayOfCurrentWeek = (todayStr) => {
  const date = parseISODateLocal(todayStr);
  date.setDate(date.getDate() - date.getDay());
  return formatISODateLocal(date);
};

// Mês: sempre o mesmo dia do mês anterior até hoje (não é "30 dias corridos" fixo).
// Se o dia não existir no mês anterior (ex.: 31 em fevereiro), cai no último dia dele.
const subtractOneMonth = (dateStr) => {
  const date = parseISODateLocal(dateStr);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() - 1);
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }
  return formatISODateLocal(date);
};

const computeRange = (preset, customStart, customEnd) => {
  const today = getTodayDateString();
  if (preset === 'week') return { start: getSundayOfCurrentWeek(today), end: today };
  if (preset === 'month') return { start: subtractOneMonth(today), end: today };
  if (preset === 'custom') return { start: customStart || '', end: customEnd || '' };
  return { start: '', end: '' };
};

const formatDateBR = (value) => {
  if (!value) return '—';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const entryKey = (entry) => `${entry.type}::${entry.id}`;

const DiarySummaryPage = () => {
  const currentUser = getStoredUser();
  const role = currentUser?.role || '';

  const [periodPreset, setPeriodPreset] = useState('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = useMemo(() => computeRange(periodPreset, customStart, customEnd), [periodPreset, customStart, customEnd]);
  const hasValidRange = Boolean(range.start && range.end);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // 'escolar' | 'familiar' | 'ambos' — controla quais entradas aparecem na seção 4
  // e quais tipos entram no resumo (e, por consequência, como o resumo salvo fica
  // rotulado depois como fonte no chat: "Resumo Diário Individual"/"...Familiar").
  const [sourceType, setSourceType] = useState('ambos');

  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedEntryKeys, setSelectedEntryKeys] = useState(new Set());

  const [instructionPrompt, setInstructionPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptResetting, setPromptResetting] = useState(false);
  const [promptUpdatedAt, setPromptUpdatedAt] = useState(null);
  const [promptIsCustom, setPromptIsCustom] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptOptions, setPromptOptions] = useState([]);
  const [promptSelectedId, setPromptSelectedId] = useState('');
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptDraft, setPromptDraft] = useState('');
  const [promptInitialState, setPromptInitialState] = useState({ id: '', name: '', description: '', content: '' });

  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [savedSummaries, setSavedSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [savingMessageIndex, setSavingMessageIndex] = useState(null);
  const [viewingSummary, setViewingSummary] = useState(null);

  useEffect(() => {
    if (!hasValidRange) {
      setStudents([]);
      return;
    }
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');
        const list = await diarySummaryAPI.getStudents(range.start, range.end);
        setStudents(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar alunos do período.');
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
    setSelectedStudentId('');
  }, [range.start, range.end, hasValidRange]);

  const updatePromptFormFromPrompt = (prompt) => {
    const safePrompt = prompt || {};
    setPromptSelectedId(safePrompt.id || '');
    setPromptName(safePrompt.name || '');
    setPromptDescription(safePrompt.description || '');
    setPromptDraft(safePrompt.content || '');
    setPromptInitialState({
      id: safePrompt.id || '',
      name: safePrompt.name || '',
      description: safePrompt.description || '',
      content: safePrompt.content || '',
    });
  };

  const findPromptOption = (promptId) => promptOptions.find((item) => item.id === promptId) || null;

  const resetPromptForm = () => {
    const selected = promptOptions.find((item) => item.id === promptSelectedId)
      || promptOptions.find((item) => item.is_active)
      || promptOptions[0]
      || null;
    updatePromptFormFromPrompt(selected);
  };

  const loadDiarySummaryPrompt = async () => {
    setPromptLoading(true);
    try {
      const data = await ragAPI.getDiarySummaryPrompt();
      const prompts = Array.isArray(data?.available_prompts) ? data.available_prompts : [];
      const selectedPrompt = prompts.find((item) => item.id === data?.current_prompt_id)
        || prompts.find((item) => item.is_active)
        || prompts[0]
        || null;
      const promptText = selectedPrompt?.content || data?.prompt || '';

      setPromptOptions(prompts);
      setInstructionPrompt(promptText);
      setPromptUpdatedAt(selectedPrompt?.updated_at || data?.updated_at || null);
      setPromptIsCustom(Boolean(data?.is_custom));
      updatePromptFormFromPrompt(selectedPrompt);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar o prompt de instrução.');
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    loadDiarySummaryPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPrompt = async ({ promptId, name, description, content, activate = false }) => {
    const payload = {
      scope: PROMPT_SCOPE,
      name: name.trim(),
      description: description.trim(),
      content: content.trim(),
      activate,
    };
    if (promptId) {
      return ragAPI.updatePrompt(promptId, payload);
    }
    return ragAPI.createPrompt(payload);
  };

  const promptDirty = JSON.stringify(promptInitialState) !== JSON.stringify({
    id: promptSelectedId,
    name: promptName,
    description: promptDescription,
    content: promptDraft,
  });

  const handleSavePrompt = async () => {
    if (!promptDraft.trim() || !promptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }
    setPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        promptId: promptSelectedId,
        name: promptName,
        description: promptDescription,
        content: promptDraft,
        activate: false,
      });
      await loadDiarySummaryPrompt();
      if (prompt?.id && !prompt?.is_active) {
        updatePromptFormFromPrompt(prompt);
      }
      alert('Prompt salvo com sucesso.');
    } catch (err) {
      alert('Erro ao salvar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptSaving(false);
    }
  };

  const handleUsePrompt = async () => {
    if (!promptDraft.trim() || !promptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }
    setPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        promptId: promptSelectedId,
        name: promptName,
        description: promptDescription,
        content: promptDraft,
        activate: true,
      });
      if (prompt?.id) {
        await ragAPI.activatePrompt(prompt.id);
      }
      await loadDiarySummaryPrompt();
      setPromptModalOpen(false);
      alert('Prompt ativado com sucesso.');
    } catch (err) {
      alert('Erro ao ativar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptSaving(false);
    }
  };

  const handleNewPrompt = () => {
    setPromptSelectedId('');
    setPromptName('');
    setPromptDescription('');
    setPromptDraft('');
    setPromptInitialState({ id: '', name: '', description: '', content: '' });
  };

  const handleDeletePrompt = async () => {
    if (!promptSelectedId) return;
    const selected = findPromptOption(promptSelectedId);
    if (selected?.is_default) {
      alert('O prompt base não pode ser removido.');
      return;
    }
    if (!window.confirm('Excluir este prompt?')) return;
    setPromptResetting(true);
    try {
      await ragAPI.deletePrompt(promptSelectedId);
      await loadDiarySummaryPrompt();
      alert('Prompt excluído com sucesso.');
    } catch (err) {
      alert('Erro ao excluir prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptResetting(false);
    }
  };

  const handleResetPrompt = async () => {
    if (!window.confirm('Restaurar o prompt atual para o prompt base salvo?')) return;
    setPromptResetting(true);
    try {
      await ragAPI.resetDiarySummaryPrompt();
      await loadDiarySummaryPrompt();
      alert('Prompt restaurado para a versão base.');
    } catch (err) {
      alert('Erro ao restaurar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptResetting(false);
    }
  };

  const handleOpenPromptModal = () => {
    resetPromptForm();
    setPromptModalOpen(true);
  };

  const handleClosePromptModal = () => {
    resetPromptForm();
    setPromptModalOpen(false);
  };

  const startNewConversation = () => {
    setSessionId(crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    setMessages([]);
  };

  useEffect(() => {
    if (!selectedStudentId || !hasValidRange) {
      setEntries([]);
      setSavedSummaries([]);
      return;
    }

    const loadEntries = async () => {
      try {
        setLoadingEntries(true);
        setError('');
        const list = await diarySummaryAPI.getEntries(selectedStudentId, range.start, range.end);
        setEntries(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar entradas do período.');
      } finally {
        setLoadingEntries(false);
      }
    };
    loadEntries();
    startNewConversation();
    loadSavedSummaries(selectedStudentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, range.start, range.end]);

  // Sempre que a lista de entradas mudar (aluno/período novo) ou a fonte escolhida
  // mudar (escolar/familiar/ambos), reseta a seleção pra "tudo marcado, só do(s)
  // tipo(s) escolhido(s)" — opt-out dentro do que estiver visível.
  useEffect(() => {
    const visible = entries.filter((entry) => sourceType === 'ambos' || entry.type === sourceType);
    setSelectedEntryKeys(new Set(visible.map(entryKey)));
  }, [entries, sourceType]);

  const loadSavedSummaries = async (studentId) => {
    try {
      setLoadingSummaries(true);
      const list = await diarySummaryAPI.getSummaries(studentId);
      setSavedSummaries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const toggleEntry = (key) => {
    setSelectedEntryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showSchoolEntries = sourceType === 'escolar' || sourceType === 'ambos';
  const showFamilyEntries = sourceType === 'familiar' || sourceType === 'ambos';
  const schoolEntries = showSchoolEntries ? entries.filter((e) => e.type === 'escolar') : [];
  const familyEntries = showFamilyEntries ? entries.filter((e) => e.type === 'familiar') : [];

  const selectedEntryRefs = () =>
    entries
      .filter((e) => selectedEntryKeys.has(entryKey(e)))
      .map((e) => ({ type: e.type, id: e.id, date: e.date }));

  const handleSend = async (overrideMessage) => {
    const text = (overrideMessage ?? chatInput).trim();
    if (!text) return;
    if (!selectedStudentId) {
      alert('Selecione um aluno.');
      return;
    }

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      setSessionId(currentSessionId);
    }

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setSending(true);
    setError('');

    try {
      const result = await diarySummaryAPI.sendMessage({
        studentId: selectedStudentId,
        sessionId: currentSessionId,
        instructionPrompt,
        message: text,
        entryIds: selectedEntryRefs(),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result?.response || '' }]);
    } catch (err) {
      console.error(err);
      const backendMessage = err?.response?.data?.error;
      setError(backendMessage || 'Erro ao consultar a IA. Tente novamente.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleSaveSummary = async (messageIndex) => {
    const message = messages[messageIndex];
    if (!message || message.role !== 'assistant') return;

    setSavingMessageIndex(messageIndex);
    try {
      await diarySummaryAPI.saveSummary({
        studentId: selectedStudentId,
        periodStart: range.start,
        periodEnd: range.end,
        summaryText: message.content,
        sourceEntries: selectedEntryRefs(),
      });
      await loadSavedSummaries(selectedStudentId);
      alert('Resumo salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar resumo. Tente novamente.');
    } finally {
      setSavingMessageIndex(null);
    }
  };

  const handleDeleteSummary = async (summaryId) => {
    if (!window.confirm('Remover este resumo salvo?')) return;
    try {
      await diarySummaryAPI.deleteSummary(summaryId);
      await loadSavedSummaries(selectedStudentId);
    } catch {
      alert('Erro ao remover resumo. Tente novamente.');
    }
  };

  const canDeleteSummary = (summary) => role === 'admin' || summary.author_user_id === currentUser?.id;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="diary-summary-page">
      <div className="diary-summary-header">
        <h1>Resumo Diário</h1>
        <p>Gere e salve resumos de período a partir das entradas do diário escolar e familiar.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-section diary-summary-period">
        <h2>1. Período</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${periodPreset === 'week' ? 'active' : ''}`}
            onClick={() => setPeriodPreset('week')}
          >
            📊 Semana Atual
          </button>
          <button
            className={`filter-btn ${periodPreset === 'month' ? 'active' : ''}`}
            onClick={() => setPeriodPreset('month')}
          >
            📈 Último Mês
          </button>
          <button
            className={`filter-btn ${periodPreset === 'custom' ? 'active' : ''}`}
            onClick={() => setPeriodPreset('custom')}
          >
            🗓️ Personalizado
          </button>
        </div>
        {periodPreset === 'custom' && (
          <div className="custom-date-filter">
            <label>Período:</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span className="date-range-separator">até</span>
            <input type="date" value={customEnd} min={customStart || undefined} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        )}
        {hasValidRange && (
          <p className="diary-summary-period-label">
            Período selecionado: <strong>{formatDateBR(range.start)} até {formatDateBR(range.end)}</strong>
          </p>
        )}
      </div>

      {hasValidRange && (
        <div className="form-section">
          <h2>2. Aluno</h2>
          {loadingStudents ? (
            <p>Carregando alunos...</p>
          ) : students.length === 0 ? (
            <p>Nenhum aluno com entradas de diário nesse período.</p>
          ) : (
            <div className="diary-summary-student-grid">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={`diary-summary-student-card ${selectedStudentId === student.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <strong>{student.name}</strong>
                  <span>{student.school_name}</span>
                  <span className="diary-summary-student-counts">
                    📖 {student.school_entries_count} escolar(es) · 👨‍👩‍👧 {student.family_entries_count} familiar(es)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedStudentId && (
        <>
          <div className="form-section">
            <h2>3. Fonte</h2>
            <div className="filter-buttons">
              <button
                type="button"
                className={`filter-btn ${sourceType === 'escolar' ? 'active' : ''}`}
                onClick={() => setSourceType('escolar')}
              >
                📖 Diário Escolar
              </button>
              <button
                type="button"
                className={`filter-btn ${sourceType === 'familiar' ? 'active' : ''}`}
                onClick={() => setSourceType('familiar')}
              >
                👨‍👩‍👧 Diário Familiar
              </button>
              <button
                type="button"
                className={`filter-btn ${sourceType === 'ambos' ? 'active' : ''}`}
                onClick={() => setSourceType('ambos')}
              >
                📚 Ambos
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>4. Entradas a considerar</h2>
            {loadingEntries ? (
              <p>Carregando entradas...</p>
            ) : schoolEntries.length === 0 && familyEntries.length === 0 ? (
              <p>Nenhuma entrada {sourceType !== 'ambos' ? 'dessa fonte ' : ''}nesse período.</p>
            ) : (
              <div className="diary-summary-entries">
                {schoolEntries.length > 0 && (
                  <div className="diary-summary-entry-group">
                    <h3>📖 Diário Escolar</h3>
                    {schoolEntries.map((entry) => (
                      <label key={entryKey(entry)} className="diary-summary-entry-item">
                        <input
                          type="checkbox"
                          checked={selectedEntryKeys.has(entryKey(entry))}
                          onChange={() => toggleEntry(entryKey(entry))}
                        />
                        <span className="diary-summary-entry-date">{formatDateBR(entry.date)}</span>
                        <span className="diary-summary-entry-preview">{entry.preview}</span>
                        <span className="diary-summary-entry-author">{entry.author_name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {familyEntries.length > 0 && (
                  <div className="diary-summary-entry-group">
                    <h3>👨‍👩‍👧 Diário Familiar</h3>
                    {familyEntries.map((entry) => (
                      <label key={entryKey(entry)} className="diary-summary-entry-item">
                        <input
                          type="checkbox"
                          checked={selectedEntryKeys.has(entryKey(entry))}
                          onChange={() => toggleEntry(entryKey(entry))}
                        />
                        <span className="diary-summary-entry-date">{formatDateBR(entry.date)}</span>
                        <span className="diary-summary-entry-preview">{entry.preview}</span>
                        <span className="diary-summary-entry-author">{entry.author_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>5. Prompt de instrução</h2>
            {promptLoading ? (
              <p className="pei-prompt-loading">Carregando prompt...</p>
            ) : (
              <>
                <p className="pei-prompt-meta">
                  {promptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                  {promptUpdatedAt ? ` · Atualizado em ${new Date(promptUpdatedAt).toLocaleString('pt-BR')}` : ''}
                </p>
                <button type="button" className="save-prompt-btn" onClick={handleOpenPromptModal}>
                  Visualizar / Editar Prompt
                </button>
                <small className="image-upload-hint diary-summary-prompt-hint">
                  Esse prompt vai junto com as entradas selecionadas como contexto da IA. Você pode salvar mais de
                  um prompt e reaproveitar depois — mudanças só valem numa conversa nova ("🔄 Nova conversa").
                </small>
              </>
            )}
          </div>

          <div className="form-section diary-summary-chat-section">
            <div className="diary-summary-chat-header">
              <h2>6. Chat</h2>
              <button type="button" className="back-link" onClick={startNewConversation}>
                🔄 Nova conversa
              </button>
            </div>

            {messages.length === 0 && (
              <button type="button" className="new-diary-button" onClick={() => handleSend(KICKOFF_MESSAGE)} disabled={sending}>
                📝 Gerar resumo do período
              </button>
            )}

            <div className="diary-summary-chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`diary-summary-chat-bubble ${message.role}`}>
                  <div className="diary-summary-chat-bubble-content">{message.content}</div>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      className="diary-summary-save-response-btn"
                      onClick={() => handleSaveSummary(index)}
                      disabled={savingMessageIndex === index}
                    >
                      {savingMessageIndex === index ? 'Salvando...' : '💾 Salvar resposta'}
                    </button>
                  )}
                </div>
              ))}
              {sending && <div className="diary-summary-chat-bubble assistant loading">Pensando...</div>}
            </div>

            <div className="diary-summary-chat-input">
              <textarea
                rows="2"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva uma mensagem (ex.: 'deixe o resumo mais curto')..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button type="button" className="submit-button" onClick={() => handleSend()} disabled={sending || !chatInput.trim()}>
                Enviar
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>Resumos salvos {selectedStudent ? `— ${selectedStudent.name}` : ''}</h2>
            {loadingSummaries ? (
              <p>Carregando resumos salvos...</p>
            ) : savedSummaries.length === 0 ? (
              <p>Nenhum resumo salvo ainda para este aluno.</p>
            ) : (
              <div className="diary-summary-saved-list">
                {savedSummaries.map((summary) => (
                  <div key={summary.id} className="diary-summary-saved-item">
                    <div className="diary-summary-saved-header">
                      <strong>{formatDateBR(summary.period_start)} até {formatDateBR(summary.period_end)}</strong>
                      {canDeleteSummary(summary) && (
                        <button
                          type="button"
                          className="danger-diary-button"
                          onClick={() => handleDeleteSummary(summary.id)}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="diary-summary-saved-text-btn"
                      onClick={() => setViewingSummary(summary)}
                    >
                      {truncateText(summary.summary_text, SAVED_SUMMARY_PREVIEW_LENGTH)}
                    </button>
                    <p className="diary-summary-saved-author">
                      Salvo por: {summary.author_name || '—'} em {formatDateBR((summary.created_at || '').slice(0, 10))}
                      {(summary.summary_text || '').length > SAVED_SUMMARY_PREVIEW_LENGTH && (
                        <> · <button type="button" className="diary-summary-read-more" onClick={() => setViewingSummary(summary)}>ver conteúdo completo</button></>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {viewingSummary && (
        <div className="pei-prompt-modal-overlay" onClick={() => setViewingSummary(null)}>
          <div className="pei-prompt-modal diary-summary-view-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pei-prompt-modal-header">
              <h3>
                Resumo — {formatDateBR(viewingSummary.period_start)} até {formatDateBR(viewingSummary.period_end)}
              </h3>
              <button className="pei-prompt-modal-close" onClick={() => setViewingSummary(null)}>✕</button>
            </div>
            <div className="pei-prompt-modal-body">
              <p className="pei-prompt-meta">
                Salvo por: {viewingSummary.author_name || '—'} em {formatDateBR((viewingSummary.created_at || '').slice(0, 10))}
              </p>
              <p className="diary-summary-modal-text">{viewingSummary.summary_text}</p>
            </div>
          </div>
        </div>
      )}

      {promptModalOpen && (
        <div className="pei-prompt-modal-overlay" onClick={handleClosePromptModal}>
          <div className="pei-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pei-prompt-modal-header">
              <h3>📝 Prompt do Resumo Diário</h3>
              <button className="pei-prompt-modal-close" onClick={handleClosePromptModal}>✕</button>
            </div>

            <div className="pei-prompt-modal-body">
              <p className="pei-prompt-meta">
                {promptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                {promptUpdatedAt ? ` · Atualizado em ${new Date(promptUpdatedAt).toLocaleString('pt-BR')}` : ''}
              </p>

              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <label>
                  <div className="pei-prompt-meta">Prompt salvo</div>
                  <select
                    className="upload-input"
                    style={{ width: '100%' }}
                    value={promptSelectedId}
                    onChange={(e) => {
                      const selected = findPromptOption(e.target.value);
                      updatePromptFormFromPrompt(selected);
                    }}
                  >
                    {promptOptions.length === 0 && <option value="">Nenhum prompt salvo</option>}
                    {promptOptions.map((promptItem) => (
                      <option key={promptItem.id} value={promptItem.id}>
                        {promptItem.name}{promptItem.is_default ? ' [base]' : ''}{promptItem.is_active ? ' [ativo]' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div className="pei-prompt-meta">Nome</div>
                  <input
                    className="upload-input"
                    style={{ width: '100%' }}
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Nome do prompt"
                  />
                </label>

                <label>
                  <div className="pei-prompt-meta">Descrição</div>
                  <input
                    className="upload-input"
                    style={{ width: '100%' }}
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    placeholder="Descrição opcional"
                  />
                </label>

                <label>
                  <div className="pei-prompt-meta">Conteúdo</div>
                  <textarea
                    className="pei-prompt-modal-textarea"
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(e.target.value)}
                    rows={14}
                  />
                </label>
              </div>
            </div>

            <div className="pei-prompt-modal-actions">
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleNewPrompt}
                disabled={promptSaving || promptResetting}
              >
                Novo prompt
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleDeletePrompt}
                disabled={promptSaving || promptResetting || !promptSelectedId}
              >
                Excluir
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleResetPrompt}
                disabled={promptResetting || promptSaving}
              >
                {promptResetting ? 'Restaurando...' : 'Restaurar base'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn ghost"
                onClick={handleClosePromptModal}
                disabled={promptSaving || promptResetting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleSavePrompt}
                disabled={promptSaving || promptResetting || !promptDraft.trim() || !promptName.trim() || !promptDirty}
              >
                {promptSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleUsePrompt}
                disabled={promptSaving || promptResetting || !promptDraft.trim() || !promptName.trim()}
              >
                {promptSaving ? 'Ativando...' : 'Usar este prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiarySummaryPage;
