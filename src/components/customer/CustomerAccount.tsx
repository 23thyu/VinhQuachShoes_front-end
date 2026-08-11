/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, Box, MapPin, ClipboardList, CheckCircle, Clock, Truck, ShieldX, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Login } from './Login';
import { Register } from './Register';
import { HydratedOrder } from '../../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const CustomerAccount: React.FC = () => {
  const { toast } = useToast();
  const {
    currentUser,
    setCurrentUser,
    getHydratedOrders,
    updateOrderStatus,
    fetchUserOrders
  } = useApp();

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders();
    }
  }, []);

  const [selectedOrder, setSelectedOrder] = useState<HydratedOrder | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || ''
  });

  // State for Provinces API
  const [changeAddress, setChangeAddress] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [provinceCode, setProvinceCode] = useState<string>('');
  const [districtCode, setDistrictCode] = useState<string>('');
  const [wardCode, setWardCode] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || ''
      });
    }
  }, [currentUser]);

  // Reset address form when editing state changes
  useEffect(() => {
    if (!editingProfile) {
      setChangeAddress(false);
      setProvinceCode('');
      setDistrictCode('');
      setWardCode('');
      setDetailAddress('');
      setDistricts([]);
      setWards([]);
    }
  }, [editingProfile]);

  // useEffect 1: Fetch all Provinces on component mount
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch provinces');
        return res.json();
      })
      .then(data => setProvinces(data))
      .catch(err => console.error('Error fetching provinces:', err));
  }, []);

  // useEffect 2: When provinceCode changes -> fetch Districts for that province. Reset districtCode and wardCode to empty.
  useEffect(() => {
    if (provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch districts');
          return res.json();
        })
        .then(data => setDistricts(data.districts || []))
        .catch(err => console.error('Error fetching districts:', err));
    } else {
      setDistricts([]);
    }
    setDistrictCode('');
    setWardCode('');
  }, [provinceCode]);

  // useEffect 3: When districtCode changes -> fetch Wards for that district. Reset wardCode to empty.
  useEffect(() => {
    if (districtCode) {
      fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch wards');
          return res.json();
        })
        .then(data => setWards(data.wards || []))
        .catch(err => console.error('Error fetching wards:', err));
    } else {
      setWards([]);
    }
    setWardCode('');
  }, [districtCode]);

  const allOrders = getHydratedOrders();
  // Filter orders matching the logged in user
  const userOrders = allOrders.filter(o => o.userId === currentUser?.id);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      let finalAddress = currentUser.address || '';
      let finalCity = currentUser.city || '';

      if (changeAddress) {
        const provinceObj = provinces.find(p => String(p.code) === String(provinceCode));
        const districtObj = districts.find(d => String(d.code) === String(districtCode));
        const wardObj = wards.find(w => String(w.code) === String(wardCode));

        if (!provinceObj || !districtObj || !wardObj || !detailAddress.trim()) {
          toast.warning('VUI LÒNG CHỌN ĐẦY ĐỦ THÔNG TIN ĐỊA CHỈ');
          return;
        }

        // Concatenate the full address string: [Số nhà/Đường], [Phường/Xã], [Quận/Huyện], [Tỉnh/Thành phố]
        finalAddress = `${detailAddress.trim()}, ${wardObj.name}, ${districtObj.name}, ${provinceObj.name}`;
        finalCity = provinceObj.name;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: profileForm.name,
            phone: profileForm.phone,
            address: finalAddress,
            city: finalCity
          })
        });

        if (!response.ok) {
          const err = await response.json();
          toast.error(err.message || 'LỖI KHI CẬP NHẬT THÔNG TIN TÀI KHOẢN');
          return;
        }

        const result = await response.json();
        const updatedUserFromAPI = result.data;

        const updatedUser = {
          ...currentUser,
          name: updatedUserFromAPI.name || profileForm.name,
          phone: updatedUserFromAPI.phone || profileForm.phone,
          address: updatedUserFromAPI.address || finalAddress,
          city: updatedUserFromAPI.city || finalCity,
          avatar: updatedUserFromAPI.avatar || currentUser.avatar,
          postalCode: '',
          country: ''
        };

        setCurrentUser(updatedUser);

        // Update local storage
        localStorage.setItem('jordan_current_user', JSON.stringify(updatedUser));
        const savedUsers = localStorage.getItem('jordan_users');
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            const updated = parsed.map((u: any) => u.id === currentUser.id ? updatedUser : u);
            localStorage.setItem('jordan_users', JSON.stringify(updated));
          } catch (err) {
            console.error('Error updating saved users:', err);
          }
        }

        setEditingProfile(false);
        toast.success('ĐÃ CẬP NHẬT THÔNG TIN TÀI KHOẢN THÀNH CÔNG');
      } catch (error) {
        console.error('Profile save error:', error);
        toast.error('LỖI KẾT NỐI VỚI HỆ THỐNG');
      }
    }
  };

  const getStatusBadge = (status: string | number) => {
    const s = String(status).toLowerCase();
    if (s === 'delivered' || s === '4') {
      return (
        <span className="inline-flex items-center gap-1 border border-emerald-900 bg-emerald-950/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
          <CheckCircle className="h-3 w-3" /> ĐÃ GIAO
        </span>
      );
    } else if (s === 'shipped' || s === 'shipping' || s === 'processing' || s === '3' || s === '2') {
      return (
        <span className="inline-flex items-center gap-1 border border-blue-900 bg-blue-950/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">
          <Truck className="h-3 w-3 animate-pulse" /> ĐANG VẬN CHUYỂN
        </span>
      );
    } else if (s === 'cancelled' || s === 'failed' || s === '5' || s === '7') {
      return (
        <span className="inline-flex items-center gap-1 border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-zinc-550 uppercase">
          <ShieldX className="h-3 w-3" /> ĐÃ HỦY
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 border border-amber-900 bg-amber-950/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase">
          <Clock className="h-3 w-3" /> ĐANG CHỜ XỬ LÝ
        </span>
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 bg-black text-white min-h-[80vh] flex flex-col items-center justify-center">
        {authView === 'login' ? (
          <Login onToggleView={() => setAuthView('register')} />
        ) : (
          <Register onToggleView={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-black text-white font-sans min-h-[70vh]">
      
      {/* Visual Header */}
      <div className="border-b border-zinc-900 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> THÔNG TIN KHÁCH HÀNG
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
            HỒ SƠ TÀI KHOẢN
          </h2>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('jordan_token');
            sessionStorage.removeItem('jordan_token');
            setCurrentUser(null);
          }}
          className="border border-red-500/50 hover:border-red-500 bg-red-950/10 text-red-450 hover:text-red-300 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer"
        >
          ĐĂNG XUẤT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Profile & Ingress Details */}
        <div className="col-span-1 border border-zinc-850 p-6 bg-zinc-950 space-y-6 self-start">
          <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
              alt={currentUser?.name}
              className="h-14 w-14 border border-zinc-800 object-cover"
            />
            <div className="truncate">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">{currentUser?.name}</h3>
              <p className="font-mono text-[10px] text-zinc-550 truncate lowercase font-light">{currentUser?.email}</p>
              <span className="inline-block mt-1 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[8px] font-mono tracking-widest uppercase font-semibold text-zinc-400">
                VAI TRÒ TRUY CẬP: {currentUser?.role}
              </span>
            </div>
          </div>

          {!editingProfile ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> THÔNG TIN TÀI KHOẢN
                </h4>
                <div className="bg-zinc-950 p-3 border border-zinc-900 font-mono text-[11px] uppercase tracking-widest text-zinc-450 space-y-1.5 leading-relaxed">
                  <p className="text-white font-medium">{currentUser?.name}</p>
                  <p className="lowercase text-zinc-500">{currentUser?.email}</p>
                  <p>{currentUser?.phone || 'CHƯA CÓ SỐ ĐIỆN THOẠI'}</p>
                  <p>{currentUser?.address || 'CHƯA CÓ ĐỊA CHỈ'}</p>
                  <p>{currentUser?.city || 'CHƯA CÓ THÀNH PHỐ'}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileForm({
                    name: currentUser?.name || '',
                    email: currentUser?.email || '',
                    phone: currentUser?.phone || '',
                    address: currentUser?.address || '',
                    city: currentUser?.city || ''
                  });
                  setEditingProfile(true);
                }}
                className="w-full border border-zinc-800 hover:border-white p-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer text-zinc-350 hover:text-white"
                id="edit-profile-btn"
              >
                CẬP NHẬT THÔNG TIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-3.5">
              <h4 className="font-mono text-xs tracking-widest text-zinc-400 uppercase border-b border-zinc-800 pb-1.5 font-bold">
                CẬP NHẬT THÔNG TIN
              </h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">EMAIL (KHÔNG THỂ THAY ĐỔI)</label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full bg-black text-zinc-500 border border-zinc-900 p-1.5 font-mono text-xs cursor-not-allowed focus:outline-none rounded-none lowercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none uppercase"
                  />
                </div>
                
                {/* Current address block */}
                <div className="space-y-1 bg-black p-2.5 border border-zinc-800 font-mono text-[10px]">
                  <span className="block text-zinc-500 uppercase tracking-widest">ĐỊA CHỈ HIỆN TẠI</span>
                  <p className="text-white leading-relaxed uppercase">
                    {currentUser?.address ? `${currentUser.address}` : 'CHƯA CÓ THÔNG TIN ĐỊA CHỈ'}
                  </p>
                </div>

                {/* Button to change address */}
                <div className="py-1.5 border-t border-zinc-800 mt-1">
                  {!changeAddress ? (
                    <button
                      type="button"
                      onClick={() => setChangeAddress(true)}
                      className="w-full border border-zinc-800 hover:border-white p-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer text-zinc-350 hover:text-white bg-black"
                    >
                      THAY ĐỔI ĐỊA CHỈ NHẬN HÀNG
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setChangeAddress(false);
                        setProvinceCode('');
                        setDistrictCode('');
                        setWardCode('');
                        setDetailAddress('');
                        setDistricts([]);
                        setWards([]);
                      }}
                      className="w-full border border-red-900 bg-red-950/15 text-red-450 p-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer hover:bg-red-950/30"
                    >
                      HỦY ĐỔI ĐỊA CHỈ (GIỮ ĐỊA CHỈ CŨ)
                    </button>
                  )}
                </div>

                {/* Provinces API fields */}
                {changeAddress && (
                  <div className="space-y-3 border-l border-zinc-800 pl-3 mt-1.5">
                    {/* Province Select */}
                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">TỈNH / THÀNH PHỐ</label>
                      <div className="relative">
                        <select
                          required
                          value={provinceCode}
                          onChange={(e) => setProvinceCode(e.target.value)}
                          className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-black text-white">-- CHỌN TỈNH / THÀNH PHỐ --</option>
                          {provinces.map(p => (
                            <option key={p.code} value={p.code} className="bg-black text-white">{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* District Select */}
                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">QUẬN / HUYỆN</label>
                      <div className="relative">
                        <select
                          required
                          disabled={!provinceCode}
                          value={districtCode}
                          onChange={(e) => setDistrictCode(e.target.value)}
                          className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <option value="" className="bg-black text-white">-- CHỌN QUẬN / HUYỆN --</option>
                          {districts.map(d => (
                            <option key={d.code} value={d.code} className="bg-black text-white">{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Ward Select */}
                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">PHƯỜNG / XÃ</label>
                      <div className="relative">
                        <select
                          required
                          disabled={!districtCode}
                          value={wardCode}
                          onChange={(e) => setWardCode(e.target.value)}
                          className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <option value="" className="bg-black text-white">-- CHỌN PHƯỜNG / XÃ --</option>
                          {wards.map(w => (
                            <option key={w.code} value={w.code} className="bg-black text-white">{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Detail Address */}
                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">SỐ NHÀ, TÊN ĐƯỜNG</label>
                      <input
                        type="text"
                        required
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        placeholder="VÍ DỤ: SỐ 12 NGÕ 34 PHỐ NGUYỄN TRÃI"
                        className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3.5 mt-2 border-t border-zinc-900">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black py-1.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-black hover:text-white border border-white transition-colors cursor-pointer rounded-none"
                >
                  LƯU THAY ĐỔI
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 bg-transparent border border-zinc-800 text-zinc-500 py-1.5 font-mono text-[10px] tracking-widest uppercase hover:text-white hover:border-white transition-colors cursor-pointer rounded-none"
                >
                  HỦY
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Columns: Historic Order Logs */}
        <div className="col-span-1 lg:col-span-2 border border-zinc-850 p-6 bg-zinc-950 space-y-6">
          <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-450 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-zinc-500" /> LỊCH SỬ ĐƠN HÀNG
            </h3>
            <span className="font-mono text-[10px] text-zinc-550">TỔNG SỐ ĐƠN: {userOrders.length}</span>
          </div>

          {userOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 font-mono text-xs">
              <Box className="h-10 w-10 text-zinc-800 stroke-[1]" />
              <p className="text-zinc-500 uppercase tracking-widest">KHÔNG CÓ LỊCH SỬ GIAO DỊCH</p>
              <p className="text-zinc-600 lowercase font-light max-w-sm">bạn chưa thực hiện bất kỳ giao dịch nào dưới tài khoản này.</p>
            </div>
          ) : selectedOrder ? (
            /* Module 3: Digital Receipt View */
            <div className="space-y-6 font-mono text-xs uppercase tracking-wider">
              {/* Back Button */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="border border-zinc-800 hover:border-white px-3 py-1.5 font-bold hover:text-white transition-all cursor-pointer text-zinc-400 rounded-none text-[10px]"
                >
                  ← QUAY LẠI LỊCH SỬ
                </button>
                <span className="text-zinc-500 text-[10px]">BIÊN LAI ĐIỆN TỬ</span>
              </div>

              {/* Brutalist Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 border border-zinc-800 bg-black">
                {/* Left Side: Order Meta Details */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-zinc-800 space-y-4">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[9px]">MÃ ĐƠN HÀNG</p>
                    <p className="text-white font-bold text-sm tracking-widest">#{selectedOrder.id.replace('ord_', 'FLIGHT-')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[9px]">NGÀY ĐẶT HÀNG</p>
                    <p className="text-white">
                      {new Date(selectedOrder.orderDate).toLocaleDateString()} {new Date(selectedOrder.orderDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[9px]">TRẠNG THÁI GIAO DỊCH</p>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-zinc-900">
                    <p className="text-zinc-500 text-[9px]">ĐỊA CHỈ NHẬN HÀNG</p>
                    <p className="text-white font-medium text-[10px]">{selectedOrder.shippingName}</p>
                    <p className="text-zinc-400 leading-relaxed text-[10px]">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>

                {/* Right Side: Product Details & Sums */}
                <div className="p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-zinc-500 text-[9px]">CHI TIẾT SẢN PHẨM</p>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                      {selectedOrder.items.map((item) => {
                        const itemImg = item.variant?.image || item.product?.image;

                        return (
                          <div key={item.id} className="flex gap-3 justify-between items-center border-b border-zinc-900 pb-3 last:border-0 last:pb-0">
                            {/* Product Image Thumbnail */}
                            <div className="h-14 w-14 border border-zinc-800 bg-zinc-950 flex items-center justify-center p-1 shrink-0">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt={item.product?.name || 'Sản phẩm'}
                                  className="h-full w-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="font-mono text-[8px] text-zinc-600">NO IMG</div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className="text-white font-bold text-xs truncate">{item.product?.name || 'Sản phẩm'}</p>
                              <p className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                                SIZE: US {item.variant?.size || 'N/A'} × {item.quantity}
                              </p>
                            </div>

                            {/* Price */}
                            <span className="text-white text-right flex-shrink-0 font-mono text-xs font-bold">
                              {(item.price * item.quantity * 25000).toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="border-t border-zinc-800 pt-4 space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between text-zinc-500">
                      <span>PHÍ GIAO HÀNG</span>
                      <span>MIỄN PHÍ</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>THUẾ VAT (0%)</span>
                      <span>0 ₫</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-xs pt-2 border-t border-zinc-900">
                      <span>TỔNG CỘNG</span>
                      <span>{(selectedOrder.totalAmount * 25000).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Minimalist Order History List */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-[9px] uppercase tracking-widest">
                    <th className="pb-3">MÃ ĐƠN</th>
                    <th className="pb-3">NGÀY ĐẶT</th>
                    <th className="pb-3">TRẠNG THÁI</th>
                    <th className="pb-3 text-right">TỔNG TIỀN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {userOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 text-white font-bold group-hover:underline">
                        #{order.id.replace('ord_', 'FLIGHT-')}
                      </td>
                      <td className="py-4 text-zinc-400">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 font-bold">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 text-right text-zinc-300 font-bold">
                        {(order.totalAmount * 25000).toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
