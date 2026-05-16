import React, { useEffect, useState } from 'react';
import { depositosAPI } from '../utils/api';
import { Warehouse, Plus, Pencil, Trash2, X, Package } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="font-semibold text-zinc-100">{title}</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Depositos() {
  const [depositos, setDepositos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [estoque, setEstoque] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nome: '', descricao: '', responsavel: '' });
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => depositosAPI.listar().then(r => setDepositos(r.data));
  useEffect(() => { carregar(); }, []);

  const verEstoque = async (dep) => {
    setSelecionado(dep);
    const r = await depositosAPI.estoque(dep.id);
    setEstoque(r.data);
  };

  const abrirCriar = () => { setForm({ nome: '', descricao: '', responsavel: '' }); setEditId(null); setErro(''); setModal('form'); };
  const abrirEditar = (d) => { setForm({ nome: d.nome, descricao: d.descricao, responsavel: d.responsavel }); setEditId(d.id); setErro(''); setModal('form'); };

  const salvar = async () => {
    if (!form.nome.trim()) return setErro('Nome obrigatório');
    setSalvando(true); setErro('');
    try {
      if (editId) await depositosAPI.atualizar(editId, form);
      else await depositosAPI.criar(form);
      setModal(null); carregar();
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const deletar = async (id) => {
    if (!confirm('Remover depósito?')) return;
    await depositosAPI.deletar(id); carregar();
    if (selecionado?.id === id) setSelecionado(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Warehouse className="text-zinc-400" size={24} /> Depósitos</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie seus almoxarifados e locais de estoque</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary"><Plus size={16} /> Novo Depósito</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de depósitos */}
        <div className="space-y-3">
          {depositos.length === 0 ? (
            <div className="card p-8 text-center text-zinc-500 text-sm">Nenhum depósito cadastrado</div>
          ) : depositos.map(d => (
            <div key={d.id} onClick={() => verEstoque(d)}
              className={`card p-4 cursor-pointer transition-all hover:border-brand-500/30 ${selecionado?.id === d.id ? 'border-brand-500/50 bg-brand-500/5' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-zinc-100">{d.nome}</div>
                  {d.descricao && <div className="text-xs text-zinc-500 mt-0.5">{d.descricao}</div>}
                  {d.responsavel && <div className="text-xs text-zinc-500 mt-1">👤 {d.responsavel}</div>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); abrirEditar(d); }} className="btn-secondary py-1 px-2"><Pencil size={13} /></button>
                  <button onClick={e => { e.stopPropagation(); deletar(d.id); }} className="btn-danger py-1 px-2"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={e => { e.stopPropagation(); abrirEditar(d); }} className="btn-secondary py-1 px-2 text-xs"><Pencil size={11} /> Editar</button>
                <button onClick={e => { e.stopPropagation(); deletar(d.id); }} className="btn-danger py-1 px-2 text-xs"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Estoque do depósito selecionado */}
        <div className="lg:col-span-2">
          {selecionado ? (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                <Warehouse size={16} className="text-brand-400" />
                <span className="font-semibold text-zinc-200">{selecionado.nome}</span>
                <span className="text-xs text-zinc-500 ml-1">— Estoque atual</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="text-left px-4 py-3 text-xs text-zinc-500">Produto</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500">Categoria</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500">Qtd neste depósito</th>
                      <th className="text-left px-4 py-3 text-xs text-zinc-500">Total geral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {estoque.filter(p => p.qtd_deposito > 0).map(p => (
                      <tr key={p.id} className="hover:bg-zinc-800/20">
                        <td className="px-4 py-3 text-zinc-200">{p.nome}</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{p.categoria}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-brand-400">{p.qtd_deposito} {p.unidade}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{p.estoque_atual} {p.unidade}</td>
                      </tr>
                    ))}
                    {estoque.filter(p => p.qtd_deposito > 0).length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-zinc-600 text-sm">Nenhum produto neste depósito ainda</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Warehouse size={40} className="text-zinc-700 mx-auto mb-3" />
              <div className="text-zinc-500 text-sm">Selecione um depósito para ver o estoque</div>
            </div>
          )}
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Editar Depósito' : 'Novo Depósito'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Nome *</label><input className="input w-full" value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: Almoxarifado Central" /></div>
            <div><label className="label">Descrição</label><input className="input w-full" value={form.descricao} onChange={e => setForm(p=>({...p,descricao:e.target.value}))} placeholder="Descrição opcional" /></div>
            <div><label className="label">Responsável</label><input className="input w-full" value={form.responsavel} onChange={e => setForm(p=>({...p,responsavel:e.target.value}))} placeholder="Nome do responsável" /></div>
            {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">{salvando ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}</button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
