import React, { useState } from 'react';
import { authAPI, saveAuthSession } from '../services/api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Informe usuário e senha');
      return;
    }

    try {
      setLoading(true);
      const data = await authAPI.login(username.trim(), password);
      saveAuthSession({ token: data.token, user: data.user });
      onLoginSuccess(data.user);
    } catch (err) {
      const message = err?.response?.data?.error || 'Falha ao autenticar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Autism.IA</h1>
        <p className="login-subtitle">Acesso restrito</p>

        <label htmlFor="username">Usuário</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          disabled={loading}
        />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
