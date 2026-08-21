/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { User as UserIcon, Search, ShieldAlert, LogOut, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    categories,
    activeView,
    setActiveView,
    activeClientTab,
    setActiveClientTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory
  } = useApp();
  const { toast } = useToast();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper: push '/' to history and dispatch popstate so App.tsx clears selectedProductId
  const navigateHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => {
              navigateHome();
              setActiveView('client');
              setActiveClientTab('shop');
              setSelectedCategory('All');
            }}
            className="flex items-center whitespace-nowrap hover:opacity-85 transition-opacity cursor-pointer"
            id="nav-logo"
          >
            <span className="font-display text-sm sm:text-base font-black tracking-[0.2em] text-white uppercase">VINH QUACH</span>
            <span className="font-mono text-[9px] sm:text-[10px] font-light tracking-[0.25em] text-zinc-500 uppercase ml-1.5 sm:ml-2">/ AUTHENTIC</span>
          </button>

          {/* Desktop Categories */}
          {activeView === 'client' && activeClientTab === 'shop' && (
            <nav className="hidden lg:flex items-center gap-6 text-[10px] uppercase tracking-widest font-mono text-zinc-500">
              {/* First item: ALL */}
              <button
                onClick={() => {
                  navigateHome();
                  setSelectedCategory('All');
                }}
                className={`hover:text-white transition-colors cursor-pointer relative py-2 ${selectedCategory === 'All' ? 'text-white font-bold' : ''
                  }`}
                id="cat-btn-all"
              >
                ALL
                {selectedCategory === 'All' && (
                  <motion.div
                    layoutId="activeCategoryUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const catIdStr = String(cat.id);
                const isActive = selectedCategory === catIdStr;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      navigateHome();
                      setSelectedCategory(catIdStr);
                    }}
                    className={`hover:text-white transition-colors cursor-pointer relative py-2 ${isActive ? 'text-white font-bold' : ''
                      }`}
                    id={`cat-btn-${cat.name.toLowerCase()}`}
                  >
                    {cat.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Search, Cart, Profile Section */}
        <div className="flex items-center gap-4">

          {/* Search bar inside navigation (Client View - Shop tab) */}
          {activeView === 'client' && activeClientTab === 'shop' && (
            <div className="relative hidden lg:block w-48 md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-550">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TÌM KIẾM..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-none py-1.5 pl-9 pr-3 text-xs tracking-wider text-white placeholder-zinc-550 focus:outline-none focus:border-zinc-450 focus:ring-0 transition-colors uppercase font-mono"
                id="nav-search-input"
                onFocus={() => navigateHome()}
              />
            </div>
          )}

          {/* System Mode Toggle — Admin only */}
          {currentUser?.role === 'Admin' && (
            <div className="flex items-center border border-zinc-850 rounded-none p-0.5 bg-zinc-950 font-mono text-[10px] tracking-wider">
              <button
                onClick={() => {
                  navigateHome();
                  setActiveView('client');
                }}
                className={`px-2.5 py-1 text-center font-medium uppercase transition-colors rounded-none ${activeView === 'client'
                    ? 'bg-white text-black'
                    : 'text-zinc-450 hover:text-white'
                  }`}
                id="view-toggle-client"
              >
                STORE
              </button>
              <button
                onClick={() => {
                  navigateHome();
                  if (!currentUser || currentUser.role !== 'Admin') {
                    setActiveView('client');
                    setActiveClientTab('account');
                    toast.warning('VUI LÒNG ĐĂNG NHẬP BẰNG TÀI KHOẢN ADMIN');
                    return;
                  }
                  setActiveView('admin');
                }}
                className={`px-2.5 py-1 text-center font-medium uppercase transition-colors rounded-none flex items-center gap-1 ${activeView === 'admin'
                    ? 'bg-white text-black'
                    : 'text-zinc-450 hover:text-white'
                  }`}
                id="view-toggle-admin"
              >
                <ShieldAlert className="h-3 w-3 inline" />
                ADMIN
              </button>
            </div>
          )}



          {/* Account tab button / User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 text-zinc-450 hover:text-white transition-colors cursor-pointer"
              id="user-menu-trigger"
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden md:inline font-mono text-xs uppercase tracking-widest text-zinc-450 truncate max-w-[100px]">
                {currentUser ? currentUser.name.split(' ')[0] : 'KHÁCH'}
              </span>
            </button>

            {/* Micro User Selector Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  {/* Backdrop for easy dismiss */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 border border-zinc-800 bg-zinc-950 p-3 text-white shadow-2xl z-20 font-mono text-left rounded-none"
                  >
                    {currentUser ? (
                      <>
                        {/* Active Identity info */}
                        <div className="border-b border-zinc-850 pb-2 mb-3">
                          <p className="text-[8px] text-zinc-550 uppercase tracking-[0.2em] font-bold">TÀI KHOẢN</p>
                          <p className="text-xs font-black text-white truncate mt-1 uppercase">{currentUser.name}</p>
                          <p className="text-[9px] text-zinc-400 lowercase font-light truncate mt-0.5">{currentUser.email}</p>
                          <span className="inline-block mt-2 border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[8px] font-bold tracking-widest text-zinc-350 uppercase">
                            VAI TRÒ: {currentUser.role}
                          </span>
                        </div>

                        {/* Account actions */}
                        <div className="space-y-1 mb-3">
                          <button
                            onClick={() => {
                              navigateHome();
                              setActiveView('client');
                              setActiveClientTab('account');
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center py-1.5 text-left text-[10px] text-zinc-350 hover:text-white uppercase tracking-wider transition-colors cursor-pointer font-bold"
                          >
                            Cập nhật tài khoản
                          </button>
                          <button
                            onClick={() => {
                              navigateHome();
                              setActiveView('client');
                              setActiveClientTab('account');
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center py-1.5 text-left text-[10px] text-zinc-350 hover:text-white uppercase tracking-wider transition-colors cursor-pointer font-bold"
                          >
                            Đơn hàng của tôi
                          </button>
                        </div>

                        {/* Logout Button */}
                        <button
                          onClick={() => {
                            navigateHome();
                            localStorage.removeItem('jordan_token');
                            sessionStorage.removeItem('jordan_token');
                            setCurrentUser(null);
                            setIsUserMenuOpen(false);
                            setActiveView('client');
                            setActiveClientTab('shop');
                          }}
                          className="w-full border-2 border-black bg-white text-black py-2 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all cursor-pointer rounded-none"
                        >
                          ĐĂNG XUẤT
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="pb-2 mb-3">
                          <p className="text-[8px] text-zinc-550 uppercase tracking-[0.2em] font-bold">TÀI KHOẢN</p>
                          <p className="text-xs font-black text-white truncate mt-1 uppercase">KHÁCH</p>
                        </div>

                        <button
                          onClick={() => {
                            navigateHome();
                            setActiveView('client');
                            setActiveClientTab('account');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full border-2 border-black bg-white text-black py-2.5 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all cursor-pointer rounded-none"
                        >
                          ĐĂNG NHẬP / ĐĂNG KÝ
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Hamburger Trigger */}
          {activeView === 'client' && activeClientTab === 'shop' && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="block lg:hidden px-3 py-1.5 border border-zinc-800 hover:border-white font-mono text-xs uppercase tracking-widest text-white transition-colors cursor-pointer rounded-none"
              id="mobile-menu-trigger"
            >
              MENU
            </button>
          )}

        </div>
      </div>

      {/* Mobile Drawer (Full-Screen Menu) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="bg-black h-screen w-full fixed inset-0 z-50 flex flex-col p-8 justify-between overflow-y-auto"
          >
            {/* Header section in Drawer */}
            <div className="flex justify-between items-center w-full border-b border-zinc-800 pb-4 mb-6">
              <span className="font-display text-sm font-black tracking-[0.2em] text-white">VINH QUACH</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-1.5 border border-zinc-800 hover:border-white font-mono text-xs uppercase tracking-widest text-white transition-colors cursor-pointer rounded-none"
              >
                CLOSE
              </button>
            </div>

            {/* Content section in Drawer */}
            <div className="flex flex-col gap-6 text-left my-auto">
              {/* Mobile Search bar */}
              <div className="relative w-full mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-550">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="TÌM KIẾM..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-none py-3 pl-9 pr-3 text-sm tracking-wider text-white placeholder-zinc-550 focus:outline-none focus:border-zinc-450 focus:ring-0 transition-colors uppercase font-mono"
                  onFocus={() => navigateHome()}
                />
              </div>

              {/* Mobile Categories Links */}
              <nav className="flex flex-col gap-5 text-left">
                <button
                  onClick={() => {
                    navigateHome();
                    setSelectedCategory('All');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`font-display text-3xl font-black tracking-widest text-left hover:text-white transition-colors uppercase ${
                    selectedCategory === 'All' ? 'text-white border-l-2 border-white pl-4' : 'text-zinc-500'
                  }`}
                >
                  ALL
                </button>
                {categories.map((cat) => {
                  const catIdStr = String(cat.id);
                  const isActive = selectedCategory === catIdStr;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        navigateHome();
                        setSelectedCategory(catIdStr);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`font-display text-3xl font-black tracking-widest text-left hover:text-white transition-colors uppercase ${
                        isActive ? 'text-white border-l-2 border-white pl-4' : 'text-zinc-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer section in Drawer */}
            <div className="border-t border-zinc-900 pt-6 mt-auto">
              <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                © 2026 VINH QUACH AUTHENTIC // EST. 2022
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

