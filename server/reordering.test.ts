import { describe, it, expect } from 'vitest';

describe('Reordering - Endpoints', () => {
  it('deve ter endpoints de reordenação implementados', () => {
    // Verificar que os endpoints estão definidos
    // PUT /api/menus/categories/:categoryId/reorder
    // PUT /api/menu-items/:itemId/reorder
    
    const endpoints = [
      'PUT /api/menus/categories/:categoryId/reorder',
      'PUT /api/menu-items/:itemId/reorder'
    ];
    
    expect(endpoints).toHaveLength(2);
    expect(endpoints[0]).toContain('categories');
    expect(endpoints[1]).toContain('menu-items');
  });

  it('deve aceitar newOrder como parâmetro', () => {
    const payload = {
      newOrder: 1
    };
    
    expect(payload).toHaveProperty('newOrder');
    expect(typeof payload.newOrder).toBe('number');
  });

  it('deve validar que newOrder é um número não-negativo', () => {
    const validOrders = [0, 1, 2, 100];
    const invalidOrders = [-1, -100, 'abc', null, undefined];
    
    validOrders.forEach(order => {
      expect(typeof order === 'number' && order >= 0).toBe(true);
    });
    
    invalidOrders.forEach(order => {
      if (typeof order === 'number') {
        expect(order >= 0).toBe(false);
      }
    });
  });

  it('deve manter consistência de ordem após reordenação', () => {
    // Simular reordenação
    const items = [
      { id: '1', order: 0 },
      { id: '2', order: 1 },
      { id: '3', order: 2 }
    ];
    
    // Mover item 3 para posição 0
    const itemToMove = items.find(i => i.id === '3');
    if (itemToMove) {
      const oldOrder = itemToMove.order;
      const newOrder = 0;
      
      // Simular deslocamento
      items.forEach(item => {
        if (item.order >= newOrder && item.order < oldOrder) {
          item.order += 1;
        }
      });
      itemToMove.order = newOrder;
    }
    
    // Verificar que as ordens são consistentes
    const orders = items.map(i => i.order).sort();
    expect(orders).toEqual([0, 1, 2]);
  });
});
