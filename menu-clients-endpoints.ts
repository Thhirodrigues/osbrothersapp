// ============================================================================
// NOVO: Listar clientes de um cardápio
// ============================================================================
app.get('/api/menus/:menuId/clientes', async (req, res) => {
  try {
    const { menuId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar clientes associados a este cardápio
    const [clients] = await connection.execute(
      'SELECT u.id, u.name, u.email FROM menu_clients mc JOIN users u ON mc.cliente_id = u.id WHERE mc.menu_id = ? ORDER BY u.name ASC',
      [menuId]
    );
    
    connection.release();
    res.json({ clientes: clients });
  } catch (error: any) {
    console.error('[API] Erro ao listar clientes do cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao listar clientes', details: error?.message });
  }
});

// ============================================================================
// NOVO: Adicionar cliente a um cardápio
// ============================================================================
app.post('/api/menus/:menuId/clientes', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { clienteId } = req.body;
    const connection = await pool.getConnection();
    
    // Verificar se cliente já está associado
    const [existing] = await connection.execute(
      'SELECT id FROM menu_clients WHERE menu_id = ? AND cliente_id = ?',
      [menuId, clienteId]
    );
    
    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Cliente já associado a este cardápio' });
    }
    
    // Gerar UUID para o registro
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    // Inserir associação
    await connection.execute(
      'INSERT INTO menu_clients (id, menu_id, cliente_id, created_at) VALUES (?, ?, ?, ?)',
      [id, menuId, clienteId, Date.now()]
    );
    
    connection.release();
    res.json({ success: true, message: 'Cliente adicionado ao cardápio' });
  } catch (error: any) {
    console.error('[API] Erro ao adicionar cliente ao cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao adicionar cliente', details: error?.message });
  }
});

// ============================================================================
// NOVO: Remover cliente de um cardápio
// ============================================================================
app.delete('/api/menus/:menuId/clientes/:clienteId', async (req, res) => {
  try {
    const { menuId, clienteId } = req.params;
    const connection = await pool.getConnection();
    
    // Deletar associação
    await connection.execute(
      'DELETE FROM menu_clients WHERE menu_id = ? AND cliente_id = ?',
      [menuId, clienteId]
    );
    
    connection.release();
    res.json({ success: true, message: 'Cliente removido do cardápio' });
  } catch (error: any) {
    console.error('[API] Erro ao remover cliente do cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao remover cliente', details: error?.message });
  }
});

// ============================================================================
// NOVO: Obter cardápios disponíveis para um cliente
// ============================================================================
app.get('/api/clientes/:clienteId/menus-disponiveis', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const connection = await pool.getConnection();
    
    // Buscar cardápios associados a este cliente
    const [menus] = await connection.execute(
      'SELECT DISTINCT m.id, m.name, m.description, m.is_active FROM menus m JOIN menu_clients mc ON m.id = mc.menu_id WHERE mc.cliente_id = ? ORDER BY m.name ASC',
      [clienteId]
    );
    
    connection.release();
    res.json({ menus: menus || [] });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardápios do cliente:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardápios', details: error?.message });
  }
});

// ============================================================================
// NOVO: Atribuir automaticamente cardápio After para clientes sem cardápio
// ============================================================================
app.post('/api/clientes/atribuir-after', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Buscar ID do cardápio "After"
    const [afterMenus] = await connection.execute(
      'SELECT id FROM menus WHERE name = ? LIMIT 1',
      ['After']
    );
    
    if ((afterMenus as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cardápio After não encontrado' });
    }
    
    const afterMenuId = (afterMenus as any[])[0].id;
    
    // Buscar clientes que não têm nenhum cardápio associado
    const [clientesSemMenu] = await connection.execute(
      'SELECT DISTINCT u.id FROM users u WHERE u.id NOT IN (SELECT DISTINCT cliente_id FROM menu_clients) AND u.role = ?',
      ['user']
    );
    
    // Atribuir After a cada cliente sem cardápio
    const { v4: uuidv4 } = await import('uuid');
    let atribuidos = 0;
    
    for (const cliente of (clientesSemMenu as any[])) {
      const id = uuidv4();
      await connection.execute(
        'INSERT INTO menu_clients (id, menu_id, cliente_id, created_at) VALUES (?, ?, ?, ?)',
        [id, afterMenuId, cliente.id, Date.now()]
      );
      atribuidos++;
    }
    
    connection.release();
    res.json({ 
      success: true, 
      message: `${atribuidos} cliente(s) atribuído(s) ao cardápio After` 
    });
  } catch (error: any) {
    console.error('[API] Erro ao atribuir After:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atribuir After', details: error?.message });
  }
});
