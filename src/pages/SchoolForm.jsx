import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './PDIForm.css'; // Reusing PDI form styles
import { API_BASE_URL } from '../services/api';

const SchoolForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit');
  const isCreateMode = !id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Section 1: Dados Cadastrais da Instituição
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Section 2: Estrutura e Capacidade
  const [educationLevels, setEducationLevels] = useState([]);
  const [totalStudents, setTotalStudents] = useState('');
  const [teaStudents, setTeaStudents] = useState('');
  const [maxTeaCapacity, setMaxTeaCapacity] = useState('');
  const [classrooms, setClassrooms] = useState('');
  const [multifunctionalRooms, setMultifunctionalRooms] = useState('');
  const [sensorySpaces, setSensorySpaces] = useState('');
  const [accessibility, setAccessibility] = useState('');

  // Section 3: Equipe e Capacitação
  const [totalTeachers, setTotalTeachers] = useState('');
  const [specialEdTeachers, setSpecialEdTeachers] = useState('');
  const [teaTrainedTeachers, setTeaTrainedTeachers] = useState('');
  const [multidisciplinaryTeam, setMultidisciplinaryTeam] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState('');
  const [methodologies, setMethodologies] = useState('');
  const [mediators, setMediators] = useState('');
  const [studentMediatorRatio, setStudentMediatorRatio] = useState('');

  // Section 4: Suporte Pedagógico e Inclusão
  const [curricularAdaptation, setCurricularAdaptation] = useState('');
  const [teachingMethodologies, setTeachingMethodologies] = useState('');
  const [peiProcess, setPeiProcess] = useState('');
  const [evaluationProcess, setEvaluationProcess] = useState('');
  const [alternativeCommunication, setAlternativeCommunication] = useState('');
  const [visualResources, setVisualResources] = useState('');
  const [studentIntegration, setStudentIntegration] = useState('');

  // Section 5: Estrutura Sensorial e Adaptativa
  const [sensoryControl, setSensoryControl] = useState('');
  const [adaptedMaterials, setAdaptedMaterials] = useState('');
  const [crisisSpaces, setCrisisSpaces] = useState('');
  const [breakAdaptations, setBreakAdaptations] = useState('');
  const [techResources, setTechResources] = useState('');
  const [weightedMaterials, setWeightedMaterials] = useState('');

  // Section 6: Parceria Família-Escola
  const [familyCommunication, setFamilyCommunication] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('');
  const [homeGuidance, setHomeGuidance] = useState('');
  const [supportGroup, setSupportGroup] = useState('');
  const [familyEvents, setFamilyEvents] = useState('');

  // Section 7: Suporte Clínico e Parcerias
  const [externalTherapists, setExternalTherapists] = useState('');
  const [clinicPartnerships, setClinicPartnerships] = useState('');
  const [pedagogicalTherapeuticIntegration, setPedagogicalTherapeuticIntegration] = useState('');
  const [supportNetworks, setSupportNetworks] = useState('');
  const [medicationProtocol, setMedicationProtocol] = useState('');

  // Section 8: Documentação e Certificação
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
    'Documentação'
  ];

  useEffect(() => {
    if (id && !isCreateMode) {
      loadSchool();
    }
  }, [id]);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/schools/${id}`);
      if (!response.ok) throw new Error('Erro ao carregar escola');
      const data = await response.json();
      
      // Section 1
      setName(data.name || '');
      setCnpj(data.cnpj || '');
      setInstitutionType(data.institutionType || '');
      setOperatingHours(data.operatingHours || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      
      // Section 2
      setEducationLevels(data.educationLevels || []);
      setTotalStudents(data.totalStudents || '');
      setTeaStudents(data.teaStudents || '');
      setMaxTeaCapacity(data.maxTeaCapacity || '');
      setClassrooms(data.classrooms || '');
      setMultifunctionalRooms(data.multifunctionalRooms || '');
      setSensorySpaces(data.sensorySpaces || '');
      setAccessibility(data.accessibility || '');
      
      // Section 3
      setTotalTeachers(data.totalTeachers || '');
      setSpecialEdTeachers(data.specialEdTeachers || '');
      setTeaTrainedTeachers(data.teaTrainedTeachers || '');
      setMultidisciplinaryTeam(data.multidisciplinaryTeam || '');
      setTrainingFrequency(data.trainingFrequency || '');
      setMethodologies(data.methodologies || '');
      setMediators(data.mediators || '');
      setStudentMediatorRatio(data.studentMediatorRatio || '');
      
      // Section 4
      setCurricularAdaptation(data.curricularAdaptation || '');
      setTeachingMethodologies(data.teachingMethodologies || '');
      setPeiProcess(data.peiProcess || '');
      setEvaluationProcess(data.evaluationProcess || '');
      setAlternativeCommunication(data.alternativeCommunication || '');
      setVisualResources(data.visualResources || '');
      setStudentIntegration(data.studentIntegration || '');
      
      // Section 5
      setSensoryControl(data.sensoryControl || '');
      setAdaptedMaterials(data.adaptedMaterials || '');
      setCrisisSpaces(data.crisisSpaces || '');
      setBreakAdaptations(data.breakAdaptations || '');
      setTechResources(data.techResources || '');
      setWeightedMaterials(data.weightedMaterials || '');
      
      // Section 6
      setFamilyCommunication(data.familyCommunication || '');
      setMeetingFrequency(data.meetingFrequency || '');
      setHomeGuidance(data.homeGuidance || '');
      setSupportGroup(data.supportGroup || '');
      setFamilyEvents(data.familyEvents || '');
      
      // Section 7
      setExternalTherapists(data.externalTherapists || '');
      setClinicPartnerships(data.clinicPartnerships || '');
      setPedagogicalTherapeuticIntegration(data.pedagogicalTherapeuticIntegration || '');
      setSupportNetworks(data.supportNetworks || '');
      setMedicationProtocol(data.medicationProtocol || '');
      
      // Section 8
      setCertification(data.certification || '');
      setEnrollmentDocuments(data.enrollmentDocuments || '');
      setDevelopmentReports(data.developmentReports || '');
      setPublicAgreements(data.publicAgreements || '');
      setProgressTracking(data.progressTracking || '');
      
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados da escola');
      navigate('/schools');
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
    console.log('Current step:', currentStep, 'Total steps:', steps.length);
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, steps.length - 1);
      console.log('Moving to step:', nextStep);
      setCurrentStep(nextStep);
      // Force scroll to top to ensure new content is visible
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      alert('Por favor, preencha os campos obrigatórios antes de continuar.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const schoolData = {
      // Section 1
      name,
      cnpj,
      institutionType,
      operatingHours,
      address,
      phone,
      email,
      website,
      // Section 2
      educationLevels,
      totalStudents,
      teaStudents,
      maxTeaCapacity,
      classrooms,
      multifunctionalRooms,
      sensorySpaces,
      accessibility,
      // Section 3
      totalTeachers,
      specialEdTeachers,
      teaTrainedTeachers,
      multidisciplinaryTeam,
      trainingFrequency,
      methodologies,
      mediators,
      studentMediatorRatio,
      // Section 4
      curricularAdaptation,
      teachingMethodologies,
      peiProcess,
      evaluationProcess,
      alternativeCommunication,
      visualResources,
      studentIntegration,
      // Section 5
      sensoryControl,
      adaptedMaterials,
      crisisSpaces,
      breakAdaptations,
      techResources,
      weightedMaterials,
      // Section 6
      familyCommunication,
      meetingFrequency,
      homeGuidance,
      supportGroup,
      familyEvents,
      // Section 7
      externalTherapists,
      clinicPartnerships,
      pedagogicalTherapeuticIntegration,
      supportNetworks,
      medicationProtocol,
      // Section 8
      certification,
      enrollmentDocuments,
      developmentReports,
      publicAgreements,
      progressTracking,
    };

    try {
      setLoading(true);
      const url = isEditMode 
        ? `${API_BASE_URL}/schools/${id}`
        : `${API_BASE_URL}/schools`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });

      if (!response.ok) throw new Error('Erro ao salvar escola');

      alert(isEditMode ? 'Escola atualizada com sucesso!' : 'Escola cadastrada com sucesso!');
      navigate('/schools');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados da escola');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    console.log('Rendering step:', currentStep);
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
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
                <option value="filantrópica">Filantrópica</option>
              </select>
            </div>

            <div className="form-group">
              <label>Horário de Funcionamento</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Ex: 7h às 17h"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Endereço completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
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
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
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
              <input
                type="text"
                value={multifunctionalRooms}
                onChange={(e) => setMultifunctionalRooms(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Possui espaços sensoriais ou salas de descompressão? Descreva</label>
              <textarea
                value={sensorySpaces}
                onChange={(e) => setSensorySpaces(e.target.value)}
                rows="3"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Acessibilidade física: quais adaptações a escola possui?</label>
              <textarea
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                rows="3"
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
                rows="3"
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
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipos de metodologias que a equipe foi capacitada (ABA, TEACCH, Denver, etc)</label>
              <textarea
                value={methodologies}
                onChange={(e) => setMethodologies(e.target.value)}
                rows="3"
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
              <label>Proporção aluno-mediador praticada pela instituição</label>
              <input
                type="text"
                value={studentMediatorRatio}
                onChange={(e) => setStudentMediatorRatio(e.target.value)}
                placeholder="Ex: 1:1, 2:1, etc"
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
              <label>Quais recursos de Comunicação Alternativa são utilizados? (PECS, pranchas de comunicação, etc.)</label>
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
        console.log('🔴🔴🔴 DENTRO DO CASE 7 - SEÇÃO 8 🔴🔴🔴');
        return (
          <div style={{
            backgroundColor: 'red', 
            color: 'white', 
            padding: '50px', 
            fontSize: '3rem', 
            textAlign: 'center',
            minHeight: '400px'
          }}>
            <h1>🎉🎉🎉 VOCÊ ESTÁ NA SEÇÃO 8! 🎉🎉🎉</h1>
            <p>SE VOCÊ ESTÁ VENDO ISSO, FUNCIONOU!</p>
            
            <div style={{backgroundColor: 'white', color: 'black', padding: '20px', margin: '20px'}}>
              <h3>Seção 8 - Documentação e Certificação</h3>
              
              <div className="form-group">
                <label>A escola possui alguma certificação específica para atendimento a alunos com TEA?</label>
                <textarea
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
                  rows="4"
                  disabled={isViewMode}
                  placeholder="Digite aqui..."
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
        <button className="btn-secondary" onClick={() => navigate('/schools')}>
          Voltar
        </button>
      </div>

      {/* Progress indicator */}
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div key={currentStep}>
          {renderStep()}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Anterior
          </button>

          {(() => {
            const showNext = currentStep < steps.length - 1;
            console.log('Button logic - currentStep:', currentStep, 'steps.length:', steps.length, 'showNext:', showNext);
            return showNext ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                disabled={isViewMode}
              >
                Próximo (Step {currentStep + 1}/{steps.length})
              </button>
            ) : (
              !isViewMode && (
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : isEditMode ? 'Atualizar Escola' : 'Cadastrar Escola'}
                </button>
              )
            );
          })()}
        </div>
      </form>
    </div>
  );
};

export default SchoolForm;
