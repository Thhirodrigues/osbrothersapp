import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  ShieldCheck, User, Trash2, RotateCcw, Filter,
  RefreshCw, ChevronDown, ChevronUp, Calendar,
  AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';

interface LancamentoAuditoria {
  id: number;
  clienteId: number;
  cliente_nome: string | null;
  tipo: 'debito' | 'pagamento';
  valor: number;
  descricao: string | null;
  data: string;
  status: 'ativo' | 'inativo' | 'pendente';
  registrado_por: string | null;
  registrado_por_id: string | null;
  registrado_por_nome: string | null;
  excluido_por: string | null;
  excluido_por_id: string | null;
  excluido_por_nome: string | null;
  excluido_em: string | null;
  motivo_exclusao: string | null;
  reativado_por_id: string | null;
  reativado_por_nome: string | null;
  reativado_em: string | null;
}

type FiltroStatus = 'todos' | 'ativo' | 'inativo';

function formatarData(data: string | null): string {
  if (!data) return '—';
  try {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return data;
  }
}

function formatarValor(valor: number): string {
  return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function BadgeOrigem({ origem }: { origem: string | null }) {
  if (!origem) return null;
  const map: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800' },
    user: { label: 'Usuário', color: 'bg-green-100 text-green-800' },
    conta_geral: { label: 'Conta Geral', color: 'bg-yellow-100 text-yellow-800' },
  };
  const entry = map[origem] ?? { label: origem, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.color}`}>
      {entry.label}
    </span>
  );
}

export default function Auditoria() {
  const { usuarioLogado } = useAuth();
  const [lancamentos, setLancamentos] = useState<LancamentoAuditoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [reativando, setReativando] = useState<number | null>(null);

  const carregarAuditoria = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(
        `/api/auditoria/lancamentos?status=${filtroStatus}&limit=200`,
        { credentials: 'include' }
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      const data: LancamentoAuditoria[] = await resp.json();
      setLancamentos(data);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados de auditoria');
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus]);

  useEffect(() => { carregarAuditoria(); }, [carregarAuditoria]);

  const toggleExpandido = (id: number) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reativarLancamento = async (id: number) => {
    setReativando(id);
    try {
      const u = usuarioLogado as any;
      const resp = await fetch(`/api/lancamentos/${id}/reativar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adminNome: u?.nome || u?.name || 'Admin',
          adminId: u?.id ? String(u.id) : null,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      toast.success('Lançamento reativado com sucesso!');
      await carregarAuditoria();
    } catch (e: any) {
      toast.error(`Erro ao reativar: ${e.message}`);
    } finally {
      setReativando(null);
    }
  };

  const totalAtivos = lancamentos.filter(l => l.status === 'ativo').length;
  const totalInativos = lancamentos.filter(l => l.status === 'inativo').length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Auditoria de Lançamentos</h1>
          <p className="text-sm text-muted-foreground">Rastreabilidade completa de criação, exclusão e reativação</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{lancamentos.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
          <p className="text-xs text-muted-foreground mt-1">Ativos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{totalInativos}</p>
          <p className="text-xs text-muted-foreground mt-1">Inativos</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        {(['todos', 'ativo', 'inativo'] as FiltroStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltroStatus(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroStatus === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
        <button
          onClick={carregarAuditoria}
          className="ml-auto p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Recarregar"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro ao carregar dados</p>
            <p className="text-xs text-red-600 mt-0.5">{erro}</p>
          </div>
          <button onClick={carregarAuditoria} className="ml-auto text-xs text-red-600 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {carregando && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando auditoria...</span>
        </div>
      )}

      {!carregando && !erro && lancamentos.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
        </div>
      )}

      {!carregando && !erro && lancamentos.length > 0 && (
        <div className="space-y-2">
          {lancamentos.map(l => {
            const isExpandido = expandidos.has(l.id);
            const isInativo = l.status === 'inativo';
            const isReativando = reativando === l.id;
            return (
              <div
                key={l.id}
                className={`bg-card border rounded-lg overflow-hidden transition-all ${
                  isInativo ? 'border-red-200 opacity-80' : 'border-border'
                }`}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleExpandido(l.id)}
                >
                  <div className="flex-shrink-0">
                    {isInativo
                      ? <Trash2 className="w-4 h-4 text-red-400" />
                      : <CheckCircle2 className="w-4 h-4 text-green-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">
                        {l.cliente_nome || `Cliente #${l.clienteId}`}
                      </span>
                      <span className={`text-xs font-semibold ${l.tipo === 'debito' ? 'text-red-600' : 'text-green-600'}`}>
                        {l.tipo === 'debito' ? '−' : '+'}{formatarValor(l.valor)}
                      </span>
                      <BadgeOrigem origem={l.registrado_por} />
                      {isInativo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {l.descricao || '—'} · {formatarData(l.data)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isInativo && (
                      <button
                        onClick={e => { e.stopPropagation(); reativarLancamento(l.id); }}
                        disabled={isReativando}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3 h-3 ${isReativando ? 'animate-spin' : ''}`} />
                        {isReativando ? 'Reativando...' : 'Reativar'}
                      </button>
                    )}
                    {isExpandido
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </div>

                {isExpandido && (
                  <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Criado por</p>
                        <p className="text-xs text-muted-foreground">
                          {l.registrado_por_nome || '—'}
                          {l.registrado_por_id && (
                            <span className="ml-1 text-muted-foreground/60">(ID: {l.registrado_por_id})</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />{formatarData(l.data)}
                        </p>
                      </div>
                    </div>

                    {isInativo && (
                      <div className="flex items-start gap-2">
                        <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Inativado por</p>
                          <p className="text-xs text-muted-foreground">
                            {l.excluido_por_nome || l.excluido_por || '—'}
                            {l.excluido_por_id && (
                              <span className="ml-1 text-muted-foreground/60">(ID: {l.excluido_por_id})</span>
                            )}
                          </p>
                          {l.excluido_em && (
                            <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />{formatarData(l.excluido_em)}
                            </p>
                          )}
                          {l.motivo_exclusao && (
                            <p className="text-xs text-red-600 mt-0.5">Motivo: {l.motivo_exclusao}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {l.reativado_por_nome && (
                      <div className="flex items-start gap-2">
                        <RotateCcw className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Reativado por</p>
                          <p className="text-xs text-muted-foreground">
                            {l.reativado_por_nome}
                            {l.reativado_por_id && (
                              <span className="ml-1 text-muted-foreground/60">(ID: {l.reativado_por_id})</span>
                            )}
                          </p>
                          {l.reativado_em && (
                            <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />{formatarData(l.reativado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground/50 text-right">
                      Lançamento #{l.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
