#!/usr/bin/env node

/**
 * Test script para validar criação de itens em ambos cardápios
 * Executa: node test-dual-menu.mjs
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.DATABASE_URL?.split(':')[3]?.split('/')[0] || '3306'),
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'test',
  ssl: { rejectUnauthorized: false },
};

async function testDualMenuCreation() {
  let connection;
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 1. Obter uma categoria do Adega
    console.log('\n📋 Buscando categoria do Adega...');
    const [adegaCategories] = await connection.execute(
      'SELECT id, menu_id, name FROM menu_categories WHERE menu_id = ? LIMIT 1',
      ['adega-menu-1']
    );
    
    if (adegaCategories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada no Adega');
      return;
    }
    
    const categoryId = adegaCategories[0].id;
    const categoryName = adegaCategories[0].name;
    console.log(`✅ Categoria encontrada: ${categoryName} (ID: ${categoryId})`);
    
    // 2. Verificar se categoria existe no After
    console.log('\n🔍 Procurando categoria correspondente no After...');
    const [afterCategories] = await connection.execute(
      'SELECT id FROM menu_categories WHERE menu_id = ? AND name = ?',
      ['after-menu-1', categoryName]
    );
    
    if (afterCategories.length > 0) {
      console.log(`✅ Categoria correspondente encontrada no After (ID: ${afterCategories[0].id})`);
    } else {
      console.log(`⚠️  Categoria NÃO encontrada no After - será criada automaticamente`);
    }
    
    // 3. Contar itens antes
    console.log('\n📊 Contando itens antes da criação...');
    const [countBefore] = await connection.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [categoryId]
    );
    const itemsBeforeAdega = countBefore[0].count;
    console.log(`   Adega: ${itemsBeforeAdega} itens`);
    
    // 4. Simular criação de item (como faria o endpoint)
    console.log('\n➕ Criando novo item...');
    const itemName = `Test Item ${Date.now()}`;
    const itemPrice = 29.90;
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 6);
    const itemId = `mi-${ts}-${rnd}`;
    
    // Inserir no Adega
    await connection.execute(
      'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, categoryId, itemName, itemPrice, itemsBeforeAdega, Date.now()]
    );
    console.log(`✅ Item criado no Adega: ${itemName}`);
    
    // 5. Verificar se categoria existe no After
    const [afterCatsCheck] = await connection.execute(
      'SELECT id FROM menu_categories WHERE menu_id = ? AND name = ?',
      ['after-menu-1', categoryName]
    );
    
    let afterCategoryId;
    if (afterCatsCheck.length > 0) {
      afterCategoryId = afterCatsCheck[0].id;
      console.log(`✅ Usando categoria existente no After: ${afterCategoryId}`);
    } else {
      // Criar categoria no After
      const afterCatId = `cat-after-menu-1-${ts}`;
      const [maxCatOrder] = await connection.execute(
        'SELECT MAX(`order`) as maxOrder FROM menu_categories WHERE menu_id = ?',
        ['after-menu-1']
      );
      const nextCatOrder = (maxCatOrder[0].maxOrder ?? -1) + 1;
      
      await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, ?)',
        [afterCatId, 'after-menu-1', categoryName, nextCatOrder, Date.now()]
      );
      afterCategoryId = afterCatId;
      console.log(`✅ Categoria criada no After: ${categoryName} (ID: ${afterCatId})`);
    }
    
    // 6. Inserir item no After
    const otherItemId = `mi-${ts}-${rnd}-2`;
    await connection.execute(
      'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [otherItemId, afterCategoryId, itemName, itemPrice, 0, Date.now()]
    );
    console.log(`✅ Item criado no After: ${itemName}`);
    
    // 7. Verificar resultados
    console.log('\n✨ Verificando resultados...');
    const [itemsAdega] = await connection.execute(
      'SELECT id, name, price FROM menu_items WHERE id = ?',
      [itemId]
    );
    
    const [itemsAfter] = await connection.execute(
      'SELECT id, name, price FROM menu_items WHERE id = ?',
      [otherItemId]
    );
    
    if (itemsAdega.length > 0 && itemsAfter.length > 0) {
      console.log(`✅ Item no Adega: ${itemsAdega[0].name} - R$ ${itemsAdega[0].price}`);
      console.log(`✅ Item no After: ${itemsAfter[0].name} - R$ ${itemsAfter[0].price}`);
      console.log('\n🎉 SUCESSO! Itens criados em ambos os cardápios!');
    } else {
      console.log('❌ Erro: Itens não foram encontrados após criação');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

testDualMenuCreation();
