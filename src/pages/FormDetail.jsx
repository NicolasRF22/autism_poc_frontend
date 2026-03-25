import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsAPI } from '../services/api';
import './FormDetail.css';

const FormDetail = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formsAPI.getForm(formId);
      setForm(data);
      // Inicializar respostas vazias
      const initialAnswers = {};
      data.questions.forEach((q) => {
        initialAnswers[q.id] = q.type === 'boolean' ? null : '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError('Erro ao carregar formulário.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar se todas as questões foram respondidas
    const unanswered = Object.entries(answers).filter(
      ([_, value]) => value === null || value === ''
    );
    
    if (unanswered.length > 0) {
      alert('Por favor, responda todas as questões antes de submeter.');
      return;
    }

    try {
      setSubmitting(true);
      await formsAPI.submitForm(formId, answers, {
        submittedAt: new Date().toISOString(),
      });
      alert('Formulário submetido com sucesso!');
      navigate('/formularios');
    } catch (err) {
      alert('Erro ao submeter formulário. Tente novamente.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'boolean':
        return (
          <div className="question-options">
            <label className="radio-label">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={answers[question.id] === true}
                onChange={() => handleAnswerChange(question.id, true)}
              />
              <span>Sim</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={answers[question.id] === false}
                onChange={() => handleAnswerChange(question.id, false)}
              />
              <span>Não</span>
            </label>
          </div>
        );

      case 'scale':
        return (
          <div className="question-options scale-options">
            {question.scale.map((value) => (
              <label key={value} className="scale-label">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={value}
                  checked={answers[question.id] === value}
                  onChange={() => handleAnswerChange(question.id, value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            className="text-input"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Digite sua resposta"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="text-input"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || '')}
            placeholder="Digite um número"
          />
        );

      case 'textarea':
        return (
          <textarea
            className="textarea-input"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Digite suas observações"
            rows="4"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="form-detail">
        <div className="loading">Carregando formulário...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="form-detail">
        <div className="error-message">{error || 'Formulário não encontrado'}</div>
        <button onClick={() => navigate('/formularios')} className="back-button">
          Voltar aos Formulários
        </button>
      </div>
    );
  }

  return (
    <div className="form-detail">
      <div className="form-detail-header">
        <button onClick={() => navigate('/formularios')} className="back-button">
          ← Voltar
        </button>
        <h1>{form.name}</h1>
        <p>{form.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {form.questions.map((question, index) => (
          <div key={question.id} className="question-block">
            <div className="question-number">Questão {index + 1}</div>
            <div className="question-text">{question.text}</div>
            {renderQuestion(question)}
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/formularios')}
            className="cancel-button"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Submetendo...' : 'Submeter Formulário'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormDetail;
