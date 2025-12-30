# AWSomeShop 员工积分兑换平台

<div align="center">

![AWSomeShop Logo](https://img.shields.io/badge/AWSomeShop-员工积分商城-blue?style=for-the-badge)

**一个现代化的员工积分管理和兑换平台**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [项目结构](#-项目结构) • [演示](#-演示)

</div>

---

## 📖 项目简介

AWSomeShop 是一个为企业员工设计的积分管理和兑换平台。员工可以使用公司分配的积分兑换各类商品和服务，管理员可以管理用户、商品和积分分配。

### 🎯 核心价值

- **激励员工**: 通过积分奖励机制提升员工积极性
- **灵活兑换**: 多样化的商品选择满足不同需求
- **便捷管理**: 简洁的管理后台，轻松管理积分和商品
- **数据透明**: 完整的积分流水和兑换记录

## ✨ 功能特性

### 👥 员工端

- 🔐 **安全登录** - 基于角色的访问控制
- 💰 **积分查看** - 实时显示当前积分和月度分配额度
- 🛍️ **商品浏览** - 精美的商品展示，支持多分类
- 🎁 **一键兑换** - 简单快捷的兑换流程
- 📜 **兑换记录** - 完整的历史兑换记录
- 📊 **积分明细** - 详细的积分变动记录

### 👨‍💼 管理员端

- 📈 **数据统计** - 实时统计用户、商品、兑换数据
- 👤 **用户管理** - 查看和管理所有员工账户
- ⚡ **积分调整** - 灵活的积分增减功能
- 📦 **商品管理** - 添加、编辑、上下架商品
- 🎯 **订单管理** - 查看所有兑换订单
- 💳 **流水查询** - 完整的积分变动记录

## 🚀 快速开始

### 前置要求

- Node.js 16+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
cd "/Users/yuanfeng/work-dir/repos/kiro-repo/aidlc-251230-demo/AWSomeshop-Demo/AWSomeShop Employee Rewards Site"
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
```
http://localhost:5173
```

### 测试账号

| 角色 | 用户名 | 密码 | 积分 |
|------|--------|------|------|
| 管理员 | admin | password123 | 5000 |
| 员工 | zhangsan | password123 | 1500 |
| 员工 | lisi | password123 | 800 |
| 员工 | wangwu | password123 | 2200 |

## 🛠️ 技术栈

### 前端框架
- **React 18.3.1** - 声明式 UI 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite 6.3.5** - 下一代前端构建工具

### UI 框架
- **Tailwind CSS 4.1.12** - 实用优先的 CSS 框架
- **shadcn/ui** - 高质量的 React 组件库
- **Radix UI** - 无样式的可访问组件
- **Lucide React** - 精美的图标库

### 状态管理
- **React Context API** - 轻量级状态管理

### 通知系统
- **Sonner** - 优雅的 Toast 通知

## 📁 项目结构

```
src/
├── app/
│   ├── components/
│   │   ├── figma/              # Figma 导出组件
│   │   ├── ui/                 # UI 组件库
│   │   ├── AdminDashboard.tsx  # 管理员面板
│   │   ├── EmployeeDashboard.tsx # 员工面板
│   │   └── LoginPage.tsx       # 登录页
│   ├── context/
│   │   └── AuthContext.tsx     # 认证上下文
│   ├── lib/
│   │   └── mockData.ts         # Mock 数据
│   ├── types/
│   │   └── index.ts            # 类型定义
│   └── App.tsx                 # 主应用
├── styles/
│   ├── fonts.css               # 字体
│   ├── index.css               # 主样式
│   ├── tailwind.css            # Tailwind 配置
│   └── theme.css               # 主题变量
└── main.tsx                    # 入口文件
```

## 🎨 设计系统

### 颜色方案

| 用途 | 颜色 | 说明 |
|------|------|------|
| 主色 | Indigo | 品牌色，用于按钮、链接 |
| 强调色 | Amber | 积分相关元素 |
| 成功 | Green | 成功状态提示 |
| 错误 | Red | 错误状态提示 |
| 中性 | Gray | 文本、背景、边框 |

### 组件库

项目使用 shadcn/ui 组件库，包含 50+ 精心设计的组件：

- 布局组件：Card, Tabs, Dialog, Sheet
- 表单组件：Input, Button, Select, Checkbox
- 数据展示：Table, Badge, Avatar
- 反馈组件：Toast, Alert, Progress
- 导航组件：Menu, Breadcrumb, Pagination

## 📊 数据模型

### 用户 (User)
```typescript
{
  id: string;
  username: string;
  email: string;
  role: 'employee' | 'admin';
  points: number;
  monthlyAllocation: number;
  active: boolean;
  createdAt: string;
}
```

### 商品 (Product)
```typescript
{
  id: string;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  stock: number;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}
```

### 积分交易 (PointTransaction)
```typescript
{
  id: string;
  userId: string;
  amount: number;
  type: 'allocation' | 'redemption' | 'adjustment' | 'expiration';
  description: string;
  adminId?: string;
  createdAt: string;
}
```

### 订单 (Order)
```typescript
{
  id: string;
  userId: string;
  productId: string;
  productName: string;
  pointsCost: number;
  status: 'completed' | 'processing' | 'cancelled';
  createdAt: string;
}
```

## 🎬 演示

### 员工端界面

**登录页面**
- 简洁的登录表单
- 测试账号提示
- 品牌标识展示

**商品浏览**
- 网格布局展示商品
- 商品图片、名称、描述
- 积分价格和库存状态
- 一键兑换按钮

**积分管理**
- 当前积分余额
- 月度分配额度
- 积分变动明细
- 兑换历史记录

### 管理员端界面

**统计面板**
- 总用户数和活跃用户
- 商品总数和上架数量
- 总兑换次数
- 已分配积分总计

**用户管理**
- 用户列表展示
- 积分调整功能
- 用户状态管理

**商品管理**
- 商品列表
- 添加/编辑商品
- 库存管理
- 上下架控制

## 🔄 开发计划

### 短期目标 (v1.1)
- [ ] 商品搜索功能
- [ ] 商品分类筛选
- [ ] 用户个人资料编辑
- [ ] 积分过期提醒

### 中期目标 (v2.0)
- [ ] 后端 API 集成
- [ ] 数据库持久化
- [ ] 文件上传功能
- [ ] 邮件通知系统

### 长期目标 (v3.0)
- [ ] 移动端 App
- [ ] 积分转赠功能
- [ ] 商品评价系统
- [ ] 数据分析报表

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 组件使用函数式写法
- 添加适当的注释
- 保持代码简洁清晰

## 📝 许可证

本项目基于 Figma 设计生成。详见 [ATTRIBUTIONS.md](./ATTRIBUTIONS.md)

## 🙏 致谢

- [Figma](https://www.figma.com/) - 设计工具
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件
- [Lucide](https://lucide.dev/) - 图标库
- [Unsplash](https://unsplash.com/) - 图片资源

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 📧 Email: [your-email@example.com]
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**用心打造，服务员工** ❤️

Made with ❤️ by AWSomeShop Team

</div>
