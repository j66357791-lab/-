const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game-calculator';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 用户Schema
const userSchema = new mongoose.Schema({
  account: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// 用户数据Schema
const userDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dataKey: { type: String, default: 'main' },
  dataValue: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

// 复合唯一索引
userDataSchema.index({ userId: 1, dataKey: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const UserData = mongoose.model('UserData', userDataSchema);

// 初始化管理员账号
async function initAdmin() {
  try {
    const existingAdmin = await User.findOne({ account: '18679012034' });
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync('628727', 10);
      await User.create({
        account: '18679012034',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('管理员账号已创建');
    }
  } catch (err) {
    console.error('初始化管理员失败:', err);
  }
}

mongoose.connection.once('open', initAdmin);

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    
    const user = await User.findOne({ account });
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
      userId: user._id.toString(),
      account: user.account
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取用户数据
app.get('/api/data', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }
    
    const userData = await UserData.findOne({ userId, dataKey: 'main' });
    res.json({ success: true, data: userData ? userData.dataValue : null });
  } catch (err) {
    console.error('获取数据错误:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 保存用户数据
app.post('/api/data', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { data } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }
    
    await UserData.findOneAndUpdate(
      { userId, dataKey: 'main' },
      { dataValue: data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, message: '保存成功' });
  } catch (err) {
    console.error('保存数据错误:', err);
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// 删除用户数据（重置）
app.delete('/api/data', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }
    
    await UserData.deleteOne({ userId, dataKey: 'main' });
    res.json({ success: true, message: '重置成功' });
  } catch (err) {
    console.error('重置数据错误:', err);
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

// ========== 管理员接口 ==========

// 获取所有用户列表
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'account role createdAt').sort({ _id: 1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error('获取用户列表错误:', err);
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 创建用户
app.post('/api/admin/users', async (req, res) => {
  try {
    const { account, password, role } = req.body;
    
    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const user = await User.create({
      account,
      password: hashedPassword,
      role: role || 'user'
    });
    
    res.json({ success: true, userId: user._id.toString(), message: '创建成功' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: '账号已存在' });
    }
    console.error('创建用户错误:', err);
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

// 修改用户密码
app.put('/api/admin/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: '密码不能为空' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    await User.findByIdAndUpdate(id, { password: hashedPassword });
    res.json({ success: true, message: '密码已更新' });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ success: false, message: '修改失败' });
  }
});

// 删除用户
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 不能删除管理员
    const admin = await User.findOne({ account: '18679012034' });
    if (admin && id === admin._id.toString()) {
      return res.status(400).json({ success: false, message: '不能删除管理员账号' });
    }
    
    await UserData.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);
    
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除用户错误:', err);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// 重置用户数据
app.post('/api/admin/users/:id/reset', async (req, res) => {
  try {
    const { id } = req.params;
    
    await UserData.deleteOne({ userId: id, dataKey: 'main' });
    res.json({ success: true, message: '用户数据已重置' });
  } catch (err) {
    console.error('重置用户数据错误:', err);
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
