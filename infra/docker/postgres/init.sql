-- 初始化数据库脚本
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建数据库（如果不存在）
-- 注意：在Docker环境中，数据库已经通过环境变量创建

-- 设置时区
SET timezone = 'UTC';

-- 创建基础表结构将在Alembic迁移中完成
-- 这里只做一些基础配置

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE 'AWSomeShop数据库初始化完成';
END $$;