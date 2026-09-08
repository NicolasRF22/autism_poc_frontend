import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { diaryAPI, getStoredUser, ragAPI, skillsAPI, studentAPI } from '../services/api';
import './ChatPage.css';

// ─── helpers de data ──────────────────────────────────────────────────────────
const formatISODate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const computeDiaryDateRange = (period) => {
  const preset = period?.preset || 'all';
  if (preset === 'custom') return { start: period.startDate || '', end: period.endDate || '' };
  if (preset === 'all') return { start: '', end: '' };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') return { start: formatISODate(today), end: formatISODate(today) };
  if (preset === 'week') {
    const dow = today.getDay();
    const daysSinceSat = dow === 6 ? 0 : dow + 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysSinceSat);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: formatISODate(weekStart), end: formatISODate(weekEnd) };
  }
  if (preset === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return { start: formatISODate(monthAgo), end: '' };
  }
  return { start: '', end: '' };
};

const formatPreviewDetail = (baseDetail, excerpt) => {
  const clean = String(excerpt || '').trim();
  if (!clean) return baseDetail;
  const short = clean.slice(0, 90);
  return `${baseDetail} · ${short}${clean.length > 90 ? '...' : ''}`;
};

const EMPTY_SOURCES = {
  vector_documents: false,
  diary: false,
  family_diary: false,
  diary_summary_individual: false,
  diary_summary_family: false,
  pdi: false,
  student_pre_registration: false,
  teachers_pre_registration: false,
  school_pre_registration: false,
  linked_peis: false,
};

const DIARY_PERIOD_PRESETS = [
  { key: 'all', label: 'Tudo' },
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'custom', label: 'Personalizado' },
];

// ─────────────────────────────────────────────────────────────────────────────

