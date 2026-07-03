-- Cardápio After - Categorias e Itens
-- Menu ID: 7975d3b2-28da-11f1-8a01-5aed8e699a79

-- Cerveja 350ml
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Cerveja 350ml', 1, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Itaipava', 450, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Skol', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Amstel', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Duplo Malte', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Heineken', 700, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Budweiser ZERO', 700, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 350ml' LIMIT 1;

-- Cerveja 269ml
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Cerveja 269ml', 2, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Império', 400, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Budweiser', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Original', 550, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Spaten', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Heineken', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Heineken ZERO', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cerveja 269ml' LIMIT 1;

-- Longneck
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Longneck', 3, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Heineken Long', 900, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Longneck' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Corona', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Longneck' LIMIT 1;

-- IPA
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'IPA', 4, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Patagônia', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'IPA' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Baden', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'IPA' LIMIT 1;

-- Drinks
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Drinks', 5, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Gin Flowers', 800, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Skol BEATS', 800, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, '51 Ice', 900, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Smirnoff Ice', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Batida cx 400ml', 1200, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Xeque Mate', 1500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Drinks' LIMIT 1;

-- Energéticos
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Energéticos', 6, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Baly 2L', 1800, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Vibe 2L', 1500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Baly Lata', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Mister Hemp', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Redbull', 1300, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Monster', 1400, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Energéticos' LIMIT 1;

-- Água/Sucos/Isotônicos
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Água/Sucos/Isotônicos', 7, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Água', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Água/Sucos/Isotônicos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Natural One', 2500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Água/Sucos/Isotônicos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Del Valle Lata', 800, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Água/Sucos/Isotônicos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Power ADE', 800, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Água/Sucos/Isotônicos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Guaraviton', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Água/Sucos/Isotônicos' LIMIT 1;

-- Refrigerantes
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Refrigerantes', 8, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Lata', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Refrigerantes' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Coca Cola 2L', 1500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Refrigerantes' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Guaraná 2L', 1300, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Refrigerantes' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Fanta 2L', 1300, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Refrigerantes' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Sprite 2L', 1300, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Refrigerantes' LIMIT 1;

-- Cachaças
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Cachaças', 9, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Corote', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cachaças' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Kariri com Mel (copinho)', 600, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Cachaças' LIMIT 1;

-- Salgadinhos
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Salgadinhos', 10, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Torcida', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Salgadinhos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Fofura', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Salgadinhos' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Amendoim', 500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Salgadinhos' LIMIT 1;

-- Gelo
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Gelo', 11, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Coco', 400, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Gelo' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Saco 5kg', 1000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Gelo' LIMIT 1;

-- Garrafas
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Garrafas', 12, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Cabaré', 3500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'São João', 2000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Chanceler', 3500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'White Horse', 9000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Jim Beam', 10000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Jack Daniels', 15000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Grey Goose', 16000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Smirnoff', 5000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'ETERNITY', 3200, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'Tangerina', 2000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Garrafas' LIMIT 1;

-- Doses
INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES 
(UUID(), '7975d3b2-28da-11f1-8a01-5aed8e699a79', 'Doses', 13, UNIX_TIMESTAMP() * 1000);

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'ETERNITY', 1500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'ETERNITY REDBULL', 2000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'BEEFEATHER REDBULL', 3500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'SMIRNOFF BALY / SUCO', 2500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'SMIRNOFF REDBULL', 3000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'CHANCELER', 1500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'WHITE HORSE BALY', 2500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'WHITE HORSE REDBULL', 3000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'JIM BEAM BALY', 3500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'JIM BEAM REDBULL', 4000, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;

INSERT INTO menu_items (id, category_id, name, price, created_at) 
SELECT UUID(), id, 'JACK DANIELS REDBULL', 4500, UNIX_TIMESTAMP() * 1000 FROM menu_categories 
WHERE menu_id = '7975d3b2-28da-11f1-8a01-5aed8e699a79' AND name = 'Doses' LIMIT 1;
