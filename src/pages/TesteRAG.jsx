import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ragAPI, schoolAPI, studentAPI } from '../services/api';
import './TesteRAG.css';

const TesteRAG = () => {
  // --- Estudantes (contexto para chat/PEI) ---
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // {student_name, school, documents, ...}
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registeredSchools, setRegisteredSchools] = useState([]);

  // --- Chat ---
  const [chatHistories, setChatHistories] = useState({});
  const [chatSessionIds, setChatSessionIds] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [chatResetLoading, setChatResetLoading] = useState(false);
  const [selectedChatStudentId, setSelectedChatStudentId] = useState('');
  const [chatSourcesPreview, setChatSourcesPreview] = useState(null);
  const [chatSourcesLoading, setChatSourcesLoading] = useState(false);
  const [chatSelectedSources, setChatSelectedSources] = useState({
    vector_documents: true,
    diary: true,
    pdi: true,
    student_pre_registration: true,
    teachers_pre_registration: true,
    school_pre_registration: true,
    linked_peis: true,
  });
  const messagesEndRef = useRef(null);
  const chatLoadRequestRef = useRef(0);

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const sanitizeFilenamePart = (value) => (
    String(value || 'estudante')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
  );

  const buildTimestampFilenamePart = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  const toPdfBlob = (value) => {
    if (value instanceof Blob) return value;
    if (value?.blob instanceof Blob) return value.blob;
    if (value instanceof ArrayBuffer) return new Blob([value], { type: 'application/pdf' });
    return null;
  };

  const getSchoolNameFromRegisteredStudent = (studentItem) => {
    if (!studentItem) return '';
    const schoolItem = studentItem.school_id
      ? registeredSchools.find((item) => item.id === studentItem.school_id)
      : null;
    return schoolItem?.name || studentItem.school_name || '';
  };

  const findRagStudentByNameSchool = (studentName, schoolName) => (
    students.find((studentItem) => (
      normalizeText(studentItem.student_name) === normalizeText(studentName)
      && normalizeText(studentItem.school) === normalizeText(schoolName)
    ))
  );

  const buildChatStudentContext = (studentItem) => {
    if (!studentItem) return null;

    const studentName = studentItem.name || '';
    const schoolName = getSchoolNameFromRegisteredStudent(studentItem);
    const ragStudent = findRagStudentByNameSchool(studentName, schoolName);

    if (ragStudent) return ragStudent;

    return {
      student_name: studentName,
      school: schoolName,
      documents: [],
      document_count: 0,
    };
  };

  // --- Derived: chat history para o estudante ativo ---
  const studentKey = selectedStudent
    ? `${selectedStudent.student_name}__${selectedStudent.school}`
    : null;

  const messages = studentKey ? (chatHistories[studentKey] || []) : [];
  const activeSessionId = studentKey ? (chatSessionIds[studentKey] || '') : '';

  const setMessages = (updater) => {
    if (!studentKey) return;
    setChatHistories((prev) => {
      const current = prev[studentKey] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [studentKey]: next };
    });
  };

  const setMessagesForKey = (key, updater) => {
    if (!key) return;
    setChatHistories((prev) => {
      const current = prev[key] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [key]: next };
    });
  };

  // --- PEI ---
  const [studentName, setStudentName] = useState('');
  const [school, setSchool] = useState('');
  const [peiSelectedStudentId, setPeiSelectedStudentId] = useState('');
  const [peiLoading, setPeiLoading] = useState(false);
  const [peiResult, setPeiResult] = useState(null);
  const [peiProgress, setPeiProgress] = useState({ stage: 0, label: '' });
  const [peiList, setPeiList] = useState([]);
  const [viewingPeiUrl, setViewingPeiUrl] = useState(null);
  const [peiViewerLoading, setPeiViewerLoading] = useState(false);
  const [peiSourcesPreview, setPeiSourcesPreview] = useState(null);
  const [peiSourcesLoading, setPeiSourcesLoading] = useState(false);
  const [peiSelectedSources, setPeiSelectedSources] = useState({
    vector_documents: true,
    diary: true,
    pdi: true,
    student_pre_registration: true,
    teachers_pre_registration: true,
    school_pre_registration: true,
    linked_peis: true,
  });
  const [peiPrompt, setPeiPrompt] = useState('');
  const [initialPeiPrompt, setInitialPeiPrompt] = useState('');
  const [peiPromptLoading, setPeiPromptLoading] = useState(true);
  const [peiPromptSaving, setPeiPromptSaving] = useState(false);
  const [peiPromptResetting, setPeiPromptResetting] = useState(false);
  const [peiPromptUpdatedAt, setPeiPromptUpdatedAt] = useState(null);
  const [peiPromptIsCustom, setPeiPromptIsCustom] = useState(false);
  const [peiPromptModalOpen, setPeiPromptModalOpen] = useState(false);
  const [peiPromptDraft, setPeiPromptDraft] = useState('');
  const [lastPeiClientDurationMs, setLastPeiClientDurationMs] = useState(null);
  const [chatPrompt, setChatPrompt] = useState('');
  const [initialChatPrompt, setInitialChatPrompt] = useState('');
  const [chatPromptLoading, setChatPromptLoading] = useState(true);
  const [chatPromptSaving, setChatPromptSaving] = useState(false);
  const [chatPromptResetting, setChatPromptResetting] = useState(false);
  const [chatPromptUpdatedAt, setChatPromptUpdatedAt] = useState(null);
  const [chatPromptIsCustom, setChatPromptIsCustom] = useState(false);
  const [chatPromptModalOpen, setChatPromptModalOpen] = useState(false);
  const [chatPromptDraft, setChatPromptDraft] = useState('');
  const [peiPromptOptions, setPeiPromptOptions] = useState([]);
  const [chatPromptOptions, setChatPromptOptions] = useState([]);
  const [peiPromptSelectedId, setPeiPromptSelectedId] = useState('');
  const [chatPromptSelectedId, setChatPromptSelectedId] = useState('');
  const [peiPromptName, setPeiPromptName] = useState('');
  const [chatPromptName, setChatPromptName] = useState('');
  const [peiPromptDescription, setPeiPromptDescription] = useState('');
  const [chatPromptDescription, setChatPromptDescription] = useState('');
  const [peiPromptInitialState, setPeiPromptInitialState] = useState({ id: '', name: '', description: '', content: '' });
  const [chatPromptInitialState, setChatPromptInitialState] = useState({ id: '', name: '', description: '', content: '' });

  useEffect(() => {
    loadStudents();
    loadRegisteredCatalogs();
    loadPeiPrompt();
    loadChatPrompt();
  }, []);

  useEffect(() => {
    if (!selectedChatStudentId) {
      setSelectedStudent(null);
      setChatSourcesPreview(null);
      setChatHistoryLoading(false);
      return;
    }

    const studentItem = registeredStudents.find((item) => item.id === selectedChatStudentId);
    if (!studentItem) {
      setSelectedStudent(null);
      setChatSourcesPreview(null);
      setChatHistoryLoading(false);
      return;
    }

    const nextStudent = buildChatStudentContext(studentItem);
    setSelectedStudent(nextStudent);
    const schoolName = getSchoolNameFromRegisteredStudent(studentItem);
    loadChatSourcesPreview({
      studentId: studentItem.id,
      studentName: studentItem.name || '',
      school: schoolName,
    });

    const nextStudentKey = nextStudent
      ? `${nextStudent.student_name}__${nextStudent.school}`
      : null;
    loadChatHistoryForStudent({
      studentId: studentItem.id,
      studentName: studentItem.name || '',
      school: schoolName,
      targetStudentKey: nextStudentKey,
    });
  }, [selectedChatStudentId, registeredStudents, registeredSchools, students]);

  const loadChatHistoryForStudent = async ({ studentId, studentName: selectedStudentName, school: selectedSchool, targetStudentKey }) => {
    if (!studentId || !targetStudentKey) {
      return;
    }

    const requestId = chatLoadRequestRef.current + 1;
    chatLoadRequestRef.current = requestId;
    setChatHistoryLoading(true);

    try {
      const data = await ragAPI.getCurrentChatSession({
        studentId,
        studentName: selectedStudentName,
        school: selectedSchool,
      });

      if (chatLoadRequestRef.current !== requestId) return;

      const loadedMessages = Array.isArray(data?.messages)
        ? data.messages
          .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
          .map((item) => ({
            role: item.role,
            content: item.content || '',
            sources: Array.isArray(item.sources?.documents)
              ? item.sources.documents
              : (Array.isArray(item.sources) ? item.sources : []),
          }))
        : [];

      setMessagesForKey(targetStudentKey, loadedMessages);
      if (data?.session_id) {
        setChatSessionIds((prev) => ({
          ...prev,
          [targetStudentKey]: data.session_id,
        }));
      }
    } catch (err) {
      if (chatLoadRequestRef.current !== requestId) return;
      console.error('Erro ao carregar histórico do chat:', err);
      setMessagesForKey(targetStudentKey, []);
    } finally {
      if (chatLoadRequestRef.current === requestId) {
        setChatHistoryLoading(false);
      }
    }
  };

  const loadPeiPrompt = async () => {
    setPeiPromptLoading(true);
    try {
      const data = await ragAPI.getPEIPrompt();
      const prompts = Array.isArray(data?.available_prompts) ? data.available_prompts : [];
      const selectedPrompt = prompts.find((item) => item.id === data?.current_prompt_id)
        || prompts.find((item) => item.is_active)
        || prompts[0]
        || null;
      const promptText = selectedPrompt?.content || data?.prompt || '';

      setPeiPromptOptions(prompts);
      setPeiPromptSelectedId(selectedPrompt?.id || '');
      setPeiPromptName(selectedPrompt?.name || '');
      setPeiPromptDescription(selectedPrompt?.description || '');
      setPeiPrompt(promptText);
      setInitialPeiPrompt(promptText);
      setPeiPromptDraft(promptText);
      setPeiPromptUpdatedAt(selectedPrompt?.updated_at || data?.updated_at || null);
      setPeiPromptIsCustom(Boolean(data?.is_custom));
      setPeiPromptInitialState({
        id: selectedPrompt?.id || '',
        name: selectedPrompt?.name || '',
        description: selectedPrompt?.description || '',
        content: promptText,
      });
    } catch (err) {
      alert('Erro ao carregar prompt do PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptLoading(false);
    }
  };

  const loadChatPrompt = async () => {
    setChatPromptLoading(true);
    try {
      const data = await ragAPI.getChatPrompt();
      const prompts = Array.isArray(data?.available_prompts) ? data.available_prompts : [];
      const selectedPrompt = prompts.find((item) => item.id === data?.current_prompt_id)
        || prompts.find((item) => item.is_active)
        || prompts[0]
        || null;
      const promptText = selectedPrompt?.content || data?.prompt || '';

      setChatPromptOptions(prompts);
      setChatPromptSelectedId(selectedPrompt?.id || '');
      setChatPromptName(selectedPrompt?.name || '');
      setChatPromptDescription(selectedPrompt?.description || '');
      setChatPrompt(promptText);
      setInitialChatPrompt(promptText);
      setChatPromptDraft(promptText);
      setChatPromptUpdatedAt(selectedPrompt?.updated_at || data?.updated_at || null);
      setChatPromptIsCustom(Boolean(data?.is_custom));
      setChatPromptInitialState({
        id: selectedPrompt?.id || '',
        name: selectedPrompt?.name || '',
        description: selectedPrompt?.description || '',
        content: promptText,
      });
    } catch (err) {
      alert('Erro ao carregar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptLoading(false);
    }
  };

  const loadRegisteredCatalogs = async () => {
    try {
      const [studentsData, schoolsData] = await Promise.all([
        studentAPI.getAllStudents(),
        schoolAPI.getAllSchools(),
      ]);

      setRegisteredStudents(Array.isArray(studentsData) ? studentsData : []);
      setRegisteredSchools(Array.isArray(schoolsData) ? schoolsData : []);
    } catch (err) {
      console.error('Erro ao carregar catálogos de cadastro:', err);
    }
  };

  const loadPeiList = async (studentId, sName, sSchool) => {
    try {
      const data = await ragAPI.getPEIs({
        studentId,
        studentName: sName,
        school: sSchool,
      });
      setPeiList(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) { console.error(e); }
  };

  useEffect(() => () => {
    setViewingPeiUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const clearViewingPei = () => {
    setViewingPeiUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handleViewPEI = async (peiId) => {
    try {
      setPeiViewerLoading(true);
      const payload = await ragAPI.downloadPEIPdf(peiId);
      const blob = toPdfBlob(payload);
      if (!blob) throw new Error('Arquivo PDF inválido retornado pela API.');
      const blobUrl = URL.createObjectURL(blob);
      setViewingPeiUrl((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return blobUrl;
      });
    } catch (err) {
      alert('Erro ao visualizar PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiViewerLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, studentKey]);

  const loadStudents = async () => {
    try {
      const data = await ragAPI.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
    }
  };

  const handleChatStudentChange = (event) => {
    setSelectedChatStudentId(event.target.value);
  };

  const handlePeiStudentChange = (event) => {
    const studentId = event.target.value;
    setPeiSelectedStudentId(studentId);

    if (!studentId) {
      setStudentName('');
      setSchool('');
      setPeiList([]);
      setPeiSourcesPreview(null);
      return;
    }

    const studentItem = registeredStudents.find((item) => item.id === studentId);
    if (!studentItem) {
      setStudentName('');
      setSchool('');
      setPeiList([]);
      setPeiSourcesPreview(null);
      return;
    }

    const schoolItem = studentItem.school_id
      ? registeredSchools.find((item) => item.id === studentItem.school_id)
      : null;
    const schoolName = schoolItem?.name || studentItem.school_name || '';

    setStudentName(studentItem.name || '');
    setSchool(schoolName);

    loadPeiList(studentId, studentItem.name || '', schoolName);

    loadPeiSourcesPreview({
      studentId,
      studentName: studentItem.name || '',
      school: schoolName,
    });
  };

  const loadPeiSourcesPreview = async ({ studentId, studentName: selectedStudentName, school: selectedSchool }) => {
    if (!studentId || !selectedStudentName) {
      setPeiSourcesPreview(null);
      return;
    }

    setPeiSourcesLoading(true);
    try {
      const data = await ragAPI.getPEISourcesPreview({
        studentId,
        studentName: selectedStudentName,
        school: selectedSchool,
      });
      const nextSources = data?.sources || null;
      setPeiSourcesPreview(nextSources);

      if (nextSources) {
        setPeiSelectedSources({
          vector_documents: Boolean(nextSources.vector_documents?.included),
          diary: Boolean(nextSources.diary?.included),
          pdi: Boolean(nextSources.pdi?.included),
          student_pre_registration: Boolean(nextSources.student_pre_registration?.included),
          teachers_pre_registration: Boolean(nextSources.teachers_pre_registration?.included),
          school_pre_registration: Boolean(nextSources.school_pre_registration?.included),
          linked_peis: Boolean(nextSources.linked_peis?.included),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar prévia de fontes do PEI:', err);
      setPeiSourcesPreview(null);
    } finally {
      setPeiSourcesLoading(false);
    }
  };

  const loadChatSourcesPreview = async ({ studentId, studentName: selectedStudentName, school: selectedSchool }) => {
    if (!studentId || !selectedStudentName) {
      setChatSourcesPreview(null);
      return;
    }

    setChatSourcesLoading(true);
    try {
      const data = await ragAPI.getPEISourcesPreview({
        studentId,
        studentName: selectedStudentName,
        school: selectedSchool,
      });

      const nextSources = data?.sources || null;
      setChatSourcesPreview(nextSources);

      if (nextSources) {
        setChatSelectedSources({
          vector_documents: Boolean(nextSources.vector_documents?.included),
          diary: Boolean(nextSources.diary?.included),
          pdi: Boolean(nextSources.pdi?.included),
          student_pre_registration: Boolean(nextSources.student_pre_registration?.included),
          teachers_pre_registration: Boolean(nextSources.teachers_pre_registration?.included),
          school_pre_registration: Boolean(nextSources.school_pre_registration?.included),
          linked_peis: Boolean(nextSources.linked_peis?.included),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar prévia de fontes do Chat:', err);
      setChatSourcesPreview(null);
    } finally {
      setChatSourcesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const data = await ragAPI.sendMessage({
        message: text,
        sessionId: activeSessionId,
        studentId: selectedChatStudentId,
        studentName: selectedStudent?.student_name || '',
        school: selectedStudent?.school || '',
        selectedSources: chatSelectedSources,
      });

      if (data?.session_id && studentKey) {
        setChatSessionIds((prev) => ({
          ...prev,
          [studentKey]: data.session_id,
        }));
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Erro: ' + (err.response?.data?.error || err.message),
          isError: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChatHistory = async () => {
    if (!selectedStudent || !selectedChatStudentId) return;
    if (!window.confirm('Limpar todo o histórico deste aluno para o seu usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setChatResetLoading(true);
    try {
      const data = await ragAPI.clearCurrentChatSession({
        studentId: selectedChatStudentId,
        studentName: selectedStudent.student_name,
        school: selectedStudent.school,
      });

      if (studentKey) {
        setMessagesForKey(studentKey, []);
      }

      if (data?.session_id && studentKey) {
        setChatSessionIds((prev) => ({
          ...prev,
          [studentKey]: data.session_id,
        }));
      }
    } catch (err) {
      alert('Erro ao limpar histórico: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatResetLoading(false);
    }
  };

  const PEI_STAGES = [
    { pct: 15, label: 'Buscando documentos...' },
    { pct: 40, label: 'Analisando perfil do estudante...' },
    { pct: 75, label: 'Gerando PEI com IA...' },
    { pct: 92, label: 'Finalizando PDF...' },
  ];

  const handleGeneratePEI = async (e) => {
    e.preventDefault();
    if (!peiSelectedStudentId) {
      alert('Selecione um aluno cadastrado para gerar o PEI.');
      return;
    }
    if (!studentName.trim() || !school.trim()) {
      alert('O aluno selecionado precisa estar vinculado a uma escola no cadastro.');
      return;
    }

    const selectedCount = Object.values(peiSelectedSources).filter(Boolean).length;
    if (selectedCount === 0) {
      alert('Selecione pelo menos uma fonte para gerar o PEI.');
      return;
    }

    setPeiLoading(true);
    setPeiResult(null);
    clearViewingPei();
    setLastPeiClientDurationMs(null);
    const startedAt = performance.now();

    // Animate progress stages
    let stageIdx = 0;
    setPeiProgress(PEI_STAGES[0]);
    const timer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, PEI_STAGES.length - 1);
      setPeiProgress(PEI_STAGES[stageIdx]);
    }, 3500);

    try {
      const data = await ragAPI.generatePEI({
        student_id: peiSelectedStudentId,
        student_name: studentName.trim(),
        school: school.trim(),
        selected_sources: peiSelectedSources,
      });
      const clientDurationMs = Math.max(0, Math.round(performance.now() - startedAt));
      clearInterval(timer);
      setPeiProgress({ pct: 100, label: 'PEI gerado com sucesso!' });
      setLastPeiClientDurationMs(clientDurationMs);
      setPeiResult({ ...data, client_generation_time_ms: clientDurationMs });
      // Refresh PEI list
      await loadPeiList(peiSelectedStudentId, studentName.trim(), school.trim());
      setTimeout(() => setPeiProgress({ stage: 0, label: '' }), 1200);
    } catch (err) {
      clearInterval(timer);
      setPeiProgress({ stage: 0, label: '' });
      alert('Erro ao gerar PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiLoading(false);
    }
  };

  const handleDeletePEI = async (peiId) => {
    if (!window.confirm('Remover este PEI?')) return;
    try {
      await ragAPI.deletePEI(peiId);
      clearViewingPei();
      await loadPeiList(peiSelectedStudentId, studentName.trim(), school.trim());
    } catch (err) {
      alert('Erro ao remover: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDownloadPEI = async (peiId, sName) => {
    try {
      const payload = typeof ragAPI.downloadPEIPdfWithMetadata === 'function'
        ? await ragAPI.downloadPEIPdfWithMetadata(peiId)
        : await ragAPI.downloadPEIPdf(peiId);
      const blob = toPdfBlob(payload);
      if (!blob) throw new Error('Arquivo PDF inválido retornado pela API.');
      const filename = payload?.filename;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fallbackName = `PEI_${sanitizeFilenamePart(sName)}_${buildTimestampFilenamePart()}.pdf`;
      a.download = filename || fallbackName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Erro ao baixar PDF: ' + err.message);
    }
  };

  const updatePromptFormFromPrompt = (scope, promptItem) => {
    const safePrompt = promptItem || {};
    if (scope === 'pei') {
      setPeiPromptSelectedId(safePrompt.id || '');
      setPeiPromptName(safePrompt.name || '');
      setPeiPromptDescription(safePrompt.description || '');
      setPeiPromptDraft(safePrompt.content || '');
      setPeiPromptInitialState({
        id: safePrompt.id || '',
        name: safePrompt.name || '',
        description: safePrompt.description || '',
        content: safePrompt.content || '',
      });
      return;
    }

    setChatPromptSelectedId(safePrompt.id || '');
    setChatPromptName(safePrompt.name || '');
    setChatPromptDescription(safePrompt.description || '');
    setChatPromptDraft(safePrompt.content || '');
    setChatPromptInitialState({
      id: safePrompt.id || '',
      name: safePrompt.name || '',
      description: safePrompt.description || '',
      content: safePrompt.content || '',
    });
  };

  const getPromptOptions = (scope) => (scope === 'pei' ? peiPromptOptions : chatPromptOptions);

  const findPromptOption = (scope, promptId) => getPromptOptions(scope).find((item) => item.id === promptId) || null;

  const resetPromptForm = (scope) => {
    const prompts = getPromptOptions(scope);
    const selected = prompts.find((item) => item.id === (scope === 'pei' ? peiPromptSelectedId : chatPromptSelectedId))
      || prompts.find((item) => item.is_active)
      || prompts[0]
      || null;
    updatePromptFormFromPrompt(scope, selected);
  };

  const persistPrompt = async ({ scope, promptId, name, description, content, activate = false }) => {
    const payload = {
      scope,
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

  const handleSavePeiPrompt = async () => {
    if (!peiPromptDraft.trim() || !peiPromptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }

    setPeiPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        scope: 'pei',
        promptId: peiPromptSelectedId,
        name: peiPromptName,
        description: peiPromptDescription,
        content: peiPromptDraft,
        activate: false,
      });
      await loadPeiPrompt();
      if (prompt?.id && !prompt?.is_active) {
        setPeiPromptSelectedId(prompt.id);
        updatePromptFormFromPrompt('pei', prompt);
      }
      alert('Prompt do PEI salvo com sucesso.');
    } catch (err) {
      alert('Erro ao salvar prompt do PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptSaving(false);
    }
  };

  const handleUsePeiPrompt = async () => {
    if (!peiPromptDraft.trim() || !peiPromptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }

    setPeiPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        scope: 'pei',
        promptId: peiPromptSelectedId,
        name: peiPromptName,
        description: peiPromptDescription,
        content: peiPromptDraft,
        activate: true,
      });
      if (prompt?.id) {
        await ragAPI.activatePrompt(prompt.id);
      }
      await loadPeiPrompt();
      setPeiPromptModalOpen(false);
      alert('Prompt do PEI ativado com sucesso.');
    } catch (err) {
      alert('Erro ao ativar prompt do PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptSaving(false);
    }
  };

  const handleNewPeiPrompt = () => {
    setPeiPromptSelectedId('');
    setPeiPromptName('');
    setPeiPromptDescription('');
    setPeiPromptDraft('');
    setPeiPromptInitialState({ id: '', name: '', description: '', content: '' });
  };

  const handleDeletePeiPrompt = async () => {
    if (!peiPromptSelectedId) return;
    const selected = findPromptOption('pei', peiPromptSelectedId);
    if (selected?.is_default) {
      alert('O prompt base não pode ser removido.');
      return;
    }
    if (!window.confirm('Excluir este prompt?')) return;
    setPeiPromptResetting(true);
    try {
      await ragAPI.deletePrompt(peiPromptSelectedId);
      await loadPeiPrompt();
      alert('Prompt excluído com sucesso.');
    } catch (err) {
      alert('Erro ao excluir prompt do PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptResetting(false);
    }
  };

  const handleOpenPeiPromptModal = () => {
    resetPromptForm('pei');
    setPeiPromptModalOpen(true);
  };

  const handleClosePeiPromptModal = () => {
    resetPromptForm('pei');
    setPeiPromptModalOpen(false);
  };

  const handleResetPeiPrompt = async () => {
    if (!window.confirm('Restaurar o prompt atual para o prompt base salvo?')) return;

    setPeiPromptResetting(true);
    try {
      await ragAPI.resetPEIPrompt();
      await loadPeiPrompt();
      alert('Prompt restaurado para a versão base.');
    } catch (err) {
      alert('Erro ao restaurar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptResetting(false);
    }
  };

  const handleSaveChatPrompt = async () => {
    if (!chatPromptDraft.trim() || !chatPromptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }

    setChatPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        scope: 'chat',
        promptId: chatPromptSelectedId,
        name: chatPromptName,
        description: chatPromptDescription,
        content: chatPromptDraft,
        activate: false,
      });
      await loadChatPrompt();
      if (prompt?.id && !prompt?.is_active) {
        setChatPromptSelectedId(prompt.id);
        updatePromptFormFromPrompt('chat', prompt);
      }
      alert('Prompt do Chat salvo com sucesso.');
    } catch (err) {
      alert('Erro ao salvar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptSaving(false);
    }
  };

  const handleUseChatPrompt = async () => {
    if (!chatPromptDraft.trim() || !chatPromptName.trim()) {
      alert('Nome e prompt são obrigatórios.');
      return;
    }

    setChatPromptSaving(true);
    try {
      const prompt = await persistPrompt({
        scope: 'chat',
        promptId: chatPromptSelectedId,
        name: chatPromptName,
        description: chatPromptDescription,
        content: chatPromptDraft,
        activate: true,
      });
      if (prompt?.id) {
        await ragAPI.activatePrompt(prompt.id);
      }
      await loadChatPrompt();
      setChatPromptModalOpen(false);
      alert('Prompt do Chat ativado com sucesso.');
    } catch (err) {
      alert('Erro ao ativar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptSaving(false);
    }
  };

  const handleNewChatPrompt = () => {
    setChatPromptSelectedId('');
    setChatPromptName('');
    setChatPromptDescription('');
    setChatPromptDraft('');
    setChatPromptInitialState({ id: '', name: '', description: '', content: '' });
  };

  const handleDeleteChatPrompt = async () => {
    if (!chatPromptSelectedId) return;
    const selected = findPromptOption('chat', chatPromptSelectedId);
    if (selected?.is_default) {
      alert('O prompt base não pode ser removido.');
      return;
    }
    if (!window.confirm('Excluir este prompt?')) return;
    setChatPromptResetting(true);
    try {
      await ragAPI.deletePrompt(chatPromptSelectedId);
      await loadChatPrompt();
      alert('Prompt excluído com sucesso.');
    } catch (err) {
      alert('Erro ao excluir prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptResetting(false);
    }
  };

  const handleOpenChatPromptModal = () => {
    resetPromptForm('chat');
    setChatPromptModalOpen(true);
  };

  const handleCloseChatPromptModal = () => {
    resetPromptForm('chat');
    setChatPromptModalOpen(false);
  };

  const handleResetChatPrompt = async () => {
    if (!window.confirm('Restaurar o prompt atual do Chat para o prompt base salvo?')) return;

    setChatPromptResetting(true);
    try {
      await ragAPI.resetChatPrompt();
      await loadChatPrompt();
      alert('Prompt do Chat restaurado para a versão base.');
    } catch (err) {
      alert('Erro ao restaurar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptResetting(false);
    }
  };

  const peiPromptDirty = JSON.stringify(peiPromptInitialState) !== JSON.stringify({
    id: peiPromptSelectedId,
    name: peiPromptName,
    description: peiPromptDescription,
    content: peiPromptDraft,
  });
  const chatPromptDirty = JSON.stringify(chatPromptInitialState) !== JSON.stringify({
    id: chatPromptSelectedId,
    name: chatPromptName,
    description: chatPromptDescription,
    content: chatPromptDraft,
  });

  const formatPreviewDetail = (baseDetail, excerpt) => {
    const cleanExcerpt = String(excerpt || '').trim();
    if (!cleanExcerpt) return baseDetail;
    const shortExcerpt = cleanExcerpt.slice(0, 90);
    return `${baseDetail} · ${shortExcerpt}${cleanExcerpt.length > 90 ? '...' : ''}`;
  };

  const chatSourceOptions = [
    {
      key: 'vector_documents',
      label: 'Documentos do RAG',
      detail: formatPreviewDetail(
        `${chatSourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`,
        chatSourcesPreview?.vector_documents?.excerpt,
      ),
      available: Boolean(chatSourcesPreview?.vector_documents?.included),
    },
    {
      key: 'diary',
      label: 'Diário Individual',
      detail: chatSourcesPreview?.diary?.included
        ? formatPreviewDetail(
            `${chatSourcesPreview.diary.entries_count} entrada(s)`,
            chatSourcesPreview?.diary?.excerpt,
          )
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.diary?.included),
    },
    {
      key: 'pdi',
      label: 'PDI',
      detail: chatSourcesPreview?.pdi?.included
        ? formatPreviewDetail('encontrado', chatSourcesPreview?.pdi?.excerpt)
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.pdi?.included),
    },
    {
      key: 'student_pre_registration',
      label: 'Pré-cadastro do Aluno',
      detail: chatSourcesPreview?.student_pre_registration?.included ? 'incluído' : 'não encontrado',
      available: Boolean(chatSourcesPreview?.student_pre_registration?.included),
    },
    {
      key: 'teachers_pre_registration',
      label: 'Pré-cadastro de Docente(s)',
      detail: chatSourcesPreview?.teachers_pre_registration?.included
        ? `${chatSourcesPreview.teachers_pre_registration.count || 0} docente(s)`
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.teachers_pre_registration?.included),
    },
    {
      key: 'school_pre_registration',
      label: 'Pré-cadastro da Escola',
      detail: chatSourcesPreview?.school_pre_registration?.included
        ? (chatSourcesPreview.school_pre_registration.school_name || 'incluído')
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.school_pre_registration?.included),
    },
    {
      key: 'linked_peis',
      label: 'PEIs anteriores vinculados',
      detail: chatSourcesPreview?.linked_peis?.included
        ? formatPreviewDetail(
            `${chatSourcesPreview.linked_peis.count || 0} PEI(s)`,
            chatSourcesPreview?.linked_peis?.excerpt,
          )
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.linked_peis?.included),
    },
  ];

  const sourceOptions = [
    {
      key: 'vector_documents',
      label: 'Documentos do RAG',
      detail: formatPreviewDetail(
        `${peiSourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`,
        peiSourcesPreview?.vector_documents?.excerpt,
      ),
      available: Boolean(peiSourcesPreview?.vector_documents?.included),
    },
    {
      key: 'diary',
      label: 'Diário Individual',
      detail: peiSourcesPreview?.diary?.included
        ? formatPreviewDetail(
            `${peiSourcesPreview.diary.entries_count} entrada(s)`,
            peiSourcesPreview?.diary?.excerpt,
          )
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.diary?.included),
    },
    {
      key: 'pdi',
      label: 'PDI',
      detail: peiSourcesPreview?.pdi?.included
        ? formatPreviewDetail('encontrado', peiSourcesPreview?.pdi?.excerpt)
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.pdi?.included),
    },
    {
      key: 'student_pre_registration',
      label: 'Pré-cadastro do Aluno',
      detail: peiSourcesPreview?.student_pre_registration?.included ? 'incluído' : 'não encontrado',
      available: Boolean(peiSourcesPreview?.student_pre_registration?.included),
    },
    {
      key: 'teachers_pre_registration',
      label: 'Pré-cadastro de Docente(s)',
      detail: peiSourcesPreview?.teachers_pre_registration?.included
        ? `${peiSourcesPreview.teachers_pre_registration.count || 0} docente(s)`
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.teachers_pre_registration?.included),
    },
    {
      key: 'school_pre_registration',
      label: 'Pré-cadastro da Escola',
      detail: peiSourcesPreview?.school_pre_registration?.included
        ? (peiSourcesPreview.school_pre_registration.school_name || 'incluído')
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.school_pre_registration?.included),
    },
    {
      key: 'linked_peis',
      label: 'PEIs anteriores vinculados',
      detail: peiSourcesPreview?.linked_peis?.included
        ? formatPreviewDetail(
            `${peiSourcesPreview.linked_peis.count || 0} PEI(s)`,
            peiSourcesPreview?.linked_peis?.excerpt,
          )
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.linked_peis?.included),
    },
  ];

  return (
    <div className="rag-page">
      <div className="rag-header">
        <h1>🤖 RAG</h1>
        <p>Sistema de Geração de Planos Educacionais Individualizados via IA</p>
      </div>

      <div className="rag-grid">
        {/* ========================= COLUNA 1: Chat ========================= */}
        <div className="rag-panel chat-panel">
          <div className="chat-header">
            <select
              className="chat-student-select"
              value={selectedChatStudentId}
              onChange={handleChatStudentChange}
              disabled={registeredStudents.length === 0}
            >
              <option value="">Selecionar aluno cadastrado</option>
              {registeredStudents.map((student) => {
                const schoolName = getSchoolNameFromRegisteredStudent(student);
                return (
                  <option key={student.id} value={student.id}>
                    {student.name}{schoolName ? ` — ${schoolName}` : ''}
                  </option>
                );
              })}
            </select>
            <h2>💬 Chat</h2>
            {selectedStudent && (
              <span className="chat-context-badge">
                {selectedStudent.student_name}
              </span>
            )}
            {messages.length > 0 && (
              <button className="clear-btn" onClick={handleClearChatHistory} disabled={chatResetLoading}>
                {chatResetLoading ? 'Limpando...' : 'Limpar'}
              </button>
            )}
          </div>

          <div className="messages-area">
            {selectedStudent && (
              <div className="chat-sources-preview">
                <h4 className="pei-sources-title">📎 Fontes usadas no chat</h4>
                {chatSourcesLoading ? (
                  <p className="pei-sources-loading">Carregando fontes...</p>
                ) : (
                  <ul className="pei-sources-list">
                    {chatSourceOptions.map((source) => (
                      <li key={source.key} className={!source.available ? 'disabled' : ''}>
                        <label className="pei-source-option">
                          <input
                            type="checkbox"
                            checked={Boolean(chatSelectedSources[source.key])}
                            disabled={!source.available}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setChatSelectedSources((prev) => ({
                                ...prev,
                                [source.key]: checked,
                              }));
                            }}
                          />
                          <span>
                            {source.label}: <strong>{source.detail}</strong>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {chatHistoryLoading ? (
              <div className="chat-empty">
                <p>Carregando histórico do aluno...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                {selectedStudent ? (
                  <>
                    <p>Contexto: <strong>{selectedStudent.student_name}</strong> · {selectedStudent.school}</p>
                    <p className="chat-hint">Pergunte sobre os documentos deste estudante.</p>
                  </>
                ) : (
                  <>
                    <p>Selecione um aluno cadastrado para iniciar o chat.</p>
                    <p className="chat-hint">O contexto será aplicado ao aluno selecionado.</p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message message-${msg.role} ${msg.isError ? 'message-error' : ''}`}
                >
                  <div className="message-bubble">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources">
                      <small>
                        📎 Fontes:{' '}
                        {[...new Set(msg.sources.map((s) => s.file_name))].join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="message message-assistant">
                <div className="message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedStudent ? 'Digite sua mensagem...' : 'Selecione um estudante primeiro...'}
              disabled={chatLoading || chatHistoryLoading || chatResetLoading || !selectedStudent}
            />
            <button type="submit" disabled={chatLoading || chatHistoryLoading || chatResetLoading || !inputMessage.trim() || !selectedStudent}>
              Enviar
            </button>
          </form>
        </div>

        {/* ========================= COLUNA 3: Gerador PEI ========================= */}
        <div className="pei-column">
          <div className="rag-panel pei-panel">
            <h2>📋 Gerar PEI</h2>

            <form className="pei-form" onSubmit={handleGeneratePEI}>
              <div className="field">
                <label>Aluno cadastrado *</label>
                <select
                  value={peiSelectedStudentId}
                  onChange={handlePeiStudentChange}
                  required
                >
                  <option value="">Selecionar aluno</option>
                  {registeredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}{student.school_name ? ` — ${student.school_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="generate-btn"
                disabled={peiLoading}
              >
                {peiLoading ? 'Gerando...' : 'Gerar PEI Completo'}
              </button>
            </form>

            {peiSelectedStudentId && (
              <div className="pei-sources-preview">
                <h3 className="pei-sources-title">📎 Fontes usadas na geração</h3>
                {peiSourcesLoading ? (
                  <p className="pei-sources-loading">Carregando fontes...</p>
                ) : (
                  <>
                    <ul className="pei-sources-list">
                      {sourceOptions.map((source) => (
                        <li key={source.key} className={!source.available ? 'disabled' : ''}>
                          <label className="pei-source-option">
                            <input
                              type="checkbox"
                              checked={Boolean(peiSelectedSources[source.key])}
                              disabled={!source.available}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setPeiSelectedSources((prev) => ({
                                  ...prev,
                                  [source.key]: checked,
                                }));
                              }}
                            />
                            <span>
                              {source.label}: <strong>{source.detail}</strong>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    {Array.isArray(peiSourcesPreview?.vector_documents?.documents)
                      && peiSourcesPreview.vector_documents.documents.length > 0 && (
                        <p className="pei-sources-files">
                          Arquivos: {peiSourcesPreview.vector_documents.documents
                            .slice(0, 3)
                            .map((doc) => doc.file_name)
                            .filter(Boolean)
                            .join(', ')}
                          {peiSourcesPreview.vector_documents.documents.length > 3 ? '...' : ''}
                        </p>
                      )}
                    <p className="pei-sources-files">
                      Selecione as fontes desejadas antes de gerar o PEI. Fontes não encontradas ficam desabilitadas.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Progress bar */}
            {peiLoading && peiProgress.label && (
              <div className="pei-progress">
                <div className="pei-progress-bar">
                  <div
                    className="pei-progress-fill"
                    style={{ width: `${peiProgress.pct}%` }}
                  />
                </div>
                <p className="pei-progress-label">{peiProgress.label}</p>
              </div>
            )}

            {/* Sucesso inline */}
            {!peiLoading && peiResult && (
              <div className="pei-new-badge">
                ✅ PEI gerado e salvo!{' '}
                {lastPeiClientDurationMs !== null && (
                  <span className="pei-duration-inline">
                    Tempo total: {(lastPeiClientDurationMs / 1000).toFixed(2)}s
                  </span>
                )}
                <button
                  className="pei-view-inline-btn"
                  onClick={() => handleViewPEI(peiResult.pei_id)}
                >
                  Visualizar
                </button>
              </div>
            )}

            {peiViewerLoading && (
              <div className="pei-progress">
                <p className="pei-progress-label">Carregando visualização do PDF...</p>
              </div>
            )}

            {/* Visualizador PDF */}
            {viewingPeiUrl && (
              <div className="pdf-viewer">
                <div className="pdf-viewer-header">
                  <span>📄 Visualizando PEI</span>
                  <button className="pdf-close-btn" onClick={clearViewingPei}>✕</button>
                </div>
                <iframe
                  src={viewingPeiUrl}
                  title="PEI PDF"
                  className="pdf-iframe"
                />
              </div>
            )}

            {/* Lista de PEIs salvos */}
            {peiList.length > 0 && (
              <div className="pei-list">
                <h3 className="pei-list-title">📁 PEIs salvos</h3>
                {peiList.map((p) => (
                  <div key={p.id} className="pei-list-item">
                    <div className="pei-list-info">
                      <span className="pei-list-name">{p.student_name}</span>
                      <span className="pei-list-date">
                        {new Date(p.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="pei-list-actions">
                      <button
                        className="pei-action-btn view"
                        title="Visualizar"
                        onClick={() => handleViewPEI(p.id)}
                      >
                        👁️
                      </button>
                      <button
                        className="pei-action-btn download"
                        title="Baixar PDF"
                        onClick={() => handleDownloadPEI(p.id, p.student_name)}
                      >
                        ⬇️
                      </button>
                      <button
                        className="pei-action-btn delete"
                        title="Remover"
                        onClick={() => handleDeletePEI(p.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rag-panel pei-prompt-panel">
            <h2>🧠 Prompt do PEI</h2>
            {peiPromptLoading ? (
              <p className="pei-prompt-loading">Carregando prompt...</p>
            ) : (
              <>
                <p className="pei-prompt-meta">
                  {peiPromptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                  {peiPromptUpdatedAt
                    ? ` · Atualizado em ${new Date(peiPromptUpdatedAt).toLocaleString('pt-BR')}`
                    : ''}
                </p>
                <button
                  type="button"
                  className="save-prompt-btn"
                  onClick={handleOpenPeiPromptModal}
                >
                  Visualizar / Editar Prompt
                </button>
              </>
            )}
          </div>

          <div className="rag-panel pei-prompt-panel">
            <h2>💬 Prompt do Chat</h2>
            {chatPromptLoading ? (
              <p className="pei-prompt-loading">Carregando prompt...</p>
            ) : (
              <>
                <p className="pei-prompt-meta">
                  {chatPromptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
                  {chatPromptUpdatedAt
                    ? ` · Atualizado em ${new Date(chatPromptUpdatedAt).toLocaleString('pt-BR')}`
                    : ''}
                </p>
                <button
                  type="button"
                  className="save-prompt-btn"
                  onClick={handleOpenChatPromptModal}
                >
                  Visualizar / Editar Prompt
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {peiPromptModalOpen && (
        <div className="pei-prompt-modal-overlay" onClick={handleClosePeiPromptModal}>
          <div className="pei-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pei-prompt-modal-header">
              <h3>🧠 Prompt de Geração do PEI</h3>
              <button className="pei-prompt-modal-close" onClick={handleClosePeiPromptModal}>✕</button>
            </div>

            <p className="pei-prompt-meta">
              {peiPromptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
              {peiPromptUpdatedAt
                ? ` · Atualizado em ${new Date(peiPromptUpdatedAt).toLocaleString('pt-BR')}`
                : ''}
            </p>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <label>
                <div className="pei-prompt-meta">Prompt salvo</div>
                <select
                  className="upload-input"
                  style={{ width: '100%' }}
                  value={peiPromptSelectedId}
                  onChange={(e) => {
                    const selected = findPromptOption('pei', e.target.value);
                    setPeiPromptSelectedId(e.target.value);
                    updatePromptFormFromPrompt('pei', selected);
                  }}
                >
                  {peiPromptOptions.length === 0 && <option value="">Nenhum prompt salvo</option>}
                  {peiPromptOptions.map((promptItem) => (
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
                  value={peiPromptName}
                  onChange={(e) => setPeiPromptName(e.target.value)}
                  placeholder="Nome do prompt"
                />
              </label>

              <label>
                <div className="pei-prompt-meta">Descrição</div>
                <input
                  className="upload-input"
                  style={{ width: '100%' }}
                  value={peiPromptDescription}
                  onChange={(e) => setPeiPromptDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </label>

              <label>
                <div className="pei-prompt-meta">Conteúdo</div>
                <textarea
                  className="pei-prompt-modal-textarea"
                  value={peiPromptDraft}
                  onChange={(e) => setPeiPromptDraft(e.target.value)}
                  rows={18}
                />
              </label>
            </div>

            <div className="pei-prompt-modal-actions">
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleNewPeiPrompt}
                disabled={peiPromptSaving || peiPromptResetting}
              >
                Novo prompt
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleDeletePeiPrompt}
                disabled={peiPromptSaving || peiPromptResetting || !peiPromptSelectedId}
              >
                Excluir
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleResetPeiPrompt}
                disabled={peiPromptResetting || peiPromptSaving}
              >
                {peiPromptResetting ? 'Restaurando...' : 'Restaurar base'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn ghost"
                onClick={handleClosePeiPromptModal}
                disabled={peiPromptSaving || peiPromptResetting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleSavePeiPrompt}
                disabled={peiPromptSaving || peiPromptResetting || !peiPromptDraft.trim() || !peiPromptName.trim() || !peiPromptDirty}
              >
                {peiPromptSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleUsePeiPrompt}
                disabled={peiPromptSaving || peiPromptResetting || !peiPromptDraft.trim() || !peiPromptName.trim()}
              >
                {peiPromptSaving ? 'Ativando...' : 'Usar este prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {chatPromptModalOpen && (
        <div className="pei-prompt-modal-overlay" onClick={handleCloseChatPromptModal}>
          <div className="pei-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pei-prompt-modal-header">
              <h3>💬 Prompt do Chat RAG</h3>
              <button className="pei-prompt-modal-close" onClick={handleCloseChatPromptModal}>✕</button>
            </div>

            <p className="pei-prompt-meta">
              {chatPromptIsCustom ? 'Prompt personalizado ativo' : 'Prompt padrão ativo'}
              {chatPromptUpdatedAt
                ? ` · Atualizado em ${new Date(chatPromptUpdatedAt).toLocaleString('pt-BR')}`
                : ''}
            </p>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <label>
                <div className="pei-prompt-meta">Prompt salvo</div>
                <select
                  className="upload-input"
                  style={{ width: '100%' }}
                  value={chatPromptSelectedId}
                  onChange={(e) => {
                    const selected = findPromptOption('chat', e.target.value);
                    setChatPromptSelectedId(e.target.value);
                    updatePromptFormFromPrompt('chat', selected);
                  }}
                >
                  {chatPromptOptions.length === 0 && <option value="">Nenhum prompt salvo</option>}
                  {chatPromptOptions.map((promptItem) => (
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
                  value={chatPromptName}
                  onChange={(e) => setChatPromptName(e.target.value)}
                  placeholder="Nome do prompt"
                />
              </label>

              <label>
                <div className="pei-prompt-meta">Descrição</div>
                <input
                  className="upload-input"
                  style={{ width: '100%' }}
                  value={chatPromptDescription}
                  onChange={(e) => setChatPromptDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </label>

              <label>
                <div className="pei-prompt-meta">Conteúdo</div>
                <textarea
                  className="pei-prompt-modal-textarea"
                  value={chatPromptDraft}
                  onChange={(e) => setChatPromptDraft(e.target.value)}
                  rows={18}
                />
              </label>
            </div>

            <div className="pei-prompt-modal-actions">
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleNewChatPrompt}
                disabled={chatPromptSaving || chatPromptResetting}
              >
                Novo prompt
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleDeleteChatPrompt}
                disabled={chatPromptSaving || chatPromptResetting || !chatPromptSelectedId}
              >
                Excluir
              </button>
              <button
                type="button"
                className="pei-prompt-btn secondary"
                onClick={handleResetChatPrompt}
                disabled={chatPromptResetting || chatPromptSaving}
              >
                {chatPromptResetting ? 'Restaurando...' : 'Restaurar base'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn ghost"
                onClick={handleCloseChatPromptModal}
                disabled={chatPromptSaving || chatPromptResetting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleSaveChatPrompt}
                disabled={chatPromptSaving || chatPromptResetting || !chatPromptDraft.trim() || !chatPromptName.trim() || !chatPromptDirty}
              >
                {chatPromptSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="pei-prompt-btn primary"
                onClick={handleUseChatPrompt}
                disabled={chatPromptSaving || chatPromptResetting || !chatPromptDraft.trim() || !chatPromptName.trim()}
              >
                {chatPromptSaving ? 'Ativando...' : 'Usar este prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TesteRAG;
