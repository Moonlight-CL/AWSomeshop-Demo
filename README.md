# AWSomeShop - 内部积分商城系统

AWSomeShop是一个现代化的内部员工福利积分商城系统，旨在通过MVP验证员工积分兑换系统的商业模式。

## 🚀 功能特性

### 员工功能
- 🔐 安全的用户认证和会话管理
- 💰 积分余额查看和历史记录追踪
- 🛍️ 产品目录浏览和详情查看
- 🎁 积分兑换流程和订单管理
- 📧 邮件通知服务

### 管理员功能
- 👥 员工积分概况和管理
- 📊 月度积分分配和手动调整
- 📦 产品目录和库存管理
- 📈 兑换统计报告和数据分析
- 🔍 系统审计日志查看

### 系统特性
- 🏗️ 现代化微服务架构
- 🔒 企业级安全保障
- 📱 响应式界面设计
- ⚡ 高性能和可扩展性
- 🐳 容器化部署支持

## 🛠️ 技术栈

### 后端
- **FastAPI**: 高性能异步Web框架
- **SQLAlchemy**: 异步ORM和数据库管理
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **Alembic**: 数据库迁移工具
- **Pydantic**: 数据验证和序列化
- **pytest + Hypothesis**: 测试框架

### 前端
- **React 18**: 现代React框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用优先的CSS框架
- **Shadcn UI**: 现代化组件库
- **React Query**: 服务端状态管理
- **Vitest + fast-check**: 测试框架

### 基础设施
- **Docker**: 容器化部署
- **AWS ECS Fargate**: 无服务器容器编排
- **AWS RDS**: 托管数据库服务
- **AWS S3**: 对象存储服务
- **AWS CDK**: 基础设施即代码
- **Nginx**: 反向代理和负载均衡

## 📁 项目结构

```
awsome-shop/
├── backend/                # 后端API服务
│   ├── app/               # 应用核心代码
│   │   ├── core/         # 核心配置和工具
│   │   ├── models/       # 数据库模型
│   │   ├── schemas/      # Pydantic模式
│   │   ├── services/     # 业务逻辑服务
│   │   └── routers/      # API路由
│   ├── tests/            # 测试文件
│   ├── main.py           # 应用入口
│   └── pyproject.toml    # 项目配置
├── frontend/              # 前端React应用
│   ├── src/              # 源代码
│   │   ├── components/   # 可复用组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务
│   │   └── types/        # TypeScript类型
│   ├── public/           # 静态资源
│   └── package.json      # 项目配置
├── infra/                # 基础设施配置
│   ├── docker/          # Docker配置文件
│   ├── aws/             # AWS CDK代码
│   └── scripts/         # 部署脚本
├── docker-compose.yml    # 本地开发环境
└── README.md            # 项目文档
```

## 🚀 快速开始

### 前置要求

- Docker和Docker Compose
- Node.js 18+ (前端开发)
- Python 3.11+ (后端开发)
- uv包管理器 (后端开发)

### 1. 克隆项目

```bash
git clone <repository-url>
cd awsome-shop
```

### 2. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 根据实际情况修改 .env 文件中的配置
```

### 3. 启动开发环境

```bash
# 使用Docker Compose启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 4. 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs
- 数据库管理: http://localhost:8080

## 🔧 开发指南

### 后端开发

```bash
cd backend

# 安装uv包管理器
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建虚拟环境并安装依赖
uv venv
source .venv/bin/activate
uv pip install -e .

# 运行开发服务器
python main.py

# 运行测试
pytest

# 运行属性测试
pytest -m property
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build
```

### 数据库管理

```bash
# 进入后端目录
cd backend

# 创建新的迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 🧪 测试策略

项目采用多层次测试策略：

- **单元测试**: 测试具体功能和边缘情况
- **属性测试**: 使用Hypothesis和fast-check验证通用属性
- **集成测试**: 测试API端点和数据库操作
- **端到端测试**: 使用Playwright测试完整用户流程

## 📊 监控和日志

- 应用日志: 结构化日志记录
- 性能监控: API响应时间和错误率
- 业务指标: 兑换成功率和用户活跃度
- 审计日志: 关键操作的完整记录

## 🚀 部署

### 本地部署

```bash
# 构建并启动所有服务
docker-compose up --build -d
```

### AWS云端部署

```bash
# 进入基础设施目录
cd infra/aws

# 安装CDK依赖
npm install

# 部署到AWS
cdk deploy
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 创建Issue: [GitHub Issues](https://github.com/your-org/awsome-shop/issues)
- 邮件: team@awsome-shop.com

---

**AWSomeShop Team** - 让积分兑换更简单 🎉