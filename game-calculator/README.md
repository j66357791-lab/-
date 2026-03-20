# 🎮 游戏多账号收益计算器

支持多用户、多账号的游戏收益计算器，数据持久化存储。

## 功能特点

- 📊 多账号收益统计
- 💰 投入成本管理
- 🐉 宠物价值追踪
- 📈 历史走势图表
- 👥 多用户系统（管理员可创建用户）
- 🔐 权限控制（普通用户无法修改价格配置）

## Zeabur 部署步骤

### 1. 创建 MongoDB 数据库

在 Zeabur 中添加 MongoDB 服务：
- 点击 "Add Service"
- 选择 "Prebuilt Service" → "MongoDB"

### 2. 部署应用

1. 上传代码到 Git 仓库
2. 在 Zeabur 中添加服务，选择你的仓库
3. 配置环境变量：
   - `MONGODB_URI`: MongoDB 连接字符串（从 MongoDB 服务获取）

### 3. 获取 MongoDB 连接字符串

在 Zeabur 的 MongoDB 服务中：
- 点击 "Connect" 标签
- 复制连接字符串（格式类似：`mongodb://user:password@host:port/database`）

### 4. 配置环境变量

在应用服务中添加环境变量：
```
MONGODB_URI=mongodb://你的连接字符串
```

## 默认管理员账号

- **账号**: `18679012034`
- **密码**: `628727`

登录后可在"用户管理"页面创建普通用户。

## 权限说明

### 管理员
- ✅ 修改道具价格
- ✅ 修改宠物价格
- ✅ 修改兑换汇率
- ✅ 导入数据
- ✅ 用户管理

### 普通用户
- ✅ 查看所有价格（只读）
- ✅ 录入每日收益
- ✅ 修改宠物数量
- ✅ 导出报表
- ❌ 无法修改价格配置
- ❌ 无法导入数据

## 本地开发

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

## 技术栈

- Node.js + Express
- MongoDB + Mongoose
- Chart.js（图表）
- bcryptjs（密码加密）
