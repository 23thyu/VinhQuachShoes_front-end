import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Variant, User, Order, OrderItem, CartItem, HydratedCartItem, HydratedOrder, HydratedOrderItem } from '../types';
import { toastApi } from './ToastContext';
import { getAuthToken } from '../utils/authHeaders';

interface AppContextType {
  products: Product[];
  categories: Category[];
  variants: Variant[];
  users: User[];
  orders: Order[];
  orderItems: OrderItem[];
  cart: CartItem[];
  currentUser: User | null;
  activeView: 'client' | 'admin';
  activeClientTab: 'shop' | 'account';
  selectedCategory: string;
  searchQuery: string;
  isCartOpen: boolean;
  setCurrentUser: (user: User | null) => void;
  
  // Setters
  setActiveView: (view: 'client' | 'admin') => void;
  setActiveClientTab: (tab: 'shop' | 'account') => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  
  // Products CRUD
  addProduct: (product: Omit<Product, 'id'>, sizeStocks: { size: string; stock: number }[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Variants Stock
  updateVariantStock: (variantId: string, newStock: number) => void;
  
  // Cart Actions
  addToCart: (productId: string, variantId: string | null, quantity: number) => void;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  updateCartQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  
  // Checkout & Orders
  checkout: (
    shippingInfo: { name: string; address: string; city: string; postalCode: string; country: string; phone?: string },
    directItem?: any
  ) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  fetchUserOrders: () => Promise<void>;
  
  // Hydrated helpers
  getHydratedCart: () => HydratedCartItem[];
  getHydratedOrders: () => HydratedOrder[];
  getProductsWithLowStock: () => { product: Product; variant: Variant }[];
  
  // Users management
  switchUser: (userId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

const FALLBACK_PRODUCT: Product = {
  id: 'fallback',
  name: 'Sản phẩm đã gỡ bỏ',
  description: '',
  price: 0,
  image: '',
  category: '',
  sku: '',
  isFeatured: false,
  releaseYear: 0
};

const FALLBACK_USER: User = {
  id: 'fallback',
  email: '',
  name: 'Người dùng ẩn danh',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  avatar: '',
  role: 'User'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // Local cache user data from backend
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jordan_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const token = localStorage.getItem('jordan_token') || sessionStorage.getItem('jordan_token');
    if (!token) return null;
    const saved = localStorage.getItem('jordan_current_user') || sessionStorage.getItem('jordan_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [backendCartId, setBackendCartId] = useState<number | null>(null);

  // UI state variables
  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [activeClientTab, setActiveClientTab] = useState<'shop' | 'account'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      const isLocal = !!localStorage.getItem('jordan_token');
      if (isLocal) {
        localStorage.setItem('jordan_current_user', JSON.stringify(currentUser));
        sessionStorage.removeItem('jordan_current_user');
      } else {
        sessionStorage.setItem('jordan_current_user', JSON.stringify(currentUser));
        localStorage.removeItem('jordan_current_user');
      }
    } else {
      localStorage.removeItem('jordan_current_user');
      sessionStorage.removeItem('jordan_current_user');
    }
  }, [currentUser]);

  const getSessionId = () => {
    let sid = localStorage.getItem('jordan_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('jordan_session_id', sid);
    }
    return sid;
  };

  // Fetch full inventory catalog
  const fetchStoreProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products?limit=all`);
      if (res.ok) {
        const result = await res.json();
        setProducts(result.data || []);
      }
    } catch (e) {
      console.error('Error fetching store products:', e);
    }
  };

  const fetchStoreCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories?limit=all`);
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || []);
      }
    } catch (e) {
      console.error('Error fetching store categories:', e);
    }
  };

  // Fetch/Create user or guest cart on backend
  const fetchOrCreateCart = async (userId: string | null) => {
    try {
      const sessionId = getSessionId();
      let url = `${API_BASE_URL}/carts?limit=all`;
      if (userId) {
        url += `&user_id=${userId}`;
      } else {
        url += `&session_id=${sessionId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        const cartsList = result.data || [];

        if (cartsList.length > 0) {
          const activeCart = cartsList[0];
          setBackendCartId(activeCart.id);
          mapCartItems(activeCart.cart_items || []);
        } else {
          // Create new cart
          const createRes = await fetch(`${API_BASE_URL}/carts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userId ? { user_id: userId } : { session_id: sessionId })
          });

          if (createRes.ok || createRes.status === 409) {
            const createResult = await createRes.json();
            const activeCart = createResult.data;
            setBackendCartId(activeCart.id);
            mapCartItems(activeCart.cart_items || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching or creating cart:', e);
    }
  };

  const mapCartItems = (backendItems: any[]) => {
    const mappedCart: CartItem[] = [];
    const mappedVariants: Variant[] = [];

    backendItems.forEach(item => {
      const varDetails = item.product_variant?.details || [];
      const sizeDetail = varDetails.find((d: any) => d.attribute_name.toUpperCase().includes('SIZE') || d.attribute_name.toUpperCase().includes('KÍCH') || d.attribute_name.toUpperCase().includes('SPECIFICATION'));
      const colorDetail = varDetails.find((d: any) => d.attribute_name.toUpperCase().includes('COLOR') || d.attribute_name.toUpperCase().includes('MÀU'));

      const varId = String(item.product_variant_id || `v_dummy_cart_${item.id}`);

      mappedCart.push({
        id: String(item.id),
        productId: String(item.product_id),
        variantId: varId,
        quantity: Number(item.quantity)
      });

      mappedVariants.push({
        id: varId,
        productId: String(item.product_id),
        size: sizeDetail ? sizeDetail.attribute_value : 'N/A',
        color: colorDetail ? colorDetail.attribute_value : 'Default',
        stock: item.product_variant ? item.product_variant.quantity : 99,
        sku: ''
      });
    });

    setCart(mappedCart);
    setVariants(prev => {
      const filtered = prev.filter(v => !v.id.startsWith('v_dummy_cart_'));
      const newVariants = [...filtered];
      mappedVariants.forEach(mv => {
        if (!newVariants.some(v => v.id === mv.id)) {
          newVariants.push(mv);
        }
      });
      return newVariants;
    });
  };

  // Fetch past orders log
  const fetchUserOrders = async () => {
    if (!currentUser) return;
    try {
      const token = getAuthToken();
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/orders`, { headers: authHeader });
      if (res.ok) {
        const result = await res.json();
        const ordersList = result.data || [];

        const mappedOrders: Order[] = [];
        const mappedOrderItems: OrderItem[] = [];
        const mappedOrderVariants: Variant[] = [];

        await Promise.all(
          ordersList.map(async (order: any) => {
            const token = getAuthToken();
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
            const detailRes = await fetch(`${API_BASE_URL}/orders/${order.id}`, { headers: authHeader });
            if (detailRes.ok) {
              const detailResult = await detailRes.json();
              const fullOrder = detailResult.data;

              mappedOrders.push({
                id: String(fullOrder.id),
                userId: String(fullOrder.user_id),
                orderDate: fullOrder.created_at,
                status: fullOrder.status,
                totalAmount: Number(fullOrder.total),
                shippingName: fullOrder.user?.name || 'KHÁCH HÀNG',
                shippingAddress: fullOrder.address || '',
                shippingCity: '',
                shippingPostalCode: '',
                shippingCountry: ''
              });

              if (fullOrder.order_details) {
                fullOrder.order_details.forEach((detail: any) => {
                  const variantDetails = detail.product_variant?.details || [];
                  const sizeDetail = variantDetails.find((d: any) => d.attribute_name.toUpperCase().includes('SIZE') || d.attribute_name.toUpperCase().includes('KÍCH') || d.attribute_name.toUpperCase().includes('SPECIFICATION'));
                  const colorDetail = variantDetails.find((d: any) => d.attribute_name.toUpperCase().includes('COLOR') || d.attribute_name.toUpperCase().includes('MÀU'));

                  const varId = String(detail.product_variant_id || `v_dummy_${detail.id}`);

                  mappedOrderItems.push({
                    id: String(detail.id),
                    orderId: String(fullOrder.id),
                    productId: String(detail.product_id),
                    variantId: varId,
                    quantity: Number(detail.quantity),
                    price: Number(detail.price)
                  });

                  mappedOrderVariants.push({
                    id: varId,
                    productId: String(detail.product_id),
                    size: sizeDetail ? sizeDetail.attribute_value : 'N/A',
                    color: colorDetail ? colorDetail.attribute_value : 'Default',
                    stock: 0,
                    sku: ''
                  });
                });
              }
            }
          })
        );

        setOrders(mappedOrders);
        setOrderItems(mappedOrderItems);
        setVariants(prev => {
          const filtered = prev.filter(v => !v.id.startsWith('v_dummy_'));
          const newVariants = [...filtered];
          mappedOrderVariants.forEach(mv => {
            if (!newVariants.some(v => v.id === mv.id)) {
              newVariants.push(mv);
            }
          });
          return newVariants;
        });
      }
    } catch (e) {
      console.error('Error fetching user orders:', e);
    }
  };

  useEffect(() => {
    fetchStoreProducts();
    fetchStoreCategories();
  }, []);

  useEffect(() => {
    // Reset cart state immediately so stale items from previous user don't bleed through
    setCart([]);
    setBackendCartId(null);
    // Then fetch/create the cart for the new identity
    fetchOrCreateCart(currentUser ? currentUser.id : null);
    if (currentUser) {
      fetchUserOrders();
    } else {
      setOrders([]);
      setOrderItems([]);
    }
  }, [currentUser]);

  // Product CRUD (Admin fallback)
  const addProduct = (productData: Omit<Product, 'id'>, sizeStocks: { size: string; stock: number }[]) => {
    fetchStoreProducts();
  };

  const updateProduct = (updatedProduct: Product) => {
    fetchStoreProducts();
  };

  const deleteProduct = (id: string) => {
    fetchStoreProducts();
  };

  const updateVariantStock = (variantId: string, newStock: number) => {
    // Admin handles via VariantManagement
  };

  // Cart Actions
  const addToCart = async (productId: string, variantId: string | null, quantity: number) => {
    if (!backendCartId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cart-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(productId),
          product_variant_id: (!variantId || variantId.startsWith('v_dummy_')) ? null : Number(variantId),
          quantity,
          cart_id: backendCartId
        })
      });

      if (response.ok) {
        fetchOrCreateCart(currentUser ? currentUser.id : null);
        setIsCartOpen(true);
      } else {
        const err = await response.json();
        toastApi.current?.error(err.message || 'LỖI KHI THÊM SẢN PHẨM VÀO GIỎ');
      }
    } catch (e) {
      console.error('Error adding to cart:', e);
    }
  };

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    const previousCart = cart;
    setCart(prev => prev.filter(item => item.id !== cartItemId));

    try {
      const response = await fetch(`${API_BASE_URL}/cart-items/${cartItemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toastApi.current?.success('ĐÃ XÓA KHỎI GIỎ HÀNG');
        fetchOrCreateCart(currentUser ? currentUser.id : null);
        return true;
      } else {
        setCart(previousCart);
        const err = await response.json();
        toastApi.current?.error(err.message || 'LỖI KHI XÓA SẢN PHẨM KHỎI GIỎ HÀNG');
        return false;
      }
    } catch (e) {
      setCart(previousCart);
      console.error('Error removing from cart:', e);
      toastApi.current?.error('LỖI KHI XÓA SẢN PHẨM KHỎI GIỎ HÀNG');
      return false;
    }
  };

  const updateCartQuantity = async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (quantity < 1) return false;
    const previousCart = cart;
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));

    try {
      const response = await fetch(`${API_BASE_URL}/cart-items/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });

      if (response.ok) {
        fetchOrCreateCart(currentUser ? currentUser.id : null);
        return true;
      } else {
        setCart(previousCart);
        const err = await response.json();
        toastApi.current?.error(err.message || 'LỖI KHI CẬP NHẬT SỐ LƯỢNG');
        return false;
      }
    } catch (e) {
      setCart(previousCart);
      console.error('Error updating cart quantity:', e);
      toastApi.current?.error('LỖI KHI CẬP NHẬT SỐ LƯỢNG');
      return false;
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order Checkout
  const checkout = async (
    shippingInfo: { name: string; address: string; city: string; postalCode: string; country: string; phone?: string },
    directItem?: any
  ) => {
    let targetCartId = backendCartId;

    if (directItem) {
      // Create a dedicated temporary cart session specifically for direct Buy Now
      try {
        const sessionId = getSessionId();
        const cartRes = await fetch(`${API_BASE_URL}/carts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUser ? { user_id: currentUser.id } : { session_id: sessionId })
        });
        const cartData = await cartRes.json();
        const tempCartId = cartData.data?.id;

        if (tempCartId) {
          const itemRes = await fetch(`${API_BASE_URL}/cart-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: Number(directItem.product.id),
              product_variant_id: directItem.variant?.id ? Number(directItem.variant.id) : null,
              quantity: directItem.quantity,
              cart_id: tempCartId
            })
          });

          if (!itemRes.ok) {
            const err = await itemRes.json();
            toastApi.current?.error(err.message || 'LỖI KHI TẠO ĐƠN HÀNG MUA NGAY');
            return false;
          }
          targetCartId = tempCartId;
        }
      } catch (err) {
        console.error('Error setting up direct checkout cart:', err);
      }
    }

    if (!targetCartId) return false;

    try {
      const subtotal = directItem 
        ? directItem.price * directItem.quantity 
        : getHydratedCart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      const response = await fetch(`${API_BASE_URL}/carts/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: targetCartId,
          total: subtotal,
          phone: shippingInfo.phone || currentUser?.phone || shippingInfo.postalCode || 'N/A',
          address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.country}`
        })
      });

      if (response.ok) {
        if (!directItem) {
          clearCart();
          setBackendCartId(null);
          fetchOrCreateCart(currentUser ? currentUser.id : null);
        }
        setIsCartOpen(false);
        fetchUserOrders();
        setActiveClientTab('account');
        return true;
      } else {
        const err = await response.json();
        toastApi.current?.error(err.message || 'LỖI KHI TIẾN HÀNH THANH TOÁN');
        return false;
      }
    } catch (e) {
      console.error('Error processing checkout:', e);
      return false;
    }
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    // Admin action
  };

  const switchUser = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  // Hydration helpers
  const getHydratedCart = (): HydratedCartItem[] => {
    return cart.map(item => {
      const product = products.find(p => String(p.id) === String(item.productId)) || FALLBACK_PRODUCT;
      const variant = variants.find(v => String(v.id) === String(item.variantId)) || {
        id: item.variantId,
        productId: item.productId,
        size: 'N/A',
        color: 'N/A',
        stock: 0,
        sku: 'N/A'
      };
      return {
        ...item,
        product,
        variant
      };
    });
  };

  const getHydratedOrders = (): HydratedOrder[] => {
    return orders.map(order => {
      const user = users.find(u => u.id === order.userId) || FALLBACK_USER;
      const itemsOfOrder = orderItems.filter(oi => oi.orderId === order.id);

      const hydratedItems: HydratedOrderItem[] = itemsOfOrder.map(oi => {
        const product = products.find(p => String(p.id) === String(oi.productId)) || FALLBACK_PRODUCT;
        const variant = variants.find(v => String(v.id) === String(oi.variantId)) || {
          id: oi.variantId,
          productId: oi.productId,
          size: 'N/A',
          color: 'N/A',
          stock: 0,
          sku: 'N/A'
        };
        return {
          ...oi,
          product,
          variant
        };
      });

      return {
        ...order,
        user,
        items: hydratedItems
      };
    });
  };

  const getProductsWithLowStock = () => {
    const lowStockItems: { product: Product; variant: Variant }[] = [];
    variants.forEach(v => {
      if (v.stock <= 3) {
        const product = products.find(p => String(p.id) === String(v.productId));
        if (product) {
          lowStockItems.push({ product, variant: v });
        }
      }
    });
    return lowStockItems;
  };

  return (
    <AppContext.Provider value={{
      products,
      variants,
      users,
      orders,
      orderItems,
      cart,
      currentUser,
      activeView,
      activeClientTab,
      selectedCategory,
      searchQuery,
      isCartOpen,
      setCurrentUser,
      categories,
      
      setActiveView,
      setActiveClientTab,
      setSelectedCategory,
      setSearchQuery,
      setIsCartOpen,
      
      addProduct,
      updateProduct,
      deleteProduct,
      updateVariantStock,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      checkout,
      updateOrderStatus,
      fetchUserOrders,
      getHydratedCart,
      getHydratedOrders,
      getProductsWithLowStock,
      switchUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
