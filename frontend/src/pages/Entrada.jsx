import React, { useEffect, useState } from 'react';
import { produtosAPI, movimentacoesAPI, depositosAPI } from '../utils/api';
import { ArrowDownCircle, Plus, X, Search, CheckCircle, Warehouse } from 'lucide-react';

export default function Entrada() {
  const [produtos, setProdutos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('compra');
  const [documento, setDocumento] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [obs, setObs] = useState('');
  const [series, setSeries] = useState([]);
  const [novoSerie, setNovoSerie] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => {
    produtosAPI.listar().then(r => setProdutos(r.data));
    depositosAPI.listar().then(r => { setDepositos(r.data); if (r.data.length > 0) setDepositoId(r.data[0].id); });
  }, []);

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) || p.categoria?.toLowerCase().includes(buscaProduto.toLowerCase()));
  const produtoSelecionado = produtos.find(p => p.id === produtoId);

  const addSerie = () => {
    const s = novoSerie.trim();
    if (!s) return;
    if (series.includes(s)) return setErro('Número de série já adicionado');
    setSeries([...series, s]); setNovoSerie(''); setErro('');
  };

  const registrar = async () => {
    if (!produtoId) return setErro('Selecione um produto');
    if (quantidade < 1) return setErro('Quantidade inválida');
    if (series.length > 0 && series.length !== quantidade) return setErro(`Você adicionou ${series.length} série(s), mas a quantidade é ${quantidade}`);
    setLoading(true); setErro(''); setSucesso('');
    try {
      await movimentacoesAPI.registrar({ produto_id: produtoId, deposito_destino_id: depositoId || undefined, tipo: 'entrada', quantidade, motivo, numero_documento: documento, fornecedor_cliente: fornecedor, observacao: obs, series: series.length > 0 ? series : undefined });
      setSucesso(`Entrada de ${quantidade} "${produtoSelecionado.nome}" registrada!`);
      setProdutoId(''); setQuantidade(1); setDocumento(''); setFornecedor(''); setObs(''); setSeries([]); setBuscaProduto('');
      produtosAPI.listar().then(r => setProdutos(r.data));
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao registrar entrada'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><ArrowDownCircle className="text-brand-400" size={24} /> Entrada de Mercadoria</h1>
        <p className="text-zinc-500 text-sm mt-1">Registrar entrada de produtos no estoque</p>
      </div>

      {sucesso && <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3"><CheckCircle size={16} className="text-brand-400 shrink-0" /><span className="text-brand-300 text-sm">{sucesso}</span></div>}

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Produto *</label>
          <div className="relative mb-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="input w-full pl-9" placeholder="Buscar produto..." value={buscaProduto} onChange={e => { setBuscaProduto(e.target.value); if (produtoId) setProdutoId(''); }} />
          </div>
          {buscaProduto && !produtoId && (
            <div className="card border border-zinc-700 max-h-48 overflow-y-auto">
              {produtosFiltrados.length === 0 ? <div className="px-4 py-3 text-zinc-500 text-sm">Nenhum produto encontrado</div>
                : produtosFiltrados.map(p => (
                  <button key={p.id} onClick={() => { setProdutoId(p.id); setBuscaProduto(p.nome); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 text-sm">
                    <span className="text-zinc-100">{p.nome}</span><span className="text-zinc-500 ml-2 text-xs">{p.categoria}</span><span className="text-brand-400 ml-2 text-xs font-mono">Estoque: {p.estoque_atual}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1"><Warehouse size={13} /> Depósito de destino</label>
          <select className="input w-full" value={depositoId} onChange={e => setDepositoId(e.target.value)}>
            <option value="">Sem depósito específico</option>
            {depositos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Quantidade *</label><input type="number" className="input w-full" min={1} value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value)||1)} /></div>
          <div><label className="label">Motivo</label>
            <select className="input w-full" value={motivo} onChange={e => setMotivo(e.target.value)}>
              <option value="compra">Compra</option><option value="devolucao">Devolução</option>
              <option value="ajuste">Ajuste de Inventário</option><option value="transferencia">Transferência</option><option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nº Nota / Documento</label><input className="input w-full" placeholder="NF-001234" value={documento} onChange={e => setDocumento(e.target.value)} /></div>
          <div><label className="label">Fornecedor</label><input className="input w-full" placeholder="Nome do fornecedor" value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
        </div>

        <div><label className="label">Observação</label><textarea className="input w-full h-16 resize-none" value={obs} onChange={e => setObs(e.target.value)} /></div>

        <div>
          <label className="label">Números de Série (opcional)</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Ex: SN-123456" value={novoSerie} onChange={e => setNovoSerie(e.target.value)} onKeyDown={e => e.key==='Enter' && addSerie()} />
            <button onClick={addSerie} className="btn-secondary"><Plus size={15} /></button>
          </div>
          {series.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{series.map(s => <span key={s} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs px-2.5 py-1 rounded-lg font-mono">{s}<button onClick={() => setSeries(series.filter(x=>x!==s))} className="text-zinc-500 hover:text-red-400"><X size={12}/></button></span>)}</div>}
          {series.length > 0 && <div className="text-xs text-zinc-500 mt-1">{series.length} de {quantidade} {series.length===quantidade?'✓':`(faltam ${quantidade-series.length})`}</div>}
        </div>

        {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
        <button onClick={registrar} disabled={loading} className="btn-primary w-full justify-center py-3">
          <ArrowDownCircle size={16} />{loading ? 'Registrando...' : 'Registrar Entrada'}
        </button>
      </div>
    </div>
  );
}
