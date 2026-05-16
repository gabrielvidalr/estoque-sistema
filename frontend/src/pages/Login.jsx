import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { Package, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@estoque.com');
  const [senha, setSenha] = useState('admin123');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    setLoading(true); setErro('');
    try {
      const r = await authAPI.login({ email, senha });
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('usuario', JSON.stringify(r.data.usuario));
      onLogin(r.data.usuario);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EstoqueID</h1>
          <p className="text-zinc-500 text-sm mt-1">Sistema de Gestão de Estoque</p>
        </div>

        <form onSubmit={entrar} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <input className="input w-full pr-10" type={show ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erro}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            <LogIn size={16} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-zinc-600">
          Acesso padrão: admin@estoque.com / admin123
        </div>
      </div>
    </div>
  );
}
