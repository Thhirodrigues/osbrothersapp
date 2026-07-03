/**
 * NovoLancamento - Tela para adicionar débito ou pagamento
 * Formulário rápido com teclado numérico
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query
 * - Sem CentralizedStoreContext
 * - Sincronização automática
 */

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Wifi, WifiOff, Search, UserX } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useMenus, useAdicionarLancamento } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CardapioAdminSelector from '@/components/CardapioAdminSelector';
import CardapioClienteView from '@/components/CardapioClienteView';
import { toast } from 'sonner';
import { obterTimestampBrasilia } from '@/lib/brasiliaTime';

interface NovoLancamentoProps {
  onVoltar?: () => void;
}

export default function NovoLancamento({ onVoltar: onVoltarProp }: NovoLancamentoProps) {
  const { voltar, clienteSelecionado } = useNavigation();
  const { usuarioLogado } = useAuth();

  // React Query hooks
  const clientesQuery = useClientes();
  const menusQuery = useMenus();
  const adicionarLancamento = useAdicionarLancamento();

  // Dados
  const clientes = clientesQuery.data || [];
  const menus = menusQuery.data || [];
  const isConnected = !clientesQuery.isError && !menusQuery.isError;

  // Se for cliente logado, usar seu próprio ID
  const isClienteLogado = usuarioLogado?.tipo === 'cliente';
  const clienteIdFixo = isClienteLogado ? Number(usuarioLogado?.id) : undefined;

  // Estado do formulário
  const [tipo, setTipo] = useState<'debito' | 'pagamento'>('debito');
  const [clienteId, setClienteId] = useState<number | null>(
    clienteIdFixo || (typeof clienteSelecionado === 'number' ? clienteSelecionado : null) || null
  );

  // Ler clienteSelecionadoId do sessionStorage (quando vindo de ClientePerfil)
  useEffect(() => {
    const clienteIdFromSession = sessionStorage.getItem('clienteSelecionadoId');
    if (clienteIdFromSession && !clienteIdFixo) {
      setClienteId(parseInt(clienteIdFromSession, 10));
      sessionStorage.removeItem('clienteSelecionadoId'); // Limpar após usar
    }
  }, [clienteIdFixo]);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  // Chave para forçar remount dos componentes de cardápio após envio (limpa seleções)
  const [cardapioKey, setCardapioKey] = useState(0);
  // Busca de cliente
  const [buscaCliente, setBuscaCliente] = useState('');
  // Modo Lançamento Vendas (apenas admin — sem vincular cliente cadastrado)
  const isAdmin = usuarioLogado?.tipo === 'admin';
  const [modoVendas, setModoVendas] = useState(false);
  const [vendasNome, setVendasNome] = useState(''); // nome livre para identificação

  const handleVoltar = () => {
    if (onVoltarProp) {
      onVoltarProp();
    } else {
      voltar();
    }
  };

  const handleSalvarLancamento = async () => {
    if (!isConnected) {
      toast.error('Sem conexão com o servidor');
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    // Modo avulso: não precisa de cliente cadastrado
    if (modoVendas) {
      setCarregando(true);
      try {
        // Buscar ou criar um cliente genérico "Avulso" para vincular o lançamento
        // Usamos um ID especial (cliente_id = 0 não existe) — enviamos descricao com nome
        const descricaoFinal = vendasNome.trim()
          ? `[Vendas: ${vendasNome.trim()}] ${descricao || ''}`.trim()
          : `[Vendas] ${descricao || ''}`.trim();

        // Criar usuário temporário "Avulso" se não existir, ou usar o primeiro admin como fallback
        // Na prática, enviamos para o endpoint com clienteId nulo e o servidor usará o admin como proxy
        const res = await fetch('/api/lancamentos/vendas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            valor: Math.round(parseFloat(valor) * 100),
            descricao: descricaoFinal,
            nomeVendas: vendasNome.trim() || 'Vendas',
            adminNome: (usuarioLogado as any)?.nome || (usuarioLogado as any)?.name || 'Administrador',
          }),
        });

        if (!res.ok) throw new Error('Erro ao registrar lançamento de vendas');

        toast.success(`✓ Lançamento de vendas registrado com sucesso!`);
        setValor('');
        setDescricao('');
        setVendasNome('');
        setCardapioKey((k) => k + 1);
        handleVoltar();
      } catch (error) {
        console.error('Erro ao registrar lançamento de vendas:', error);
        toast.error('Erro ao registrar lançamento de vendas');
      } finally {
        setCarregando(false);
      }
      return;
    }

    if (!clienteId) {
      toast.error('Selecione um cliente');
      return;
    }

    setCarregando(true);
    try {
      const timestamp = obterTimestampBrasilia();
      
      await adicionarLancamento.mutateAsync({
        clienteId: clienteId || (isClienteLogado ? Number(usuarioLogado?.id) : undefined),
        tipo,
        valor: Math.round(parseFloat(valor) * 100), // Converter reais para centavos
        descricao: descricao || undefined,
        origem: 'admin',
        adminNome: (usuarioLogado as any)?.nome || (usuarioLogado as any)?.name || 'Administrador',
      });

      toast.success(`✓ ${tipo === 'debito' ? 'Débito' : 'Pagamento'} registrado com sucesso!`);
      
      // Limpar formulário e resetar seleções do cardápio
      setClienteId(clienteIdFixo ?? null);
      setValor('');
      setDescricao('');
      setCardapioKey((k) => k + 1); // força remount dos componentes de cardápio
      
      // Voltar se não for cliente logado
      if (!isClienteLogado) {
        handleVoltar();
      }
    } catch (error) {
      console.error('Erro ao registrar lançamento:', error);
      toast.error('Erro ao registrar lançamento');
    } finally {
      setCarregando(false);
    }
  };

  // Removido - agora usando onSelectionChange dos componentes de cardápio

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVoltar}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Novo Lançamento</h1>
              <p className="text-muted-foreground mt-1">
                {modoVendas ? 'Modo Vendas — sem cliente cadastrado' : 'Registre débito ou pagamento'}
              </p>
            </div>
          </div>
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

        {/* Aviso de Desconexão */}
        {!isConnected && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              ⚠️ Sem conexão com o servidor
            </p>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">

          {/* Banner modo avulso */}
          {modoVendas && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <UserX size={16} /> Lançamento de Vendas
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Use este modo para clientes que não utilizam o aplicativo e não precisam de cadastro.
                O registro ficará salvo com o nome informado para controle interno.
              </p>
            </div>
          )}

          {/* Campo de nome vendas (somente no modo vendas) */}
          {modoVendas && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome para identificação <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                type="text"
                value={vendasNome}
                onChange={(e) => setVendasNome(e.target.value)}
                placeholder="Ex: João da padaria, Mesa 5..."
                className="bg-background border-border"
              />
            </div>
          )}

          {/* Tipo de Lançamento */}
          {/* Clientes logados só podem registrar débitos; pagamentos são exclusivos dos admins */}
          {isClienteLogado ? (
            <div className="px-4 py-3 rounded-lg bg-red-100 text-red-700 font-medium text-center border-2 border-red-300">
              Débito (Consumo)
            </div>
          ) : (
            <div className={`grid gap-3 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Débito */}
              <button
                onClick={() => { setTipo('debito'); setModoVendas(false); setClienteId(null); }}
                className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl font-medium transition-colors text-sm ${
                  tipo === 'debito' && !modoVendas
                    ? 'bg-red-100 text-red-700 border-2 border-red-400'
                    : 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <span className="text-xl">🛒</span>
                <span>Débito</span>
                <span className="text-xs opacity-70">Consumo</span>
              </button>

              {/* Pagamento */}
              <button
                onClick={() => { setTipo('pagamento'); setModoVendas(false); setClienteId(null); }}
                className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl font-medium transition-colors text-sm ${
                  tipo === 'pagamento' && !modoVendas
                    ? 'bg-green-100 text-green-700 border-2 border-green-400'
                    : 'bg-muted text-muted-foreground hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <span className="text-xl">💵</span>
                <span>Pagamento</span>
                <span className="text-xs opacity-70">Recebimento</span>
              </button>

              {/* Vendas — apenas admins */}
              {isAdmin && (
                <button
                  onClick={() => { setModoVendas(!modoVendas); setClienteId(null); setValor(''); setDescricao(''); setVendasNome(''); }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl font-medium transition-colors text-sm ${
                    modoVendas
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
                      : 'bg-muted text-muted-foreground hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span>Vendas</span>
                  <span className="text-xs opacity-70">Sem cadastro</span>
                </button>
              )}
            </div>
          )}

          {/* Seleção de Cliente — oculto no modo vendas */}
          {!isClienteLogado && !modoVendas && (() => {
            // Ordenar e filtrar clientes
            const clientesOrdenados = [...clientes].sort((a: any, b: any) =>
              a.nome.localeCompare(b.nome, 'pt-BR')
            );
            const clientesFiltrados = buscaCliente.trim()
              ? clientesOrdenados.filter((c: any) =>
                  c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
                )
              : clientesOrdenados;
            const clienteSelecionadoNome = clientes.find((c: any) => c.id === clienteId)?.nome;
            return (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cliente</label>
                {/* Campo de busca */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="pl-9 bg-background border-border"
                  />
                </div>
                {/* Lista de clientes filtrada — só aparece ao digitar */}
                {buscaCliente.trim() && (
                  <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                    ) : (
                      clientesFiltrados.map((cliente: any) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => { setClienteId(cliente.id); setBuscaCliente(''); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                            clienteId === cliente.id
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground'
                          }`}
                        >
                          {cliente.nome}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {/* Cliente selecionado */}
                {clienteSelecionadoNome && (
                  <p className="text-xs text-muted-foreground">
                    Selecionado: <span className="font-medium text-foreground">{clienteSelecionadoNome}</span>
                    <button
                      type="button"
                      onClick={() => setClienteId(null)}
                      className="ml-2 text-red-500 underline hover:opacity-80"
                    >
                      limpar
                    </button>
                  </p>
                )}
              </div>
            );
          })()}

          {/* Cardápio */}
          {tipo === 'debito' && menus.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {isClienteLogado ? 'Itens Disponíveis' : 'Selecionar do Cardápio'}
              </label>
              {isClienteLogado ? (
                <CardapioClienteView
                  key={cardapioKey}
                  menus={menus}
                  onSelectionChange={(items, total) => {
                    if (total > 0) {
                      setValor((total / 100).toFixed(2));
                      const descricao = items
                        .map((i) => `${i.item.name} x${i.quantity}`)
                        .join(', ');
                      setDescricao(descricao);
                    }
                  }}
                />
              ) : (
                <CardapioAdminSelector
                  key={cardapioKey}
                  menus={menus}
                  onSelectionChange={(items, total) => {
                    if (total > 0) {
                      setValor((total / 100).toFixed(2));
                      const descricao = items
                        .map((i) => `${i.item.name} x${i.quantity}`)
                        .join(', ');
                      setDescricao(descricao);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Valor - apenas para admins */}
          {!isClienteLogado && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="bg-background border-border text-lg"
              />
            </div>
          )}

          {/* Descrição - apenas para admins */}
          {!isClienteLogado && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
              <Input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Bebidas, Comida..."
                className="bg-background border-border"
              />
            </div>
          )}

        </div>
      </div>

      {/* Botão Salvar - fixo na parte inferior da tela */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSalvarLancamento}
            disabled={carregando || adicionarLancamento.isPending || !isConnected}
            className="w-full"
            size="lg"
          >
            {carregando || adicionarLancamento.isPending ? 'Salvando...' : 'Salvar Lançamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
