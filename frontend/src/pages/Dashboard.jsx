import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

function StatCard({ icon: Icon, label, value, color = 'brand', sub }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon size={18} className={colors[color].split(' ')[0]} />
      </div>
      <div>
        <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.dados()
      .then(r => setDados(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!dados) return <div className="text-zinc-500 text-sm">Erro ao carregar dashboard.</div>;

  const chartData = dados.movPorDia.map(d => ({
    dia: d.dia?.slice(5),
    Entradas: d.entradas,
    Saídas: d.saidas,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Visão geral do estoque</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total de Produtos" value={dados.totalProdutos} color="brand" />
        <StatCard icon={TrendingUp} label="Itens em Estoque" value={dados.totalItens} color="blue" />
        <StatCard icon={ArrowDownCircle} label="Entradas Hoje" value={dados.entradasHoje} color="brand" />
        <StatCard icon={AlertTriangle} label="Estoque Baixo" value={dados.baixoEstoque} color={dados.baixoEstoque > 0 ? 'amber' : 'brand'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-300 mb-4">Movimentações — 7 dias</div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">Sem movimentações ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="dia" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#e4e4e7' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estoque baixo */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <div className="text-sm font-semibold text-zinc-300">Estoque Crítico</div>
          </div>
          {dados.produtosBaixo.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center py-6">✅ Tudo em ordem!</div>
          ) : (
            <div className="space-y-3">
              {dados.produtosBaixo.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-zinc-200 font-medium truncate max-w-[130px]">{p.nome}</div>
                    <div className="text-xs text-zinc-500">Mín: {p.estoque_minimo}</div>
                  </div>
                  <span className={`text-sm font-bold ${p.estoque_atual === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {p.estoque_atual} {p.unidade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Movimentações recentes */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-zinc-400" />
          <div className="text-sm font-semibold text-zinc-300">Movimentações Recentes</div>
        </div>
        {dados.movRecentes.length === 0 ? (
          <div className="text-zinc-600 text-sm text-center py-6">Nenhuma movimentação ainda</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-medium pb-3">Produto</th>
                  <th className="text-left text-xs text-zinc-500 font-medium pb-3">Tipo</th>
                  <th className="text-left text-xs text-zinc-500 font-medium pb-3">Qtd</th>
                  <th className="text-left text-xs text-zinc-500 font-medium pb-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {dados.movRecentes.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 text-zinc-200">{m.produto_nome}</td>
                    <td className="py-2.5">
                      {m.tipo === 'entrada'
                        ? <span className="badge-entrada">Entrada</span>
                        : <span className="badge-saida">Saída</span>}
                    </td>
                    <td className="py-2.5 font-mono text-zinc-300">{m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}</td>
                    <td className="py-2.5 text-zinc-500 text-xs">{m.criado_em?.slice(0, 16)}</td>
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
