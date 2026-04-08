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
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
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

  const setMessages = (updater) => {
    if (!studentKey) return;
    setChatHistories((prev) => {
      const current = prev[studentKey] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [studentKey]: next };
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
      return;
    }

    const studentItem = registeredStudents.find((item) => item.id === selectedChatStudentId);
    if (!studentItem) {
      setSelectedStudent(null);
      setChatSourcesPreview(null);
      return;
    }

    setSelectedStudent(buildChatStudentContext(studentItem));
    const schoolName = getSchoolNameFromRegisteredStudent(studentItem);
    loadChatSourcesPreview({
      studentId: studentItem.id,
      studentName: studentItem.name || '',
      school: schoolName,
    });
  }, [selectedChatStudentId, registeredStudents, registeredSchools, students]);

  const loadPeiPrompt = async () => {
    setPeiPromptLoading(true);
    try {
      const data = await ragAPI.getPEIPrompt();
      const promptText = data?.prompt || '';
      setPeiPrompt(promptText);
      setInitialPeiPrompt(promptText);
      setPeiPromptDraft(promptText);
      setPeiPromptUpdatedAt(data?.updated_at || null);
      setPeiPromptIsCustom(Boolean(data?.is_custom));
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
      const promptText = data?.prompt || '';
      setChatPrompt(promptText);
      setInitialChatPrompt(promptText);
      setChatPromptDraft(promptText);
      setChatPromptUpdatedAt(data?.updated_at || null);
      setChatPromptIsCustom(Boolean(data?.is_custom));
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
      const sessionId = selectedStudent
        ? `${selectedStudent.student_name}__${selectedStudent.school}`
        : 'default';
      const studentFilter = selectedStudent
        ? { student_name: selectedStudent.student_name, school: selectedStudent.school }
        : null;
      const data = await ragAPI.sendMessage(text, sessionId, studentFilter, chatSelectedSources);
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

  const handleSavePeiPrompt = async () => {
    const promptTrimmed = peiPromptDraft.trim();
    if (!promptTrimmed) {
      alert('O prompt não pode ficar vazio.');
      return;
    }

    setPeiPromptSaving(true);
    try {
      const data = await ragAPI.updatePEIPrompt(promptTrimmed);
      setPeiPrompt(data.prompt || promptTrimmed);
      setInitialPeiPrompt(data.prompt || promptTrimmed);
      setPeiPromptDraft(data.prompt || promptTrimmed);
      setPeiPromptUpdatedAt(data.updated_at || null);
      setPeiPromptIsCustom(Boolean(data.is_custom));
      alert('Prompt do PEI salvo com sucesso.');
      setPeiPromptModalOpen(false);
    } catch (err) {
      alert('Erro ao salvar prompt do PEI: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptSaving(false);
    }
  };

  const handleOpenPeiPromptModal = () => {
    setPeiPromptDraft(peiPrompt);
    setPeiPromptModalOpen(true);
  };

  const handleClosePeiPromptModal = () => {
    setPeiPromptDraft(peiPrompt);
    setPeiPromptModalOpen(false);
  };

  const handleResetPeiPrompt = async () => {
    if (!window.confirm('Restaurar o prompt atual para o prompt base salvo?')) return;

    setPeiPromptResetting(true);
    try {
      const data = await ragAPI.resetPEIPrompt();
      const promptText = data?.prompt || '';
      setPeiPrompt(promptText);
      setInitialPeiPrompt(promptText);
      setPeiPromptDraft(promptText);
      setPeiPromptUpdatedAt(data?.updated_at || null);
      setPeiPromptIsCustom(Boolean(data?.is_custom));
      alert('Prompt restaurado para a versão base.');
    } catch (err) {
      alert('Erro ao restaurar prompt: ' + (err.response?.data?.error || err.message));
    } finally {
      setPeiPromptResetting(false);
    }
  };

  const handleSaveChatPrompt = async () => {
    const promptTrimmed = chatPromptDraft.trim();
    if (!promptTrimmed) {
      alert('O prompt não pode ficar vazio.');
      return;
    }

    setChatPromptSaving(true);
    try {
      const data = await ragAPI.updateChatPrompt(promptTrimmed);
      setChatPrompt(data.prompt || promptTrimmed);
      setInitialChatPrompt(data.prompt || promptTrimmed);
      setChatPromptDraft(data.prompt || promptTrimmed);
      setChatPromptUpdatedAt(data.updated_at || null);
      setChatPromptIsCustom(Boolean(data.is_custom));
      alert('Prompt do Chat salvo com sucesso.');
      setChatPromptModalOpen(false);
    } catch (err) {
      alert('Erro ao salvar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptSaving(false);
    }
  };

  const handleOpenChatPromptModal = () => {
    setChatPromptDraft(chatPrompt);
    setChatPromptModalOpen(true);
  };

  const handleCloseChatPromptModal = () => {
    setChatPromptDraft(chatPrompt);
    setChatPromptModalOpen(false);
  };

  const handleResetChatPrompt = async () => {
    if (!window.confirm('Restaurar o prompt atual do Chat para o prompt base salvo?')) return;

    setChatPromptResetting(true);
    try {
      const data = await ragAPI.resetChatPrompt();
      const promptText = data?.prompt || '';
      setChatPrompt(promptText);
      setInitialChatPrompt(promptText);
      setChatPromptDraft(promptText);
      setChatPromptUpdatedAt(data?.updated_at || null);
      setChatPromptIsCustom(Boolean(data?.is_custom));
      alert('Prompt do Chat restaurado para a versão base.');
    } catch (err) {
      alert('Erro ao restaurar prompt do Chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setChatPromptResetting(false);
    }
  };

  const peiPromptDirty = peiPromptDraft.trim() !== initialPeiPrompt.trim();
  const chatPromptDirty = chatPromptDraft.trim() !== initialChatPrompt.trim();

  const chatSourceOptions = [
    {
      key: 'vector_documents',
      label: 'Documentos do RAG',
      detail: `${chatSourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`,
      available: Boolean(chatSourcesPreview?.vector_documents?.included),
    },
    {
      key: 'diary',
      label: 'Diário Individual',
      detail: chatSourcesPreview?.diary?.included
        ? `${chatSourcesPreview.diary.entries_count} entrada(s)`
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.diary?.included),
    },
    {
      key: 'pdi',
      label: 'PDI',
      detail: chatSourcesPreview?.pdi?.included ? 'encontrado' : 'não encontrado',
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
        ? `${chatSourcesPreview.linked_peis.count || 0} PEI(s)`
        : 'não encontrado',
      available: Boolean(chatSourcesPreview?.linked_peis?.included),
    },
  ];

  const sourceOptions = [
    {
      key: 'vector_documents',
      label: 'Documentos do RAG',
      detail: `${peiSourcesPreview?.vector_documents?.document_count || 0} arquivo(s)`,
      available: Boolean(peiSourcesPreview?.vector_documents?.included),
    },
    {
      key: 'diary',
      label: 'Diário Individual',
      detail: peiSourcesPreview?.diary?.included
        ? `${peiSourcesPreview.diary.entries_count} entrada(s)`
        : 'não encontrado',
      available: Boolean(peiSourcesPreview?.diary?.included),
    },
    {
      key: 'pdi',
      label: 'PDI',
      detail: peiSourcesPreview?.pdi?.included ? 'encontrado' : 'não encontrado',
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
        ? `${peiSourcesPreview.linked_peis.count || 0} PEI(s)`
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
              <button className="clear-btn" onClick={() => setMessages([])}>
                Limpar
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

            {messages.length === 0 ? (
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
              disabled={chatLoading || !selectedStudent}
            />
            <button type="submit" disabled={chatLoading || !inputMessage.trim() || !selectedStudent}>
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

            <textarea
              className="pei-prompt-modal-textarea"
              value={peiPromptDraft}
              onChange={(e) => setPeiPromptDraft(e.target.value)}
              rows={22}
            />

            <div className="pei-prompt-modal-actions">
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
                disabled={peiPromptSaving || peiPromptResetting || !peiPromptDraft.trim() || !peiPromptDirty}
              >
                {peiPromptSaving ? 'Salvando...' : 'Salvar alterações'}
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

            <textarea
              className="pei-prompt-modal-textarea"
              value={chatPromptDraft}
              onChange={(e) => setChatPromptDraft(e.target.value)}
              rows={22}
            />

            <div className="pei-prompt-modal-actions">
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
                disabled={chatPromptSaving || chatPromptResetting || !chatPromptDraft.trim() || !chatPromptDirty}
              >
                {chatPromptSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TesteRAG;
