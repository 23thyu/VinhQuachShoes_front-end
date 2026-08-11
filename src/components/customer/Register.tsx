/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Eye, EyeOff, User, Mail, Phone, Lock, UploadCloud, Loader2, ArrowRight } from 'lucide-react';

interface RegisterProps {
  onToggleView: () => void;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const Register: React.FC<RegisterProps> = ({ onToggleView }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Avatar upload states
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Strictly validate exactly 10 digits phone number
  const validatePhone = (number: string) => {
    return /^[0-9]{10}$/.test(number);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingAvatar(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('images', file);

      try {
        const response = await fetch(`${API_BASE_URL}/media/upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          // Extract the first uploaded image url
          if (result.data && result.data[0]) {
            setAvatarUrl(result.data[0].url);
          }
        } else {
          setErrorMsg('Không thể tải ảnh đại diện lên Cloudinary.');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        setErrorMsg('Lỗi khi tải ảnh đại diện lên.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const missingFields: string[] = [];
    if (!name.trim()) missingFields.push('Họ và tên');
    if (!email.trim()) missingFields.push('Email');
    if (!phone.trim()) missingFields.push('Số điện thoại');
    if (!password) missingFields.push('Mật khẩu');

    if (missingFields.length > 0) {
      return setErrorMsg(`VUI LÒNG NHẬP ĐẦY ĐỦ CÁC TRƯỜNG: ${missingFields.join(', ').toUpperCase()}.`);
    }

    if (!validatePhone(phone.trim())) {
      return setErrorMsg('SỐ ĐIỆN THOẠI KHÔNG HỢP LỆ. PHẢI BAO GỒM ĐÚNG 10 CHỮ SỐ.');
    }
    
    if (password.length <= 6) return setErrorMsg('MẬT KHẨU PHẢI TRÊN 6 KÝ TỰ.');
    if (!/[a-zA-Z]/.test(password)) return setErrorMsg('MẬT KHẨU PHẢI CHỨA CHỮ CÁI.');

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      avatar: avatarUrl || ""
    };

    try {
      const response = await fetch(`${API_BASE_URL}/register-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMsg('ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG! ĐANG CHUYỂN HƯỚNG...');
        setTimeout(() => {
          onToggleView();
        }, 2000);
      } else {
        const errorDetail = result.error || result.message || 'LỖI KHI ĐĂNG KÝ TÀI KHOẢN.';
        setErrorMsg(errorDetail);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg('LỖI KẾT NỐI MÁY CHỦ. VUI LÒNG THỬ LẠI SAU.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white text-black border-[3px] border-black p-8 font-sans shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
      
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h2 className="font-display text-3xl font-black uppercase tracking-tight text-black">
          ĐĂNG KÝ
        </h2>
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider leading-relaxed">
          Hãy tham gia cùng chúng tôi! Tạo tài khoản bằng,
        </p>
      </div>

      {/* Social Auth */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          className="flex items-center justify-center gap-2 border-[2px] border-black py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-150 cursor-pointer rounded-none"
        >
          <span className="font-bold text-sm">G</span> GOOGLE
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 border-[2px] border-black py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-150 cursor-pointer rounded-none"
        >
          <span className="font-bold text-sm"></span> APPLE
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black"></div>
        </div>
        <span className="relative bg-white px-3 font-mono text-[9px] text-zinc-550 uppercase tracking-widest">
          hoặc Đăng ký bằng
        </span>
      </div>

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="border-2 border-red-500 bg-red-50 p-3 mb-5 font-mono text-[10px] text-red-650 uppercase tracking-wider">
          CẢNH BÁO: {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="border-2 border-emerald-500 bg-emerald-50 p-3 mb-5 font-mono text-[10px] text-emerald-650 uppercase tracking-wider">
          THÀNH CÔNG: {successMsg}
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Circular Avatar Upload Area */}
        <div className="flex flex-col items-center justify-center mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            className="h-20 w-20 rounded-full border-2 border-dashed border-black bg-zinc-50 flex items-center justify-center overflow-hidden hover:bg-zinc-100 transition-colors cursor-pointer group relative p-0.5"
            title="Tải ảnh đại diện lên"
          >
            {uploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="h-full w-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-black">
                <UploadCloud className="h-5 w-5" />
                <span className="font-mono text-[7px] uppercase mt-0.5 tracking-wider font-bold">AVATAR</span>
              </div>
            )}
          </button>
          <span className="font-mono text-[8px] uppercase text-zinc-500 mt-1.5 tracking-widest">
            {avatarUrl ? 'ĐÃ TẢI ẢNH ĐẠI DIỆN' : 'TẢI LÊN ẢNH ĐẠI DIỆN (TÙY CHỌN)'}
          </span>
        </div>

        {/* Full name field */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-black uppercase tracking-wider">
            Họ và tên của bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HOÀNG THỊ THU HÀ"
              className="w-full bg-zinc-50 border-[2px] border-black p-2.5 pl-10 text-xs font-mono text-black uppercase focus:outline-none focus:bg-white placeholder-zinc-450 focus:border-black rounded-none"
            />
          </div>
        </div>

        {/* Email field */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-black uppercase tracking-wider">
            Email của bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL@EXAMPLE.COM"
              className="w-full bg-zinc-50 border-[2px] border-black p-2.5 pl-10 text-xs font-mono text-black lowercase focus:outline-none focus:bg-white placeholder-zinc-450 focus:border-black rounded-none"
            />
          </div>
        </div>

        {/* Phone field */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-black uppercase tracking-wider">
            Số điện thoại của bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="E.G. 0912345678"
              className="w-full bg-zinc-50 border-[2px] border-black p-2.5 pl-10 text-xs font-mono text-black focus:outline-none focus:bg-white placeholder-zinc-450 focus:border-black rounded-none"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-black uppercase tracking-wider">
            Mật khẩu của bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="TRÊN 6 KÝ TỰ VÀ CÓ CHỮ CÁI"
              className="w-full bg-zinc-50 border-[2px] border-black p-2.5 pl-10 pr-10 text-xs font-mono text-black focus:outline-none focus:bg-white placeholder-zinc-450 focus:border-black rounded-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-black cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading || uploadingAvatar}
          className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-black text-white py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-black transition-all duration-150 cursor-pointer rounded-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ĐANG ĐĂNG KÝ...
            </>
          ) : (
            <>
              ĐĂNG KÝ
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-zinc-200 pt-5 mt-6 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-550">
        Đã có tài khoản?{' '}
        <button
          onClick={onToggleView}
          className="text-black font-black hover:underline cursor-pointer bg-transparent border-none p-0 inline"
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
};
export default Register;
