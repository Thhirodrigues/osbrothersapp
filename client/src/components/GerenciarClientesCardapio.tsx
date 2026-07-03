/**
 * GerenciarClientesCardapio.tsx - Interface para admin selecionar clientes exclusivos por cardápio
 * Permite adicionar/remover clientes de cardápios específicos
 */

import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useClientes, useMenuClientes, useAdicionarClienteAoMenu, useRemoverClienteDoMenu } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface GerenciarClientesCardapioProps {
  menuId: string;
  menuName: string;
  onClose: () => void;
}

export default function GerenciarClientesCardapio({
  menuId,
  menuName,
  onClose,
}: GerenciarClientesCardapioProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Queries
  const clientesQuery = useClientes();
  const menuClientesQuery = useMenuClientes(menuId);
  
  // Mutations
  const adicionarClienteMutation = useAdicionarClienteAoMenu();
  const removerClienteMutation = useRemoverClienteDoMenu();

  const clientes = clientesQuery.data || [];
  const menuClientes = menuClientesQuery.data || [];
  
  // IDs dos clientes já associados ao cardápio
  const clientesAssociadosIds = new Set(menuClientes.map((c: any) => c.id));
  
  // Clientes disponíveis (não associados)
  const clientesDisponiveis = clientes.filter(
    (c: any) => !clientesAssociadosIds.has(c.id) && 
    c.nome?.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  const handleAdicionarCliente = async (clienteId: number) => {
    try {
      await adicionarClienteMutation.mutateAsync({
        menuId,
        clienteId,
      });
      toast.success('Cliente adicionado ao cardápio');
      setSearchTerm('');
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
    }
  };

  const handleRemoverCliente = async (clienteId: number) => {
    try {
      await removerClienteMutation.mutateAsync({
        menuId,
        clienteId,
      });
      toast.success('Cliente removido do cardápio');
    } catch (error) {
      toast.error('Erro ao remover cliente');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Clientes do Cardápio: {menuName}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Clientes Associados */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Clientes Associados ({menuClientes.length})
            </h3>
            {menuClientes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum cliente associado a este cardápio
              </p>
            ) : (
              <div className="space-y-2">
                {menuClientes.map((cliente: any) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cliente.name}</p>
                      <p className="text-sm text-muted-foreground">{cliente.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoverCliente(cliente.id)}
                      disabled={removerClienteMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Clientes */}
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-foreground mb-2">
              Adicionar Clientes
            </h3>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              {searchTerm && clientesDisponiveis.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum cliente disponível
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clientesDisponiveis.map((cliente: any) => (
                    <div
                      key={cliente.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.email}</p>
                      </div>
                      <button
                        onClick={() => handleAdicionarCliente(cliente.id)}
                        disabled={adicionarClienteMutation.isPending}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
