const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateId } = require('../utils/validators');
const { getUserPermissions } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, password, name, role, title, bio, gender } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // Check if username already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '用戶名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateId();

    await pool.execute(
      'INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, hashedPassword, name, role, title || null, bio || null, gender || 'unspecified']
    );

    // Log audit
    await logAudit(req.user.id, 'CREATE', 'users', { userId: id, username, role }, req.ip);

    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, role, title, bio, gender, is_active, password } = req.body;

    // Check if user exists
    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // Check if username is being changed to an existing one
    if (username && username !== existing[0].username) {
      const [usernameCheck] = await pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (usernameCheck.length > 0) {
        return res.status(400).json({ error: '用戶名已存在' });
      }
    }

    let query = 'UPDATE users SET username = ?, name = ?, role = ?, title = ?, bio = ?, gender = ?, is_active = ?, updated_at = NOW()';
    let params = [username, name, role, title, bio, gender, is_active ?? true];

    // If password is being updated
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    // Log audit
    await logAudit(req.user.id, 'UPDATE', 'users', { userId: id, username }, req.ip);

    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if trying to delete self
    if (id === req.user.id) {
      return res.status(400).json({ error: '不能刪除自己' });
    }

    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE', 'users', { userId: id, username: existing[0].username }, req.ip);

    res.json({ message: '用戶已刪除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
