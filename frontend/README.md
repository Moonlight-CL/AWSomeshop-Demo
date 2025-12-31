# AWSomeShop Frontend

AWSomeShop 内部积分商城系统前端应用。

## 技术栈

- **React 18**: 现代React框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用优先的CSS框架
- **Shadcn UI**: 现代化组件库
- **React Query**: 服务端状态管理
- **React Router**: 客户端路由
- **Vitest**: 测试框架
- **fast-check**: 属性测试库

## 开发环境设置

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   │   └── ui/        # UI基础组件
│   ├── hooks/         # 自定义React Hooks
│   ├── lib/           # 工具函数
│   ├── pages/         # 页面组件
│   ├── services/      # API服务
│   ├── types/         # TypeScript类型定义
│   ├── test/          # 测试配置
│   ├── App.tsx        # 应用根组件
│   └── main.tsx       # 应用入口
├── public/            # 静态资源
└── package.json       # 项目配置
```

## 开发规范

### 代码风格

- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript严格模式
- 使用函数式组件和Hooks

### 组件规范

- 使用PascalCase命名组件
- 优先使用组合而非继承
- 保持组件单一职责

### 状态管理

- 使用React Query管理服务端状态
- 使用React内置状态管理本地状态
- 避免过度使用全局状态

## 测试

```bash
# 运行所有测试
npm run test

# 监听模式运行测试
npm run test:watch

# 运行测试UI
npm run test:ui

# 类型检查
npm run type-check
```

## 构建和部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```