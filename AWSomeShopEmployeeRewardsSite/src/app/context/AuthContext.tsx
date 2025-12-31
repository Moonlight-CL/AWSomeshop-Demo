import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse, TokenStorage } from '../types';
import { authAPI } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查存储的会话
    const initAuth = async () => {
      const storedUser = localStorage.getItem('awsomeshop_user');
      const storedTokens = localStorage.getItem('awsomeshop_tokens');
      
      if (storedUser && storedTokens) {
        try {
          // 验证令牌是否仍然有效
          const response = await authAPI.getCurrentUser();
          const currentUser = response.data.data;
          
          // 更新用户信息（可能有变化）
          setUser(currentUser);
          localStorage.setItem('awsomeshop_user', JSON.stringify(currentUser));
        } catch (error) {
          // 令牌无效，清除存储
          localStorage.removeItem('awsomeshop_user');
          localStorage.removeItem('awsomeshop_tokens');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(username, password);
      const loginData: LoginResponse = response.data.data;
      
      // 存储令牌
      const tokens: TokenStorage = {
        access_token: loginData.access_token,
        id_token: loginData.id_token,
        refresh_token: loginData.refresh_token,
        username: loginData.user.username,
      };
      localStorage.setItem('awsomeshop_tokens', JSON.stringify(tokens));
      
      // 存储用户信息
      setUser(loginData.user);
      localStorage.setItem('awsomeshop_user', JSON.stringify(loginData.user));
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // 处理错误消息
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      // 调用后端登出 API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 无论 API 调用是否成功，都清除本地状态
      setUser(null);
      localStorage.removeItem('awsomeshop_user');
      localStorage.removeItem('awsomeshop_tokens');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
