export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  stock: number;
  sizes?: string[];
  colors?: string[];
  createdAt: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerWilaya: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  selectedSize?: string;
  selectedColor?: string;
  createdAt: string;
}
