import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ragAPI, schoolAPI, studentAPI } from '../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const [studentsData, schoolsData] = await Promise.all([
          studentAPI.getAllStudents(),
          schoolAPI.getAllSchools(),
        ]);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } catch (err) {
        console.error('Erro ao carregar catálogo do chat:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, []);

  const selectedStudent = useMemo(() => {
    return students.find((item) => item.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const selectedSchoolName = useMemo(() => {
    if (!selectedStudent) return '';
    const school = schools.find((item) => item.id === selectedStudent.school_id);
    return school?.name || selectedStudent.school_name || '';
  }, [schools, selectedStudent]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadCurrentSession = async () => {
      if (!selectedStudent) {
        setMessages([]);
        setSessionId('');
        return;
      }

      try {
        setLoadingHistory(true);
        const payload = await ragAPI.getCurrentChatSession({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name || selectedStudent.studentName || '',
          school: selectedSchoolName,
        });

        const loadedMessages = Array.isArray(payload?.messages)
          ? payload.messages
            .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
            .map((item) => ({ role: item.role, content: item.content || '' }))
          : [];

        setMessages(loadedMessages);
        setSessionId(payload?.session_id || '');
      } catch (err) {
        console.error('Erro ao carregar sessão atual do chat:', err);
        setMessages([]);
        setSessionId('');
      } finally {
        setLoadingHistory(false);
      }
    };

    loadCurrentSession();
  }, [selectedStudent, selectedSchoolName]);

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
        studentName: selectedStudent.name || selectedStudent.studentName || '',
        school: selectedSchoolName,
      });

      setSessionId(payload?.session_id || sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: payload?.response || '' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Erro: ${err.response?.data?.error || err.message}`,
          isError: true,
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedStudent) return;
    if (!window.confirm('Limpar histórico do chat deste aluno para o seu usuário?')) return;

    try {
      setClearingHistory(true);
      const payload = await ragAPI.clearCurrentChatSession({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name || selectedStudent.studentName || '',
        school: selectedSchoolName,
      });
      setMessages([]);
      setSessionId(payload?.session_id || '');
    } catch (err) {
      alert(`Erro ao limpar histórico: ${err.response?.data?.error || err.message}`);
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <div className="chat-only-page">
      <div className="chat-only-header">
        <h1>Chat</h1>
        <p>Página dedicada ao chat. Fluxos de PEI ficam na página Chat e PEI.</p>
      </div>

      <div className="chat-only-toolbar">
        <label htmlFor="chat-student">Aluno</label>
        <select
          id="chat-student"
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
          disabled={loadingCatalog || sendingMessage || loadingHistory || clearingHistory}
        >
          <option value="">{loadingCatalog ? 'Carregando alunos...' : 'Selecione um aluno'}</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {(student.name || student.studentName || student.id)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleClearHistory}
          disabled={!selectedStudent || clearingHistory || sendingMessage || loadingHistory}
        >
          {clearingHistory ? 'Limpando...' : 'Limpar histórico'}
        </button>
      </div>

      <div className="chat-only-panel">
        {loadingHistory ? (
          <div className="chat-only-empty">Carregando histórico...</div>
        ) : messages.length === 0 ? (
          <div className="chat-only-empty">Nenhuma mensagem ainda.</div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-only-bubble ${message.role} ${message.isError ? 'error' : ''}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      <form className="chat-only-input" onSubmit={handleSendMessage}>
        <textarea
          value={inputMessage}
          onChange={(event) => setInputMessage(event.target.value)}
          placeholder={selectedStudent ? 'Digite sua mensagem...' : 'Selecione um aluno para iniciar o chat'}
          disabled={!selectedStudent || sendingMessage || loadingHistory || clearingHistory}
          rows={3}
        />
        <button type="submit" disabled={!selectedStudent || !inputMessage.trim() || sendingMessage || loadingHistory || clearingHistory}>
          {sendingMessage ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
