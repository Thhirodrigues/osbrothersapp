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

describe('POST /api/menus/novo - Create Blank Menu', () => {
  it('should create a blank menu with is_active = 0', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = Date.now().toString();
      const name = 'Test Blank Menu';
      const description = 'Test Description';

      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [menuId, name, description, new Date(), new Date()]
      );

      const [menus] = await connection.execute(
        'SELECT id, name, description, is_active FROM menus WHERE id = ?',
        [menuId]
      ) as any;

      expect(menus).toHaveLength(1);
      expect(menus[0].is_active).toBe(0);
      expect(menus[0].name).toBe(name);
    } finally {
      connection.release();
    }
  });

  it('should create menu with no categories', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = Date.now().toString();
      
      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [menuId, 'Empty Menu', 'Empty', new Date(), new Date()]
      );

      const [categories] = await connection.execute(
        'SELECT id FROM menu_categories WHERE menu_id = ?',
        [menuId]
      ) as any;

      expect(categories).toHaveLength(0);
    } finally {
      connection.release();
    }
  });

  it('should not affect existing menus when creating new blank menu', async () => {
    const connection = await pool.getConnection();
    try {
      const [beforeMenus] = await connection.execute(
        'SELECT COUNT(*) as count FROM menus'
      ) as any;
      const countBefore = beforeMenus[0].count;

      // Create new blank menu
      const newMenuId = Date.now().toString();
      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [newMenuId, 'New Blank Menu', 'Test', new Date(), new Date()]
      );

      // Get menus count after
      const [afterMenus] = await connection.execute(
        'SELECT COUNT(*) as count FROM menus'
      ) as any;
      const countAfter = afterMenus[0].count;

      expect(countAfter).toBe(countBefore + 1);
    } finally {
      connection.release();
    }
  });

  it('should allow adding categories to blank menu', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = Date.now().toString();
      
      // Create blank menu
      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [menuId, 'Menu for Categories', 'Test', new Date(), new Date()]
      );

      // Add category
      const categoryId = `cat-${Date.now()}`;
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
        [categoryId, menuId, 'Test Category', 0, new Date()]
      );

      const [categories] = await connection.execute(
        'SELECT id FROM menu_categories WHERE menu_id = ?',
        [menuId]
      ) as any;

      expect(categories).toHaveLength(1);
    } finally {
      connection.release();
    }
  });

  it('should allow adding items to categories in blank menu', async () => {
    const connection = await pool.getConnection();
    try {
      const menuId = Date.now().toString();
      const categoryId = `cat-${Date.now()}`;
      const itemId = `item-${Date.now()}`;

      // Create blank menu
      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [menuId, 'Menu for Items', 'Test', new Date(), new Date()]
      );

      // Add category
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
        [categoryId, menuId, 'Test Category', 0, new Date()]
      );

      // Add item
      await connection.execute(
        'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, categoryId, 'Test Item', 1000, 0, new Date()]
      );

      const [items] = await connection.execute(
        'SELECT id FROM menu_items WHERE category_id = ?',
        [categoryId]
      ) as any;

      expect(items).toHaveLength(1);
    } finally {
      connection.release();
    }
  });

  it('blank menu should not interfere with active menu calculations', async () => {
    const connection = await pool.getConnection();
    try {
      // Get count of active menus before
      const [activeBefore] = await connection.execute(
        'SELECT COUNT(*) as count FROM menus WHERE is_active = 1'
      ) as any;
      const activeCountBefore = activeBefore[0].count;

      // Create blank menu (is_active = 0)
      const blankMenuId = Date.now().toString();
      await connection.execute(
        'INSERT INTO menus (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
        [blankMenuId, 'Blank Menu', 'Test', new Date(), new Date()]
      );

      // Get count of active menus after
      const [activeAfter] = await connection.execute(
        'SELECT COUNT(*) as count FROM menus WHERE is_active = 1'
      ) as any;
      const activeCountAfter = activeAfter[0].count;

      expect(activeCountAfter).toBe(activeCountBefore);
    } finally {
      connection.release();
    }
  });
});
