import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStoredUser, ragAPI, schoolAPI, studentAPI, savedPeiStructuredAPI } from '../services/api';
import './PEIPage.css';

// ── Seções do PEI estruturado ────────────────────────────────────────────────
const PEI_SECTIONS = [
  { key: 'identificacao_estudante', title: '1. Identificação do Estudante' },
  { key: 'perfil_funcional', title: '2. Perfil Funcional' },
  { key: 'objetivos_educacionais_individualizados', title: '3. Objetivos Educacionais Individualizados' },
  { key: 'estrategias_pedagogicas', title: '4. Estratégias Pedagógicas' },
  { key: 'apoios_e_recursos', title: '5. Apoios e Recursos' },
  { key: 'adaptacoes_curriculares_por_componente_curricular', title: '6. Adaptações Curriculares por Componente Curricular' },
  { key: 'participacao_familia_equipe_escolar', title: '7. Participação da Família e Equipe Escolar' },
  { key: 'avaliacao_e_monitoramento', title: '8. Avaliação e Monitoramento' },
  { key: 'cultura_escolar_e_inclusao', title: '9. Cultura Escolar e Inclusão' },
  { key: 'fundamentacao_legal', title: '10. Fundamentação Legal' },
];

const EMPTY_PEI_SECTIONS = PEI_SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: false }), {});

// ── Período ──────────────────────────────────────────────────────────────────
const DIARY_PERIOD_PRESETS = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'all', label: 'Tudo' },
  { key: 'custom', label: 'Personalizado' },
];

const formatISODate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const computeDateRange = (period) => {
  const preset = period?.preset || 'all';
  const mode = period?.mode || 'relativo';
  if (preset === 'custom') return { start: period.startDate || '', end: period.endDate || '' };
  if (preset === 'all') return { start: '', end: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (preset === 'today') return { start: formatISODate(today), end: formatISODate(today) };
  if (preset === 'week') {
    if (mode === 'relativo') {
      // Últimos 7 dias a partir de hoje
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      return { start: formatISODate(weekStart), end: formatISODate(today) };
    }
    // Absoluto: semana calendário (Dom a Sáb)
    const dow = today.getDay(); // 0=Dom … 6=Sáb
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dow);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: formatISODate(weekStart), end: formatISODate(weekEnd) };
  }
  if (preset === 'month') {
    if (mode === 'relativo') {
      // Últimos 30 dias a partir de hoje
      const monthStart = new Date(today);
      monthStart.setDate(today.getDate() - 29);
      return { start: formatISODate(monthStart), end: formatISODate(today) };
    }
    // Absoluto: do 1º do mês atual até hoje
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: formatISODate(monthStart), end: formatISODate(today) };
  }
  return { start: '', end: '' };
};

