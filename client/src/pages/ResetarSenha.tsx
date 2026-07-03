/**
 * ResetarSenha.tsx - Página de recuperação de senha
 * Usa as rotas reais do servidor com bcrypt
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ResetarSenhaProps {
  onVoltar: () => void;
}

type Etapa = 'inicio' | 'email' | 'nome' | 'sucesso';

export default function ResetarSenha({ onVoltar }: ResetarSenhaProps) {
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSolicitarPorEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Digite seu e-mail'); return; }
    setCarregando(true);
    try {
      await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Mensagem genérica por segurança
      toast.success('Se o e-mail estiver cadastrado, você receberá as instruções em breve.');
      setEtapa('sucesso');
    } catch {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarPorNome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nome.trim() || !novaSenha || !confirmaSenha) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (novaSenha !== confirmaSenha) { toast.error('As senhas não coincidem'); return; }
    if (novaSenha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return; }

    setCarregando(true);
    try {
      const response = await fetch('/api/auth/reset-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, novaSenha }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'E-mail ou nome incorretos');
        return;
      }
      toast.success('Senha definida com sucesso! Faça login com a nova senha.');
      setEtapa('sucesso');
      setTimeout(onVoltar, 2500);
    } catch {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
            <span className="text-2xl font-bold">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Recuperar Senha</h1>
          <p className="text-muted-foreground mt-2">Os Brothers Adega</p>
        </div>

        {/* Etapa: Início */}
        {etapa === 'inicio' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Escolha como deseja recuperar sua senha:</p>

            <button
              onClick={() => setEtapa('email')}
              className="w-full flex items-center gap-3 p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-medium text-foreground">Recuperar por E-mail</p>
                <p className="text-xs text-muted-foreground">Receba um link no seu e-mail</p>
              </div>
            </button>

            <button
              onClick={() => setEtapa('nome')}
              className="w-full flex items-center gap-3 p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-medium text-foreground">Verificar pelo Nome</p>
                <p className="text-xs text-muted-foreground">Use seu nome cadastrado para definir nova senha</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onVoltar}
              className="w-full text-sm text-primary hover:underline pt-2"
            >
              ← Voltar para Login
            </button>
          </div>
        )}

        {/* Etapa: E-mail */}
        {etapa === 'email' && (
          <form onSubmit={handleSolicitarPorEmail} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha (válido por 1 hora).
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={carregando}
              />
            </div>
            <Button type="submit" disabled={carregando} className="w-full">
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
            <button type="button" onClick={() => setEtapa('inicio')} className="w-full text-sm text-primary hover:underline">
              ← Voltar
            </button>
          </form>
        )}

        {/* Etapa: Verificar pelo Nome */}
        {etapa === 'nome' && (
          <form onSubmit={handleRecuperarPorNome} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail e nome exatamente como estão cadastrados para definir uma nova senha.
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={carregando}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome completo (como cadastrado)</label>
              <Input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                disabled={carregando}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={carregando}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirmar Nova Senha</label>
              <Input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="Repita a nova senha"
                disabled={carregando}
              />
            </div>
            <Button type="submit" disabled={carregando} className="w-full">
              {carregando ? 'Salvando...' : 'Definir Nova Senha'}
            </Button>
            <button type="button" onClick={() => setEtapa('inicio')} className="w-full text-sm text-primary hover:underline">
              ← Voltar
            </button>
          </form>
        )}

        {/* Etapa: Sucesso */}
        {etapa === 'sucesso' && (
          <div className="text-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
            <p className="text-5xl">✅</p>
            <h2 className="text-xl font-bold text-foreground">Pronto!</h2>
            <p className="text-muted-foreground text-sm">
              Verifique seu e-mail ou faça login com a nova senha.
            </p>
            <Button onClick={onVoltar} className="w-full">
              Voltar ao Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
