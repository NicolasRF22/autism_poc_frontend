import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './PDIForm.css';
import { API_BASE_URL } from '../services/api';
import { formsAPI } from '../services/api';
import { getStoredUser, municipalityAPI } from '../services/api';

const SchoolFormNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit');
  const source = new URLSearchParams(location.search).get('source');
  const backPath = source === 'cadastro-da-escola' ? '/cadastro-da-escola' : '/schools';
  const currentUser = getStoredUser();
  const isSecretariaScoped = currentUser?.role === 'secretaria' && Boolean(currentUser?.municipio_id);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Seção 1: Dados Cadastrais
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [address, setAddress] = useState('');
  const [municipioId, setMunicipioId] = useState('');
  const [municipalities, setMunicipalities] = useState([]);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Seção 2: Estrutura e Capacidade
  const [educationLevels, setEducationLevels] = useState([]);
  const [totalStudents, setTotalStudents] = useState('');
  const [teaStudents, setTeaStudents] = useState('');
  const [maxTeaCapacity, setMaxTeaCapacity] = useState('');
  const [classrooms, setClassrooms] = useState('');
  const [multifunctionalRooms, setMultifunctionalRooms] = useState('');
  const [sensorySpaces, setSensorySpaces] = useState('');
  const [accessibility, setAccessibility] = useState('');

  // Seção 3: Equipe e Capacitação
  const [totalTeachers, setTotalTeachers] = useState('');
  const [specialEdTeachers, setSpecialEdTeachers] = useState('');
  const [teaTrainedTeachers, setTeaTrainedTeachers] = useState('');
  const [multidisciplinaryTeam, setMultidisciplinaryTeam] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState('');
  const [methodologies, setMethodologies] = useState('');
  const [mediators, setMediators] = useState('');
  const [studentMediatorRatio, setStudentMediatorRatio] = useState('');

  // Seção 4: Suporte Pedagógico
  const [curricularAdaptation, setCurricularAdaptation] = useState('');
  const [teachingMethodologies, setTeachingMethodologies] = useState('');
  const [peiProcess, setPeiProcess] = useState('');
  const [evaluationProcess, setEvaluationProcess] = useState('');
  const [alternativeCommunication, setAlternativeCommunication] = useState('');
  const [visualResources, setVisualResources] = useState('');
  const [studentIntegration, setStudentIntegration] = useState('');

  // Seção 5: Estrutura Sensorial
  const [sensoryControl, setSensoryControl] = useState('');
  const [adaptedMaterials, setAdaptedMaterials] = useState('');
  const [crisisSpaces, setCrisisSpaces] = useState('');
  const [breakAdaptations, setBreakAdaptations] = useState('');
  const [techResources, setTechResources] = useState('');
  const [weightedMaterials, setWeightedMaterials] = useState('');

  // Seção 6: Parceria Família-Escola
  const [familyCommunication, setFamilyCommunication] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('');
  const [homeGuidance, setHomeGuidance] = useState('');
  const [supportGroup, setSupportGroup] = useState('');
  const [familyEvents, setFamilyEvents] = useState('');

  // Seção 7: Suporte Clínico
  const [externalTherapists, setExternalTherapists] = useState('');
  const [clinicPartnerships, setClinicPartnerships] = useState('');
  const [pedagogicalTherapeuticIntegration, setPedagogicalTherapeuticIntegration] = useState('');
  const [supportNetworks, setSupportNetworks] = useState('');
  const [medicationProtocol, setMedicationProtocol] = useState('');

  // Seção 8: Documentação
  const [certification, setCertification] = useState('');
  const [enrollmentDocuments, setEnrollmentDocuments] = useState('');
  const [developmentReports, setDevelopmentReports] = useState('');
  const [publicAgreements, setPublicAgreements] = useState('');
  const [progressTracking, setProgressTracking] = useState('');

  const steps = [
    'Dados Cadastrais',
    'Estrutura e Capacidade',
    'Equipe e Capacitação',
    'Suporte Pedagógico',
    'Estrutura Sensorial',
    'Parceria Família-Escola',
    'Suporte Clínico',
    'Documentação',
    'Revisão e Confirmação'
  ];

  useEffect(() => {
    if (id) {
      loadSchool();
    }
  }, [id]);

  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        setMunicipalitiesLoading(true);
        const data = await municipalityAPI.getAllMunicipalities();
        const normalized = Array.isArray(data) ? data : [];
        setMunicipalities(normalized);
      } catch (err) {
        console.error('Erro ao carregar municípios:', err);
      } finally {
        setMunicipalitiesLoading(false);
      }
    };

    loadMunicipalities();
  }, []);

  useEffect(() => {
    if (!isSecretariaScoped || id) return;
    const userMunicipioId = String(currentUser?.municipio_id || '').trim();
    if (!userMunicipioId) return;

    const matchedMunicipality = municipalities.find((item) => item.id === userMunicipioId);
    setMunicipioId(userMunicipioId);
    setAddress(matchedMunicipality?.name || userMunicipioId);
  }, [isSecretariaScoped, id, currentUser?.municipio_id, municipalities]);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/schools/${id}`);
      if (!response.ok) throw new Error('Erro ao carregar escola');
      const data = await response.json();
      const addressValue = typeof data.address === 'object'
        ? (data.address?.city || '')
        : (data.address || data.city || '');
      
      // Seção 1
      setName(data.name || '');
      setCnpj(data.cnpj || '');
      setInstitutionType(data.institutionType || data.institution_type || '');
      setOperatingHours(data.operatingHours || '');
      setMunicipioId(data.municipio_id || '');
      setAddress(addressValue);
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      
      // Seção 2
      setEducationLevels(data.educationLevels || []);
      setTotalStudents(data.totalStudents || '');
      setTeaStudents(data.teaStudents || '');
      setMaxTeaCapacity(data.maxTeaCapacity || '');
      setClassrooms(data.classrooms || '');
      setMultifunctionalRooms(data.multifunctionalRooms || '');
      setSensorySpaces(data.sensorySpaces || '');
      setAccessibility(data.accessibility || '');
      
      // Seção 3
      setTotalTeachers(data.totalTeachers || '');
      setSpecialEdTeachers(data.specialEdTeachers || '');
      setTeaTrainedTeachers(data.teaTrainedTeachers || '');
      setMultidisciplinaryTeam(data.multidisciplinaryTeam || '');
      setTrainingFrequency(data.trainingFrequency || '');
      setMethodologies(data.methodologies || '');
      setMediators(data.mediators || '');
      setStudentMediatorRatio(data.studentMediatorRatio || '');
      
      // Seção 4
      setCurricularAdaptation(data.curricularAdaptation || '');
      setTeachingMethodologies(data.teachingMethodologies || '');
      setPeiProcess(data.peiProcess || '');
      setEvaluationProcess(data.evaluationProcess || '');
      setAlternativeCommunication(data.alternativeCommunication || '');
      setVisualResources(data.visualResources || '');
      setStudentIntegration(data.studentIntegration || '');
      
      // Seção 5
      setSensoryControl(data.sensoryControl || '');
      setAdaptedMaterials(data.adaptedMaterials || '');
      setCrisisSpaces(data.crisisSpaces || '');
      setBreakAdaptations(data.breakAdaptations || '');
      setTechResources(data.techResources || '');
      setWeightedMaterials(data.weightedMaterials || '');
      
      // Seção 6
      setFamilyCommunication(data.familyCommunication || '');
      setMeetingFrequency(data.meetingFrequency || '');
      setHomeGuidance(data.homeGuidance || '');
      setSupportGroup(data.supportGroup || '');
      setFamilyEvents(data.familyEvents || '');
      
      // Seção 7
      setExternalTherapists(data.externalTherapists || '');
      setClinicPartnerships(data.clinicPartnerships || '');
      setPedagogicalTherapeuticIntegration(data.pedagogicalTherapeuticIntegration || '');
      setSupportNetworks(data.supportNetworks || '');
      setMedicationProtocol(data.medicationProtocol || '');
      
      // Seção 8
      setCertification(data.certification || '');
      setEnrollmentDocuments(data.enrollmentDocuments || '');
      setDevelopmentReports(data.developmentReports || '');
      setPublicAgreements(data.publicAgreements || '');
      setProgressTracking(data.progressTracking || '');
      
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados da escola');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const handleEducationLevelToggle = (level) => {
    if (isViewMode) return;
    if (educationLevels.includes(level)) {
      setEducationLevels(educationLevels.filter(l => l !== level));
    } else {
      setEducationLevels([...educationLevels, level]);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return name.trim() !== '' && cnpj.trim() !== '';
      case 1:
        return educationLevels.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Por favor, preencha os campos obrigatórios antes de continuar.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!String(municipioId || '').trim()) {
      alert('Selecione um município para a escola.');
      return;
    }

    const normalizedAddress = {
      city: String(address || '').trim(),
    };

    const schoolData = {
      name, cnpj, institutionType, operatingHours, phone, email, website,
      institution_type: institutionType,
      municipio_id: String(municipioId || '').trim(),
      address: normalizedAddress,
      educationLevels, totalStudents, teaStudents, maxTeaCapacity, classrooms,
      multifunctionalRooms, sensorySpaces, accessibility,
      totalTeachers, specialEdTeachers, teaTrainedTeachers, multidisciplinaryTeam,
      trainingFrequency, methodologies, mediators, studentMediatorRatio,
      curricularAdaptation, teachingMethodologies, peiProcess, evaluationProcess,
      alternativeCommunication, visualResources, studentIntegration,
      sensoryControl, adaptedMaterials, crisisSpaces, breakAdaptations,
      techResources, weightedMaterials,
      familyCommunication, meetingFrequency, homeGuidance, supportGroup, familyEvents,
      externalTherapists, clinicPartnerships, pedagogicalTherapeuticIntegration,
      supportNetworks, medicationProtocol,
      certification, enrollmentDocuments, developmentReports, publicAgreements,
      progressTracking,
      school_registration_completed: source === 'cadastro-da-escola'
    };

    try {
      setLoading(true);
      const url = id 
        ? `${API_BASE_URL}/schools/${id}`
        : `${API_BASE_URL}/schools`;
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });

      if (!response.ok) throw new Error('Erro ao salvar escola');

      if (source === 'cadastro-da-escola') {
        const payload = await response.json();
        const savedSchoolId = payload?.school?.id || id;
        await formsAPI.submitForm('cadastro_escola', schoolData, {
          source: 'cadastro-da-escola',
          pre_registration_id: savedSchoolId,
        });
      }

      alert(isEditMode ? 'Escola atualizada com sucesso!' : 'Escola cadastrada com sucesso!');
      navigate(backPath);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados da escola');
    } finally {
      setLoading(false);
    }
  };

  const renderReviewSection = () => {
    console.log('🟢 RENDERIZANDO TELA DE REVISÃO - Step:', currentStep);
    return (
      <div className="review-step">
        <h3>Revise todos os dados antes de finalizar o cadastro</h3>
        <p className="review-intro">
          Por favor, confirme que todas as informações estão corretas. 
          Você pode editar qualquer seção clicando no botão "Editar" ao lado do título.
        </p>

        {/* Seção 1 */}
        <div className="review-section">
          <div className="review-header">
            <h4>1. Dados Cadastrais da Instituição</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(0)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Nome:</strong> {name || '(não informado)'}</p>
            <p><strong>CNPJ:</strong> {cnpj || '(não informado)'}</p>
            <p><strong>Tipo:</strong> {institutionType || '(não informado)'}</p>
            <p><strong>Horário:</strong> {operatingHours || '(não informado)'}</p>
            <p><strong>Município:</strong> {municipioId || '(não informado)'}</p>
            <p><strong>Endereço:</strong> {address || '(não informado)'}</p>
            <p><strong>Telefone:</strong> {phone || '(não informado)'}</p>
            <p><strong>E-mail:</strong> {email || '(não informado)'}</p>
            <p><strong>Site:</strong> {website || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 2 */}
        <div className="review-section">
          <div className="review-header">
            <h4>2. Estrutura e Capacidade</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(1)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Níveis de ensino:</strong> {educationLevels.length > 0 ? educationLevels.join(', ') : '(não informado)'}</p>
            <p><strong>Total de alunos:</strong> {totalStudents || '(não informado)'}</p>
            <p><strong>Alunos com TEA:</strong> {teaStudents || '(não informado)'}</p>
            <p><strong>Capacidade máxima TEA:</strong> {maxTeaCapacity || '(não informado)'}</p>
            <p><strong>Salas de aula:</strong> {classrooms || '(não informado)'}</p>
            <p><strong>Salas multifuncionais:</strong> {multifunctionalRooms || '(não informado)'}</p>
            <p><strong>Espaços sensoriais:</strong> {sensorySpaces || '(não informado)'}</p>
            <p><strong>Acessibilidade:</strong> {accessibility || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 3 */}
        <div className="review-section">
          <div className="review-header">
            <h4>3. Equipe e Capacitação</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(2)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Total de professores:</strong> {totalTeachers || '(não informado)'}</p>
            <p><strong>Professores com formação especial:</strong> {specialEdTeachers || '(não informado)'}</p>
            <p><strong>Professores treinados em TEA:</strong> {teaTrainedTeachers || '(não informado)'}</p>
            <p><strong>Equipe multidisciplinar:</strong> {multidisciplinaryTeam || '(não informado)'}</p>
            <p><strong>Frequência de capacitação:</strong> {trainingFrequency || '(não informado)'}</p>
            <p><strong>Metodologias:</strong> {methodologies || '(não informado)'}</p>
            <p><strong>Mediadores:</strong> {mediators || '(não informado)'}</p>
            <p><strong>Proporção aluno-mediador:</strong> {studentMediatorRatio || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 4 */}
        <div className="review-section">
          <div className="review-header">
            <h4>4. Suporte Pedagógico e Inclusão</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(3)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Adaptação curricular:</strong> {curricularAdaptation || '(não informado)'}</p>
            <p><strong>Metodologias de ensino:</strong> {teachingMethodologies || '(não informado)'}</p>
            <p><strong>Processo PEI:</strong> {peiProcess || '(não informado)'}</p>
            <p><strong>Processo de avaliação:</strong> {evaluationProcess || '(não informado)'}</p>
            <p><strong>Comunicação alternativa:</strong> {alternativeCommunication || '(não informado)'}</p>
            <p><strong>Recursos visuais:</strong> {visualResources || '(não informado)'}</p>
            <p><strong>Integração de alunos:</strong> {studentIntegration || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 5 */}
        <div className="review-section">
          <div className="review-header">
            <h4>5. Estrutura Sensorial e Adaptativa</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(4)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Controle sensorial:</strong> {sensoryControl || '(não informado)'}</p>
            <p><strong>Materiais adaptados:</strong> {adaptedMaterials || '(não informado)'}</p>
            <p><strong>Espaços para crise:</strong> {crisisSpaces || '(não informado)'}</p>
            <p><strong>Adaptações no recreio:</strong> {breakAdaptations || '(não informado)'}</p>
            <p><strong>Recursos tecnológicos:</strong> {techResources || '(não informado)'}</p>
            <p><strong>Materiais com peso:</strong> {weightedMaterials || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 6 */}
        <div className="review-section">
          <div className="review-header">
            <h4>6. Parceria Família-Escola</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(5)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Comunicação com famílias:</strong> {familyCommunication || '(não informado)'}</p>
            <p><strong>Frequência de reuniões:</strong> {meetingFrequency || '(não informado)'}</p>
            <p><strong>Orientações para casa:</strong> {homeGuidance || '(não informado)'}</p>
            <p><strong>Grupo de apoio:</strong> {supportGroup || '(não informado)'}</p>
            <p><strong>Eventos para famílias:</strong> {familyEvents || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 7 */}
        <div className="review-section">
          <div className="review-header">
            <h4>7. Suporte Clínico e Parcerias</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(6)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Terapeutas externos:</strong> {externalTherapists || '(não informado)'}</p>
            <p><strong>Parcerias clínicas:</strong> {clinicPartnerships || '(não informado)'}</p>
            <p><strong>Integração pedagógico-terapêutica:</strong> {pedagogicalTherapeuticIntegration || '(não informado)'}</p>
            <p><strong>Redes de apoio:</strong> {supportNetworks || '(não informado)'}</p>
            <p><strong>Protocolo de medicamentos:</strong> {medicationProtocol || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 8 */}
        <div className="review-section">
          <div className="review-header">
            <h4>8. Documentação e Certificação</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(7)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Certificação TEA:</strong> {certification || '(não informado)'}</p>
            <p><strong>Documentos para matrícula:</strong> {enrollmentDocuments || '(não informado)'}</p>
            <p><strong>Relatórios de desenvolvimento:</strong> {developmentReports || '(não informado)'}</p>
            <p><strong>Convênios públicos:</strong> {publicAgreements || '(não informado)'}</p>
            <p><strong>Acompanhamento de evolução:</strong> {progressTracking || '(não informado)'}</p>
          </div>
        </div>

        <div className="review-warning">
          <p>⚠️ Após confirmar, {isEditMode ? 'as alterações serão salvas' : 'a escola será cadastrada'}. Certifique-se de que tudo está correto.</p>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    console.log('📍 Renderizando step:', currentStep, 'de', steps.length);
    
    // Tela de revisão (step 8 = 9ª seção)
    if (currentStep === 8) {
      return renderReviewSection();
    }



    switch (currentStep) {
      case 0: // Dados Cadastrais
        return (
          <div className="form-section">
            <h3>Seção 1 - Dados Cadastrais da Instituição</h3>
            
            <div className="form-group">
              <label>Nome completo da instituição *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isViewMode}
                required
              />
            </div>

            <div className="form-group">
              <label>CNPJ *</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                disabled={isViewMode}
                required
              />
            </div>

            <div className="form-group">
              <label>Tipo de Instituição</label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                disabled={isViewMode}
              >
                <option value="">Selecione...</option>
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
                <option value="Filantrópica">Filantrópica</option>
              </select>
            </div>

            <div className="form-group">
              <label>Horário de Funcionamento</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Ex: 7h às 18h"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Município *</label>
              <select
                value={municipioId}
                onChange={(e) => {
                  const nextMunicipioId = e.target.value;
                  setMunicipioId(nextMunicipioId);
                  if (!isSecretariaScoped) {
                    const matchedMunicipality = municipalities.find((item) => item.id === nextMunicipioId);
                    if (matchedMunicipality?.name) {
                      setAddress(matchedMunicipality.name);
                    }
                  }
                }}
                disabled={isViewMode || isSecretariaScoped || municipalitiesLoading}
                required
              >
                <option value="">{municipalitiesLoading ? 'Carregando municípios...' : 'Selecione...'}</option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.name} ({municipality.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Endereço completo</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                rows="3"
                disabled={isViewMode || isSecretariaScoped}
              />
              {isSecretariaScoped && (
                <small>Campo definido automaticamente pelo município da secretaria.</small>
              )}
            </div>

            <div className="form-group">
              <label>Telefone para contato</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(XX) 9XXXX-XXXX"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>E-mail institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Site</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.exemplo.com.br"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 1: // Estrutura e Capacidade
        return (
          <div className="form-section">
            <h3>Seção 2 - Estrutura e Capacidade</h3>
            
            <div className="form-group">
              <label>Níveis de ensino oferecidos *</label>
              <div className="checkbox-group">
                {['Educação Infantil', 'Ensino Fundamental I', 'Ensino Fundamental II', 'Ensino Médio'].map(level => (
                  <label key={level} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={educationLevels.includes(level)}
                      onChange={() => handleEducationLevelToggle(level)}
                      disabled={isViewMode}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Número total de alunos na instituição</label>
              <input
                type="number"
                value={totalStudents}
                onChange={(e) => setTotalStudents(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Número de alunos com TEA atualmente matriculados</label>
              <input
                type="number"
                value={teaStudents}
                onChange={(e) => setTeaStudents(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Capacidade máxima para alunos com TEA</label>
              <input
                type="number"
                value={maxTeaCapacity}
                onChange={(e) => setMaxTeaCapacity(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Número de salas de aula</label>
              <input
                type="number"
                value={classrooms}
                onChange={(e) => setClassrooms(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Possui salas de recursos multifuncionais? Se sim, quantas?</label>
              <textarea
                value={multifunctionalRooms}
                onChange={(e) => setMultifunctionalRooms(e.target.value)}
                rows="3"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Possui espaços sensoriais ou salas de descompressão? Descreva</label>
              <textarea
                value={sensorySpaces}
                onChange={(e) => setSensorySpaces(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Acessibilidade física: quais adaptações a escola possui?</label>
              <textarea
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 2: // Equipe e Capacitação
        return (
          <div className="form-section">
            <h3>Seção 3 - Equipe e Capacitação</h3>
            
            <div className="form-group">
              <label>Número total de professores</label>
              <input
                type="number"
                value={totalTeachers}
                onChange={(e) => setTotalTeachers(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Número de professores com formação específica em Educação Especial</label>
              <input
                type="number"
                value={specialEdTeachers}
                onChange={(e) => setSpecialEdTeachers(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Número de professores com formação específica em TEA</label>
              <input
                type="number"
                value={teaTrainedTeachers}
                onChange={(e) => setTeaTrainedTeachers(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola conta com equipe multidisciplinar? Quais profissionais?</label>
              <textarea
                value={multidisciplinaryTeam}
                onChange={(e) => setMultidisciplinaryTeam(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Frequência de capacitação da equipe em TEA</label>
              <select
                value={trainingFrequency}
                onChange={(e) => setTrainingFrequency(e.target.value)}
                disabled={isViewMode}
              >
                <option value="">Selecione...</option>
                <option value="Mensal">Mensal</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipos de metodologias que a equipe foi capacitada (ABA, TEACCH, Denver, etc.)</label>
              <textarea
                value={methodologies}
                onChange={(e) => setMethodologies(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Número de mediadores/professores de apoio disponíveis</label>
              <input
                type="number"
                value={mediators}
                onChange={(e) => setMediators(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual a proporção aluno-mediador praticada pela instituição?</label>
              <input
                type="text"
                value={studentMediatorRatio}
                onChange={(e) => setStudentMediatorRatio(e.target.value)}
                placeholder="Ex: 1 mediador para cada 3 alunos"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 3: // Suporte Pedagógico
        return (
          <div className="form-section">
            <h3>Seção 4 - Suporte Pedagógico e Inclusão</h3>
            
            <div className="form-group">
              <label>A escola trabalha com adaptação curricular? Como é realizada?</label>
              <textarea
                value={curricularAdaptation}
                onChange={(e) => setCurricularAdaptation(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais metodologias de ensino são aplicadas especificamente para alunos com TEA?</label>
              <textarea
                value={teachingMethodologies}
                onChange={(e) => setTeachingMethodologies(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é feito o Plano de Ensino Individualizado (PEI)?</label>
              <textarea
                value={peiProcess}
                onChange={(e) => setPeiProcess(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é realizada a avaliação dos alunos com TEA?</label>
              <textarea
                value={evaluationProcess}
                onChange={(e) => setEvaluationProcess(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais recursos de Comunicação Alternativa são utilizados? (PECS, pranchas, etc.)</label>
              <textarea
                value={alternativeCommunication}
                onChange={(e) => setAlternativeCommunication(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola utiliza recursos visuais para rotina e organização? Quais?</label>
              <textarea
                value={visualResources}
                onChange={(e) => setVisualResources(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é realizada a integração entre alunos neurotípicos e alunos com TEA?</label>
              <textarea
                value={studentIntegration}
                onChange={(e) => setStudentIntegration(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 4: // Estrutura Sensorial
        return (
          <div className="form-section">
            <h3>Seção 5 - Estrutura Sensorial e Adaptativa</h3>
            
            <div className="form-group">
              <label>A escola possui controle de estímulos sensoriais? (iluminação, som, etc.)</label>
              <textarea
                value={sensoryControl}
                onChange={(e) => setSensoryControl(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais materiais adaptados estão disponíveis para alunos com TEA?</label>
              <textarea
                value={adaptedMaterials}
                onChange={(e) => setAdaptedMaterials(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Existem espaços específicos para momentos de crise ou sobrecarga sensorial?</label>
              <textarea
                value={crisisSpaces}
                onChange={(e) => setCrisisSpaces(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola oferece adaptações para o intervalo/recreio?</label>
              <textarea
                value={breakAdaptations}
                onChange={(e) => setBreakAdaptations(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais recursos tecnológicos são utilizados como apoio aos alunos com TEA?</label>
              <textarea
                value={techResources}
                onChange={(e) => setTechResources(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>São oferecidos materiais com peso (coletes, cobertores, etc.) para regulação sensorial?</label>
              <textarea
                value={weightedMaterials}
                onChange={(e) => setWeightedMaterials(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 5: // Parceria Família-Escola
        return (
          <div className="form-section">
            <h3>Seção 6 - Parceria Família-Escola</h3>
            
            <div className="form-group">
              <label>Como é realizada a comunicação diária com as famílias?</label>
              <textarea
                value={familyCommunication}
                onChange={(e) => setFamilyCommunication(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual a frequência de reuniões específicas com pais de alunos com TEA?</label>
              <textarea
                value={meetingFrequency}
                onChange={(e) => setMeetingFrequency(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola oferece orientações para continuidade do trabalho em casa?</label>
              <textarea
                value={homeGuidance}
                onChange={(e) => setHomeGuidance(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Existe grupo de apoio para famílias de alunos com TEA?</label>
              <textarea
                value={supportGroup}
                onChange={(e) => setSupportGroup(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola promove eventos/atividades que incluam as famílias?</label>
              <textarea
                value={familyEvents}
                onChange={(e) => setFamilyEvents(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 6: // Suporte Clínico
        return (
          <div className="form-section">
            <h3>Seção 7 - Suporte Clínico e Parcerias</h3>
            
            <div className="form-group">
              <label>A escola aceita a entrada de terapeutas externos para acompanhamento?</label>
              <textarea
                value={externalTherapists}
                onChange={(e) => setExternalTherapists(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Possui parcerias com clínicas ou profissionais especializados em TEA?</label>
              <textarea
                value={clinicPartnerships}
                onChange={(e) => setClinicPartnerships(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é feita a integração entre o trabalho pedagógico e terapêutico?</label>
              <textarea
                value={pedagogicalTherapeuticIntegration}
                onChange={(e) => setPedagogicalTherapeuticIntegration(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola participa de redes de apoio à inclusão?</label>
              <textarea
                value={supportNetworks}
                onChange={(e) => setSupportNetworks(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Existe algum protocolo específico para administração de medicamentos, quando necessário?</label>
              <textarea
                value={medicationProtocol}
                onChange={(e) => setMedicationProtocol(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 7: // Documentação
        return (
          <div className="form-section">
            <h3>Seção 8 - Documentação e Certificação</h3>
            
            <div className="form-group">
              <label>A escola possui alguma certificação específica para atendimento a alunos com TEA?</label>
              <textarea
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais documentos são exigidos para matrícula de alunos com TEA?</label>
              <textarea
                value={enrollmentDocuments}
                onChange={(e) => setEnrollmentDocuments(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola emite diários/relatórios periódicos de desenvolvimento? Com qual frequência?</label>
              <textarea
                value={developmentReports}
                onChange={(e) => setDevelopmentReports(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Possui convênios com órgãos públicos para atendimento especializado?</label>
              <textarea
                value={publicAgreements}
                onChange={(e) => setPublicAgreements(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é feito o registro e acompanhamento da evolução dos alunos com TEA?</label>
              <textarea
                value={progressTracking}
                onChange={(e) => setProgressTracking(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="pdi-form-container">
      <div className="pdi-form-header">
        <h2>
          {isViewMode ? 'Visualizar' : isEditMode ? 'Editar' : 'Novo'} Cadastro de Escola
        </h2>
        <button className="btn-secondary" onClick={() => navigate(backPath)}>
          Voltar
        </button>
      </div>

      {/* Progress indicator */}
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {renderStep()}

        <div className="form-navigation">
          {currentStep > 0 && (
            <button
              type="button"
              className="btn-nav btn-previous"
              onClick={handlePrevious}
              disabled={loading}
            >
              ← Anterior
            </button>
          )}
          
          <div className="nav-spacer"></div>
          
          {currentStep < 8 ? (
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
                onClick={handleSubmit}
                className="btn-nav btn-submit"
                disabled={loading}
              >
                {loading ? 'Salvando...' : isEditMode ? 'Atualizar Escola' : 'Cadastrar Escola'}
              </button>
            )
          )}
          
          {isViewMode && currentStep < 8 && (
            <button
              type="button"
              onClick={handleNext}
              className="btn-nav btn-next"
            >
              Próximo →
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SchoolFormNew;
