const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 数据库
const db = new sqlite3.Database('./game_data.db');

// 初始化数据库表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // 用户数据表
  db.run(`CREATE TABLE IF NOT EXISTS user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_key TEXT DEFAULT 'main',
    data_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, data_key)
  )`);
  
  // 创建默认管理员账号
  const adminPassword = bcrypt.hashSync('628727', 10);
  db.run(`INSERT OR IGNORE INTO users (account, password, role) VALUES (?, ?, ?)`, 
    ['18679012034', adminPassword, 'admin']);
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { account, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE account = ?`, [account], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }
    
    res.json({ 
      success: true, 
      isAdmin: user.role === 'admin',
      userId: user.id,
      account: user.account
    });
  });
});

// 获取用户数据
app.get('/api/data', (req, res) => {
  const userId = req.headers['x-user-id'] || 1;
  
  db.get(`SELECT data_value FROM user_data WHERE user_id = ? AND data_key = 'main'`, 
    [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    if (row && row.data_value) {
      try {
        const data = JSON.parse(row.data_value);
        res.json({ success: true, data });
      } catch (e) {
        res.json({ success: true, data: null });
      }
    } else {
      res.json({ success: true, data: null });
    }
  });
});

// 保存用户数据
app.post('/api/data', (req, res) => {
  const userId = req.headers['x-user-id'] || 1;
  const { data } = req.body;
  
  const dataStr = JSON.stringify(data);
  const now = new Date().toISOString();
  
  db.run(`INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, updated_at) VALUES (?, 'main', ?, ?)`,
    [userId, dataStr, now], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '保存失败' });
    }
    res.json({ success: true, message: '保存成功' });
  });
});

// 删除用户数据（重置）
app.delete('/api/data', (req, res) => {
  const userId = req.headers['x-user-id'] || 1;
  
  db.run(`DELETE FROM user_data WHERE user_id = ? AND data_key = 'main'`, [userId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '重置失败' });
    }
    res.json({ success: true, message: '重置成功' });
  });
});

// ========== 管理员接口 ==========

// 获取所有用户列表
app.get('/api/admin/users', (req, res) => {
  db.all(`SELECT id, account, role, created_at FROM users ORDER BY id`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取失败' });
    }
    res.json({ success: true, users: rows });
  });
});

// 创建用户
app.post('/api/admin/users', (req, res) => {
  const { account, password, role } = req.body;
  
  if (!account || !password) {
    return res.status(400).json({ success: false, message: '账号和密码不能为空' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(`INSERT INTO users (account, password, role) VALUES (?, ?, ?)`,
    [account, hashedPassword, role || 'user'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ success: false, message: '账号已存在' });
      }
      return res.status(500).json({ success: false, message: '创建失败' });
    }
    res.json({ success: true, userId: this.lastID, message: '创建成功' });
  });
});

// 修改用户密码
app.put('/api/admin/users/:id/password', (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: '密码不能为空' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '修改失败' });
    }
    res.json({ success: true, message: '密码已更新' });
  });
});

// 删除用户
app.delete('/api/admin/users/:id', (req, res) => {
  const userId = req.params.id;
  
  if (userId === '1') {
    return res.status(400).json({ success: false, message: '不能删除管理员账号' });
  }
  
  db.serialize(() => {
    db.run(`DELETE FROM user_data WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: '删除失败' });
      }
      res.json({ success: true, message: '删除成功' });
    });
  });
});

// 重置用户数据
app.post('/api/admin/users/:id/reset', (req, res) => {
  const userId = req.params.id;
  
  db.run(`DELETE FROM user_data WHERE user_id = ? AND data_key = 'main'`, [userId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '重置失败' });
    }
    res.json({ success: true, message: '用户数据已重置' });
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
