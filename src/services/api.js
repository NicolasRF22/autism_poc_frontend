import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
export const AUTH_TOKEN_KEY = 'autism_ia_token';
export const AUTH_USER_KEY = 'autism_ia_user';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const getStoredUser = () => {
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const saveAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getApiErrorMessage = (error, fallbackMessage = 'Erro ao processar requisição') => {
  return error?.response?.data?.error || error?.message || fallbackMessage;
};

export const getFetchErrorMessage = async (response, fallbackMessage = 'Erro ao processar requisição') => {
  try {
    const payload = await response.json();
    if (payload?.error) {
      return payload.error;
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const parseFilenameFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) return null;

  // RFC 5987 format: filename*=UTF-8''...
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/\"/g, '').trim();
    } catch {
      return utf8Match[1].replace(/\"/g, '').trim();
    }
  }

  // Fallback format: filename="..."
  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1].trim();
  }

  return null;
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error?.response?.status === 401;
    const isLoginRequest = error?.config?.url?.includes('/auth/login');

    if (isUnauthorized && !isLoginRequest) {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  listUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  getAuditEvents: async (limit = 200) => {
    const response = await api.get('/audit/events', { params: { limit } });
    return response.data;
  },
};

export const adminAPI = {
  getModelUsage: async ({ includeHistory = true, historyLimit = null } = {}) => {
    const params = {};
    if (includeHistory) params.include_history = '1';
    if (historyLimit !== null && historyLimit !== undefined) params.history_limit = historyLimit;
    const response = await api.get('/admin/model-usage', { params });
    return response.data;
  },
};

export const municipalityAPI = {
  getAllMunicipalities: async () => {
    const response = await api.get('/municipalities');
    return response.data;
  },

  createMunicipality: async ({ name, id }) => {
    const response = await api.post('/municipalities', {
      name,
      ...(id ? { id } : {}),
    });
    return response.data;
  },
  deleteMunicipality: async (municipioId) => {
    const encoded = encodeURIComponent(String(municipioId || '')).trim();
    const response = await api.delete(`/municipalities/${encoded}`);
    return response.data;
  },
};

