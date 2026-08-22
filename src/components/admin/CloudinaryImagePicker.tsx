/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Image as ImageIcon, X, Trash2, Loader2, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getAdminAuthOnlyHeaders, getAdminHeaders } from '../../utils/authHeaders';

interface MediaItem {
  id: number;
  name: string;
  url: string;
  public_id: string;
  created_at?: string;
}

interface CloudinaryImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
  selectedUrl?: string;
  selectedUrls?: string[];
  isMulti?: boolean;
  maxSelect?: number;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const getOptimizedImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  let formatted = url;
  if (formatted.includes('res.cloudinary.com')) {
    if (!formatted.includes('/f_auto')) {
      formatted = formatted.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    formatted = formatted.replace(/\.(heic|heif)$/i, '.jpg');
  } else if (/\.(heic|heif)$/i.test(formatted)) {
    formatted = formatted.replace(/\.(heic|heif)$/i, '.jpg');
  }
  return formatted;
};

export const CloudinaryImagePicker: React.FC<CloudinaryImagePickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  selectedUrl,
  selectedUrls,
  isMulti = false,
  maxSelect
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const { toast, confirmModal } = useToast();
  
  // Library state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  
  // Upload state
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media from backend
  const fetchMedia = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/media?page=${page}&limit=10&search=${search}`);
      if (response.ok) {
        const result = await response.json();
        const items = (result.data || []).map((item: MediaItem) => ({
          ...item,
          url: getOptimizedImageUrl(item.url)
        }));
        setMediaItems(items);
        setCurrentPage(result.current_page || 1);
        setTotalPages(result.total_page || 1);
      } else {
        console.error('Failed to fetch media library');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia(currentPage, searchQuery);
      if (isMulti) {
        setSelectedList(selectedUrls || []);
      } else if (selectedUrl) {
        setSelectedList([selectedUrl]);
      } else {
        setSelectedList([]);
      }
    }
  }, [isOpen, currentPage, searchQuery]);

  // Toggle selection logic
  const toggleSelectImage = (url: string) => {
    if (isMulti) {
      if (selectedList.includes(url)) {
        setSelectedList(prev => prev.filter(u => u !== url));
      } else {
        if (maxSelect !== undefined && selectedList.length >= maxSelect) {
          toast.warning(`TỐI ĐA CHỈ ĐƯỢC CHỌN ${maxSelect} HÌNH ẢNH!`);
          return;
        }
        setSelectedList(prev => [...prev, url]);
      }
    } else {
      setSelectedList([url]);
    }
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Upload file logic (up to 25 files at once)
  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    // Up to 25 images
    for (let i = 0; i < Math.min(files.length, 25); i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: getAdminAuthOnlyHeaders(),
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const uploadedRecords = result.data || [];
        const uploadedUrls = uploadedRecords.map((r: any) => r.url);
        
        if (uploadedUrls.length > 0) {
          if (isMulti) {
            setSelectedList(prev => {
              const combined = [...prev, ...uploadedUrls];
              return maxSelect ? combined.slice(0, maxSelect) : combined;
            });
          } else {
            setSelectedList([uploadedUrls[0]]);
          }
        }
        // Refresh library and switch tab
        setActiveTab('library');
        setCurrentPage(1);
        fetchMedia(1, searchQuery);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'LỖI KHI TẢI ẢNH LÊN CLOUDINARY');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('KHÔNG THỂ KẾT NỐI ĐẾN SERVER BACKEND');
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFiles(e.target.files);
    }
  };

  // Delete media item
  const handleDeleteMedia = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the image on click
    const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA ẢNH NÀY KHỎI THƯ VIỆN VÀ CLOUDINARY KHÔNG?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/media/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });

      if (response.ok) {
        const target = mediaItems.find(item => item.id === id);
        if (target) {
          setSelectedList(prev => prev.filter(url => url !== target.url));
        }
        setMediaItems(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error('LỖI KHI XÓA TẬP TIN');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedList.length > 0) {
      if (isMulti && onSelectMultiple) {
        onSelectMultiple(selectedList);
      } else if (onSelect) {
        onSelect(selectedList[0]);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-900 text-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden font-sans rounded-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">MEDIA SERVICE</span>
            <h3 className="text-base font-bold uppercase tracking-wide mt-0.5">
              CLOUDINARY RESOURCE PICKER {isMulti ? '(CHỌN NHIỀU ẢNH)' : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-900 bg-zinc-950 font-mono text-[10px] uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-6 py-3 cursor-pointer transition-all border-b-2 ${
              activeTab === 'library'
                ? 'border-white text-white font-semibold bg-zinc-900/20'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Thư viện hình ảnh
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-6 py-3 cursor-pointer transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-white text-white font-semibold bg-zinc-900/20'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Tải tập tin lên
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
          {activeTab === 'upload' ? (
            /* Upload Area */
            <div className="h-full flex flex-col justify-center">
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
                onClick={() => fileInputRef.current?.click()}
                className={`h-64 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-white bg-zinc-900/50'
                    : 'border-zinc-850 hover:border-zinc-500 bg-zinc-950'
                } p-10 text-center relative`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center space-y-3 font-mono text-[11px] text-zinc-400">
                    <Loader2 className="h-8 w-8 text-white animate-spin stroke-[1.5]" />
                    <p className="uppercase tracking-widest animate-pulse">UPLOADING ASSETS TO CLOUDINARY...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <UploadCloud className="h-10 w-10 text-zinc-600 stroke-[1.25]" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
                        KÉO THẢ ẢNH VÀO ĐÂY HOẶC CLICK ĐỂ TẢI LÊN
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1.5 lowercase">
                        supports jpg, png, webp. max 25 files at a time.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Library Area */
            <div className="space-y-4 h-full flex flex-col justify-between">
              
              {/* Search Control */}
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="TÌM KIẾM THEO TÊN FILE..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-none py-2 pl-9 pr-3 text-xs tracking-wider text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-500 uppercase font-mono"
                />
              </div>

              {/* Grid area */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-500 tracking-widest">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-550 mb-2" />
                  LOADING ASSET LIBRARY...
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-500 tracking-widest">
                  THƯ VIỆN HÌNH ẢNH TRỐNG
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {mediaItems.map((item) => {
                    const isSelected = selectedList.includes(item.url);
                    const selectedIndex = selectedList.indexOf(item.url);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectImage(item.url)}
                        onDoubleClick={handleConfirmSelection}
                        className={`group relative aspect-square border bg-zinc-900 cursor-pointer overflow-hidden select-none transition-all ${
                          isSelected
                            ? 'border-white ring-1 ring-white'
                            : 'border-zinc-850 hover:border-zinc-700'
                        }`}
                      >
                        {/* Display Image */}
                        <img
                          src={getOptimizedImageUrl(item.url)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top action delete */}
                        <button
                          onClick={(e) => handleDeleteMedia(item.id, e)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-black text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-900 hover:border-red-950 cursor-pointer"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* Selection check overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                            <span className="bg-white text-black px-1.5 py-0.5 border border-white font-mono text-[10px] font-bold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              {isMulti && selectedList.length > 1 && (
                                <span>{selectedIndex + 1}</span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Title metadata */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 truncate font-mono text-[8px] tracking-wide text-zinc-450 border-t border-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                          {item.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 font-mono text-[10px] tracking-widest text-zinc-400">
                  <span>TỔNG SỐ TRANG: {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-1 border border-zinc-850 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white cursor-pointer transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-white font-bold">TRANG {currentPage}</span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-1 border border-zinc-850 hover:border-white disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white cursor-pointer transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-zinc-900 bg-zinc-950 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="font-mono text-[9px] tracking-wider text-zinc-350 truncate max-w-sm sm:max-w-md uppercase">
            {selectedList.length > 0 ? (
              <span>
                ĐÃ CHỌN ({selectedList.length}{maxSelect ? `/${maxSelect}` : ''}): {selectedList.join(', ')}
              </span>
            ) : (
              'CHƯA CHỌN TẬP TIN'
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleConfirmSelection}
              disabled={selectedList.length === 0}
              className="flex-1 sm:flex-initial border border-white bg-white text-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-all rounded-none cursor-pointer"
            >
              Xác nhận chọn
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial border border-zinc-850 bg-black text-zinc-400 px-6 py-2.5 font-mono text-xs uppercase tracking-widest hover:text-white hover:border-zinc-650 transition-all rounded-none cursor-pointer"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
