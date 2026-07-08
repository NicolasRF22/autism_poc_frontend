import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import './AdminUsagePage.css';

const formatValue = (value) => (value === null || value === undefined ? 'Não configurado' : value.toLocaleString('pt-BR'));

const formatPercent = (value) => (value === null || value === undefined ? '—' : `${value.toFixed(2)}%`);
const formatNullableValue = (value) => (value === null || value === undefined ? '—' : value.toLocaleString('pt-BR'));

const formatCost = (usd) => {
  if (usd === null || usd === undefined || Number.isNaN(usd)) return '—';
  return `$${usd.toFixed(6)}`;
};

const computeCost = (item, modelPricing) => {
  if (!modelPricing) return null;
  const pricing = modelPricing[item.model];
  if (!pricing) return null;
  return (
    ((item.input_tokens || 0) / 1_000_000) * pricing.input_per_1m +
    ((item.output_tokens || 0) / 1_000_000) * pricing.output_per_1m
  );
};

const clampPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const numeric = Number(value);
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
};

const resolveModelProgress = (item) => {
  const values = [
    item?.utilization?.rpm_percent,
    item?.utilization?.tpm_percent,
    item?.utilization?.rpd_percent,
  ].filter((value) => value !== null && value !== undefined);

  if (!values.length) {
    return { value: null, label: 'Sem limite configurado', tone: 'neutral' };
  }

  const raw = Math.max(...values);
  const value = clampPercent(raw);

  if (value >= 90) return { value, label: `Crítico (${value.toFixed(2)}%)`, tone: 'critical' };
  if (value >= 70) return { value, label: `Atenção (${value.toFixed(2)}%)`, tone: 'warning' };
  return { value, label: `Seguro (${value.toFixed(2)}%)`, tone: 'ok' };
};

const formatOperationLabel = (operation) => {
  const labels = {
    rag_chat_generation: 'Chat RAG (geração)',
    pei_generation: 'Geração de PEI',
    rag_chat_query_embedding: 'Chat RAG (embedding da pergunta)',
    pei_query_embedding: 'PEI (embedding da busca)',
    rag_upload_document_embedding: 'Upload RAG (embeddings dos chunks)',
    rag_reindex_document_embedding: 'Reindexação RAG (reindexação de chunks)',
  };
  // Logs antigos gravavam "operacao:task_type" — extraímos apenas a base
  const base = (operation || '').split(':')[0];
  return labels[base] || operation;
};

const statusLabel = {
  ok: 'OK',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_limite_configurado: 'Sem limite configurado',
};

const HeaderWithTooltip = ({ label, tooltip }) => (
  <span className="admin-usage-header-cell">
    {label}
    <span className="admin-usage-tooltip" aria-label={tooltip} data-tooltip={tooltip}>
      ?
    </span>
  </span>
);

const AdminUsagePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOperation, setFilterOperation] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await adminAPI.getModelUsage();
      setData(payload);
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao carregar métricas de uso';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const usageHistory = Array.isArray(data?.history) ? data.history : [];

  const uniqueOperations = [...new Set(usageHistory.map((item) => (item.operation || '').split(':')[0]).filter(Boolean))].sort();
  const uniqueModels = [...new Set(usageHistory.map((item) => item.model).filter(Boolean))].sort();

  const filteredHistory = usageHistory.filter((item) => {
    if (filterOperation) {
      const base = (item.operation || '').split(':')[0];
      if (base !== filterOperation) return false;
    }
    if (filterModel && item.model !== filterModel) return false;
    if (filterDateFrom || filterDateTo) {
      if (!item.timestamp) return false;
      const ts = new Date(item.timestamp);
      if (filterDateFrom && ts < new Date(`${filterDateFrom}T00:00:00`)) return false;
      if (filterDateTo && ts > new Date(`${filterDateTo}T23:59:59`)) return false;
    }
    return true;
  });

  const hasActiveFilter = filterDateFrom || filterDateTo || filterOperation || filterModel;

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterOperation('');
    setFilterModel('');
  };

  return (
    <div className="admin-usage-page">
      <div className="admin-usage-header">
        <h1>Gastos e Limites de Modelos</h1>
        <p>Uso atual (RPM, TPM e RPD) por modelo com comparação direta com os limites configurados.</p>
      </div>

      <div className="admin-usage-actions">
        <button type="button" onClick={loadData}>
          Atualizar
        </button>
        {data?.generated_at && (
          <span>Última atualização: {new Date(data.generated_at).toLocaleString('pt-BR')}</span>
        )}
      </div>

      {error && <div className="admin-usage-alert admin-usage-alert-error">{error}</div>}

      <div className="admin-usage-alert admin-usage-alert-info">
        <strong>Nota:</strong> o TPM aqui representa tokens de entrada por minuto. Os limites são lidos das variáveis
        <code> GOOGLE_RATE_LIMIT_* </code> no backend.
      </div>

      {loading ? (
        <p>Carregando métricas...</p>
      ) : !data?.models?.length ? (
        <p>Nenhum modelo encontrado para exibição.</p>
      ) : (
        <div className="admin-usage-sections">
          <div className="admin-usage-table-wrapper">
            <table className="admin-usage-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>
                    <HeaderWithTooltip
                      label="RPM atual"
                      tooltip="Requests Per Minute: quantidade de requisições feitas para o modelo no último minuto."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="RPM limite"
                      tooltip="Limite máximo configurado de requisições por minuto para o modelo."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="RPM uso"
                      tooltip="Percentual de uso do limite de RPM."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="TPM atual"
                      tooltip="Tokens Per Minute: total de tokens de entrada enviados ao modelo no último minuto."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="TPM limite"
                      tooltip="Limite máximo configurado de tokens por minuto para o modelo."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="TPM uso"
                      tooltip="Percentual de uso do limite de TPM."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="RPD atual"
                      tooltip="Requests Per Day: quantidade de requisições feitas para o modelo nas últimas 24 horas."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="RPD limite"
                      tooltip="Limite máximo configurado de requisições por dia para o modelo."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="RPD uso"
                      tooltip="Percentual de uso do limite de RPD."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="Status"
                      tooltip="Indicador de proximidade do limite: OK (<70%), Atenção (>=70%) e Crítico (>=90%)."
                    />
                  </th>
                  <th>
                    <HeaderWithTooltip
                      label="Progresso"
                      tooltip="Barra de proximidade do limite (maior uso entre RPM, TPM e RPD)."
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.models.map((item) => {
                  const progress = resolveModelProgress(item);
                  return (
                    <tr key={item.model}>
                      <td>{item.model}</td>
                      <td>{formatValue(item.current?.rpm)}</td>
                      <td>{formatValue(item.limits?.rpm)}</td>
                      <td>{formatPercent(item.utilization?.rpm_percent)}</td>
                      <td>{formatValue(item.current?.tpm)}</td>
                      <td>{formatValue(item.limits?.tpm)}</td>
                      <td>{formatPercent(item.utilization?.tpm_percent)}</td>
                      <td>{formatValue(item.current?.rpd)}</td>
                      <td>{formatValue(item.limits?.rpd)}</td>
                      <td>{formatPercent(item.utilization?.rpd_percent)}</td>
                      <td>
                        <span className={`admin-usage-status status-${item.status}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-usage-progress">
                          <div className="admin-usage-progress-track">
                            <div
                              className={`admin-usage-progress-fill tone-${progress.tone}`}
                              style={{ width: `${progress.value ?? 0}%` }}
                            />
                          </div>
                          <span className="admin-usage-progress-label">{progress.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-usage-subtitle">Uso por operação (histórico completo)</div>
          {!usageHistory.length ? (
            <p>Nenhum log de uso registrado ainda.</p>
          ) : (
            <>
              <div className="admin-usage-filters">
                <div className="admin-usage-filter-group">
                  <label htmlFor="filter-date-from">De</label>
                  <input
                    id="filter-date-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div className="admin-usage-filter-group">
                  <label htmlFor="filter-date-to">Até</label>
                  <input
                    id="filter-date-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
                <div className="admin-usage-filter-group">
                  <label htmlFor="filter-operation">Operação</label>
                  <select id="filter-operation" value={filterOperation} onChange={(e) => setFilterOperation(e.target.value)}>
                    <option value="">Todas</option>
                    {uniqueOperations.map((op) => (
                      <option key={op} value={op}>{formatOperationLabel(op)}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-usage-filter-group">
                  <label htmlFor="filter-model">Modelo</label>
                  <select id="filter-model" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                    <option value="">Todos</option>
                    {uniqueModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilter && (
                  <button type="button" className="admin-usage-filter-clear" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="admin-usage-table-wrapper-scrollable">
                <table className="admin-usage-table admin-usage-table-operations">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Modelo</th>
                      <th>Operação</th>
                      <th>Usuário</th>
                      <th>Duração (ms)</th>
                      <th>Tokens entrada</th>
                      <th>Tokens saída</th>
                      <th>Tokens total</th>
                      <th>
                        <HeaderWithTooltip
                          label="Custo (USD)"
                          tooltip="Estimativa de custo em dólares com base nos preços do Gemini API (verificados em 07/2026)."
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="admin-usage-empty-filter">Nenhum resultado para os filtros aplicados.</td>
                      </tr>
                    ) : (
                      filteredHistory.map((item, index) => (
                        <tr key={`${item.timestamp || 'ts'}-${item.model || 'model'}-${item.operation || 'op'}-${index}`}>
                          <td>{item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '—'}</td>
                          <td>{item.model || '—'}</td>
                          <td>{formatOperationLabel(item.operation)}</td>
                          <td>{item.username || item.user_id || '—'}</td>
                          <td>{formatNullableValue(item.duration_ms)}</td>
                          <td>{formatValue(item.input_tokens)}</td>
                          <td>{formatValue(item.output_tokens)}</td>
                          <td>{formatValue(item.total_tokens)}</td>
                          <td className="admin-usage-cost-cell">{formatCost(computeCost(item, data?.model_pricing))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="admin-usage-totals-row">
                      <td colSpan={5}>
                        Total ({filteredHistory.length.toLocaleString('pt-BR')}
                        {hasActiveFilter && usageHistory.length !== filteredHistory.length
                          ? ` de ${usageHistory.length.toLocaleString('pt-BR')}` : ''} operações)
                      </td>
                      <td>{formatValue(filteredHistory.reduce((acc, item) => acc + (item.input_tokens || 0), 0))}</td>
                      <td>{formatValue(filteredHistory.reduce((acc, item) => acc + (item.output_tokens || 0), 0))}</td>
                      <td>{formatValue(filteredHistory.reduce((acc, item) => acc + (item.total_tokens || 0), 0))}</td>
                      <td className="admin-usage-cost-cell">
                        {formatCost(filteredHistory.reduce((acc, item) => {
                          const c = computeCost(item, data?.model_pricing);
                          return acc + (c ?? 0);
                        }, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsagePage;