// ── Parse PEI content (JSON legado ou Markdown novo) ─────────────────────────
const parsePeiContent = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Remove fences de código se houver
  const stripped = text.replace(/^```[^\n]*\n?/i, '').replace(/\n?```\s*$/, '').trim();

  // 1. Tenta JSON (compatibilidade com PEIs salvos no formato antigo)
  const tryJson = (str) => {
    try {
      const obj = JSON.parse(str);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        if (PEI_SECTIONS.some((s) => obj[s.key])) return obj;
      }
    } catch { /* continua */ }
    return null;
  };
  const direct = tryJson(stripped);
  if (direct) return direct;
  // Escape de newlines reais dentro de strings JSON
  try {
    let inStr = false; let esc = false; let fixed = '';
    for (const ch of stripped) {
      if (esc) { fixed += ch; esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; fixed += ch; continue; }
      if (ch === '"') { inStr = !inStr; fixed += ch; continue; }
      if (inStr && ch === '\n') { fixed += '\\n'; continue; }
      if (inStr && ch === '\r') { fixed += '\\r'; continue; }
      fixed += ch;
    }
    const jsonFixed = tryJson(fixed);
    if (jsonFixed) return jsonFixed;
  } catch { /* não é JSON válido */ }

  // 2. Tenta Markdown com cabeçalhos ## N. Título (formato novo)
  const headerRe = /^##\s+(\d+)\.\s+[^\n]*/gm;
  const matches = [];
  let m;
  while ((m = headerRe.exec(stripped)) !== null) {
    matches.push({ num: parseInt(m[1], 10), headerEnd: m.index + m[0].length, start: m.index });
  }
  if (matches.length >= 3) {
    const result = {};
    for (let i = 0; i < matches.length; i++) {
      const { num, headerEnd } = matches[i];
      const nextStart = i + 1 < matches.length ? matches[i + 1].start : stripped.length;
      const content = stripped.slice(headerEnd, nextStart).trim();
      const section = PEI_SECTIONS[num - 1]; // seção 1 → índice 0
      if (section && content) result[section.key] = content;
    }
    if (Object.keys(result).length >= 3) return result;
  }

  return null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const PEIPage = () => {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin';

  // ── Alunos ──
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registeredSchools, setRegisteredSchools] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'saved' | 'prompts'

  // ── Chat ──
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [expandedSections, setExpandedSections] = useState(EMPTY_PEI_SECTIONS);
  const messagesEndRef = useRef(null);

  // ── Fontes ──
  const [sourcesPreview, setSourcesPreview] = useState(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState({
    vector_documents: false,
    diary: false,
    family_diary: false,
    diary_summary_individual: false,
    diary_summary_family: false,
    pdi: false,
    student_pre_registration: false,
    school_pre_registration: false,
    saved_skill_results: false,
    saved_peis_structured: false,
  });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [diaryPeriod, setDiaryPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });
  const [familyDiaryPeriod, setFamilyDiaryPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });
  const [diarySummaryIndividualPeriod, setDiarySummaryIndividualPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });
  const [diarySummaryFamilyPeriod, setDiarySummaryFamilyPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });
  const [savedSkillResultsPeriod, setSavedSkillResultsPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });
  const [savedPeisStructuredPeriod, setSavedPeisStructuredPeriod] = useState({ preset: 'all', startDate: '', endDate: '', mode: 'relativo' });

  // ── Sidebar ──
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── PEIs Salvos ──
  const [savedPeis, setSavedPeis] = useState([]);
  const [savedPeisLoading, setSavedPeisLoading] = useState(false);
  const [selectedSavedPei, setSelectedSavedPei] = useState(null);
  const [savedSectionExpanded, setSavedSectionExpanded] = useState(EMPTY_PEI_SECTIONS);
  const [savedPeiStudentFilter, setSavedPeiStudentFilter] = useState('');
  const [editingSection, setEditingSection] = useState(null); // { key, draft }
  const [savingSectionKey, setSavingSectionKey] = useState(null);

  // ── Prompt ──
  const [promptOptions, setPromptOptions] = useState([]);
  const [promptSelectedId, setPromptSelectedId] = useState('');
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptDraft, setPromptDraft] = useState('');
  const [promptInitialState, setPromptInitialState] = useState({ id: '', name: '', description: '', content: '' });
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptResetting, setPromptResetting] = useState(false);
  const [promptIsCustom, setPromptIsCustom] = useState(false);
  const [promptUpdatedAt, setPromptUpdatedAt] = useState(null);
  const [promptModalOpen, setPromptModalOpen] = useState(false);

  const promptDirty = (
    promptDraft !== promptInitialState.content
    || promptName !== promptInitialState.name
    || promptDescription !== promptInitialState.description
  );

  // ── Init ──
  useEffect(() => {
    loadCatalogs();
    loadPrompt();
    loadSavedPeis();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Funções auxiliares ────────────────────────────────────────────────────
  const getSchoolName = (student) => {
    if (!student) return '';
    const school = student.school_id
      ? registeredSchools.find((s) => s.id === student.school_id)
      : null;
    return school?.name || student.school_name || '';
  };

  const loadCatalogs = async () => {
    try {
      const [studentsData, schoolsData] = await Promise.all([
        studentAPI.getAllStudents(),
        schoolAPI.getAllSchools(),
      ]);
      setRegisteredStudents(Array.isArray(studentsData) ? studentsData : []);
      setRegisteredSchools(Array.isArray(schoolsData) ? schoolsData : []);
    } catch (err) {
      console.error('Erro ao carregar catálogos:', err);
    }
  };

  // ── Aluno selecionado ────────────────────────────────────────────────────
  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    setMessages([]);
    setSessionId('');
    setExpandedSections(EMPTY_PEI_SECTIONS);

    if (!studentId) {
      setSelectedStudentName('');
      setSelectedSchool('');
      setSelectedSchoolId('');
      setSourcesPreview(null);
      return;
    }

    const student = registeredStudents.find((s) => s.id === studentId);
    if (!student) return;

    const schoolName = getSchoolName(student);
    const schoolId = student.school_id || '';
    setSelectedStudentName(student.name || '');
    setSelectedSchool(schoolName);
    setSelectedSchoolId(schoolId);

    loadSourcesPreview({
      studentId,
      studentName: student.name || '',
      school: schoolName,
    });
  };

  // ── Fontes ────────────────────────────────────────────────────────────────
  const loadSourcesPreview = useCallback(async ({
    studentId: sId,
    studentName: sName,
    school: sSchool,
    resetSelections = true,
  } = {}) => {
    const sid = sId || selectedStudentId;
    const sname = sName || selectedStudentName;
    const school = sSchool || selectedSchool;

    if (!sid || !sname) { setSourcesPreview(null); return; }

    setSourcesLoading(true);
    try {
      const diaryR = computeDateRange(diaryPeriod);
      const familyR = computeDateRange(familyDiaryPeriod);
      const sumIndR = computeDateRange(diarySummaryIndividualPeriod);
      const sumFamR = computeDateRange(diarySummaryFamilyPeriod);
      const ssrR = computeDateRange(savedSkillResultsPeriod);
      const spsR = computeDateRange(savedPeisStructuredPeriod);

      const data = await ragAPI.getPEISourcesPreview({
        studentId: sid,
        studentName: sname,
        school,
        diaryStartDate: diaryR.start,
        diaryEndDate: diaryR.end,
        familyDiaryStartDate: familyR.start,
        familyDiaryEndDate: familyR.end,
        diarySummaryIndividualStartDate: sumIndR.start,
        diarySummaryIndividualEndDate: sumIndR.end,
        diarySummaryFamilyStartDate: sumFamR.start,
        diarySummaryFamilyEndDate: sumFamR.end,
        savedSkillResultsStartDate: ssrR.start,
        savedSkillResultsEndDate: ssrR.end,
        savedPeisStructuredStartDate: spsR.start,
        savedPeisStructuredEndDate: spsR.end,
      });

      const nextSources = data?.sources || null;
      setSourcesPreview(nextSources);

      if (nextSources) {
        const nextDocIds = (nextSources.vector_documents?.documents || []).map((d) => d.doc_id).filter(Boolean);
        if (resetSelections) {
          setSelectedSources({
            vector_documents: false, diary: false, family_diary: false,
            diary_summary_individual: false, diary_summary_family: false,
            pdi: false, student_pre_registration: false, school_pre_registration: false,
            saved_skill_results: false, saved_peis_structured: false,
          });
          setSelectedDocumentIds(nextDocIds);
        } else {
          setSelectedDocumentIds((prev) => prev.filter((id) => nextDocIds.includes(id)));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar fontes:', err);
      setSourcesPreview(null);
    } finally {
      setSourcesLoading(false);
    }
  }, [
    selectedStudentId, selectedStudentName, selectedSchool,
    diaryPeriod, familyDiaryPeriod, diarySummaryIndividualPeriod,
    diarySummaryFamilyPeriod, savedSkillResultsPeriod, savedPeisStructuredPeriod,
  ]);

  const toggleDocumentId = (docId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // ── Source options (computed) ────────────────────────────────────────────
  const formatDetail = (base, excerpt) => {
    const clean = String(excerpt || '').trim();
    if (!clean) return base;
    const short = clean.slice(0, 90);
    return `${base} · ${short}${clean.length > 90 ? '...' : ''}`;
  };

  const sourceOptions = [
    {
      key: 'vector_documents',
      label: 'Documentos do RAG',
      detail: formatDetail(`${sourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`, sourcesPreview?.vector_documents?.excerpt),
      available: Boolean(sourcesPreview?.vector_documents?.included),
    },
    {
      key: 'diary',
      label: 'Diário Escolar',
      detail: sourcesPreview?.diary?.included
        ? formatDetail(`${sourcesPreview.diary.entries_count} entrada(s)`, sourcesPreview?.diary?.excerpt)
        : 'não encontrado',
      available: Boolean(sourcesPreview?.diary?.included),
    },
    {
      key: 'family_diary',
      label: 'Diário Familiar',
      detail: sourcesPreview?.family_diary?.included
        ? formatDetail(`${sourcesPreview.family_diary.entries_count} entrada(s)`, sourcesPreview?.family_diary?.excerpt)
        : 'não encontrado',
      available: Boolean(sourcesPreview?.family_diary?.included),
    },
    {
      key: 'diary_summary_individual',
      label: 'Resumo Diário Escolar',
      detail: sourcesPreview?.diary_summary_individual?.included
        ? formatDetail(`${sourcesPreview.diary_summary_individual.count || 0} resumo(s)`, sourcesPreview?.diary_summary_individual?.excerpt)
        : 'não encontrado',
      available: Boolean(sourcesPreview?.diary_summary_individual?.included),
    },
    {
      key: 'diary_summary_family',
      label: 'Resumo Diário Familiar',
      detail: sourcesPreview?.diary_summary_family?.included
        ? formatDetail(`${sourcesPreview.diary_summary_family.count || 0} resumo(s)`, sourcesPreview?.diary_summary_family?.excerpt)
        : 'não encontrado',
      available: Boolean(sourcesPreview?.diary_summary_family?.included),
    },
    {
      key: 'pdi',
      label: 'PDI',
      detail: sourcesPreview?.pdi?.included ? formatDetail('encontrado', sourcesPreview?.pdi?.excerpt) : 'não encontrado',
      available: Boolean(sourcesPreview?.pdi?.included),
    },
    {
      key: 'student_pre_registration',
      label: 'Pré-cadastro do Aluno + Estudo de Caso',
      detail: sourcesPreview?.student_pre_registration?.included
        ? `${sourcesPreview.student_pre_registration.case_study_answers_count || 0} resposta(s) do Estudo de Caso`
        : 'não encontrado',
      available: Boolean(sourcesPreview?.student_pre_registration?.included),
    },
    {
      key: 'school_pre_registration',
      label: 'Pré-cadastro da Escola + Cadastro da Escola',
      detail: sourcesPreview?.school_pre_registration?.included
        ? formatDetail(
            `${sourcesPreview.school_pre_registration.registration_answers_count || 0} resposta(s) do Cadastro da Escola`,
            sourcesPreview.school_pre_registration.school_name,
          )
        : 'não encontrado',
      available: Boolean(sourcesPreview?.school_pre_registration?.included),
    },
    {
      key: 'saved_skill_results',
      label: 'Respostas de Skills',
      detail: (() => {
        const count = sourcesPreview?.saved_skill_results?.count || 0;
        return count > 0 ? `${count} resposta(s) salva(s)` : 'nenhuma salva';
      })(),
      available: Boolean(sourcesPreview?.saved_skill_results?.included),
    },
    {
      key: 'saved_peis_structured',
      label: 'PEIs Salvos',
      detail: (() => {
        const count = sourcesPreview?.saved_peis_structured?.count || 0;
        return count > 0 ? `${count} PEI(s) salvo(s)` : 'nenhum salvo';
      })(),
      available: Boolean(sourcesPreview?.saved_peis_structured?.included),
    },
  ];

  const renderPeriodPicker = (period, setPeriod) => {
    const mode = period.mode || 'relativo';
    return (
      <div className="peipage-period-picker">
        <div className="peipage-period-mode-toggle">
          <button
            type="button"
            className={`peipage-period-mode-btn ${mode === 'relativo' ? 'active' : ''}`}
            onClick={() => setPeriod((prev) => ({ ...prev, mode: 'relativo' }))}
          >
            Relativo
            <span className="peipage-period-mode-desc">últimos N dias a partir de hoje</span>
          </button>
          <button
            type="button"
            className={`peipage-period-mode-btn ${mode === 'absoluto' ? 'active' : ''}`}
            onClick={() => setPeriod((prev) => ({ ...prev, mode: 'absoluto' }))}
          >
            Absoluto
            <span className="peipage-period-mode-desc">semana/mês vigente do calendário</span>
          </button>
        </div>
        <div className="peipage-period-presets">
          {DIARY_PERIOD_PRESETS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`peipage-period-btn ${period.preset === opt.key ? 'active' : ''}`}
              onClick={() => setPeriod((prev) => ({ ...prev, preset: opt.key }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period.preset === 'custom' && (
          <div className="peipage-period-custom">
            <input
              type="date"
              value={period.startDate}
              onChange={(ev) => setPeriod((prev) => ({ ...prev, startDate: ev.target.value }))}
            />
            <span>até</span>
            <input
              type="date"
              value={period.endDate}
              onChange={(ev) => setPeriod((prev) => ({ ...prev, endDate: ev.target.value }))}
            />
          </div>
        )}
        <p className="peipage-period-hint">Clique em "Aplicar filtros" para atualizar.</p>
      </div>
    );
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleGeneratePEI = async () => {
    if (!selectedStudentId) { alert('Selecione um aluno primeiro.'); return; }
    const selectedCount = Object.values(selectedSources).filter(Boolean).length;
    if (selectedCount === 0) { alert('Selecione pelo menos uma fonte para gerar o PEI.'); return; }

    const triggerMessage = 'Gere o PEI completo para este aluno com base nas fontes fornecidas.';
    setMessages([{ role: 'user', content: triggerMessage }]);
    setSessionId('');
    setExpandedSections(EMPTY_PEI_SECTIONS);
    setChatLoading(true);

    try {
      const diaryR = computeDateRange(diaryPeriod);
      const familyR = computeDateRange(familyDiaryPeriod);
      const sumIndR = computeDateRange(diarySummaryIndividualPeriod);
      const sumFamR = computeDateRange(diarySummaryFamilyPeriod);
      const ssrR = computeDateRange(savedSkillResultsPeriod);
      const spsR = computeDateRange(savedPeisStructuredPeriod);

      const data = await ragAPI.sendMessage({
        message: triggerMessage,
        studentId: selectedStudentId,
        studentName: selectedStudentName,
        school: selectedSchool,
        selectedSources,
        selectedDocumentIds,
        selectedPeiIds: [],
        diaryStartDate: diaryR.start,
        diaryEndDate: diaryR.end,
        familyDiaryStartDate: familyR.start,
        familyDiaryEndDate: familyR.end,
        diarySummaryIndividualStartDate: sumIndR.start,
        diarySummaryIndividualEndDate: sumIndR.end,
        diarySummaryFamilyStartDate: sumFamR.start,
        diarySummaryFamilyEndDate: sumFamR.end,
        savedSkillResultsStartDate: ssrR.start,
        savedSkillResultsEndDate: ssrR.end,
        savedPeisStructuredStartDate: spsR.start,
        savedPeisStructuredEndDate: spsR.end,
        newSession: true,
        systemPromptScope: 'pei_structured',
      });

      if (data?.session_id) setSessionId(data.session_id);
      const response = data?.response || '';
      const parsed = parsePeiContent(response);
      if (parsed) {
        // Expand all sections by default
        setExpandedSections(PEI_SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: true }), {}));
      }
      setMessages([
        { role: 'user', content: triggerMessage },
        { role: 'assistant', content: response, parsed },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro: ' + (err.response?.data?.error || err.message), isError: true },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendFollowUp = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !selectedStudentId || !sessionId) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const data = await ragAPI.sendMessage({
        message: text,
        sessionId,
        studentId: selectedStudentId,
        studentName: selectedStudentName,
        school: selectedSchool,
        systemPromptScope: 'pei_structured',
      });

      if (data?.session_id) setSessionId(data.session_id);
      const response = data?.response || '';
      const parsed = parsePeiContent(response);
      setMessages((prev) => [...prev, { role: 'assistant', content: response, parsed }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro: ' + (err.response?.data?.error || err.message), isError: true },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSavePEI = async () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isError);
    if (!lastAssistant) { alert('Nenhuma resposta para salvar.'); return; }
    if (!selectedStudentId) { alert('Selecione um aluno.'); return; }

    try {
      await savedPeiStructuredAPI.save({
        studentId: selectedStudentId,
        studentName: selectedStudentName,
        response: lastAssistant.content,
        sessionId,
      });
      alert('PEI salvo com sucesso!');
      loadSavedPeis();
    } catch (err) {
      alert('Erro ao salvar PEI: ' + (err.response?.data?.error || err.message));
    }
  };

  // ── Helpers de download ───────────────────────────────────────────────────
  const buildTimestamp = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  };

  const sanitizeName = (name) => String(name || 'PEI').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = (responseText, studentName) => {
    const parsed = parsePeiContent(responseText);
    const content = parsed ? JSON.stringify(parsed, null, 2) : responseText;
    const blob = new Blob([content], { type: 'application/json' });
    downloadBlob(blob, `PEI_${sanitizeName(studentName)}_${buildTimestamp()}.json`);
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const [savedPdfLoading, setSavedPdfLoading] = useState(null); // id do PEI sendo gerado

  const handleDownloadPdf = async (responseText, studentName, school = '') => {
    setPdfLoading(true);
    try {
      const blob = await savedPeiStructuredAPI.renderPdf({
        response: responseText,
        studentName,
        school,
      });
      downloadBlob(blob, `PEI_${sanitizeName(studentName)}_${buildTimestamp()}.pdf`);
    } catch (err) {
      alert('Erro ao gerar PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadSavedPdf = async (pei) => {
    setSavedPdfLoading(pei.id);
    try {
      const blob = await savedPeiStructuredAPI.renderPdf({
        response: pei.response,
        studentName: pei.student_name,
        school: '',
      });
      downloadBlob(blob, `PEI_${sanitizeName(pei.student_name)}_${buildTimestamp()}.pdf`);
    } catch (err) {
      alert('Erro ao gerar PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavedPdfLoading(null);
    }
  };

  // ── PEIs Salvos ──────────────────────────────────────────────────────────
  const loadSavedPeis = async () => {
    setSavedPeisLoading(true);
    try {
      const data = await savedPeiStructuredAPI.list();
      const arr = Array.isArray(data) ? data : (data?.results || []);
      setSavedPeis(arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('Erro ao carregar PEIs salvos:', err);
    } finally {
      setSavedPeisLoading(false);
    }
  };

  const handleDeleteSavedPei = async (id) => {
    if (!window.confirm('Remover este PEI salvo?')) return;
    try {
      await savedPeiStructuredAPI.delete(id);
      setSavedPeis((prev) => prev.filter((p) => p.id !== id));
      if (selectedSavedPei?.id === id) setSelectedSavedPei(null);
    } catch (err) {
      alert('Erro ao remover: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSelectSavedPei = (pei) => {
    setSelectedSavedPei(pei);
    setEditingSection(null);
    const parsed = parsePeiContent(pei.response);
    setSavedSectionExpanded(
      PEI_SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: Boolean(parsed?.[s.key]) }), {})
    );
  };

  // ── Edição de seção ──────────────────────────────────────────────────────
  const rebuildMarkdown = (sectionsObj) =>
    PEI_SECTIONS
      .filter((s) => sectionsObj[s.key])
      .map((s) => `## ${s.title}\n\n${sectionsObj[s.key]}`)
      .join('\n\n');

  const handleSaveSection = async (sectionKey) => {
    if (!selectedSavedPei || !editingSection) return;
    const currentParsed = parsePeiContent(selectedSavedPei.response) || {};
    const newSections = { ...currentParsed, [sectionKey]: editingSection.draft };
    const newResponse = rebuildMarkdown(newSections);
    setSavingSectionKey(sectionKey);
    try {
      const updated = await savedPeiStructuredAPI.update(selectedSavedPei.id, { response: newResponse });
      const newPei = { ...selectedSavedPei, response: newResponse, ...(updated || {}) };
      setSelectedSavedPei(newPei);
      setSavedPeis((prev) => prev.map((p) => (p.id === newPei.id ? newPei : p)));
      setEditingSection(null);
    } catch (err) {
      alert('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingSectionKey(null);
    }
  };

  // ── Filtered saved PEIs ──────────────────────────────────────────────────
  const studentOptions = [...new Set(savedPeis.map((p) => p.student_name).filter(Boolean))].sort();
  const filteredSavedPeis = savedPeiStudentFilter
    ? savedPeis.filter((p) => p.student_name === savedPeiStudentFilter)
    : savedPeis;

  // ── Prompt management ─────────────────────────────────────────────────────
  const loadPrompt = async () => {
    setPromptLoading(true);
    try {
      const data = await ragAPI.getPeiStructuredPrompt();
      const prompts = Array.isArray(data?.available_prompts) ? data.available_prompts : [];
      const selected = prompts.find((p) => p.id === data?.current_prompt_id)
        || prompts.find((p) => p.is_active)
        || prompts[0]
        || null;
      const text = selected?.content || data?.prompt || '';
      setPromptOptions(prompts);
      setPromptSelectedId(selected?.id || '');
      setPromptName(selected?.name || '');
      setPromptDescription(selected?.description || '');
      setPromptDraft(text);
      setPromptUpdatedAt(selected?.updated_at || data?.updated_at || null);
      setPromptIsCustom(Boolean(data?.is_custom));
      setPromptInitialState({ id: selected?.id || '', name: selected?.name || '', description: selected?.description || '', content: text });
    } catch (err) {
      alert('Erro ao carregar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptLoading(false);
    }
  };

  const updatePromptFormFrom = (promptItem) => {
    const p = promptItem || {};
    setPromptSelectedId(p.id || '');
    setPromptName(p.name || '');
    setPromptDescription(p.description || '');
    setPromptDraft(p.content || '');
    setPromptInitialState({ id: p.id || '', name: p.name || '', description: p.description || '', content: p.content || '' });
  };

  const findPromptOption = (promptId) => promptOptions.find((p) => p.id === promptId) || null;

  const persistPrompt = async ({ promptId, name, description, content, activate = false }) => {
    const payload = { scope: 'pei_structured', name: name.trim(), description: description.trim(), content: content.trim(), activate };
    if (promptId) return ragAPI.updatePrompt(promptId, payload);
    return ragAPI.createPrompt(payload);
  };

  const handleSavePrompt = async () => {
    if (!promptDraft.trim() || !promptName.trim()) { alert('Nome e prompt são obrigatórios.'); return; }
    setPromptSaving(true);
    try {
      const saved = await persistPrompt({ promptId: promptSelectedId, name: promptName, description: promptDescription, content: promptDraft });
      await loadPrompt();
      if (saved?.id && !saved?.is_active) {
        setPromptSelectedId(saved.id);
        updatePromptFormFrom(saved);
      }
      alert('Prompt salvo.');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptSaving(false);
    }
  };

  const handleUsePrompt = async () => {
    if (!promptDraft.trim() || !promptName.trim()) { alert('Nome e prompt são obrigatórios.'); return; }
    setPromptSaving(true);
    try {
      const saved = await persistPrompt({ promptId: promptSelectedId, name: promptName, description: promptDescription, content: promptDraft, activate: true });
      await loadPrompt();
      if (saved?.id) { setPromptSelectedId(saved.id); updatePromptFormFrom(saved); }
      alert('Prompt ativado.');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptSaving(false);
    }
  };

  const handleDeletePrompt = async () => {
    if (!promptSelectedId) return;
    if (!window.confirm('Excluir este prompt?')) return;
    try {
      await ragAPI.deletePrompt(promptSelectedId);
      await loadPrompt();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleResetPrompt = async () => {
    if (!window.confirm('Restaurar o prompt base original?')) return;
    setPromptResetting(true);
    try {
      await ragAPI.resetPeiStructuredPrompt();
      await loadPrompt();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setPromptResetting(false);
    }
  };

  const handleNewPrompt = () => {
    const next = {
      id: '',
      name: '',
      description: '',
      content: promptDraft,
    };
    updatePromptFormFrom(next);
  };

  // ── Renderização de seções ────────────────────────────────────────────────
  const renderPeiSections = (parsed, expanded, toggleFn, { editable = false } = {}) => (
    <div className="peipage-sections">
      {PEI_SECTIONS.map((section) => {
        const content = parsed?.[section.key];
        if (!content) return null;
        const isExpanded = expanded[section.key];
        const isEditing = editable && editingSection?.key === section.key;
        const isSaving = savingSectionKey === section.key;
        return (
          <div key={section.key} className="peipage-section">
            <div className={`peipage-section-header ${isExpanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className="peipage-section-toggle"
                onClick={() => toggleFn((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
              >
                <span className="peipage-section-title">{section.title}</span>
                <span className="peipage-section-chevron">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {editable && isExpanded && !isEditing && (
                <button
                  type="button"
                  className="peipage-section-edit-btn"
                  title="Editar seção"
                  onClick={(e) => { e.stopPropagation(); setEditingSection({ key: section.key, draft: content }); }}
                >
                  ✏️
                </button>
              )}
            </div>
            {isExpanded && (
              <div className="peipage-section-content">
                {isEditing ? (
                  <div className="peipage-section-editor">
                    <textarea
                      className="peipage-section-textarea"
                      value={editingSection.draft}
                      onChange={(e) => setEditingSection((prev) => ({ ...prev, draft: e.target.value }))}
                      rows={Math.max(8, (editingSection.draft.match(/\n/g) || []).length + 2)}
                      disabled={isSaving}
                    />
                    <div className="peipage-section-editor-actions">
                      <button
                        type="button"
                        className="peipage-section-save-btn"
                        onClick={() => handleSaveSection(section.key)}
                        disabled={isSaving}
                      >
                        {isSaving ? '⏳ Salvando...' : '✓ Salvar'}
                      </button>
                      <button
                        type="button"
                        className="peipage-section-cancel-btn"
                        onClick={() => setEditingSection(null)}
                        disabled={isSaving}
                      >
                        ✗ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Fontes panel ─────────────────────────────────────────────────────────
  const renderSourcesPanel = () => (
    <div className="peipage-sources-panel">
      <div className="peipage-sources-header">
        <h3>📎 Fontes</h3>
        <button
          type="button"
          className="peipage-apply-btn"
          onClick={() => loadSourcesPreview({ resetSelections: false })}
          disabled={sourcesLoading || !selectedStudentId}
        >
          {sourcesLoading ? 'Aplicando...' : '🔄 Aplicar filtros'}
        </button>
      </div>

      {!selectedStudentId ? (
        <p className="peipage-sources-empty">Selecione um aluno para ver as fontes disponíveis.</p>
      ) : sourcesLoading ? (
        <p className="peipage-sources-loading">Carregando fontes...</p>
      ) : (
        <ul className="peipage-sources-list">
          {sourceOptions.map((source) => (
            <li key={source.key} className={!source.available ? 'peipage-source-disabled' : ''}>
              <label className="peipage-source-option">
                <input
                  type="checkbox"
                  checked={Boolean(selectedSources[source.key])}
                  disabled={!source.available}
                  onChange={(ev) => setSelectedSources((prev) => ({ ...prev, [source.key]: ev.target.checked }))}
                />
                <span>
                  {source.label}: <strong>{source.detail}</strong>
                </span>
              </label>

              {source.key === 'vector_documents' && selectedSources.vector_documents
                && (sourcesPreview?.vector_documents?.documents || []).length > 0 && (
                <ul className="peipage-docs-sublist">
                  {sourcesPreview.vector_documents.documents.map((doc) => (
                    <li key={doc.doc_id}>
                      <label className="peipage-source-option">
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(doc.doc_id)}
                          onChange={() => toggleDocumentId(doc.doc_id)}
                        />
                        <span title={doc.file_name}>{doc.caption || doc.file_name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {source.key === 'diary' && selectedSources.diary && renderPeriodPicker(diaryPeriod, setDiaryPeriod)}
              {source.key === 'family_diary' && selectedSources.family_diary && renderPeriodPicker(familyDiaryPeriod, setFamilyDiaryPeriod)}
              {source.key === 'diary_summary_individual' && selectedSources.diary_summary_individual && renderPeriodPicker(diarySummaryIndividualPeriod, setDiarySummaryIndividualPeriod)}
              {source.key === 'diary_summary_family' && selectedSources.diary_summary_family && renderPeriodPicker(diarySummaryFamilyPeriod, setDiarySummaryFamilyPeriod)}
              {source.key === 'saved_skill_results' && selectedSources.saved_skill_results && renderPeriodPicker(savedSkillResultsPeriod, setSavedSkillResultsPeriod)}
              {source.key === 'saved_peis_structured' && selectedSources.saved_peis_structured && renderPeriodPicker(savedPeisStructuredPeriod, setSavedPeisStructuredPeriod)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const hasLastAssistant = messages.some((m) => m.role === 'assistant' && !m.isError);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="peipage-root">
      {/* Header */}
      <div className="peipage-header">
        <div className="peipage-header-left">
          <h1 className="peipage-title">📄 PEI Estruturado</h1>
          <p className="peipage-subtitle">Geração de Plano Educacional Individualizado com saída estruturada</p>
        </div>
        <div className="peipage-student-selector">
          <select
            value={selectedStudentId}
            onChange={handleStudentChange}
            className="peipage-student-select"
            disabled={registeredStudents.length === 0}
          >
            <option value="">— Selecionar aluno —</option>
            {registeredStudents.map((s) => {
              const school = getSchoolName(s);
              return (
                <option key={s.id} value={s.id}>
                  {s.name}{school ? ` — ${school}` : ''}
                </option>
              );
            })}
          </select>
          {selectedStudentName && (
            <span className="peipage-student-badge">{selectedStudentName}</span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="peipage-layout">
        {/* Left: Sources */}
        <aside className={`peipage-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <button
            type="button"
            className="peipage-sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Ocultar fontes' : 'Mostrar fontes'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
          {sidebarOpen && renderSourcesPanel()}
        </aside>

        {/* Right: Tabs */}
        <main className="peipage-main">
          {/* Tab bar */}
          <div className="peipage-tabs">
            <button
              type="button"
              className={`peipage-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Chat
            </button>
            <button
              type="button"
              className={`peipage-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => { setActiveTab('saved'); loadSavedPeis(); }}
            >
              📋 PEIs Salvos
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`peipage-tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
                onClick={() => setActiveTab('prompts')}
              >
                📝 Prompts
              </button>
            )}
          </div>

          {/* ── Tab: Chat ── */}
          {activeTab === 'chat' && (
            <div className="peipage-chat-area">
              {/* Generate button */}
              <div className="peipage-generate-bar">
                <button
                  type="button"
                  className="peipage-generate-btn"
                  onClick={handleGeneratePEI}
                  disabled={chatLoading || !selectedStudentId}
                >
                  {chatLoading ? '⏳ Gerando...' : '▶ Gerar PEI'}
                </button>
                {hasLastAssistant && (
                  <>
                    <button
                      type="button"
                      className="peipage-save-btn"
                      onClick={handleSavePEI}
                      disabled={chatLoading}
                    >
                      💾 Salvar PEI
                    </button>
                    <button
                      type="button"
                      className="peipage-download-btn"
                      onClick={() => {
                        const last = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isError);
                        if (last) handleDownloadJson(last.content, selectedStudentName);
                      }}
                      disabled={chatLoading}
                      title="Baixar JSON"
                    >
                      ⬇ JSON
                    </button>
                    <button
                      type="button"
                      className="peipage-download-btn"
                      onClick={() => {
                        const last = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isError);
                        if (last) handleDownloadPdf(last.content, selectedStudentName, selectedSchool);
                      }}
                      disabled={chatLoading || pdfLoading}
                      title="Baixar PDF"
                    >
                      {pdfLoading ? '⏳ PDF...' : '⬇ PDF'}
                    </button>
                  </>
                )}
                {messages.length > 0 && (
                  <button
                    type="button"
                    className="peipage-clear-btn"
                    onClick={() => { setMessages([]); setSessionId(''); setExpandedSections(EMPTY_PEI_SECTIONS); }}
                    disabled={chatLoading}
                  >
                    🗑 Limpar
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="peipage-messages">
                {messages.length === 0 ? (
                  <div className="peipage-messages-empty">
                    {selectedStudentId
                      ? <p>Selecione as fontes e clique em <strong>▶ Gerar PEI</strong> para iniciar.</p>
                      : <p>Selecione um aluno para começar.</p>
                    }
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`peipage-message peipage-message-${msg.role} ${msg.isError ? 'peipage-message-error' : ''}`}>
                      <div className="peipage-message-role">{msg.role === 'user' ? '👤 Você' : '🤖 IA'}</div>
                      {msg.role === 'assistant' && msg.parsed ? (
                        renderPeiSections(msg.parsed, expandedSections, setExpandedSections)
                      ) : (
                        <div className="peipage-message-bubble">
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="peipage-message peipage-message-assistant">
                    <div className="peipage-message-role">🤖 IA</div>
                    <div className="peipage-message-bubble peipage-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Follow-up input */}
              {sessionId && (
                <form className="peipage-followup-form" onSubmit={handleSendFollowUp}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Peça ajustes... ex: Reescreva a seção 3 com mais detalhes"
                    disabled={chatLoading}
                    className="peipage-followup-input"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !inputMessage.trim()}
                    className="peipage-followup-btn"
                  >
                    Enviar
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Tab: PEIs Salvos ── */}
          {activeTab === 'saved' && (
            <div className="peipage-saved-area">
              {/* Filter */}
              <div className="peipage-saved-filters">
                <label>
                  Aluno:
                  <select
                    value={savedPeiStudentFilter}
                    onChange={(e) => { setSavedPeiStudentFilter(e.target.value); setSelectedSavedPei(null); }}
                    className="peipage-saved-filter-select"
                  >
                    <option value="">Todos</option>
                    {studentOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="peipage-saved-layout">
                {/* List */}
                <div className="peipage-saved-list">
                  {savedPeisLoading ? (
                    <p className="peipage-saved-loading">Carregando...</p>
                  ) : filteredSavedPeis.length === 0 ? (
                    <p className="peipage-saved-empty">Nenhum PEI salvo.</p>
                  ) : (
                    filteredSavedPeis.map((pei) => {
                      const parsed = parsePeiContent(pei.response);
                      return (
                        <div
                          key={pei.id}
                          className={`peipage-saved-item ${selectedSavedPei?.id === pei.id ? 'selected' : ''}`}
                          onClick={() => handleSelectSavedPei(pei)}
                        >
                          <div className="peipage-saved-item-name">{pei.student_name || '—'}</div>
                          <div className="peipage-saved-item-meta">
                            {formatDate(pei.created_at)}
                            {pei.saved_by_username ? ` · ${pei.saved_by_username}` : ''}
                          </div>
                          <div className="peipage-saved-item-sections">
                            {parsed
                              ? `${PEI_SECTIONS.filter((s) => parsed[s.key]).length} seções`
                              : 'texto livre'}
                          </div>
                          <button
                            type="button"
                            className="peipage-saved-delete-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSavedPei(pei.id); }}
                            title="Remover"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Detail */}
                <div className="peipage-saved-detail">
                  {!selectedSavedPei ? (
                    <div className="peipage-saved-detail-empty">
                      <p>Selecione um PEI salvo para visualizar.</p>
                    </div>
                  ) : (() => {
                    const parsed = parsePeiContent(selectedSavedPei.response);
                    return (
                      <>
                        <div className="peipage-saved-detail-header">
                          <div className="peipage-saved-detail-header-left">
                            <h3>{selectedSavedPei.student_name}</h3>
                            <span className="peipage-saved-detail-meta">
                              {formatDate(selectedSavedPei.created_at)}
                              {selectedSavedPei.saved_by_username ? ` · por ${selectedSavedPei.saved_by_username}` : ''}
                            </span>
                          </div>
                          <div className="peipage-saved-detail-actions">
                            <button
                              type="button"
                              className="peipage-download-btn"
                              onClick={() => handleDownloadJson(selectedSavedPei.response, selectedSavedPei.student_name)}
                              title="Baixar JSON"
                            >
                              ⬇ JSON
                            </button>
                            <button
                              type="button"
                              className="peipage-download-btn"
                              onClick={() => handleDownloadSavedPdf(selectedSavedPei)}
                              disabled={savedPdfLoading === selectedSavedPei.id}
                              title="Baixar PDF"
                            >
                              {savedPdfLoading === selectedSavedPei.id ? '⏳ PDF...' : '⬇ PDF'}
                            </button>
                          </div>
                        </div>
                        {parsed
                          ? renderPeiSections(parsed, savedSectionExpanded, setSavedSectionExpanded, { editable: true })
                          : (
                            <div className="peipage-saved-raw">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedSavedPei.response}</ReactMarkdown>
                            </div>
                          )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Prompts ── */}
          {activeTab === 'prompts' && isAdmin && (
            <div className="peipage-prompts-area">
              <div className="peipage-prompt-card">
                <h2>📝 Prompt do PEI Estruturado</h2>
                {promptLoading ? (
                  <p className="peipage-prompt-loading">Carregando prompt...</p>
                ) : (
                  <>
                    <p className="peipage-prompt-meta">
                      {promptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                      {promptUpdatedAt ? ` · Atualizado em ${new Date(promptUpdatedAt).toLocaleString('pt-BR')}` : ''}
                    </p>
                    <button
                      type="button"
                      className="peipage-prompt-open-btn"
                      onClick={() => setPromptModalOpen(true)}
                    >
                      Visualizar / Editar Prompt
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Prompt Modal ── */}
      {isAdmin && promptModalOpen && (
        <div className="peipage-modal-overlay" onClick={() => setPromptModalOpen(false)}>
          <div className="peipage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="peipage-modal-header">
              <h3>📝 Prompt do PEI Estruturado</h3>
              <button className="peipage-modal-close" onClick={() => setPromptModalOpen(false)}>✕</button>
            </div>

            <div className="peipage-modal-body">
              <p className="peipage-prompt-meta">
                {promptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                {promptUpdatedAt ? ` · Atualizado em ${new Date(promptUpdatedAt).toLocaleString('pt-BR')}` : ''}
              </p>

              <div className="peipage-modal-fields">
                <label>
                  <div className="peipage-prompt-meta">Prompt salvo</div>
                  <select
                    className="peipage-modal-input"
                    value={promptSelectedId}
                    onChange={(e) => {
                      setPromptSelectedId(e.target.value);
                      updatePromptFormFrom(findPromptOption(e.target.value));
                    }}
                  >
                    {promptOptions.length === 0 && <option value="">Nenhum prompt salvo</option>}
                    {promptOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.is_default ? ' [base]' : ''}{p.is_active ? ' [ativo]' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div className="peipage-prompt-meta">Nome</div>
                  <input
                    className="peipage-modal-input"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Nome do prompt"
                  />
                </label>

                <label>
                  <div className="peipage-prompt-meta">Descrição</div>
                  <input
                    className="peipage-modal-input"
                    value={promptDescription}
                    onChange={(e) => setPromptDescription(e.target.value)}
                    placeholder="Descrição opcional"
                  />
                </label>

                <label>
                  <div className="peipage-prompt-meta">Conteúdo</div>
                  <textarea
                    className="peipage-modal-textarea"
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(e.target.value)}
                    rows={20}
                  />
                </label>
              </div>
            </div>

            <div className="peipage-modal-actions">
              <button type="button" className="peipage-prompt-btn secondary" onClick={handleNewPrompt} disabled={promptSaving || promptResetting}>
                Novo prompt
              </button>
              <button type="button" className="peipage-prompt-btn secondary" onClick={handleDeletePrompt} disabled={promptSaving || promptResetting || !promptSelectedId}>
                Excluir
              </button>
              <button type="button" className="peipage-prompt-btn secondary" onClick={handleResetPrompt} disabled={promptResetting || promptSaving}>
                {promptResetting ? 'Restaurando...' : 'Restaurar base'}
              </button>
              <button type="button" className="peipage-prompt-btn ghost" onClick={() => setPromptModalOpen(false)} disabled={promptSaving || promptResetting}>
                Cancelar
              </button>
              <button type="button" className="peipage-prompt-btn primary" onClick={handleSavePrompt} disabled={promptSaving || promptResetting || !promptDraft.trim() || !promptName.trim() || !promptDirty}>
                {promptSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="peipage-prompt-btn primary" onClick={handleUsePrompt} disabled={promptSaving || promptResetting || !promptDraft.trim() || !promptName.trim()}>
                {promptSaving ? 'Ativando...' : 'Usar este prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PEIPage;
