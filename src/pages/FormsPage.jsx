import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formsAPI } from '../services/api';
import './FormsPage.css';

const ENABLED_FORM_IDS = ['cadastro_escola', 'cadastro_aluno'];

const FormsPage = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formsAPI.getAllForms();
      const filteredForms = data.filter((form) => ENABLED_FORM_IDS.includes(form.id));
      filteredForms.sort((a, b) => ENABLED_FORM_IDS.indexOf(a.id) - ENABLED_FORM_IDS.indexOf(b.id));
      setForms(filteredForms);
    } catch (err) {
      setError('Erro ao carregar formulários. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (formId) => {
    // Route to specific pages based on form type
    if (formId === 'cadastro_escola') {
      navigate('/schools');
    } else if (formId === 'cadastro_aluno') {
      navigate('/students');
    } else {
      // For other forms, go to the detail page
      navigate(`/formularios/${formId}`);
    }
  };

  if (loading) {
    return (
      <div className="forms-page">
        <div className="loading">Carregando formulários...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forms-page">
        <div className="error-message">{error}</div>
        <button onClick={loadForms} className="retry-button">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="forms-page">
      <div className="forms-header">
        <h1>Formulários Disponíveis</h1>
        <p>Selecione um formulário para começar</p>
      </div>

      <div className="forms-grid">
        {forms.map((form) => (
          <div
            key={form.id}
            onClick={() => handleFormClick(form.id)}
            className="form-card"
            style={{ cursor: 'pointer' }}
          >
            <div className="form-card-icon">
              {form.id === 'cadastro_escola' ? '🏫' : 
               form.id === 'cadastro_aluno' ? '👨‍🎓' : '📝'}
            </div>
            <h3>{form.name}</h3>
            <p>{form.description}</p>
            <button className="form-card-button">
              {form.id === 'cadastro_escola' || form.id === 'cadastro_aluno' 
                ? 'Ver Cadastros →' 
                : 'Iniciar Formulário →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormsPage;
