import mysql from 'mysql2/promise';

// Valores exatos do arquivo do usuário em REAIS, convertidos para CENTAVOS
const afterMenuData = {
  categories: [
    {
      id: 'cat-after-cerveja-350ml',
      name: 'CERVEJA 350ML',
      items: [
        { id: 'item-after-itaipava', name: 'Itaipava', price: Math.round(4.50 * 100) },
        { id: 'item-after-skol', name: 'Skol', price: Math.round(5.00 * 100) },
        { id: 'item-after-amstel', name: 'Amstel', price: Math.round(6.00 * 100) },
        { id: 'item-after-duplo-malte', name: 'Duplo Malte', price: Math.round(6.00 * 100) },
        { id: 'item-after-heineken', name: 'Heineken', price: Math.round(7.00 * 100) },
        { id: 'item-after-budweiser-zero', name: 'Budweiser ZERO', price: Math.round(7.00 * 100) }
      ]
    },
    {
      id: 'cat-after-cerveja-269',
      name: 'CERVEJA 269',
      items: [
        { id: 'item-after-imperio', name: 'Império', price: Math.round(4.00 * 100) },
        { id: 'item-after-budweiser', name: 'Budweiser', price: Math.round(5.00 * 100) },
        { id: 'item-after-original', name: 'Original', price: Math.round(5.50 * 100) },
        { id: 'item-after-spaten', name: 'Spaten', price: Math.round(6.00 * 100) },
        { id: 'item-after-heineken-269', name: 'Heineken', price: Math.round(6.00 * 100) },
        { id: 'item-after-heineken-zero', name: 'Heineken ZERO', price: Math.round(6.00 * 100) }
      ]
    },
    {
      id: 'cat-after-longneck',
      name: 'LONGNECK',
      items: [
        { id: 'item-after-heineken-long', name: 'Heineken long', price: Math.round(9.00 * 100) },
        { id: 'item-after-corona', name: 'Corona', price: Math.round(10.00 * 100) }
      ]
    },
    {
      id: 'cat-after-ipa',
      name: 'IPA',
      items: [
        { id: 'item-after-patagonia', name: 'Patagônia', price: Math.round(10.00 * 100) },
        { id: 'item-after-baden', name: 'Baden', price: Math.round(10.00 * 100) }
      ]
    },
    {
      id: 'cat-after-drinks',
      name: 'DRINKS',
      items: [
        { id: 'item-after-gin-flowers', name: 'Gin Flowers', price: Math.round(8.00 * 100) },
        { id: 'item-after-skol-beats', name: 'Skol BEATS', price: Math.round(8.00 * 100) },
        { id: 'item-after-51-ice', name: '51 Ice', price: Math.round(9.00 * 100) },
        { id: 'item-after-smirnoff-ice', name: 'Smirnoff Ice', price: Math.round(10.00 * 100) },
        { id: 'item-after-batida', name: 'Batida cx 400ml', price: Math.round(12.00 * 100) },
        { id: 'item-after-xeque-mate', name: 'Xeque Mate', price: Math.round(15.00 * 100) }
      ]
    },
    {
      id: 'cat-after-energeticos',
      name: 'ENERGÉTICOS',
      items: [
        { id: 'item-after-baly-2l', name: 'Baly 2L', price: Math.round(18.00 * 100) },
        { id: 'item-after-vibe-2l', name: 'Vibe 2L', price: Math.round(15.00 * 100) },
        { id: 'item-after-baly-lata', name: 'Baly lata', price: Math.round(10.00 * 100) },
        { id: 'item-after-mister-hemp', name: 'Mister Hemp', price: Math.round(10.00 * 100) },
        { id: 'item-after-redbull', name: 'Redbull', price: Math.round(13.00 * 100) },
        { id: 'item-after-monster', name: 'Monster', price: Math.round(14.00 * 100) }
      ]
    },
    {
      id: 'cat-after-agua-sucos',
      name: 'AGUA/SUCOS/ISOTÔNICOS',
      items: [
        { id: 'item-after-agua', name: 'Água', price: Math.round(5.00 * 100) },
        { id: 'item-after-natural-one', name: 'Natural One', price: Math.round(25.00 * 100) },
        { id: 'item-after-del-valle', name: 'Del Valle lata', price: Math.round(8.00 * 100) },
        { id: 'item-after-power-ade', name: 'Power ADE', price: Math.round(8.00 * 100) },
        { id: 'item-after-guaraviton', name: 'Guaraviton', price: Math.round(6.00 * 100) }
      ]
    },
    {
      id: 'cat-after-refrigerantes',
      name: 'REFRIGERANTES',
      items: [
        { id: 'item-after-refrigerante-lata', name: 'LATA', price: Math.round(6.00 * 100) },
        { id: 'item-after-coca-cola', name: 'Coca Cola 2L', price: Math.round(15.00 * 100) },
        { id: 'item-after-guarana', name: 'Guaraná 2L', price: Math.round(13.00 * 100) },
        { id: 'item-after-fanta', name: 'Fanta 2L', price: Math.round(13.00 * 100) },
        { id: 'item-after-sprite', name: 'Sprite 2L', price: Math.round(13.00 * 100) }
      ]
    },
    {
      id: 'cat-after-cachacas',
      name: 'CACHAÇAS',
      items: [
        { id: 'item-after-corote', name: 'Corote', price: Math.round(6.00 * 100) },
        { id: 'item-after-kariri', name: 'Kariri com Mel', price: Math.round(6.00 * 100) }
      ]
    },
    {
      id: 'cat-after-salgadinhos',
      name: 'SALGADINHOS',
      items: [
        { id: 'item-after-torcida', name: 'Torcida', price: Math.round(5.00 * 100) },
        { id: 'item-after-fofura', name: 'Fofura', price: Math.round(5.00 * 100) },
        { id: 'item-after-amendoim', name: 'Amendoim', price: Math.round(5.00 * 100) }
      ]
    },
    {
      id: 'cat-after-gelo',
      name: 'GELO',
      items: [
        { id: 'item-after-gelo-coco', name: 'Coco', price: Math.round(4.00 * 100) },
        { id: 'item-after-gelo-saco', name: 'Saco 5kg', price: Math.round(10.00 * 100) }
      ]
    },
    {
      id: 'cat-after-garrafas',
      name: 'GARRAFAS',
      items: [
        { id: 'item-after-cabare', name: 'Cabaré', price: Math.round(35.00 * 100) },
        { id: 'item-after-sao-joao', name: 'São João', price: Math.round(20.00 * 100) },
        { id: 'item-after-chanceler', name: 'Chanceler', price: Math.round(35.00 * 100) },
        { id: 'item-after-white-horse', name: 'White Horse', price: Math.round(90.00 * 100) },
        { id: 'item-after-jim-beam', name: 'Jim Beam', price: Math.round(100.00 * 100) },
        { id: 'item-after-jack-daniels', name: 'Jack Daniels', price: Math.round(150.00 * 100) },
        { id: 'item-after-grey-goose', name: 'Grey Goose', price: Math.round(160.00 * 100) },
        { id: 'item-after-smirnoff', name: 'Smirnoff', price: Math.round(50.00 * 100) },
        { id: 'item-after-eternity', name: 'ETERNITY', price: Math.round(32.00 * 100) },
        { id: 'item-after-tangerina', name: 'Tangerina', price: Math.round(20.00 * 100) }
      ]
    },
    {
      id: 'cat-after-doses',
      name: 'DOSES',
      items: [
        { id: 'item-after-dose-eternity', name: 'ETERNITY', price: Math.round(15.00 * 100) },
        { id: 'item-after-dose-eternity-redbull', name: 'ETERNITY REDBULL', price: Math.round(20.00 * 100) },
        { id: 'item-after-dose-beefeather', name: 'BEEFEATHER REDBULL', price: Math.round(35.00 * 100) },
        { id: 'item-after-dose-smirnoff-baly', name: 'SMIRNOFF BALY / SUCO', price: Math.round(25.00 * 100) },
        { id: 'item-after-dose-smirnoff-redbull', name: 'SMIRNOFF REDBULL', price: Math.round(30.00 * 100) },
        { id: 'item-after-dose-chanceler', name: 'CHANCELER', price: Math.round(15.00 * 100) },
        { id: 'item-after-dose-white-horse-baly', name: 'WHITER HORSE BALY', price: Math.round(25.00 * 100) },
        { id: 'item-after-dose-white-horse-redbull', name: 'WHITER HORSE REDBULL', price: Math.round(30.00 * 100) },
        { id: 'item-after-dose-jim-beam-baly', name: 'JIM BEAM BALY', price: Math.round(35.00 * 100) },
        { id: 'item-after-dose-jim-beam-redbull', name: 'JIM BEAM REDBULL', price: Math.round(40.00 * 100) },
        { id: 'item-after-dose-jack-daniels', name: 'JACK DANIELS REDBULL', price: Math.round(45.00 * 100) }
      ]
    }
  ]
};

async function fixAfterMenuPrices() {
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

    // Atualizar apenas o cardápio After com valores corrigidos
    const [result] = await connection.execute(
      'UPDATE menus SET categories = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(afterMenuData.categories), 'after-menu-1']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Cardápio After corrigido com sucesso!');
      console.log(`   - ${afterMenuData.categories.length} categorias`);
      const totalItems = afterMenuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);
      console.log(`   - ${totalItems} itens com valores corretos`);
      
      // Verificar primeiro item
      const firstItem = afterMenuData.categories[0].items[0];
      console.log(`\n   Exemplo: ${firstItem.name} = ${firstItem.price} centavos = R$ ${(firstItem.price / 100).toFixed(2)}`);
    } else {
      console.log('⚠️ Nenhum cardápio After encontrado para atualizar');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao corrigir cardápio:', error.message);
    process.exit(1);
  }
}

fixAfterMenuPrices();
