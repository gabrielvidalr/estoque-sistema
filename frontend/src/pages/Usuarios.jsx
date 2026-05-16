import React, { useEffect, useState } from 'react';
import { usuariosAPI } from '../utils/api';
import { Users, Plus, Pencil, X, Shield, User } from 'lucide-react';

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

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'operador', ativo: true });
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => usuariosAPI.listar().then(r => setUsuarios(r.data));
  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => { setForm({ nome:'', email:'', senha:'', perfil:'operador', ativo:true }); setEditId(null); setErro(''); setModal('form'); };
  const abrirEditar = (u) => { setForm({ nome:u.nome, email:u.email, senha:'', perfil:u.perfil, ativo:u.ativo===1 }); setEditId(u.id); setErro(''); setModal('form'); };

  const salvar = async () => {
    if (!form.nome || !form.email) return setErro('Nome e email obrigatórios');
    if (!editId && !form.senha) return setErro('Senha obrigatória para novo usuário');
    setSalvando(true); setErro('');
    try {
      const data = { ...form };
      if (!data.senha) delete data.senha;
      if (editId) await usuariosAPI.atualizar(editId, data);
      else await usuariosAPI.criar(data);
      setModal(null); carregar();
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao salvar'); }
    finally { setSalvando(false); }
  };

  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Users className="text-zinc-400" size={24} /> Usuários</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie quem tem acesso ao sistema</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary"><Plus size={16} /> Novo Usuário</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {['Usuário', 'Email', 'Perfil', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-zinc-800/20 group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-zinc-200 font-medium">{u.nome}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{u.email}</td>
                <td className="px-5 py-3">
                  {u.perfil === 'admin'
                    ? <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit"><Shield size={10} /> Admin</span>
                    : <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-700 px-2 py-0.5 rounded-full w-fit"><User size={10} /> Operador</span>
                  }
                </td>
                <td className="px-5 py-3">
                  {u.ativo === 1
                    ? <span className="text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">Ativo</span>
                    : <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Inativo</span>
                  }
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => abrirEditar(u)} className="btn-secondary py-1 px-2 opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Nome *</label><input className="input w-full" value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome completo" /></div>
            <div><label className="label">Email *</label><input type="email" className="input w-full" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@empresa.com" disabled={!!editId} /></div>
            <div><label className="label">{editId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label><input type="password" className="input w-full" value={form.senha} onChange={e => f('senha', e.target.value)} placeholder="••••••••" /></div>
            <div><label className="label">Perfil</label>
              <select className="input w-full" value={form.perfil} onChange={e => f('perfil', e.target.value)}>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {editId && (
              <div className="flex items-center gap-3">
                <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => f('ativo', e.target.checked)} className="w-4 h-4 accent-brand-500" />
                <label htmlFor="ativo" className="text-sm text-zinc-300">Usuário ativo</label>
              </div>
            )}
            {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">{salvando ? 'Salvando...' : editId ? 'Salvar' : 'Criar Usuário'}</button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
