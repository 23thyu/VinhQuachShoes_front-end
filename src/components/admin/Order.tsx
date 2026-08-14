/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Trash2, X, ClipboardList, Clock, Truck, CheckCircle, ShieldX, Phone, Mail, User, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getAdminHeaders } from '../../utils/authHeaders';

interface OrderItemBackend {
  id: number;
  product_id: number;
  product_variant_id: number;
  price: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    image: string;
  };
  product_variant?: {
    id: number;
    image: string | null;
    details: Array<{
      attribute_name: string;
      attribute_value: string;
    }>;
  };
}

interface OrderBackend {
  id: number;
  user_id: number;
  total?: number;
  total_amount?: number;
  totalPrice?: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  note?: string;
  phone?: string;
  address?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  order_details?: OrderItemBackend[];
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const OrderManagement: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [orders, setOrders] = useState<OrderBackend[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderBackend | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchOrders = async (page = 1, status = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders?page=${page}&status=${status}`, {
        headers: getAdminHeaders()
      });
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data || []);
        setCurrentPage(result.current_page || 1);
        setTotalPages(result.total_page || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  const handleShowDetails = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: getAdminHeaders()
      });
      if (response.ok) {
        const result = await response.json();
        setSelectedOrder(result.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Helper to normalize status string for select inputs
  const normalizeStatusValue = (status: string | number): string => {
    const s = String(status).toLowerCase();
    if (s === 'delivered' || s === '4') return 'Delivered';
    if (s === 'shipped' || s === 'shipping' || s === 'processing' || s === '3' || s === '2') return 'Shipped';
    if (s === 'cancelled' || s === 'failed' || s === '5' || s === '7') return 'Cancelled';
    return 'Pending';
  };

  // Helper to resolve display phone number (prioritizing user.phone if order.phone is a ZIP-like string e.g. '70000')
  const getDisplayPhone = (order: OrderBackend): string => {
    const rawOrderPhone = String(order.phone || '').trim();
    const rawUserPhone = String(order.user?.phone || '').trim();

    if (rawOrderPhone && rawOrderPhone.length >= 8 && !/^\d{4,6}$/.test(rawOrderPhone)) {
      return rawOrderPhone;
    }
    return rawUserPhone || rawOrderPhone || '—';
  };

  // Helper to safely calculate order total price with fallback calculation
  const calculateOrderTotal = (order: OrderBackend): number => {
    const rawTotal = order.total ?? order.totalPrice ?? order.total_amount;
    let numericVal = Number(rawTotal);

    if (isNaN(numericVal) || numericVal <= 0) {
      if (order.order_details && order.order_details.length > 0) {
        numericVal = order.order_details.reduce((sum, item) => {
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          return sum + itemPrice * itemQty;
        }, 0);
      } else {
        numericVal = 0;
      }
    }

    return numericVal < 100000 ? numericVal * 25000 : numericVal;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  // Async handler to update order status via API with Taste Toast notifications & local state update
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
        }
        toast.success(`ĐÃ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG #${id} THÀNH ${newStatus.toUpperCase()}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || errorData.error || 'LỖI KHI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('LỖI KẾT NỐI SERVER KHI CẬP NHẬT TRẠNG THÁI');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA/HỦY ĐƠN HÀNG NÀY KHÔNG?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (response.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        toast.success(`ĐÃ XÓA ĐƠN HÀNG #${id} THÀNH CÔNG`);
      } else {
        toast.error('KHÔNG THỂ XÓA ĐƠN HÀNG này.');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('LỖI KHI XÓA ĐƠN HÀNG.');
    }
  };

