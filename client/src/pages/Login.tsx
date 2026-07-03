/**
 * Login - Tela de autenticação
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ResetarSenha from './ResetarSenha';
type AbaType = 'login' | 'registro' | 'inicio' | 'resetar';

export default function Login() {
  const { fazer_login, fazer_registro, entrarComContaGeral } = useAuth();
  const [aba, setAba] = useState<AbaType>('inicio');

  // Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Registro
  const [emailRegistro, setEmailRegistro] = useState('');
  const [senhaRegistro, setSenhaRegistro] = useState('');
  const [mostrarSenhaRegistro, setMostrarSenhaRegistro] = useState(false);
  const [nomeRegistro, setNomeRegistro] = useState('');
  const [telefoneRegistro, setTelefoneRegistro] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'cliente'>('cliente');
  const [carregandoRegistro, setCarregandoRegistro] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin || !senhaLogin) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setCarregandoLogin(true);
      await fazer_login(emailLogin, senhaLogin);
      // Redirecionamento feito pelo AuthContext — sem toast para não sobrepor a UI
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegistro || !senhaRegistro || !nomeRegistro || !telefoneRegistro) {
      toast.error('Preencha todos os campos obrigatórios (telefone é necessário para cobranças)');
      return;
    }

    try {
      setCarregandoRegistro(true);
      await fazer_registro(emailRegistro, senhaRegistro, nomeRegistro, tipoUsuario, telefoneRegistro || undefined);
      // Cadastro OK — fazer login automático
      toast.success('Cadastro realizado, efetuando login...');
      await fazer_login(emailRegistro, senhaRegistro);
      // O AuthContext vai setar usuarioLogado e o App.tsx redireciona automaticamente
    } catch (error) {
      // Só exibe erro se realmente falhou (não após sucesso)
      const msg = error instanceof Error ? error.message : '';
      if (msg && !msg.includes('sucesso')) {
        toast.error(msg || 'Erro ao realizar cadastro');
      }
    } finally {
      setCarregandoRegistro(false);
    }
  };

  const handleContaGeral = () => {
    entrarComContaGeral();
    toast.success('Entrando com conta geral...');
  };

  if (aba === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663097499900/dyVJYfPkMaKo6dqqnRNgqj/after-dadega-logo-no-bg_89bc2954.png"
              alt="After Dadega Logo"
              className="w-40 h-40 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-foreground">Os Brothers Adega</h1>
            <p className="text-muted-foreground mt-2">Adega ON</p>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={() => setAba('login')}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Fazer Login
            </Button>

            <Button
              onClick={() => setAba('registro')}
              variant="outline"
              className="w-full py-3 font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Criar Conta
            </Button>

{/* Conta Geral desabilitada por solicitação do administrador */}
          </div>

          {/* Informações */}
          <div className="card-minimal p-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Login:</strong> Para admins e clientes cadastrados
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (aba === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleLogin} className="card-minimal p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Fazer Login</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <div className="relative">
                <Input
                  type={mostrarSenhaLogin ? 'text' : 'password'}
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mostrarSenhaLogin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={carregandoLogin}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {carregandoLogin ? 'Entrando...' : 'Entrar'}
            </Button>

            <button
              type="button"
              onClick={() => setAba('resetar')}
              className="w-full text-sm text-primary hover:underline mb-2"
            >
              Esqueceu a senha?
            </button>

            <button
              type="button"
              onClick={() => setAba('inicio')}
              className="w-full text-sm text-primary hover:underline"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (aba === 'resetar') {
    return <ResetarSenha onVoltar={() => setAba('login')} />;
  }

  if (aba === 'registro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleRegistro} className="card-minimal p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Criar Conta</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
              <Input
                type="text"
                value={nomeRegistro}
                onChange={(e) => setNomeRegistro(e.target.value)}
                placeholder="Seu nome"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={emailRegistro}
                onChange={(e) => setEmailRegistro(e.target.value)}
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <div className="relative">
                <Input
                  type={mostrarSenhaRegistro ? 'text' : 'password'}
                  value={senhaRegistro}
                  onChange={(e) => setSenhaRegistro(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaRegistro(!mostrarSenhaRegistro)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mostrarSenhaRegistro ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              ℹ️ Contas de administrador são criadas apenas por administradores existentes nas Configurações.
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefone <span className="text-red-500">*</span></label>
              <Input
                type="tel"
                value={telefoneRegistro}
                onChange={(e) => setTelefoneRegistro(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={carregandoRegistro}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {carregandoRegistro ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <button
              type="button"
              onClick={() => setAba('inicio')}
              className="w-full text-sm text-primary hover:underline"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
