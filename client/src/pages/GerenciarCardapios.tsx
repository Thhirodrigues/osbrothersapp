/**
 * GerenciarCardapios - Página para gerenciar cardápios
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, X, Check, FolderPlus } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  description: string;
  is_active: boolean;
  categories: MenuCategory[];
}

export default function GerenciarCardapios() {
  const { voltar } = useNavigation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>(''); // Cardápio ativo do cliente (não muda)
  const [selectedMenuId, setSelectedMenuId] = useState<string>(''); // Cardápio em edição (pode mudar)
  const [carregando, setCarregando] = useState(true);

  // Item editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);

  // Add item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Category management
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategorySaving, setEditingCategorySaving] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Create new menu
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const [creatingMenu, setCreatingMenu] = useState(false);

  // Carregar cardápios
  useEffect(() => {
    carregarCardapios();
  }, []);

  const carregarCardapios = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/menus');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMenus(data.menus || []);
      const activeMenu = data.menus?.find((m: Menu) => m.is_active);
      if (activeMenu) {
        setActiveMenuId(activeMenu.id); // Define cardápio ativo
        setSelectedMenuId(activeMenu.id); // Inicia edição com o mesmo
      } else if (data.menus && data.menus.length > 0) {
        setSelectedMenuId(data.menus[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error);
      toast.error('Erro ao carregar cardápios');
    } finally {
      setCarregando(false);
    }
  };

  const handleToggleMenu = async (menuId: string) => {
    try {
      const response = await fetch(`/api/menus/${menuId}/ativar`, { method: 'PUT' });
      if (response.ok) {
        toast.success('Cardápio ativado com sucesso!');
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
        // Não muda selectedMenuId automaticamente - deixa o usuário escolher
      } else {
        toast.error('Erro ao ativar cardápio');
      }
    } catch (error) {
      toast.error('Erro ao ativar cardápio');
    }
  };

  const handleSelectMenu = (menuId: string) => {
    // Apenas muda o cardápio em edição, NÃO o cardápio ativo
    setSelectedMenuId(menuId);
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
        toast.success(`Categoria movida para ${direction === 'up' ? 'cima' : 'baixo'}!`);
        await carregarCardapios();
      }
    } catch (error) {
      console.error('Erro ao reordenar categoria:', error);
      toast.error('Erro ao reordenar categoria');
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
        toast.success(`Item movido para ${direction === 'up' ? 'cima' : 'baixo'}!`);
        await carregarCardapios();
      }
    } catch (error) {
      console.error('Erro ao reordenar item:', error);
      toast.error('Erro ao reordenar item');
    }
  };

  // ── Item handlers ──────────────────────────────────────────────────────────

  const handleSaveItem = async (itemId: string) => {
    setEditingSaving(true);
    try {
      const nameRes = await fetch(`/api/menus/items/${itemId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });
      const priceValue = Math.round(parseFloat(editingPrice) * 100);
      const priceRes = await fetch(`/api/menus/items/${itemId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceValue }),
      });
      if (nameRes.ok && priceRes.ok) {
        toast.success('Item atualizado!');
        localStorage.removeItem('menus_cache');
        setEditingItemId(null);
        await carregarCardapios();
      } else {
        toast.error('Erro ao atualizar item');
      }
    } catch (error) {
      toast.error('Erro ao atualizar item');
    } finally {
      setEditingSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    try {
      const response = await fetch(`/api/menus/items/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Item removido!');
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
      } else {
        toast.error('Erro ao remover item');
      }
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemPrice || !selectedCategoryId) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      const priceValue = Math.round(parseFloat(newItemPrice) * 100);
      const response = await fetch(`/api/menus/categories/${selectedCategoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, price: priceValue }),
      });
      if (response.ok) {
        toast.success('Item adicionado!');
        setNewItemName('');
        setNewItemPrice('');
        setShowAddItemModal(false);
        await carregarCardapios();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Erro ao adicionar item');
      }
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  // ── Category handlers ──────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }
    if (!selectedMenuId) {
      toast.error('Selecione um cardápio');
      return;
    }
    try {
      const response = await fetch(`/api/menus/${selectedMenuId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (response.ok) {
        toast.success('Categoria criada!');
        setNewCategoryName('');
        setShowAddCategoryModal(false);
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleSaveCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }
    setEditingCategorySaving(true);
    try {
      const response = await fetch(`/api/menus/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName }),
      });
      if (response.ok) {
        toast.success('Categoria atualizada!');
        setEditingCategoryId(null);
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Erro ao atualizar categoria');
      }
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    } finally {
      setEditingCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Remover a categoria "${categoryName}" e todos os seus itens?`)) return;
    try {
      const response = await fetch(`/api/menus/categories/${categoryId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Categoria removida!');
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
      } else {
        toast.error('Erro ao remover categoria');
      }
    } catch (error) {
      toast.error('Erro ao remover categoria');
    }
  };

  const handleCreateNewMenu = async () => {
    if (!newMenuName.trim()) {
      toast.error('Informe o nome do cardapio');
      return;
    }
    setCreatingMenu(true);
    try {
      const response = await fetch('/api/menus/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMenuName.trim(),
          description: newMenuDescription.trim()
        })
      });
      if (response.ok) {
        const newMenu = await response.json();
        toast.success('Cardapio criado com sucesso!');
        setNewMenuName('');
        setNewMenuDescription('');
        setShowCreateMenuModal(false);
        localStorage.removeItem('menus_cache');
        await carregarCardapios();
        setSelectedMenuId(newMenu.id);
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Erro ao criar cardapio');
      }
    } catch (error) {
      console.error('Erro ao criar cardapio:', error);
      toast.error('Erro ao criar cardapio');
    } finally {
      setCreatingMenu(false);
    }
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cardápios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={voltar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Cardápios</h1>
          <p className="text-muted-foreground">Edite categorias, preços e itens dos cardápios</p>
        </div>
      </div>

      {/* Seleção de Cardápio */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Cardápios Disponíveis</h2>
          <button
            onClick={() => setShowCreateMenuModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Novo Cardápio
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleSelectMenu(menu.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedMenuId === menu.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                  : 'border-border bg-background hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{menu.name}</p>
                  <p className="text-sm text-muted-foreground">{menu.description}</p>
                </div>
                {menu.is_active && (
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                    Ativo
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Aviso do cardápio ativo do cliente */}
      {activeMenuId && activeMenuId !== selectedMenuId && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Cardápio ativo para clientes:</strong> {menus.find(m => m.id === activeMenuId)?.name}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Você está editando "{selectedMenu?.name}" sem alterar o cardápio que os clientes veem.
          </p>
        </div>
      )}

      {/* Edição de Categorias e Itens */}
      {selectedMenu && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Categorias — {selectedMenu.name}
            </h2>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FolderPlus size={16} />
              Nova Categoria
            </button>
          </div>

          {selectedMenu.categories.map((category) => (
            <div key={category.id} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg">
                {editingCategoryId === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCategory(category.id);
                        if (e.key === 'Escape') setEditingCategoryId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveCategory(category.id)}
                      disabled={editingCategorySaving}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                    >
                      <Check size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                    >
                      <X size={16} className="text-red-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <div className="flex items-center gap-1">
                      {/* Mover para cima */}
                      <button
                        onClick={() => handleReorderCategory(category.id, 'up')}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
                        title="Mover categoria para cima"
                      >
                        <span className="text-sm font-bold text-gray-600">↑</span>
                      </button>
                      {/* Mover para baixo */}
                      <button
                        onClick={() => handleReorderCategory(category.id, 'down')}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
                        title="Mover categoria para baixo"
                      >
                        <span className="text-sm font-bold text-gray-600">↓</span>
                      </button>
                      {/* Editar categoria */}
                      <button
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingCategoryName(category.name);
                        }}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                        title="Renomear categoria"
                      >
                        <Edit2 size={15} className="text-blue-600" />
                      </button>
                      {/* Adicionar item */}
                      <button
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setShowAddItemModal(true);
                        }}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="Adicionar item"
                      >
                        <Plus size={15} className="text-blue-600" />
                      </button>
                      {/* Deletar categoria */}
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        title="Remover categoria"
                      >
                        <Trash2 size={15} className="text-red-600" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2 pl-2">
                {category.items.length === 0 && (
                  <p className="text-sm text-muted-foreground italic px-3 py-2">
                    Nenhum item nesta categoria.
                  </p>
                )}
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleReorderItem(item.id, 'up')}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors flex-shrink-0"
                          title="Mover item para cima"
                        >
                          <span className="text-xs font-bold text-gray-600">↑</span>
                        </button>
                        <button
                          onClick={() => handleReorderItem(item.id, 'down')}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors flex-shrink-0"
                          title="Mover item para baixo"
                        >
                          <span className="text-xs font-bold text-gray-600">↓</span>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                      {editingItemId === item.id ? (
                        <div className="space-y-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Nome do item"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            placeholder="Preço (R$)"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {(item.price / 100).toFixed(2).replace('.', ',')}
                          </p>
                        </>
                      )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingItemId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            disabled={editingSaving}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                          >
                            <Check size={18} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            <X size={18} className="text-red-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingName(item.name);
                              setEditingPrice((item.price / 100).toFixed(2));
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-background rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Adicionar Item</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item"
              className="w-full"
            />
            <Input
              type="number"
              step="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Preço (R$)"
              className="w-full"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Categoria */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-background rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Nova Categoria</h2>
              <button
                onClick={() => { setShowAddCategoryModal(false); setNewCategoryName(''); }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cardápio: <span className="font-medium text-foreground">{selectedMenu?.name}</span>
            </p>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria (ex: CERVEJAS)"
              className="w-full"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddCategoryModal(false); setNewCategoryName(''); }}
                className="flex-1 py-2 px-4 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
              >
                Criar Categoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Criar Novo Cardápio */}
      {showCreateMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Criar Novo Cardápio</h3>
              <button
                onClick={() => {
                  setShowCreateMenuModal(false);
                  setNewMenuName('');
                  setNewMenuDescription('');
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Cardápio
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Cardápio de Bebidas"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição (opcional)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Bebidas especiais da casa"
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCreateMenuModal(false);
                  setNewMenuName('');
                  setNewMenuDescription('');
                }}
                className="flex-1 py-2 px-4 rounded-lg border border-border text-foreground hover:bg-muted transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewMenu}
                disabled={creatingMenu || !newMenuName.trim()}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {creatingMenu ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
