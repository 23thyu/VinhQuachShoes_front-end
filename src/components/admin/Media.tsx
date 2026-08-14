/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, UploadCloud, Trash2, X, Search, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getAdminHeaders, getAdminAuthOnlyHeaders } from '../../utils/authHeaders';

interface MediaItem {
  id: number;
  name: string;
  url: string;
  public_id: string;
  created_at?: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const MediaLibrary: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/media?page=${page}&limit=12&search=${searchQuery}`);
      if (response.ok) {
        const result = await response.json();
        setMediaItems(result.data || []);
        setCurrentPage(result.current_page || 1);
        setTotalPages(result.total_page || 1);
      }
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMedia(currentPage, search);
    }, 300);

    return () => clearTimeout(handler);
  }, [currentPage, search]);

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA ẢNH NÀY KHỎI THƯ VIỆN VÀ CLOUDINARY KHÔNG?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE_URL}/media/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (response.ok) {
        setMediaItems(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error('LỖI KHI XÓA ẢNH');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  // Drag-and-drop upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: getAdminAuthOnlyHeaders(),
        body: formData
      });

      if (response.ok) {
        setIsUploadOpen(false);
        fetchMedia(1, search);
      } else {
        const err = await response.json();
        toast.error(err.message || 'LỖI KHI TẢI ẢNH LÊN');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header & Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550">CLOUD MEDIA MANAGEMENT</span>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
            THƯ VIỆN HÌNH ẢNH
          </h2>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 border border-white bg-white text-black px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all rounded-none cursor-pointer"
        >
          <UploadCloud className="h-4 w-4 stroke-[2.5]" />
          TẢI ẢNH LÊN
        </button>
      </div>

      {/* Grid view wrapper */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-6">
        {/* Search filter */}
        <div className="relative w-full font-mono text-[10px]">
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
            placeholder="TÌM KIẾM THEO TÊN TẬP TIN..."
            className="w-full bg-zinc-950 border border-zinc-850 rounded-none py-2 pl-9 pr-3 text-xs tracking-wider text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-500 uppercase"
          />
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 font-mono text-[10px] text-zinc-550 tracking-widest">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            RESOLVING ASSET INGESTION...
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="py-24 text-center font-mono text-xs text-zinc-650 tracking-wider">
            THƯ VIỆN HÌNH ẢNH RỖNG. HÃY TẢI ẢNH MỚI LÊN.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square border border-zinc-900 hover:border-zinc-500 bg-zinc-950 overflow-hidden flex flex-col justify-between transition-all"
              >
                {/* Image */}
                <div className="w-full h-full overflow-hidden flex items-center justify-center relative bg-zinc-900/10">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none" />
                </div>

                {/* Card hover delete & meta overlay */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/85 hover:bg-black text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-900 hover:border-red-950 cursor-pointer"
                  title="Xóa ảnh khỏi thư viện"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* ID Meta Badge */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 border border-zinc-900 font-mono text-[8px] tracking-widest text-zinc-350 select-none">
                  ID: #{item.id}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-end font-mono text-[9px] tracking-widest text-zinc-550 pt-4 border-t border-zinc-955 gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1 border border-zinc-900 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-350 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-white font-bold">TRANG {currentPage} TRÊN {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1 border border-zinc-900 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-350 hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Drag Drop Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => !uploading && setIsUploadOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 p-6 text-white z-10 font-sans shadow-2xl flex flex-col rounded-none"
            >
              {/* Close Button */}
              {!uploading && (
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="absolute top-4 right-4 p-2 text-zinc-550 hover:text-white border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}

              {/* Title */}
              <h3 className="font-display text-base font-black uppercase tracking-tight mb-4 border-b border-zinc-900 pb-2">
                TẢI HÌNH ẢNH MỚI LÊN
              </h3>

              {/* Drag drop zone */}
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`h-56 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-white bg-zinc-900/50'
                      : 'border-zinc-850 hover:border-zinc-550 bg-zinc-950'
                  } p-10 text-center relative`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center space-y-3 font-mono text-[10px] text-zinc-400">
                      <Loader2 className="h-7 w-7 text-white animate-spin stroke-[1.5]" />
                      <p className="uppercase tracking-widest animate-pulse">UPLOADING IMAGE LOGS...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <UploadCloud className="h-9 w-9 text-zinc-600 stroke-[1.25]" />
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
                          KÉO THẢ FILE HOẶC CLICK ĐỂ TẢI LÊN
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono mt-1 lowercase">
                          supports jpg, png, webp. max 5 files at a time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MediaLibrary;
