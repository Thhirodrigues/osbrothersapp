-- Seed de cardápios padrão
INSERT INTO menus (id, name, is_active, categories) VALUES 
('menu-1', 'Cardápio Principal', true, '[
  {
    "id": "cat-1",
    "name": "Bebidas",
    "items": [
      {"id": "item-1", "name": "Cerveja", "price": 5.00},
      {"id": "item-2", "name": "Refrigerante", "price": 3.00},
      {"id": "item-3", "name": "Água", "price": 1.50}
    ]
  },
  {
    "id": "cat-2",
    "name": "Comidas",
    "items": [
      {"id": "item-4", "name": "Pastel", "price": 8.00},
      {"id": "item-5", "name": "Coxinha", "price": 6.00},
      {"id": "item-6", "name": "Salgado Misto", "price": 12.00}
    ]
  }
]')
ON CONFLICT DO NOTHING;
