import { useState, useEffect } from 'react';

interface AppConfig {
  templateWhatsapp: string;
}

const DEFAULT_TEMPLATE = `Olá, {cliente}! Passando para lembrar que a sua continha de {valor} na adega está em aberto. Segue o pix para pagamento osbrothersadega@gmail.com`;

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>({
    templateWhatsapp: DEFAULT_TEMPLATE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          setError(null);
        } else {
          setConfig({ templateWhatsapp: DEFAULT_TEMPLATE });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setConfig({ templateWhatsapp: DEFAULT_TEMPLATE });
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
}
