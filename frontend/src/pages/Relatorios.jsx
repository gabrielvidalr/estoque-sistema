import React, { useState } from 'react';
import { produtosAPI, movimentacoesAPI } from '../utils/api';
import { FileText, Download, Package, ClipboardList, AlertTriangle } from 'lucide-react';

async function gerarPDF(tipo, filtros) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  const agora = new Date().toLocaleString('pt-BR');

  // Header
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('EstoqueID — Sistema de Gestão', 14, 12);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${agora}`, 14, 22);

  doc.setTextColor(30, 30, 30);

  if (tipo === 'produtos') {
    const r = await produtosAPI.listar(filtros);
    const produtos = r.data;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Produtos', 14, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total: ${produtos.length} produto(s)`, 14, 48);

    doc.autoTable({
      startY: 54,
      head: [['Produto', 'Categoria', 'Estoque', 'Mínimo', 'Unidade', 'Localização']],
      body: produtos.map(p => [p.nome, p.categoria, p.estoque_atual, p.estoque_minimo, p.unidade, p.localizacao || '—']),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

  } else if (tipo === 'baixo_estoque') {
    const r = await produtosAPI.listar({ baixo_estoque: true });
    const produtos = r.data;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório — Estoque Crítico', 14, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${produtos.length} produto(s) abaixo do mínimo`, 14, 48);

    doc.autoTable({
      startY: 54,
      head: [['Produto', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Diferença', 'Unidade']],
      body: produtos.map(p => [p.nome, p.categoria, p.estoque_atual, p.estoque_minimo, p.estoque_atual - p.estoque_minimo, p.unidade]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      bodyStyles: {},
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.raw < 0) data.cell.styles.textColor = [239, 68, 68];
        }
      }
    });

  } else if (tipo === 'movimentacoes') {
    const r = await movimentacoesAPI.listar({ ...filtros, limit: 500 });
    const movs = r.data;
    const entradas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0);
    const saidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Movimentações', 14, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total: ${movs.length} registro(s) | Entradas: +${entradas} | Saídas: -${saidas}`, 14, 48);

    doc.autoTable({
      startY: 54,
      head: [['Data', 'Produto', 'Tipo', 'Qtd', 'Motivo', 'Documento', 'Usuário']],
      body: movs.map(m => [m.criado_em?.slice(0,16), m.produto_nome, m.tipo.toUpperCase(), (m.tipo==='entrada'?'+':'-')+m.quantidade, m.motivo||'—', m.numero_documento||'—', m.usuario_nome||'—']),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'ENTRADA' ? [22, 163, 74] : [239, 68, 68];
        }
      }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — EstoqueID`, 14, doc.internal.pageSize.height - 8);
  }

  doc.save(`estoque_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`);
}

const RELATORIOS = [
  { id: 'produtos', icon: Package, label: 'Todos os Produtos', desc: 'Lista completa do catálogo com estoque atual', color: 'brand' },
  { id: 'baixo_estoque', icon: AlertTriangle, label: 'Estoque Crítico', desc: 'Produtos abaixo do estoque mínimo', color: 'amber' },
  { id: 'movimentacoes', icon: ClipboardList, label: 'Movimentações', desc: 'Histórico de entradas e saídas com filtros', color: 'blue' },
];

export default function Relatorios() {
  const [gerandoPDF, setGerandoPDF] = useState(null);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '' });

  const gerar = async (tipo) => {
    setGerandoPDF(tipo);
    try { await gerarPDF(tipo, filtros); }
    catch (e) { alert('Erro ao gerar PDF: ' + e.message); }
    finally { setGerandoPDF(null); }
  };

  const colors = {
    brand: 'border-brand-500/20 bg-brand-500/5 hover:border-brand-500/40',
    amber: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40',
    blue: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40',
  };
  const iconColors = { brand: 'text-brand-400 bg-brand-500/10', amber: 'text-amber-400 bg-amber-500/10', blue: 'text-blue-400 bg-blue-500/10' };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-zinc-400" size={24} /> Relatórios PDF</h1>
        <p className="text-zinc-500 text-sm mt-1">Gere relatórios profissionais em PDF</p>
      </div>

      {/* Filtro de data (para movimentações) */}
      <div className="card p-4">
        <div className="text-xs text-zinc-500 mb-3 font-medium">Filtro de período (para relatório de movimentações)</div>
        <div className="flex gap-3 items-center flex-wrap">
          <div><label className="label">Data início</label><input type="date" className="input" value={filtros.data_inicio} onChange={e => setFiltros(p=>({...p,data_inicio:e.target.value}))} /></div>
          <span className="text-zinc-600 text-sm mt-5">até</span>
          <div><label className="label">Data fim</label><input type="date" className="input" value={filtros.data_fim} onChange={e => setFiltros(p=>({...p,data_fim:e.target.value}))} /></div>
          <button onClick={() => setFiltros({data_inicio:'',data_fim:''})} className="text-xs text-zinc-500 hover:text-zinc-300 mt-5">Limpar</button>
        </div>
      </div>

      {/* Cards de relatórios */}
      <div className="space-y-4">
        {RELATORIOS.map(({ id, icon: Icon, label, desc, color }) => (
          <div key={id} className={`card border p-5 flex items-center justify-between transition-all ${colors[color]}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="font-semibold text-zinc-200">{label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
              </div>
            </div>
            <button onClick={() => gerar(id)} disabled={gerandoPDF === id} className="btn-secondary whitespace-nowrap">
              {gerandoPDF === id ? (
                <><div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> Gerando...</>
              ) : (
                <><Download size={14} /> Baixar PDF</>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium text-zinc-400 mb-3">💡 Sobre os relatórios</div>
        <ul className="space-y-1.5 text-sm text-zinc-500">
          <li>• Os PDFs são gerados diretamente no navegador, sem precisar de internet</li>
          <li>• O relatório de movimentações respeita os filtros de data definidos acima</li>
          <li>• Os arquivos são salvos automaticamente na pasta de Downloads</li>
        </ul>
      </div>
    </div>
  );
}
