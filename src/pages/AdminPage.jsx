import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import './AdminPage.css';

const ROLES = ['admin', 'editor', 'viewer'];

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await authAPI.listUsers();
      setUsers(usersData);
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
      setAuditEvents(events);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar auditoria';
      setError(message);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAudit();
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Informe usuário e senha para criar o novo acesso');
      return;
    }

    try {
      setSavingUser(true);
      await authAPI.createUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setSuccess('Usuário criado com sucesso');
      setNewUsername('');
      setNewPassword('');
      setNewRole('editor');
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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administração</h1>
        <p>Gerencie usuários e acompanhe a trilha de auditoria da aplicação.</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Criar novo usuário</h2>
          <form className="admin-form" onSubmit={handleCreateUser}>
            <label htmlFor="new-username">Usuário</label>
            <input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              disabled={savingUser}
            />

            <label htmlFor="new-password">Senha</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={savingUser}
            />

            <label htmlFor="new-role">Perfil</label>
            <select
              id="new-role"
              value={newRole}
              onChange={(event) => setNewRole(event.target.value)}
              disabled={savingUser}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <button type="submit" disabled={savingUser}>
              {savingUser ? 'Salvando...' : 'Criar usuário'}
            </button>
          </form>
        </section>

        <section className="admin-card">
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
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
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
                      <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                      <td>Atualização automática</td>
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
