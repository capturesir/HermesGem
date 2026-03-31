const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken, getUserPermissions } = require('../middleware/auth');
const { generateId } = require('../utils/validators');

// User login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '請提供用戶名和密碼' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用戶名或密碼錯誤' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: '用戶名或密碼錯誤' });
    }

    const token = generateToken(user);
    const permissions = getUserPermissions(user.role);

    // Remove password from response
    delete user.password;

    res.json({
      token,
      user: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const user = rows[0];
    const permissions = getUserPermissions(user.role);

    res.json({
      ...user,
      permissions
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { name, title, bio, gender } = req.body;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE users SET name = ?, title = ?, bio = ?, gender = ?, updated_at = NOW() WHERE id = ?',
      [name, title, bio, gender, userId]
    );

    const [rows] = await pool.execute(
      'SELECT id, username, name, role, title, bio, gender, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '請提供當前密碼和新密碼' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密碼長度至少為6個字符' });
    }

    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    const isValid = await bcrypt.compare(currentPassword, rows[0].password);

    if (!isValid) {
      return res.status(401).json({ error: '當前密碼錯誤' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: '密碼修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  res.json({ message: '登出成功' });
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};
