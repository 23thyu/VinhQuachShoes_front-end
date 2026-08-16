/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, X, Image as ImageIcon, Search, Filter, Loader2 } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { ProductImageModal } from './ProductImageModal';
import { Product, Brand, Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getAdminHeaders } from '../../utils/authHeaders';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const ProductManagement: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dropdown lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Add/Edit modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [oldPrice, setOldPrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [specification, setSpecification] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  
  // Cloudinary Picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Secondary Images Modal state
  const [isSecondaryImagesOpen, setIsSecondaryImagesOpen] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<string | null>(null);

  const handleOpenProductImages = (productId: string | number) => {
    setSelectedProductForImages(String(productId));
    setIsSecondaryImagesOpen(true);
  };

  // Fetch products with search and filter
  const fetchProducts = async (page = 1, searchQuery = '', catId = '', bId = '') => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/products?page=${page}&limit=8&search=${encodeURIComponent(searchQuery)}`;
      if (catId) url += `&category_id=${catId}`;
      if (bId) url += `&brand_id=${bId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
        setCurrentPage(result.current_page || 1);
        setTotalPages(result.total_page || 1);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter metadata (categories, brands)
  const fetchFilterMetadata = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories?limit=all`),
        fetch(`${API_BASE_URL}/brands?limit=all`)
      ]);
      
      if (catRes.ok) {
        const result = await catRes.json();
        setCategories(result.data || []);
      }
      if (brandRes.ok) {
        const result = await brandRes.json();
        setBrands(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching filter metadata:', error);
    }
  };

  useEffect(() => {
    fetchFilterMetadata();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(currentPage, search, categoryId, brandId);
    }, 300); // debounced search

    return () => clearTimeout(handler);
  }, [currentPage, search, categoryId, brandId]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setOldPrice('');
    setDescription('');
    setSpecification('');
    setSelectedCategoryId('');
    setSelectedBrandId('');
    setImage('');
    setQuantity('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name || '');
    setPrice(p.price !== undefined && p.price !== null ? p.price * 25000 : '');
    setOldPrice(p.oldprice ? p.oldprice * 25000 : '');
    setDescription(p.description || '');
    setSpecification(p.specification || '');
    setSelectedCategoryId(p.category_id?.toString() || '');
    setSelectedBrandId(p.brand_id?.toString() || '');
    setImage(p.image || '');
    setQuantity(p.quantity !== undefined && p.quantity !== null ? p.quantity : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate a simple SKU based on timestamp for new products if missing
    const skuVal = editingProduct?.sku || `AJ-${Date.now().toString().slice(-4)}`;

    const bodyData = {
      name,
      price: price ? Number(price) / 25000 : 0,
      oldprice: oldPrice ? Number(oldPrice) / 25000 : null,
      description,
      specification,
      category_id: selectedCategoryId ? Number(selectedCategoryId) : null,
      brand_id: selectedBrandId ? Number(selectedBrandId) : null,
      image,
      sku: skuVal,
      quantity: quantity !== '' ? Number(quantity) : 0
    };

    try {
      let response;
      if (editingProduct) {
        // Edit product
        response = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: JSON.stringify(bodyData)
        });
      } else {
        // Create product
        response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify(bodyData)
        });
      }

      if (response.ok) {
        setIsModalOpen(false);
        fetchProducts(currentPage, search, categoryId, brandId);
      } else {
        const err = await response.json();
        toast.error(err.error || err.message || 'LỖI KHI LƯU SẢN PHẨM');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA SẢN PHẨM NÀY KHÔNG?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (response.ok) {
        toast.success('ĐÃ XÓA SẢN PHẨM THÀNH CÔNG');
        fetchProducts(currentPage, search, categoryId, brandId);
      } else {
        const err = await response.json();
        toast.error(err.message || 'KHÔNG THỂ XÓA SẢN PHẨM');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header & Add Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550">SNEAKER MANAGEMENT SERVICES</span>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            QUẢN LÝ SẢN PHẨM
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 border border-white bg-white text-black px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all rounded-none cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          THÊM SẢN PHẨM MỚI
        </button>
      </div>

      {/* Control filters bar at top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 border border-zinc-900 font-mono text-[10px] uppercase">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="TÌM KIẾM SẢN PHẨM..."
            className="w-full bg-zinc-950 border border-zinc-850 rounded-none py-2 pl-9 pr-3 text-xs tracking-wider text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-500 uppercase"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 tracking-widest flex-shrink-0">DANH MỤC:</span>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-500 rounded-none px-3 py-2 uppercase tracking-widest cursor-pointer"
          >
            <option value="">TẤT CẢ DANH MỤC</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Brand filter */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 tracking-widest flex-shrink-0">THƯƠNG HIỆU:</span>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-500 rounded-none px-3 py-2 uppercase tracking-widest cursor-pointer"
          >
            <option value="">TẤT CẢ THƯƠNG HIỆU</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table list */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-550 tracking-widest">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            LOADING PHYSICAL INVENTORY...
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-550 uppercase tracking-widest">
                  <th className="pb-3 font-semibold">MÃ SP</th>
                  <th className="pb-3 font-semibold">HÌNH ẢNH</th>
                  <th className="pb-3 font-semibold">TÊN SẢN PHẨM</th>
                  <th className="pb-3 font-semibold">ĐƠN GIÁ</th>
                  <th className="pb-3 font-semibold">KHO HÀNG</th>
                  <th className="pb-3 font-semibold">DANH MỤC</th>
                  <th className="pb-3 font-semibold">THƯƠNG HIỆU</th>
                  <th className="pb-3 font-semibold text-center">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {!products || products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 font-mono text-zinc-500 uppercase tracking-widest text-sm border-b border-zinc-800 bg-black"
                    >
                      KHÔNG TÌM THẤY SẢN PHẨM NÀO KHỚP VỚI TỪ KHÓA.
                    </td>
                  </tr>
                ) : (
                  (products || []).map((p) => {
                    const categoryName = typeof p.category === 'object' && p.category ? (p.category as any).name : p.category;
                    const brandName = p.brand ? p.brand.name : '—';
                    
                    return (
                      <tr key={p.id} className="hover:bg-zinc-900/20 transition-colors">
                        {/* ID */}
                        <td className="py-3.5 text-zinc-500">#{p.id}</td>

                        {/* Image Thumbnail */}
                        <td className="py-3.5">
                          <div className="h-12 w-12 border border-zinc-900 bg-zinc-950 flex items-center justify-center p-1 overflow-hidden">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name || 'Sản phẩm'}
                                className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[8px] text-zinc-700">NO IMG</span>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3.5 pr-4 max-w-[200px] truncate">
                          <p className="text-white font-bold uppercase truncate">{p.name || '—'}</p>
                          <p className="text-[8px] text-zinc-600 mt-0.5">SKU: {p.sku || '—'}</p>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 text-white font-bold">{p.price ? (p.price * 25000).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}</td>

                        {/* Stock quantity */}
                        <td className="py-3.5 text-zinc-300 font-bold">{p.quantity || 0}</td>

                        {/* Category */}
                        <td className="py-3.5 text-zinc-400 uppercase text-[10px]">{categoryName || '—'}</td>

                        {/* Brand */}
                        <td className="py-3.5 text-zinc-400 uppercase text-[10px]">{brandName || '—'}</td>

                        {/* Actions */}
                        <td className="py-3.5 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenProductImages(p.id)}
                              className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Quản lý ảnh phụ"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Sửa sản phẩm"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-red-950 text-zinc-450 hover:text-red-400 transition-colors cursor-pointer"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (products || []).length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-end font-mono text-[9px] tracking-widest text-zinc-500 pt-4 border-t border-zinc-955 gap-2">
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

      {/* Add / Edit Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 p-6 text-white z-10 font-sans shadow-2xl flex flex-col rounded-none my-8 max-h-[90vh] overflow-hidden"
            >
              {/* Close icon */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-550 hover:text-white border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Title */}
              <h3 className="font-display text-base font-black uppercase tracking-tight mb-4 border-b border-zinc-900 pb-2">
                {editingProduct ? 'CẬP NHẬT SẢN PHẨM' : 'THÊM MỚI SẢN PHẨM'}
              </h3>

              {/* Scrollable form body */}
              <form onSubmit={handleSave} className="space-y-4 font-mono text-xs overflow-y-auto pr-1">
                
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Tên sản phẩm (Tùy chọn)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. AIR JORDAN 1 RETRO HIGH CHICAGO"
                    className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white uppercase focus:outline-none focus:border-white"
                  />
                </div>

                {/* Pricing & Category dropdowns grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Đơn giá (VNĐ - Tùy chọn)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Đơn giá cũ (VNĐ - Tùy chọn)</label>
                    <input
                      type="number"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Danh mục</label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white rounded-none cursor-pointer"
                    >
                      <option value="">KHÔNG CHỌN</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Thương hiệu</label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white rounded-none cursor-pointer"
                    >
                      <option value="">KHÔNG CHỌN</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Số lượng</label>
                    <input
                      type="number"
                      min={0}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Mô tả sản phẩm (Tùy chọn)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả bối cảnh lịch sử, chất liệu, tính năng thiết kế..."
                    className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white h-20 resize-none uppercase"
                  />
                </div>

                {/* Specifications */}
                <div className="space-y-1">
                  <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Thông số kỹ thuật (Tùy chọn)</label>
                  <textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Đế ngoài bằng cao su, công nghệ đệm Air, vật liệu tumbled leather..."
                    className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white focus:outline-none focus:border-white h-16 resize-none uppercase"
                  />
                </div>

                {/* Image Picker */}
                <div className="space-y-2">
                  <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Hình ảnh chính</label>
                  
                  {image ? (
                    <div className="relative border border-zinc-850 p-2 bg-zinc-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-12 border border-zinc-900 bg-black p-1 flex items-center justify-center">
                          <img src={image} alt="Selected Product" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[9px] text-zinc-500 truncate max-w-[200px]">{image}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="w-full border border-dashed border-zinc-850 hover:border-zinc-555 bg-zinc-950 p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-zinc-555 hover:text-white"
                    >
                      <ImageIcon className="h-6 w-6 stroke-[1.25] mb-2" />
                      <span className="uppercase text-[9px] tracking-widest">CHỌN ẢNH TỪ CLOUDINARY</span>
                    </button>
                  )}
                </div>

                {/* Submit footer */}
                <div className="flex gap-2 border-t border-zinc-900 pt-4 mt-2">
                  <button
                    type="submit"
                    className="flex-1 border border-white bg-white text-black py-2.5 font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all cursor-pointer text-center"
                  >
                    Lưu sản phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-zinc-850 bg-black text-zinc-455 py-2.5 uppercase tracking-widest hover:text-white hover:border-zinc-650 transition-all cursor-pointer text-center"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cloudinary Picker Modal */}
      <CloudinaryImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => setImage(url)}
        selectedUrl={image}
      />

      {/* Secondary Images Modal */}
      <AnimatePresence>
        {isSecondaryImagesOpen && selectedProductForImages && (
          <ProductImageModal
            isOpen={isSecondaryImagesOpen}
            onClose={() => {
              setIsSecondaryImagesOpen(false);
              setSelectedProductForImages(null);
            }}
            productId={selectedProductForImages}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default ProductManagement;
