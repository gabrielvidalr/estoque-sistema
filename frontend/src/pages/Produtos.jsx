import React, { useEffect, useState } from 'react';
import { produtosAPI, categoriasAPI } from '../utils/api';
import { Plus, Search, Pencil, Trash2, AlertTriangle, X, Package } from 'lucide-react';

const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pc', 'par', 'm', 'rolo'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="font-semibold text-zinc-100">{title}</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const EMPTY = { nome: '', descricao: '', categoria: '', unidade: 'un', estoque_minimo: 0, preco_custo: 0, localizacao: '' };

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBaixo, setFiltroBaixo] = useState(false);
  const [modal, setModal] = useState(null); // null | 'criar' | 'editar'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => {
    setLoading(true);
    const params = {};
    if (busca) params.busca = busca;
    if (filtroCategoria) params.categoria = filtroCategoria;
    if (filtroBaixo) params.baixo_estoque = true;

    Promise.all([
      produtosAPI.listar(params),
      categoriasAPI.listar(),
    ]).then(([p, c]) => {
      setProdutos(p.data);
      setCategorias(c.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [busca, filtroCategoria, filtroBaixo]);

  const abrirCriar = () => { setForm(EMPTY); setEditId(null); setErro(''); setModal('form'); };
  const abrirEditar = (p) => {
    setForm({ nome: p.nome, descricao: p.descricao, categoria: p.categoria, unidade: p.unidade, estoque_minimo: p.estoque_minimo, preco_custo: p.preco_custo, localizacao: p.localizacao });
    setEditId(p.id); setErro(''); setModal('form');
  };

  const salvar = async () => {
    if (!form.nome.trim()) return setErro('Nome é obrigatório');
    setSalvando(true); setErro('');
    try {
      if (editId) await produtosAPI.atualizar(editId, form);
      else await produtosAPI.criar(form);
      setModal(null);
      carregar();
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao salvar');
    } finally { setSalvando(false); }
  };

  const deletar = async (id, nome) => {
    if (!confirm(`Remover "${nome}"?`)) return;
    await produtosAPI.deletar(id);
    carregar();
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-zinc-500 text-sm mt-1">{produtos.length} produto(s) encontrado(s)</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input w-full pl-9" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="input" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setFiltroBaixo(!filtroBaixo)}
          className={`btn-secondary ${filtroBaixo ? 'border border-amber-500/40 text-amber-400' : ''}`}
        >
          <AlertTriangle size={14} /> Baixo estoque
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : produtos.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={40} className="text-zinc-700 mx-auto mb-3" />
          <div className="text-zinc-500 text-sm">Nenhum produto encontrado</div>
          <button onClick={abrirCriar} className="btn-primary mx-auto mt-4"><Plus size={16} /> Cadastrar produto</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Produto</th>
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Categoria</th>
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Estoque</th>
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Mínimo</th>
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Local</th>
                  <th className="text-right px-5 py-3 text-xs text-zinc-500 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {produtos.map(p => {
                  const baixo = p.estoque_atual <= p.estoque_minimo && p.estoque_minimo > 0;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-100">{p.nome}</div>
                        {p.descricao && <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{p.descricao}</div>}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{p.categoria}</td>
                      <td className="px-5 py-3">
                        <span className={`font-mono font-semibold ${baixo ? 'text-amber-400' : 'text-brand-400'}`}>
                          {p.estoque_atual} {p.unidade}
                        </span>
                        {baixo && <span className="ml-2 badge-alerta">Baixo</span>}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 font-mono">{p.estoque_minimo}</td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">{p.localizacao || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => abrirEditar(p)} className="btn-secondary py-1 px-2">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deletar(p.id, p.nome)} className="btn-danger py-1 px-2">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal form */}
      {modal === 'form' && (
        <Modal title={editId ? 'Editar Produto' : 'Novo Produto'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input w-full" placeholder="Ex: Parafuso M8" value={form.nome} onChange={e => f('nome', e.target.value)} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input w-full h-20 resize-none" placeholder="Descrição opcional" value={form.descricao} onChange={e => f('descricao', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Categoria</label>
                <input className="input w-full" placeholder="Ex: Ferragens" value={form.categoria} onChange={e => f('categoria', e.target.value)} list="cats" />
                <datalist id="cats">{categorias.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="label">Unidade</label>
                <select className="input w-full" value={form.unidade} onChange={e => f('unidade', e.target.value)}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Estoque Mínimo</label>
                <input type="number" className="input w-full" min={0} value={form.estoque_minimo} onChange={e => f('estoque_minimo', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Preço de Custo (R$)</label>
                <input type="number" className="input w-full" min={0} step={0.01} value={form.preco_custo} onChange={e => f('preco_custo', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label className="label">Localização no Estoque</label>
              <input className="input w-full" placeholder="Ex: Prateleira A2" value={form.localizacao} onChange={e => f('localizacao', e.target.value)} />
            </div>
            {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Criar Produto')}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
