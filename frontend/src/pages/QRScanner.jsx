import React, { useEffect, useRef, useState } from 'react';
import { seriesAPI } from '../utils/api';
import { QrCode, Camera, CameraOff, Search, CheckCircle, XCircle, Package, Warehouse } from 'lucide-react';

export default function QRScanner() {
  const [modo, setModo] = useState('manual'); // 'manual' | 'camera'
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const pesquisar = async (valor) => {
    const v = (valor || busca).trim();
    if (!v) return;
    setLoading(true); setErro(''); setResultado(null);
    try {
      const r = await seriesAPI.buscarNumero(v);
      setResultado(r.data);
    } catch (e) {
      setErro(e.response?.status === 404 ? 'Número de série não encontrado.' : 'Erro ao buscar.');
    } finally { setLoading(false); }
  };

  const iniciarScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (texto) => {
          setBusca(texto);
          pesquisar(texto);
          pararScanner();
        },
        () => {}
      );
      setScannerAtivo(true);
    } catch (e) {
      setErro('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const pararScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
    }
    setScannerAtivo(false);
  };

  useEffect(() => () => { pararScanner(); }, []);

  const statusInfo = {
    disponivel: { label: 'Disponível em estoque', color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20', Icon: CheckCircle },
    saida: { label: 'Baixado (saída registrada)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', Icon: XCircle },
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><QrCode className="text-zinc-400" size={24} /> Leitor QR / Código de Barras</h1>
        <p className="text-zinc-500 text-sm mt-1">Rastreie itens pelo número de série ou QR Code</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-fit">
        <button onClick={() => { setModo('manual'); pararScanner(); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${modo==='manual' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <Search size={14} /> Busca Manual
        </button>
        <button onClick={() => setModo('camera')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${modo==='camera' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <Camera size={14} /> Câmera
        </button>
      </div>

      <div className="card p-6 space-y-4">
        {modo === 'manual' ? (
          <div>
            <label className="label">Número de Série / Código</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Ex: SN-123456 ou escaneie o código"
                value={busca} onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && pesquisar()} />
              <button onClick={() => pesquisar()} disabled={loading} className="btn-primary">
                <Search size={15} /> Buscar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div id="qr-reader" className="rounded-xl overflow-hidden bg-zinc-800 min-h-[250px] flex items-center justify-center">
              {!scannerAtivo && <div className="text-zinc-500 text-sm text-center p-8"><Camera size={40} className="mx-auto mb-3 text-zinc-700" /><p>Clique em "Ativar Câmera" para escanear</p></div>}
            </div>
            <button onClick={scannerAtivo ? pararScanner : iniciarScanner} className={scannerAtivo ? 'btn-danger w-full justify-center' : 'btn-primary w-full justify-center'}>
              {scannerAtivo ? <><CameraOff size={16} /> Parar câmera</> : <><Camera size={16} /> Ativar Câmera</>}
            </button>
            {busca && <div className="text-xs text-zinc-400 font-mono bg-zinc-800 px-3 py-2 rounded-lg">Último lido: {busca}</div>}
          </div>
        )}

        {loading && <div className="flex justify-center py-6"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}
        {erro && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{erro}</div>}

        {resultado && (() => {
          const info = statusInfo[resultado.status] || statusInfo.disponivel;
          return (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${info.bg}`}>
                <info.Icon size={18} className={info.color} />
                <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Package size={11} /> Produto</div>
                  <div className="text-sm text-zinc-100 font-medium">{resultado.produto_nome}</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Número de Série</div>
                  <div className="text-sm font-mono text-zinc-100">{resultado.numero_serie}</div>
                </div>
                {resultado.deposito_nome && (
                  <div className="p-3 bg-zinc-800 rounded-xl">
                    <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Warehouse size={11} /> Depósito</div>
                    <div className="text-sm text-zinc-100">{resultado.deposito_nome}</div>
                  </div>
                )}
                <div className="p-3 bg-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Entrada em</div>
                  <div className="text-sm text-zinc-100">{resultado.criado_em?.slice(0,16)}</div>
                </div>
                {resultado.nota_entrada && <div className="p-3 bg-zinc-800 rounded-xl"><div className="text-xs text-zinc-500 mb-1">NF Entrada</div><div className="text-sm font-mono">{resultado.nota_entrada}</div></div>}
                {resultado.nota_saida && <div className="p-3 bg-zinc-800 rounded-xl"><div className="text-xs text-zinc-500 mb-1">NF Saída</div><div className="text-sm font-mono">{resultado.nota_saida}</div></div>}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium text-zinc-400 mb-3">💡 Como usar o leitor</div>
        <ul className="space-y-1.5 text-sm text-zinc-500">
          <li>• Use <strong className="text-zinc-400">Busca Manual</strong> para digitar ou colar o código</li>
          <li>• Use <strong className="text-zinc-400">Câmera</strong> para escanear QR Code ou código de barras</li>
          <li>• Funciona com qualquer código impresso na embalagem</li>
          <li>• O sistema mostra onde o item está e seu status</li>
        </ul>
      </div>
    </div>
  );
}
