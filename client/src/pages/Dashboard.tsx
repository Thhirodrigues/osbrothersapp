/**
 * Dashboard - Tela inicial do Caderninho Digital
 * Mostra resumo de saldo e lista de devedores
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query
 * - Sincronização automática a cada 10s
 * - Sem SSE/Polling complexo
 * - Sem CentralizedStoreContext
 */

import { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, Wifi, WifiOff, CheckCircle, BadgeDollarSign, X, Loader2 } from 'lucide-react';
import { useUsuarios, useLancamentosAdmin, useAdicionarLancamento } from '@/hooks/useData';
import { useNavigation } from '@/contexts/NavigationContext';
import { useHideValues } from '@/contexts/HideValuesContext';
import { Button } from '@/components/ui/button';
import { HideValuesToggle } from '@/components/HideValuesToggle';
import { AnnouncementBannerContainer } from '@/components/AnnouncementBannerContainer';
import { toast } from 'sonner';

type FiltroType = 'todos' | 'vencidos' | 'pagos' | 'alfabetico';

// Função robusta para formatar valores em reais
const formatarValor = (valor: number | string | undefined, hidden: boolean = false): string => {
  if (hidden) {
    return 'R$ •••,••';
  }
  if (valor === undefined || valor === null || isNaN(Number(valor))) {
    return 'R$ 0,00';
  }
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

interface ConfirmPagamentoModal {
  clienteId: number;
  clienteNome: string;
  saldo: number;
}

export default function Dashboard() {
  // React Query hooks
  const usuariosQuery = useUsuarios();
  const lancamentosQuery = useLancamentosAdmin();
  const adicionarLancamento = useAdicionarLancamento();

  const { irPara } = useNavigation();
  const { isHidden } = useHideValues();
  const [filtro, setFiltro] = useState<FiltroType>('todos');
  const [confirmModal, setConfirmModal] = useState<ConfirmPagamentoModal | null>(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [buscaNome, setBuscaNome] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // Dados
  const clientes = usuariosQuery.data?.map((u: any) => ({ id: u.id, nome: u.name, name: u.name })) || [];
  const lancamentos = lancamentosQuery.data || [];
  const isLoading = usuariosQuery.isLoading || lancamentosQuery.isLoading;
  const isError = usuariosQuery.isError || lancamentosQuery.isError;
  const isConnected = !isError;

  // Converter valor de centavos para reais
  const converterValor = (valor: number | string): number => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return 0;
    return num / 100;
  };

  // Calcular saldo de um cliente (positivo = devendo, negativo = crédito)
  const calcularSaldoCliente = (clienteId: number) => {
    return lancamentos
      .filter((l: any) => (l.clienteId === clienteId || l.cliente_id === clienteId) && (!l.status || l.status === 'ativo'))
      .reduce((acc: number, l: any) => {
        const valor = converterValor(l.valor);
        return l.tipo === 'debito' ? acc + valor : acc - valor;
      }, 0);
  };

  // Saldo pendente = soma de todos os saldos positivos (devedores)
  const calcularSaldoPendente = () => {
    return clientes.reduce((acc: number, cliente: any) => {
      const saldo = calcularSaldoCliente(cliente.id);
      return saldo > 0 ? acc + saldo : acc;
    }, 0);
  };

  // Preparar dados de todos os clientes com seus saldos
  const todosClientesComSaldo = clientes.map((cliente: any) => ({
    clienteId: cliente.id,
    clienteNome: cliente.nome || cliente.name,
    saldo: calcularSaldoCliente(cliente.id),
  }));

  // Verificar se um cliente tem algum lançamento
  const clienteTemLancamento = (clienteId: number) =>
    lancamentos.some((l: any) => l.clienteId === clienteId || l.cliente_id === clienteId);

  // Aplicar filtro
  const clientesFiltrados = (() => {
    let lista = [...todosClientesComSaldo];

    switch (filtro) {
      case 'todos':
        // Todos os clientes em ordem alfabética
        lista.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'));
        break;
      case 'vencidos':
        // Apenas devedores (saldo > 0), por valor decrescente
        lista = lista.filter((s) => s.saldo > 0);
        lista.sort((a, b) => b.saldo - a.saldo);
        break;
      case 'pagos':
        // Apenas quem tem lançamentos E saldo zerado/crédito (liquidou a conta)
        lista = lista.filter((s) => s.saldo <= 0 && clienteTemLancamento(s.clienteId));
        lista.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'));
        break;
      case 'alfabetico':
        // Devedores em ordem alfabética
        lista = lista.filter((s) => s.saldo > 0);
        lista.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'));
        break;
    }

    return lista;
  })();

  // Aplicar filtro de busca por nome
  const clientesFiltradosPorNome = clientesFiltrados.filter((cliente) =>
    cliente.clienteNome.toLowerCase().includes(buscaNome.toLowerCase())
  );

  // Calcular paginacao
  const totalPaginas = Math.ceil(clientesFiltradosPorNome.length / ITENS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const clientesPaginados = clientesFiltradosPorNome.slice(indiceInicio, indiceFim);

  // Resetar para pagina 1 quando mudar filtro ou busca
  const handleFiltroChange = (novoFiltro: FiltroType) => {
    setFiltro(novoFiltro);
    setPaginaAtual(1);
  };

  const handleBuscaChange = (valor: string) => {
    setBuscaNome(valor);
    setPaginaAtual(1);
  };

  const saldoPendente = calcularSaldoPendente();
  const totalDevedores = todosClientesComSaldo.filter((s) => s.saldo > 0).length;
  const totalPagos = todosClientesComSaldo.filter((s) => s.saldo <= 0).length;

  // Abrir modal de confirmação de pagamento
  const abrirConfirmPagamento = (e: React.MouseEvent, item: ConfirmPagamentoModal) => {
    e.stopPropagation(); // evitar navegar para o perfil
    setValorPagamento(item.saldo.toFixed(2).replace('.', ','));
    setConfirmModal(item);
  };

  // Confirmar e registrar pagamento
  const confirmarPagamento = async () => {
    if (!confirmModal) return;
    const valorStr = valorPagamento.replace(/\./g, '').replace(',', '.');
    const valorReais = parseFloat(valorStr);
    if (isNaN(valorReais) || valorReais <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    const valorCentavos = Math.round(valorReais * 100);
    try {
      await adicionarLancamento.mutateAsync({
        cliente_id: confirmModal.clienteId,
        tipo: 'pagamento',
        valor: valorCentavos,
        descricao: 'Pagamento registrado pelo administrador',
      });
      toast.success(`Pagamento de ${formatarValor(valorReais)} registrado para ${confirmModal.clienteNome}!`);
      setConfirmModal(null);
    } catch {
      toast.error('Erro ao registrar pagamento. Tente novamente.');
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banners de Notícias */}
      <AnnouncementBannerContainer />
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumo de saldos e devedores</p>
        </div>
        <div className="flex items-center gap-3">
          <HideValuesToggle />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
          {isConnected ? (
            <>
              <Wifi size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-600">Desconectado</span>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Aviso de Desconexão */}
      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">
            ⚠️ Sem conexão com o servidor
          </p>
        </div>
      )}

      {/* Card de Saldo Pendente */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Saldo Pendente</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {formatarValor(saldoPendente, isHidden)}
            </p>
          </div>
          <TrendingUp size={32} className="text-blue-600" />
        </div>
      </div>

      {/* Busca */}
      <div>
        <input
          type="text"
          placeholder="Buscar cliente por nome..."
          value={buscaNome}
          onChange={(e) => handleBuscaChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: `Todos (${clientes.length})` },
          { id: 'vencidos', label: `Vencidos (${totalDevedores})` },
          { id: 'pagos', label: `Pagos (${totalPagos})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => handleFiltroChange(f.id as FiltroType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Clientes */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {filtro === 'pagos' ? 'Clientes em Dia' : 'Devedores'}
          </h2>
        </div>

        {clientesFiltradosPorNome.length === 0 ? (
          <div className="p-6 text-center">
            {filtro === 'pagos' ? (
              <p className="text-muted-foreground">Nenhum cliente em dia no momento</p>
            ) : (
              <p className="text-muted-foreground">Nenhum devedor no momento 🎉</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clientesPaginados.map((saldo: any) => (
              <div
                key={saldo.clienteId}
                className="flex items-center px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                {/* Área clicável para ir ao perfil */}
                <button
                  onClick={() => {
                    irPara('cliente');
                    sessionStorage.setItem('clienteSelecionadoId', saldo.clienteId);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{saldo.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {lancamentos.filter(
                          (l: any) => l.clienteId === saldo.clienteId || l.cliente_id === saldo.clienteId
                        ).length}{' '}
                        lançamentos
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2 mr-3">
                      {saldo.saldo <= 0 ? (
                        <>
                          <CheckCircle size={18} className="text-green-600" />
                          <p className="font-semibold text-green-600">Em dia</p>
                        </>
                      ) : (
                        <p className="font-semibold text-red-600">
                          {formatarValor(saldo.saldo, isHidden)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Botão de pagamento rápido — só para devedores */}
                {saldo.saldo > 0 && (
                  <button
                    onClick={(e) => abrirConfirmPagamento(e, {
                      clienteId: saldo.clienteId,
                      clienteNome: saldo.clienteNome,
                      saldo: saldo.saldo,
                    })}
                    title="Registrar pagamento"
                    className="ml-2 p-2 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-800/60 transition-colors flex-shrink-0"
                  >
                    <BadgeDollarSign size={22} className="text-green-700 dark:text-green-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginacao */}
      {totalPaginas > 1 && (
        <div className="mt-6 space-y-4">
          {/* Mobile: Mostrar apenas Anterior/Próximo e informação de página */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
              disabled={paginaAtual === 1}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors font-medium"
            >
              ← Anterior
            </button>
            
            {/* Informação de página - visível em todas as telas */}
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              Página {paginaAtual} de {totalPaginas}
            </span>
            
            <button
              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
              disabled={paginaAtual === totalPaginas}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors font-medium"
            >
              Próximo →
            </button>
          </div>
          
          {/* Desktop: Mostrar números de página */}
          <div className="hidden sm:flex items-center justify-center gap-1 flex-wrap">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
              <button
                key={pagina}
                onClick={() => setPaginaAtual(pagina)}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  paginaAtual === pagina
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {pagina}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão Novo Lançamento */}
      <div className="flex justify-center">
        <Button
          onClick={() => irPara('novo-lancamento')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Lançamento
        </Button>
      </div>

      {/* Modal de Confirmação de Pagamento */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-sm shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">Registrar Pagamento</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{confirmModal.clienteNome}</p>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Saldo devedor: <span className="font-semibold text-red-600">{formatarValor(confirmModal.saldo)}</span>
                </p>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Valor do pagamento (R$)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">R$</span>
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value.replace(/[^0-9.,]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && confirmarPagamento()}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-xl font-bold text-center bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {/* Link para restaurar valor total */}
                {valorPagamento !== confirmModal.saldo.toFixed(2).replace('.', ',') && (
                  <button
                    onClick={() => setValorPagamento(confirmModal.saldo.toFixed(2).replace('.', ','))}
                    className="text-xs text-primary underline mt-1 hover:opacity-80"
                  >
                    Usar valor total: {formatarValor(confirmModal.saldo)}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmModal(null)}
                  disabled={adicionarLancamento.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={confirmarPagamento}
                  disabled={adicionarLancamento.isPending}
                >
                  {adicionarLancamento.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <BadgeDollarSign size={16} />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
