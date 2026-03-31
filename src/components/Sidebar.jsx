import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logoAutismIa from '../assets/logo-autism-ia.jpeg';
import logoFapemig from '../assets/logo-fapemig.png';
import logoIncit from '../assets/logo-incit.png';
import logoPiranguinho from '../assets/logo-piranguinho.png';
import logoUnifei from '../assets/logo-unifei.png';

const Sidebar = ({ isOpen, onToggle, width, onResize, user, onLogout }) => {
  const location = useLocation();
  const draggingRef = useRef(false);

  const startResizing = (event) => {
    if (!isOpen || window.innerWidth <= 768) {
      return;
    }

    draggingRef.current = true;
    document.body.classList.add('resizing-sidebar');

    const handleMouseMove = (moveEvent) => {
      if (!draggingRef.current) {
        return;
      }

      onResize(moveEvent.clientX);
    };

    const stopResizing = () => {
      draggingRef.current = false;
      document.body.classList.remove('resizing-sidebar');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    event.preventDefault();
  };

  const menuItems = [
    { path: '/inicio', label: 'Início', icon: '🏠' },
    { path: '/formularios', label: 'Formulários', icon: '📋' },
    { path: '/diario', label: 'Diário Individual', icon: '📖' },
    { path: '/pdi', label: 'PDI Individual', icon: '📑' },
    { path: '/rag', label: 'RAG', icon: '🤖' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/cadastro', label: 'Cadastro', icon: '🗂️' });
    menuItems.push({ path: '/admin', label: 'Administração', icon: '🛡️' });
    menuItems.push({ path: '/admin/gastos', label: 'Gastos IA', icon: '💸' });
  }

  return (
    <>
      <div className={`sidebar ${isOpen ? '' : 'sidebar-hidden'}`} style={{ width: `${width}px` }}>
        <div className="sidebar-header">
          <img className="sidebar-logo" src={logoAutismIa} alt="Autism.iA" />
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}

          {user?.role === 'admin' && (
            <div className="sidebar-partners">
              <img className="sidebar-partner-logo" src={logoFapemig} alt="FAPEMIG" />
              <img className="sidebar-partner-logo" src={logoIncit} alt="INCIT" />
              <img className="sidebar-partner-logo" src={logoPiranguinho} alt="Prefeitura de Piranguinho" />
              <img className="sidebar-partner-logo" src={logoUnifei} alt="UNIFEI" />
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <p className="sidebar-user-name">{user?.username}</p>
            <p className="sidebar-user-role">Perfil: {user?.role}</p>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            Sair
          </button>
          <p>© 2026 Autism.IA</p>
        </div>

        {isOpen && <div className="sidebar-resizer" onMouseDown={startResizing} />}
      </div>

      {/* Botão de toggle — sempre visível */}
      <button
        className={`sidebar-toggle-btn ${isOpen ? 'open' : 'closed'}`}
        style={{ left: isOpen ? `${width}px` : '0px' }}
        onClick={onToggle}
        title={isOpen ? 'Ocultar menu' : 'Mostrar menu'}
      >
        {isOpen ? '‹' : '›'}
      </button>
    </>
  );
};

export default Sidebar;
