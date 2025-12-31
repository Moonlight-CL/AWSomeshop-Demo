# 多阶段构建Dockerfile for Python FastAPI应用

# 基础镜像
FROM python:3.11-slim as base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装uv包管理器
RUN pip install uv

# 复制项目配置文件
COPY pyproject.toml README.md ./

# 创建虚拟环境并安装依赖
# RUN uv venv .venv
RUN uv sync

# 开发阶段
FROM base as development

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "main.py"]

# 生产阶段
FROM base as production

# 复制源代码
COPY . .

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 注意: .env 文件应该在部署时通过以下方式提供:
# 1. Docker run: docker run -v /path/to/.env:/app/.env ...
# 2. ECS: 通过环境变量或 AWS Secrets Manager
# 3. Kubernetes: 通过 ConfigMap 或 Secrets

# 启动命令
CMD ["python", "main.py"]