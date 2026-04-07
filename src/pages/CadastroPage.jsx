import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CadastroPage.css';

const CadastroPage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      key: 'alunos',
      icon: '👨‍🎓',
      title: 'Pré-cadastro de Alunos',
      description: 'Crie e acesse os pré-cadastros de alunos.',
      listPath: '/students',
      newPath: '/students/new',
      newLabel: 'Novo Pré-cadastro',
    },
    {
      key: 'escolas',
      icon: '🏫',
      title: 'Pré-cadastro de Escolas',
      description: 'Crie e acesse os pré-cadastros de escolas.',
      listPath: '/schools',
      newPath: '/schools/new',
      newLabel: 'Novo Pré-cadastro',
    },
    {
      key: 'docentes',
      icon: '👩‍🏫',
      title: 'Docentes',
      description: 'Gerencie cadastros de docentes.',
      listPath: '/teachers',
      newPath: '/teachers/new',
      newLabel: 'Novo Docente',
    },
  ];

  return (
    <div className="cadastro-page">
      <header className="cadastro-header">
        <h1>Pré-Cadastro</h1>
        <p>Área para criar e acessar pré-cadastros de alunos, escolas e docentes.</p>
      </header>

      <section className="cadastro-grid">
        {cards.map((card) => (
          <article key={card.key} className="cadastro-card">
            <div className="cadastro-card-icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <div className="cadastro-card-actions">
              <button type="button" className="cadastro-btn cadastro-btn-secondary" onClick={() => navigate(card.listPath)}>
                Ver Lista
              </button>
              <button type="button" className="cadastro-btn cadastro-btn-primary" onClick={() => navigate(card.newPath)}>
                {card.newLabel}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default CadastroPage;
