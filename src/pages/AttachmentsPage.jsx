import React, { useEffect, useMemo, useState } from 'react';
import { ragAPI, schoolAPI, studentAPI } from '../services/api';
import './AttachmentsPage.css';

const AttachmentsPage = () => {
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registeredSchools, setRegisteredSchools] = useState([]);
  const [selectedRegisteredStudentId, setSelectedRegisteredStudentId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [expandedCards, setExpandedCards] = useState({});

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const getSchoolNameFromRegisteredStudent = (studentItem) => {
    if (!studentItem) return '';
    const schoolItem = studentItem.school_id
      ? registeredSchools.find((item) => item.id === studentItem.school_id)
      : null;
    return schoolItem?.name || studentItem.school_name || '';
  };

  const findRegisteredStudentByNameSchool = (studentName, schoolName) => (
    registeredStudents.find((studentItem) => (
      normalizeText(studentItem.name) === normalizeText(studentName)
      && normalizeText(getSchoolNameFromRegisteredStudent(studentItem)) === normalizeText(schoolName)
    ))
  );

  const makeStudentKey = (student) => `${student.student_name}__${student.school}`;

  const studentsWithDocuments = useMemo(
    () => students
      .filter((student) => {
        if (Array.isArray(student.documents) && student.documents.length > 0) return true;
        return Number(student.document_count || 0) > 0;
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name, 'pt-BR')),
    [students],
  );

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await ragAPI.getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar anexos por estudante:', err);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
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
      setRegisteredStudents([]);
      setRegisteredSchools([]);
    }
  };

  useEffect(() => {
    loadStudents();
    loadRegisteredCatalogs();
  }, []);

  useEffect(() => {
    if (!studentsWithDocuments.length) {
      setExpandedCards({});
      return;
    }

    setExpandedCards((prev) => {
      const next = {};
      studentsWithDocuments.forEach((student) => {
        const key = makeStudentKey(student);
        next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? prev[key] : true;
      });
      return next;
    });
  }, [studentsWithDocuments]);

  const handleOpenUploadForStudent = (student) => {
    const registeredStudent = findRegisteredStudentByNameSchool(student.student_name, student.school);
    if (!registeredStudent?.id) {
      alert('Este aluno não foi encontrado no cadastro para receber novos anexos.');
      return;
    }
    setSelectedRegisteredStudentId(registeredStudent.id);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    if (!selectedRegisteredStudentId) {
      alert('Selecione um aluno cadastrado antes de enviar os anexos.');
      return;
    }

    const studentItem = registeredStudents.find((item) => item.id === selectedRegisteredStudentId);
    const schoolName = getSchoolNameFromRegisteredStudent(studentItem);

    if (!studentItem?.name || !schoolName) {
      alert('O aluno selecionado precisa estar vinculado a uma escola no cadastro.');
      return;
    }

    setUploadLoading(true);
    const errors = [];

    for (let index = 0; index < files.length; index += 1) {
      setUploadProgress({ current: index + 1, total: files.length });
      try {
        await ragAPI.uploadDocument(files[index], {
          student_name: studentItem.name.trim(),
          school: schoolName.trim(),
        });
      } catch (err) {
        errors.push(`${files[index].name}: ${err.response?.data?.error || err.message}`);
      }
    }

    await loadStudents();
    setUploadLoading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (errors.length === 0) {
      const uploadedKey = `${studentItem.name}__${schoolName}`;
      setExpandedCards((prev) => ({ ...prev, [uploadedKey]: true }));
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

  const handleDownloadDocument = async (docId, fileName) => {
    try {
      const blob = await ragAPI.downloadDocument(docId);
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName || `documento_${docId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Erro ao baixar documento: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleExpandedCard = (key) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="attachments-page">
      <div className="attachments-header">
        <h1>📎 Anexos</h1>
        <p>Gerencie os documentos vinculados aos alunos cadastrados.</p>
      </div>

      <div className="attachments-upload-panel">
        <h2>Adicionar anexos</h2>
        <div className="attachments-upload-row">
          <select
            value={selectedRegisteredStudentId}
            onChange={(event) => setSelectedRegisteredStudentId(event.target.value)}
            className="attachments-input"
            disabled={uploadLoading}
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

          <label className={`attachments-upload-btn ${uploadLoading ? 'loading' : ''}`}>
            {uploadLoading ? `Enviando ${uploadProgress.current}/${uploadProgress.total}...` : '📎 Selecionar PDFs'}
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
      </div>

      <div className="attachments-students-list">
        {studentsLoading ? (
          <p className="attachments-empty">Carregando anexos...</p>
        ) : studentsWithDocuments.length === 0 ? (
          <p className="attachments-empty">Nenhum aluno com anexos no momento.</p>
        ) : (
          studentsWithDocuments.map((student) => {
            const studentKey = makeStudentKey(student);
            const isExpanded = Boolean(expandedCards[studentKey]);
            const docs = Array.isArray(student.documents) ? student.documents : [];

            return (
              <article key={studentKey} className="attachments-student-card">
                <header className="attachments-student-header">
                  <div>
                    <h3>{student.student_name}</h3>
                    <p>{student.school}</p>
                  </div>
                  <div className="attachments-student-actions">
                    <span className="attachments-doc-count">
                      {student.document_count} doc{student.document_count !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      className="attachments-icon-btn"
                      title="Adicionar documentos"
                      onClick={() => handleOpenUploadForStudent(student)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="attachments-expand-btn"
                      onClick={() => toggleExpandedCard(studentKey)}
                    >
                      {isExpanded ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </header>

                {isExpanded && (
                  <div className="attachments-doc-list">
                    {docs.length === 0 ? (
                      <p className="attachments-doc-empty">Documentos indisponíveis para exibição.</p>
                    ) : (
                      docs.map((doc) => (
                        <div key={doc.doc_id} className="attachments-doc-item">
                          <div className="attachments-doc-info">
                            <span className="attachments-doc-name" title={doc.file_name}>📎 {doc.file_name}</span>
                            <span className="attachments-doc-date">
                              {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('pt-BR') : ''}
                            </span>
                          </div>
                          <div className="attachments-doc-actions">
                            <button
                              type="button"
                              className="attachments-doc-btn"
                              onClick={() => handleDownloadDocument(doc.doc_id, doc.file_name)}
                              title="Baixar documento"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              className="attachments-doc-btn delete"
                              onClick={() => handleDeleteDocument(doc.doc_id)}
                              title="Remover documento"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AttachmentsPage;
