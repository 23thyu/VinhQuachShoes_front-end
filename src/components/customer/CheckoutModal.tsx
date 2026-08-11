/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuestGateway } from './GuestGateway';

interface CheckoutModalProps {
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  const location = useLocation();
  const { currentUser, getHydratedCart, checkout } = useApp();

  const directItem = location.state?.directItem || null;
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    postalCode: '',
    country: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State for Provinces API
  const [changeAddress, setChangeAddress] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [provinceCode, setProvinceCode] = useState<string>('');
  const [districtCode, setDistrictCode] = useState<string>('');
  const [wardCode, setWardCode] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');

  const cartItems = getHydratedCart();
  
  const subtotal = directItem 
    ? (directItem.price * directItem.quantity)
    : cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const displayItems = directItem ? [
    {
      id: 'direct_item',
      name: directItem.product.name,
      size: directItem.variant?.size || directItem.selectedSize || 'Default',
      quantity: directItem.quantity,
      price: directItem.price,
    }
  ] : cartItems.map(item => ({
    id: item.id,
    name: item.product.name,
    size: item.variant.size,
    quantity: item.quantity,
    price: item.product.price,
  }));

  // Autofill shipping info if currentUser changes or is available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        address: currentUser.address || '',
        city: currentUser.city || '',
        phone: currentUser.phone || '',
        postalCode: '',
        country: ''
      });
    }
  }, [currentUser]);

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

  // Reset address form when changeAddress state changes
  useEffect(() => {
    if (!changeAddress) {
      setProvinceCode('');
      setDistrictCode('');
      setWardCode('');
      setDetailAddress('');
      setDistricts([]);
      setWards([]);
    }
  }, [changeAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directItem && cartItems.length === 0) return;

    setErrorMsg('');
    
    let finalAddress = formData.address;
    let finalCity = formData.city;

    if (changeAddress) {
      const provinceObj = provinces.find(p => String(p.code) === String(provinceCode));
      const districtObj = districts.find(d => String(d.code) === String(districtCode));
      const wardObj = wards.find(w => String(w.code) === String(wardCode));

      if (!provinceObj || !districtObj || !wardObj || !detailAddress.trim()) {
        setErrorMsg('VUI LÒNG CHỌN ĐẦY ĐỦ THÔNG TIN ĐỊA CHỈ KHÁC.');
        return;
      }

      // Concatenate the full address string: [Số nhà/Đường], [Phường/Xã], [Quận/Huyện], [Tỉnh/Thành phố]
      finalAddress = `${detailAddress.trim()}, ${wardObj.name}, ${districtObj.name}, ${provinceObj.name}`;
      finalCity = provinceObj.name;
    }

    if (!finalAddress.trim()) {
      setErrorMsg('VUI LÒNG NHẬP ĐỊA CHỈ GIAO HÀNG.');
      return;
    }

    setIsSubmitting(true);

    // Simulate cryptographic authorization / card swipe delay (1.2 seconds)
    setTimeout(async () => {
      try {
        const success = await checkout({
          name: formData.name,
          address: finalAddress,
          city: finalCity,
          phone: formData.phone,
          postalCode: '',
          country: ''
        }, directItem);

        setIsSubmitting(false);

        if (success) {
          setIsSuccess(true);
        } else {
          setErrorMsg('GIAO DỊCH THẤT BẠI: SẢN PHẨM HIỆN ĐÃ HẾT HÀNG HOẶC CÓ LỖI XỬ LÝ.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMsg('LỖI HỆ THỐNG TRONG KHI XỬ LÝ THANH TOÁN.');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
      {/* Background click to dismiss (disabled during transaction) */}
      {!isSubmitting && !isSuccess && <div className="absolute inset-0" onClick={onClose} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-850 p-6 sm:p-8 text-white z-10 font-sans shadow-2xl overflow-hidden"
        id="checkout-modal-container"
      >
        {/* Close trigger */}
        {!isSubmitting && !isSuccess && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-zinc-800"
            id="checkout-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {!currentUser ? (
          <GuestGateway onActionComplete={onClose} />
        ) : (
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="checkout-form"
                initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-555 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> CỔNG THANH TOÁN BẢO MẬT
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
                  GIAO DỊCH
                </h3>
              </div>

              {/* Error box */}
              {errorMsg && (
                <div className="border border-red-900 bg-red-950/20 p-3 text-red-400 font-mono text-[11px] uppercase tracking-wider leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {/* Grid content */}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Shipping Form Inputs */}
                <div className="space-y-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-900 pb-2">
                    I. THÔNG TIN GIAO HÀNG
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">TÊN NGƯỜI NHẬN</label>
                      <input
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-mono text-xs tracking-widest text-zinc-400 uppercase">SỐ ĐIỆN THOẠI</label>
                      <input
                        type="text"
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-black text-white border border-zinc-800 p-1.5 font-mono text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none uppercase"
                      />
                    </div>
 
                    {/* Current Address display block */}
                    <div className="space-y-1 bg-black p-2.5 border border-zinc-800 font-mono text-[10px]">
                      <span className="block text-zinc-500 uppercase tracking-widest">ĐỊA CHỈ GIAO HÀNG HIỆN TẠI</span>
                      <p className="text-white leading-relaxed uppercase">
                        {currentUser?.address ? `${currentUser.address}` : 'CHƯA CÓ ĐỊA CHỈ ĐƯỢC THIẾT LẬP'}
                      </p>
                    </div>

                    {/* Button to use another address */}
                    <div className="py-1.5 border-t border-zinc-800 mt-1">
                      {!changeAddress ? (
                        <button
                          type="button"
                          onClick={() => setChangeAddress(true)}
                          className="w-full border border-zinc-800 hover:border-white p-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer text-zinc-350 hover:text-white bg-black"
                        >
                          SỬ DỤNG ĐỊA CHỈ KHÁC
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChangeAddress(false)}
                          className="w-full border border-red-900 bg-red-950/15 text-red-450 p-2 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none cursor-pointer hover:bg-red-950/30"
                        >
                          HỦY SỬ DỤNG ĐỊA CHỈ KHÁC (GIỮ ĐỊA CHỈ CŨ)
                        </button>
                      )}
                    </div>

                    {/* Provinces API fields */}
                    {changeAddress && (
                      <div className="space-y-3 border-l border-zinc-800 pl-3 mt-1.5 font-sans">
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
                </div>

                {/* Bag & Payment Summary */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-900 pb-2 flex justify-between items-center">
                      <span>II. THÔNG TIN ĐƠN HÀNG</span>
                      {directItem && (
                        <span className="text-[8px] bg-white text-black px-1.5 py-0.5 font-bold tracking-widest uppercase">MUA NGAY (TRỰC TIẾP)</span>
                      )}
                    </h4>
                    
                    {/* Cart / Direct Items List */}
                    <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-2">
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs font-mono border-b border-zinc-900 pb-2">
                          <div className="truncate max-w-[140px] uppercase">
                            <span className="text-white font-medium">{item.name.replace('Air Jordan ', 'AJ ')}</span>
                            <span className="block text-[8px] text-zinc-550">SIZE {item.size} × {item.quantity}</span>
                          </div>
                          <span className="text-zinc-300 font-bold">{(item.price * item.quantity * 25000).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between font-mono text-xs pt-2 border-t border-zinc-900 text-zinc-400">
                      <span>TỔNG CỘNG:</span>
                      <span className="text-white text-sm font-bold">{(subtotal * 25000).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  {/* Payment Disclaimer & Submit */}
                  <div className="space-y-3 pt-4 md:pt-0">
                    <div className="p-3 border border-zinc-900 bg-zinc-950/40 text-[9px] font-mono tracking-widest text-zinc-555 flex items-start gap-2 uppercase">
                      <CreditCard className="h-4.5 w-4.5 text-zinc-500 flex-shrink-0" />
                      <span>KÊNH THANH TOÁN ĐÃ ĐƯỢC XÁC THỰC BẢO MẬT. GIAO DỊCH ĐANG ĐƯỢC XỬ LÝ.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || displayItems.length === 0}
                      className="w-full flex items-center justify-center gap-2 border border-white bg-white text-black py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition-all rounded-none cursor-pointer"
                      id="checkout-confirm-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          ĐANG XỬ LÝ GIAO DỊCH...
                        </>
                      ) : (
                        `XÁC NHẬN THANH TOÁN (${(subtotal * 25000).toLocaleString('vi-VN')} ₫)`
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center p-6 space-y-4"
            >
              <CheckCircle className="h-16 w-16 text-white stroke-[1]" />
              
              <div className="space-y-1">
                <span className="font-mono text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 uppercase tracking-widest">THANH TOÁN THÀNH CÔNG</span>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  ĐƠN HÀNG ĐÃ ĐƯỢC GHI NHẬN
                </h3>
              </div>

              <div className="border border-zinc-850 p-4 w-full max-w-sm font-mono text-[10px] tracking-widest text-zinc-500 text-left space-y-2 uppercase bg-zinc-950">
                <p className="border-b border-zinc-900 pb-1.5 flex justify-between">
                  <span>MÃ ĐƠN HÀNG</span>
                  <span className="text-white font-bold">#FLIGHT-{Math.floor(Math.random() * 900000) + 100000}</span>
                </p>
                <p className="border-b border-zinc-900 pb-1.5 flex justify-between">
                  <span>NGƯỜI NHẬN</span>
                  <span className="text-white font-medium truncate max-w-[150px]">{formData.name}</span>
                </p>
                <p className="border-b border-zinc-900 pb-1.5 flex justify-between">
                  <span>ĐỊA CHỈ GIAO HÀNG</span>
                  <span className="text-white font-medium truncate max-w-[180px]" title={changeAddress ? `${detailAddress}` : formData.address}>
                    {changeAddress 
                      ? `${detailAddress}` 
                      : formData.address}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>TỔNG THANH TOÁN</span>
                  <span className="text-white font-bold">{(subtotal * 25000).toLocaleString('vi-VN')} ₫</span>
                </p>
              </div>

              <p className="font-sans text-[11px] text-zinc-450 leading-relaxed max-w-sm font-light">
                Đơn hàng của bạn đang được xử lý qua hệ thống vận hành. Bạn có thể theo dõi mã đơn hàng này trong lịch sử tài khoản cá nhân.
              </p>

              <button
                onClick={onClose}
                className="border border-white bg-white text-black px-8 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-850 transition-all rounded-none cursor-pointer"
                id="success-continue-btn"
              >
                XEM LỊCH SỬ ĐƠN HÀNG
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
