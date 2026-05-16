import React, { useEffect, useState } from 'react';
import { produtosAPI, movimentacoesAPI, depositosAPI } from '../utils/api';
import { ArrowUpCircle, Plus, X, Search, CheckCircle, AlertTriangle, Warehouse } from 'lucide-react';

export default function Saida() {
  const [produtos, setProdutos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('venda');
  const [documento, setDocumento] = useState('');
  const [cliente, setCliente] = useState('');
  const [obs, setObs] = useState('');
  const [seriesDisponiveis, setSeriesDisponiveis] = useState([]);
  const [seriesSelecionadas, setSeriesSelecionadas] = useState([]);
  const [novoSerie, setNovoSerie] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => {
    produtosAPI.listar().then(r => setProdutos(r.data));
    depositosAPI.listar().then(r => { setDepositos(r.data); if (r.data.length > 0) setDepositoId(r.data[0].id); });
  }, []);

  useEffect(() => {
    if (produtoId) { produtosAPI.series(produtoId).then(r => { setSeriesDisponiveis(r.data.filter(s => s.status==='disponivel')); setSeriesSelecionadas([]); }); }
  }, [produtoId]);

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()));
  const produtoSelecionado = produtos.find(p => p.id === produtoId);

  const registrar = async () => {
    if (!produtoId) return setErro('Selecione um produto');
    if (quantidade < 1) return setErro('Quantidade inválida');
    if (produtoSelecionado && produtoSelecionado.estoque_atual < quantidade) return setErro('Estoque insuficiente');
    if (seriesSelecionadas.length > 0 && seriesSelecionadas.length !== quantidade) return setErro(`Selecione exatamente ${quantidade} série(s)`);
    setLoading(true); setErro(''); setSucesso('');
    try {
      await movimentacoesAPI.registrar({ produto_id: produtoId, deposito_origem_id: depositoId || undefined, tipo: 'saida', quantidade, motivo, numero_documento: documento, fornecedor_cliente: cliente, observacao: obs, series: seriesSelecionadas.length > 0 ? seriesSelecionadas : undefined });
      setSucesso(`Saída de ${quantidade} "${produtoSelecionado.nome}" registrada!`);
      setProdutoId(''); setQuantidade(1); setDocumento(''); setCliente(''); setObs(''); setSeriesSelecionadas([]); setBuscaProduto('');
      produtosAPI.listar().then(r => setProdutos(r.data));
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao registrar saída'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><ArrowUpCircle className="text-red-400" size={24} /> Saída de Mercadoria</h1>
        <p className="text-zinc-500 text-sm mt-1">Registrar saída de produtos do estoque</p>
      </div>

      {sucesso && <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3"><CheckCircle size={16} className="text-brand-400 shrink-0"/><span className="text-brand-300 text-sm">{sucesso}</span></div>}

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Produto *</label>
          <div className="relative mb-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input className="input w-full pl-9" placeholder="Buscar produto..." value={buscaProduto} onChange={e => { setBuscaProduto(e.target.value); if (produtoId) setProdutoId(''); }} />
          </div>
          {buscaProduto && !produtoId && (
            <div className="card border border-zinc-700 max-h-48 overflow-y-auto">
              {produtosFiltrados.length === 0 ? <div className="px-4 py-3 text-zinc-500 text-sm">Nenhum produto encontrado</div>
                : produtosFiltrados.map(p => (
                  <button key={p.id} onClick={() => { setProdutoId(p.id); setBuscaProduto(p.nome); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 text-sm">
                    <span className="text-zinc-100">{p.nome}</span><span className={`ml-2 text-xs font-mono ${p.estoque_atual===0?'text-red-400':'text-brand-400'}`}>Estoque: {p.estoque_atual}</span>
                  </button>
                ))}
            </div>
          )}
          {produtoSelecionado && (
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-zinc-800 px-2 py-1 rounded-lg text-xs text-zinc-400">Estoque: <span className={`font-mono font-semibold ${produtoSelecionado.estoque_atual===0?'text-red-400':'text-brand-400'}`}>{produtoSelecionado.estoque_atual} {produtoSelecionado.unidade}</span></span>
              {produtoSelecionado.estoque_atual === 0 && <span className="badge-saida flex items-center gap-1"><AlertTriangle size={10}/> Sem estoque</span>}
            </div>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1"><Warehouse size={13}/> Depósito de origem</label>
          <select className="input w-full" value={depositoId} onChange={e => setDepositoId(e.target.value)}>
            <option value="">Sem depósito específico</option>
            {depositos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Quantidade *</label><input type="number" className="input w-full" min={1} max={produtoSelecionado?.estoque_atual} value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value)||1)} /></div>
          <div><label className="label">Motivo</label>
            <select className="input w-full" value={motivo} onChange={e => setMotivo(e.target.value)}>
              <option value="venda">Venda</option><option value="consumo">Consumo Interno</option>
              <option value="devolucao">Devolução ao Fornecedor</option><option value="perda">Perda / Avaria</option>
              <option value="transferencia">Transferência</option><option value="ajuste">Ajuste</option><option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nº Nota / Documento</label><input className="input w-full" placeholder="NF-001234" value={documento} onChange={e => setDocumento(e.target.value)} /></div>
          <div><label className="label">Cliente</label><input className="input w-full" placeholder="Nome do cliente" value={cliente} onChange={e => setCliente(e.target.value)} /></div>
        </div>

        <div><label className="label">Observação</label><textarea className="input w-full h-16 resize-none" value={obs} onChange={e => setObs(e.target.value)} /></div>

        {produtoId && seriesDisponiveis.length > 0 && (
          <div>
            <label className="label">Números de Série (selecione os que vão sair)</label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {seriesDisponiveis.map(s => (
                <button key={s.id} onClick={() => setSeriesSelecionadas(prev => prev.includes(s.numero_serie) ? prev.filter(x=>x!==s.numero_serie) : [...prev, s.numero_serie])}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-mono border transition-all ${seriesSelecionadas.includes(s.numero_serie)?'bg-red-500/15 border-red-500/30 text-red-300':'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'}`}>
                  {s.numero_serie}
                </button>
              ))}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{seriesSelecionadas.length} selecionado(s)</div>
          </div>
        )}

        {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
        <button onClick={registrar} disabled={loading} className="bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center gap-2 w-full justify-center text-sm">
          <ArrowUpCircle size={16}/>{loading?'Registrando...':'Registrar Saída'}
        </button>
      </div>
    </div>
  );
}
