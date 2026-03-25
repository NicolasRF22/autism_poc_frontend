import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">Bem-vindo ao Autism.IA</h1>
        <p className="home-description">
          Sistema integrado para avaliação e gerenciamento de formulários relacionados 
          ao Transtorno do Espectro Autista (TEA)
        </p>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Formulários Especializados</h3>
          <p>
            Acesse formulários validados como M-CHAT, CARS e ADOS-2 para 
            avaliação estruturada
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Análise de Respostas</h3>
          <p>
            Visualize e analise todas as submissões de formulários em um 
            único lugar
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💾</div>
          <h3>Export JSON</h3>
          <p>
            Baixe os dados em formato JSON para análise externa ou 
            backup
          </p>
        </div>
      </div>

      <div className="home-info">
        <div className="info-section">
          <h2>Como Usar</h2>
          <ol>
            <li>Navegue até a seção <strong>Formulários</strong> no menu lateral</li>
            <li>Escolha o formulário adequado para sua avaliação</li>
            <li>Preencha todas as questões cuidadosamente</li>
            <li>Submeta o formulário e visualize na seção <strong>Respostas</strong></li>
            <li>Baixe os dados em JSON quando necessário</li>
          </ol>
        </div>

        <div className="info-section">
          <h2>Formulários Disponíveis</h2>
          <ul>
            <li><strong>M-CHAT</strong> - Modified Checklist for Autism in Toddlers (16-30 meses)</li>
            <li><strong>CARS</strong> - Childhood Autism Rating Scale</li>
            <li><strong>ADOS-2</strong> - Autism Diagnostic Observation Schedule</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
