/**
 * CardapioClienteView.tsx - Visualização de cardápio para clientes
 * 
 * Características:
 * - Mostra "Itens Disponíveis" (sem nome do cardápio)
 * - Todos os itens expandidos com seleção de quantidade
 * - Cálculo automático do total
 * - Clientes logados e Conta Geral usam este componente
 */

import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  categories: MenuCategory[];
  is_active: number;
}

interface SelectedItem {
  item: MenuItem;
  quantity: number;
  subtotal: number;
}

interface CardapioClienteViewProps {
  menus: Menu[];
  clienteMenuFixoId?: string;
  onSelectionChange?: (items: SelectedItem[], total: number) => void;
}

export default function CardapioClienteView({ menus, clienteMenuFixoId, onSelectionChange }: CardapioClienteViewProps) {
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('cardapio-expanded-categories');
    if (saved) {
      try {
        setExpandedCategories(new Set(JSON.parse(saved)));
      } catch (e) {
        setExpandedCategories(new Set());
      }
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
    localStorage.setItem('cardapio-expanded-categories', JSON.stringify(Array.from(newExpanded)));
  };

  // Usar cardápio fixo do cliente se houver, senão usar o ativo
  const activeMenu = clienteMenuFixoId 
    ? menus.find((menu) => menu.id === clienteMenuFixoId) || menus.find((menu) => menu.is_active === 1) || menus[0]
    : menus.find((menu) => menu.is_active === 1) || menus[0];
  const allCategories = new Map<string, MenuCategory>();

  if (activeMenu?.categories) {
    activeMenu.categories.forEach((category) => {
      allCategories.set(category.id, category);
    });
  }

  // Filtrar por busca
  const filteredCategories = Array.from(allCategories.values())
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  // Calcular total para exibição
  const total = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  // Atualizar quantidade
  const updateQuantity = (itemId: string, quantity: number, item: MenuItem) => {
    const newItems = new Map(selectedItems);

    if (quantity <= 0) {
      newItems.delete(itemId);
    } else {
      newItems.set(itemId, {
        item,
        quantity,
        subtotal: quantity * item.price, // Manter em centavos
      });
    }

    setSelectedItems(newItems);

    // Calcular novo total DEPOIS de atualizar items
    const newTotal = Array.from(newItems.values()).reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    // Notificar mudança com total correto
    if (onSelectionChange) {
      onSelectionChange(Array.from(newItems.values()), newTotal);
    }
  };

  // Remover item
  const removeItem = (itemId: string) => {
    const newItems = new Map(selectedItems);
    newItems.delete(itemId);
    setSelectedItems(newItems);

    // Calcular novo total DEPOIS de remover item
    const newTotal = Array.from(newItems.values()).reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    if (onSelectionChange) {
      onSelectionChange(Array.from(newItems.values()), newTotal);
    }
  };

  if (menus.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          ℹ️ Nenhum cardápio disponível no momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Itens Disponíveis</h3>
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Categorias e Itens */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isExpanded = !expandedCategories.has(category.id);
          return (
          <div key={category.id} className="space-y-2 border border-border rounded-lg p-3 bg-card/50">
            {/* Header da Categoria com botão de minimizar/maximizar */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors"
            >
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide flex-1 text-left">
                {category.name}
              </h4>
              {isExpanded ? (
                <ChevronDown size={20} className="text-foreground" />
              ) : (
                <ChevronRight size={20} className="text-foreground" />
              )}
            </button>

            {/* Itens da Categoria - mostrar apenas se expandido */}
            {isExpanded && (
            <div className="space-y-2 animate-in fade-in duration-200">
              {category.items.map((item) => {
                const selected = selectedItems.get(item.id);
                const quantity = selected?.quantity || 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Info do Item */}
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      <p className="text-primary font-semibold text-sm">
                        R$ {(item.price / 100).toFixed(2)}
                      </p>
                    </div>

                    {/* Seletor de Quantidade */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => updateQuantity(item.id, 1, item)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, quantity - 1, item)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <Minus size={18} className="text-foreground" />
                        </button>
                        <span className="w-8 text-center font-semibold text-foreground">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, quantity + 1, item)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <Plus size={18} className="text-foreground" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Resumo de Seleção */}
      {selectedItems.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-foreground">Resumo da Seleção</h4>

          {/* Lista de Itens Selecionados */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from(selectedItems.values()).map((selected) => (
              <div key={selected.item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {selected.item.name} x{selected.quantity}
                </span>
                <span className="font-semibold text-foreground">
                  R$ {(selected.subtotal / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-primary/20 pt-3 flex items-center justify-between">
            <span className="font-semibold text-foreground">Total:</span>
            <span className="text-lg font-bold text-primary">
              R$ {(total / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
