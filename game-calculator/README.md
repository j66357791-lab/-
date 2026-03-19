# 游戏多账号收益计算器 v2

一个支持 MongoDB 数据持久化的游戏收益计算器，必须登录才能使用，支持管理员权限控制。

## 功能特点

- 🔐 **必须登录才能使用** - 未登录无法访问网站
- 📊 多账号收益管理
- 💰 道具价格追踪
- 💱 兑换率实时更新
- 📈 历史走势图表
- 📄 报表导出
- 🗄️ **MongoDB 云端数据持久化** - 数据永久保存

## 权限说明

### 管理员权限
- 修改道具价格
- 修改兑换率
- 导入数据
- 重置数据
- 添加/删除道具

### 普通用户权限
- 查看所有数据
- 填写账号收益数据
- 查看图表和报表
- 导出报表

## 管理员账号

- **账号**: `18679012034`
- **密码**: `628727`

## 部署到 Zeabur

### 步骤：

1. 将整个 `game-calculator` 文件夹上传到 GitHub

2. 在 Zeabur 中选择 "从 GitHub 部署"

3. 选择这个仓库

4. 添加环境变量：
   ```
   MONGODB_URI=mongodb+srv://用户名:密码@cluster.mongodb.net/数据库名
   ```

5. 点击部署

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `MONGODB_URI` | MongoDB 连接字符串 | ✅ |
| `PORT` | 服务端口，默认 3000 | ❌ |

## 项目结构

```
game-calculator/
├── server.js          # Express 服务器 + MongoDB 连接
├── package.json       # 项目依赖
├── public/
│   └── index.html     # 前端页面
└── README.md          # 说明文档
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| GET | `/api/data` | 获取所有数据 |
| POST | `/api/data` | 保存数据 |
| DELETE | `/api/data` | 重置数据 |
| GET | `/api/health` | 健康检查 |

## 注意事项

1. 确保 MongoDB Atlas 允许外部访问（IP 白名单设置为 0.0.0.0/0）
2. 数据库连接字符串包含用户名和密码，请妥善保管
3. 首次使用会自动创建默认数据
4. **所有数据保存在云端 MongoDB，关闭网页后数据不会丢失**

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 技术栈

- 前端：HTML + CSS + JavaScript + Chart.js
- 后端：Node.js + Express
- 数据库：MongoDB + Mongoose
