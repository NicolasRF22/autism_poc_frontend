import React, { useEffect, useMemo, useState } from 'react';
import { authAPI, municipalityAPI, schoolAPI, studentAPI, teacherAPI } from '../services/api';
import './AdminPage.css';

const ROLES = [
  'admin',
  'secretaria',
  'coordenacao',
  'professor',
  'viewer',
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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('secretaria');
  const [newMunicipioId, setNewMunicipioId] = useState('');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');

  const [newMunicipalityName, setNewMunicipalityName] = useState('');
  const [newMunicipalityId, setNewMunicipalityId] = useState('');

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
        schoolName: school?.name || teacher.school_name || '-',
        municipioName: municipalityNameById.get(school?.municipio_id || '') || school?.municipio_id || '-',
        students: linkedStudents.map((student) => student.name || student.studentName || '-'),
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
        schoolName: school?.name || student.school_name || '-',
        municipioName: municipalityNameById.get(school?.municipio_id || '') || school?.municipio_id || '-',
        teacherNames,
      };
    });
  }, [allStudents, schoolById, teacherById, municipalityNameById]);

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
      });

      setSuccess('Usuário criado com sucesso');
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('secretaria');
      setNewMunicipioId('');
      setNewSchoolId('');
      setNewTeacherId('');
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
                  </tr>
                </thead>
                <tbody>
                  {municipalities.map((municipality) => (
                    <tr key={municipality.id}>
                      <td>{municipality.name}</td>
                      <td>{municipality.id}</td>
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
                        </tr>
                      </thead>
                      <tbody>
                        {schoolRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.municipioName} ({row.municipioId})</td>
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
                        </tr>
                      </thead>
                      <tbody>
                        {teacherRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.schoolName}</td>
                            <td>{row.municipioName}</td>
                            <td>{row.students.length ? row.students.join(', ') : '-'}</td>
                          </tr>
                        ))}
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
                        </tr>
                      </thead>
                      <tbody>
                        {studentRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.municipioName}</td>
                            <td>{row.schoolName}</td>
                            <td>{row.teacherNames.length ? row.teacherNames.join(', ') : '-'}</td>
                          </tr>
                        ))}
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
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.name || '-'}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {user.municipio_id ? `Município: ${municipalityNameById.get(user.municipio_id) || user.municipio_id}` : ''}
                        {user.school_id ? `${user.municipio_id ? ' | ' : ''}Escola: ${schoolById.get(user.school_id)?.name || user.school_id}` : ''}
                        {user.teacher_id ? `${user.municipio_id || user.school_id ? ' | ' : ''}Professor: ${teacherById.get(user.teacher_id)?.name || user.teacher_id}` : ''}
                        {!user.municipio_id && !user.school_id && !user.teacher_id ? '-' : ''}
                      </td>
                      <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          disabled={deletingUserId === user.id}
                          onClick={() => handleDeleteUser(user)}
                        >
                          {deletingUserId === user.id ? 'Apagando...' : 'Apagar'}
                        </button>
                      </td>
                    </tr>
                  ))}
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
