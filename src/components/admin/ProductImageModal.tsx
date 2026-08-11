/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Loader2, Plus } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { useToast } from '../../context/ToastContext';

interface ProductImage {
  id: number;
  product_id: number | string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const ProductImageModal: React.FC<ProductImageModalProps> = ({ isOpen, onClose, productId }) => {
  const { toast } = useToast();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/product-images?product_id=${productId}`);
      if (response.ok) {
        const result = await response.json();
        setImages(result.data || []);
      } else {
        toast.error('LỖI KHI TẢI DANH SÁCH ẢNH PHỤ');
      }
    } catch (error) {
      console.error('Error fetching secondary images:', error);
      toast.error('KHÔNG THỂ KẾT NỐI ĐẾN SERVER');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId && isOpen) {
      fetchImages();
    }
  }, [productId, isOpen]);

  const handleAddImage = async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/product-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: Number(productId),
          image_url: url,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('THÊM ẢNH PHỤ THÀNH CÔNG');
        fetchImages();
      } else {
        toast.error(result.message || 'LỖI KHI THÊM ẢNH PHỤ');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('LỖI KẾT NỐI SERVER KHI THÊM ẢNH');
    }
  };

  const handleDeleteImage = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/product-images/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('ĐÃ XÓA ẢNH PHỤ THÀNH CÔNG');
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        const result = await response.json();
        toast.error(result.message || 'LỖI KHI XÓA ẢNH PHỤ');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('LỖI KẾT NỐI SERVER KHI XÓA ẢNH');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-6 text-white z-10 font-sans shadow-2xl flex flex-col rounded-none max-h-[85vh] overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-550 hover:text-white border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header */}
        <div className="border-b border-zinc-900 pb-3 mb-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">
            PRODUCT ID: #{productId}
          </span>
          <h3 className="font-display text-base font-black uppercase tracking-tight mt-1 text-white">
            QUẢN LÝ HÌNH ẢNH PHỤ
          </h3>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Upload Dash Box */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="w-full border-2 border-dashed border-zinc-700 hover:border-white bg-zinc-950/20 p-8 flex flex-col items-center justify-center cursor-pointer transition-colors rounded-none"
          >
            <Plus className="h-6 w-6 text-zinc-500 mb-2 stroke-[1.5]" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold text-white">
              TẢI ẢNH LÊN
            </span>
          </button>

          {/* Current Secondary Images list */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
              DANH SÁCH ẢNH HIỆN TẠI ({images.length})
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 font-mono text-[10px] text-zinc-550 tracking-widest">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500 mb-2" />
                ĐANG TẢI HÌNH ẢNH...
              </div>
            ) : images.length === 0 ? (
              <p className="font-mono text-[9px] text-zinc-650 uppercase tracking-widest text-center py-8 border border-zinc-900 bg-zinc-900/10">
                CHƯA CÓ HÌNH ẢNH PHỤ NÀO CHO SẢN PHẨM NÀY
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square border border-zinc-800 bg-zinc-900/30 p-2 flex items-center justify-center group overflow-hidden"
                  >
                    <img
                      src={img.image_url}
                      alt="Product Secondary"
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                    />

                    {/* brutalist delete button [ X ] overlay */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] rounded-none transition-colors border border-red-600 hover:border-red-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      [ X ]
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border border-zinc-800 bg-black text-zinc-400 px-6 py-2.5 font-mono text-xs uppercase tracking-widest hover:text-white hover:border-zinc-650 transition-all rounded-none cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </motion.div>

      {/* Cloudinary Picker Modal Integration */}
      <CloudinaryImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => handleAddImage(url)}
      />
    </div>
  );
};
