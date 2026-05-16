import React, { useState } from 'react';
import { seriesAPI } from '../utils/api';
import { QrCode, Search, CheckCircle, XCircle, Package } from 'lucide-react';

export default function SeriesBusca() {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const pesquisar = async () => {
    if (!busca.trim()) return;
    setLoading(true); setErro(''); setResultado(null);
    try {
      const r = await seriesAPI.buscarNumero(busca.trim());
      setResultado(r.data);
    } catch (e) {
      setErro(e.response?.status === 404 ? 'Número de série não encontrado.' : 'Erro ao buscar.');
    } finally { setLoading(false); }
  };

  const statusLabel = {
    disponivel: { label: 'Disponível em estoque', color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20', icon: CheckCircle },
    saida: { label: 'Baixado (saída)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <QrCode className="text-zinc-400" size={24} /> Busca por Número de Série
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Rastreie qualquer item pelo seu número de série</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Número de Série</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ex: SN-123456"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pesquisar()}
            />
            <button onClick={pesquisar} disabled={loading} className="btn-primary">
              <Search size={15} /> Buscar
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {erro && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {erro}
          </div>
        )}

        {resultado && (() => {
          const status = statusLabel[resultado.status] || statusLabel.disponivel;
          const Icon = status.icon;
          return (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${status.bg}`}>
                <Icon size={18} className={status.color} />
                <div>
                  <div className={`text-sm font-semibold ${status.color}`}>{status.label}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
                  <Package size={16} className="text-zinc-400" />
                  <div>
                    <div className="text-xs text-zinc-500">Produto</div>
                    <div className="text-sm text-zinc-100 font-medium">{resultado.produto_nome}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-800 rounded-xl">
                    <div className="text-xs text-zinc-500 mb-1">Número de Série</div>
                    <div className="text-sm font-mono text-zinc-100">{resultado.numero_serie}</div>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-xl">
                    <div className="text-xs text-zinc-500 mb-1">Data de Entrada</div>
                    <div className="text-sm text-zinc-100">{resultado.criado_em?.slice(0, 16)}</div>
                  </div>
                  {resultado.nota_entrada && (
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Nota de Entrada</div>
                      <div className="text-sm font-mono text-zinc-100">{resultado.nota_entrada}</div>
                    </div>
                  )}
                  {resultado.nota_saida && (
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Nota de Saída</div>
                      <div className="text-sm font-mono text-zinc-100">{resultado.nota_saida}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium text-zinc-400 mb-3">💡 Como usar</div>
        <ul className="space-y-2 text-sm text-zinc-500">
          <li>• Ao registrar uma <span className="text-brand-400">entrada</span>, adicione o número de série do item</li>
          <li>• Ao registrar uma <span className="text-red-400">saída</span>, selecione o número de série que está saindo</li>
          <li>• Use esta tela para verificar se um item está disponível ou já foi baixado</li>
          <li>• O número de série pode ser o código do fabricante, patrimônio, etc.</li>
        </ul>
      </div>
    </div>
  );
}
