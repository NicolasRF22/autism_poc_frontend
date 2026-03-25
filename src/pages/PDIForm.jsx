import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { pdiAPI, studentAPI } from '../services/api';
import './PDIForm.css';

// Constante de matérias (movida para fora do componente)
const subjects = [
  { id: 'lingua_portuguesa', name: 'Língua Portuguesa' },
  { id: 'matematica', name: 'Matemática' },
  { id: 'historia', name: 'História' },
  { id: 'geografia', name: 'Geografia' },
  { id: 'ciencias', name: 'Ciências' },
  { id: 'ensino_religioso', name: 'Ensino Religioso' },
  { id: 'arte', name: 'Arte' },
];

// Função para criar trimestre vazio (movida para fora do componente)
function createEmptyTrimester() {
  const trimester = {
    relatorio_descritivo: {},
  };
  subjects.forEach(subject => {
    trimester[subject.id] = [
      {
        habilidades: '',
        adaptacoes: '',
        aprendizagens: '',
      }
    ];
  });
  return trimester;
}

const PDIForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit');
  const isCreateMode = !id;

  // Ler step inicial da query string (se existir)
  const searchParams = new URLSearchParams(location.search);
  const initialStep = searchParams.get('step') ? parseInt(searchParams.get('step')) : 0;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [studentsCatalog, setStudentsCatalog] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentLookupLoading, setStudentLookupLoading] = useState(false);
  
  // Estados do formulário
  const [studentName, setStudentName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [guardians, setGuardians] = useState([]);
  const [guardianInput, setGuardianInput] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [className, setClassName] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [teacherInput, setTeacherInput] = useState('');
  
  // Estado dos trimestres
  const [trimesters, setTrimesters] = useState({
    '1': createEmptyTrimester(),
    '2': createEmptyTrimester(),
    '3': createEmptyTrimester(),
  });

  useEffect(() => {
    if (id) {
      loadPDI();
    }
  }, [id]);

  useEffect(() => {
    loadStudentsCatalog();
  }, []);

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

  const extractGuardiansFromStudent = (student) => {
    const direct = normalizeArrayField(
      student.guardians || student.filiacoes || student.filiations || student.responsibles,
    );

    if (direct.length > 0) return direct;

    const fallback = [student.guardian1, student.guardian2, student.responsavel1, student.responsavel2]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return fallback;
  };

  const extractTeachersFromStudent = (student) => {
    const direct = normalizeArrayField(student.teachers || student.docentes);
    if (direct.length > 0) return direct;

    const fallback = [student.teacher1, student.teacher2, student.docente1, student.docente2]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return fallback;
  };

  const loadStudentsCatalog = async () => {
    try {
      const students = await studentAPI.getAllStudents();
      setStudentsCatalog(Array.isArray(students) ? students : []);
    } catch (err) {
      console.error('Erro ao carregar catálogo de alunos:', err);
    }
  };

  const fillHeaderFromStudent = (student) => {
    setStudentName(student.name || student.studentName || '');
    setBirthDate(student.birth_date || student.birthDate || student.date_of_birth || '');
    setGuardians(extractGuardiansFromStudent(student));
    setDiagnosis(student.diagnosis || student.diagnostic || '');
    setClassName(student.class || student.className || '');
    setTeachers(extractTeachersFromStudent(student));
    setGuardianInput('');
    setTeacherInput('');
  };

  const handleSelectRegisteredStudent = async (event) => {
    const studentId = event.target.value;
    setSelectedStudentId(studentId);

    if (!studentId) return;

    try {
      setStudentLookupLoading(true);
      const student = await studentAPI.getStudent(studentId);
      fillHeaderFromStudent(student || {});
    } catch (err) {
      console.error(err);
      alert('Não foi possível carregar os dados do aluno selecionado.');
    } finally {
      setStudentLookupLoading(false);
    }
  };

  const loadPDI = async () => {
    try {
      setLoading(true);
      const data = await pdiAPI.getPDIById(id);
      
      setStudentName(data.student_name);
      setBirthDate(data.birth_date);
      setGuardians(data.guardians || []);
      setDiagnosis(data.diagnosis);
      setClassName(data.class);
      setTeachers(data.teachers || []);
      
      // Converter formato antigo para novo formato se necessário
      const convertedTrimesters = {};
      ['1', '2', '3'].forEach(trimNum => {
        if (data.trimesters && data.trimesters[trimNum]) {
          convertedTrimesters[trimNum] = {
            relatorio_descritivo: data.trimesters[trimNum].relatorio_descritivo || {},
          };
          
          subjects.forEach(subject => {
            const subjectData = data.trimesters[trimNum][subject.id];
            
            if (Array.isArray(subjectData)) {
              // Novo formato - já é array de objetos
              convertedTrimesters[trimNum][subject.id] = subjectData;
            } else if (subjectData && typeof subjectData === 'object') {
              // Formato antigo - objeto com strings ou arrays
              if (Array.isArray(subjectData.habilidades)) {
                // Formato intermediário - arrays separados
                const maxLength = Math.max(
                  subjectData.habilidades?.length || 0,
                  subjectData.adaptacoes?.length || 0,
                  subjectData.aprendizagens?.length || 0
                );
                convertedTrimesters[trimNum][subject.id] = Array.from({ length: maxLength }, (_, i) => ({
                  habilidades: subjectData.habilidades?.[i] || '',
                  adaptacoes: subjectData.adaptacoes?.[i] || '',
                  aprendizagens: subjectData.aprendizagens?.[i] || '',
                }));
              } else {
                // Formato muito antigo - strings simples
                convertedTrimesters[trimNum][subject.id] = [{
                  habilidades: subjectData.habilidades || '',
                  adaptacoes: subjectData.adaptacoes || '',
                  aprendizagens: subjectData.aprendizagens || '',
                }];
              }
            } else {
              // Sem dados - criar linha vazia
              convertedTrimesters[trimNum][subject.id] = [{
                habilidades: '',
                adaptacoes: '',
                aprendizagens: '',
              }];
            }
          });
        } else {
          convertedTrimesters[trimNum] = createEmptyTrimester();
        }
      });
      
      setTrimesters(convertedTrimesters);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar PDI');
      navigate('/pdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = (e) => {
    e.preventDefault();
    if (guardianInput.trim() && !guardians.includes(guardianInput.trim())) {
      setGuardians([...guardians, guardianInput.trim()]);
      setGuardianInput('');
    }
  };

  const handleRemoveGuardian = (guardianToRemove) => {
    setGuardians(guardians.filter(g => g !== guardianToRemove));
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (teacherInput.trim() && !teachers.includes(teacherInput.trim())) {
      setTeachers([...teachers, teacherInput.trim()]);
      setTeacherInput('');
    }
  };

  const handleRemoveTeacher = (teacherToRemove) => {
    setTeachers(teachers.filter(t => t !== teacherToRemove));
  };

  const updateSubjectRow = (trimesterNum, subjectId, rowIndex, field, value) => {
    setTrimesters(prev => {
      const newTrimesters = { ...prev };
      const rows = [...newTrimesters[trimesterNum][subjectId]];
      rows[rowIndex] = {
        ...rows[rowIndex],
        [field]: value,
      };
      newTrimesters[trimesterNum][subjectId] = rows;
      return newTrimesters;
    });
  };

  const addSubjectRow = (trimesterNum, subjectId) => {
    setTrimesters(prev => {
      const newTrimesters = JSON.parse(JSON.stringify(prev)); // Deep copy
      const currentRows = newTrimesters[trimesterNum][subjectId] || [];
      newTrimesters[trimesterNum][subjectId] = [
        ...currentRows,
        {
          habilidades: '',
          adaptacoes: '',
          aprendizagens: '',
        }
      ];
      return newTrimesters;
    });
  };

  const removeSubjectRow = (trimesterNum, subjectId, rowIndex) => {
    setTrimesters(prev => {
      const newTrimesters = { ...prev };
      const rows = [...newTrimesters[trimesterNum][subjectId]];
      if (rows.length > 1) {
        rows.splice(rowIndex, 1);
        newTrimesters[trimesterNum][subjectId] = rows;
      }
      return newTrimesters;
    });
  };

  const updateTrimesterReport = (trimesterNum, teacherName, value) => {
    setTrimesters(prev => ({
      ...prev,
      [trimesterNum]: {
        ...prev[trimesterNum],
        relatorio_descritivo: {
          ...prev[trimesterNum].relatorio_descritivo,
          [teacherName]: value,
        },
      },
    }));
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!studentName.trim()) {
        alert('Nome do aluno é obrigatório');
        return false;
      }
      if (!birthDate) {
        alert('Data de nascimento é obrigatória');
        return false;
      }
      if (guardians.length === 0) {
        alert('Pelo menos uma filiação é obrigatória');
        return false;
      }
      if (!diagnosis.trim()) {
        alert('Diagnóstico é obrigatório');
        return false;
      }
      if (!className.trim()) {
        alert('Turma é obrigatória');
        return false;
      }
      if (teachers.length === 0) {
        alert('Pelo menos um docente é obrigatório');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getFilledSubjectsSummary = () => {
    const summary = {};
    ['1', '2', '3'].forEach(trimNum => {
      const trimester = trimesters[trimNum];
      const filledSubjects = [];
      
      subjects.forEach(subject => {
        const rows = trimester[subject.id] || [];
        const validRows = rows.filter(row => 
          row.habilidades?.trim() || row.adaptacoes?.trim() || row.aprendizagens?.trim()
        );
        
        if (validRows.length > 0) {
          filledSubjects.push({
            name: subject.name,
            rows: validRows.length
          });
        }
      });
      
      summary[trimNum] = filledSubjects;
    });
    return summary;
  };

  const handleSubmit = async (skipValidation = false) => {
    if (!skipValidation && !validateStep(0)) {
      setCurrentStep(0);
      return;
    }

    // Gerar resumo do que foi preenchido
    const summary = getFilledSubjectsSummary();
    let summaryText = 'Resumo do PDI:\n\n';
    
    ['1', '2', '3'].forEach(trimNum => {
      summaryText += `${trimNum}º Trimestre:\n`;
      if (summary[trimNum].length === 0) {
        summaryText += '  - Nenhuma matéria preenchida\n';
      } else {
        summary[trimNum].forEach(subj => {
          summaryText += `  - ${subj.name}: ${subj.rows} linha(s)\n`;
        });
      }
      summaryText += '\n';
    });
    
    if (!window.confirm(summaryText + '\nDeseja salvar o PDI?')) {
      return;
    }

    const pdiData = {
      student_name: studentName.trim(),
      birth_date: birthDate,
      guardians: guardians,
      diagnosis: diagnosis.trim(),
      class: className.trim(),
      teachers: teachers,
      trimesters: trimesters,
    };

    try {
      setLoading(true);
      
      if (isCreateMode) {
        await pdiAPI.createPDI(pdiData);
        alert('PDI criado com sucesso!');
      } else if (isEditMode) {
        await pdiAPI.updatePDI(id, pdiData);
        alert('PDI atualizado com sucesso!');
      }
      
      navigate('/pdi');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar PDI: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ['Cabeçalho', '1º Trimestre', '2º Trimestre', '3º Trimestre', 'Revisão'];
    return (
      <div className="step-indicator">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`step-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{idx + 1}</div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderHeaderStep = () => (
    <div className="form-step">
      <h2>Informações do Aluno</h2>

      {!isViewMode && (
        <div className="form-group">
          <label>Buscar aluno cadastrado</label>
          <select
            value={selectedStudentId}
            onChange={handleSelectRegisteredStudent}
            disabled={studentLookupLoading}
          >
            <option value="">Selecione um aluno para preencher automaticamente</option>
            {studentsCatalog.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}{student.school_name ? ` — ${student.school_name}` : ''}
              </option>
            ))}
          </select>
          <small className="field-help">
            Ao selecionar, os campos já preenchidos no pré-cadastro são carregados automaticamente.
          </small>
        </div>
      )}
      
      <div className="form-group">
        <label>Aluno *</label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          disabled={isViewMode}
          placeholder="Nome completo do aluno"
        />
      </div>

      <div className="form-group">
        <label>Data de Nascimento *</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          disabled={isViewMode}
        />
      </div>

      <div className="form-group">
        <label>Filiação(ões) *</label>
        <div className="multi-tag-container">
          <div className="tags-display">
            {guardians.map((guardian, idx) => (
              <span key={idx} className="tag">
                {guardian}
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGuardian(guardian)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {!isViewMode && (
            <div className="tag-input-group">
              <input
                type="text"
                value={guardianInput}
                onChange={(e) => setGuardianInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGuardian(e)}
                placeholder="Nome do responsável"
              />
              <button type="button" onClick={handleAddGuardian} className="btn-add-tag">
                + Adicionar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Diagnóstico *</label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          disabled={isViewMode}
          placeholder="Diagnóstico do aluno"
        />
      </div>

      <div className="form-group">
        <label>Turma *</label>
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          disabled={isViewMode}
          placeholder="Ex: 3º Ano A"
        />
      </div>

      <div className="form-group">
        <label>Docente(s) *</label>
        <div className="multi-tag-container">
          <div className="tags-display">
            {teachers.map((teacher, idx) => (
              <span key={idx} className="tag">
                {teacher}
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeacher(teacher)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {!isViewMode && (
            <div className="tag-input-group">
              <input
                type="text"
                value={teacherInput}
                onChange={(e) => setTeacherInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeacher(e)}
                placeholder="Nome do docente"
              />
              <button type="button" onClick={handleAddTeacher} className="btn-add-tag">
                + Adicionar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTrimesterStep = (trimesterNum) => {
    const trimester = trimesters[trimesterNum];
    
    return (
      <div className="form-step trimester-step">
        <h2>{trimesterNum}º Trimestre</h2>
        
        {subjects.map(subject => (
          <div key={subject.id} className="subject-section">
            <h3>{subject.name}</h3>
            
            {(trimester[subject.id] || [{ habilidades: '', adaptacoes: '', aprendizagens: '' }]).map((row, rowIndex) => (
              <div key={rowIndex} className="subject-row">
                <div className="row-header">
                  <span className="row-number">Linha {rowIndex + 1}</span>
                  {!isViewMode && (trimester[subject.id] || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(trimesterNum, subject.id, rowIndex)}
                      className="btn-remove-row"
                      title="Remover esta linha"
                    >
                      × Remover Linha
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Principais Habilidades Avaliadas</label>
                  <textarea
                    value={row.habilidades || ''}
                    onChange={(e) => updateSubjectRow(trimesterNum, subject.id, rowIndex, 'habilidades', e.target.value)}
                    disabled={isViewMode}
                    rows="2"
                    placeholder="Descreva as principais habilidades avaliadas..."
                  />
                </div>

                <div className="form-group">
                  <label>Adaptações e Ações Didáticas</label>
                  <textarea
                    value={row.adaptacoes || ''}
                    onChange={(e) => updateSubjectRow(trimesterNum, subject.id, rowIndex, 'adaptacoes', e.target.value)}
                    disabled={isViewMode}
                    rows="2"
                    placeholder="Descreva as adaptações e ações didáticas realizadas..."
                  />
                </div>

                <div className="form-group">
                  <label>Aprendizagens (Resposta às Experiências Propostas)</label>
                  <textarea
                    value={row.aprendizagens || ''}
                    onChange={(e) => updateSubjectRow(trimesterNum, subject.id, rowIndex, 'aprendizagens', e.target.value)}
                    disabled={isViewMode}
                    rows="2"
                    placeholder="Descreva as aprendizagens e respostas do aluno..."
                  />
                </div>
              </div>
            ))}

            {!isViewMode && (
              <div className="add-row-section">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addSubjectRow(trimesterNum, subject.id);
                  }}
                  className="btn-add-row"
                >
                  + Adicionar Nova Linha
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="report-section">
          <h3>Relatório Descritivo</h3>
          <p className="report-info">
            Relatório do Desenvolvimento Pedagógico e Comportamental por docente
          </p>
          
          {teachers.length === 0 ? (
            <div className="no-teachers-warning">
              ⚠️ Adicione docentes no cabeçalho para habilitar os relatórios
            </div>
          ) : (
            teachers.map((teacher, idx) => (
              <div key={idx} className="teacher-report">
                <label>Relatório - {teacher}</label>
                <textarea
                  value={trimester.relatorio_descritivo?.[teacher] || ''}
                  onChange={(e) => updateTrimesterReport(trimesterNum, teacher, e.target.value)}
                  disabled={isViewMode}
                  rows="10"
                  placeholder={`Relatório do desenvolvimento pedagógico e comportamental elaborado por ${teacher}...`}
                  className="large-textarea"
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="form-step review-step">
      <h2>Revisão Final</h2>
      
      <div className="review-section">
        <h3>Informações do Aluno</h3>
        <div className="review-grid">
          <div className="review-item">
            <strong>Aluno:</strong> {studentName}
          </div>
          <div className="review-item">
            <strong>Data de Nascimento:</strong> {new Date(birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </div>
          <div className="review-item">
            <strong>Diagnóstico:</strong> {diagnosis}
          </div>
          <div className="review-item">
            <strong>Turma:</strong> {className}
          </div>
          <div className="review-item">
            <strong>Filiações:</strong> {guardians.join(', ')}
          </div>
          <div className="review-item">
            <strong>Docentes:</strong> {teachers.join(', ')}
          </div>
        </div>
      </div>

      <div className="review-section">
        <h3>Trimestres</h3>
        {(() => {
          const summary = getFilledSubjectsSummary();
          return ['1', '2', '3'].map(trimNum => (
            <div key={trimNum} className="trimester-summary">
              <h4>{trimNum}º Trimestre</h4>
              {summary[trimNum].length === 0 ? (
                <p className="empty-trimester">❌ Nenhuma matéria preenchida</p>
              ) : (
                <div>
                  <p className="filled-count">✓ {summary[trimNum].length} matéria(s) com conteúdo:</p>
                  <ul className="subject-list">
                    {summary[trimNum].map((subj, idx) => (
                      <li key={idx}>{subj.name} - {subj.rows} linha(s)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ));
        })()}
      </div>

      <div className="review-actions">
        <p>Revise todas as informações antes de salvar o PDI.</p>
        <p>Você pode voltar aos passos anteriores para fazer alterações.</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pdi-form-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pdi-form-container">
      <div className="form-header">
        <h1>
          {isViewMode ? 'Visualizar PDI' : isEditMode ? 'Editar PDI' : 'Novo PDI'}
        </h1>
        <button className="btn-back" onClick={() => navigate('/pdi')}>
          ← Voltar
        </button>
      </div>

      {renderStepIndicator()}

      <div className="form-content">
        {currentStep === 0 && renderHeaderStep()}
        {currentStep === 1 && renderTrimesterStep('1')}
        {currentStep === 2 && renderTrimesterStep('2')}
        {currentStep === 3 && renderTrimesterStep('3')}
        {currentStep === 4 && renderReviewStep()}
      </div>

      <div className="form-navigation">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handlePrevious}
            className="btn-nav btn-previous"
            disabled={loading}
          >
            ← Anterior
          </button>
        )}
        
        {!isViewMode && currentStep >= 1 && currentStep <= 3 && (
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="btn-nav btn-save-partial"
            disabled={loading}
            title="Salvar o PDI com o que foi preenchido até agora"
          >
            💾 Salvar e Finalizar
          </button>
        )}
        
        <div className="nav-spacer"></div>
        
        {currentStep < 4 ? (
          !isViewMode && (
            <button
              type="button"
              onClick={handleNext}
              className="btn-nav btn-next"
              disabled={loading}
            >
              Próximo →
            </button>
          )
        ) : (
          !isViewMode && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="btn-nav btn-submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : isEditMode ? 'Atualizar PDI' : 'Criar PDI'}
            </button>
          )
        )}
        
        {isViewMode && currentStep < 4 && (
          <button
            type="button"
            onClick={handleNext}
            className="btn-nav btn-next"
          >
            Próximo →
          </button>
        )}
      </div>
    </div>
  );
};

export default PDIForm;
