import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import './AdminUsagePage.css';

const formatValue = (value) => (value === null || value === undefined ? 'Não configurado' : value.toLocaleString('pt-BR'));

const formatPercent = (value) => (value === null || value === undefined ? '—' : `${value.toFixed(2)}%`);

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
              </tr>
            </thead>
            <tbody>
              {data.models.map((item) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsagePage;
