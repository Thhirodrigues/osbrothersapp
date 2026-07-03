import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

describe('Reorder Categories and Items', () => {
  it('should move category up (decrease order)', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = `menu-${Date.now()}`;
      const cat1Id = `cat-${Date.now()}-1`;
      const cat2Id = `cat-${Date.now()}-2`;

      // Create menu
      await connection.execute(
        'INSERT INTO menus (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [menuId, 'Test Menu', new Date(), new Date()]
      );

      // Create two categories with order 0 and 1
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 0, ?)',
        [cat1Id, menuId, 'Category 1', new Date()]
      );

      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 1, ?)',
        [cat2Id, menuId, 'Category 2', new Date()]
      );

      // Move category 2 up (from order 1 to order 0)
      // This should shift category 1 down (from 0 to 1)
      const oldOrder = 1;
      const newOrder = 0;

      // Shift categories between newOrder and oldOrder
      await connection.execute(
        'UPDATE menu_categories SET `order` = `order` + 1 WHERE menu_id = ? AND `order` >= ? AND `order` < ?',
        [menuId, newOrder, oldOrder]
      );

      // Update the category
      await connection.execute(
        'UPDATE menu_categories SET `order` = ? WHERE id = ?',
        [newOrder, cat2Id]
      );

      // Verify the result
      const [categories] = await connection.execute(
        'SELECT id, `order` FROM menu_categories WHERE menu_id = ? ORDER BY `order`',
        [menuId]
      ) as any;

      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe(cat2Id); // Category 2 should be first now
      expect(categories[0].order).toBe(0);
      expect(categories[1].id).toBe(cat1Id); // Category 1 should be second
      expect(categories[1].order).toBe(1);
    } finally {
      connection.release();
    }
  });

  it('should move item up (decrease order)', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = `menu-${Date.now()}`;
      const categoryId = `cat-${Date.now()}`;
      const item1Id = `item-${Date.now()}-1`;
      const item2Id = `item-${Date.now()}-2`;

      // Create menu
      await connection.execute(
        'INSERT INTO menus (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [menuId, 'Test Menu', new Date(), new Date()]
      );

      // Create category
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 0, ?)',
        [categoryId, menuId, 'Test Category', new Date()]
      );

      // Create two items with order 0 and 1
      await connection.execute(
        'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, 1000, 0, ?)',
        [item1Id, categoryId, 'Item 1', new Date()]
      );

      await connection.execute(
        'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, 2000, 1, ?)',
        [item2Id, categoryId, 'Item 2', new Date()]
      );

      // Move item 2 up (from order 1 to order 0)
      const oldOrder = 1;
      const newOrder = 0;

      // Shift items between newOrder and oldOrder
      await connection.execute(
        'UPDATE menu_items SET `order` = `order` + 1 WHERE category_id = ? AND `order` >= ? AND `order` < ?',
        [categoryId, newOrder, oldOrder]
      );

      // Update the item
      await connection.execute(
        'UPDATE menu_items SET `order` = ? WHERE id = ?',
        [newOrder, item2Id]
      );

      // Verify the result
      const [items] = await connection.execute(
        'SELECT id, `order` FROM menu_items WHERE category_id = ? ORDER BY `order`',
        [categoryId]
      ) as any;

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(item2Id); // Item 2 should be first now
      expect(items[0].order).toBe(0);
      expect(items[1].id).toBe(item1Id); // Item 1 should be second
      expect(items[1].order).toBe(1);
    } finally {
      connection.release();
    }
  });

  it('should move category down (increase order)', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = `menu-${Date.now()}`;
      const cat1Id = `cat-${Date.now()}-1`;
      const cat2Id = `cat-${Date.now()}-2`;

      // Create menu
      await connection.execute(
        'INSERT INTO menus (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [menuId, 'Test Menu', new Date(), new Date()]
      );

      // Create two categories with order 0 and 1
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 0, ?)',
        [cat1Id, menuId, 'Category 1', new Date()]
      );

      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 1, ?)',
        [cat2Id, menuId, 'Category 2', new Date()]
      );

      // Move category 1 down (from order 0 to order 1)
      const oldOrder = 0;
      const newOrder = 1;

      // Shift categories between oldOrder and newOrder
      await connection.execute(
        'UPDATE menu_categories SET `order` = `order` - 1 WHERE menu_id = ? AND `order` > ? AND `order` <= ?',
        [menuId, oldOrder, newOrder]
      );

      // Update the category
      await connection.execute(
        'UPDATE menu_categories SET `order` = ? WHERE id = ?',
        [newOrder, cat1Id]
      );

      // Verify the result
      const [categories] = await connection.execute(
        'SELECT id, `order` FROM menu_categories WHERE menu_id = ? ORDER BY `order`',
        [menuId]
      ) as any;

      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe(cat2Id); // Category 2 should be first
      expect(categories[0].order).toBe(0);
      expect(categories[1].id).toBe(cat1Id); // Category 1 should be second
      expect(categories[1].order).toBe(1);
    } finally {
      connection.release();
    }
  });

  it('should not affect other menus when reordering', async () => {
    const connection = await pool.getConnection();
    try {
      const menu1Id = `menu-${Date.now()}-1`;
      const menu2Id = `menu-${Date.now()}-2`;
      const cat1Id = `cat-${Date.now()}-1`;
      const cat2Id = `cat-${Date.now()}-2`;
      const cat3Id = `cat-${Date.now()}-3`;

      // Create two menus
      await connection.execute(
        'INSERT INTO menus (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [menu1Id, 'Menu 1', new Date(), new Date()]
      );

      await connection.execute(
        'INSERT INTO menus (id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [menu2Id, 'Menu 2', new Date(), new Date()]
      );

      // Create categories in menu 1
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 0, ?)',
        [cat1Id, menu1Id, 'Category 1', new Date()]
      );

      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 1, ?)',
        [cat2Id, menu1Id, 'Category 2', new Date()]
      );

      // Create category in menu 2
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, 0, ?)',
        [cat3Id, menu2Id, 'Category 3', new Date()]
      );

      // Move category 2 up in menu 1
      await connection.execute(
        'UPDATE menu_categories SET `order` = `order` + 1 WHERE menu_id = ? AND `order` >= ? AND `order` < ?',
        [menu1Id, 0, 1]
      );

      await connection.execute(
        'UPDATE menu_categories SET `order` = ? WHERE id = ?',
        [0, cat2Id]
      );

      // Verify menu 2 is not affected
      const [menu2Categories] = await connection.execute(
        'SELECT id, `order` FROM menu_categories WHERE menu_id = ? ORDER BY `order`',
        [menu2Id]
      ) as any;

      expect(menu2Categories).toHaveLength(1);
      expect(menu2Categories[0].id).toBe(cat3Id);
      expect(menu2Categories[0].order).toBe(0);
    } finally {
      connection.release();
    }
  });
});
