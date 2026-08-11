/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GuestGatewayProps {
  onActionComplete?: () => void;
}

export const GuestGateway: React.FC<GuestGatewayProps> = ({ onActionComplete }) => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    if (onActionComplete) onActionComplete();
    navigate('/login');
  };

  const handleRegisterRedirect = () => {
    if (onActionComplete) onActionComplete();
    navigate('/register');
  };

  return (
    <div className="flex items-center justify-center w-full py-8">
      <div className="w-full max-w-md bg-black border border-zinc-800 p-8 sm:p-12 rounded-none text-center sm:text-left">
        {/* Main Heading */}
        <h2 className="font-display text-white font-bold text-2xl md:text-3xl uppercase tracking-tight mb-6 leading-none">
          XIN HÃY ĐĂNG NHẬP ĐỂ MUA HÀNG
        </h2>

        {/* Buttons Layout */}
        <div className="flex flex-col">
          {/* Primary Button */}
          <button
            onClick={handleLoginRedirect}
            className="bg-white text-black font-bold uppercase tracking-widest py-4 px-8 border border-white hover:bg-zinc-200 transition-colors w-full sm:w-auto text-xs cursor-pointer text-center"
          >
            ĐĂNG NHẬP
          </button>

          {/* Helper Text */}
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-6 mb-2 text-center sm:text-left">
            HÃY ĐĂNG KÝ NẾU BẠN CHƯA CÓ TÀI KHOẢN
          </p>

          {/* Secondary Button */}
          <button
            onClick={handleRegisterRedirect}
            className="bg-transparent text-white font-bold uppercase tracking-widest py-4 px-8 border border-zinc-700 hover:border-white transition-colors w-full sm:w-auto mt-4 text-xs cursor-pointer text-center"
          >
            ĐĂNG KÝ
          </button>
        </div>
      </div>
    </div>
  );
};
