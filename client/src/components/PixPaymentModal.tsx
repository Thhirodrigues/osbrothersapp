/**
 * PixPaymentModal - Modal de pagamento via Pix para o cliente
 * Exibe QR Code com o valor do saldo devedor e botão de copiar código
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { gerarPixPayload } from '@/lib/pixPayload';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixPaymentModalProps {
  saldo: number; // valor em reais (positivo = devendo)
  nomeCliente: string;
  onClose: () => void;
}

export default function PixPaymentModal({ saldo, nomeCliente, onClose }: PixPaymentModalProps) {
  const [copiado, setCopiado] = useState(false);

  // Só exibir se houver saldo devedor
  const valorDevido = Math.max(saldo, 0);
  const pixPayload = gerarPixPayload(valorDevido);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopiado(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Fallback para navegadores sem suporte a clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = pixPayload;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Pagar via Pix</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{nomeCliente}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-5">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">Valor a pagar</p>
            <p className="text-4xl font-bold text-foreground mt-1">
              R$ {valorDevido.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl border border-border">
              <QRCodeSVG
                value={pixPayload}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground text-center space-y-1">
            <p>Abra o app do seu banco e escaneie o QR Code</p>
            <p>ou copie o código abaixo</p>
          </div>

          {/* Botão Copiar */}
          <Button
            onClick={handleCopiar}
            variant="outline"
            className="w-full gap-2"
          >
            {copiado ? (
              <>
                <Check size={18} className="text-green-600" />
                <span className="text-green-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                Copiar código Pix
              </>
            )}
          </Button>

          {/* Aviso */}
          <p className="text-xs text-muted-foreground text-center">
            Após o pagamento, o crédito será registrado pelo estabelecimento.
          </p>
        </div>
      </div>
    </div>
  );
}
