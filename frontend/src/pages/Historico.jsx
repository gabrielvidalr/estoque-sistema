import React, { useEffect, useState } from 'react';
import { movimentacoesAPI, produtosAPI } from '../utils/api';
import { ClipboardList, Filter, Download } from 'lucide-react';

export default function Historico() {
  const [movs, setMovs] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', produto_id: '', data_inicio: '', data_fim: '' });

  const carregar = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.produto_id) params.produto_id = filtros.produto_id;
    if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros.data_fim) params.data_fim = filtros.data_fim;

    movimentacoesAPI.listar(params)
      .then(r => setMovs(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { produtosAPI.listar().then(r => setProdutos(r.data)); }, []);
  useEffect(() => { carregar(); }, [filtros]);

  const exportCSV = () => {
    const header = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Motivo', 'Documento', 'Fornecedor/Cliente', 'Obs'];
    const rows = movs.map(m => [
      m.criado_em, m.produto_nome, m.tipo, m.quantidade, m.motivo, m.numero_documento, m.fornecedor_cliente, m.observacao
    ]);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'historico_estoque.csv'; a.click();
  };

  const f = (k, v) => setFiltros(prev => ({ ...prev, [k]: v }));

  const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0);
  const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="text-zinc-400" size={24} /> Histórico
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{movs.length} registro(s)</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-zinc-500" />
        <select className="input text-xs" value={filtros.tipo} onChange={e => f('tipo', e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <select className="input text-xs" value={filtros.produto_id} onChange={e => f('produto_id', e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <input type="date" className="input text-xs" value={filtros.data_inicio} onChange={e => f('data_inicio', e.target.value)} />
        <span className="text-zinc-600 text-xs">até</span>
        <input type="date" className="input text-xs" value={filtros.data_fim} onChange={e => f('data_fim', e.target.value)} />
        <button onClick={() => setFiltros({ tipo: '', produto_id: '', data_inicio: '', data_fim: '' })} className="text-xs text-zinc-500 hover:text-zinc-300">
          Limpar
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-xs text-zinc-500 mb-1">Total registros</div>
          <div className="text-xl font-bold text-white">{movs.length}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-zinc-500 mb-1">Total Entradas</div>
          <div className="text-xl font-bold text-brand-400">+{totalEntradas}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-zinc-500 mb-1">Total Saídas</div>
          <div className="text-xl font-bold text-red-400">-{totalSaidas}</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : movs.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">Nenhuma movimentação encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  {['Data', 'Produto', 'Tipo', 'Qtd', 'Motivo', 'Documento', 'Fornec./Cliente'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {movs.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap font-mono">{m.criado_em?.slice(0, 16)}</td>
                    <td className="px-4 py-3 text-zinc-200 max-w-[160px] truncate">{m.produto_nome}</td>
                    <td className="px-4 py-3">
                      {m.tipo === 'entrada' ? <span className="badge-entrada">Entrada</span> : <span className="badge-saida">Saída</span>}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      <span className={m.tipo === 'entrada' ? 'text-brand-400' : 'text-red-400'}>
                        {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs capitalize">{m.motivo || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{m.numero_documento || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-[120px]">{m.fornecedor_cliente || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
