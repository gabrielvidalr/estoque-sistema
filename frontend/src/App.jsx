import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle,
  ClipboardList, QrCode, Menu, X, Warehouse, FileText,
  Users, LogOut, ChevronDown, Shield, User
} from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Entrada from './pages/Entrada';
import Saida from './pages/Saida';
import Historico from './pages/Historico';
import QRScanner from './pages/QRScanner';
import Depositos from './pages/Depositos';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/entrada', icon: ArrowDownCircle, label: 'Entrada' },
  { to: '/saida', icon: ArrowUpCircle, label: 'Saída' },
  { to: '/depositos', icon: Warehouse, label: 'Depósitos' },
  { to: '/historico', icon: ClipboardList, label: 'Histórico' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/scanner', icon: QrCode, label: 'QR / Série' },
];

const NAV_ADMIN = [
  { to: '/usuarios', icon: Users, label: 'Usuários' },
];

function Sidebar({ usuario, onLogout, mobile, onClose }) {
  return (
    <aside className={mobile ? '' : 'flex flex-col w-60 bg-zinc-900 border-r border-zinc-800 fixed top-0 left-0 h-full z-30'}>
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Package size={16} className="text-white" /></div>
          <div><div className="text-sm font-bold text-white">EstoqueID</div><div className="text-xs text-zinc-500">Gestão de Estoque</div></div>
          {mobile && <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-white"><X size={18} /></button>}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'} onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}

        {usuario?.perfil === 'admin' && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs text-zinc-600 font-medium uppercase tracking-wider">Administração</div>
            {NAV_ADMIN.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
                <Icon size={17} />{label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-zinc-800/50">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate">{usuario?.nome}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              {usuario?.perfil === 'admin' ? <><Shield size={9} /> Admin</> : <><User size={9} /> Operador</>}
            </div>
          </div>
          <button onClick={onLogout} title="Sair" className="text-zinc-500 hover:text-red-400 transition-colors"><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = (u) => setUsuario(u);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (!usuario) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex flex-col w-60">
          <Sidebar usuario={usuario} onLogout={handleLogout} />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><Package size={14} className="text-white" /></div>
            <span className="text-sm font-bold">EstoqueID</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-zinc-400 hover:text-white">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-zinc-950/90 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
            <div className="absolute top-0 left-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col" onClick={e => e.stopPropagation()}>
              <Sidebar usuario={usuario} onLogout={handleLogout} mobile onClose={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/entrada" element={<Entrada />} />
              <Route path="/saida" element={<Saida />} />
              <Route path="/depositos" element={<Depositos />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/scanner" element={<QRScanner />} />
              {usuario?.perfil === 'admin' && <Route path="/usuarios" element={<Usuarios />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
