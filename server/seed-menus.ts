// Dados de exemplo para popular cardápios
export const seedMenusData = {
  adega: {
    id: 'adega-menu-1',
    name: 'Cardápio Adega',
    description: 'Cardápio padrão da Adega',
    categories: [
      {
        id: 'cat-adega-bebidas',
        name: 'Bebidas',
        items: [
          { id: 'item-adega-cerveja', name: 'Cerveja', price: 1000 },
          { id: 'item-adega-refrigerante', name: 'Refrigerante', price: 500 },
          { id: 'item-adega-agua', name: 'Água', price: 300 }
        ]
      },
      {
        id: 'cat-adega-petiscos',
        name: 'Petiscos',
        items: [
          { id: 'item-adega-batata', name: 'Batata Frita', price: 1500 },
          { id: 'item-adega-amendoim', name: 'Amendoim', price: 800 }
        ]
      }
    ],
    is_active: 1
  },
  after: {
    id: 'after-menu-1',
    name: 'Cardápio After',
    description: 'Cardápio After Hours',
    categories: [
      {
        id: 'cat-after-bebidas',
        name: 'Bebidas After',
        items: [
          { id: 'item-after-chopp', name: 'Chopp', price: 1500 },
          { id: 'item-after-drink', name: 'Drink', price: 2000 },
          { id: 'item-after-agua', name: 'Água', price: 300 },
          { id: 'item-after-refrigerante', name: 'Refrigerante', price: 500 }
        ]
      },
      {
        id: 'cat-after-petiscos',
        name: 'Petiscos After',
        items: [
          { id: 'item-after-batata', name: 'Batata Frita', price: 1500 },
          { id: 'item-after-amendoim', name: 'Amendoim', price: 800 },
          { id: 'item-after-queijo', name: 'Queijo Derretido', price: 2500 }
        ]
      }
    ],
    is_active: 0
  }
};
