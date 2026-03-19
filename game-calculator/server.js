require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 管理员账号配置
const ADMIN_ACCOUNT = '18679012034';
const ADMIN_PASSWORD = '628727';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ 请设置 MONGODB_URI 环境变量');
  process.exit(1);
}

// 定义数据模型
const GameDataSchema = new mongoose.Schema({
  key: { type: String, default: 'gameData', unique: true },
  data: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

const GameData = mongoose.model('GameData', GameDataSchema);

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 连接成功'))
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  });

// 管理员登录接口
app.post('/api/login', (req, res) => {
  const { account, password } = req.body;
  
  if (account === ADMIN_ACCOUNT && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: '登录成功', isAdmin: true });
  } else {
    res.json({ success: false, message: '账号或密码错误' });
  }
});

// 获取数据
app.get('/api/data', async (req, res) => {
  try {
    let doc = await GameData.findOne({ key: 'gameData' });
    if (!doc) {
      const defaultData = {
        exchangeRate: { jadeToGem: 0.012, gemToRmb: 1.35, feeRate: 0.1 },
        items: [
          { id: '1', name: '进阶石', price: 8.5 },
          { id: '2', name: '贝壳', price: 1.35 },
          { id: '3', name: '罐头', price: 1.28 },
          { id: '4', name: '玉石', price: 1 }
        ],
        accounts: [
          { id: '1', name: '账号一', dailyData: {} },
          { id: '2', name: '账号二', dailyData: {} },
          { id: '3', name: '账号三', dailyData: {} },
          { id: '4', name: '账号四', dailyData: {} }
        ],
        priceHistory: [],
        rateHistory: [],
        profitHistory: [],
        realizedProfit: 0
      };
      doc = await GameData.create({ key: 'gameData', data: defaultData });
    }
    res.json({ success: true, data: doc.data });
  } catch (error) {
    console.error('获取数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存数据（全局数据：道具价格、兑换率等）
app.post('/api/data', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: '缺少数据' });
    }

    const doc = await GameData.findOneAndUpdate(
      { key: 'gameData' },
      { data, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '保存成功', updatedAt: doc.updatedAt });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 重置数据
app.delete('/api/data', async (req, res) => {
  try {
    const defaultData = {
      exchangeRate: { jadeToGem: 0.012, gemToRmb: 1.35, feeRate: 0.1 },
      items: [
        { id: '1', name: '进阶石', price: 8.5 },
        { id: '2', name: '贝壳', price: 1.35 },
        { id: '3', name: '罐头', price: 1.28 },
        { id: '4', name: '玉石', price: 1 }
      ],
      accounts: [
        { id: '1', name: '账号一', dailyData: {} },
        { id: '2', name: '账号二', dailyData: {} },
        { id: '3', name: '账号三', dailyData: {} },
        { id: '4', name: '账号四', dailyData: {} }
      ],
      priceHistory: [],
      rateHistory: [],
      profitHistory: [],
      realizedProfit: 0
    };

    await GameData.findOneAndUpdate(
      { key: 'gameData' },
      { data: defaultData, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '数据已重置' });
  } catch (error) {
    console.error('重置数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 所有其他请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
});