  const getStatusBadge = (status: string | number) => {
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'delivered' || statusStr === '4') {
      return (
        <span className="inline-flex items-center gap-1 border border-emerald-950 bg-emerald-950/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
          <CheckCircle className="h-3 w-3" /> DELIVERED
        </span>
      );
    } else if (statusStr === 'shipped' || statusStr === '3' || statusStr === 'shipping' || statusStr === '2' || statusStr === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 border border-blue-950 bg-blue-950/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">
          <Truck className="h-3 w-3 animate-pulse" /> SHIPPED
        </span>
      );
    } else if (statusStr === 'cancelled' || statusStr === '5' || statusStr === 'failed' || statusStr === '7') {
      return (
        <span className="inline-flex items-center gap-1 border border-zinc-850 bg-zinc-900 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          <ShieldX className="h-3 w-3" /> CANCELLED
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 border border-amber-950 bg-amber-950/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase">
          <Clock className="h-3 w-3" /> PENDING
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-4 border border-zinc-900">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-zinc-550" /> BẢNG KIỂM SOÁT ĐƠN HÀNG
        </h3>
        
        <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-[10px]">
          <span className="text-zinc-500 uppercase tracking-widest">LỌC TRẠNG THÁI:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-black border border-zinc-850 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-500 rounded-none px-3 py-1.5 uppercase tracking-widest cursor-pointer"
          >
            <option value="">TẤT CẢ ĐƠN HÀNG</option>
            <option value="Pending">PENDING</option>
            <option value="Shipped">SHIPPED</option>
            <option value="Delivered">DELIVERED</option>
            <option value="Cancelled">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders List View Table */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-500 tracking-widest">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            LOADING TRANSITIONS LOG...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center font-mono text-xs text-zinc-550">
            KHÔNG TÌM THẤY ĐƠN HÀNG NÀO
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-550 uppercase tracking-widest">
                  <th className="pb-3 font-semibold">MÃ ĐƠN</th>
                  <th className="pb-3 font-semibold">NGƯỜI MUA</th>
                  <th className="pb-3 font-semibold">GHI CHÚ</th>
                  <th className="pb-3 font-semibold">TỔNG TIỀN</th>
                  <th className="pb-3 font-semibold">NGÀY TẠO</th>
                  <th className="pb-3 font-semibold text-center">TRẠNG THÁI</th>
                  <th className="pb-3 font-semibold text-center">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* Order Code */}
                    <td className="py-3.5 text-white font-bold">#FLIGHT-{order.id}</td>
                    
                    {/* Buyer */}
                    <td className="py-3.5">
                      <p className="text-zinc-200 font-semibold uppercase">{order.user?.name || 'Vô Danh'}</p>
                      <p className="text-[9px] text-zinc-550 lowercase font-light">{order.user?.email}</p>
                    </td>

                    {/* Note */}
                    <td className="py-3.5 pr-4 max-w-[200px] truncate uppercase text-zinc-500 font-light" title={order.note}>
                      {order.note || '—'}
                    </td>

                    {/* Total Amount (Bug 1 Fix) */}
                    <td className="py-3.5 text-white font-bold">{formatCurrency(calculateOrderTotal(order))}</td>

                    {/* Date */}
                    <td className="py-3.5 text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    {/* Status selection (Bug 2 Fix) */}
                    <td className="py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-1.5">
                        {getStatusBadge(order.status)}
                        <select
                          value={normalizeStatusValue(order.status)}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="bg-black border border-zinc-900 text-[8px] text-zinc-500 focus:outline-none focus:border-zinc-700 rounded-none px-1 py-0.5 uppercase tracking-widest cursor-pointer mt-1"
                        >
                          <option value="Pending">PENDING</option>
                          <option value="Shipped">SHIPPED</option>
                          <option value="Delivered">DELIVERED</option>
                          <option value="Cancelled">CANCELLED</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleShowDetails(order.id)}
                          className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Chi tiết đơn hàng"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-red-950 text-zinc-450 hover:text-red-400 transition-colors cursor-pointer"
                          title="Hủy đơn hàng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-end font-mono text-[9px] tracking-widest text-zinc-500 pt-4 border-t border-zinc-950 gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1 border border-zinc-900 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-350 hover:text-white cursor-pointer"
            >
              PREV
            </button>
            <span className="px-2 text-white font-bold">PAGE {currentPage} OF {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1 border border-zinc-900 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-350 hover:text-white cursor-pointer"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 p-6 sm:p-8 text-white z-10 font-sans shadow-2xl flex flex-col max-h-[85vh] overflow-hidden rounded-none"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-2 text-zinc-550 hover:text-white border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title Header */}
              <div className="border-b border-zinc-900 pb-4 mb-6">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
                  ORDER ACQUISITION LOGS
                </span>
                <h3 className="font-display text-lg font-black uppercase tracking-tight mt-1">
                  CHI TIẾT ĐƠN HÀNG #FLIGHT-{selectedOrder.id}
                </h3>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                
                {/* Meta details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Customer info (Bug 3 Fix) */}
                  <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                    <h4 className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1.5 flex items-center gap-1 font-bold">
                      <User className="h-3.5 w-3.5 text-zinc-500" /> THÔNG TIN KHÁCH HÀNG
                    </h4>
                    <div className="font-mono text-[10px] text-zinc-400 space-y-2 uppercase leading-relaxed">
                      <p className="flex justify-between">
                        <span className="text-zinc-550">TÊN:</span>
                        <span className="text-white font-bold">{selectedOrder.user?.name || 'VÔ DANH'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-zinc-550">ĐIỆN THOẠI:</span>
                        <span className="text-white font-bold">{getDisplayPhone(selectedOrder)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-zinc-550">EMAIL:</span>
                        <span className="text-zinc-350 lowercase">{selectedOrder.user?.email || '—'}</span>
                      </p>
                      <p className="flex justify-between items-start gap-2 pt-1 border-t border-zinc-900/50">
                        <span className="text-zinc-550 shrink-0">ĐỊA CHỈ:</span>
                        <span className="text-white font-bold text-right break-words">{selectedOrder.address || 'CHƯA CUNG CẤP'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Shipping status */}
                  <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                    <h4 className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1.5 flex items-center gap-1 font-bold">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" /> TRẠNG THÁI GIAO HÀNG
                    </h4>
                    <div className="font-mono text-[10px] text-zinc-400 space-y-2 uppercase leading-relaxed">
                      <p className="flex justify-between items-center">
                        <span className="text-zinc-550">TRẠNG THÁI:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </p>
                      <p className="flex justify-between">
                        <span className="text-zinc-550">NGÀY TẠO:</span>
                        <span className="text-zinc-350">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <span className="text-zinc-550 text-[9px]">CẬP NHẬT:</span>
                        <select
                          value={normalizeStatusValue(selectedOrder.status)}
                          onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                          className="bg-black border border-zinc-800 text-[8px] text-zinc-300 focus:outline-none rounded-none px-1.5 py-0.5 uppercase tracking-widest cursor-pointer"
                        >
                          <option value="Pending">PENDING</option>
                          <option value="Shipped">SHIPPED</option>
                          <option value="Delivered">DELIVERED</option>
                          <option value="Cancelled">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Notes */}
                <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-2">
                  <h4 className="font-mono text-[9px] text-zinc-450 uppercase tracking-widest border-b border-zinc-900 pb-1 font-bold">
                    GHI CHÚ TỪ KHÁCH HÀNG
                  </h4>
                  <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider leading-relaxed">
                    {selectedOrder.note || 'KHÔNG CÓ GHI CHÚ ĐẶC BIỆT TỪ KHÁCH HÀNG CHO ĐƠN HÀNG NÀY.'}
                  </p>
                </div>

                {/* Products list */}
                <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                  <h4 className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1.5 font-bold">
                    DANH SÁCH SẢN PHẨM ĐÃ MUA
                  </h4>
                  
                  <div className="space-y-3 divide-y divide-zinc-950">
                    {selectedOrder.order_details?.map((item) => {
                      const variantDetailsStr = item.product_variant?.details
                        ?.map(d => `${d.attribute_name}: ${d.attribute_value}`)
                        .join(' | ') || 'N/A';
                      
                      const itemImg = item.product_variant?.image || item.product?.image;

                      return (
                        <div key={item.id} className="flex gap-4 items-center pt-3 first:pt-0">
                          {/* Thumbnail */}
                          <div className="h-12 w-12 border border-zinc-900 bg-zinc-950 flex items-center justify-center p-1 flex-shrink-0">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={item.product?.name}
                                className="h-full w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="font-mono text-[8px] text-zinc-600">NO IMG</div>
                            )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 flex justify-between items-center text-xs">
                            <div className="truncate max-w-[280px]">
                              <h4 className="font-display font-bold text-white uppercase tracking-wide truncate">{item.product?.name}</h4>
                              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                                {variantDetailsStr} | QTY: {item.quantity}
                              </p>
                            </div>
                            
                            <div className="text-right font-mono text-zinc-350">
                              <p className="font-semibold">{((item.price || 0) * (item.quantity || 1) * 25000).toLocaleString('vi-VN')} ₫</p>
                              <p className="text-[8px] text-zinc-600">{((item.price || 0) * 25000).toLocaleString('vi-VN')} ₫ / ĐÔI</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Total Summary Footer (Bug 1 Fix) */}
              <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-between items-baseline font-mono text-xs text-zinc-400">
                <span className="uppercase tracking-widest">TỔNG GIÁ TRỊ THANH TOÁN:</span>
                <span className="text-lg text-white font-bold tracking-wider">{formatCurrency(calculateOrderTotal(selectedOrder))}</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
