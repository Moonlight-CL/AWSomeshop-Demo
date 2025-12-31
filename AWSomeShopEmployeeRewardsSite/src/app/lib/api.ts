import axios from 'axios';

// API 基础 URL - 根据环境配置
// 生产环境: VITE_API_URL="" 使用相对路径，通过 ALB 路由到后端
// 开发环境: VITE_API_URL="http://localhost:8000" 直接连接本地后端
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加 Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('awsomeshop_tokens');
    if (tokens) {
      const { access_token } = JSON.parse(tokens);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401 错误（令牌过期）
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新令牌
        const tokens = localStorage.getItem('awsomeshop_tokens');
        if (tokens) {
          const { refresh_token, username } = JSON.parse(tokens);
          
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token,
            username,
          });

          const newTokens = response.data.data;
          
          // 更新存储的令牌
          const storedTokens = JSON.parse(localStorage.getItem('awsomeshop_tokens') || '{}');
          storedTokens.access_token = newTokens.access_token;
          storedTokens.id_token = newTokens.id_token;
          localStorage.setItem('awsomeshop_tokens', JSON.stringify(storedTokens));

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除认证信息并跳转到登录页
        localStorage.removeItem('awsomeshop_tokens');
        localStorage.removeItem('awsomeshop_user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API 接口定义
export const authAPI = {
  login: (username: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { username, password }),
  
  logout: () =>
    apiClient.post('/api/v1/auth/logout'),
  
  getCurrentUser: () =>
    apiClient.get('/api/v1/auth/me'),
  
  refreshToken: (refresh_token: string, username: string) =>
    apiClient.post('/api/v1/auth/refresh', { refresh_token, username }),
};

export const productsAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/api/v1/products', { params: { page, limit } }),
  
  getById: (id: string) =>
    apiClient.get(`/api/v1/products/${id}`),
};

export const ordersAPI = {
  create: (product_id: string) =>
    apiClient.post('/api/v1/orders', { product_id }),
  
  getMyOrders: (page = 1, limit = 20, status?: string) =>
    apiClient.get('/api/v1/orders/me', { params: { page, limit, status } }),
  
  getAllOrders: (page = 1, limit = 20, user_id?: string, status?: string) =>
    apiClient.get('/api/v1/orders', { params: { page, limit, user_id, status } }),
};

export const transactionsAPI = {
  getMyTransactions: (page = 1, limit = 20, type?: string) =>
    apiClient.get('/api/v1/transactions/me', { params: { page, limit, type } }),
  
  getAllTransactions: (page = 1, limit = 20, user_id?: string, type?: string) =>
    apiClient.get('/api/v1/transactions', { params: { page, limit, user_id, type } }),
};

export const usersAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/api/v1/users', { params: { page, limit } }),
  
  getById: (id: string) =>
    apiClient.get(`/api/v1/users/${id}`),
  
  adjustPoints: (user_id: string, amount: number, description: string) =>
    apiClient.post('/api/v1/users/adjust-points', { user_id, amount, description }),
};

export const statisticsAPI = {
  getOverview: () =>
    apiClient.get('/api/v1/statistics/overview'),
};
