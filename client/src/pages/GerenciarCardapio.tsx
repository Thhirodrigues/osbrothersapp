/**
 * GerenciarCardapio.tsx - Página de gerenciamento de cardápios para administradores
 * Permite alternar entre cardápios, visualizar itens e editar valores
 */

import { useState, useEffect } from 'react';

interface Menu {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  categories?: MenuCategory[];
}

interface MenuCategory {
  id: string;
  name: string;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function GerenciarCardapio() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>('adega-menu-1'); // Cardápio ativo do cliente (não muda)
  const [editingMenuId, setEditingMenuId] = useState<string>('adega-menu-1'); // Cardápio em edição (pode mudar)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      // Carregar cardápios do localStorage
      const savedMenus = localStorage.getItem('menus');
      if (savedMenus) {
        const parsedMenus = JSON.parse(savedMenus);
        setMenus(parsedMenus);
        
        // Encontrar menu ativo (não muda ao editar)
        const active = parsedMenus.find((m: Menu) => m.is_active);
        if (active) {
          setActiveMenuId(active.id);
          setEditingMenuId(active.id); // Inicia com o mesmo, mas pode mudar
          setSelectedMenu(active);
        } else if (parsedMenus.length > 0) {
          setEditingMenuId(parsedMenus[0].id);
          setSelectedMenu(parsedMenus[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMenu = async (menuId: string) => {
    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      // Apenas mudar o cardápio em edição, NÃO o cardápio ativo
      setEditingMenuId(menuId);
      setSelectedMenu(menu);
    } catch (error) {
      console.error('Erro ao selecionar cardápio:', error);
    }
  };

  const handleEditPrice = (itemId: string, currentPrice: number) => {
    setEditingItem(itemId);
    setNewPrice(currentPrice);
  };

  const handleSavePrice = async (itemId: string) => {
    try {
      // Atualizar preço no localStorage
      const updatedMenus = menus.map(menu => ({
        ...menu,
        categories: menu.categories?.map(cat => ({
          ...cat,
          items: cat.items?.map(item => 
            item.id === itemId ? { ...item, price: newPrice } : item
          )
        }))
      }));

      localStorage.setItem('menus', JSON.stringify(updatedMenus));
      setMenus(updatedMenus);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
    }
  };

  const handleReorderCategory = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const category = selectedMenu?.categories?.find(c => c.id === categoryId);
      if (!category) return;

      const currentOrder = (category as any).order || 0;
      const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

      const response = await fetch(`/api/menus/categories/${categoryId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder })
      });
      if (response.ok) {
        loadMenus();
      }
    } catch (error) {
      console.error('Erro ao reordenar categoria:', error);
    }
  };

  const handleReorderItem = async (itemId: string, direction: 'up' | 'down') => {
    try {
      const item = selectedMenu?.categories?.flatMap(c => c.items || []).find(i => i.id === itemId);
      if (!item) return;

      const currentOrder = (item as any).order || 0;
      const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

      const response = await fetch(`/api/menu-items/${itemId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder })
      });
      if (response.ok) {
        loadMenus();
      }
    } catch (error) {
      console.error('Erro ao reordenar item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cardápios...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Cardápios</h1>

      {/* Seleção de Cardápio */}
      <div className="mb-8 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Selecione o Cardápio para Editar</h2>
        <p className="text-sm text-muted-foreground mb-4">⚠️ Cardápio ativo do cliente: <strong>{menus.find(m => m.id === activeMenuId)?.name}</strong></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menus.map(menu => (
            <button
              key={menu.id}
              onClick={() => handleSelectMenu(menu.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                editingMenuId === menu.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-border hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    editingMenuId === menu.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                />
                <div className="text-left">
                  <p className="font-semibold">{menu.name}</p>
                  <p className="text-sm text-muted-foreground">{menu.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Itens do Cardápio Selecionado */}
      {selectedMenu && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Itens - {selectedMenu.name}
          </h2>

          {selectedMenu.categories && selectedMenu.categories.length > 0 ? (
            selectedMenu.categories.map(category => (
              <div key={category.id} className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReorderCategory(category.id, 'up')}
                      className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm"
                      title="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleReorderCategory(category.id, 'down')}
                      className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm"
                      title="Mover para baixo"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {category.items && category.items.length > 0 ? (
                  <div className="space-y-3">
                    {category.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-background rounded border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleReorderItem(item.id, 'up')}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                              title="Mover para cima"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleReorderItem(item.id, 'down')}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                              title="Mover para baixo"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingItem === item.id ? (
                            <>
                              <input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 border border-border rounded"
                              />
                              <button
                                onClick={() => handleSavePrice(item.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-bold text-blue-600">
                                R$ {(item.price / 100).toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleEditPrice(item.id, item.price)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Editar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum item nesta categoria</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhuma categoria disponível</p>
          )}
        </div>
      )}
    </div>
  );
}
