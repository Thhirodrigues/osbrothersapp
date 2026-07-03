import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface RedefinirSenhaProps {
  token: string;
  onSucesso: () => void;
}

export default function RedefinirSenha({ token, onSucesso }: RedefinirSenhaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se o token parece válido (64 hex chars)
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      setTokenValido(true);
    } else {
      setTokenValido(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha || !confirmarSenha) {
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao redefinir senha');
        return;
      }

      toast.success('Senha redefinida com sucesso! Faça login com a nova senha.');
      setTimeout(onSucesso, 2000);
    } catch (error) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setCarregando(false);
    }
  };

  if (tokenValido === false) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #3b82f6, #818cf8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</p>
          <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Link inválido</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Este link de redefinição de senha é inválido ou expirou.
          </p>
          <button
            onClick={onSucesso}
            style={{
              padding: '0.5rem 1.5rem',
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
      </div>
    );
  }

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
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
            🔐 Redefinir Senha
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Os Brothers Adega
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
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
              padding: '0.75rem',
              background: carregando ? '#93c5fd' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: carregando ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}
          >
            {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>

          <button
            type="button"
            onClick={onSucesso}
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
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
