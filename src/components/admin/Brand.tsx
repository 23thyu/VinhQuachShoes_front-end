/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { Brand } from '../../types';
import { useToast } from '../../context/ToastContext';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const BrandManagement: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  
  // Picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const fetchBrands = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/brands?page=${page}&limit=8`);
      if (response.ok) {
        const result = await response.json();
        setBrands(result.data || []);
        setCurrentPage(result.current_page || 1);
        setTotalPages(result.total_page || 1);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands(currentPage);
  }, [currentPage]);

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setName('');
    setImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setImage(brand.image);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.warning('VUI LÒNG NHẬP TÊN THƯƠNG HIỆU'); return; }
    if (!image) { toast.warning('VUI LÒNG CHỌN HÌNH ẢNH/LOGO'); return; }

    const bodyData = { name, image };
    
    try {
      let response;
      if (editingBrand) {
        // Edit
        response = await fetch(`${API_BASE_URL}/brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      } else {
        // Add
        response = await fetch(`${API_BASE_URL}/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      }

      if (response.ok) {
        toast.success(editingBrand ? 'ĐÃ CẬP NHẬT THƯƠNG HIỆU' : 'ĐÃ THÊM THƯƠNG HIỆU MỚI');
        setIsModalOpen(false);
        fetchBrands(currentPage);
      } else {
        const err = await response.json();
        toast.error(err.message || 'LỖI KHI LƯU THƯƠNG HIỆU');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA THƯƠNG HIỆU NÀY KHÔNG?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE_URL}/brands/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('ĐÃ XÓA THƯƠNG HIỆU THÀNH CÔNG');
        fetchBrands(currentPage);
      } else {
        const err = await response.json();
        toast.error(err.message || 'KHÔNG THỂ XÓA THƯƠNG HIỆU');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550">BRAND SERVICES</span>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            QUẢN LÝ THƯƠNG HIỆU
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 border border-white bg-white text-black px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all rounded-none cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          THÊM THƯƠNG HIỆU MỚI
        </button>
      </div>

      {/* Brands Table list */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-550 tracking-widest">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            LOADING BRANDS CATALOG...
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center font-mono text-xs text-zinc-600">
            CHƯA CÓ THƯƠNG HIỆU NÀO ĐƯỢC TẠO
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-550 uppercase tracking-widest">
                  <th className="pb-3 font-semibold">MÃ THƯƠNG HIỆU</th>
                  <th className="pb-3 font-semibold">LOGO / LOGOTYPE</th>
                  <th className="pb-3 font-semibold">TÊN THƯƠNG HIỆU</th>
                  <th className="pb-3 font-semibold text-center">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 text-zinc-500">#{brand.id}</td>

                    {/* Logo Image */}
                    <td className="py-3.5">
                      <div className="h-10 w-24 border border-zinc-900 bg-zinc-950 flex items-center justify-center p-1 overflow-hidden">
                        {brand.image ? (
                          <img
                            src={brand.image}
                            alt={brand.name}
                            className="h-full w-full object-contain filter invert opacity-80"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[8px] text-zinc-700">NO LOGO</span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 text-white font-bold uppercase tracking-wider">
                      {brand.name}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(brand)}
                          className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-red-950 text-zinc-450 hover:text-red-400 transition-colors cursor-pointer"
                          title="Xóa thương hiệu"
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
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 p-6 text-white z-10 font-sans shadow-2xl flex flex-col rounded-none"
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
                {editingBrand ? 'CẬP NHẬT THƯƠNG HIỆU' : 'THÊM MỚI THƯƠNG HIỆU'}
              </h3>

              {/* Form body */}
              <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Tên thương hiệu</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. JORDAN, NIKE, ADIDAS..."
                    className="w-full bg-zinc-900 border border-zinc-850 p-2.5 text-white uppercase focus:outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] text-zinc-550 uppercase tracking-widest">Logo thương hiệu</label>
                  
                  {image ? (
                    <div className="relative border border-zinc-850 p-2 bg-zinc-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 border border-zinc-900 bg-black p-1">
                          <img src={image} alt="Selected Logo" className="h-full w-full object-contain filter invert" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[9px] text-zinc-500 truncate max-w-[150px]">{image}</span>
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
                      className="w-full border border-dashed border-zinc-850 hover:border-zinc-550 bg-zinc-950 p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-zinc-550 hover:text-white"
                    >
                      <ImageIcon className="h-6 w-6 stroke-[1.25] mb-2" />
                      <span className="uppercase text-[9px] tracking-widest">CHỌN ẢNH TỪ CLOUDINARY</span>
                    </button>
                  )}
                </div>

                {/* Confirm buttons */}
                <div className="flex gap-2 border-t border-zinc-900 pt-4 mt-2">
                  <button
                    type="submit"
                    className="flex-1 border border-white bg-white text-black py-2.5 font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all cursor-pointer text-center"
                  >
                    Lưu thương hiệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-zinc-850 bg-black text-zinc-450 py-2.5 uppercase tracking-widest hover:text-white hover:border-zinc-650 transition-all cursor-pointer text-center"
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
    </div>
  );
};
export default BrandManagement;
