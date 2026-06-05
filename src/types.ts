export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  stock: number;
  features: string[];
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
  token?: string;
}

export interface CartItem {
  id: string; // combination of productId and options
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: string;
  transactionId: string;
  emailSent: boolean;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  conversionRate: number;
  averageOrderValue: number;
  inventoryStatus: {
    inStock: number;
    lowStock: number; // < 5 elements
    outOfStock: number;
  };
  revenueByDate: { date: string; revenue: number; orders: number }[];
  categorySales: { category: string; sales: number; value: number }[];
}
