/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle, ShoppingBag, ShieldAlert, BarChart3, TrendingUp,
  X, FolderOpen, Award, ClipboardList, Settings, Users, Image as ImageIcon, Flag, Newspaper, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents import
import { ProductManagement } from './Product';
import { VariantManagement } from './Variant';
import { CategoryManagement } from './Category';
import { BrandManagement } from './Brand';
import { OrderManagement } from './Order';
import { UserManagement } from './User';
import { MediaLibrary } from './Media';
import { BannerManagement } from './Banner';
import { NewsManagement } from './News';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'variants' | 'categories' | 'brands' | 'orders' | 'users' | 'media' | 'banners' | 'news'>('overview');

  // Real Database Overview State
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

  const fetchOverviewData = async () => {
    setLoadingOverview(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products?limit=all`),
        fetch(`${API_BASE_URL}/orders?limit=all`)
      ]);
      if (prodRes.ok) {
        const result = await prodRes.json();
        setProducts(result.data || []);
      }
      if (orderRes.ok) {
        const result = await orderRes.json();
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching overview statistics:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab]);

  // Calculations from DB
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const lowStockItems = products.filter(p => (p.quantity || 0) < 10);

  // Render original overview widgets in Vietnamese
  const renderOverview = () => {
    return (
      <div className="space-y-8">
        {/* Title Header */}
        <div className="border-b border-zinc-900 pb-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> HỆ THỐNG PHÂN TÍCH THỐNG KÊ
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            BẢNG ĐIỀU KHIỂN CHUNG
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-1 relative overflow-hidden">
            <TrendingUp className="absolute right-4 top-4 h-8 w-8 text-zinc-900/60 stroke-[1.5]" />
            <p className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest">TỔNG DOANH THU THỰC TẾ</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">{(totalSales * 25000).toLocaleString('vi-VN')} ₫</p>
            <p className="font-sans text-[8px] text-zinc-600 lowercase font-light">không tính các đơn hàng đã hủy</p>
          </div>

          {/* Catalog items count */}
          <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-1 relative overflow-hidden">
            <ShoppingBag className="absolute right-4 top-4 h-8 w-8 text-zinc-900/60 stroke-[1.5]" />
            <p className="font-mono text-[9px] text-zinc-555 uppercase tracking-widest">SỐ LƯỢNG SẢN PHẨM</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">{products.length}</p>
            <p className="font-sans text-[8px] text-zinc-600 lowercase font-light">tổng số mẫu giày đã đăng ký</p>
          </div>

          {/* Low Vault Thresholds */}
          <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-1 relative overflow-hidden">
            <AlertCircle className="absolute right-4 top-4 h-8 w-8 text-zinc-900/60 stroke-[1.5]" />
            <p className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest">CẢNH BÁO TỒN KHO THẤP</p>
            <p className={`font-mono text-lg sm:text-xl font-bold tracking-wider ${
              lowStockItems.length > 0 ? 'text-amber-500' : 'text-zinc-400'
            }`}>{lowStockItems.length}</p>
            <p className="font-sans text-[8px] text-zinc-600 lowercase font-light">sản phẩm có tồn kho dưới 10 đôi</p>
          </div>

          {/* Pending Clears */}
          <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-1 relative overflow-hidden">
            <ClipboardList className="absolute right-4 top-4 h-8 w-8 text-zinc-900/60 stroke-[1.5]" />
            <p className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest">ĐƠN CHỜ GIAO</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">{pendingOrders.length}</p>
            <p className="font-sans text-[8px] text-zinc-600 lowercase font-light">đang chờ duyệt vận chuyển/giao hàng</p>
          </div>
        </div>

        {/* Lower row: Alerts and Quick status logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <div className="lg:col-span-2 border border-zinc-900 bg-zinc-950 p-6 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-900 pb-2">
              BÁO CÁO HÀNG TỒN KHO THẤP (DƯỚI 10 ĐÔI)
            </h3>
            {loadingOverview ? (
              <div className="flex justify-center items-center py-10 font-mono text-[9px] text-zinc-500 tracking-widest uppercase">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500 mr-2" /> ĐANG TẢI DỮ LIỆU...
              </div>
            ) : lowStockItems.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-zinc-600 tracking-wider">TỒN KHO CỦA TOÀN BỘ SẢN PHẨM ỔN ĐỊNH</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-900/10 border border-zinc-900 p-3 font-mono text-[10px] uppercase">
                    <div className="truncate max-w-[280px]">
                      <span className="text-white font-bold">{item.name}</span>
                      <span className="block text-[8px] text-zinc-555">THƯƠNG HIỆU: {item.brand?.name || '—'} | SKU: {item.sku}</span>
                    </div>
                    <span className="border border-amber-900/50 bg-amber-950/20 text-amber-500 font-bold px-2 py-0.5 text-[9px]">
                      TỒN: {item.quantity || 0} ĐÔI
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Dispatches Info */}
          <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-900 pb-2">
              DANH SÁCH ĐƠN CHỜ GIAO (PENDING)
            </h3>
            {loadingOverview ? (
              <div className="flex justify-center items-center py-10 font-mono text-[9px] text-zinc-500 tracking-widest uppercase">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500 mr-2" /> ĐANG TẢI DỮ LIỆU...
              </div>
            ) : pendingOrders.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-zinc-655 tracking-wider">KHÔNG CÓ ĐƠN HÀNG CHỜ XỬ LÝ</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {pendingOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-zinc-900 p-2.5 bg-zinc-900/5 text-[9px] font-mono tracking-wider uppercase space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-550">#DONHANG-{order.id}</span>
                      <span className="text-white">{(Number(order.total_amount) * 25000).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <p className="text-zinc-450 truncate">MUA BỞI: {order.user?.name || 'KHÁCH VÔ DANH'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-black text-white font-sans min-h-[90vh] flex flex-col md:flex-row gap-8">
      {/* Left Sidebar control console */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> SECURE ROOT PORT
          </span>
          <h2 className="font-display text-sm font-black uppercase tracking-tight mt-1">
            JORDAN COMMAND CENTRAL
          </h2>
        </div>

        {/* Tab sidebar select links */}
        <div className="flex flex-col border border-zinc-900 bg-zinc-950 font-mono text-[10px] uppercase tracking-wider divide-y divide-zinc-900">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'products', label: 'Quản lý sản phẩm', icon: <ShoppingBag className="h-4 w-4" /> },
            { id: 'variants', label: 'Cấu hình biến thể', icon: <Settings className="h-4 w-4" /> },
            { id: 'categories', label: 'Quản lý danh mục', icon: <FolderOpen className="h-4 w-4" /> },
            { id: 'brands', label: 'Quản lý thương hiệu', icon: <Award className="h-4 w-4" /> },
            { id: 'orders', label: 'Quản lý đơn hàng', icon: <ClipboardList className="h-4 w-4" /> },
            { id: 'users', label: 'Quản lý người dùng', icon: <Users className="h-4 w-4" /> },
            { id: 'media', label: 'Thư viện hình ảnh', icon: <ImageIcon className="h-4 w-4" /> },
            { id: 'banners', label: 'Quản lý banner', icon: <Flag className="h-4 w-4" /> },
            { id: 'news', label: 'Quản lý bài viết', icon: <Newspaper className="h-4 w-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Column / Content panel router */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'products' && <ProductManagement />}
            {activeTab === 'variants' && <VariantManagement />}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'brands' && <BrandManagement />}
            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'media' && <MediaLibrary />}
            {activeTab === 'banners' && <BannerManagement />}
            {activeTab === 'news' && <NewsManagement />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
export default AdminDashboard;
