/**
 * ContaGeral.tsx - Página de Conta Geral (Compras Rápidas)
 * 
 * ✅ MIGRADO PARA: React Query (useClientes, useLancamentos, useMenus)
 * ✅ SEM SSE/Polling - Simples e confiável
 * 
 * Características:
 * - Registrar compras rápidas sem login
 * - Selecionar cliente
 * - Selecionar itens do cardápio
 * - Sincronização automática via React Query
 * - Notificações de novidade usando cardápio ativo do cliente
 */

import React, { useState } from 'react';
import { LogOut, Wifi, WifiOff, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHideValues } from '@/contexts/HideValuesContext';
import { useClientes, useLancamentos, useMenus, useAdicionarLancamento } from '@/hooks/useData';
import { useUserActiveMenu } from '@/hooks/useUserActiveMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HideValuesToggle } from '@/components/HideValuesToggle';
import { toast } from 'sonner';
import CardapioClienteView from '@/components/CardapioClienteView';
import NovidadeBanner from '@/components/NovidadeBanner';
import PixPaymentModal from '@/components/PixPaymentModal';

type AbaType = 'nova-compra' | 'novo-cliente';

export default function ContaGeral() {
  const { fazer_logout } = useAuth();
  const { isHidden } = useHideValues();
  
  // React Query hooks
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();
  const menusQuery = useMenus();
  const adicionarLancamento = useAdicionarLancamento();

  // Estado do formulário
  const [aba, setAba] = useState<AbaType>('nova-compra');
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);

  const [valor, setValor] = useState('');
  const [busca, setBusca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregandoCompra, setCarregandoCompra] = useState(false);
  const [cardapioKey, setCardapioKey] = useState(0);
  const [mostrarPix, setMostrarPix] = useState(false);

  // Novo cliente
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [carregandoNovoCliente, setCarregandoNovoCliente] = useState(false);

  // Dados
  const clientes = clientesQuery.data || [];
  const menus = menusQuery.data || [];
  const isLoading = clientesQuery.isLoading || menusQuery.isLoading;
  const isError = clientesQuery.isError || menusQuery.isError;
  const isConnected = !isError;

  // Obter cardápio ativo do cliente selecionado
  const { activeMenuId } = useUserActiveMenu(clienteSelecionado);

  // Filtrar clientes por busca
  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  // Handlers
  const handleSalvarCompra = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Selecione itens do cardápio ou informe um valor');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoCompra(true);
    try {
      // Converter valor de reais para centavos
      const valorEmCentavos = Math.round(parseFloat(valor) * 100);
      
      await adicionarLancamento.mutateAsync({
        clienteId: clienteSelecionado,
        tipo: 'debito',
        valor: valorEmCentavos,
        descricao: descricao || undefined,
        origem: 'conta_geral',
      });

      toast.success(`✓ Compra de R$ ${parseFloat(valor).toFixed(2)} registrada!`);
      
      // Limpar formulário (incluindo cardápio e cliente selecionado)
      setClienteSelecionado(null);
      setValor('');
      setDescricao('');
      setBusca('');
      setCardapioKey(k => k + 1); // força remount do CardapioClienteView
      
      // Refetch lançamentos
      lancamentosQuery.refetch();
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao registrar compra';
      toast.error(errorMsg);
    } finally {
      setCarregandoCompra(false);
    }
  };

  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoNovoCliente(true);
    try {
      const emailFinal = novoClienteEmail || `${novoClienteNome.trim().toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@caderninho.local`;
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoClienteNome,
          name: novoClienteNome,
          email: emailFinal,
          telefone: novoClienteTelefone,
          tipo: 'user',
        }),
      });

      if (response.ok) {
        toast.success(`✓ Cliente "${novoClienteNome}" criado com sucesso!`);
        
        // Limpar formulário
        setNovoClienteNome('');
        setNovoClienteTelefone('');
        setNovoClienteEmail('');
        setAba('nova-compra');
        
        // Refetch clientes
        clientesQuery.refetch();
      } else {
        const erro = await response.json();
        toast.error(`Erro: ${erro.message || 'Falha ao criar cliente'}`);
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    } finally {
      setCarregandoNovoCliente(false);
    }
  };

  // Removido - agora usando onSelectionChange do CardapioClienteView

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  // Usar cardápio ativo do cliente selecionado (ou After como padrão)
  const menuParaNotificacoes = activeMenuId || 'after-menu-1';

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Notificação de Novidades - usando cardápio ativo do cliente selecionado */}
      {clienteSelecionado && <NovidadeBanner menuId={menuParaNotificacoes} autoHideSeconds={10} />}
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header com Status de Conexão */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conta Geral</h1>
            <p className="text-muted-foreground mt-1">Registre compras rápidas sem login</p>
          </div>
          <div className="flex items-center gap-3">
            <HideValuesToggle />
            {/* Status de Conexão */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}
            >
              {isConnected ? (
                <Wifi size={18} className="text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff size={18} className="text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <Button
              onClick={fazer_logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={20} />
              Sair
            </Button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setAba('nova-compra')}
            className={`px-4 py-2 font-semibold transition ${
              aba === 'nova-compra'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nova Compra
          </button>
          <button
            onClick={() => setAba('novo-cliente')}
            className={`px-4 py-2 font-semibold transition ${
              aba === 'novo-cliente'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Novo Cliente
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {aba === 'nova-compra' && (
          <div className="bg-card text-card-foreground rounded-lg p-6 border border-border space-y-4">
            {/* Seleção de Cliente */}
            <div>
              <label className="block text-sm font-semibold mb-2">Selecione o Cliente</label>
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                {clientesFiltrados.length === 0 ? (
                  <p className="p-3 text-muted-foreground text-center">Nenhum cliente encontrado</p>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => {
                        setClienteSelecionado(cliente.id);
                        setBusca('');
                      }}
                      className={`w-full text-left p-3 border-b border-border hover:bg-primary/10 transition ${
                        clienteSelecionado === cliente.id ? 'bg-primary/20 font-semibold' : ''
                      }`}
                    >
                      {cliente.nome}
                      {cliente.email && <p className="text-xs text-muted-foreground">{cliente.email}</p>}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Cliente Selecionado */}
            {clienteSelecionado && (
              <>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm font-semibold">
                    Cliente: {clientes.find(c => c.id === clienteSelecionado)?.nome}
                  </p>
                </div>

                {/* Cardápio */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Selecione os Itens</label>
                  <CardapioClienteView
                    key={cardapioKey}
                    menus={menusQuery.data || []}
                    clienteMenuFixoId={activeMenuId || 'after-menu-1'}
                    onSelectionChange={(items, total) => {
                      setValor(total.toFixed(2));
                    }}
                  />
                </div>

                {/* Valor Total (apenas exibição) */}
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{isHidden ? 'R$ •••,••' : `R$ ${parseFloat(valor || '0').toFixed(2)}`}</p>
                </div>

                {/* Botão Salvar */}
                <Button
                  onClick={handleSalvarCompra}
                  disabled={carregandoCompra || !isConnected}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {carregandoCompra ? 'Salvando...' : 'Salvar Compra'}
                </Button>
              </>
            )}
          </div>
        )}

        {aba === 'novo-cliente' && (
          <div className="bg-card text-card-foreground rounded-lg p-6 border border-border space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Nome do Cliente *</label>
              <Input
                type="text"
                placeholder="Ex: João Silva"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email (opcional)</label>
              <Input
                type="email"
                placeholder="Ex: joao@example.com"
                value={novoClienteEmail}
                onChange={(e) => setNovoClienteEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Telefone (opcional)</label>
              <Input
                type="tel"
                placeholder="Ex: (11) 98765-4321"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCriarCliente}
              disabled={carregandoNovoCliente || !isConnected}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {carregandoNovoCliente ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        )}

        {/* PIX Payment */}
        <Button
          onClick={() => setMostrarPix(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
        >
          <QrCode size={20} />
          Pagar com PIX
        </Button>

        {mostrarPix && clienteSelecionado && (
          <PixPaymentModal
            saldo={parseFloat(valor) || 0}
            nomeCliente={clientesQuery.data?.find(c => c.id === clienteSelecionado)?.nome || 'Cliente'}
            onClose={() => setMostrarPix(false)}
          />
        )}
      </div>
    </div>
  );
}
