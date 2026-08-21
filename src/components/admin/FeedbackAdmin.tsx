/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { getAdminHeaders, getAdminAuthOnlyHeaders } from '../../utils/authHeaders';
import { MessageSquare, Upload, Trash2, Loader2, Image as ImageIcon, Plus, FolderOpen } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';

export interface FeedbackItem {
  id: string | number;
  content: string;
  image_url: string;
  created_at?: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const FeedbackAdmin: React.FC = () => {
  const { toast, confirmModal } = useToast();
  
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cloudinary Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch feedbacks list
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/feedbacks`, {
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        const items = Array.isArray(result) 
          ? result 
          : (Array.isArray(result.data) ? result.data : []);
        setFeedbacks(items);
      } else {
        const err = await response.json();
        toast.error(err.message || 'KHÔNG THỂ TẢI DANH SÁCH FEEDBACK');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('LỖI KẾT NỐI MÁY CHỦ KHI TẢI FEEDBACK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Handle local file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl('');
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Select image from Cloudinary Library Picker
  const handleSelectFromCloudinary = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove preview image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit form to create feedback
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.warning('VUI LÒNG NHẬP NỘI DUNG FEEDBACK');
      return;
    }
    if (!imageFile && !imageUrl) {
      toast.warning('VUI LÒNG CHỌN HÌNH ẢNH FEEDBACK');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (imageFile) {
        formData.append('images', imageFile);
      } else if (imageUrl) {
        formData.append('image_url', imageUrl);
      }

      const response = await fetch(`${API_BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: getAdminAuthOnlyHeaders(),
        body: formData
      });

      if (response.ok) {
        toast.success('ĐÃ THÊM FEEDBACK MỚI THÀNH CÔNG');
        setContent('');
        handleRemoveImage();
        fetchFeedbacks();
      } else {
        const err = await response.json();
        toast.error(err.error || err.message || 'KHÔNG THỂ THÊM FEEDBACK');
      }
    } catch (error) {
      console.error('Create feedback error:', error);
      toast.error('LỖI KHI GỬI DỮ LIỆU FEEDBACK');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete feedback by ID
  const handleDelete = async (id: string | number) => {
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA FEEDBACK NÀY KHÔNG?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/feedbacks/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (response.ok) {
        toast.success('ĐÃ XÓA FEEDBACK THÀNH CÔNG');
        fetchFeedbacks();
      } else {
        const err = await response.json();
        toast.error(err.message || 'KHÔNG THỂ XÓA FEEDBACK');
      }
    } catch (error) {
      console.error('Delete feedback error:', error);
      toast.error('LỖI KHI XÓA FEEDBACK');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> CUSTOMER ARCHIVES MANAGEMENT
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            QUẢN LÝ FEEDBACK
          </h2>
        </div>
      </div>

      {/* TOP SECTION: Add New Form */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-6">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-900 pb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" /> THÊM FEEDBACK MỚI
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Image Dropzone / Preview */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                  HÌNH ẢNH FEEDBACK (ẢNH DỌC 9:16)
                </label>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="h-3 w-3" /> CHỌN TỪ CLOUDINARY
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="feedback-image-input"
              />

              {imagePreview ? (
                <div className="relative aspect-[9/16] w-full max-w-[200px] border border-zinc-800 bg-black overflow-hidden group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 hover:bg-red-700 transition-colors cursor-pointer rounded-none"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-dashed border border-zinc-700 hover:border-white w-full h-40 flex flex-col items-center justify-center font-mono text-xs cursor-pointer uppercase bg-black transition-colors text-zinc-400 hover:text-white rounded-none space-y-2 p-4 text-center"
                  >
                    <Upload className="h-6 w-6 stroke-[1.5]" />
                    <span className="tracking-wider text-[10px]">
                      KÉO THẢ HOẶC BẤM ĐỂ TẢI ẢNH UP FEEDBACK
                    </span>
                    <span className="text-[8px] text-zinc-650 font-sans lowercase">
                      chấp nhận png, jpg, webp (tối đa 5mb)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full border border-zinc-800 bg-black text-zinc-300 py-2.5 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all cursor-pointer rounded-none flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    MỞ THƯ VIỆN ẢNH CLOUDINARY
                  </button>
                </div>
              )}
            </div>

            {/* Review Content Textarea */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                  NỘI DUNG ĐÁNH GIÁ (FEEDBACK CONTENT)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="NHẬP NỘI DUNG ĐÁNH GIÁ CỦA KHÁCH HÀNG..."
                  className="bg-black border border-zinc-800 text-white font-mono text-sm p-4 w-full rounded-none focus:border-white focus:outline-none placeholder-zinc-650 resize-none h-48 uppercase"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="bg-white text-black font-mono font-bold uppercase tracking-widest px-8 py-4 w-full hover:bg-zinc-200 transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    ĐANG LƯU FEEDBACK...
                  </>
                ) : (
                  <>
                    LƯU FEEDBACK MỚI
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: Saved Feedbacks Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> FEEDBACK ĐÃ LƯU ({feedbacks.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 border border-zinc-900 bg-zinc-950 font-mono text-xs text-zinc-500 uppercase tracking-widest">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> ĐANG TẢI DANH SÁCH FEEDBACK...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex justify-center items-center py-20 border border-zinc-900 bg-zinc-950 font-mono text-xs text-zinc-600 uppercase tracking-widest text-center">
            CHƯA CÓ FEEDBACK NÀO TRONG CƠ SỞ DỮ LIỆU
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className="aspect-[9/16] relative border border-zinc-800 bg-zinc-950 overflow-hidden group rounded-none"
              >
                {/* Background Image */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={`Feedback ${item.id}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-mono text-zinc-700 text-xs uppercase">
                    NO IMAGE
                  </div>
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors pointer-events-none" />

                {/* Aggressive Delete Button over Image */}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white font-mono text-[10px] px-2 py-1 uppercase tracking-widest cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-700 rounded-none border border-red-500"
                  title="Xóa Feedback này"
                >
                  XÓA
                </button>

                {/* Text Overlay at bottom */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end z-10">
                  <span className="font-mono text-[9px] text-zinc-450 tracking-widest uppercase font-bold mb-1">
                    ID #{item.id}
                  </span>
                  <p className="font-mono text-[10px] text-white uppercase tracking-wider line-clamp-3 leading-relaxed font-normal">
                    "{item.content}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloudinary Image Picker Modal */}
      <CloudinaryImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectFromCloudinary}
        selectedUrl={imageUrl}
      />

    </div>
  );
};

export default FeedbackAdmin;
