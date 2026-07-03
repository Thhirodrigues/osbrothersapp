import mysql from 'mysql2/promise';

async function populateMenuTables() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✓ Conectado ao banco de dados');

    // Get After menu with categories JSON
    const [menus] = await connection.execute(
      'SELECT id, categories FROM menus WHERE id = ?',
      ['after-menu-1']
    );

    if (menus.length === 0) {
      console.log('❌ Cardápio After não encontrado');
      await connection.end();
      return;
    }

    let categories = menus[0].categories;
    if (typeof categories === 'string') {
      categories = JSON.parse(categories);
    }

    console.log(`✓ Encontrado cardápio com ${categories.length} categorias`);

    // Delete existing categories and items for this menu
    await connection.execute(
      'DELETE FROM menu_items WHERE category_id IN (SELECT id FROM menu_categories WHERE menu_id = ?)',
      ['after-menu-1']
    );
    await connection.execute(
      'DELETE FROM menu_categories WHERE menu_id = ?',
      ['after-menu-1']
    );
    console.log('✓ Categorias e itens antigos deletados');

    // Insert categories and items
    let totalItems = 0;
    for (let catOrder = 0; catOrder < categories.length; catOrder++) {
      const cat = categories[catOrder];
      
      // Insert category
      const [catResult] = await connection.execute(
        'INSERT INTO menu_categories (id, menu_id, name, `order`, created_at) VALUES (?, ?, ?, ?, NOW())',
        [cat.id, 'after-menu-1', cat.name, catOrder]
      );

      // Insert items for this category
      for (let itemOrder = 0; itemOrder < cat.items.length; itemOrder++) {
        const item = cat.items[itemOrder];
        await connection.execute(
          'INSERT INTO menu_items (id, category_id, name, price, `order`, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [item.id, cat.id, item.name, item.price, itemOrder]
        );
        totalItems++;
      }
    }

    console.log('✅ Tabelas populadas com sucesso!');
    console.log(`   - ${categories.length} categorias criadas`);
    console.log(`   - ${totalItems} itens criados`);

    // Verify first item
    const [verify] = await connection.execute(
      'SELECT name, price FROM menu_items WHERE category_id = ? ORDER BY `order` LIMIT 1',
      [categories[0].id]
    );
    if (verify && verify.length > 0) {
      const item = verify[0];
      console.log(`\n   Exemplo: ${item.name} = ${item.price} centavos = R$ ${(item.price / 100).toFixed(2)}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

populateMenuTables();
