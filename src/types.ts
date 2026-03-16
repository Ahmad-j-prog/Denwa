export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'smartphone' | 'tablet' | 'laptop';
  condition: 'new' | 'refurbished' | 'second-hand';
  stock: number;
  imageUrl: string;
  specs?: Record<string, string>;
  createdAt: string;
}

export interface UserListing {
  id: string;
  sellerId: string;
  sellerEmail: string;
  name: string;
  description: string;
  category: 'smartphone' | 'tablet' | 'laptop';
  condition: 'refurbished' | 'second-hand';
  expectedPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}
