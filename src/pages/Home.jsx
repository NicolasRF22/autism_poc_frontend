import React from 'react';
import './Home.css';
import logoAutismIa from '../assets/logo-autism-ia.jpeg';
import logoFapemig from '../assets/logo-fapemig.png';
import logoIncit from '../assets/logo-incit.png';
import logoPiranguinho from '../assets/logo-piranguinho.png';
import logoUnifei from '../assets/logo-unifei.png';

const Home = () => {
  return (
    <div className="home">
      <h1 className="home-page-title">Início</h1>

      <div className="home-shell">
        <section className="home-hero">
          <p className="home-kicker">Projeto SmartPEI</p>
          <p className="home-info-line">Fapemig - Edital Cientista Empreendedor</p>
          <p className="home-info-line">Coordenador: Prof. Dr. Guilherme Sousa Bastos</p>
        </section>

        <section className="home-summary" aria-label="Resumo da aplicação">
          <p className="home-summary-text">
            A plataforma SmartPEI centraliza o cadastro de escolas e alunos, facilita o preenchimento dos
            formulários pedagógicos e apoia a construção de planos e registros educacionais em um fluxo
            simples, organizado e acessível para a equipe escolar.
          </p>
          <p className="home-summary-text">
            Em um único ambiente, a aplicação reúne informações institucionais, histórico do estudante e
            documentos de acompanhamento para agilizar o trabalho diário, melhorar a consistência dos dados
            e apoiar decisões pedagógicas com mais clareza.
          </p>
        </section>

        <section className="home-brand-section" aria-label="Instituições parceiras">
          <h2 className="home-brand-title">Instituições Parceiras</h2>

          <div className="home-logos-grid">
            <div className="home-logos-row home-logos-row-top">
              <div className="home-logo-card home-logo-card-autism">
                <img src={logoAutismIa} alt="Autism.iA" className="home-logo home-logo-autism" />
              </div>
              <div className="home-logo-card">
                <img src={logoFapemig} alt="FAPEMIG" className="home-logo home-logo-fapemig" />
              </div>
              <div className="home-logo-card">
                <img src={logoIncit} alt="INCIT" className="home-logo home-logo-incit" />
              </div>
            </div>

            <div className="home-logos-row home-logos-row-bottom">
              <div className="home-logo-card">
                <img
                  src={logoPiranguinho}
                  alt="Prefeitura de Piranguinho"
                  className="home-logo home-logo-piranguinho"
                />
              </div>
              <div className="home-logo-card">
                <img src={logoUnifei} alt="UNIFEI" className="home-logo home-logo-unifei" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
