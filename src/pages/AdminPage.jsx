import React, { useEffect, useMemo, useState } from 'react';
import { authAPI, municipalityAPI, schoolAPI, studentAPI, teacherAPI } from '../services/api';
import './AdminPage.css';

const ROLES = [
  'admin',
  'secretaria',
  'coordenacao',
  'professor',
  'viewer',
  'avaliador',
];

const REQUIRES_MUNICIPIO = new Set(['secretaria', 'coordenacao', 'professor']);
const REQUIRES_SCHOOL = new Set(['coordenacao', 'professor']);

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingRelations, setLoadingRelations] = useState(true);

  const [savingUser, setSavingUser] = useState(false);
  const [savingMunicipality, setSavingMunicipality] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingMunicipalityId, setDeletingMunicipalityId] = useState('');
  const [deletingSchoolId, setDeletingSchoolId] = useState('');
  const [deletingTeacherId, setDeletingTeacherId] = useState('');
  const [deletingStudentId, setDeletingStudentId] = useState('');
  const [savingEvaluatorScopeUserId, setSavingEvaluatorScopeUserId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('secretaria');
  const [newMunicipioId, setNewMunicipioId] = useState('');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newEvaluatorMunicipioIds, setNewEvaluatorMunicipioIds] = useState([]);
  const [editingEvaluatorScopes, setEditingEvaluatorScopes] = useState({});

  const [newMunicipalityName, setNewMunicipalityName] = useState('');
  const [newMunicipalityId, setNewMunicipalityId] = useState('');

  // Estados de edição inline de Escola
  const [editingSchoolId, setEditingSchoolId] = useState('');
  const [editingSchoolMunicipioId, setEditingSchoolMunicipioId] = useState('');
  const [savingSchoolId, setSavingSchoolId] = useState('');

  // Estados de edição inline de Professor
  const [editingTeacherIdState, setEditingTeacherIdState] = useState('');
  const [editingTeacherSchoolId, setEditingTeacherSchoolId] = useState('');
  const [editingTeacherStudentIds, setEditingTeacherStudentIds] = useState([]);
  const [savingTeacherIdState, setSavingTeacherIdState] = useState('');

  // Estados de edição inline de Aluno
  const [editingStudentIdState, setEditingStudentIdState] = useState('');
  const [editingStudentMunicipioId, setEditingStudentMunicipioId] = useState('');
  const [editingStudentSchoolId, setEditingStudentSchoolId] = useState('');
  const [editingStudentTeacherIds, setEditingStudentTeacherIds] = useState([]);
  const [savingStudentIdState, setSavingStudentIdState] = useState('');

  // Estados de edição inline de Usuário
  const [editingUserIdState, setEditingUserIdState] = useState('');
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserRole, setEditingUserRole] = useState('');
  const [editingUserMunicipioId, setEditingUserMunicipioId] = useState('');
  const [editingUserSchoolId, setEditingUserSchoolId] = useState('');
  const [editingUserTeacherId, setEditingUserTeacherId] = useState('');
  const [editingUserPassword, setEditingUserPassword] = useState('');
  const [savingUserIdState, setSavingUserIdState] = useState('');

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await authAPI.listUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar usuários';
      setError(message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAudit = async () => {
    try {
      setLoadingAudit(true);
      const events = await authAPI.getAuditEvents(100);
      setAuditEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar auditoria';
      setError(message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadMunicipalities = async () => {
    try {
      setLoadingMunicipalities(true);
      const data = await municipalityAPI.getAllMunicipalities();
      setMunicipalities(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar municípios';
      setError(message);
    } finally {
      setLoadingMunicipalities(false);
    }
  };

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const data = await schoolAPI.getAllSchools();
      setAllSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar escolas';
      setError(message);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadPreRegistrationData = async () => {
    try {
      setLoadingRelations(true);
      const [teachersData, studentsData] = await Promise.all([
        teacherAPI.getAllTeachers(),
        studentAPI.getAllStudents(),
      ]);

      setAllTeachers(Array.isArray(teachersData) ? teachersData : []);
      setAllStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar vínculos de pré-cadastro';
      setError(message);
    } finally {
      setLoadingRelations(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAudit();
    loadMunicipalities();
    loadSchools();
    loadPreRegistrationData();
  }, []);

  const municipalityNameById = useMemo(() => {
    const map = new Map();
    municipalities.forEach((item) => {
      map.set(item.id, item.name || item.id);
    });
    return map;
  }, [municipalities]);

  const schoolById = useMemo(() => {
    const map = new Map();
    allSchools.forEach((school) => {
      map.set(school.id, school);
    });
    return map;
  }, [allSchools]);

  const teacherById = useMemo(() => {
    const map = new Map();
    allTeachers.forEach((teacher) => {
      map.set(teacher.id, teacher);
    });
    return map;
  }, [allTeachers]);

  const selectedMunicipalitySchools = useMemo(() => {
    return allSchools.filter((school) => String(school.municipio_id || '').trim() === newMunicipioId.trim());
  }, [allSchools, newMunicipioId]);

  const teachersInSelectedSchool = useMemo(() => {
    return allTeachers.filter((teacher) => String(teacher.school_id || '').trim() === newSchoolId.trim());
  }, [allTeachers, newSchoolId]);

  const studentsByTeacherId = useMemo(() => {
    const map = new Map();

    allStudents.forEach((student) => {
      const rawTeacherIds = Array.isArray(student.teacher_ids) ? student.teacher_ids : [];
      const legacyTeacherId = String(student.teacher_id || '').trim();
      const teacherIds = rawTeacherIds
        .map((value) => String(value || '').trim())
        .filter(Boolean);

      if (legacyTeacherId && !teacherIds.includes(legacyTeacherId)) {
        teacherIds.push(legacyTeacherId);
      }

      teacherIds.forEach((teacherId) => {
        const currentList = map.get(teacherId) || [];
        currentList.push(student);
        map.set(teacherId, currentList);
      });
    });

    return map;
  }, [allStudents]);

  const evaluatorSummary = (scope) => {
    const normalized = {
      municipio_ids: Array.isArray(scope?.municipio_ids) ? scope.municipio_ids : [],
    };

    if (normalized.municipio_ids.length === 0) {
      return 'Sem municípios autorizados';
    }

    return `Municípios autorizados: ${normalized.municipio_ids.length}`;
  };

  const getSelectedValues = (event) => {
    return Array.from(event.target.selectedOptions || []).map((option) => String(option.value || '').trim()).filter(Boolean);
  };

  const schoolRows = useMemo(() => {
    return allSchools.map((school) => ({
      id: school.id,
      name: school.name || '-',
      municipioId: school.municipio_id || '-',
      municipioName: municipalityNameById.get(school.municipio_id) || school.municipio_id || '-',
    }));
  }, [allSchools, municipalityNameById]);

  const teacherRows = useMemo(() => {
    return allTeachers.map((teacher) => {
      const school = schoolById.get(teacher.school_id || '');
      const linkedStudents = studentsByTeacherId.get(teacher.id) || [];

      return {
        id: teacher.id,
        name: teacher.name || '-',
        schoolId: teacher.school_id || '',
        schoolName: school?.name || teacher.school_name || '-',
        municipioName: municipalityNameById.get(school?.municipio_id || '') || school?.municipio_id || '-',
        students: linkedStudents.map((student) => student.name || student.studentName || '-'),
        studentIds: linkedStudents.map((student) => student.id),
      };
    });
  }, [allTeachers, schoolById, studentsByTeacherId, municipalityNameById]);

  const studentRows = useMemo(() => {
    return allStudents.map((student) => {
      const school = schoolById.get(student.school_id || '');
      const rawTeacherIds = Array.isArray(student.teacher_ids) ? student.teacher_ids : [];
      const legacyTeacherId = String(student.teacher_id || '').trim();
      const teacherIds = rawTeacherIds
        .map((value) => String(value || '').trim())
        .filter(Boolean);

      if (legacyTeacherId && !teacherIds.includes(legacyTeacherId)) {
        teacherIds.push(legacyTeacherId);
      }

      const teacherNames = teacherIds
        .map((teacherId) => teacherById.get(teacherId)?.name)
        .filter(Boolean);

      return {
        id: student.id,
        name: student.name || student.studentName || '-',
        schoolId: student.school_id || '',
        schoolName: school?.name || student.school_name || '-',
        municipioName: municipalityNameById.get(school?.municipio_id || '') || school?.municipio_id || '-',
        teacherNames,
        teacherIds,
        originalStudent: student,
      };
    });
  }, [allStudents, schoolById, teacherById, municipalityNameById]);

  // Handlers para edição inline de Escolas
  const handleStartEditSchool = (school) => {
    setEditingSchoolId(school.id);
    setEditingSchoolMunicipioId(school.municipioId || '');
  };

  const handleCancelEditSchool = () => {
    setEditingSchoolId('');
    setEditingSchoolMunicipioId('');
  };

  const handleSaveSchool = async (schoolId, schoolName) => {
    setError('');
    setSuccess('');
    try {
      setSavingSchoolId(schoolId);
      await schoolAPI.updateSchool(schoolId, {
        name: schoolName,
        municipio_id: editingSchoolMunicipioId,
      });
      setSuccess('Escola atualizada com sucesso');
      handleCancelEditSchool();
      await Promise.all([loadSchools(), loadPreRegistrationData()]);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar escola';
      setError(message);
    } finally {
      setSavingSchoolId('');
    }
  };

  // Handlers para edição inline de Professores
  const handleStartEditTeacher = (row) => {
    setEditingTeacherIdState(row.id);
    setEditingTeacherSchoolId(row.schoolId || '');
    setEditingTeacherStudentIds(row.studentIds || []);
  };

  const handleCancelEditTeacher = () => {
    setEditingTeacherIdState('');
    setEditingTeacherSchoolId('');
    setEditingTeacherStudentIds([]);
  };

  const handleSaveTeacher = async (teacherId, teacherName) => {
    setError('');
    setSuccess('');
    if (!editingTeacherSchoolId) {
      setError('Escolha uma escola para o professor');
      return;
    }
    try {
      setSavingTeacherIdState(teacherId);

      const original = allTeachers.find(t => t.id === teacherId) || {};

      await teacherAPI.updateTeacher(teacherId, {
        ...original,
        name: teacherName,
        school_id: editingTeacherSchoolId,
        student_ids: editingTeacherStudentIds,
      });
      setSuccess('Professor atualizado com sucesso');
      handleCancelEditTeacher();
      await Promise.all([loadPreRegistrationData()]);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar professor';
      setError(message);
    } finally {
      setSavingTeacherIdState('');
    }
  };

  const handleToggleTeacherStudent = (studentId) => {
    setEditingTeacherStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Handlers para edição inline de Alunos
  const handleStartEditStudent = (row) => {
    setEditingStudentIdState(row.id);
    setEditingStudentMunicipioId(row.originalStudent?.school_id ? (schoolById.get(row.originalStudent.school_id)?.municipio_id || '') : '');
    setEditingStudentSchoolId(row.schoolId || '');
    setEditingStudentTeacherIds(row.teacherIds || []);
  };

  const handleCancelEditStudent = () => {
    setEditingStudentIdState('');
    setEditingStudentMunicipioId('');
    setEditingStudentSchoolId('');
    setEditingStudentTeacherIds([]);
  };

  const handleSaveStudent = async (studentId, originalStudent) => {
    setError('');
    setSuccess('');
    if (!editingStudentSchoolId) {
      setError('Escolha uma escola para o aluno');
      return;
    }
    if (editingStudentTeacherIds.length === 0) {
      setError('Selecione ao menos um professor para o aluno');
      return;
    }
    try {
      setSavingStudentIdState(studentId);
      await studentAPI.updateStudent(studentId, {
        ...originalStudent,
        school_id: editingStudentSchoolId,
        teacher_ids: editingStudentTeacherIds,
      });
      setSuccess('Aluno atualizado com sucesso');
      handleCancelEditStudent();
      await loadPreRegistrationData();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar aluno';
      setError(message);
    } finally {
      setSavingStudentIdState('');
    }
  };

  const handleToggleStudentTeacher = (teacherId) => {
    setEditingStudentTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  // Handlers para edição inline de Usuários
  const handleStartEditUser = (user) => {
    setEditingUserIdState(user.id);
    setEditingUserName(user.name || '');
    setEditingUserRole(user.role || '');
    setEditingUserMunicipioId(user.municipio_id || '');
    setEditingUserSchoolId(user.school_id || '');
    setEditingUserTeacherId(user.teacher_id || '');
    setEditingUserPassword('');
  };

  const handleCancelEditUser = () => {
    setEditingUserIdState('');
    setEditingUserName('');
    setEditingUserRole('');
    setEditingUserMunicipioId('');
    setEditingUserSchoolId('');
    setEditingUserTeacherId('');
    setEditingUserPassword('');
  };

  const handleSaveUser = async (userId, username) => {
    setError('');
    setSuccess('');

    if (REQUIRES_MUNICIPIO.has(editingUserRole) && !editingUserMunicipioId) {
      setError('Informe o município para este perfil');
      return;
    }

    if (REQUIRES_SCHOOL.has(editingUserRole) && !editingUserSchoolId) {
      setError('Informe a escola para este perfil');
      return;
    }

    try {
      setSavingUserIdState(userId);
      await authAPI.updateUser(userId, {
        name: editingUserName,
        role: editingUserRole,
        municipio_id: editingUserMunicipioId || '',
        school_id: editingUserSchoolId || '',
        teacher_id: editingUserTeacherId || '',
      });
      if (editingUserPassword.trim()) {
        await authAPI.changePassword(userId, editingUserPassword.trim());
      }
      setSuccess('Usuário atualizado com sucesso');
      handleCancelEditUser();
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar usuário';
      setError(message);
    } finally {
      setSavingUserIdState('');
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Informe usuário e senha para criar o novo acesso');
      return;
    }

    if (REQUIRES_SCHOOL.has(newRole) && !newMunicipioId.trim()) {
      setError('Selecione o município antes de escolher a escola');
      return;
    }

    if (REQUIRES_MUNICIPIO.has(newRole) && !newMunicipioId.trim()) {
      setError('Para este perfil, informe o município');
      return;
    }

    if (REQUIRES_SCHOOL.has(newRole) && !newSchoolId.trim()) {
      setError('Para coordenação e professor, informe a escola');
      return;
    }

    if (REQUIRES_SCHOOL.has(newRole)) {
      const selectedSchool = allSchools.find((school) => school.id === newSchoolId.trim());
      if (!selectedSchool) {
        setError('Selecione uma escola válida');
        return;
      }

      if (String(selectedSchool.municipio_id || '').trim() !== newMunicipioId.trim()) {
        setError('A escola selecionada não pertence ao município escolhido');
        return;
      }
    }

    if (newRole === 'viewer' && !newMunicipioId.trim() && !newSchoolId.trim()) {
      setError('Para perfil viewer, informe município ou escola');
      return;
    }

    if (newRole === 'avaliador') {
      if (newEvaluatorMunicipioIds.length === 0) {
        setError('Avaliador exige ao menos um município no escopo');
        return;
      }
    }

    try {
      setSavingUser(true);
      await authAPI.createUser({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        municipio_id: newMunicipioId.trim(),
        school_id: newSchoolId.trim(),
        teacher_id: newTeacherId.trim(),
        evaluator_scope: {
          municipio_ids: newEvaluatorMunicipioIds,
        },
      });

      setSuccess('Usuário criado com sucesso');
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('secretaria');
      setNewMunicipioId('');
      setNewSchoolId('');
      setNewTeacherId('');
      setNewEvaluatorMunicipioIds([]);
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao criar usuário';
      setError(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setError('');
    setSuccess('');
    try {
      await authAPI.updateUserRole(userId, role);
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, role } : user)));
      setSuccess('Perfil atualizado com sucesso');
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar perfil';
      setError(message);
    }
  };

  const handleStartEditEvaluatorScope = (user) => {
    const scope = user?.evaluator_scope || {};
    const normalized = {
      municipio_ids: Array.isArray(scope.municipio_ids) ? scope.municipio_ids : [],
    };

    setEditingEvaluatorScopes((prev) => ({
      ...prev,
      [user.id]: normalized,
    }));
  };

  const handleCancelEditEvaluatorScope = (userId) => {
    setEditingEvaluatorScopes((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleChangeEvaluatorScopeField = (userId, field, value) => {
    setEditingEvaluatorScopes((prev) => {
      const current = prev[userId] || {
        municipio_ids: [],
      };
      return {
        ...prev,
        [userId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveEvaluatorScope = async (userId) => {
    const nextScope = editingEvaluatorScopes[userId];
    if (!nextScope) return;

    if ((nextScope.municipio_ids || []).length === 0) {
      setError('Avaliador exige ao menos um município no escopo');
      return;
    }

    setError('');
    setSuccess('');
    try {
      setSavingEvaluatorScopeUserId(userId);
      await authAPI.updateEvaluatorScope(userId, nextScope);
      setSuccess('Escopo do avaliador atualizado com sucesso');
      await loadUsers();
      handleCancelEditEvaluatorScope(userId);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar escopo do avaliador';
      setError(message);
    } finally {
      setSavingEvaluatorScopeUserId('');
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Deseja apagar o usuário "${user.username}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      setDeletingUserId(user.id);
      await authAPI.deleteUser(user.id);
      setSuccess('Usuário apagado com sucesso');
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao apagar usuário';
      setError(message);
    } finally {
      setDeletingUserId('');
    }
  };

  const handleCreateMunicipality = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newMunicipalityName.trim()) {
      setError('Informe o nome do município');
      return;
    }

    try {
      setSavingMunicipality(true);
      await municipalityAPI.createMunicipality({
        name: newMunicipalityName.trim(),
        id: newMunicipalityId.trim() || undefined,
      });

      setNewMunicipalityName('');
      setNewMunicipalityId('');
      setSuccess('Município criado com sucesso');
      await loadMunicipalities();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao criar município';
      setError(message);
    } finally {
      setSavingMunicipality(false);
    }
  };

  const handleDeleteMunicipality = async (municipioId) => {
    if (!municipioId) return;
    if (!window.confirm('Confirma apagar o município selecionado? Esta ação removerá o município do banco.')) return;
    try {
      setDeletingMunicipalityId(municipioId);
      await municipalityAPI.deleteMunicipality(municipioId);
      await Promise.all([loadMunicipalities(), loadSchools(), loadPreRegistrationData()]);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erro ao apagar município';
      alert(msg);
    } finally {
      setDeletingMunicipalityId('');
    }
  };

  const handleDeleteSchool = async (schoolId, schoolName) => {
    if (!schoolId) return;
    const confirmed = window.confirm(`Deseja apagar a escola "${schoolName || schoolId}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      setDeletingSchoolId(schoolId);
      await schoolAPI.deleteSchool(schoolId);
      setSuccess('Escola apagada com sucesso');
      await Promise.all([loadSchools(), loadPreRegistrationData()]);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao apagar escola';
      setError(message);
    } finally {
      setDeletingSchoolId('');
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!teacherId) return;
    const confirmed = window.confirm(`Deseja apagar o professor "${teacherName || teacherId}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      setDeletingTeacherId(teacherId);
      await teacherAPI.deleteTeacher(teacherId);
      setSuccess('Professor apagado com sucesso');
      await loadPreRegistrationData();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao apagar professor';
      setError(message);
    } finally {
      setDeletingTeacherId('');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!studentId) return;
    const confirmed = window.confirm(`Deseja apagar o aluno "${studentName || studentId}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      setDeletingStudentId(studentId);
      await studentAPI.deleteStudent(studentId);
      setSuccess('Aluno apagado com sucesso');
      await loadPreRegistrationData();
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao apagar aluno';
      setError(message);
    } finally {
      setDeletingStudentId('');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administração</h1>
        <p>Gerencie usuários e acompanhe a trilha de auditoria da aplicação.</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">
        <section className="admin-card admin-card-create-user">
          <h2>Criar novo usuário</h2>
          <form className="admin-form" onSubmit={handleCreateUser}>
            <label htmlFor="new-username">Usuário</label>
            <input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              disabled={savingUser}
              autoComplete="username"
            />

            <label htmlFor="new-password">Senha</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={savingUser}
              autoComplete="new-password"
            />

            <label htmlFor="new-name">Nome exibido (opcional)</label>
            <input
              id="new-name"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              disabled={savingUser}
            />

            <label htmlFor="new-role">Perfil</label>
            <select
              id="new-role"
              value={newRole}
              onChange={(event) => {
                const nextRole = event.target.value;
                setNewRole(nextRole);
                setNewMunicipioId('');
                setNewSchoolId('');
                setNewTeacherId('');
                setNewEvaluatorMunicipioIds([]);
              }}
              disabled={savingUser}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {(REQUIRES_MUNICIPIO.has(newRole) || newRole === 'viewer') && (
              <>
                <label htmlFor="new-municipio">Município (municipio_id)</label>
                <select
                  id="new-municipio"
                  value={newMunicipioId}
                  onChange={(event) => {
                    setNewMunicipioId(event.target.value);
                    setNewSchoolId('');
                  }}
                  disabled={savingUser || loadingMunicipalities}
                >
                  <option value="">{loadingMunicipalities ? 'Carregando municípios...' : 'Selecione um município'}</option>
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name} ({municipality.id})
                    </option>
                  ))}
                </select>
              </>
            )}

            {REQUIRES_SCHOOL.has(newRole) && (
              <>
                <label htmlFor="new-school">Escola (school_id)</label>
                <select
                  id="new-school"
                  value={newSchoolId}
                  onChange={(event) => setNewSchoolId(event.target.value)}
                  disabled={savingUser || loadingSchools || !newMunicipioId.trim()}
                >
                  <option value="">{loadingSchools ? 'Carregando escolas...' : 'Selecione uma escola'}</option>
                  {selectedMunicipalitySchools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} ({school.id})
                    </option>
                  ))}
                </select>
                {!newMunicipioId.trim() && <small>Escolha o município antes de selecionar a escola.</small>}
              </>
            )}

            {newRole === 'professor' && (
              <>
                <label htmlFor="new-teacher">Professor</label>
                <select
                  id="new-teacher"
                  value={newTeacherId}
                  onChange={(event) => setNewTeacherId(event.target.value)}
                  disabled={savingUser || loadingSchools || !newSchoolId.trim()}
                >
                  <option value="">{loadingSchools ? 'Carregando professores...' : 'Selecione um professor (opcional)'}</option>
                  {teachersInSelectedSchool.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.id})
                    </option>
                  ))}
                </select>
                {!newSchoolId.trim() && <small>Escolha a escola antes de selecionar o professor.</small>}
              </>
            )}

            {newRole === 'avaliador' && (
              <>
                <label htmlFor="new-evaluator-municipios">Municípios autorizados</label>
                <select
                  id="new-evaluator-municipios"
                  multiple
                  value={newEvaluatorMunicipioIds}
                  onChange={(event) => setNewEvaluatorMunicipioIds(getSelectedValues(event))}
                  disabled={savingUser || loadingMunicipalities}
                >
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name} ({municipality.id})
                    </option>
                  ))}
                </select>
              </>
            )}

            <button type="submit" disabled={savingUser}>
              {savingUser ? 'Salvando...' : 'Criar usuário'}
            </button>
          </form>
        </section>

        <section className="admin-card admin-card-municipalities">
          <div className="admin-card-header">
            <h2>Municípios</h2>
            <button type="button" className="admin-refresh-btn" onClick={loadMunicipalities}>
              Atualizar
            </button>
          </div>

          <form className="admin-form" onSubmit={handleCreateMunicipality}>
            <label htmlFor="new-municipality-name">Nome do município</label>
            <input
              id="new-municipality-name"
              type="text"
              value={newMunicipalityName}
              onChange={(event) => setNewMunicipalityName(event.target.value)}
              disabled={savingMunicipality}
            />

            <label htmlFor="new-municipality-id">Slug (opcional)</label>
            <input
              id="new-municipality-id"
              type="text"
              value={newMunicipalityId}
              onChange={(event) => setNewMunicipalityId(event.target.value)}
              disabled={savingMunicipality}
              placeholder="Ex.: sao-paulo"
            />

            <button type="submit" disabled={savingMunicipality}>
              {savingMunicipality ? 'Salvando...' : 'Criar município'}
            </button>
          </form>

          {loadingMunicipalities ? (
            <p>Carregando municípios...</p>
          ) : municipalities.length === 0 ? (
            <p>Nenhum município cadastrado.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>municipio_id</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {municipalities.map((municipality) => (
                    <tr key={municipality.id}>
                      <td>{municipality.name}</td>
                      <td>{municipality.id}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          disabled={deletingMunicipalityId === municipality.id}
                          onClick={() => handleDeleteMunicipality(municipality.id)}
                        >
                          {deletingMunicipalityId === municipality.id ? 'Apagando...' : 'Apagar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card admin-card-relations">
          <div className="admin-card-header">
            <h2>Relações de Pré-cadastro</h2>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={async () => {
                await Promise.all([loadSchools(), loadPreRegistrationData()]);
              }}
            >
              Atualizar
            </button>
          </div>

          {loadingRelations ? (
            <p>Carregando relações...</p>
          ) : (
            <div className="admin-relations-content">
              <div className="admin-relations-section">
                <h3>Escolas por Município</h3>
                {schoolRows.length === 0 ? (
                  <p>Nenhuma escola cadastrada.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Escola</th>
                          <th>Município</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>
                              {editingSchoolId === row.id ? (
                                <select
                                  value={editingSchoolMunicipioId}
                                  onChange={(e) => setEditingSchoolMunicipioId(e.target.value)}
                                  disabled={savingSchoolId === row.id}
                                >
                                  <option value="">Selecione um município</option>
                                  {municipalities.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.id})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                `${row.municipioName} (${row.municipioId})`
                              )}
                            </td>
                            <td>
                              {editingSchoolId === row.id ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="admin-save-small-btn"
                                    onClick={() => handleSaveSchool(row.id, row.name)}
                                    disabled={savingSchoolId === row.id}
                                  >
                                    {savingSchoolId === row.id ? 'Salvando...' : 'Salvar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-cancel-small-btn"
                                    onClick={handleCancelEditSchool}
                                    disabled={savingSchoolId === row.id}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="admin-edit-small-btn"
                                    onClick={() => handleStartEditSchool(row)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-delete-small-btn"
                                    disabled={deletingSchoolId === row.id}
                                    onClick={() => handleDeleteSchool(row.id, row.name)}
                                  >
                                    {deletingSchoolId === row.id ? 'Apagando...' : 'Apagar'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="admin-relations-section">
                <h3>Professores por Escola/Município</h3>
                {teacherRows.length === 0 ? (
                  <p>Nenhum professor cadastrado.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Professor</th>
                          <th>Escola</th>
                          <th>Município</th>
                          <th>Alunos</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherRows.map((row) => {
                          const selectedSchool = allSchools.find(s => s.id === editingTeacherSchoolId);
                          const selectedSchoolMunicipioName = selectedSchool ? (municipalityNameById.get(selectedSchool.municipio_id) || selectedSchool.municipio_id) : '-';
                          const availableStudentsForSchool = allStudents.filter(s => s.school_id === editingTeacherSchoolId);

                          return (
                            <tr key={row.id}>
                              <td>{row.name}</td>
                              <td>
                                {editingTeacherIdState === row.id ? (
                                  <select
                                    value={editingTeacherSchoolId}
                                    onChange={(e) => {
                                      setEditingTeacherSchoolId(e.target.value);
                                      setEditingTeacherStudentIds([]);
                                    }}
                                    disabled={savingTeacherIdState === row.id}
                                  >
                                    <option value="">Selecione uma escola</option>
                                    {allSchools.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.id})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  row.schoolName
                                )}
                              </td>
                              <td>
                                {editingTeacherIdState === row.id ? (
                                  selectedSchoolMunicipioName
                                ) : (
                                  row.municipioName
                                )}
                              </td>
                              <td>
                                {editingTeacherIdState === row.id ? (
                                  <div className="admin-checkbox-list">
                                    {availableStudentsForSchool.length === 0 ? (
                                      <small style={{ color: '#888' }}>Nenhum aluno cadastrado nesta escola</small>
                                    ) : (
                                      availableStudentsForSchool.map(student => (
                                        <label key={student.id} className="admin-checkbox-item">
                                          <input
                                            type="checkbox"
                                            checked={editingTeacherStudentIds.includes(student.id)}
                                            onChange={() => handleToggleTeacherStudent(student.id)}
                                            disabled={savingTeacherIdState === row.id}
                                          />
                                          {student.name || student.studentName}
                                        </label>
                                      ))
                                    )}
                                  </div>
                                ) : (
                                  row.students.length ? row.students.join(', ') : '-'
                                )}
                              </td>
                              <td>
                                {editingTeacherIdState === row.id ? (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="admin-save-small-btn"
                                      onClick={() => handleSaveTeacher(row.id, row.name)}
                                      disabled={savingTeacherIdState === row.id}
                                    >
                                      {savingTeacherIdState === row.id ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-cancel-small-btn"
                                      onClick={handleCancelEditTeacher}
                                      disabled={savingTeacherIdState === row.id}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="admin-edit-small-btn"
                                      onClick={() => handleStartEditTeacher(row)}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-delete-small-btn"
                                      disabled={deletingTeacherId === row.id}
                                      onClick={() => handleDeleteTeacher(row.id, row.name)}
                                    >
                                      {deletingTeacherId === row.id ? 'Apagando...' : 'Apagar'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="admin-relations-section">
                <h3>Alunos por Município/Escola/Professor</h3>
                {studentRows.length === 0 ? (
                  <p>Nenhum aluno cadastrado.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Aluno</th>
                          <th>Município</th>
                          <th>Escola</th>
                          <th>Professor(es)</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentRows.map((row) => {
                          const filteredSchools = allSchools.filter(s => s.municipio_id === editingStudentMunicipioId);
                          const filteredTeachers = allTeachers.filter(t => t.school_id === editingStudentSchoolId);

                          return (
                            <tr key={row.id}>
                              <td>{row.name}</td>
                              <td>
                                {editingStudentIdState === row.id ? (
                                  <select
                                    value={editingStudentMunicipioId}
                                    onChange={(e) => {
                                      setEditingStudentMunicipioId(e.target.value);
                                      setEditingStudentSchoolId('');
                                      setEditingStudentTeacherIds([]);
                                    }}
                                    disabled={savingStudentIdState === row.id}
                                  >
                                    <option value="">Selecione um município</option>
                                    {municipalities.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({m.id})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  row.municipioName
                                )}
                              </td>
                              <td>
                                {editingStudentIdState === row.id ? (
                                  <select
                                    value={editingStudentSchoolId}
                                    onChange={(e) => {
                                      setEditingStudentSchoolId(e.target.value);
                                      setEditingStudentTeacherIds([]);
                                    }}
                                    disabled={savingStudentIdState === row.id || !editingStudentMunicipioId}
                                  >
                                    <option value="">Selecione uma escola</option>
                                    {filteredSchools.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.id})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  row.schoolName
                                )}
                              </td>
                              <td>
                                {editingStudentIdState === row.id ? (
                                  <div className="admin-checkbox-list">
                                    {filteredTeachers.length === 0 ? (
                                      <small style={{ color: '#888' }}>Nenhum professor nesta escola</small>
                                    ) : (
                                      filteredTeachers.map(teacher => (
                                        <label key={teacher.id} className="admin-checkbox-item">
                                          <input
                                            type="checkbox"
                                            checked={editingStudentTeacherIds.includes(teacher.id)}
                                            onChange={() => handleToggleStudentTeacher(teacher.id)}
                                            disabled={savingStudentIdState === row.id}
                                          />
                                          {teacher.name}
                                        </label>
                                      ))
                                    )}
                                  </div>
                                ) : (
                                  row.teacherNames.length ? row.teacherNames.join(', ') : '-'
                                )}
                              </td>
                              <td>
                                {editingStudentIdState === row.id ? (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="admin-save-small-btn"
                                      onClick={() => handleSaveStudent(row.id, row.originalStudent)}
                                      disabled={savingStudentIdState === row.id}
                                    >
                                      {savingStudentIdState === row.id ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-cancel-small-btn"
                                      onClick={handleCancelEditStudent}
                                      disabled={savingStudentIdState === row.id}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="admin-edit-small-btn"
                                      onClick={() => handleStartEditStudent(row)}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-delete-small-btn"
                                      disabled={deletingStudentId === row.id}
                                      onClick={() => handleDeleteStudent(row.id, row.name)}
                                    >
                                      {deletingStudentId === row.id ? 'Apagando...' : 'Apagar'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="admin-card admin-card-users">
          <div className="admin-card-header">
            <h2>Usuários cadastrados</h2>
            <button type="button" className="admin-refresh-btn" onClick={loadUsers}>
              Atualizar
            </button>
          </div>

          {loadingUsers ? (
            <p>Carregando usuários...</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Nome</th>
                    <th>Perfil</th>
                    <th>Escopo</th>
                    <th>Senha</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const filteredSchools = allSchools.filter((s) => s.municipio_id === editingUserMunicipioId);
                    const filteredTeachers = allTeachers.filter((t) => t.school_id === editingUserSchoolId);

                    return (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>
                          {editingUserIdState === user.id ? (
                            <input
                              type="text"
                              value={editingUserName}
                              onChange={(e) => setEditingUserName(e.target.value)}
                              disabled={savingUserIdState === user.id}
                              style={{ width: '100%', maxWidth: '180px' }}
                            />
                          ) : (
                            user.name || '-'
                          )}
                        </td>
                        <td>
                          {editingUserIdState === user.id ? (
                            <select
                              value={editingUserRole}
                              onChange={(e) => {
                                setEditingUserRole(e.target.value);
                                setEditingUserMunicipioId('');
                                setEditingUserSchoolId('');
                                setEditingUserTeacherId('');
                              }}
                              disabled={savingUserIdState === user.id}
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            user.role
                          )}
                        </td>
                        <td>
                          {editingUserIdState === user.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(REQUIRES_MUNICIPIO.has(editingUserRole) || editingUserRole === 'viewer') && (
                                <select
                                  value={editingUserMunicipioId}
                                  onChange={(e) => {
                                    setEditingUserMunicipioId(e.target.value);
                                    setEditingUserSchoolId('');
                                    setEditingUserTeacherId('');
                                  }}
                                  disabled={savingUserIdState === user.id}
                                >
                                  <option value="">Selecione o município</option>
                                  {municipalities.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.id})
                                    </option>
                                  ))}
                                </select>
                              )}

                              {(REQUIRES_SCHOOL.has(editingUserRole) || editingUserRole === 'viewer') && (
                                <select
                                  value={editingUserSchoolId}
                                  onChange={(e) => {
                                    setEditingUserSchoolId(e.target.value);
                                    setEditingUserTeacherId('');
                                  }}
                                  disabled={savingUserIdState === user.id || !editingUserMunicipioId}
                                >
                                  <option value="">Selecione a escola</option>
                                  {filteredSchools.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.id})
                                    </option>
                                  ))}
                                </select>
                              )}

                              {editingUserRole === 'professor' && (
                                <select
                                  value={editingUserTeacherId}
                                  onChange={(e) => setEditingUserTeacherId(e.target.value)}
                                  disabled={savingUserIdState === user.id || !editingUserSchoolId}
                                >
                                  <option value="">Selecione o professor (opcional)</option>
                                  {filteredTeachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name} ({t.id})
                                    </option>
                                  ))}
                                </select>
                              )}

                              {!REQUIRES_MUNICIPIO.has(editingUserRole) &&
                                !REQUIRES_SCHOOL.has(editingUserRole) &&
                                editingUserRole !== 'viewer' &&
                                editingUserRole !== 'avaliador' && (
                                  <span>-</span>
                                )}

                              {editingUserRole === 'avaliador' && (
                                <span>Edição de escopo do avaliador disponível após salvar.</span>
                              )}
                            </div>
                          ) : (
                            <>
                              {user.role !== 'avaliador' && (
                                <>
                                  {user.municipio_id ? `Município: ${municipalityNameById.get(user.municipio_id) || user.municipio_id}` : ''}
                                  {user.school_id ? `${user.municipio_id ? ' | ' : ''}Escola: ${schoolById.get(user.school_id)?.name || user.school_id}` : ''}
                                  {user.teacher_id ? `${user.municipio_id || user.school_id ? ' | ' : ''}Professor: ${teacherById.get(user.teacher_id)?.name || user.teacher_id}` : ''}
                                  {!user.municipio_id && !user.school_id && !user.teacher_id ? '-' : ''}
                                </>
                              )}

                              {user.role === 'avaliador' && (
                                <div>
                                  <div>{evaluatorSummary(user.evaluator_scope || {})}</div>

                                  {!editingEvaluatorScopes[user.id] ? (
                                    <button
                                      type="button"
                                      className="admin-refresh-btn"
                                      onClick={() => handleStartEditEvaluatorScope(user)}
                                    >
                                      Editar escopo
                                    </button>
                                  ) : (
                                    <div className="admin-form" style={{ marginTop: '8px' }}>
                                      <label htmlFor={`scope-municipios-${user.id}`}>Municípios</label>
                                      <select
                                        id={`scope-municipios-${user.id}`}
                                        multiple
                                        value={editingEvaluatorScopes[user.id].municipio_ids}
                                        onChange={(event) => handleChangeEvaluatorScopeField(user.id, 'municipio_ids', getSelectedValues(event))}
                                        disabled={savingEvaluatorScopeUserId === user.id}
                                      >
                                        {municipalities.map((municipality) => (
                                          <option key={municipality.id} value={municipality.id}>
                                            {municipality.name} ({municipality.id})
                                          </option>
                                        ))}
                                      </select>

                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEvaluatorScope(user.id)}
                                          disabled={savingEvaluatorScopeUserId === user.id}
                                        >
                                          {savingEvaluatorScopeUserId === user.id ? 'Salvando...' : 'Salvar'}
                                        </button>
                                        <button
                                          type="button"
                                          className="admin-refresh-btn"
                                          onClick={() => handleCancelEditEvaluatorScope(user.id)}
                                          disabled={savingEvaluatorScopeUserId === user.id}
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td>
                          {editingUserIdState === user.id ? (
                            <input
                              type="password"
                              value={editingUserPassword}
                              onChange={(e) => setEditingUserPassword(e.target.value)}
                              placeholder="Nova senha (opcional)"
                              disabled={savingUserIdState === user.id}
                              style={{ width: '100%', maxWidth: '180px' }}
                              autoComplete="new-password"
                            />
                          ) : (
                            <span style={{ color: '#aaa', letterSpacing: '2px' }}>••••••</span>
                          )}
                        </td>
                        <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                        <td>
                          {editingUserIdState === user.id ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="admin-save-small-btn"
                                onClick={() => handleSaveUser(user.id, user.username)}
                                disabled={savingUserIdState === user.id}
                              >
                                {savingUserIdState === user.id ? 'Salvando...' : 'Salvar'}
                              </button>
                              <button
                                type="button"
                                className="admin-cancel-small-btn"
                                onClick={handleCancelEditUser}
                                disabled={savingUserIdState === user.id}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="admin-edit-small-btn"
                                onClick={() => handleStartEditUser(user)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="admin-delete-btn"
                                disabled={deletingUserId === user.id}
                                onClick={() => handleDeleteUser(user)}
                              >
                                {deletingUserId === user.id ? 'Apagando...' : 'Apagar'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="admin-card admin-audit-card">
        <div className="admin-card-header">
          <h2>Últimos eventos de auditoria</h2>
          <button type="button" className="admin-refresh-btn" onClick={loadAudit}>
            Atualizar
          </button>
        </div>

        {loadingAudit ? (
          <p>Carregando auditoria...</p>
        ) : auditEvents.length === 0 ? (
          <p>Nenhum evento encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                  <th>Usuário</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event, index) => (
                  <tr key={`${event.timestamp}-${index}`}>
                    <td>{new Date(event.timestamp).toLocaleString('pt-BR')}</td>
                    <td>{event.action}</td>
                    <td>{event?.user?.username || '-'}</td>
                    <td>{event.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
