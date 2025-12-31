# AWSomeShop Makefile
# 提供常用的开发和部署命令

.PHONY: help install dev build test clean deploy

# 默认目标
help:
	@echo "AWSomeShop 开发工具"
	@echo ""
	@echo "可用命令:"
	@echo "  install     安装所有依赖"
	@echo "  dev         启动开发环境"
	@echo "  build       构建所有服务"
	@echo "  test        运行所有测试"
	@echo "  lint        代码格式检查"
	@echo "  clean       清理构建文件"
	@echo "  deploy      部署到生产环境"
	@echo "  logs        查看服务日志"
	@echo "  stop        停止所有服务"
	@echo "  restart     重启所有服务"

# 安装依赖
install:
	@echo "安装后端依赖..."
	cd backend && uv venv && uv pip install -e .
	@echo "安装前端依赖..."
	cd frontend && npm install
	@echo "依赖安装完成!"

# 启动开发环境
dev:
	@echo "启动开发环境..."
	docker-compose up -d
	@echo "开发环境已启动!"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:8000"
	@echo "API文档: http://localhost:8000/docs"

# 构建所有服务
build:
	@echo "构建所有服务..."
	docker-compose build
	@echo "构建完成!"

# 运行测试
test:
	@echo "运行后端测试..."
	cd backend && pytest
	@echo "运行前端测试..."
	cd frontend && npm run test
	@echo "所有测试完成!"

# 代码格式检查
lint:
	@echo "检查后端代码格式..."
	cd backend && ruff check . && black --check .
	@echo "检查前端代码格式..."
	cd frontend && npm run lint
	@echo "代码格式检查完成!"

# 格式化代码
format:
	@echo "格式化后端代码..."
	cd backend && ruff check --fix . && black .
	@echo "格式化前端代码..."
	cd frontend && npm run lint:fix
	@echo "代码格式化完成!"

# 清理构建文件
clean:
	@echo "清理构建文件..."
	docker-compose down -v
	docker system prune -f
	cd backend && rm -rf .pytest_cache __pycache__ htmlcov
	cd frontend && rm -rf dist node_modules/.cache
	@echo "清理完成!"

# 查看日志
logs:
	docker-compose logs -f

# 停止服务
stop:
	@echo "停止所有服务..."
	docker-compose down
	@echo "服务已停止!"

# 重启服务
restart:
	@echo "重启所有服务..."
	docker-compose restart
	@echo "服务已重启!"

# 部署到生产环境
deploy:
	@echo "部署到生产环境..."
	cd infra/aws && cdk deploy
	@echo "部署完成!"

# 数据库迁移
migrate:
	@echo "执行数据库迁移..."
	docker-compose exec backend alembic upgrade head
	@echo "数据库迁移完成!"

# 创建数据库迁移
migration:
	@echo "创建新的数据库迁移..."
	@read -p "请输入迁移描述: " desc; \
	docker-compose exec backend alembic revision --autogenerate -m "$$desc"
	@echo "迁移文件已创建!"

# 重置数据库
reset-db:
	@echo "重置数据库..."
	docker-compose down postgres
	docker volume rm awsome-shop_postgres_data
	docker-compose up -d postgres
	sleep 5
	make migrate
	@echo "数据库重置完成!"

# 备份数据库
backup-db:
	@echo "备份数据库..."
	docker-compose exec postgres pg_dump -U awsome_user awsome_shop > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "数据库备份完成!"

# 健康检查
health:
	@echo "检查服务健康状态..."
	@curl -f http://localhost:8000/health || echo "后端服务异常"
	@curl -f http://localhost:3000 || echo "前端服务异常"
	@echo "健康检查完成!"