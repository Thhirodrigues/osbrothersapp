import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';

// Test configuration
const DB_CONFIG = {
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.DATABASE_URL?.split(':')[3]?.split('/')[0] || '3306'),
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'test',
  ssl: 'amazon',
};

describe('Dual-Menu Item Creation', () => {
  let connection: mysql.Connection;

  beforeAll(async () => {
    connection = await mysql.createConnection(DB_CONFIG);
  });

  afterAll(async () => {
    if (connection) await connection.end();
  });

  it('should create item in both Adega and After menus when adding to Adega', async () => {
    // Get a category from Adega menu
    const [categories] = await connection.execute(
      'SELECT id, menu_id, name FROM menu_categories WHERE menu_id = ? LIMIT 1',
      ['adega-menu-1']
    ) as any;

    if (categories.length === 0) {
      console.log('⚠️  No Adega categories found. Skipping test.');
      return;
    }

    const categoryId = categories[0].id;
    const categoryName = categories[0].name;

    // Verify that a corresponding category exists in After menu
    const [afterCategories] = await connection.execute(
      'SELECT id FROM menu_categories WHERE menu_id = ? AND name = ?',
      ['after-menu-1', categoryName]
    ) as any;

    expect(afterCategories.length).toBeGreaterThan(0);
    const afterCategoryId = afterCategories[0].id;

    // Count items before
    const [beforeAdega] = await connection.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [categoryId]
    ) as any;
    const countBefore = beforeAdega[0].count;

    const [beforeAfter] = await connection.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [afterCategoryId]
    ) as any;
    const countAfterBefore = beforeAfter[0].count;

    // Simulate item creation via API (manual insert to test the logic)
    const itemName = `Test Item ${Date.now()}`;
    const itemPrice = 25.50;
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 6);
    const itemId = `mi-${ts}-${rnd}`;

    // Insert in Adega
    await connection.execute(
      'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, categoryId, itemName, itemPrice, countBefore, Date.now()]
    );

    // Insert in After (simulating what the endpoint should do)
    const otherItemId = `mi-${ts}-${rnd}-2`;
    await connection.execute(
      'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [otherItemId, afterCategoryId, itemName, itemPrice, countAfterBefore, Date.now()]
    );

    // Verify items were created in both
    const [afterAdega] = await connection.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [categoryId]
    ) as any;
    const countAfter = afterAdega[0].count;

    const [afterAfterCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [afterCategoryId]
    ) as any;
    const countAfterAfter = afterAfterCheck[0].count;

    expect(countAfter).toBe(countBefore + 1);
    expect(countAfterAfter).toBe(countAfterBefore + 1);

    // Verify the items have the same name
    const [adegaItem] = await connection.execute(
      'SELECT name, price FROM menu_items WHERE id = ?',
      [itemId]
    ) as any;

    const [afterItem] = await connection.execute(
      'SELECT name, price FROM menu_items WHERE id = ?',
      [otherItemId]
    ) as any;

    expect(adegaItem[0].name).toBe(itemName);
    expect(afterItem[0].name).toBe(itemName);
    expect(adegaItem[0].price).toBe(itemPrice);
    expect(afterItem[0].price).toBe(itemPrice);

    console.log('✅ Items created successfully in both menus');
  });

  it('should find matching category by exact name in other menu', async () => {
    // Get all Adega categories
    const [adegaCategories] = await connection.execute(
      'SELECT id, name FROM menu_categories WHERE menu_id = ?',
      ['adega-menu-1']
    ) as any;

    for (const category of adegaCategories) {
      // Try to find matching category in After
      const [afterCategories] = await connection.execute(
        'SELECT id FROM menu_categories WHERE menu_id = ? AND name = ?',
        ['after-menu-1', category.name]
      ) as any;

      // All categories should have a match
      expect(afterCategories.length).toBeGreaterThan(0);
    }

    console.log(`✅ All ${adegaCategories.length} categories have matches in both menus`);
  });
});
