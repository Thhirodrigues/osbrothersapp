import React, { useState } from 'react';
import { toast } from 'sonner';

type EtapaRecuperacao = 'inicio' | 'email' | 'pergunta' | 'sucesso';

export default function RecuperacaoSenha({ onVoltar }: { onVoltar: () => void }) {
  const [etapa, setEtapa] = useState<EtapaRecuperacao>('inicio');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSolicitarPorEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Digite seu e-mail');
      return;
    }
    setCarregando(true);
    try {
      await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Sempre mostrar mensagem genérica por segurança
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
    if (!email || !nome || !novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não conferem');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setCarregando(true);
    try {
      const response = await fetch('/api/auth/reset-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, novaSenha }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Dados incorretos');
        return;
      }
      toast.success('Senha definida com sucesso! Faça login com a nova senha.');
      setEtapa('sucesso');
    } catch {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #3b82f6, #818cf8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onVoltar}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.5rem'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Recuperar Senha</h1>
        </div>

        {/* Etapa: Início */}
        {etapa === 'inicio' && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Escolha como deseja recuperar sua senha:
            </p>

            <button
              onClick={() => setEtapa('email')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: '1.5rem' }}>📧</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '500' }}>Recuperar por E-mail</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Receba um link no seu e-mail</p>
              </div>
            </button>

            <button
              onClick={() => setEtapa('pergunta')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '500' }}>Verificar pelo Nome</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Use seu nome cadastrado para definir uma nova senha</p>
              </div>
            </button>
          </div>
        )}

        {/* Etapa: E-mail */}
        {etapa === 'email' && (
          <form onSubmit={handleSolicitarPorEmail} style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha (válido por 1 hora).
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: carregando ? '#93c5fd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: carregando ? 'not-allowed' : 'pointer',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}
            >
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'white',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Verificar pelo Nome */}
        {etapa === 'pergunta' && (
          <form onSubmit={handleRecuperarPorNome} style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Informe seu e-mail e nome exatamente como estão cadastrados para definir uma nova senha.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Nome completo (como cadastrado)
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Nova Senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: carregando ? '#93c5fd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: carregando ? 'not-allowed' : 'pointer',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}
            >
              {carregando ? 'Salvando...' : 'Definir Nova Senha'}
            </button>
            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'white',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Sucesso */}
        {etapa === 'sucesso' && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</p>
            <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Pronto!</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Verifique seu e-mail ou faça login com a nova senha.
            </p>
            <button
              onClick={onVoltar}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
