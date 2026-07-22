import React, { useEffect, useState } from 'react';
import { buildAuthenticatedUrl, familyDiaryAPI, getStoredUser, studentAPI } from '../services/api';
import './FamilyDiaryPage.css';
import './DiaryEntry.css';
import './DiaryPage.css';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const formatDate = (value) => {
  if (!value) return '—';
  const raw = String(value).trim();
  if (DATE_ONLY_REGEX.test(raw)) {
    const [year, month, day] = raw.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString('pt-BR');
};

const parseLocalDate = (value) => {
  if (!value) return null;

  const raw = String(value).trim();
  if (DATE_ONLY_REGEX.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const FamilyDiaryPage = () => {
  const currentUser = getStoredUser();
  const role = currentUser?.role || '';
  const canWrite = role === 'pais';

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [dateFilter, setDateFilter] = useState('week'); // 'all', 'today', 'week', 'month', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [entryDate, setEntryDate] = useState('');
  const [observations, setObservations] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageCaptions, setImageCaptions] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const list = await studentAPI.getAllStudents();
        const arr = Array.isArray(list) ? list : [];
        setStudents(arr);
        if (arr.length === 1) setSelectedStudentId(arr[0].id);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar alunos.');
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, []);

  const loadEntries = async (studentId) => {
    if (!studentId) {
      setEntries([]);
      return;
    }
    try {
      setLoadingEntries(true);
      setError('');
      const list = await familyDiaryAPI.getStudentEntries(studentId);
      const arr = Array.isArray(list) ? list : [];
      const withImages = await Promise.all(
        arr.map(async (entry) => {
          try {
            const images = await familyDiaryAPI.listEntryImages(entry.id);
            return { ...entry, images: Array.isArray(images) ? images : [] };
          } catch {
            return { ...entry, images: [] };
          }
        }),
      );
      setEntries(withImages);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar entradas do Diário Familiar.');
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadEntries(selectedStudentId);
  }, [selectedStudentId]);

  const applyDateFilter = () => {
    if (entries.length === 0) {
      setFilteredEntries([]);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let filtered = [...entries];

    switch (dateFilter) {
      case 'today':
        filtered = entries.filter((entry) => {
          const entryDateValue = parseLocalDate(entry.entry_date);
          if (!entryDateValue) return false;
          return entryDateValue >= today;
        });
        break;

      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = entries.filter((entry) => {
          const entryDateValue = parseLocalDate(entry.entry_date);
          if (!entryDateValue) return false;
          return entryDateValue >= weekAgo;
        });
        break;
      }

      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = entries.filter((entry) => {
          const entryDateValue = parseLocalDate(entry.entry_date);
          if (!entryDateValue) return false;
          return entryDateValue >= monthAgo;
        });
        break;
      }

      case 'custom': {
        const start = customDate ? parseLocalDate(customDate) : null;
        const end = customEndDate ? parseLocalDate(customEndDate) : null;
        if (start || end) {
          filtered = entries.filter((entry) => {
            const entryDateValue = parseLocalDate(entry.entry_date);
            if (!entryDateValue) return false;
            if (start && entryDateValue < start) return false;
            if (end && entryDateValue > end) return false;
            return true;
          });
        }
        break;
      }

      case 'all':
      default:
        filtered = entries;
        break;
    }

    setFilteredEntries(filtered);
  };

  useEffect(() => {
    applyDateFilter();
  }, [entries, dateFilter, customDate, customEndDate]);

  const handleFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setCustomDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomDateChange = (date) => {
    setCustomDate(date);
    setDateFilter('custom');
  };

  const handleCustomEndDateChange = (date) => {
    setCustomEndDate(date);
    setDateFilter('custom');
  };

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const resetForm = () => {
    setEditingEntryId(null);
    setEntryDate('');
    setObservations('');
    setImageFiles([]);
    setImageCaptions([]);
    setExistingImages([]);
    setShowForm(false);
  };

  const openNewEntryForm = () => {
    resetForm();
    setEntryDate(getTodayDateString());
    setShowForm(true);
  };

  const openEditForm = (entry) => {
    setEditingEntryId(entry.id);
    setEntryDate(entry.entry_date || getTodayDateString());
    setObservations(entry.observations || '');
    setImageFiles([]);
    setImageCaptions([]);
    setExistingImages(entry.images || []);
    setShowForm(true);
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      alert('Apenas arquivos de imagem são permitidos');
    }

    if (validFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...validFiles]);
      setImageCaptions((prev) => [...prev, ...validFiles.map(() => '')]);
    }
  };

  const handleRemoveNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageCaptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index, value) => {
    setImageCaptions((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm('Remover esta imagem da entrada?')) return;
    try {
      await familyDiaryAPI.deleteEntryImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.image_id !== imageId));
    } catch {
      alert('Erro ao remover imagem. Tente novamente.');
    }
  };

  const openPreview = (url, title = 'Imagem') => {
    setPreviewImage(url);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewTitle('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedStudentId) {
      alert('Selecione um aluno.');
      return;
    }
    if (!entryDate) {
      alert('Selecione a data do registro.');
      return;
    }
    if (!observations.trim()) {
      alert('Escreva uma observação.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let entryId = editingEntryId;
      if (editingEntryId) {
        await familyDiaryAPI.updateEntry(editingEntryId, observations.trim(), entryDate);
      } else {
        const created = await familyDiaryAPI.createEntry({
          student_id: selectedStudentId,
          observations: observations.trim(),
          entry_date: entryDate,
        });
        entryId = created?.entry?.id || '';
      }

      if (entryId && imageFiles.length > 0) {
        try {
          await familyDiaryAPI.uploadEntryImages(entryId, imageFiles, imageCaptions);
        } catch {
          alert('Entrada salva, mas houve erro ao enviar as imagens.');
        }
      }

      resetForm();
      await loadEntries(selectedStudentId);
    } catch (err) {
      console.error(err);
      const backendMessage = err?.response?.data?.error;
      setError(backendMessage || 'Erro ao salvar entrada. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Remover esta entrada do Diário Familiar?')) return;
    try {
      await familyDiaryAPI.deleteEntry(entryId);
      await loadEntries(selectedStudentId);
    } catch {
      alert('Erro ao remover entrada. Tente novamente.');
    }
  };

  const canManageEntry = (entry) => role === 'admin' || entry.author_user_id === currentUser?.id;

  return (
    <div className="family-diary-page">
      <div className="family-diary-header">
        <h1>Diário Familiar</h1>
        <p>
          {canWrite
            ? 'Registre observações e fotos do dia a dia do seu filho(a).'
            : 'Acompanhe as observações e fotos registradas pelos responsáveis.'}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loadingStudents ? (
        <p>Carregando alunos...</p>
      ) : students.length === 0 ? (
        <div className="family-diary-placeholder-notice">
          <span className="family-diary-placeholder-icon">ℹ️</span>
          <div>
            <strong>Nenhum aluno vinculado</strong>
            <p>Não há alunos vinculados ao seu perfil no momento.</p>
          </div>
        </div>
      ) : (
        <>
          {students.length > 1 && (
            <div className="family-diary-student-picker">
              <label htmlFor="family-diary-student-select">Aluno:</label>
              <select
                id="family-diary-student-select"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                <option value="">Selecione...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedStudentId && (
            <>
              {canWrite && !showForm && (
                <button type="button" className="new-diary-button" onClick={openNewEntryForm}>
                  + Nova Entrada
                </button>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="diary-form family-diary-form">
                  <div className="form-section">
                    <h2>{editingEntryId ? 'Editar Entrada' : 'Nova Entrada'}</h2>

                    <div className="form-group">
                      <label>Data do registro:</label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Observações:</label>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows="5"
                        placeholder="Descreva aqui como foi o dia..."
                        className="observations-textarea"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h2>Anexar imagens</h2>
                    <div className="image-upload">
                      <label className="image-upload-button">
                        Selecionar imagens
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelection}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <span className="image-upload-hint">Formatos aceitos: JPG, PNG, GIF, WEBP.</span>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="image-preview-grid">
                        {imagePreviews.map((previewUrl, index) => (
                          <div key={previewUrl} className="image-preview-item">
                            <button
                              type="button"
                              className="image-preview-button"
                              onClick={() => openPreview(previewUrl, `Imagem ${index + 1}`)}
                            >
                              <img src={previewUrl} alt={`Imagem ${index + 1}`} />
                            </button>
                            <input
                              type="text"
                              className="image-caption-input"
                              placeholder="Legenda (opcional)"
                              value={imageCaptions[index] || ''}
                              onChange={(e) => handleCaptionChange(index, e.target.value)}
                            />
                            <button
                              type="button"
                              className="image-remove-button"
                              onClick={() => handleRemoveNewImage(index)}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {existingImages.length > 0 && (
                      <div className="image-preview-grid existing-images">
                        {existingImages.map((image) => {
                          const viewUrl = buildAuthenticatedUrl(image.view_url);
                          return (
                            <div key={image.image_id} className="image-preview-item">
                              <button
                                type="button"
                                className="image-preview-button"
                                onClick={() => openPreview(viewUrl, image.file_name)}
                              >
                                <img src={viewUrl} alt={image.file_name} />
                              </button>
                              {image.caption && <span className="image-file-name">{image.caption}</span>}
                              <button
                                type="button"
                                className="image-remove-button"
                                onClick={() => handleDeleteExistingImage(image.image_id)}
                              >
                                Remover
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={resetForm} className="cancel-button" disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="submit-button" disabled={saving}>
                      {saving ? 'Salvando...' : editingEntryId ? 'Salvar Alterações' : 'Salvar Entrada'}
                    </button>
                  </div>
                </form>
              )}

              {entries.length > 0 && (
                <div className="date-filters">
                  <div className="filter-buttons">
                    <button
                      className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('all')}
                    >
                      📅 Todo Período
                    </button>
                    <button
                      className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('today')}
                    >
                      📆 Hoje
                    </button>
                    <button
                      className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('week')}
                    >
                      📊 Última Semana
                    </button>
                    <button
                      className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('month')}
                    >
                      📈 Último Mês
                    </button>
                  </div>
                  <div className="custom-date-filter">
                    <label>Período:</label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => handleCustomDateChange(e.target.value)}
                    />
                    <span className="date-range-separator">até</span>
                    <input
                      type="date"
                      value={customEndDate}
                      min={customDate || undefined}
                      onChange={(e) => handleCustomEndDateChange(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {entries.length > 0 && dateFilter !== 'all' && (
                <div className="filter-results">
                  {filteredEntries.length === 0 ? (
                    <p>Nenhuma entrada encontrada para este período</p>
                  ) : (
                    <p>Mostrando {filteredEntries.length} de {entries.length} registros</p>
                  )}
                </div>
              )}

              {loadingEntries ? (
                <p>Carregando entradas...</p>
              ) : filteredEntries.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma entrada {dateFilter !== 'all' && entries.length > 0 ? 'para este período' : 'registrada ainda'}</p>
                  {canWrite && entries.length === 0 && <p>Clique em "Nova Entrada" para começar</p>}
                </div>
              ) : (
                <div className="family-diary-feed">
                  {filteredEntries.map((entry) => (
                    <div key={entry.id} className="family-diary-entry-card">
                      <div className="family-diary-entry-header">
                        <span className="family-diary-entry-date">{formatDate(entry.entry_date)}</span>
                      </div>
                      <p className="family-diary-entry-summary">{entry.observations}</p>
                      <p className="family-diary-entry-author">Registrado por: {entry.author_name || '—'}</p>

                      {entry.images && entry.images.length > 0 && (
                        <div className="image-preview-grid">
                          {entry.images.map((image) => {
                            const thumbUrl = buildAuthenticatedUrl(image.thumb_url);
                            const viewUrl = buildAuthenticatedUrl(image.view_url);
                            return (
                              <div key={image.image_id} className="image-preview-item">
                                <button
                                  type="button"
                                  className="image-preview-button"
                                  onClick={() => openPreview(viewUrl, image.file_name)}
                                >
                                  <img src={thumbUrl} alt={image.file_name} />
                                </button>
                                {image.caption && <span className="image-file-name">{image.caption}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {canManageEntry(entry) && (
                        <div className="family-diary-entry-actions">
                          <button type="button" className="back-link" onClick={() => openEditForm(entry)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="danger-diary-button"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {previewImage && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div className="image-preview-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="image-preview-modal-header">
              <h3>{previewTitle}</h3>
              <button type="button" onClick={closePreview}>
                ✕
              </button>
            </div>
            <img src={previewImage} alt={previewTitle} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDiaryPage;
