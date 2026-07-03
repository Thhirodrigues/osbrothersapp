/**
 * ClientePerfil - Página de detalhes do cliente
 * Mostra extrato, débitos, pagamentos e ações
 * Design: Minimalismo Funcional com Tipografia Forte
 * ✅ MIGRADO PARA: React Query
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, MessageCircle, Trash2, UserCheck, Users, Zap } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHideValues } from '@/contexts/HideValuesContext';
import { useClientes, useLancamentosAdmin, useDeletarLancamento } from '@/hooks/useData';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Button } from '@/components/ui/button';
import { HideValuesToggle } from '@/components/HideValuesToggle';
import { toast } from 'sonner';

export default function ClientePerfil() {
  const { irPara, voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const { isHidden } = useHideValues();
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentosAdmin();
  const deletarMutation = useDeletarLancamento();
  const { config: appConfig } = useAppConfig();
  
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | null>(null);

  // Recuperar clienteId do sessionStorage
  useEffect(() => {
    const id = sessionStorage.getItem('clienteSelecionadoId');
    if (id) {
      setClienteSelecionadoId(parseInt(id, 10));
    }
  }, []);

  const isAdmin = usuarioLogado?.tipo === 'admin';
  const clientes = clientesQuery.data || [];
  const allLancamentos = lancamentosQuery.data || [];
  // Admins vêem todos (incluindo inativos); clientes só vêem ativos
  const lancamentos = isAdmin
    ? allLancamentos
    : allLancamentos.filter((l: any) => !l.status || l.status === 'ativo');

  // Encontrar cliente selecionado
  const cliente = clientes.find((c: any) => c.id === clienteSelecionadoId);

  // Calcular saldo do cliente
  const calcularSaldoCliente = (clienteId: number) => {
    return lancamentos
      .filter((l: any) => l.clienteId === clienteId || l.cliente_id === clienteId)
      .reduce((acc: number, l: any) => {
        const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
        return l.tipo === 'debito' ? acc + (valor / 100) : acc - (valor / 100);
      }, 0);
  };

  // Saldo considera apenas lançamentos ativos (não conta pendentes nem inativos)
  const calcularSaldoAtivo = (clienteId: number) => {
    return lancamentos
      .filter((l: any) =>
        (l.clienteId === clienteId || l.cliente_id === clienteId) &&
        (!l.status || l.status === 'ativo')
      )
      .reduce((acc: number, l: any) => {
        const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
        return l.tipo === 'debito' ? acc + (valor / 100) : acc - (valor / 100);
      }, 0);
  };
  const saldo = clienteSelecionadoId ? calcularSaldoAtivo(clienteSelecionadoId) : 0;

  if (clientesQuery.isLoading || lancamentosQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Cliente não encontrado</h1>
        </div>
        <Button onClick={voltar} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const lancamentosCliente = lancamentos.filter(
    (l: any) => l.clienteId === cliente.id || l.cliente_id === cliente.id
  );

  const handleWhatsApp = () => {
    if (!cliente.telefone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    // Usar template salvo em configurações
    const saldoFormatado = isHidden ? '***,**' : saldo.toFixed(2).replace('.', ',');
    let mensagem = appConfig.templateWhatsapp || `Olá, ${cliente.nome}! Passando para lembrar que a sua continha de R$ ${saldoFormatado} na adega está em aberto. Segue o pix para pagamento osbrothersadega@gmail.com`;
    
    // Se o template usar variáveis, substituir
    if (mensagem.includes('{cliente}')) {
      mensagem = mensagem
        .replace(/{cliente}/g, cliente.nome)
        .replace(/{valor}/g, `R$ ${saldo.toFixed(2).replace('.', ',')}`)
        .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{descricao}/g, 'Saldo em aberto');
    }
    
    const telefone = cliente.telefone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRegistrarPagamento = () => {
    sessionStorage.setItem('clienteSelecionadoId', cliente.id.toString());
    irPara('novo-lancamento');
    toast.info('Selecione "Pagamento" para registrar o recebimento');
  };

  const handleNovoLancamentoCardapio = () => {
    sessionStorage.setItem('clienteSelecionadoId', cliente.id.toString());
    irPara('novo-lancamento');
    toast.info('Cliente selecionado. Registre o novo lançamento');
  };

  const handleDeletarLancamento = async (id: number) => {
    if (!confirm('Tem certeza que deseja inativar este lançamento? Ele não será excluído permanentemente, apenas ocultado do cliente.')) {
      return;
    }
    try {
      await deletarMutation.mutateAsync({
        id,
        excluido_por: (usuarioLogado as any)?.nome || (usuarioLogado as any)?.name || 'Administrador',
      });
      toast.success('Lançamento inativado. Ele permanece no histórico mas não conta no saldo.');
    } catch (error) {
      console.error('Erro ao inativar lançamento:', error);
      toast.error('Erro ao inativar lançamento');
    }
  };

  // Helper: badge de autoria
  const AutoriaBadge = ({ lancamento }: { lancamento: any }) => {
    const origem = lancamento.registrado_por;
    if (!origem) return null;
    if (origem === 'conta_geral') return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
        <Zap size={10} /> Conta Geral
      </span>
    );
    if (origem === 'user') return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
        <UserCheck size={10} /> {lancamento.registrado_por_nome || 'Usuário'}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
        <Users size={10} /> {lancamento.registrado_por_nome || 'Admin'}
      </span>
    );
  };

  const formatarData = (data: string | number) => {
    if (!data) return 'Data não disponível';
    try {
      const date = typeof data === 'string' ? new Date(data) : new Date(data);
      return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{cliente.nome}</h1>
            {cliente.telefone && (
              <p className="text-muted-foreground">{cliente.telefone}</p>
            )}
          </div>
        </div>
        <HideValuesToggle />
      </div>

      {/* Saldo e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Saldo */}
        <div className="bg-card border border-border rounded-lg p-6 md:col-span-2">
          <p className="text-muted-foreground text-sm font-medium">Saldo Atual</p>
          <p className="text-4xl font-bold text-foreground mt-2">
            {isHidden ? 'R$ ***,**' : `R$ ${saldo.toFixed(2).replace('.', ',')}`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Status: <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              saldo > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {saldo > 0 ? 'Pendente' : 'Pago'}
            </span>
          </p>
        </div>

        {/* Botão WhatsApp */}
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="gap-2 h-fit"
        >
          <MessageCircle size={18} />
          WhatsApp
        </Button>
      </div>

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleRegistrarPagamento}
          className="gap-2"
        >
          <Plus size={18} />
          Registrar Pagamento
        </Button>
        <Button
          onClick={handleNovoLancamentoCardapio}
          variant="outline"
          className="gap-2"
        >
          <Plus size={18} />
          Novo Lançamento (Cardápio)
        </Button>
      </div>

      {/* Extrato */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Extrato ({lancamentosCliente.length})</h2>
        </div>

        {lancamentosCliente.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum lançamento registrado</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {lancamentosCliente.map((lancamento: any) => {
              const isInativo = lancamento.status === 'inativo';
              const isPendente = lancamento.status === 'pendente';
              return (
                <div
                  key={lancamento.id}
                  className={`p-3 rounded-lg border ${
                    isInativo
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : isPendente
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-muted border-border'
                  }`}
                >
                  {/* Linha 1: ícone + tipo/data à esquerda, valor + deletar à direita */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-md shrink-0 ${
                        isInativo ? 'bg-gray-100 text-gray-400' :
                        lancamento.tipo === 'debito'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        <DollarSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-medium text-sm ${
                            isInativo ? 'text-gray-400 line-through' : 'text-foreground'
                          }`}>
                            {lancamento.tipo === 'debito' ? 'Débito' : 'Pagamento'}
                          </p>
                          {isInativo && isAdmin && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                              Excluído por {lancamento.excluido_por || 'Admin'}
                            </span>
                          )}
                          {isPendente && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                              ⏳ Aguardando aprovação
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(lancamento.data)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <p className={`font-semibold text-sm whitespace-nowrap ${
                        isInativo ? 'text-gray-400 line-through' :
                        lancamento.tipo === 'debito' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {lancamento.tipo === 'debito' ? '+' : '-'} {isHidden ? 'R$ ***,**' : `R$ ${(lancamento.valor / 100).toFixed(2).replace('.', ',')}`}
                      </p>
                      {isAdmin && !isInativo && (
                        <button
                          onClick={() => handleDeletarLancamento(lancamento.id)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-600 rounded-md transition-colors"
                          title="Inativar lançamento (soft delete)"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Linha 2: descrição */}
                  {lancamento.descricao && (
                    <p className={`text-sm mt-1 pl-7 break-words ${
                      isInativo ? 'text-gray-400' : 'text-muted-foreground'
                    }`}>{lancamento.descricao}</p>
                  )}
                  {/* Linha 3: badge de autoria (apenas admin) */}
                  {isAdmin && (
                    <div className="mt-1.5 pl-7">
                      <AutoriaBadge lancamento={lancamento} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
