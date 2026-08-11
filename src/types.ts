/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Brand {
  id: number;
  name: string;
  image: string;
}

export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface Banner {
  id: number;
  name: string;
  image: string;
  status: number; // 1 = Active, 0 = Inactive
}

export interface News {
  id: number;
  title: string;
  image: string;
  content: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Retro' | 'Low' | 'Collabs' | string;
  sku: string;
  isFeatured: boolean;
  releaseYear: number;
  // Backend integrations
  brand_id?: number;
  category_id?: number;
  specification?: string;
  brand?: Brand;
  attributes?: any; // JSON string or array of attributes
  oldprice?: number;
  quantity?: number;
}

export interface Variant {
  id: string;
  productId: string;
  size: string; // US Men's sizes, e.g., "8", "9", "10", "11", "12"
  color: string;
  stock: number;
  sku: string;
}

export interface BackendVariantDetail {
  id?: number;
  product_variant_id?: number;
  attribute_name: string;
  attribute_value: string;
  image?: string | null;
}

export interface BackendVariant {
  id?: number;
  product_id: number;
  price: number | null;
  quantity: number;
  image: string | null;
  details?: BackendVariantDetail[];
  attributes?: Record<string, string>; // mapping for UI convenience
  attribute_images?: Record<string, string>; // mapping for UI convenience
}

export interface User {
  id: string;
  email: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  avatar?: string;
  role: 'User' | 'Admin';
}

export interface Order {
  id: string;
  userId: string;
  orderDate: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // Price of the item at purchase
}

export interface CartItem {
  id: string; // Unique identifier for the cart line item (usually combination of productId and variantId)
  productId: string;
  variantId: string;
  quantity: number;
}

// Full hydrated types for UI convenience
export interface HydratedOrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  product: Product;
  variant: Variant;
}

export interface HydratedOrder {
  id: string;
  userId: string;
  orderDate: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  items: HydratedOrderItem[];
  user: User;
}

export interface HydratedCartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: Variant;
}
