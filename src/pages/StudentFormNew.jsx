import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './PDIForm.css';
import { API_BASE_URL } from '../services/api';
import { formsAPI } from '../services/api';

const StudentFormNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit');
  const source = new URLSearchParams(location.search).get('source');
  const backPath = source === 'estudo-de-caso' ? '/estudo-de-caso' : '/students';

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Seção 1: Cadastral
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [className, setClassName] = useState('');
  const [mainTeacher, setMainTeacher] = useState('');
  const [supportTeacher, setSupportTeacher] = useState('');

  // Seção 2: Informações Pessoais (16 perguntas)
  const [likesSchool, setLikesSchool] = useState('');
  const [likesSchoolObs, setLikesSchoolObs] = useState('');
  const [hasFriends, setHasFriends] = useState('');
  const [friendsNames, setFriendsNames] = useState('');
  const [hasFavoriteColleague, setHasFavoriteColleague] = useState('');
  const [favoriteColleagueName, setFavoriteColleagueName] = useState('');
  const [favoriteActivities, setFavoriteActivities] = useState('');
  const [difficultTasks, setDifficultTasks] = useState('');
  const [expressNeeds, setExpressNeeds] = useState('');
  const [asksForHelp, setAsksForHelp] = useState('');
  const [opinionTeachers, setOpinionTeachers] = useState('');
  const [opinionSchoolImportance, setOpinionSchoolImportance] = useState('');
  const [schoolSupports, setSchoolSupports] = useState('');
  const [satisfiedSupports, setSatisfiedSupports] = useState('');
  const [desiredSupports, setDesiredSupports] = useState('');
  const [specialInterests, setSpecialInterests] = useState('');

  // Seção 3: Informações sobre a Escola (16 perguntas)
  const [participatesActivities, setParticipatesActivities] = useState('');
  const [activitiesFacilityDifficulty, setActivitiesFacilityDifficulty] = useState('');
  const [participationLevel, setParticipationLevel] = useState('');
  const [specificNeeds, setSpecificNeeds] = useState('');
  const [receivesSupport, setReceivesSupport] = useState('');
  const [teacherExpectations, setTeacherExpectations] = useState('');
  const [performanceEvaluation, setPerformanceEvaluation] = useState('');
  const [teacherConcerns, setTeacherConcerns] = useState('');
  const [communityPerception, setCommunityPerception] = useState('');
  const [teacherSchoolExpectations, setTeacherSchoolExpectations] = useState('');
  const [studentSkills, setStudentSkills] = useState('');
  const [aeeReason, setAeeReason] = useState('');
  const [accessibilityResources, setAccessibilityResources] = useState('');
  const [resourcesEvaluation, setResourcesEvaluation] = useState('');
  const [classInvolvement, setClassInvolvement] = useState('');
  const [schoolOpinion, setSchoolOpinion] = useState('');

  // Seção 4: Informações Familiares (5 perguntas)
  const [familyOpinion, setFamilyOpinion] = useState('');
  const [familyInvolvement, setFamilyInvolvement] = useState('');
  const [familyAwareness, setFamilyAwareness] = useState('');
  const [familyIdentifies, setFamilyIdentifies] = useState('');
  const [familyExpectations, setFamilyExpectations] = useState('');

  // Seção 5: Questionário Complementar (36 questões + 6 observações)
  // Social
  const [socialInteracts, setSocialInteracts] = useState('');
  const [socialInitiates, setSocialInitiates] = useState('');
  const [socialParticipates, setSocialParticipates] = useState('');
  const [socialWaitsTurn, setSocialWaitsTurn] = useState('');
  const [socialShares, setSocialShares] = useState('');
  const [socialObs, setSocialObs] = useState('');

  // Afetivo
  const [affectiveDemonstrates, setAffectiveDemonstrates] = useState('');
  const [affectiveReacts, setAffectiveReacts] = useState('');
  const [affectiveSeeksSupport, setAffectiveSeeksSupport] = useState('');
  const [affectiveRoutineChanges, setAffectiveRoutineChanges] = useState('');
  const [affectiveCalmDown, setAffectiveCalmDown] = useState('');
  const [affectiveObs, setAffectiveObs] = useState('');

  // Cognitivo
  const [cognitiveInterest, setCognitiveInterest] = useState('');
  const [cognitiveInstructions, setCognitiveInstructions] = useState('');
  const [cognitiveAttention, setCognitiveAttention] = useState('');
  const [cognitiveProblems, setCognitiveProblems] = useState('');
  const [cognitiveVisual, setCognitiveVisual] = useState('');
  const [cognitiveObs, setCognitiveObs] = useState('');

  // Motor
  const [motorFine, setMotorFine] = useState('');
  const [motorGross, setMotorGross] = useState('');
  const [motorSelfCare, setMotorSelfCare] = useState('');
  const [motorPhysical, setMotorPhysical] = useState('');
  const [motorRepetitive, setMotorRepetitive] = useState('');
  const [motorObs, setMotorObs] = useState('');

  // Alimentação
  const [feedingRestricted, setFeedingRestricted] = useState('');
  const [feedingNeedsHelp, setFeedingNeedsHelp] = useState('');
  const [feedingMixedFoods, setFeedingMixedFoods] = useState('');
  const [feedingQuietPlace, setFeedingQuietPlace] = useState('');
  const [feedingChallenging, setFeedingChallenging] = useState('');
  const [feedingObs, setFeedingObs] = useState('');

  // Familiar
  const [familyParticipates, setFamilyParticipates] = useState('');
  const [familyCommunication, setFamilyCommunication] = useState('');
  const [familySupport, setFamilySupport] = useState('');
  const [familyCollaboration, setFamilyCollaboration] = useState('');
  const [familyOpenness, setFamilyOpenness] = useState('');
  const [familyObs, setFamilyObs] = useState('');

  // Seção 6: Questões Pedagógicas
  const [pedagogicalAdaptations, setPedagogicalAdaptations] = useState('');
  const [pedagogicalDevelopment, setPedagogicalDevelopment] = useState('');

  const steps = [
    'Cadastral',
    'Informações Pessoais',
    'Escola do Aluno',
    'Informações Familiares',
    'Questionário Complementar',
    'Questões Pedagógicas',
    'Revisão e Confirmação'
  ];

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students/${id}`);
      if (!response.ok) throw new Error('Erro ao carregar aluno');
      const data = await response.json();

      const guardiansFromArray = Array.isArray(data.guardians) ? data.guardians : [];
      const firstGuardian = guardiansFromArray[0] || '';
      const secondGuardian = guardiansFromArray[1] || '';
      const teachersFromArray = Array.isArray(data.teachers) ? data.teachers : [];
      const firstTeacher = teachersFromArray[0] || '';
      const secondTeacher = teachersFromArray[1] || '';

      // Seção 1
      setStudentName(data.studentName || data.name || '');
      setStudentAge(data.studentAge || data.age || '');
      setMotherName(data.motherName || firstGuardian);
      setFatherName(data.fatherName || secondGuardian);
      setSchoolName(data.schoolName || data.school_name || '');
      setSchoolYear(data.schoolYear || data.grade || '');
      setClassName(data.className || data.class || '');
      setMainTeacher(data.mainTeacher || firstTeacher);
      setSupportTeacher(data.supportTeacher || secondTeacher);

      // Seção 2
      setLikesSchool(data.likesSchool || '');
      setLikesSchoolObs(data.likesSchoolObs || '');
      setHasFriends(data.hasFriends || '');
      setFriendsNames(data.friendsNames || '');
      setHasFavoriteColleague(data.hasFavoriteColleague || '');
      setFavoriteColleagueName(data.favoriteColleagueName || '');
      setFavoriteActivities(data.favoriteActivities || '');
      setDifficultTasks(data.difficultTasks || '');
      setExpressNeeds(data.expressNeeds || '');
      setAsksForHelp(data.asksForHelp || '');
      setOpinionTeachers(data.opinionTeachers || '');
      setOpinionSchoolImportance(data.opinionSchoolImportance || '');
      setSchoolSupports(data.schoolSupports || '');
      setSatisfiedSupports(data.satisfiedSupports || '');
      setDesiredSupports(data.desiredSupports || '');
      setSpecialInterests(data.specialInterests || '');

      // Seção 3
      setParticipatesActivities(data.participatesActivities || '');
      setActivitiesFacilityDifficulty(data.activitiesFacilityDifficulty || '');
      setParticipationLevel(data.participationLevel || '');
      setSpecificNeeds(data.specificNeeds || '');
      setReceivesSupport(data.receivesSupport || '');
      setTeacherExpectations(data.teacherExpectations || '');
      setPerformanceEvaluation(data.performanceEvaluation || '');
      setTeacherConcerns(data.teacherConcerns || '');
      setCommunityPerception(data.communityPerception || '');
      setTeacherSchoolExpectations(data.teacherSchoolExpectations || '');
      setStudentSkills(data.studentSkills || '');
      setAeeReason(data.aeeReason || '');
      setAccessibilityResources(data.accessibilityResources || '');
      setResourcesEvaluation(data.resourcesEvaluation || '');
      setClassInvolvement(data.classInvolvement || '');
      setSchoolOpinion(data.schoolOpinion || '');

      // Seção 4
      setFamilyOpinion(data.familyOpinion || '');
      setFamilyInvolvement(data.familyInvolvement || '');
      setFamilyAwareness(data.familyAwareness || '');
      setFamilyIdentifies(data.familyIdentifies || '');
      setFamilyExpectations(data.familyExpectations || '');

      // Seção 5
      setSocialInteracts(data.socialInteracts || '');
      setSocialInitiates(data.socialInitiates || '');
      setSocialParticipates(data.socialParticipates || '');
      setSocialWaitsTurn(data.socialWaitsTurn || '');
      setSocialShares(data.socialShares || '');
      setSocialObs(data.socialObs || '');
      setAffectiveDemonstrates(data.affectiveDemonstrates || '');
      setAffectiveReacts(data.affectiveReacts || '');
      setAffectiveSeeksSupport(data.affectiveSeeksSupport || '');
      setAffectiveRoutineChanges(data.affectiveRoutineChanges || '');
      setAffectiveCalmDown(data.affectiveCalmDown || '');
      setAffectiveObs(data.affectiveObs || '');
      setCognitiveInterest(data.cognitiveInterest || '');
      setCognitiveInstructions(data.cognitiveInstructions || '');
      setCognitiveAttention(data.cognitiveAttention || '');
      setCognitiveProblems(data.cognitiveProblems || '');
      setCognitiveVisual(data.cognitiveVisual || '');
      setCognitiveObs(data.cognitiveObs || '');
      setMotorFine(data.motorFine || '');
      setMotorGross(data.motorGross || '');
      setMotorSelfCare(data.motorSelfCare || '');
      setMotorPhysical(data.motorPhysical || '');
      setMotorRepetitive(data.motorRepetitive || '');
      setMotorObs(data.motorObs || '');
      setFeedingRestricted(data.feedingRestricted || '');
      setFeedingNeedsHelp(data.feedingNeedsHelp || '');
      setFeedingMixedFoods(data.feedingMixedFoods || '');
      setFeedingQuietPlace(data.feedingQuietPlace || '');
      setFeedingChallenging(data.feedingChallenging || '');
      setFeedingObs(data.feedingObs || '');
      setFamilyParticipates(data.familyParticipates || '');
      setFamilyCommunication(data.familyCommunication || '');
      setFamilySupport(data.familySupport || '');
      setFamilyCollaboration(data.familyCollaboration || '');
      setFamilyOpenness(data.familyOpenness || '');
      setFamilyObs(data.familyObs || '');

      // Seção 6
      setPedagogicalAdaptations(data.pedagogicalAdaptations || '');
      setPedagogicalDevelopment(data.pedagogicalDevelopment || '');

    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do aluno');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return studentName.trim() !== '' && studentAge.trim() !== '';
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

    const guardians = [motherName, fatherName].map((value) => value.trim()).filter(Boolean);
    const teachers = [mainTeacher, supportTeacher].map((value) => value.trim()).filter(Boolean);

    const studentData = {
      studentName, studentAge, motherName, fatherName, schoolName, schoolYear,
      className, mainTeacher, supportTeacher,
      name: studentName,
      age: studentAge,
      school_name: schoolName,
      grade: schoolYear,
      class: className,
      guardians,
      teachers,
      likesSchool, likesSchoolObs, hasFriends, friendsNames, hasFavoriteColleague,
      favoriteColleagueName, favoriteActivities, difficultTasks, expressNeeds,
      asksForHelp, opinionTeachers, opinionSchoolImportance, schoolSupports,
      satisfiedSupports, desiredSupports, specialInterests,
      participatesActivities, activitiesFacilityDifficulty, participationLevel,
      specificNeeds, receivesSupport, teacherExpectations, performanceEvaluation,
      teacherConcerns, communityPerception, teacherSchoolExpectations, studentSkills,
      aeeReason, accessibilityResources, resourcesEvaluation, classInvolvement,
      schoolOpinion,
      familyOpinion, familyInvolvement, familyAwareness, familyIdentifies,
      familyExpectations,
      socialInteracts, socialInitiates, socialParticipates, socialWaitsTurn,
      socialShares, socialObs,
      affectiveDemonstrates, affectiveReacts, affectiveSeeksSupport,
      affectiveRoutineChanges, affectiveCalmDown, affectiveObs,
      cognitiveInterest, cognitiveInstructions, cognitiveAttention, cognitiveProblems,
      cognitiveVisual, cognitiveObs,
      motorFine, motorGross, motorSelfCare, motorPhysical, motorRepetitive, motorObs,
      feedingRestricted, feedingNeedsHelp, feedingMixedFoods, feedingQuietPlace,
      feedingChallenging, feedingObs,
      familyParticipates, familyCommunication, familySupport, familyCollaboration,
      familyOpenness, familyObs,
      pedagogicalAdaptations, pedagogicalDevelopment,
      case_study_completed: source === 'estudo-de-caso'
    };

    try {
      setLoading(true);
      const url = id
        ? `${API_BASE_URL}/students/${id}`
        : `${API_BASE_URL}/students`;
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) throw new Error('Erro ao salvar aluno');

      if (source === 'estudo-de-caso') {
        const payload = await response.json();
        const savedStudentId = payload?.student?.id || id;
        await formsAPI.submitForm('cadastro_aluno', studentData, {
          source: 'estudo-de-caso',
          pre_registration_id: savedStudentId,
        });
      }

      alert(isEditMode ? 'Cadastro atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
      navigate(backPath);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const renderRadioGroup = (value, setValue, options, disabled = false) => {
    return (
      <div className="radio-group">
        {options.map(option => (
          <label key={option} className="radio-label">
            <input
              type="radio"
              value={option}
              checked={value === option}
              onChange={(e) => setValue(e.target.value)}
              disabled={disabled}
            />
            {option}
          </label>
        ))}
      </div>
    );
  };

  const renderReviewSection = () => {
    console.log('🟢 RENDERIZANDO TELA DE REVISÃO ALUNO - Step:', currentStep);
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
            <h4>1. Cadastral</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(0)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Nome do Aluno:</strong> {studentName || '(não informado)'}</p>
            <p><strong>Idade:</strong> {studentAge || '(não informado)'}</p>
            <p><strong>Nome da Mãe:</strong> {motherName || '(não informado)'}</p>
            <p><strong>Nome do Pai:</strong> {fatherName || '(não informado)'}</p>
            <p><strong>Escola:</strong> {schoolName || '(não informado)'}</p>
            <p><strong>Ano:</strong> {schoolYear || '(não informado)'}</p>
            <p><strong>Turma:</strong> {className || '(não informado)'}</p>
            <p><strong>Professor Regente 1:</strong> {mainTeacher || '(não informado)'}</p>
            <p><strong>Professor Regente 2 (Apoio):</strong> {supportTeacher || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 2 */}
        <div className="review-section">
          <div className="review-header">
            <h4>2. Informações Pessoais do Aluno</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(1)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>O Aluno gosta da escola?</strong> {likesSchool || '(não informado)'}</p>
            <p><strong>Observação:</strong> {likesSchoolObs || '(não informado)'}</p>
            <p><strong>Tem amigos?</strong> {hasFriends || '(não informado)'}</p>
            {friendsNames && <p><strong>Amigos:</strong> {friendsNames}</p>}
            <p><strong>Tem colega predileto?</strong> {hasFavoriteColleague || '(não informado)'}</p>
            {favoriteColleagueName && <p><strong>Colega predileto:</strong> {favoriteColleagueName}</p>}
            <p><strong>Atividades favoritas:</strong> {favoriteActivities || '(não informado)'}</p>
            <p><strong>Tarefas difíceis:</strong> {difficultTasks || '(não informado)'}</p>
            <p><strong>Expressa necessidades:</strong> {expressNeeds || '(não informado)'}</p>
            <p><strong>Pede ajuda:</strong> {asksForHelp || '(não informado)'}</p>
            <p><strong>Opinião sobre professores:</strong> {opinionTeachers || '(não informado)'}</p>
            <p><strong>Importância da escola:</strong> {opinionSchoolImportance || '(não informado)'}</p>
            <p><strong>Apoios disponíveis:</strong> {schoolSupports || '(não informado)'}</p>
            <p><strong>Satisfeito com apoios:</strong> {satisfiedSupports || '(não informado)'}</p>
            <p><strong>Outros apoios desejados:</strong> {desiredSupports || '(não informado)'}</p>
            <p><strong>Interesses especiais:</strong> {specialInterests || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 3 */}
        <div className="review-section">
          <div className="review-header">
            <h4>3. Informações sobre a Escola do Aluno</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(2)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Participa de atividades:</strong> {participatesActivities || '(não informado)'}</p>
            <p><strong>Atividades fáceis/difíceis:</strong> {activitiesFacilityDifficulty || '(não informado)'}</p>
            <p><strong>Nível de participação:</strong> {participationLevel || '(não informado)'}</p>
            <p><strong>Necessidades específicas:</strong> {specificNeeds || '(não informado)'}</p>
            <p><strong>Atendimentos recebidos:</strong> {receivesSupport || '(não informado)'}</p>
            <p><strong>Expectativas do aluno:</strong> {teacherExpectations || '(não informado)'}</p>
            <p><strong>Avaliação do desempenho:</strong> {performanceEvaluation || '(não informado)'}</p>
            <p><strong>Preocupações do professor:</strong> {teacherConcerns || '(não informado)'}</p>
            <p><strong>Percepção da comunidade:</strong> {communityPerception || '(não informado)'}</p>
            <p><strong>Expectativas escolares:</strong> {teacherSchoolExpectations || '(não informado)'}</p>
            <p><strong>Habilidades e potencialidades:</strong> {studentSkills || '(não informado)'}</p>
            <p><strong>Motivo do AEE:</strong> {aeeReason || '(não informado)'}</p>
            <p><strong>Recursos de acessibilidade:</strong> {accessibilityResources || '(não informado)'}</p>
            <p><strong>Avaliação dos recursos:</strong> {resourcesEvaluation || '(não informado)'}</p>
            <p><strong>Envolvimento da turma:</strong> {classInvolvement || '(não informado)'}</p>
            <p><strong>Opinião da escola:</strong> {schoolOpinion || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 4 */}
        <div className="review-section">
          <div className="review-header">
            <h4>4. Informações Familiares sobre o Aluno</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(3)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Opinião da família:</strong> {familyOpinion || '(não informado)'}</p>
            <p><strong>Envolvimento familiar:</strong> {familyInvolvement || '(não informado)'}</p>
            <p><strong>Consciência dos direitos:</strong> {familyAwareness || '(não informado)'}</p>
            <p><strong>Família identifica necessidades:</strong> {familyIdentifies || '(não informado)'}</p>
            <p><strong>Expectativas da família:</strong> {familyExpectations || '(não informado)'}</p>
          </div>
        </div>

        {/* Seção 5 */}
        <div className="review-section">
          <div className="review-header">
            <h4>5. Questionário Complementar</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(4)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <h5>Social</h5>
            <p><strong>Interage com colegas:</strong> {socialInteracts || '(não informado)'}</p>
            <p><strong>Inicia interações:</strong> {socialInitiates || '(não informado)'}</p>
            <p><strong>Participa de atividades:</strong> {socialParticipates || '(não informado)'}</p>
            <p><strong>Espera sua vez:</strong> {socialWaitsTurn || '(não informado)'}</p>
            <p><strong>Compartilha experiências:</strong> {socialShares || '(não informado)'}</p>
            {socialObs && <p><strong>Observações:</strong> {socialObs}</p>}

            <h5>Afetivo</h5>
            <p><strong>Demonstra emoções:</strong> {affectiveDemonstrates || '(não informado)'}</p>
            <p><strong>Reage a elogios:</strong> {affectiveReacts || '(não informado)'}</p>
            <p><strong>Busca apoio:</strong> {affectiveSeeksSupport || '(não informado)'}</p>
            <p><strong>Desregulação com mudanças:</strong> {affectiveRoutineChanges || '(não informado)'}</p>
            <p><strong>Consegue se acalmar:</strong> {affectiveCalmDown || '(não informado)'}</p>
            {affectiveObs && <p><strong>Observações:</strong> {affectiveObs}</p>}

            <h5>Cognitivo</h5>
            <p><strong>Interesse em aprender:</strong> {cognitiveInterest || '(não informado)'}</p>
            <p><strong>Compreende instruções:</strong> {cognitiveInstructions || '(não informado)'}</p>
            <p><strong>Mantém atenção:</strong> {cognitiveAttention || '(não informado)'}</p>
            <p><strong>Resolve problemas:</strong> {cognitiveProblems || '(não informado)'}</p>
            <p><strong>Aprende melhor com suporte visual:</strong> {cognitiveVisual || '(não informado)'}</p>
            {cognitiveObs && <p><strong>Observações:</strong> {cognitiveObs}</p>}

            <h5>Motor</h5>
            <p><strong>Coordenação motora fina:</strong> {motorFine || '(não informado)'}</p>
            <p><strong>Coordenação motora grossa:</strong> {motorGross || '(não informado)'}</p>
            <p><strong>Autocuidado:</strong> {motorSelfCare || '(não informado)'}</p>
            <p><strong>Atividades físicas:</strong> {motorPhysical || '(não informado)'}</p>
            <p><strong>Comportamentos repetitivos:</strong> {motorRepetitive || '(não informado)'}</p>
            {motorObs && <p><strong>Observações:</strong> {motorObs}</p>}

            <h5>Alimentação</h5>
            <p><strong>Repertório restrito:</strong> {feedingRestricted || '(não informado)'}</p>
            <p><strong>Necessita auxílio:</strong> {feedingNeedsHelp || '(não informado)'}</p>
            <p><strong>Incômodo com alimentos misturados:</strong> {feedingMixedFoods || '(não informado)'}</p>
            <p><strong>Prefere ambiente tranquilo:</strong> {feedingQuietPlace || '(não informado)'}</p>
            <p><strong>Comportamentos desafiadores:</strong> {feedingChallenging || '(não informado)'}</p>
            {feedingObs && <p><strong>Observações:</strong> {feedingObs}</p>}

            <h5>Familiar</h5>
            <p><strong>Família participa:</strong> {familyParticipates || '(não informado)'}</p>
            <p><strong>Comunicação frequente:</strong> {familyCommunication || '(não informado)'}</p>
            <p><strong>Suporte emocional:</strong> {familySupport || '(não informado)'}</p>
            <p><strong>Colaboração:</strong> {familyCollaboration || '(não informado)'}</p>
            <p><strong>Aberta a novas abordagens:</strong> {familyOpenness || '(não informado)'}</p>
            {familyObs && <p><strong>Observações:</strong> {familyObs}</p>}
          </div>
        </div>

        {/* Seção 6 */}
        <div className="review-section">
          <div className="review-header">
            <h4>6. Questões Pedagógicas</h4>
            {!isViewMode && (
              <button type="button" className="btn-edit-section" onClick={() => setCurrentStep(5)}>
                Editar
              </button>
            )}
          </div>
          <div className="review-content">
            <p><strong>Adaptações pedagógicas:</strong> {pedagogicalAdaptations || '(não informado)'}</p>
            <p><strong>Desenvolvimento pedagógico:</strong> {pedagogicalDevelopment || '(não informado)'}</p>
          </div>
        </div>

        <div className="review-warning">
          <p>⚠️ Após confirmar, {isEditMode ? 'as alterações serão salvas' : 'o aluno será cadastrado'}. Certifique-se de que tudo está correto.</p>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    console.log('📍 Renderizando step ALUNO:', currentStep, 'de', steps.length);
    
    // Tela de revisão (step 6 = 7ª seção)
    if (currentStep === 6) {
      return renderReviewSection();
    }



    switch (currentStep) {
      case 0: // Cadastral
        return (
          <div className="form-section">
            <h3>Seção 1 - Cadastral</h3>

            <div className="form-group">
              <label>Nome do Aluno *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                disabled={isViewMode}
                required
              />
            </div>

            <div className="form-group">
              <label>Idade do Aluno *</label>
              <input
                type="text"
                value={studentAge}
                onChange={(e) => setStudentAge(e.target.value)}
                disabled={isViewMode}
                required
              />
            </div>

            <div className="form-group">
              <label>Nome da Mãe</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Nome do Pai</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Nome da escola em que estuda</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Ano escolar do Aluno</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Turma do Aluno</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Nome do Professor Regente 1 do aluno</label>
              <input
                type="text"
                value={mainTeacher}
                onChange={(e) => setMainTeacher(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Nome do Professor Regente 2 (Apoio) do aluno</label>
              <input
                type="text"
                value={supportTeacher}
                onChange={(e) => setSupportTeacher(e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 1: // Informações Pessoais
        return (
          <div className="form-section">
            <h3>Seção 2 - Informações Pessoais do Aluno</h3>
            <p className="section-intro">
              São 16 perguntas e é muito importante que você forneça o máximo de detalhes em suas respostas!
            </p>

            <div className="form-group">
              <label>O Aluno gosta da escola?</label>
              {renderRadioGroup(likesSchool, setLikesSchool, ['Sim', 'Não'], isViewMode)}
            </div>

            <div className="form-group">
              <label>Tem alguma observação para a pergunta acima?</label>
              <textarea
                value={likesSchoolObs}
                onChange={(e) => setLikesSchoolObs(e.target.value)}
                rows="3"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O Aluno tem amigos?</label>
              {renderRadioGroup(hasFriends, setHasFriends, ['Sim', 'Não'], isViewMode)}
            </div>

            <div className="form-group">
              <label>No caso de ter amigos, quem são?</label>
              <textarea
                value={friendsNames}
                onChange={(e) => setFriendsNames(e.target.value)}
                rows="3"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O Aluno tem um colega predileto?</label>
              {renderRadioGroup(hasFavoriteColleague, setHasFavoriteColleague, ['Sim', 'Não'], isViewMode)}
            </div>

            <div className="form-group">
              <label>No caso de ter um colega predileto, quem é?</label>
              <textarea
                value={favoriteColleagueName}
                onChange={(e) => setFavoriteColleagueName(e.target.value)}
                rows="3"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais são as atividades favoritas do Aluno?</label>
              <textarea
                value={favoriteActivities}
                onChange={(e) => setFavoriteActivities(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais são as tarefas mais difíceis na opinião do Aluno? Qual é motivo para isso?</label>
              <textarea
                value={difficultTasks}
                onChange={(e) => setDifficultTasks(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O Aluno expressa suas necessidades, desejos e interesses? De qual maneira?</label>
              <textarea
                value={expressNeeds}
                onChange={(e) => setExpressNeeds(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O Aluno costuma pedir ajuda aos professores? Por quê?</label>
              <textarea
                value={asksForHelp}
                onChange={(e) => setAsksForHelp(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual é a opinião do Aluno sobre seus professores?</label>
              <textarea
                value={opinionTeachers}
                onChange={(e) => setOpinionTeachers(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual é a opinião do Aluno sobre a importância dele ir a escola e estudar?</label>
              <textarea
                value={opinionSchoolImportance}
                onChange={(e) => setOpinionSchoolImportance(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Cite quais são os apoios que o Aluno possui na escola</label>
              <textarea
                value={schoolSupports}
                onChange={(e) => setSchoolSupports(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O Aluno está satisfeito com os apoios que dispõe no momento?</label>
              <textarea
                value={satisfiedSupports}
                onChange={(e) => setSatisfiedSupports(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Desejaria ter outros? Quais?</label>
              <textarea
                value={desiredSupports}
                onChange={(e) => setDesiredSupports(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O aluno tem algum gosto especial específico (por exemplo Hiperfoco)?</label>
              <textarea
                value={specialInterests}
                onChange={(e) => setSpecialInterests(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 2: // Informações sobre a Escola
        return (
          <div className="form-section">
            <h3>Seção 3 - Informações sobre a Escola do Aluno</h3>
            <p className="section-intro">
              Precisamos entender mais sobre o ambiente escolar em que o aluno está inserido e como ele se comporta nele.
              Responda com sinceridade as 16 perguntas abaixo!
            </p>

            <div className="form-group">
              <label>O aluno participa de todas as atividades e interage em todos os espaços da escola? Quais são estes espaços? Como ele participa? Se não participa, por quê?</label>
              <textarea
                value={participatesActivities}
                onChange={(e) => setParticipatesActivities(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Das atividades propostas para a turma, quais ele realiza com facilidade e quais ele não realiza ou realiza com dificuldades? Por quê?</label>
              <textarea
                value={activitiesFacilityDifficulty}
                onChange={(e) => setActivitiesFacilityDifficulty(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é a participação do aluno nas atividades propostas à sua turma? Participa das atividades integralmente, parcialmente ou não participa?</label>
              <textarea
                value={participationLevel}
                onChange={(e) => setParticipationLevel(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais são as necessidades específicas do aluno? Quais são as barreiras impostas pelo ambiente escolar?</label>
              <textarea
                value={specificNeeds}
                onChange={(e) => setSpecificNeeds(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Que tipo de atendimento educacional e/ou clínico o aluno já recebe e quais são os profissionais envolvidos?</label>
              <textarea
                value={receivesSupport}
                onChange={(e) => setReceivesSupport(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>O que os professores pensam sobre interesses e expectativas do aluno em relação à sua formação escolar?</label>
              <textarea
                value={teacherExpectations}
                onChange={(e) => setTeacherExpectations(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual a avaliação que o professor de sala de aula faz sobre o desempenho escolar desse aluno?</label>
              <textarea
                value={performanceEvaluation}
                onChange={(e) => setPerformanceEvaluation(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais as preocupações apontadas pelo professor de sala de aula e quais os apoios que ele sugere para que o aluno atinja os objetivos educacionais traçados para sua turma?</label>
              <textarea
                value={teacherConcerns}
                onChange={(e) => setTeacherConcerns(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como a comunidade escolar percebe a interação do aluno com seus colegas de turma?</label>
              <textarea
                value={communityPerception}
                onChange={(e) => setCommunityPerception(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais as expectativas escolares do professor em relação a esse aluno?</label>
              <textarea
                value={teacherSchoolExpectations}
                onChange={(e) => setTeacherSchoolExpectations(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais são as principais habilidades e potencialidades do aluno, segundo os professores?</label>
              <textarea
                value={studentSkills}
                onChange={(e) => setStudentSkills(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual é o motivo que levou o professor de sala de aula solicitar os serviços do AEE para esse aluno?</label>
              <textarea
                value={aeeReason}
                onChange={(e) => setAeeReason(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A escola dispõe de recursos de acessibilidade para o aluno? Quais? Quais os recursos humanos e materiais de que a escola não dispõe e que são necessários para esse aluno?</label>
              <textarea
                value={accessibilityResources}
                onChange={(e) => setAccessibilityResources(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quem avaliou os recursos utilizados por esse aluno? Eles atendem às suas necessidades?</label>
              <textarea
                value={resourcesEvaluation}
                onChange={(e) => setResourcesEvaluation(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Como é o envolvimento afetivo, social da turma com o aluno? Detalhe</label>
              <textarea
                value={classInvolvement}
                onChange={(e) => setClassInvolvement(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Qual é a opinião da escola (equipe pedagógica, diretor, professores, colegas de turma) sobre seu desenvolvimento escolar?</label>
              <textarea
                value={schoolOpinion}
                onChange={(e) => setSchoolOpinion(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 3: // Informações Familiares
        return (
          <div className="form-section">
            <h3>Seção 4 - Informações Familiares sobre o Aluno</h3>
            <p className="section-intro">
              As 5 perguntas abaixo nos ajudarão a entender ainda mais sobre as necessidades do aluno!
            </p>

            <div className="form-group">
              <label>Qual é a opinião da família sobre a vida escolar do aluno?</label>
              <textarea
                value={familyOpinion}
                onChange={(e) => setFamilyOpinion(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A família se envolve com a escola? Participa de reuniões, de comemorações entre outras atividades da escola?</label>
              <textarea
                value={familyInvolvement}
                onChange={(e) => setFamilyInvolvement(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Tem consciência dos direitos de seu filho à educação inclusiva? Exige a garantia de seus direitos?</label>
              <textarea
                value={familyAwareness}
                onChange={(e) => setFamilyAwareness(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>A família identifica habilidades, necessidades e dificuldades na vida pessoal e escolar do aluno? Quais?</label>
              <textarea
                value={familyIdentifies}
                onChange={(e) => setFamilyIdentifies(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Quais as expectativas da família com relação ao desenvolvimento e escolarização de seu filho?</label>
              <textarea
                value={familyExpectations}
                onChange={(e) => setFamilyExpectations(e.target.value)}
                rows="4"
                disabled={isViewMode}
              />
            </div>
          </div>
        );

      case 4: // Questionário Complementar
        return (
          <div className="form-section">
            <h3>Seção 5 - Questionário Complementar</h3>
            <p className="section-intro">
              Responda uma série de perguntas que abordam 6 categorias: Social, Afetivo, Cognitivo, Motor, Alimentação e Familiar.
            </p>

            {/* Social */}
            <div className="questionnaire-category">
              <h4>Social</h4>

              <div className="form-group">
                <label>O aluno interage com colegas durante atividades em grupo sem mediação constante?</label>
                {renderRadioGroup(socialInteracts, setSocialInteracts, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Ele consegue iniciar interações sociais espontaneamente?</label>
                {renderRadioGroup(socialInitiates, setSocialInitiates, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Participa de atividades sociais propostas pela escola quando há estímulos adequados?</label>
                {renderRadioGroup(socialParticipates, setSocialParticipates, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Consegue esperar sua vez e reagir adequadamente a frustrações em jogos ou atividades sociais?</label>
                {renderRadioGroup(socialWaitsTurn, setSocialWaitsTurn, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Demonstra interesse em compartilhar experiências ou prefere interações mais limitadas?</label>
                {renderRadioGroup(socialShares, setSocialShares, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área SOCIAL, insira abaixo.</label>
                <textarea
                  value={socialObs}
                  onChange={(e) => setSocialObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Afetivo */}
            <div className="questionnaire-category">
              <h4>Afetivo</h4>

              <div className="form-group">
                <label>O aluno demonstra emoções básicas, como alegria ou frustração, de forma clara?</label>
                {renderRadioGroup(affectiveDemonstrates, setAffectiveDemonstrates, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Reage positivamente a elogios e estímulos motivacionais?</label>
                {renderRadioGroup(affectiveReacts, setAffectiveReacts, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Busca apoio emocional quando enfrenta dificuldades?</label>
                {renderRadioGroup(affectiveSeeksSupport, setAffectiveSeeksSupport, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Fica desregulado emocionalmente com mudanças na rotina escolar?</label>
                {renderRadioGroup(affectiveRoutineChanges, setAffectiveRoutineChanges, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Consegue se acalmar sozinho ou com ajuda mínima após momentos de desregulação?</label>
                {renderRadioGroup(affectiveCalmDown, setAffectiveCalmDown, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área AFETIVA, insira abaixo.</label>
                <textarea
                  value={affectiveObs}
                  onChange={(e) => setAffectiveObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Cognitivo */}
            <div className="questionnaire-category">
              <h4>Cognitivo</h4>

              <div className="form-group">
                <label>O aluno demonstra interesse em aprender coisas novas ou explorar áreas de interesse específico?</label>
                {renderRadioGroup(cognitiveInterest, setCognitiveInterest, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Consegue compreender e seguir instruções simples sem mediação constante?</label>
                {renderRadioGroup(cognitiveInstructions, setCognitiveInstructions, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Mantém a atenção nas atividades propostas por períodos adequados à sua idade?</label>
                {renderRadioGroup(cognitiveAttention, setCognitiveAttention, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Resolve problemas simples de forma independente ou com suporte mínimo?</label>
                {renderRadioGroup(cognitiveProblems, setCognitiveProblems, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Aprende melhor com suporte visual do que com instruções apenas verbais?</label>
                {renderRadioGroup(cognitiveVisual, setCognitiveVisual, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área COGNITIVA, insira abaixo.</label>
                <textarea
                  value={cognitiveObs}
                  onChange={(e) => setCognitiveObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Motor */}
            <div className="questionnaire-category">
              <h4>Motor</h4>

              <div className="form-group">
                <label>O aluno apresenta coordenação motora fina suficiente para segurar lápis ou manipular objetos pequenos?</label>
                {renderRadioGroup(motorFine, setMotorFine, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Demonstra coordenação motora grossa para correr, pular ou subir escadas?</label>
                {renderRadioGroup(motorGross, setMotorGross, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Realiza tarefas de autocuidado, como vestir-se ou abrir lancheiras, de forma independente?</label>
                {renderRadioGroup(motorSelfCare, setMotorSelfCare, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Participa de atividades físicas ou recreativas sem sinais de cansaço excessivo?</label>
                {renderRadioGroup(motorPhysical, setMotorPhysical, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Apresenta comportamentos motores repetitivos ou resistência a novos desafios motores?</label>
                {renderRadioGroup(motorRepetitive, setMotorRepetitive, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área MOTORA, insira abaixo.</label>
                <textarea
                  value={motorObs}
                  onChange={(e) => setMotorObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Alimentação */}
            <div className="questionnaire-category">
              <h4>Alimentação</h4>

              <div className="form-group">
                <label>O aluno possui um repertório alimentar muito restrito na escola (ex: aceita menos de 10 alimentos diferentes)?</label>
                {renderRadioGroup(feedingRestricted, setFeedingRestricted, ['Sim', 'Não', 'Não se alimenta na escola'], isViewMode)}
              </div>

              <div className="form-group">
                <label>O aluno necessita de auxílio físico direto de um adulto para se alimentar (ex: para usar talheres, cortar a comida)?</label>
                {renderRadioGroup(feedingNeedsHelp, setFeedingNeedsHelp, ['Sim', 'Não', 'Não se alimenta na escola'], isViewMode)}
              </div>

              <div className="form-group">
                <label>O aluno demonstra forte incômodo ou recusa em comer se diferentes alimentos se tocarem no mesmo prato?</label>
                {renderRadioGroup(feedingMixedFoods, setFeedingMixedFoods, ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'], isViewMode)}
              </div>

              <div className="form-group">
                <label>O aluno se alimenta de forma visivelmente mais tranquila em um ambiente com menos barulho e pessoas do que no refeitório principal?</label>
                {renderRadioGroup(feedingQuietPlace, setFeedingQuietPlace, ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'], isViewMode)}
              </div>

              <div className="form-group">
                <label>O aluno apresenta comportamentos desafiadores (ex: choro intenso, agitação, recusa em permanecer sentado) de forma recorrente durante as refeições na escola?</label>
                {renderRadioGroup(feedingChallenging, setFeedingChallenging, ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área de ALIMENTAÇÃO, insira abaixo.</label>
                <textarea
                  value={feedingObs}
                  onChange={(e) => setFeedingObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Familiar */}
            <div className="questionnaire-category">
              <h4>Familiar</h4>

              <div className="form-group">
                <label>A família participa de reuniões e eventos relacionados ao desenvolvimento do aluno?</label>
                {renderRadioGroup(familyParticipates, setFamilyParticipates, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Existe comunicação frequente entre a família e a escola para alinhar estratégias pedagógicas?</label>
                {renderRadioGroup(familyCommunication, setFamilyCommunication, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>A família oferece suporte emocional consistente e incentiva a autonomia do aluno?</label>
                {renderRadioGroup(familySupport, setFamilySupport, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Há colaboração familiar no uso de recursos terapêuticos ou adaptações sugeridas?</label>
                {renderRadioGroup(familyCollaboration, setFamilyCollaboration, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>A família está aberta a novas abordagens ou sugestões para apoiar o aluno?</label>
                {renderRadioGroup(familyOpenness, setFamilyOpenness, ['Sim', 'Não'], isViewMode)}
              </div>

              <div className="form-group">
                <label>Caso tenha algo de relevante sobre a área FAMILIAR, insira abaixo.</label>
                <textarea
                  value={familyObs}
                  onChange={(e) => setFamilyObs(e.target.value)}
                  rows="3"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>
        );

      case 5: // Questões Pedagógicas
        return (
          <div className="form-section">
            <h3>Seção 6 - Questões Pedagógicas</h3>

            <div className="form-group">
              <label>Relate como são as adaptações pedagógicas realizadas com o aluno</label>
              <textarea
                value={pedagogicalAdaptations}
                onChange={(e) => setPedagogicalAdaptations(e.target.value)}
                rows="6"
                disabled={isViewMode}
              />
            </div>

            <div className="form-group">
              <label>Relate como é o desenvolvimento pedagógico do aluno em suas competências e habilidades</label>
              <textarea
                value={pedagogicalDevelopment}
                onChange={(e) => setPedagogicalDevelopment(e.target.value)}
                rows="6"
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
          {isViewMode ? 'Visualizar' : isEditMode ? 'Editar' : 'Novo'} Cadastro de Aluno
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
          
          {currentStep < 6 ? (
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
                {loading ? 'Salvando...' : isEditMode ? 'Atualizar Cadastro' : 'Cadastrar Aluno'}
              </button>
            )
          )}
          
          {isViewMode && currentStep < 6 && (
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

export default StudentFormNew;
