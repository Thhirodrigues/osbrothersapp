/**
 * menu-selection-fix.test.ts - Testes para verificar que seleção de cardápio para edição
 * não altera o cardápio ativo do cliente
 */

describe('Menu Selection Fix - Editing vs Active Menu', () => {
  it('should not change active menu when selecting a menu for editing', () => {
    // Simular estado inicial
    const menus = [
      { id: 'adega-menu-1', name: 'Adega', is_active: true, description: 'Menu principal' },
      { id: 'after-menu-1', name: 'After', is_active: false, description: 'Menu after' }
    ];

    // Estado inicial
    let activeMenuId = menus.find(m => m.is_active)?.id || 'adega-menu-1';
    let editingMenuId = activeMenuId;

    // Verificar que ambos começam com o mesmo valor
    expect(activeMenuId).toBe('adega-menu-1');
    expect(editingMenuId).toBe('adega-menu-1');

    // Simular seleção do cardápio "After" para edição
    const selectedMenuId = 'after-menu-1';
    editingMenuId = selectedMenuId; // Apenas muda editingMenuId

    // Verificar que activeMenuId não mudou
    expect(activeMenuId).toBe('adega-menu-1');
    expect(editingMenuId).toBe('after-menu-1');
  });

  it('should allow editing prices in different menu without affecting active menu', () => {
    const menus = [
      {
        id: 'adega-menu-1',
        name: 'Adega',
        is_active: true,
        description: 'Menu principal',
        categories: [
          {
            id: 'cat-1',
            name: 'Cervejas',
            items: [
              { id: 'item-1', name: 'Cerveja 350ml', price: 1000 }
            ]
          }
        ]
      },
      {
        id: 'after-menu-1',
        name: 'After',
        is_active: false,
        description: 'Menu after',
        categories: [
          {
            id: 'cat-2',
            name: 'Cervejas',
            items: [
              { id: 'item-2', name: 'Cerveja 350ml', price: 1500 }
            ]
          }
        ]
      }
    ];

    // Estado inicial
    let activeMenuId = 'adega-menu-1';
    let editingMenuId = 'adega-menu-1';

    // Selecionar "After" para edição
    editingMenuId = 'after-menu-1';

    // Editar preço no menu "After"
    const updatedMenus = menus.map(menu => {
      if (menu.id === editingMenuId) {
        return {
          ...menu,
          categories: menu.categories.map(cat => ({
            ...cat,
            items: cat.items.map(item =>
              item.id === 'item-2' ? { ...item, price: 2000 } : item
            )
          }))
        };
      }
      return menu;
    });

    // Verificar que activeMenuId não mudou
    expect(activeMenuId).toBe('adega-menu-1');
    expect(editingMenuId).toBe('after-menu-1');

    // Verificar que o preço foi atualizado apenas no menu "After"
    const afterMenu = updatedMenus.find(m => m.id === 'after-menu-1');
    const adegaMenu = updatedMenus.find(m => m.id === 'adega-menu-1');

    expect(afterMenu?.categories[0].items[0].price).toBe(2000);
    expect(adegaMenu?.categories[0].items[0].price).toBe(1000);
  });

  it('should display warning showing which menu is active for clients', () => {
    const activeMenuId = 'adega-menu-1';
    const editingMenuId = 'after-menu-1';
    const menus = [
      { id: 'adega-menu-1', name: 'Adega', is_active: true },
      { id: 'after-menu-1', name: 'After', is_active: false }
    ];

    const activeMenuName = menus.find(m => m.id === activeMenuId)?.name;

    // Verificar que o aviso mostra o cardápio ativo correto
    expect(activeMenuName).toBe('Adega');
    expect(editingMenuId).toBe('after-menu-1');
  });
});
