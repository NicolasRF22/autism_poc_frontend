import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './PDIForm.css'; // Reusing PDI form styles
import { API_BASE_URL } from '../services/api';

const StudentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view');
  const isEditMode = location.pathname.includes('/edit');
  const isCreateMode = !id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Section 1: Cadastral
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [teacher1, setTeacher1] = useState('');
  const [teacher2, setTeacher2] = useState('');

  // Section 2: Personal Information (16 questions)
  const [likesSchool, setLikesSchool] = useState('');
  const [likesSchoolObs, setLikesSchoolObs] = useState('');
  const [hasFriends, setHasFriends] = useState('');
  const [whoAreFriends, setWhoAreFriends] = useState('');
  const [hasFavoriteColleague, setHasFavoriteColleague] = useState('');
  const [whoIsFavorite, setWhoIsFavorite] = useState('');
  const [favoriteActivities, setFavoriteActivities] = useState('');
  const [difficultTasks, setDifficultTasks] = useState('');
  const [expressesNeeds, setExpressesNeeds] = useState('');
  const [asksForHelp, setAsksForHelp] = useState('');
  const [opinionTeachers, setOpinionTeachers] = useState('');
  const [opinionSchool, setOpinionSchool] = useState('');
  const [schoolSupports, setSchoolSupports] = useState('');
  const [satisfiedSupports, setSatisfiedSupports] = useState('');
  const [desiredSupports, setDesiredSupports] = useState('');
  const [specialInterests, setSpecialInterests] = useState('');

  // Section 3: School Information (16 questions)
  const [participatesActivities, setParticipatesActivities] = useState('');
  const [activitiesDifficulty, setActivitiesDifficulty] = useState('');
  const [participationLevel, setParticipationLevel] = useState('');
  const [specificNeeds, setSpecificNeeds] = useState('');
  const [currentTreatments, setCurrentTreatments] = useState('');
  const [teacherExpectations, setTeacherExpectations] = useState('');
  const [performanceAssessment, setPerformanceAssessment] = useState('');
  const [teacherConcerns, setTeacherConcerns] = useState('');
  const [peerInteraction, setPeerInteraction] = useState('');
  const [schoolExpectations, setSchoolExpectations] = useState('');
  const [studentStrengths, setStudentStrengths] = useState('');
  const [aeeReason, setAeeReason] = useState('');
  const [accessibilityResources, setAccessibilityResources] = useState('');
  const [resourceEvaluation, setResourceEvaluation] = useState('');
  const [classAffection, setClassAffection] = useState('');
  const [schoolOpinion, setSchoolOpinion] = useState('');

  // Section 4: Family Information (5 questions)
  const [familyOpinion, setFamilyOpinion] = useState('');
  const [familyInvolvement, setFamilyInvolvement] = useState('');
  const [rightsAwareness, setRightsAwareness] = useState('');
  const [familyIdentifies, setFamilyIdentifies] = useState('');
  const [familyExpectations, setFamilyExpectations] = useState('');

  // Section 5: Complementary Questionnaire (36 questions with Yes/No)
  const [questionnaire, setQuestionnaire] = useState({
    social: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    },
    affective: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    },
    cognitive: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    },
    motor: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    },
    feeding: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    },
    family: {
      q1: '', q2: '', q3: '', q4: '', q5: '',
      obs: ''
    }
  });

  // Section 6: Pedagogical Questions (2 questions)
  const [pedagogicalAdaptations, setPedagogicalAdaptations] = useState('');
  const [pedagogicalDevelopment, setPedagogicalDevelopment] = useState('');

  const steps = [
    'Cadastral',
    'Informações Pessoais',
    'Informações Escolares',
    'Informações Familiares',
    'Questionário Complementar',
    'Questões Pedagógicas'
  ];

  useEffect(() => {
    if (id && !isCreateMode) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students/${id}`);
      if (!response.ok) throw new Error('Erro ao carregar aluno');
      const data = await response.json();
      
      // Section 1
      setName(data.name || '');
      setAge(data.age || '');
      setMotherName(data.motherName || '');
      setFatherName(data.fatherName || '');
      setSchoolName(data.schoolName || '');
      setGrade(data.grade || '');
      setClassName(data.class || '');
      setTeacher1(data.teacher1 || '');
      setTeacher2(data.teacher2 || '');
      
      // Section 2
      setLikesSchool(data.likesSchool || '');
      setLikesSchoolObs(data.likesSchoolObs || '');
      setHasFriends(data.hasFriends || '');
      setWhoAreFriends(data.whoAreFriends || '');
      setHasFavoriteColleague(data.hasFavoriteColleague || '');
      setWhoIsFavorite(data.whoIsFavorite || '');
      setFavoriteActivities(data.favoriteActivities || '');
      setDifficultTasks(data.difficultTasks || '');
      setExpressesNeeds(data.expressesNeeds || '');
      setAsksForHelp(data.asksForHelp || '');
      setOpinionTeachers(data.opinionTeachers || '');
      setOpinionSchool(data.opinionSchool || '');
      setSchoolSupports(data.schoolSupports || '');
      setSatisfiedSupports(data.satisfiedSupports || '');
      setDesiredSupports(data.desiredSupports || '');
      setSpecialInterests(data.specialInterests || '');
      
      // Section 3
      setParticipatesActivities(data.participatesActivities || '');
      setActivitiesDifficulty(data.activitiesDifficulty || '');
      setParticipationLevel(data.participationLevel || '');
      setSpecificNeeds(data.specificNeeds || '');
      setCurrentTreatments(data.currentTreatments || '');
      setTeacherExpectations(data.teacherExpectations || '');
      setPerformanceAssessment(data.performanceAssessment || '');
      setTeacherConcerns(data.teacherConcerns || '');
      setPeerInteraction(data.peerInteraction || '');
      setSchoolExpectations(data.schoolExpectations || '');
      setStudentStrengths(data.studentStrengths || '');
      setAeeReason(data.aeeReason || '');
      setAccessibilityResources(data.accessibilityResources || '');
      setResourceEvaluation(data.resourceEvaluation || '');
      setClassAffection(data.classAffection || '');
      setSchoolOpinion(data.schoolOpinion || '');
      
      // Section 4
      setFamilyOpinion(data.familyOpinion || '');
      setFamilyInvolvement(data.familyInvolvement || '');
      setRightsAwareness(data.rightsAwareness || '');
      setFamilyIdentifies(data.familyIdentifies || '');
      setFamilyExpectations(data.familyExpectations || '');
      
      // Section 5
      if (data.questionnaire) {
        setQuestionnaire(data.questionnaire);
      }
      
      // Section 6
      setPedagogicalAdaptations(data.pedagogicalAdaptations || '');
      setPedagogicalDevelopment(data.pedagogicalDevelopment || '');
      
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do aluno');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionnaire = (category, field, value) => {
    if (isViewMode) return;
    setQuestionnaire(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return name.trim() !== '' && age.trim() !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
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

    const studentData = {
      // Section 1
      name, age, motherName, fatherName, schoolName, grade, class: className, teacher1, teacher2,
      // Section 2
      likesSchool, likesSchoolObs, hasFriends, whoAreFriends, hasFavoriteColleague, whoIsFavorite,
      favoriteActivities, difficultTasks, expressesNeeds, asksForHelp, opinionTeachers, opinionSchool,
      schoolSupports, satisfiedSupports, desiredSupports, specialInterests,
      // Section 3
      participatesActivities, activitiesDifficulty, participationLevel, specificNeeds, currentTreatments,
      teacherExpectations, performanceAssessment, teacherConcerns, peerInteraction, schoolExpectations,
      studentStrengths, aeeReason, accessibilityResources, resourceEvaluation, classAffection, schoolOpinion,
      // Section 4
      familyOpinion, familyInvolvement, rightsAwareness, familyIdentifies, familyExpectations,
      // Section 5
      questionnaire,
      // Section 6
      pedagogicalAdaptations, pedagogicalDevelopment,
    };

    try {
      setLoading(true);
      const url = isEditMode 
        ? `${API_BASE_URL}/students/${id}`
        : `${API_BASE_URL}/students`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) throw new Error('Erro ao salvar aluno');

      alert(isEditMode ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
      navigate('/students');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const renderRadioGroup = (category, questionNum, label, options = ['Sim', 'Não']) => {
    const value = questionnaire[category][`q${questionNum}`];
    return (
      <div className="form-group">
        <label>{label}</label>
        <div className="radio-group">
          {options.map(option => (
            <label key={option} className="radio-label">
              <input
                type="radio"
                value={option}
                checked={value === option}
                onChange={(e) => updateQuestionnaire(category, `q${questionNum}`, e.target.value)}
                disabled={isViewMode}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Cadastral
        return (
          <div className="form-section">
            <h3>Seção 1 - Cadastral</h3>
            
            <div className="form-group">
              <label>Nome do Aluno *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isViewMode} required />
            </div>

            <div className="form-group">
              <label>Idade do Aluno *</label>
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} disabled={isViewMode} required />
            </div>

            <div className="form-group">
              <label>Nome da Mãe</label>
              <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Nome do Pai</label>
              <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Nome da escola em que estuda</label>
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Ano escolar do Aluno</label>
              <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Turma do Aluno</label>
              <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Nome do Professor Regente 1</label>
              <input type="text" value={teacher1} onChange={(e) => setTeacher1(e.target.value)} disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Nome do Professor Regente 2 (Apoio)</label>
              <input type="text" value={teacher2} onChange={(e) => setTeacher2(e.target.value)} disabled={isViewMode} />
            </div>
          </div>
        );

      case 1: // Personal Information
        return (
          <div className="form-section">
            <h3>Seção 2 - Informações pessoais do Aluno</h3>
            <p className="section-description">São 16 perguntas. É muito importante que você forneça o máximo de detalhes em suas respostas!</p>
            
            <div className="form-group">
              <label>O Aluno gosta da escola?</label>
              <textarea value={likesSchool} onChange={(e) => setLikesSchool(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Tem alguma observação para a pergunta acima?</label>
              <textarea value={likesSchoolObs} onChange={(e) => setLikesSchoolObs(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O Aluno tem amigos?</label>
              <textarea value={hasFriends} onChange={(e) => setHasFriends(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>No caso de ter amigos, quem são?</label>
              <textarea value={whoAreFriends} onChange={(e) => setWhoAreFriends(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O Aluno tem um colega predileto?</label>
              <textarea value={hasFavoriteColleague} onChange={(e) => setHasFavoriteColleague(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>No caso de ter um colega predileto, quem é?</label>
              <textarea value={whoIsFavorite} onChange={(e) => setWhoIsFavorite(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais são as atividades favoritas do Aluno?</label>
              <textarea value={favoriteActivities} onChange={(e) => setFavoriteActivities(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais são as tarefas mais difíceis na opinião do Aluno? Qual é motivo para isso?</label>
              <textarea value={difficultTasks} onChange={(e) => setDifficultTasks(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O Aluno expressa suas necessidades, desejos e interesses? De qual maneira?</label>
              <textarea value={expressesNeeds} onChange={(e) => setExpressesNeeds(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O Aluno costuma pedir ajuda aos professores? Por quê?</label>
              <textarea value={asksForHelp} onChange={(e) => setAsksForHelp(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Qual é a opinião do Aluno sobre seus professores?</label>
              <textarea value={opinionTeachers} onChange={(e) => setOpinionTeachers(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Qual é a opinião do Aluno sobre a importância dele ir a escola e estudar?</label>
              <textarea value={opinionSchool} onChange={(e) => setOpinionSchool(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Cite quais são os apoios que o Aluno possui na escola</label>
              <textarea value={schoolSupports} onChange={(e) => setSchoolSupports(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O Aluno está satisfeito com os apoios que dispõe no momento?</label>
              <textarea value={satisfiedSupports} onChange={(e) => setSatisfiedSupports(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Desejaria ter outros? Quais?</label>
              <textarea value={desiredSupports} onChange={(e) => setDesiredSupports(e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O aluno tem algum gosto especial específico (por exemplo Hiperfoco)?</label>
              <textarea value={specialInterests} onChange={(e) => setSpecialInterests(e.target.value)} rows="3" disabled={isViewMode} />
            </div>
          </div>
        );

      case 2: // School Information
        return (
          <div className="form-section">
            <h3>Seção 3 - Informações sobre a escola do Aluno</h3>
            <p className="section-description">Responda com sinceridade as 16 perguntas abaixo!</p>
            
            <div className="form-group">
              <label>O aluno participa de todas as atividades e interage em todos os espaços da escola? Quais são estes espaços? Como ele participa? Se não participa, por quê?</label>
              <textarea value={participatesActivities} onChange={(e) => setParticipatesActivities(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Das atividades propostas para a turma, quais ele realiza com facilidade e quais ele não realiza ou realiza com dificuldades? Por quê?</label>
              <textarea value={activitiesDifficulty} onChange={(e) => setActivitiesDifficulty(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Como é a participação do aluno nas atividades propostas à sua turma? Participa das atividades integralmente, parcialmente ou não participa?</label>
              <textarea value={participationLevel} onChange={(e) => setParticipationLevel(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais são as necessidades específicas do aluno? Quais são as barreiras impostas pelo ambiente escolar?</label>
              <textarea value={specificNeeds} onChange={(e) => setSpecificNeeds(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Que tipo de atendimento educacional e/ou clínico o aluno já recebe e quais são os profissionais envolvidos?</label>
              <textarea value={currentTreatments} onChange={(e) => setCurrentTreatments(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>O que os professores pensam sobre interesses e expectativas do aluno em relação à sua formação escolar?</label>
              <textarea value={teacherExpectations} onChange={(e) => setTeacherExpectations(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Qual a avaliação que o professor de sala de aula faz sobre o desempenho escolar desse aluno?</label>
              <textarea value={performanceAssessment} onChange={(e) => setPerformanceAssessment(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais as preocupações apontadas pelo professor de sala de aula e quais os apoios que ele sugere para que o aluno atinja os objetivos educacionais traçados para sua turma?</label>
              <textarea value={teacherConcerns} onChange={(e) => setTeacherConcerns(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Como a comunidade escolar percebe a interação do aluno com seus colegas de turma?</label>
              <textarea value={peerInteraction} onChange={(e) => setPeerInteraction(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais as expectativas escolares do professor em relação a esse aluno?</label>
              <textarea value={schoolExpectations} onChange={(e) => setSchoolExpectations(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais são as principais habilidades e potencialidades do aluno, segundo os professores?</label>
              <textarea value={studentStrengths} onChange={(e) => setStudentStrengths(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Qual é o motivo que levou o professor de sala de aula solicitar os serviços do AEE para esse aluno?</label>
              <textarea value={aeeReason} onChange={(e) => setAeeReason(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>A escola dispõe de recursos de acessibilidade para o aluno? Quais? Quais os recursos humanos e materiais de que a escola não dispõe e que são necessários para esse aluno?</label>
              <textarea value={accessibilityResources} onChange={(e) => setAccessibilityResources(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quem avaliou os recursos utilizados por esse aluno? Eles atendem às suas necessidades?</label>
              <textarea value={resourceEvaluation} onChange={(e) => setResourceEvaluation(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Como é o envolvimento afetivo, social da turma com o aluno? Detalhe</label>
              <textarea value={classAffection} onChange={(e) => setClassAffection(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Qual é a opinião da escola (equipe pedagógica, diretor, professores, colegas de turma) sobre seu desenvolvimento escolar?</label>
              <textarea value={schoolOpinion} onChange={(e) => setSchoolOpinion(e.target.value)} rows="4" disabled={isViewMode} />
            </div>
          </div>
        );

      case 3: // Family Information
        return (
          <div className="form-section">
            <h3>Seção 4 - Informações familiares sobre o Aluno</h3>
            
            <div className="form-group">
              <label>Qual é a opinião da família sobre a vida escolar do aluno?</label>
              <textarea value={familyOpinion} onChange={(e) => setFamilyOpinion(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>A família se envolve com a escola? Participa de reuniões, de comemorações entre outras atividades da escola?</label>
              <textarea value={familyInvolvement} onChange={(e) => setFamilyInvolvement(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Tem consciência dos direitos de seu filho à educação inclusiva? Exige a garantia de seus direitos?</label>
              <textarea value={rightsAwareness} onChange={(e) => setRightsAwareness(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>A família identifica habilidades, necessidades e dificuldades na vida pessoal e escolar do aluno? Quais?</label>
              <textarea value={familyIdentifies} onChange={(e) => setFamilyIdentifies(e.target.value)} rows="4" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Quais as expectativas da família com relação ao desenvolvimento e escolarização de seu filho?</label>
              <textarea value={familyExpectations} onChange={(e) => setFamilyExpectations(e.target.value)} rows="4" disabled={isViewMode} />
            </div>
          </div>
        );

      case 4: // Complementary Questionnaire
        return (
          <div className="form-section">
            <h3>Seção 5 - Questionário Complementar</h3>
            <p className="section-description">Perguntas que abordam 6 categorias: Social, Afetivo, Cognitivo, Motor, Alimentação e Familiar</p>
            
            {/* Social */}
            <h4>Social</h4>
            {renderRadioGroup('social', 1, 'O aluno interage com colegas durante atividades em grupo sem mediação constante?')}
            {renderRadioGroup('social', 2, 'Ele consegue iniciar interações sociais espontaneamente?')}
            {renderRadioGroup('social', 3, 'Participa de atividades sociais propostas pela escola quando há estímulos adequados?')}
            {renderRadioGroup('social', 4, 'Consegue esperar sua vez e reagir adequadamente a frustrações em jogos ou atividades sociais?')}
            {renderRadioGroup('social', 5, 'Demonstra interesse em compartilhar experiências ou prefere interações mais limitadas?')}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área SOCIAL, insira abaixo</label>
              <textarea value={questionnaire.social.obs} onChange={(e) => updateQuestionnaire('social', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            {/* Affective */}
            <h4>Afetivo</h4>
            {renderRadioGroup('affective', 1, 'O aluno demonstra emoções básicas, como alegria ou frustração, de forma clara?')}
            {renderRadioGroup('affective', 2, 'Reage positivamente a elogios e estímulos motivacionais?')}
            {renderRadioGroup('affective', 3, 'Busca apoio emocional quando enfrenta dificuldades?')}
            {renderRadioGroup('affective', 4, 'Fica desregulado emocionalmente com mudanças na rotina escolar?')}
            {renderRadioGroup('affective', 5, 'Consegue se acalmar sozinho ou com ajuda mínima após momentos de desregulação?')}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área AFETIVA, insira abaixo</label>
              <textarea value={questionnaire.affective.obs} onChange={(e) => updateQuestionnaire('affective', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            {/* Cognitive */}
            <h4>Cognitivo</h4>
            {renderRadioGroup('cognitive', 1, 'O aluno demonstra interesse em aprender coisas novas ou explorar áreas de interesse específico?')}
            {renderRadioGroup('cognitive', 2, 'Consegue compreender e seguir instruções simples sem mediação constante?')}
            {renderRadioGroup('cognitive', 3, 'Mantém a atenção nas atividades propostas por períodos adequados à sua idade?')}
            {renderRadioGroup('cognitive', 4, 'Resolve problemas simples de forma independente ou com suporte mínimo?')}
            {renderRadioGroup('cognitive', 5, 'Aprende melhor com suporte visual do que com instruções apenas verbais?')}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área COGNITIVA, insira abaixo</label>
              <textarea value={questionnaire.cognitive.obs} onChange={(e) => updateQuestionnaire('cognitive', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            {/* Motor */}
            <h4>Motor</h4>
            {renderRadioGroup('motor', 1, 'O aluno apresenta coordenação motora fina suficiente para segurar lápis ou manipular objetos pequenos?')}
            {renderRadioGroup('motor', 2, 'Demonstra coordenação motora grossa para correr, pular ou subir escadas?')}
            {renderRadioGroup('motor', 3, 'Realiza tarefas de autocuidado, como vestir-se ou abrir lancheiras, de forma independente?')}
            {renderRadioGroup('motor', 4, 'Participa de atividades físicas ou recreativas sem sinais de cansaço excessivo?')}
            {renderRadioGroup('motor', 5, 'Apresenta comportamentos motores repetitivos ou resistência a novos desafios motores?')}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área MOTORA, insira abaixo</label>
              <textarea value={questionnaire.motor.obs} onChange={(e) => updateQuestionnaire('motor', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            {/* Feeding */}
            <h4>Alimentação</h4>
            {renderRadioGroup('feeding', 1, 'O aluno possui um repertório alimentar muito restrito na escola (ex: aceita menos de 10 alimentos diferentes)?', ['Sim', 'Não', 'Não se alimenta na escola'])}
            {renderRadioGroup('feeding', 2, 'O aluno necessita de auxílio físico direto de um adulto para se alimentar (ex: para usar talheres, cortar a comida)?', ['Sim', 'Não', 'Não se alimenta na escola'])}
            {renderRadioGroup('feeding', 3, 'O aluno demonstra forte incômodo ou recusa em comer se diferentes alimentos se tocarem no mesmo prato?', ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'])}
            {renderRadioGroup('feeding', 4, 'O aluno se alimenta de forma visivelmente mais tranquila em um ambiente com menos barulho e pessoas do que no refeitório principal?', ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'])}
            {renderRadioGroup('feeding', 5, 'O aluno apresenta comportamentos desafiadores (ex: choro intenso, agitação, recusa em permanecer sentado) de forma recorrente durante as refeições na escola?', ['Sim', 'Não', 'Não se alimenta na escola', 'Não se aplica'])}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área de ALIMENTAÇÃO, insira abaixo</label>
              <textarea value={questionnaire.feeding.obs} onChange={(e) => updateQuestionnaire('feeding', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>

            {/* Family */}
            <h4>Familiar</h4>
            {renderRadioGroup('family', 1, 'A família participa de reuniões e eventos relacionados ao desenvolvimento do aluno?')}
            {renderRadioGroup('family', 2, 'Existe comunicação frequente entre a família e a escola para alinhar estratégias pedagógicas?')}
            {renderRadioGroup('family', 3, 'A família oferece suporte emocional consistente e incentiva a autonomia do aluno?')}
            {renderRadioGroup('family', 4, 'Há colaboração familiar no uso de recursos terapêuticos ou adaptações sugeridas?')}
            {renderRadioGroup('family', 5, 'A família está aberta a novas abordagens ou sugestões para apoiar o aluno?')}
            <div className="form-group">
              <label>Caso tenha algo de relevante sobre a área FAMILIAR, insira abaixo</label>
              <textarea value={questionnaire.family.obs} onChange={(e) => updateQuestionnaire('family', 'obs', e.target.value)} rows="3" disabled={isViewMode} />
            </div>
          </div>
        );

      case 5: // Pedagogical Questions
        return (
          <div className="form-section">
            <h3>Seção 6 - Questões Pedagógicas</h3>
            
            <div className="form-group">
              <label>Relate como são as adaptações pedagógicas realizadas com o aluno</label>
              <textarea value={pedagogicalAdaptations} onChange={(e) => setPedagogicalAdaptations(e.target.value)} rows="5" disabled={isViewMode} />
            </div>

            <div className="form-group">
              <label>Relate como é o desenvolvimento pedagógico do aluno em suas competências e habilidades</label>
              <textarea value={pedagogicalDevelopment} onChange={(e) => setPedagogicalDevelopment(e.target.value)} rows="5" disabled={isViewMode} />
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
        <button className="btn-secondary" onClick={() => navigate('/students')}>
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
        {renderStep()}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={isViewMode}
            >
              Próximo
            </button>
          ) : (
            !isViewMode && (
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : isEditMode ? 'Atualizar Aluno' : 'Cadastrar Aluno'}
              </button>
            )
          )}
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
