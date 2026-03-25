import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ragAPI, schoolAPI, studentAPI } from '../services/api';
import './TesteRAG.css';

const TesteRAG = () => {
  // --- Estudantes ---
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null); // {student_name, school, documents, ...}
  const [expandedUpload, setExpandedUpload] = useState(false);

  // --- Upload ---
  const [uploadStudentName, setUploadStudentName] = useState('');
  const [uploadSchool, setUploadSchool] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registeredSchools, setRegisteredSchools] = useState([]);
  const [selectedRegisteredStudentId, setSelectedRegisteredStudentId] = useState('');
  const [selectedRegisteredSchoolId, setSelectedRegisteredSchoolId] = useState('');

  // --- Chat ---
  const [chatHistories, setChatHistories] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [peiLoading, setPeiLoading] = useState(false);
  const [peiResult, setPeiResult] = useState(null);
  const [peiProgress, setPeiProgress] = useState({ stage: 0, label: '' });
  const [peiList, setPeiList] = useState([]);
  const [viewingPeiUrl, setViewingPeiUrl] = useState(null);

  useEffect(() => {
    loadStudents();
    loadRegisteredCatalogs();
  }, []);

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

  const loadPeiList = async (sName, sSchool) => {
    try {
      const data = await ragAPI.getPEIs(sName, sSchool);
      setPeiList(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedStudent) {
      loadPeiList(selectedStudent.student_name, selectedStudent.school);
    } else {
      setPeiList([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, studentKey]);

  // Quando seleciona estudante, pré-preenche PEI
  useEffect(() => {
    if (selectedStudent) {
      setStudentName(selectedStudent.student_name);
      setSchool(selectedStudent.school);
      setPeiResult(null);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await ragAPI.getStudents();
      setStudents(data);
      // Atualiza o estudante selecionado com dados frescos
      if (selectedStudent) {
        const updated = data.find(
          (s) =>
            s.student_name === selectedStudent.student_name &&
            s.school === selectedStudent.school
        );
        setSelectedStudent(updated || null);
      }
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    if (
      selectedStudent &&
      selectedStudent.student_name === student.student_name &&
      selectedStudent.school === student.school
    ) {
      setSelectedStudent(null); // deselect
    } else {
      setSelectedStudent(student);
    }
  };

  const openUploadFor = (student = null) => {
    setExpandedUpload(true);
    setUploadStudentName(student?.student_name || '');
    setUploadSchool(student?.school || '');

    if (!student) {
      setSelectedRegisteredStudentId('');
      setSelectedRegisteredSchoolId('');
      return;
    }

    const matchedSchool = registeredSchools.find(
      (schoolItem) =>
        String(schoolItem.name || '').trim().toLowerCase() === String(student.school || '').trim().toLowerCase(),
    );

    const matchedStudent = registeredStudents.find((studentItem) =>
      String(studentItem.name || '').trim().toLowerCase() === String(student.student_name || '').trim().toLowerCase(),
    );

    setSelectedRegisteredStudentId(matchedStudent?.id || '');
    setSelectedRegisteredSchoolId(matchedStudent?.school_id || matchedSchool?.id || '');
  };

  const handleRegisteredStudentChange = (event) => {
    const studentId = event.target.value;
    setSelectedRegisteredStudentId(studentId);

    if (!studentId) {
      setUploadStudentName('');
      return;
    }

    const studentItem = registeredStudents.find((item) => item.id === studentId);
    if (!studentItem) return;

    setUploadStudentName(studentItem.name || '');

    if (studentItem.school_id) {
      setSelectedRegisteredSchoolId(studentItem.school_id);
      const schoolItem = registeredSchools.find((item) => item.id === studentItem.school_id);
      setUploadSchool(schoolItem?.name || studentItem.school_name || '');
      return;
    }

    const schoolByName = registeredSchools.find(
      (item) =>
        String(item.name || '').trim().toLowerCase() === String(studentItem.school_name || '').trim().toLowerCase(),
    );
    setSelectedRegisteredSchoolId(schoolByName?.id || '');
    setUploadSchool(schoolByName?.name || studentItem.school_name || '');
  };

  const handleRegisteredSchoolChange = (event) => {
    const schoolId = event.target.value;
    setSelectedRegisteredSchoolId(schoolId);

    if (!schoolId) {
      setUploadSchool('');
      return;
    }

    const schoolItem = registeredSchools.find((item) => item.id === schoolId);
    setUploadSchool(schoolItem?.name || '');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;

    if (!uploadStudentName.trim() || !uploadSchool.trim()) {
      alert('Preencha o nome do estudante e a escola antes de enviar o PDF.');
      return;
    }

    setUploadLoading(true);
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        await ragAPI.uploadDocument(files[i], {
          student_name: uploadStudentName.trim(),
          school: uploadSchool.trim(),
        });
      } catch (err) {
        errors.push(`${files[i].name}: ${err.response?.data?.error || err.message}`);
      }
    }

    await loadStudents();
    setUploadLoading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (errors.length === 0) {
      setExpandedUpload(false);
      setUploadStudentName('');
      setUploadSchool('');
      setSelectedRegisteredStudentId('');
      setSelectedRegisteredSchoolId('');
    } else {
      alert(`Erros ao enviar:\n${errors.join('\n')}`);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Remover este documento do índice?')) return;
    try {
      await ragAPI.deleteDocument(docId);
      await loadStudents();
    } catch (err) {
      alert('Erro ao remover: ' + (err.response?.data?.error || err.message));
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
      const data = await ragAPI.sendMessage(text, sessionId, studentFilter);
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
    setPeiLoading(true);
    setPeiResult(null);
    setViewingPeiUrl(null);

    // Animate progress stages
    let stageIdx = 0;
    setPeiProgress(PEI_STAGES[0]);
    const timer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, PEI_STAGES.length - 1);
      setPeiProgress(PEI_STAGES[stageIdx]);
    }, 3500);

    try {
      const data = await ragAPI.generatePEI({
        student_name: studentName.trim(),
        school: school.trim(),
        additional_info: additionalInfo.trim(),
      });
      clearInterval(timer);
      setPeiProgress({ pct: 100, label: 'PEI gerado com sucesso!' });
      setPeiResult(data);
      // Refresh PEI list
      await loadPeiList(studentName.trim(), school.trim());
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
      if (viewingPeiUrl && viewingPeiUrl.includes(peiId)) setViewingPeiUrl(null);
      await loadPeiList(studentName.trim(), school.trim());
    } catch (err) {
      alert('Erro ao remover: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDownloadPEI = async (peiId, sName) => {
    try {
      const url = ragAPI.getPEIPdfUrl(peiId);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao baixar arquivo');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `PEI_${(sName || 'estudante').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Erro ao baixar PDF: ' + err.message);
    }
  };

  return (
    <div className="rag-page">
      <div className="rag-header">
        <h1>🤖 RAG</h1>
        <p>Sistema de Geração de Planos Educacionais Individualizados via IA</p>
      </div>

      <div className="rag-grid">
        {/* ========================= COLUNA 1: Estudantes ========================= */}
        <div className="rag-panel docs-panel">
          <div className="students-header">
            <h2>👥 Estudantes</h2>
            <button className="add-student-btn" onClick={() => openUploadFor(null)}>
              + PDF
            </button>
          </div>

          {/* Formulário de upload (colapsável) */}
          {expandedUpload && (
            <div className="upload-form">
              <div className="upload-form-header">
                <span>Adicionar documento</span>
                <button className="close-upload-btn" onClick={() => setExpandedUpload(false)}>✕</button>
              </div>
              <select
                value={selectedRegisteredStudentId}
                onChange={handleRegisteredStudentChange}
                className="upload-input"
                disabled={uploadLoading}
              >
                <option value="">Selecionar aluno cadastrado</option>
                {registeredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}{student.school_name ? ` — ${student.school_name}` : ''}
                  </option>
                ))}
              </select>
              <select
                value={selectedRegisteredSchoolId}
                onChange={handleRegisteredSchoolChange}
                className="upload-input"
                disabled={uploadLoading}
              >
                <option value="">Selecionar escola cadastrada</option>
                {registeredSchools.map((schoolItem) => (
                  <option key={schoolItem.id} value={schoolItem.id}>
                    {schoolItem.name}
                  </option>
                ))}
              </select>
              <label className={`upload-btn ${uploadLoading ? 'loading' : ''}`}>
                {uploadLoading ? `Indexando ${uploadProgress.current}/${uploadProgress.total}...` : '📎 Selecionar PDFs'}
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* Lista de estudantes */}
          <div className="students-list">
            {studentsLoading ? (
              <p className="docs-empty">Carregando...</p>
            ) : students.length === 0 ? (
              <div className="docs-empty">
                <p>Nenhum estudante cadastrado.</p>
                <button className="first-upload-btn" onClick={() => openUploadFor(null)}>
                  + Adicionar primeiro PDF
                </button>
              </div>
            ) : (
              students.map((student) => {
                const isSelected =
                  selectedStudent &&
                  selectedStudent.student_name === student.student_name &&
                  selectedStudent.school === student.school;
                return (
                  <div
                    key={`${student.student_name}__${student.school}`}
                    className={`student-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="student-card-main">
                      <div className="student-info">
                        <span className="student-name">{student.student_name}</span>
                        <span className="student-school">{student.school}</span>
                      </div>
                      <div className="student-meta">
                        <span className="student-doc-count">
                          {student.document_count} doc{student.document_count !== 1 ? 's' : ''}
                        </span>
                        <button
                          className="student-upload-btn"
                          title="Adicionar documento"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUploadFor(student);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Documentos do estudante (visível quando selecionado) */}
                    {isSelected && (
                      <div className="student-docs">
                        {student.documents.map((doc) => (
                          <div key={doc.doc_id} className="doc-item">
                            <div className="doc-info">
                              <span className="doc-name" title={doc.file_name}>
                                📎 {doc.file_name}
                              </span>
                              <span className="doc-date">
                                {doc.upload_date
                                  ? new Date(doc.upload_date).toLocaleDateString('pt-BR')
                                  : ''}
                              </span>
                            </div>
                            <button
                              className="doc-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.doc_id);
                              }}
                              title="Remover documento"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================= COLUNA 2: Chat ========================= */}
        <div className="rag-panel chat-panel">
          <div className="chat-header">
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
            {messages.length === 0 ? (
              <div className="chat-empty">
                {selectedStudent ? (
                  <>
                    <p>Contexto: <strong>{selectedStudent.student_name}</strong> · {selectedStudent.school}</p>
                    <p className="chat-hint">Pergunte sobre os documentos deste estudante.</p>
                  </>
                ) : (
                  <>
                    <p>Selecione um estudante ou faça upload de documentos.</p>
                    <p className="chat-hint">O chat buscará contexto em todos os documentos.</p>
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
        <div className="rag-panel pei-panel">
          <h2>📋 Gerar PEI</h2>

          <form className="pei-form" onSubmit={handleGeneratePEI}>
            <div className="field">
              <label>Nome do Estudante *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="field">
              <label>Escola *</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Nome da escola"
                required
              />
            </div>
            <div className="field">
              <label>Informações Adicionais</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Ex: TEA nível 2, 8 anos, 3º ano do ensino fundamental..."
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="generate-btn"
              disabled={peiLoading}
            >
              {peiLoading ? 'Gerando...' : 'Gerar PEI Completo'}
            </button>
          </form>

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
              <button
                className="pei-view-inline-btn"
                onClick={() => setViewingPeiUrl(ragAPI.getPEIPdfUrl(peiResult.pei_id))}
              >
                Visualizar
              </button>
            </div>
          )}

          {/* Visualizador PDF */}
          {viewingPeiUrl && (
            <div className="pdf-viewer">
              <div className="pdf-viewer-header">
                <span>📄 Visualizando PEI</span>
                <button className="pdf-close-btn" onClick={() => setViewingPeiUrl(null)}>✕</button>
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
                      onClick={() => setViewingPeiUrl(ragAPI.getPEIPdfUrl(p.id))}
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
      </div>
    </div>
  );
};

export default TesteRAG;