const ChatPage = () => {
  // ─── auth ────────────────────────────────────────────────────────────────
  const currentUser = getStoredUser();
  const userRole = currentUser?.role || '';
  const isAdmin = userRole === 'admin';

  // ─── catálogo de alunos ──────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ─── chat ─────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const sessionCacheRef = useRef({});

  // ─── tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('chat');

  // ─── fontes ───────────────────────────────────────────────────────────────
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourcesPreview, setSourcesPreview] = useState(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState({ ...EMPTY_SOURCES });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [selectedPeiIds, setSelectedPeiIds] = useState([]);
  const [diaryPeriod, setDiaryPeriod] = useState({ preset: 'all', startDate: '', endDate: '' });
  const [familyDiaryPeriod, setFamilyDiaryPeriod] = useState({ preset: 'all', startDate: '', endDate: '' });
  const [diarySummaryIndividualPeriod, setDiarySummaryIndividualPeriod] = useState({ preset: 'all', startDate: '', endDate: '' });
  const [diarySummaryFamilyPeriod, setDiarySummaryFamilyPeriod] = useState({ preset: 'all', startDate: '', endDate: '' });

  // ─── skills ───────────────────────────────────────────────────────────────
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [runningSkill, setRunningSkill] = useState(false);
  const [skillResult, setSkillResult] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({ title: '', description: '', prompt: '' });
  const [savingSkill, setSavingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);

  // skill inline no chat
  const [chatSkillId, setChatSkillId] = useState('');
  const [runningSkillInChat, setRunningSkillInChat] = useState(false);

  const endRef = useRef(null);

  // ─── carregar alunos ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        let list = [];
        if (isAdmin) {
          const data = await studentAPI.getAllStudents();
          list = Array.isArray(data) ? data : [];
        } else {
          const data = await diaryAPI.getStudents();
          list = Array.isArray(data)
            ? data.map((s) => ({
                id: s.student_id || s.id,
                name: s.student_name || s.name,
                school_id: s.school_id,
                school_name: s.school_name,
              }))
            : [];
        }
        setStudents(list);
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };
    loadCatalog();
  }, [isAdmin]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );
  const schoolName = useMemo(() => selectedStudent?.school_name || '', [selectedStudent]);

  // ─── scroll automático ────────────────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── carregar fontes quando aluno muda ───────────────────────────────────
  const loadSourcesPreview = useCallback(async ({
    studentId,
    studentName,
    school,
    resetSelections = true,
  }) => {
    if (!studentId || !studentName) {
      setSourcesPreview(null);
      return;
    }
    setSourcesLoading(true);
    try {
      const dr = computeDiaryDateRange(diaryPeriod);
      const fr = computeDiaryDateRange(familyDiaryPeriod);
      const sir = computeDiaryDateRange(diarySummaryIndividualPeriod);
      const sfr = computeDiaryDateRange(diarySummaryFamilyPeriod);
      const data = await ragAPI.getPEISourcesPreview({
        studentId,
        studentName,
        school,
        diaryStartDate: dr.start,
        diaryEndDate: dr.end,
        familyDiaryStartDate: fr.start,
        familyDiaryEndDate: fr.end,
        diarySummaryIndividualStartDate: sir.start,
        diarySummaryIndividualEndDate: sir.end,
        diarySummaryFamilyStartDate: sfr.start,
        diarySummaryFamilyEndDate: sfr.end,
      });
      const preview = data?.sources || null;
      setSourcesPreview(preview);
      if (preview) {
        const nextDocIds = (preview.vector_documents?.documents || []).map((d) => d.doc_id).filter(Boolean);
        const nextPeiIds = (preview.linked_peis?.peis || []).map((p) => p.id).filter(Boolean);
        if (resetSelections) {
          setSelectedSources({ ...EMPTY_SOURCES });
          setSelectedDocumentIds(nextDocIds);
          setSelectedPeiIds(nextPeiIds);
        } else {
          setSelectedDocumentIds((prev) => prev.filter((id) => nextDocIds.includes(id)));
          setSelectedPeiIds((prev) => prev.filter((id) => nextPeiIds.includes(id)));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar prévia de fontes:', err);
      setSourcesPreview(null);
    } finally {
      setSourcesLoading(false);
    }
  }, [diaryPeriod, familyDiaryPeriod, diarySummaryIndividualPeriod, diarySummaryFamilyPeriod]);

  useEffect(() => {
    if (!selectedStudent) {
      setSourcesPreview(null);
      setSelectedSources({ ...EMPTY_SOURCES });
      return;
    }
    loadSourcesPreview({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name || '',
      school: schoolName,
    });
  }, [selectedStudent, schoolName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplySourceFilters = () => {
    if (!selectedStudent) return;
    loadSourcesPreview({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name || '',
      school: schoolName,
      resetSelections: false,
    });
  };

  const toggleDocumentId = (setter, id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ─── helper: monta params de fontes para ragAPI.sendMessage ──────────────
  const buildSourceParams = () => ({
    selectedSources,
    selectedDocumentIds,
    selectedPeiIds,
    diaryStartDate: computeDiaryDateRange(diaryPeriod).start,
    diaryEndDate: computeDiaryDateRange(diaryPeriod).end,
    familyDiaryStartDate: computeDiaryDateRange(familyDiaryPeriod).start,
    familyDiaryEndDate: computeDiaryDateRange(familyDiaryPeriod).end,
    diarySummaryIndividualStartDate: computeDiaryDateRange(diarySummaryIndividualPeriod).start,
    diarySummaryIndividualEndDate: computeDiaryDateRange(diarySummaryIndividualPeriod).end,
    diarySummaryFamilyStartDate: computeDiaryDateRange(diarySummaryFamilyPeriod).start,
    diarySummaryFamilyEndDate: computeDiaryDateRange(diarySummaryFamilyPeriod).end,
  });

  // ─── carregar sessão ao trocar aluno ─────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      if (!selectedStudent) {
        setMessages([]);
        setSessionId('');
        return;
      }
      const cached = sessionCacheRef.current[selectedStudent.id];
      if (cached) {
        setMessages(cached.messages);
        setSessionId(cached.sessionId);
        return;
      }
      try {
        setLoadingHistory(true);
        const payload = await ragAPI.getCurrentChatSession({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name || '',
          school: schoolName,
        });
        const loadedMessages = Array.isArray(payload?.messages)
          ? payload.messages
              .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
              .map((m) => ({ role: m.role, content: m.content || '' }))
          : [];
        const sid = payload?.session_id || '';
        setMessages(loadedMessages);
        setSessionId(sid);
        sessionCacheRef.current[selectedStudent.id] = { messages: loadedMessages, sessionId: sid };
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
        setMessages([]);
        setSessionId('');
      } finally {
        setLoadingHistory(false);
      }
    };
    loadSession();
  }, [selectedStudent, schoolName]);

  // ─── enviar mensagem ──────────────────────────────────────────────────────
  const handleSendMessage = async (event) => {
    event.preventDefault();
    const message = inputMessage.trim();
    if (!message || !selectedStudent) return;
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInputMessage('');
    try {
      setSendingMessage(true);
      const payload = await ragAPI.sendMessage({
        message,
        sessionId,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name || '',
        school: schoolName,
        ...buildSourceParams(),
      });
      const newSid = payload?.session_id || sessionId;
      const assistantMsg = { role: 'assistant', content: payload?.response || '' };
      setSessionId(newSid);
      setMessages((prev) => {
        const updated = [...prev, assistantMsg];
        sessionCacheRef.current[selectedStudent.id] = { messages: updated, sessionId: newSid };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erro: ${err.response?.data?.error || err.message}`, isError: true },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ─── limpar histórico ─────────────────────────────────────────────────────
  const handleClearHistory = async () => {
    if (!selectedStudent) return;
    if (!window.confirm('Limpar histórico do chat deste aluno para o seu usuário?')) return;
    try {
      setClearingHistory(true);
      const payload = await ragAPI.clearCurrentChatSession({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name || '',
        school: schoolName,
      });
      const newSid = payload?.session_id || '';
      setMessages([]);
      setSessionId(newSid);
      sessionCacheRef.current[selectedStudent.id] = { messages: [], sessionId: newSid };
    } catch (err) {
      alert(`Erro ao limpar histórico: ${err.response?.data?.error || err.message}`);
    } finally {
      setClearingHistory(false);
    }
  };

  // ─── download PDF ─────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    try {
      setDownloadingPdf(true);
      const { blob, filename } = await ragAPI.downloadChatSessionPdf(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `chat-${selectedStudent?.name || 'historico'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err.response?.data?.error || err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ─── skills: carregar ─────────────────────────────────────────────────────
  const loadSkills = useCallback(async () => {
    try {
      setLoadingSkills(true);
      const data = await skillsAPI.list();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  // carrega skills no mount (precisamos no chat tab também) e ao entrar na aba skills
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    // ao trocar para a aba skills, garante lista atualizada
    if (activeTab === 'skills') loadSkills();
  }, [activeTab, loadSkills]);

  // ─── skills: formulário (admin) ───────────────────────────────────────────
  const openNewSkillForm = () => {
    setEditingSkill({});
    setSkillForm({ title: '', description: '', prompt: '' });
  };
  const openEditSkillForm = (skill) => {
    setEditingSkill(skill);
    setSkillForm({ title: skill.title, description: skill.description || '', prompt: skill.prompt });
  };
  const cancelSkillForm = () => setEditingSkill(null);

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.title.trim() || !skillForm.prompt.trim()) return;
    try {
      setSavingSkill(true);
      if (editingSkill?.id) {
        await skillsAPI.update(editingSkill.id, skillForm);
      } else {
        await skillsAPI.create(skillForm);
      }
      setEditingSkill(null);
      await loadSkills();
    } catch (err) {
      alert(`Erro ao salvar skill: ${err.response?.data?.error || err.message}`);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Remover esta skill?')) return;
    try {
      setDeletingSkillId(skillId);
      await skillsAPI.delete(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      if (selectedSkill?.id === skillId) { setSelectedSkill(null); setSkillResult(null); }
    } catch (err) {
      alert(`Erro ao remover skill: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeletingSkillId(null);
    }
  };

  // ─── skills: executar ─────────────────────────────────────────────────────
  const handleRunSkill = async () => {
    if (!selectedSkill || !selectedStudent) return;
    try {
      setRunningSkill(true);
      setSkillResult(null);
      const payload = await ragAPI.sendMessage({
        message: selectedSkill.prompt,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name || '',
        school: schoolName,
        newSession: true,
        ...buildSourceParams(),
      });
      setSkillResult({
        skill: { id: selectedSkill.id, title: selectedSkill.title },
        student: { id: selectedStudent.id, name: selectedStudent.name },
        response: payload?.response || '',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      alert(`Erro ao executar skill: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunningSkill(false);
    }
  };

  // ─── executar skill inline no chat ───────────────────────────────────────
  const handleRunSkillInChat = async () => {
    const skill = skills.find((s) => s.id === chatSkillId);
    if (!skill || !selectedStudent) return;
    // Mostra a skill como mensagem do usuário para dar contexto no histórico
    const userLabel = `🎯 *Skill executada: **${skill.title}***`;
    setMessages((prev) => [...prev, { role: 'user', content: userLabel, isSkillRun: true }]);
    try {
      setRunningSkillInChat(true);
      const payload = await ragAPI.sendMessage({
        message: skill.prompt,
        sessionId,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name || '',
        school: schoolName,
        ...buildSourceParams(),
      });
      const newSid = payload?.session_id || sessionId;
      const assistantMsg = { role: 'assistant', content: payload?.response || '' };
      setSessionId(newSid);
      setMessages((prev) => {
        const updated = [...prev, assistantMsg];
        sessionCacheRef.current[selectedStudent.id] = { messages: updated, sessionId: newSid };
        return updated;
      });
      setChatSkillId(''); // reseta o seletor após executar
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erro: ${err.response?.data?.error || err.message}`, isError: true },
      ]);
    } finally {
      setRunningSkillInChat(false);
    }
  };

  const handleDownloadSkillJson = () => {
    if (!skillResult) return;
    const json = JSON.stringify(skillResult, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-${(selectedSkill?.title || 'resultado').replace(/\s+/g, '_')}-${(skillResult.student?.name || 'aluno').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Professor e coordenação não veem entradas individuais dos diários —
  // apenas os resumos gerados. Admin vê tudo.
  const canSeeDiaryEntries = !['professor', 'coordenacao'].includes(userRole);

  // ─── opções de fonte (memo: depende de sourcesPreview e role) ────────────
  const sourceOptions = useMemo(() => {
    const all = [
      {
        key: 'vector_documents',
        label: 'Documentos RAG',
        detail: formatPreviewDetail(`${sourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`, sourcesPreview?.vector_documents?.excerpt),
        available: Boolean(sourcesPreview?.vector_documents?.included),
      },
      {
        key: 'diary',
        label: 'Diário Escolar',
        detail: sourcesPreview?.diary?.included
          ? formatPreviewDetail(`${sourcesPreview.diary.entries_count} entrada(s)`, sourcesPreview?.diary?.excerpt)
          : 'não encontrado',
        available: Boolean(sourcesPreview?.diary?.included),
      },
      {
        key: 'family_diary',
        label: 'Diário Familiar',
        detail: sourcesPreview?.family_diary?.included
          ? formatPreviewDetail(`${sourcesPreview.family_diary.entries_count} entrada(s)`, sourcesPreview?.family_diary?.excerpt)
          : 'não encontrado',
        available: Boolean(sourcesPreview?.family_diary?.included),
      },
      {
        key: 'diary_summary_individual',
        label: 'Resumo Diário Escolar',
        detail: sourcesPreview?.diary_summary_individual?.included
          ? formatPreviewDetail(`${sourcesPreview.diary_summary_individual.count || 0} resumo(s)`, sourcesPreview?.diary_summary_individual?.excerpt)
          : 'não encontrado',
        available: Boolean(sourcesPreview?.diary_summary_individual?.included),
      },
      {
        key: 'diary_summary_family',
        label: 'Resumo Diário Familiar',
        detail: sourcesPreview?.diary_summary_family?.included
          ? formatPreviewDetail(`${sourcesPreview.diary_summary_family.count || 0} resumo(s)`, sourcesPreview?.diary_summary_family?.excerpt)
          : 'não encontrado',
        available: Boolean(sourcesPreview?.diary_summary_family?.included),
      },
      {
        key: 'pdi',
        label: 'PDI',
        detail: sourcesPreview?.pdi?.included ? 'encontrado' : 'não encontrado',
        available: Boolean(sourcesPreview?.pdi?.included),
      },
      {
        key: 'student_pre_registration',
        label: 'Estudo de Caso',
        detail: sourcesPreview?.student_pre_registration?.included
          ? `${sourcesPreview.student_pre_registration.case_study_answers_count || 0} resposta(s)`
          : 'não encontrado',
        available: Boolean(sourcesPreview?.student_pre_registration?.included),
      },
      {
        key: 'teachers_pre_registration',
        label: 'Docentes',
        detail: sourcesPreview?.teachers_pre_registration?.included
          ? `${sourcesPreview.teachers_pre_registration.count || 0} docente(s)`
          : 'não encontrado',
        available: Boolean(sourcesPreview?.teachers_pre_registration?.included),
      },
      {
        key: 'school_pre_registration',
        label: 'Cadastro da Escola',
        detail: sourcesPreview?.school_pre_registration?.included
          ? `${sourcesPreview.school_pre_registration.registration_answers_count || 0} resposta(s)`
          : 'não encontrado',
        available: Boolean(sourcesPreview?.school_pre_registration?.included),
      },
      {
        key: 'linked_peis',
        label: 'PEIs gerados',
        detail: sourcesPreview?.linked_peis?.included
          ? formatPreviewDetail(`${sourcesPreview.linked_peis.count || 0} PEI(s)`, sourcesPreview?.linked_peis?.excerpt)
          : 'não encontrado',
        available: Boolean(sourcesPreview?.linked_peis?.included),
      },
    ];

    // Professor e coordenação: remove entradas individuais dos diários
    if (!canSeeDiaryEntries) {
      return all.filter((s) => s.key !== 'diary' && s.key !== 'family_diary');
    }
    return all;
  }, [sourcesPreview, canSeeDiaryEntries]);

  // ─── render: seletor de período do diário ─────────────────────────────────
  const renderDiaryPeriodPicker = (period, setPeriod) => (
    <div className="chat-diary-period-picker">
      <div className="chat-diary-period-presets">
        {DIARY_PERIOD_PRESETS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`chat-diary-period-btn${period.preset === opt.key ? ' active' : ''}`}
            onClick={() => setPeriod((p) => ({ ...p, preset: opt.key }))}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {period.preset === 'custom' && (
        <div className="chat-diary-period-custom">
          <input
            type="date"
            value={period.startDate}
            onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))}
          />
          <span>até</span>
          <input
            type="date"
            value={period.endDate}
            onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))}
          />
        </div>
      )}
      <p className="chat-diary-period-hint">Clique em "Aplicar filtros" para atualizar a prévia.</p>
    </div>
  );

  const busy = sendingMessage || loadingHistory || clearingHistory;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="chat-only-page">
      <div className="chat-only-header">
        <h1>Chat</h1>
        <p>Converse com a IA sobre os alunos. Fluxos de PEI ficam em <em>Chat e PEI</em>.</p>
      </div>

      {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="chat-only-toolbar">
        <label htmlFor="chat-student">Aluno</label>
        <select
          id="chat-student"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={loadingCatalog || busy}
        >
          <option value="">{loadingCatalog ? 'Carregando alunos...' : 'Selecione um aluno'}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name || s.id}</option>
          ))}
        </select>

        <div className="chat-only-toolbar-actions">
          <button
            type="button"
            className={`chat-tab-btn${activeTab === 'chat' ? ' active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button
            type="button"
            className={`chat-tab-btn skills-tab${activeTab === 'skills' ? ' active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            🎯 Skills
          </button>

          {selectedStudent && (
            <button
              type="button"
              className={`chat-tab-btn sources-tab${sourcesOpen ? ' active' : ''}`}
              onClick={() => setSourcesOpen((o) => !o)}
              title="Configurar fontes de contexto da IA"
            >
              📎 Fontes
            </button>
          )}

          {activeTab === 'chat' && (
            <>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={!selectedStudent || busy}
                title="Limpar histórico do chat"
              >
                🗑️ Limpar
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!sessionId || downloadingPdf || busy}
                title="Baixar histórico em PDF"
              >
                {downloadingPdf ? 'Gerando...' : '📄 PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Painel de Fontes ─────────────────────────────────────────────── */}
      {selectedStudent && sourcesOpen && (
        <div className="chat-sources-panel">
          <div className="chat-sources-header">
            <span>📎 Fontes de contexto</span>
            <button
              type="button"
              className="chat-sources-apply-btn"
              onClick={handleApplySourceFilters}
              disabled={sourcesLoading}
            >
              {sourcesLoading ? 'Atualizando...' : '🔄 Aplicar filtros'}
            </button>
          </div>
          {sourcesLoading ? (
            <p className="chat-sources-loading">Carregando fontes disponíveis...</p>
          ) : (
            <ul className="chat-sources-list">
              {sourceOptions.map((source) => (
                <li key={source.key} className={!source.available ? 'unavailable' : ''}>
                  <label className="chat-source-option">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedSources[source.key])}
                      disabled={!source.available}
                      onChange={(e) =>
                        setSelectedSources((prev) => ({ ...prev, [source.key]: e.target.checked }))
                      }
                    />
                    <span>
                      {source.label}: <strong>{source.detail}</strong>
                    </span>
                  </label>

                  {/* Sub-lista de documentos individuais */}
                  {source.key === 'vector_documents'
                    && selectedSources.vector_documents
                    && (sourcesPreview?.vector_documents?.documents || []).length > 0 && (
                      <ul className="chat-sources-sublist">
                        {sourcesPreview.vector_documents.documents.map((doc) => (
                          <li key={doc.doc_id}>
                            <label className="chat-source-option">
                              <input
                                type="checkbox"
                                checked={selectedDocumentIds.includes(doc.doc_id)}
                                onChange={() => toggleDocumentId(setSelectedDocumentIds, doc.doc_id)}
                              />
                              <span title={doc.file_name}>{doc.caption || doc.file_name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                  )}

                  {/* Período do Diário Escolar */}
                  {source.key === 'diary' && selectedSources.diary && (
                    renderDiaryPeriodPicker(diaryPeriod, setDiaryPeriod)
                  )}

                  {/* Período do Diário Familiar */}
                  {source.key === 'family_diary' && selectedSources.family_diary && (
                    renderDiaryPeriodPicker(familyDiaryPeriod, setFamilyDiaryPeriod)
                  )}

                  {/* Período do Resumo Diário Escolar */}
                  {source.key === 'diary_summary_individual' && selectedSources.diary_summary_individual && (
                    renderDiaryPeriodPicker(diarySummaryIndividualPeriod, setDiarySummaryIndividualPeriod)
                  )}

                  {/* Período do Resumo Diário Familiar */}
                  {source.key === 'diary_summary_family' && selectedSources.diary_summary_family && (
                    renderDiaryPeriodPicker(diarySummaryFamilyPeriod, setDiarySummaryFamilyPeriod)
                  )}

                  {/* Sub-lista de PEIs individuais */}
                  {source.key === 'linked_peis'
                    && selectedSources.linked_peis
                    && (sourcesPreview?.linked_peis?.peis || []).length > 0 && (
                      <ul className="chat-sources-sublist">
                        {sourcesPreview.linked_peis.peis.map((pei) => (
                          <li key={pei.id}>
                            <label className="chat-source-option">
                              <input
                                type="checkbox"
                                checked={selectedPeiIds.includes(pei.id)}
                                onChange={() => toggleDocumentId(setSelectedPeiIds, pei.id)}
                              />
                              <span title={pei.excerpt}>
                                PEI de {pei.created_at
                                  ? new Date(pei.created_at).toLocaleDateString('pt-BR')
                                  : '—'}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── Chat ─────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <>
          <div className="chat-only-panel">
            {loadingHistory ? (
              <div className="chat-only-empty">Carregando histórico...</div>
            ) : messages.length === 0 ? (
              <div className="chat-only-empty">
                {selectedStudent ? 'Nenhuma mensagem ainda.' : 'Selecione um aluno para iniciar o chat.'}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`chat-only-bubble ${msg.role}${msg.isError ? ' error' : ''}${msg.isSkillRun ? ' skill-run' : ''}`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                <div ref={endRef} />
              </>
            )}
          </div>

          {/* Seletor de skill inline */}
          {skills.length > 0 && (
            <div className="chat-skill-runner">
              <select
                value={chatSkillId}
                onChange={(e) => setChatSkillId(e.target.value)}
                disabled={!selectedStudent || busy || runningSkillInChat}
                className="chat-skill-select"
              >
                <option value="">🎯 Executar uma skill…</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <button
                type="button"
                className="chat-skill-run-btn"
                onClick={handleRunSkillInChat}
                disabled={!chatSkillId || !selectedStudent || busy || runningSkillInChat}
              >
                {runningSkillInChat ? 'Executando…' : '▶ Executar'}
              </button>
            </div>
          )}

          <form className="chat-only-input" onSubmit={handleSendMessage}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedStudent
                  ? 'Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)'
                  : 'Selecione um aluno para iniciar o chat'
              }
              disabled={!selectedStudent || busy || runningSkillInChat}
              rows={3}
            />
            <button type="submit" disabled={!selectedStudent || !inputMessage.trim() || busy || runningSkillInChat}>
              {sendingMessage ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </>
      )}

      {/* ─── Skills ───────────────────────────────────────────────────────── */}
      {activeTab === 'skills' && (
        <div className="skills-panel">
          {/* Lista de skills */}
          <div className="skills-list-col">
            <div className="skills-list-header">
              <h3>Skills</h3>
              {isAdmin && (
                <button type="button" className="skills-add-btn" onClick={openNewSkillForm}>
                  + Nova
                </button>
              )}
            </div>

            {loadingSkills ? (
              <p className="skills-empty">Carregando...</p>
            ) : skills.length === 0 ? (
              <p className="skills-empty">Nenhuma skill cadastrada.</p>
            ) : (
              <ul className="skills-list">
                {skills.map((skill) => (
                  <li
                    key={skill.id}
                    className={`skills-list-item${selectedSkill?.id === skill.id ? ' selected' : ''}`}
                    onClick={() => { setSelectedSkill(skill); setSkillResult(null); setEditingSkill(null); }}
                  >
                    <div className="skills-item-title">{skill.title}</div>
                    {skill.description && <div className="skills-item-desc">{skill.description}</div>}
                    {isAdmin && (
                      <div className="skills-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => openEditSkillForm(skill)}>Editar</button>
                        <button
                          type="button"
                          className="skills-delete-btn"
                          disabled={deletingSkillId === skill.id}
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          {deletingSkillId === skill.id ? '...' : 'Remover'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Painel direito */}
          <div className="skills-run-col">
            {editingSkill !== null ? (
              <form className="skills-form" onSubmit={handleSaveSkill}>
                <h4>{editingSkill?.id ? 'Editar skill' : 'Nova skill'}</h4>
                <label>Título *</label>
                <input
                  type="text"
                  value={skillForm.title}
                  onChange={(e) => setSkillForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="Nome da skill"
                />
                <label>Descrição</label>
                <input
                  type="text"
                  value={skillForm.description}
                  onChange={(e) => setSkillForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Breve descrição (opcional)"
                />
                <label>Prompt *</label>
                <textarea
                  value={skillForm.prompt}
                  onChange={(e) => setSkillForm((p) => ({ ...p, prompt: e.target.value }))}
                  required
                  placeholder="Prompt que será enviado ao modelo ao executar a skill…"
                  rows={8}
                />
                <div className="skills-form-actions">
                  <button type="submit" disabled={savingSkill}>
                    {savingSkill ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" className="skills-cancel-btn" onClick={cancelSkillForm}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : selectedSkill ? (
              <div className="skills-runner">
                <h4>{selectedSkill.title}</h4>
                {selectedSkill.description && (
                  <p className="skills-runner-desc">{selectedSkill.description}</p>
                )}

                <div className="skills-runner-prompt">
                  <label>Prompt</label>
                  <pre>{selectedSkill.prompt}</pre>
                </div>

                <div className="skills-runner-actions">
                  <button
                    type="button"
                    className="skills-run-btn"
                    onClick={handleRunSkill}
                    disabled={!selectedStudent || runningSkill}
                  >
                    {runningSkill ? 'Executando...' : '▶ Executar'}
                  </button>
                  {!selectedStudent && (
                    <span className="skills-runner-hint">
                      Selecione um aluno na barra acima para executar.
                    </span>
                  )}
                </div>

                {!selectedStudent ? null : (
                  <p className="skills-sources-hint">
                    {Object.values(selectedSources).some(Boolean)
                      ? `Fontes ativas: ${sourceOptions.filter((s) => selectedSources[s.key]).map((s) => s.label).join(', ')}`
                      : 'Nenhuma fonte selecionada — use o botão 📎 Fontes na barra para configurar o contexto da skill.'}
                  </p>
                )}

                {runningSkill && (
                  <div className="skills-running-indicator">
                    <span className="skills-spinner" />
                    Processando skill com a IA…
                  </div>
                )}

                {skillResult && (
                  <div className="skills-result">
                    <div className="skills-result-header">
                      <span>Resultado — {skillResult.student?.name}</span>
                      <button
                        type="button"
                        className="skills-json-btn"
                        onClick={handleDownloadSkillJson}
                      >
                        ⬇ Download JSON
                      </button>
                    </div>
                    <div className="skills-result-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {skillResult.response}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="skills-empty-run">
                <p>Selecione uma skill à esquerda para ver detalhes e executá-la.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
