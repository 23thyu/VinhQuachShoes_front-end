/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onToggleView: () => void;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const Login: React.FC<LoginProps> = ({ onToggleView }) => {
  const { setCurrentUser } = useApp();
  const { toast } = useToast();
  
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const missingFields: string[] = [];
    if (!emailOrPhone.trim()) missingFields.push('Email hoặc Số điện thoại');
    if (!password) missingFields.push('Mật khẩu');

    if (missingFields.length > 0) {
      return setErrorMsg(`VUI LÒNG NHẬP ĐẦY ĐỦ CÁC TRƯỜNG: ${missingFields.join(', ').toUpperCase()}.`);
    }

    setLoading(true);

    // Backend expects { email, password } OR { phone, password }
    const isEmail = emailOrPhone.includes('@');
    const payload = isEmail 
      ? { email: emailOrPhone.trim(), password }
      : { phone: emailOrPhone.trim(), password };

    try {
      const response = await fetch(`${API_BASE_URL}/login-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        const { token, user } = result.data;
        
        // Save token securely
        if (rememberMe) {
          localStorage.setItem('jordan_token', token);
        } else {
          sessionStorage.setItem('jordan_token', token);
        }
        
        // Set currentUser in global context
        // Ensure user object maps to User type
        const resolvedUser = {
          id: String(user.id),
          email: user.email,
          name: user.name,
          address: user.address || '',
          city: user.city || '',
          postalCode: user.postalCode || '',
          country: user.country || '',
          avatar: user.avatar || '',
          role: user.role === 2 ? 'Admin' : 'User'
        };
        
        setCurrentUser(resolvedUser);
      } else {
        const errorDetail = result.error || result.message || 'TÀI KHOẢN HOẶC MẬT KHẨU KHÔNG CHÍNH XÁC.';
        setErrorMsg(errorDetail);
      }
    } catch (error) {
      console.error('Login error:', error);
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
          ĐĂNG NHẬP
        </h2>
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider leading-relaxed">
          Chào mừng bạn quay trở lại! Hãy tiếp tục với,
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
        <span className="relative bg-white px-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
          hoặc Đăng nhập bằng
        </span>
      </div>

      {/* Form error */}
      {errorMsg && (
        <div className="border-2 border-red-500 bg-red-50 p-3 mb-5 font-mono text-[10px] text-red-650 uppercase tracking-wider">
          CẢNH BÁO: {errorMsg}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email or Phone field */}
        <div className="space-y-1">
          <label className="block font-mono text-[9px] font-bold text-black uppercase tracking-wider">
            Email hoặc Số điện thoại
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="EMAIL@EXAMPLE.COM HOẶC 09xxxxxxxx"
              className="w-full bg-zinc-50 border-[2px] border-black p-2.5 pl-10 text-xs font-mono text-black uppercase focus:outline-none focus:bg-white placeholder-zinc-450 focus:border-black rounded-none"
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
              placeholder="••••••••••••"
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

        {/* Extras: Remember me & Forgot Password */}
        <div className="flex justify-between items-center pt-1 font-mono text-[9px] uppercase tracking-wider">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 border-2 border-black bg-white accent-black cursor-pointer rounded-none"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); toast.info('VUI LÒNG LIÊN HỆ QUẢN TRỊ VIÊN ĐỂ ĐẶT LẠI MẬT KHẨU'); }}
            className="hover:underline text-zinc-600 hover:text-black font-bold"
          >
            Quên mật khẩu?
          </a>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-black text-white py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-black transition-all duration-150 cursor-pointer rounded-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ĐANG ĐĂNG NHẬP...
            </>
          ) : (
            <>
              ĐĂNG NHẬP
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-zinc-200 pt-5 mt-6 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-550">
        Chưa có tài khoản?{' '}
        <button
          onClick={onToggleView}
          className="text-black font-black hover:underline cursor-pointer bg-transparent border-none p-0 inline"
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};
export default Login;