export const formsAPI = {
  // Buscar todos os formulários
  getAllForms: async () => {
    const response = await api.get('/forms');
    return response.data;
  },

  // Buscar um formulário específico
  getForm: async (formId) => {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  },

  // Submeter um formulário
  submitForm: async (formId, answers, metadata = {}) => {
    const response = await api.post('/submissions', {
      form_id: formId,
      answers,
      metadata,
    });
    return response.data;
  },

  // Buscar todas as submissões
  getAllSubmissions: async () => {
    const response = await api.get('/submissions');
    return response.data;
  },

  // Buscar uma submissão específica
  getSubmission: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}`);
    return response.data;
  },

  // Download de uma submissão
  downloadSubmission: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download de todas as submissões
  downloadAllSubmissions: async () => {
    const response = await api.get('/submissions/download-all', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const ragAPI = {
  // Upload e indexação de PDF
  uploadDocument: async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    const response = await api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Listar documentos indexados
  getDocuments: async () => {
    const response = await api.get('/rag/documents');
    return response.data;
  },

  // Listar estudantes agrupados
  getStudents: async () => {
    const response = await api.get('/rag/students');
    return response.data;
  },

  // Remover documento
  deleteDocument: async (docId) => {
    const encodedDocId = encodeURIComponent(String(docId));
    const response = await api.delete(`/rag/documents/${encodedDocId}`);
    return response.data;
  },

  // Baixar documento original
  downloadDocument: async (docId) => {
    const encodedDocId = encodeURIComponent(String(docId));
    const response = await api.get(`/rag/documents/${encodedDocId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Enviar mensagem ao chat
  sendMessage: async (message, sessionId, studentFilter = null) => {
    const response = await api.post('/rag/chat', {
      message,
      session_id: sessionId,
      ...(studentFilter || {}),
    });
    return response.data;
  },

  // Gerar PEI completo
  generatePEI: async (data) => {
    const response = await api.post('/rag/generate-pei', data);
    return response.data;
  },

  // Prévia das fontes para geração de PEI
  getPEISourcesPreview: async ({ studentId, studentName, school }) => {
    const params = {};
    if (studentId) params.student_id = studentId;
    if (studentName) params.student_name = studentName;
    if (school) params.school = school;
    const response = await api.get('/rag/pei-sources-preview', { params });
    return response.data;
  },

  // Listar PEIs gerados
  getPEIs: async ({ studentId, studentName, school } = {}) => {
    const params = {};
    if (studentId) params.student_id = studentId;
    if (studentName) params.student_name = studentName;
    if (school) params.school = school;
    const response = await api.get('/rag/peis', { params });
    return response.data;
  },

  // URL do PDF de um PEI
  getPEIPdfUrl: (peiId) => buildApiUrl(`/rag/peis/${peiId}/pdf`),

  // Baixar/visualizar PDF de um PEI com autenticação (compatível: retorna Blob)
  downloadPEIPdf: async (peiId) => {
    const response = await api.get(`/rag/peis/${peiId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Baixar PDF + metadados úteis (nome sugerido pelo backend)
  downloadPEIPdfWithMetadata: async (peiId) => {
    const response = await api.get(`/rag/peis/${peiId}/pdf`, {
      responseType: 'blob',
    });
    return {
      blob: response.data,
      filename: parseFilenameFromContentDisposition(response.headers?.['content-disposition']),
    };
  },

  // Deletar PEI
  deletePEI: async (peiId) => {
    const response = await api.delete(`/rag/peis/${peiId}`);
    return response.data;
  },

  // Prompt de geração de PEI
  getPEIPrompt: async () => {
    const response = await api.get('/rag/pei-prompt');
    return response.data;
  },

  updatePEIPrompt: async (prompt) => {
    const response = await api.put('/rag/pei-prompt', { prompt });
    return response.data;
  },

  resetPEIPrompt: async () => {
    const response = await api.post('/rag/pei-prompt/reset');
    return response.data;
  },

  // Prompt do chat RAG
  getChatPrompt: async () => {
    const response = await api.get('/rag/chat-prompt');
    return response.data;
  },

  updateChatPrompt: async (prompt) => {
    const response = await api.put('/rag/chat-prompt', { prompt });
    return response.data;
  },

  resetChatPrompt: async () => {
    const response = await api.post('/rag/chat-prompt/reset');
    return response.data;
  },
};

export const diaryAPI = {
  // Listar todos os alunos com diários (resumos)
  getStudents: async () => {
    const response = await api.get('/diary/students');
    return response.data;
  },

  // Listar alunos cadastrados sem diário (elegíveis para novo diário)
  getAvailableStudents: async () => {
    const response = await api.get('/diary/available-students');
    return response.data;
  },

  // Buscar entradas de um aluno específico
  getStudentEntries: async (studentName) => {
    const response = await api.get(`/diary/entries/${encodeURIComponent(studentName)}`);
    return response.data;
  },

  // Criar nova entrada de diário
  createEntry: async (entryData) => {
    const response = await api.post('/diary/entries', entryData);
    return response.data;
  },

  // Buscar entrada específica
  getEntry: async (entryId) => {
    const response = await api.get(`/diary/entries/${entryId}`);
    return response.data;
  },

  // Atualizar entrada de diário
  updateEntry: async (entryId, entryData) => {
    const response = await api.put(`/diary/entries/${entryId}`, entryData);
    return response.data;
  },

  // Deletar diário completo de um aluno (todas as entradas)
  deleteStudentDiary: async (studentName, studentId = null) => {
    const response = await api.delete(`/diary/students/${encodeURIComponent(studentName)}`, {
      params: studentId ? { student_id: studentId } : {},
    });
    return response.data;
  },

  // Deletar entrada de diário
  deleteEntry: async (entryId) => {
    const response = await api.delete(`/diary/entries/${entryId}`);
    return response.data;
  },

  // Buscar últimos professores de um aluno
  getLastTeachers: async (studentName, studentId = null) => {
    const response = await api.get(`/diary/last-teachers/${encodeURIComponent(studentName)}`, {
      params: studentId ? { student_id: studentId } : {},
    });
    return response.data;
  },

  // Gerar preview de importação de diário via PDF
  previewPdfImport: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    if (options.student_id) {
      formData.append('student_id', options.student_id);
    }
    if (options.student_name) {
      formData.append('student_name', options.student_name);
    }
    formData.append('use_ocr', options.use_ocr === false ? 'false' : 'true');
    formData.append('ocr_lang', options.ocr_lang || 'por');
    formData.append('ocr_force', options.ocr_force ? 'true' : 'false');

    const response = await api.post('/diary/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Confirmar importação do diário após revisão
  commitPdfImport: async (entries) => {
    const response = await api.post('/diary/import/commit', { entries });
    return response.data;
  },
};

// ============================================
// API de PDI (Plano de Desenvolvimento Individual)
// ============================================
export const pdiAPI = {
  // Listar todos os PDIs
  getAllPDIs: async () => {
    const response = await api.get('/pdi/all');
    return response.data;
  },

  // Listar alunos cadastrados sem PDI
  getAvailableStudents: async () => {
    const response = await api.get('/pdi/available-students');
    return response.data;
  },

  // Buscar PDI por nome do aluno
  getPDIByStudent: async (studentName, studentId = null) => {
    const response = await api.get(`/pdi/${encodeURIComponent(studentName)}`, {
      params: studentId ? { student_id: studentId } : {},
    });
    return response.data;
  },

  // Buscar PDI por ID
  getPDIById: async (pdiId) => {
    const response = await api.get(`/pdi/id/${pdiId}`);
    return response.data;
  },

  // Criar novo PDI
  createPDI: async (pdiData) => {
    const response = await api.post('/pdi', pdiData);
    return response.data;
  },

  // Atualizar PDI existente
  updatePDI: async (pdiId, pdiData) => {
    const response = await api.put(`/pdi/${pdiId}`, pdiData);
    return response.data;
  },

  // Deletar PDI
  deletePDI: async (pdiId) => {
    const response = await api.delete(`/pdi/${pdiId}`);
    return response.data;
  },
};

// ============================================
// API de Escolas (School Registration)
// ============================================
export const schoolAPI = {
  // Listar todas as escolas
  getAllSchools: async () => {
    const response = await api.get('/schools');
    return response.data;
  },

  // Buscar escola por ID
  getSchool: async (schoolId) => {
    const response = await api.get(`/schools/${schoolId}`);
    return response.data;
  },

  // Criar nova escola
  createSchool: async (schoolData) => {
    const response = await api.post('/schools', schoolData);
    return response.data;
  },

  // Atualizar escola existente
  updateSchool: async (schoolId, schoolData) => {
    const response = await api.put(`/schools/${schoolId}`, schoolData);
    return response.data;
  },

  // Deletar escola
  deleteSchool: async (schoolId) => {
    const response = await api.delete(`/schools/${schoolId}`);
    return response.data;
  },
};

// ============================================
// API de Alunos (Student Registration)
// ============================================
export const studentAPI = {
  // Listar todos os alunos
  getAllStudents: async () => {
    const response = await api.get('/students');
    return response.data;
  },

  // Buscar aluno por ID
  getStudent: async (studentId) => {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  },

  // Criar novo aluno
  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  // Atualizar aluno existente
  updateStudent: async (studentId, studentData) => {
    const response = await api.put(`/students/${studentId}`, studentData);
    return response.data;
  },

  // Deletar aluno
  deleteStudent: async (studentId) => {
    const response = await api.delete(`/students/${studentId}`);
    return response.data;
  },
};

// ============================================
// API de Docentes (Teacher Registration)
// ============================================
export const teacherAPI = {
  getAllTeachers: async () => {
    const response = await api.get('/teachers');
    return response.data;
  },

  getTeacher: async (teacherId) => {
    const response = await api.get(`/teachers/${teacherId}`);
    return response.data;
  },

  createTeacher: async (teacherData) => {
    const response = await api.post('/teachers', teacherData);
    return response.data;
  },

  updateTeacher: async (teacherId, teacherData) => {
    const response = await api.put(`/teachers/${teacherId}`, teacherData);
    return response.data;
  },

  deleteTeacher: async (teacherId) => {
    const response = await api.delete(`/teachers/${teacherId}`);
    return response.data;
  },
};

export default api;
