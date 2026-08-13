/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/customer/Navbar';
import { HeroBanner } from './components/customer/HeroBanner';
import { BentoBannerGrid } from './components/customer/BentoBannerGrid';
import { ProductCard } from './components/customer/ProductCard';
import { ProductDetailsModal } from './components/customer/ProductDetailsModal';
import { ShoppingCart } from './components/customer/ShoppingCart';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerAccount } from './components/customer/CustomerAccount';
import { ArticleDetail } from './components/customer/ArticleDetail';
import { FloatingSocial } from './components/customer/FloatingSocial';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RotateCcw, Box, ShieldAlert } from 'lucide-react';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    products,
    categories,
    currentUser,
    activeView,
    setActiveView,
    activeClientTab,
    setActiveClientTab,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isCartOpen,
    setIsCartOpen
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeNewsSlug, setActiveNewsSlug] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Synchronize location.pathname with PDP, Checkout, and Editorial News articles
  useEffect(() => {
    const path = location.pathname;

    if (path === '/checkout') {
      setIsCheckoutOpen(true);
      setSelectedProductId(null);
      setActiveNewsSlug(null);
    } else if (path === '/login' || path === '/register') {
      setIsCheckoutOpen(false);
      setSelectedProductId(null);
      setActiveNewsSlug(null);
      setActiveView('client');
      setActiveClientTab('account');
    } else {
      setIsCheckoutOpen(false);
      
      // Match Product Details PDP
      const pdpMatch = path.match(/\/product\/([^/]+)/);
      if (pdpMatch && pdpMatch[1]) {
        setSelectedProductId(pdpMatch[1]);
        setActiveNewsSlug(null);
        return;
      }
      setSelectedProductId(null);

      // Match Editorial News Article Detail
      const newsMatch = path.match(/\/news\/([^/]+)/);
      if (newsMatch && newsMatch[1]) {
        setActiveNewsSlug(newsMatch[1]);
      } else {
        setActiveNewsSlug(null);
      }
    }
  }, [location.pathname]);

  // Auto-dismiss PDP when user navigates via Navbar (view switch, tab switch, category, search)
  useEffect(() => {
    if (selectedProductId || activeNewsSlug) {
      setSelectedProductId(null);
      setActiveNewsSlug(null);
      navigate('/', { replace: true });
    }
  }, [activeView, activeClientTab, selectedCategory, searchQuery]);

  const handleSelectProduct = (id: string | null) => {
    setSelectedProductId(id);
    if (id) {
      navigate(`/product/${id}`);
    } else {
      navigate('/');
    }
  };

  // Filter products based on search queries and categories
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || String(product.category_id) === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isFiltering = selectedCategory !== 'All' || searchQuery !== '';

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Navigation */}
      <Navbar />

      {/* Main Layout Handler */}
      <main>
        {activeNewsSlug ? (
          <ArticleDetail
            slug={activeNewsSlug}
            onClose={() => {
              setActiveNewsSlug(null);
              navigate('/');
            }}
          />
        ) : activeView === 'client' ? (
          // CLIENT STOREFRONT
          selectedProductId ? (
            <ProductDetailsModal
              productId={selectedProductId}
              onClose={() => handleSelectProduct(null)}
              onSelectProduct={handleSelectProduct}
            />
          ) : activeClientTab === 'shop' ? (
            <div className="space-y-4">
              
              {/* Only show Hero & Bento if user is not actively searching or filtering */}
              {!isFiltering && (
                <>
                  <HeroBanner />
                  <BentoBannerGrid />
                </>
              )}

              {/* Product Catalog Grid */}
              <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-black scroll-mt-16" id="inventory-catalog-section">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 pb-4 border-b border-zinc-900">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">
                      SNEAKER ARCHIVE
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight" id="inventory-catalog-title">
                      {isFiltering ? `KẾT QUẢ TÌM KIẾM (${filteredProducts.length})` : 'KHO SẢN PHẨM'}
                    </h3>
                  </div>

                  {/* Filter tabs (visible on mobile scroll/sticky catalog or search active) */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto font-mono text-[10px] uppercase tracking-wider pb-2 md:pb-0">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`px-3 py-1.5 border transition-all cursor-pointer rounded-none ${
                        selectedCategory === 'All'
                          ? 'border-white bg-white text-black font-semibold'
                          : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                      id="catalog-filter-all"
                    >
                      ALL
                    </button>

                    {categories.map((cat) => {
                      const catIdStr = String(cat.id);
                      const isActive = selectedCategory === catIdStr;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(catIdStr)}
                          className={`px-3 py-1.5 border transition-all cursor-pointer rounded-none ${
                            isActive
                              ? 'border-white bg-white text-black font-semibold'
                              : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                          }`}
                          id={`catalog-filter-${cat.name.toLowerCase()}`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline mobile search bar */}
                {isFiltering && (
                  <div className="relative block sm:hidden w-full mb-6">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="SEARCH AIR ARCHIVE..."
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-none py-2.5 pl-9 pr-3 text-xs tracking-wider text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors uppercase font-mono"
                    />
                  </div>
                )}

                {/* Search / Filter Empty State */}
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 font-mono text-xs">
                    <Box className="h-10 w-10 text-zinc-800 stroke-[1]" />
                    <p className="text-zinc-500 uppercase tracking-widest">QUERY VACANT FROM ARCHIVES</p>
                    <p className="text-zinc-600 lowercase font-light max-w-sm">
                      the search parameters "{searchQuery}" do not correspond to any registered Jordan silhouette model.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="border border-zinc-800 hover:border-white px-4 py-2 uppercase text-[10px] tracking-widest text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> RESET QUERY ARCHIVES
                    </button>
                  </div>
                ) : (
                  /* Responsive Catalog Grid with micro-stagger motion */
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                      }
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    id="catalog-products-grid"
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={() => handleSelectProduct(product.id)}
                      />
                    ))}
                  </motion.div>
                )}
              </section>

            </div>
          ) : (
            // CLIENT ACCOUNT HISTORIES
            <CustomerAccount />
          )
        ) : (
          // ADMINISTRATOR CONTROLS — Role Guard
          currentUser?.role === 'Admin' ? (
            <AdminDashboard />
          ) : (
            <section className="min-h-[70vh] flex items-center justify-center bg-black">
              <div className="border border-zinc-800 bg-zinc-950 p-10 sm:p-16 max-w-lg w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 border-2 border-red-500/40 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-red-500/70" />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-red-500/70">TRUY CẬP BỊ TỪ CHỐI</p>
                  <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">KHÔNG CÓ QUYỀN ADMIN</h2>
                </div>
                <p className="font-mono text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">
                  khu vực này chỉ dành cho tài khoản có vai trò quản trị viên.<br/>
                  vui lòng đăng nhập bằng tài khoản admin để tiếp tục.
                </p>
                <button
                  onClick={() => setActiveView('client')}
                  className="border border-zinc-700 hover:border-white bg-black text-white px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer rounded-none"
                >
                  ← QUAY LẠI CỬA HÀNG
                </button>
              </div>
            </section>
          )
        )}
      </main>

      {/* Footers */}
      <footer className="border-t border-zinc-900 bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-center md:text-left">
          <div className="space-y-2 max-w-md">
            <p className="font-bold text-zinc-300 tracking-[0.2em] uppercase text-xs">
              VINH QUACH AUTHENTIC
            </p>
            <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] leading-relaxed">
              PREMIUM SNEAKER ARCHIVE & STREETWEAR AUTHENTICATOR.
            </p>
          </div>
          <div className="flex gap-6">
            <span className="font-mono text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">CHÍNH SÁCH</span>
            <span className="font-mono text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">ĐIỀU KHOẢN</span>
            <span className="font-mono text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer uppercase tracking-widest">LIÊN HỆ</span>
          </div>
          <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] leading-relaxed">
            © 2026 VINH QUACH AUTHENTIC // EST. 2022 // THANH PHO HO CHI MINH.
          </p>
        </div>
      </footer>

      {/* Floating Social Media Bar */}
      <FloatingSocial />

      {/* Portal Elements (Cart, Details, Checkouts) */}
      <AnimatePresence>
        {isCartOpen && (
          <ShoppingCart onOpenCheckout={() => { setIsCartOpen(false); navigate('/checkout'); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutModal onClose={() => { setIsCheckoutOpen(false); navigate('/'); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
