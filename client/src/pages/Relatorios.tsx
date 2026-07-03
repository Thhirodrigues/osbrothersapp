/**
 * Relatórios - Análise financeira e exportação de dados
 * Design: Minimalismo Funcional com Tipografia Forte
 *
 * ✅ MIGRADO PARA: React Query + FiltroContext global
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Download, BarChart3, Eye, EyeOff, ShoppingCart, SlidersHorizontal, Calendar } from 'lucide-react';
import { useClientes, useLancamentosAdmin } from '@/hooks/useData';
import { useHideValues } from '@/contexts/HideValuesContext';
import { Button } from '@/components/ui/button';
import { HideValuesToggle } from '@/components/HideValuesToggle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useFiltro, TipoPeriodo } from '@/contexts/FiltroContext';

interface ItemMaisVendido {
  descricao: string;
  quantidade: number;
  total_centavos: number;
}

export default function Relatorios() {
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentosAdmin();
  const { isHidden } = useHideValues();

  const clientes = clientesQuery.data || [];
  const lancamentos = lancamentosQuery.data || [];
  const isLoading = clientesQuery.isLoading || lancamentosQuery.isLoading;
  const isError = clientesQuery.isError || lancamentosQuery.isError;

  const mascarar = (valor: string) => isHidden ? 'R$ ••••' : valor;
  const formatarValor = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  // Filtro de período global (compartilhado com Dashboard)
  const {
    tipoPeriodo, dataInicio, dataFim,
    dataInicioCustom, dataFimCustom,
    setTipoPeriodo, setDataInicioCustom, setDataFimCustom,
    aplicarPersonalizado, labelPeriodo,
  } = useFiltro();

  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Itens mais vendidos — busca no servidor usando datas do filtro global
  const [itensMaisVendidos, setItensMaisVendidos] = useState<ItemMaisVendido[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  useEffect(() => {
    setLoadingItens(true);
    const inicio = dataInicio.toISOString().slice(0, 10);
    const fim = dataFim.toISOString().slice(0, 10);
    fetch(`/api/relatorios/itens-mais-vendidos?dataInicio=${inicio}&dataFim=${fim}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItensMaisVendidos(data);
        } else {
          setItensMaisVendidos([]);
        }
      })
      .catch(() => setItensMaisVendidos([]))
      .finally(() => setLoadingItens(false));
  }, [dataInicio, dataFim]);

  // Calcular dados do gráfico — filtrado pelo período global
  const dadosGrafico = useMemo(() => {
    const meses: Record<string, { recebido: number; total: number }> = {};

    for (const lancamento of lancamentos) {
      // Filtrar apenas lançamentos ativos (excluir soft-deleted)
      if (lancamento.status && lancamento.status !== 'ativo') continue;
      
      let data: Date;
      if (typeof lancamento.data === 'string') {
        if (lancamento.data.includes('T') || lancamento.data.includes('-')) {
          data = new Date(lancamento.data);
        } else {
          data = new Date(parseInt(lancamento.data));
        }
      } else {
        data = new Date(lancamento.data || 0);
      }

      // Filtrar pelo período global
      if (data < dataInicio || data > dataFim) continue;

      const chave = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;

      if (!meses[chave]) {
        meses[chave] = { recebido: 0, total: 0 };
      }

      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;
      if (lancamento.tipo === 'pagamento') {
        meses[chave].recebido += valor;
      } else {
        meses[chave].total += valor;
      }
    }

    return Object.entries(meses)
      .sort()
      .map(([mes, dados]) => ({
        mes,
        ...dados,
      }));
  }, [lancamentos, dataInicio, dataFim]);

  // Calcular resumo — filtrado pelo período global
  const resumo = useMemo(() => {
    let totalRecebido = 0;
    let totalPendente = 0;

    for (const lancamento of lancamentos) {
      // Filtrar apenas lançamentos ativos (excluir soft-deleted)
      if (lancamento.status && lancamento.status !== 'ativo') continue;
      
      let data: Date;
      if (typeof lancamento.data === 'string') {
        data = new Date(lancamento.data.includes('T') || lancamento.data.includes('-') ? lancamento.data : parseInt(lancamento.data));
      } else {
        data = new Date(lancamento.data || 0);
      }
      if (data < dataInicio || data > dataFim) continue;

      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;
      if (lancamento.tipo === 'pagamento') {
        totalRecebido += valor;
      } else {
        totalPendente += valor;
      }
    }

    return {
      totalRecebido,
      totalPendente,
      saldoTotal: totalPendente - totalRecebido,
    };
  }, [lancamentos, dataInicio, dataFim]);

  // Resolver nome do cliente
  const resolverNomeCliente = (clienteId: number): string => {
    const cliente = clientes.find((c: any) => c.id === clienteId || c.id === String(clienteId));
    if (cliente?.nome) return cliente.nome;
    return `Usuário #${clienteId}`;
  };

  // Calcular devedores (saldo geral, não filtrado por período)
  const devedores = useMemo(() => {
    const devedoresPorCliente: Record<number, { nome: string; saldo: number }> = {};

    for (const lancamento of lancamentos) {
      // Filtrar apenas lançamentos ativos (excluir soft-deleted)
      if (lancamento.status && lancamento.status !== 'ativo') continue;
      
      const clienteId = lancamento.clienteId;
      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;

      if (!devedoresPorCliente[clienteId]) {
        devedoresPorCliente[clienteId] = {
          nome: resolverNomeCliente(clienteId),
          saldo: 0,
        };
      }

      if (lancamento.tipo === 'debito') {
        devedoresPorCliente[clienteId].saldo += valor;
      } else {
        devedoresPorCliente[clienteId].saldo -= valor;
      }
    }

    return Object.values(devedoresPorCliente)
      .filter((d) => d.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo);
  }, [lancamentos, clientes]);

  const exportarPDF = () => {
    toast.info('Exportação em PDF em desenvolvimento');
  };

  const exportarCSV = () => {
    toast.info('Exportação em CSV em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Erro ao carregar dados</p>
      </div>
    );
  }

  const periodos: { id: TipoPeriodo; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mês' },
    { id: 'ano', label: 'Ano' },
    { id: 'personalizado', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            Período: <span className="font-medium text-primary">{labelPeriodo}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Botao ocultar saldos */}
          <HideValuesToggle />
          <Button onClick={exportarPDF} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            PDF
          </Button>
          <Button onClick={exportarCSV} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Seletor de Período Global */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Filtrar período
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {periodos.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id === 'personalizado') {
                    setShowCustomInputs(true);
                    setTipoPeriodo('personalizado');
                  } else {
                    setShowCustomInputs(false);
                    setTipoPeriodo(p.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tipoPeriodo === p.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {p.id === 'personalizado' && <SlidersHorizontal size={13} />}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seletores de data para período personalizado */}
        {(tipoPeriodo === 'personalizado' || showCustomInputs) && (
          <div className="flex flex-wrap items-end gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
              <input
                type="date"
                value={dataInicioCustom}
                onChange={e => setDataInicioCustom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Data final</label>
              <input
                type="date"
                value={dataFimCustom}
                onChange={e => setDataFimCustom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => {
                aplicarPersonalizado();
                setShowCustomInputs(false);
              }}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600">{mascarar(formatarValor(resumo.totalRecebido))}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Debitado</p>
          <p className="text-2xl font-bold text-red-600">{mascarar(formatarValor(resumo.totalPendente))}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Saldo do Período</p>
          <p className={`text-2xl font-bold ${resumo.saldoTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {mascarar(formatarValor(resumo.saldoTotal))}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentação */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Movimentação — <span className="text-primary text-base">{labelPeriodo}</span>
        </h2>
        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="recebido" fill="#10b981" name="Recebido" />
              <Bar dataKey="total" fill="#ef4444" name="Total Debitado" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">Sem dados para exibir no período selecionado</p>
        )}
      </div>

      {/* Itens Mais Vendidos */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart size={20} />
            Top 10 Itens Mais Vendidos
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {labelPeriodo}
          </span>
        </div>

        {loadingItens ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : itensMaisVendidos.length > 0 ? (
          <div className="space-y-2">
            {itensMaisVendidos.slice(0, 10).map((item, idx) => {
              const medalha = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
              const barWidth = Math.max(8, Math.round((item.quantidade / itensMaisVendidos[0].quantidade) * 100));
              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-between p-3 rounded-lg overflow-hidden ${
                    idx < 3 ? 'bg-primary/8 border border-primary/20' : 'bg-muted'
                  }`}
                >
                  {/* Barra de progresso de fundo */}
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/6 rounded-lg transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="relative flex items-center gap-3 min-w-0">
                    <span className="text-base w-7 text-center flex-shrink-0">
                      {medalha ?? <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>}
                    </span>
                    <span className="text-foreground font-medium truncate">{item.descricao}</span>
                  </div>
                  <div className="relative flex items-center gap-3 text-right flex-shrink-0 ml-2">
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {item.quantidade}×
                    </span>
                    <span className="font-bold text-foreground min-w-[80px] text-right">
                      {mascarar(formatarValor(Number(item.total_centavos) / 100))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Nenhum item registrado no período selecionado
          </p>
        )}
      </div>

      {/* Maiores Devedores */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Maiores Devedores</h2>
        {devedores.length > 0 ? (
          <div className="space-y-2">
            {devedores.map((devedor, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-foreground">{devedor.nome}</span>
                <span className="font-semibold text-red-600">{mascarar(formatarValor(devedor.saldo))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum devedor no momento</p>
        )}
      </div>
    </div>
  );
}
