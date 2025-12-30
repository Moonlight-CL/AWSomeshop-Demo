// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'employee' | 'admin';
  points: number;
  monthlyAllocation: number;
  active: boolean;
  createdAt: string;
}

// Product Types
export interface Product {
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

// Point Transaction Types
export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'allocation' | 'redemption' | 'adjustment' | 'expiration';
  description: string;
  adminId?: string;
  createdAt: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  pointsCost: number;
  status: 'completed' | 'processing' | 'cancelled';
  createdAt: string;
}

// Statistics Types
export interface Statistics {
  totalUsers: number;
  activeUsers: number;
  totalPointsDistributed: number;
  totalRedemptions: number;
  popularProducts: { productId: string; productName: string; count: number }[];
}
