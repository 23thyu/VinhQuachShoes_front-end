/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuestGateway } from './GuestGateway';

interface ShoppingCartProps {
  onOpenCheckout: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ onOpenCheckout }) => {
  const { toast } = useToast();
  const {
    isCartOpen,
    setIsCartOpen,
    getHydratedCart,
    updateCartQuantity,
    removeFromCart,
    currentUser
  } = useApp();

  const [orderNotes, setOrderNotes] = useState('');
  const cartItems = getHydratedCart();
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const handleIncrease = async (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;
    if (item.quantity >= item.variant.stock) {
      toast.error('SỐ LƯỢNG TRONG KHO ĐÃ ĐẠT GIỚI HẠN');
      return;
    }
    await updateCartQuantity(itemId, item.quantity + 1);
  };

  const handleDecrease = async (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item || item.quantity <= 1) return;
    await updateCartQuantity(itemId, item.quantity - 1);
  };

  const handleRemove = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          className="w-screen max-w-md bg-zinc-950 border-l border-zinc-900 text-white flex flex-col justify-between"
          id="cart-drawer-panel"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-zinc-400" />
              <h2 className="font-display text-base font-bold uppercase tracking-widest text-white">GIỎ HÀNG</h2>
              <span className="font-mono text-xs text-zinc-555">({cartItems.length} SẢN PHẨM)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-zinc-550 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-zinc-800"
              id="cart-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Contents */}
          {!currentUser ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <GuestGateway onActionComplete={() => setIsCartOpen(false)} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence initial={false}>
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 font-mono text-xs">
                      <ShoppingBag className="h-10 w-10 text-zinc-800 stroke-[1]" />
                      <p className="text-zinc-500 uppercase tracking-widest">GIỎ HÀNG TRỐNG</p>
                      <p className="text-zinc-600 lowercase font-light max-w-[250px]">khám phá kho sản phẩm và sở hữu những phối màu giới hạn.</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="border border-zinc-800 hover:border-white px-4 py-2 uppercase text-[10px] tracking-widest text-zinc-300 hover:text-white transition-all cursor-pointer"
                      >
                        MUA SẮM NGAY
                      </button>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-4 border-b border-zinc-900 pb-4 overflow-hidden"
                        id={`cart-item-${item.id}`}
                      >
                        {/* Item Thumbnail */}
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center p-1">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between text-xs">
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-display font-semibold text-white uppercase tracking-wide truncate max-w-[180px]">
                                {item.product.name}
                              </h4>
                              <span className="font-mono font-medium text-zinc-300">
                                {(item.product.price * item.quantity * 25000).toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                            <p className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest">
                              {(!item.variantId || item.variantId.startsWith('v_dummy_cart_')) ? (
                                <span>THÔNG TIN: PHIÊN BẢN GỐC</span>
                              ) : (
                                <span>SIZE: US MEN'S {item.variant.size} | MÀU: {item.variant.color.split('/')[0]}</span>
                              )}
                            </p>
                          </div>

                          {/* Quantity adjusting controls & sharp delete button */}
                          <div className="flex items-center justify-between mt-3 pt-2">
                            {/* Brutalist sharp grid module */}
                            <div className="flex items-center border border-zinc-700 bg-transparent rounded-none font-mono">
                              <button
                                disabled={item.quantity <= 1}
                                onClick={() => handleDecrease(item.id)}
                                className="h-7 w-7 flex items-center justify-center border-r border-zinc-700 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-none cursor-pointer text-xs font-bold"
                                id={`cart-decrease-${item.id}`}
                              >
                                -
                              </button>
                              <span className="h-7 px-3 flex items-center justify-center text-xs font-bold text-white min-w-[28px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                disabled={item.quantity >= item.variant.stock}
                                onClick={() => handleIncrease(item.id)}
                                className="h-7 w-7 flex items-center justify-center border-l border-zinc-700 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-none cursor-pointer text-xs font-bold"
                                id={`cart-increase-${item.id}`}
                              >
                                +
                              </button>
                            </div>

                            {/* Aggressive Brutalist Text-based Delete button */}
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="font-mono text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none px-2 py-1 border border-transparent hover:border-red-900/50"
                              id={`cart-delete-${item.id}`}
                            >
                              [ XÓA ]
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Summary & Action Footers */}
              {cartItems.length > 0 && (
                <div className="border-t border-zinc-900 p-6 space-y-4 bg-zinc-950">
                  {/* Optional Order Notes */}
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[9px] text-zinc-550 uppercase tracking-widest">YÊU CẦU GIAO HÀNG ĐẶC BIỆT</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="VD: đóng gói double-box, yêu cầu đặc biệt..."
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded-none p-2 text-[10px] tracking-wider text-white placeholder-zinc-550 focus:outline-none focus:border-zinc-500 font-mono resize-none h-12 uppercase"
                    />
                  </div>

                  {/* Pricing breakdown */}
                  <div className="space-y-1.5 font-mono text-xs border-t border-zinc-900 pt-3">
                    <div className="flex justify-between text-zinc-550">
                      <span>PHÍ VẬN CHUYỂN</span>
                      <span className="uppercase text-[10px]">MIỄN PHÍ</span>
                    </div>
                    <div className="flex justify-between text-zinc-550">
                      <span>THUẾ VAT</span>
                      <span>0 ₫</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-zinc-900 text-white font-semibold">
                      <span className="uppercase tracking-widest text-xs">TỔNG CỘNG</span>
                      <span className="text-lg tracking-wider">{(subtotal * 25000).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  {/* Secure Checkout */}
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onOpenCheckout();
                    }}
                    className="w-full flex items-center justify-center gap-2 border border-white bg-white text-black py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-700 transition-all rounded-none cursor-pointer group"
                    id="cart-checkout-btn"
                  >
                    TIẾN HÀNH THANH TOÁN
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center font-mono text-[9px] text-zinc-550 uppercase tracking-wider">
                    VẬN CHUYỂN NHANH TOÀN CẦU
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
