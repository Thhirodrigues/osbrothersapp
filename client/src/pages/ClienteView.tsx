/**
 * ClienteView - Visualização do cliente logado
 * Mostra apenas seus gastos pessoais
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { LogOut, TrendingDown, Plus, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLancamentos } from '@/hooks/useData';
import { useHideValues } from '@/contexts/HideValuesContext';
import { formatarValorComOcultacao } from '@/lib/hideValues';
import { Button } from '@/components/ui/button';
import { HideValuesToggle } from '@/components/HideValuesToggle';
import { AnnouncementBannerContainer } from '@/components/AnnouncementBannerContainer';
import PixPaymentModal from '@/components/PixPaymentModal';

interface ClienteViewProps {
  onNovoLancamento?: () => void;
}

export default function ClienteView({ onNovoLancamento }: ClienteViewProps) {
  const { usuarioLogado, fazer_logout } = useAuth();
  const { irPara } = useNavigation();
  const lancamentosQuery = useLancamentos();
  const { isHidden } = useHideValues();
  const [mostrarPix, setMostrarPix] = useState(false);

  const handleNovoLancamento = () => {
    if (onNovoLancamento) {
      onNovoLancamento();
    } else {
      irPara('novo-lancamento');
    }
  };

  // Dados do React Query
  const lancamentos = lancamentosQuery.data || [];
  const isLoading = lancamentosQuery.isLoading;

  // Filtrar lancamentos do cliente logado
  // Nota: servidor ja filtra apenas lancamentos ativos, entao aqui apenas filtramos por clienteId
  const lancamentosCliente = lancamentos.filter((l) => l.clienteId === (usuarioLogado?.id || 0));

  // Calcular saldo (dividir por 100 pois valores estão em centavos)
  const saldoTotal = lancamentosCliente.reduce((total, l) => {
    const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
    if (l.tipo === 'debito') return total + valor;
    if (l.tipo === 'pagamento') return total - valor;
    return total;
  }, 0) / 100;

  const formatarData = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'Data desconhecida';
    let date: Date;
    if (typeof timestamp === 'string') {
      if (timestamp.includes('T') || timestamp.includes('-')) {
        date = new Date(timestamp);
      } else {
        date = new Date(parseInt(timestamp));
      }
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Banners de Notícias */}
        <AnnouncementBannerContainer />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Gastos</h1>
            <p className="text-muted-foreground mt-1">Olá, {usuarioLogado?.nome}</p>
          </div>
          <div className="flex gap-2">
            <HideValuesToggle />
            <Button
              onClick={handleNovoLancamento}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={20} />
              Novo Lançamento
            </Button>
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

        {/* Saldo */}
        <div className="card-minimal p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Seu Saldo</p>
              <p className="text-4xl font-bold text-foreground mt-2 currency">
                {formatarValorComOcultacao(saldoTotal, isHidden)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Status:{' '}
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  saldoTotal > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {saldoTotal > 0 ? 'Pendente' : 'Em dia'}
                </span>
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              saldoTotal > 0
                ? 'bg-red-100 dark:bg-red-900'
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              <TrendingDown size={32} className={
                saldoTotal > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              } />
            </div>
          </div>

          {/* Botão Pagar via Pix — só aparece se houver saldo devedor */}
          {saldoTotal > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                onClick={() => setMostrarPix(true)}
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                disabled={isHidden}
              >
                <QrCode size={20} />
                Pagar {formatarValorComOcultacao(saldoTotal, isHidden)} via Pix
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                O crédito será registrado pelo estabelecimento após confirmação do pagamento.
              </p>
            </div>
          )}
        </div>

        {/* Histórico */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Histórico de Compras</h2>

          {lancamentosCliente.length === 0 ? (
            <div className="card-minimal p-8 text-center">
              <p className="text-muted-foreground">Nenhuma compra registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentosCliente.map((lancamento) => (
                <div
                  key={lancamento.id}
                  className="card-minimal p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {lancamento.tipo === 'debito' ? 'Débito' : 'Pagamento'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatarData(lancamento.data)}
                    </p>
                    {lancamento.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{lancamento.descricao}</p>
                    )}
                  </div>
                  <p className={`font-semibold currency ${
                    lancamento.tipo === 'debito'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {lancamento.tipo === 'debito' ? '+' : '-'} {formatarValorComOcultacao(lancamento.valor / 100, isHidden)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="card-minimal p-4 text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> Este é seu histórico de compras. Para dúvidas sobre o saldo, entre em contato com o estabelecimento.
          </p>
        </div>
      </div>

      {/* Modal Pix */}
      {mostrarPix && (
        <PixPaymentModal
          saldo={saldoTotal}
          nomeCliente={usuarioLogado?.nome || ''}
          onClose={() => setMostrarPix(false)}
        />
      )}
    </div>
  );
}
