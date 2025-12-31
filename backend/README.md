# AWSomeShop Backend

AWSomeShop 内部积分商城系统后端API服务。

## 技术栈

- **FastAPI**: 现代高性能Web框架
- **SQLAlchemy**: 异步ORM
- **Alembic**: 数据库迁移工具
- **Pydantic**: 数据验证和序列化
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **pytest**: 测试框架
- **Hypothesis**: 属性测试框架

## 开发环境设置

### 1. 安装uv包管理器

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 创建虚拟环境并安装依赖

```bash
cd backend
uv venv
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate  # Windows
uv pip install -e .
```

### 3. 环境变量配置

复制 `.env.example` 到 `.env` 并配置相应的环境变量。

### 4. 运行开发服务器

```bash
python main.py
```

API文档将在 http://localhost:8000/docs 可用。

## 项目结构

```
backend/
├── app/
│   ├── core/           # 核心配置和工具
│   ├── models/         # 数据库模型
│   ├── schemas/        # Pydantic模式
│   ├── services/       # 业务逻辑服务
│   ├── routers/        # API路由
│   └── __init__.py
├── tests/              # 测试文件
├── alembic/            # 数据库迁移
├── main.py             # 应用入口
└── pyproject.toml      # 项目配置
```

## 测试

```bash
# 运行所有测试
pytest

# 运行属性测试
pytest -m property

# 生成测试覆盖率报告
pytest --cov=app --cov-report=html
```