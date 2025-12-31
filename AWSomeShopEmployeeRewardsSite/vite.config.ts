import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory (Vite resolves relative to config file)
      '@': './src',
    },
  },
  server: {
    // 开发服务器配置
    port: 5173,
    // 可选：配置代理，让开发环境也能使用相对路径（与生产环境一致）
    // 取消注释以下配置以启用代理模式
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //   },
    // },
  },
})
