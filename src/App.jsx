import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import FormsPage from './pages/FormsPage';
import FormDetail from './pages/FormDetail';
import DiaryPage from './pages/DiaryPage';
import DiaryEntry from './pages/DiaryEntry';
import PDIPage from './pages/PDIPage';
import PDIForm from './pages/PDIForm';
import SchoolsPage from './pages/SchoolsPage';
import SchoolPreForm from './pages/SchoolPreForm';
import SchoolFullForm from './pages/SchoolFormNew';
import StudentsPage from './pages/StudentsPage';
import StudentPreForm from './pages/StudentPreForm';
import StudentFullForm from './pages/StudentFormNew';
import TeachersPage from './pages/TeachersPage';
import TeacherForm from './pages/TeacherFormNew';
import TesteRAG from './pages/TesteRAG';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AdminUsagePage from './pages/AdminUsagePage';
import CadastroPage from './pages/CadastroPage';
import { authAPI, clearAuthSession, getAuthToken, getStoredUser } from './services/api';
import './App.css';

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 340;

const clampSidebarWidth = (value) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));

const getDefaultSidebarWidth = () => (window.innerWidth <= 1366 ? 220 : 250);

const getInitialSidebarWidth = () => {
  const savedWidth = Number(localStorage.getItem('sidebar-width'));

  if (Number.isFinite(savedWidth)) {
    return clampSidebarWidth(savedWidth);
  }

  return getDefaultSidebarWidth();
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const [user, setUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    const validateSession = async () => {
      try {
        const data = await authAPI.me();
        setUser(data.user);
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    validateSession();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthSession();
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Logout local continua mesmo com falha no backend
    } finally {
      clearAuthSession();
      setUser(null);
    }
  };

  if (authLoading) {
    return <div className="auth-loading">Carregando sessão...</div>;
  }

  const handleSidebarResize = (newWidth) => {
    setSidebarWidth(clampSidebarWidth(newWidth));
  };

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((o) => !o)}
            width={sidebarWidth}
            onResize={handleSidebarResize}
            user={user}
            onLogout={handleLogout}
          />
          <main
            className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}
            style={{ marginLeft: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/inicio" replace />} />
              <Route path="/login" element={<Navigate to="/inicio" replace />} />
              <Route path="/inicio" element={<Home />} />
              <Route path="/formularios" element={<FormsPage />} />
              <Route path="/formularios/:formId" element={<FormDetail />} />
              <Route path="/diario" element={<DiaryPage />} />
              <Route path="/diario/:studentName/novo" element={<DiaryEntry />} />
              <Route path="/pdi" element={<PDIPage />} />
              <Route path="/pdi/novo" element={<PDIForm />} />
              <Route path="/pdi/:id/view" element={<PDIForm />} />
              <Route path="/pdi/:id/edit" element={<PDIForm />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/schools/new" element={<SchoolPreForm />} />
              <Route path="/schools/:id/view" element={<SchoolPreForm />} />
              <Route path="/schools/:id/edit" element={<SchoolPreForm />} />
              <Route path="/schools/new/completo" element={<SchoolFullForm />} />
              <Route path="/schools/:id/view/completo" element={<SchoolFullForm />} />
              <Route path="/schools/:id/edit/completo" element={<SchoolFullForm />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/new" element={<StudentPreForm />} />
              <Route path="/students/:id/view" element={<StudentPreForm />} />
              <Route path="/students/:id/edit" element={<StudentPreForm />} />
              <Route path="/students/new/completo" element={<StudentFullForm />} />
              <Route path="/students/:id/view/completo" element={<StudentFullForm />} />
              <Route path="/students/:id/edit/completo" element={<StudentFullForm />} />
              <Route
                path="/teachers"
                element={user?.role === 'admin' ? <TeachersPage /> : <Navigate to="/formularios" replace />}
              />
              <Route
                path="/teachers/new"
                element={user?.role === 'admin' ? <TeacherForm /> : <Navigate to="/formularios" replace />}
              />
              <Route
                path="/teachers/:id/view"
                element={user?.role === 'admin' ? <TeacherForm /> : <Navigate to="/formularios" replace />}
              />
              <Route
                path="/teachers/:id/edit"
                element={user?.role === 'admin' ? <TeacherForm /> : <Navigate to="/formularios" replace />}
              />
              <Route path="/rag" element={<TesteRAG />} />
              <Route path="/teste-rag" element={<Navigate to="/rag" replace />} />
              <Route
                path="/cadastro"
                element={user?.role === 'admin' ? <CadastroPage /> : <Navigate to="/formularios" replace />}
              />
              <Route
                path="/admin"
                element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/formularios" replace />}
              />
              <Route
                path="/admin/gastos"
                element={user?.role === 'admin' ? <AdminUsagePage /> : <Navigate to="/formularios" replace />}
              />
              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;
