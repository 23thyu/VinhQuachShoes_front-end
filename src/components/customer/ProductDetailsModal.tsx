/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { X, Plus, Minus, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductDetailsModalProps {
  productId: string;
  onClose: () => void;
  onSelectProduct?: (id: string) => void;
}

interface APIProduct {
  id: number | string;
  name: string;
  price: number;
  description: string;
  sku: string;
  image: string;
  category_id: number;
  brand_id: number;
  quantity?: number;
  category?: { id: number; name: string } | string;
  brand?: { id: number; name: string } | string;
  product_images?: Array<{ id: number | string; image_url: string }>;
  variants: Array<{
    id: number | string;
    product_id: number | string;
    price: number | null;
    quantity: number;
    image: string | null;
    attributes: Record<string, string>;
  }>;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ productId, onClose, onSelectProduct }) => {
  const { toast } = useToast();
  const { currentUser, setActiveView } = useApp();
  const [product, setProduct] = useState<APIProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<APIProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Fetch product detail info including variants, secondary images, and related products
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      setSizeError(null);
      setSelectedAttrs({});
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
          throw new Error('Không thể tải thông tin sản phẩm');
        }
        const result = await response.json();
        const data: APIProduct = result.data;

        // Map variants' specification attribute to Size
        if (data.variants) {
          data.variants = data.variants.map((v) => {
            const newAttributes: Record<string, string> = {};
            if (v.attributes) {
              Object.entries(v.attributes).forEach(([k, val]) => {
                const renamedKey = k.toLowerCase() === 'specification' ? 'Size' : k;
                newAttributes[renamedKey] = val;
              });
            }
            return { ...v, attributes: newAttributes };
          });
        }

        setProduct(data);
        setActiveImage(data.image);

        // Fetch related products (same category)
        const catId = typeof data.category === 'object' && data.category ? data.category.id : data.category_id;
        if (catId) {
          const relRes = await fetch(`${API_BASE_URL}/products?category_id=${catId}&limit=5`);
          if (relRes.ok) {
            const relResult = await relRes.json();
            // Filter out current product
            const filtered = (relResult.data || []).filter((p: any) => String(p.id) !== String(productId));
            setRelatedProducts(filtered.slice(0, 3));
          }
        }
      } catch (err: any) {
        console.error('Error fetching product detail page:', err);
        setError(err.message || 'Lỗi hệ thống');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Fetch product images from backend
  useEffect(() => {
    let active = true;
    const fetchProductImages = async () => {
      if (!productId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/product-images?product_id=${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product images');
        }
        const result = await response.json();
        const images: string[] = (result.data || []).map((img: any) => img.image_url);
        
        if (!active) return;
        
        if (images.length > 0) {
          setProductImages(images);
          setActiveImage(images[0]);
        } else {
          // Graceful fallback to product.image
          const fallback = product?.image ? [product.image] : [];
          setProductImages(fallback);
          if (product?.image) {
            setActiveImage(product.image);
          }
        }
      } catch (error) {
        console.error('Error fetching product images:', error);
        if (!active) return;
        // Graceful fallback to product.image
        const fallback = product?.image ? [product.image] : [];
        setProductImages(fallback);
        if (product?.image) {
          setActiveImage(product.image);
        }
      }
    };

    fetchProductImages();

    return () => {
      active = false;
    };
  }, [productId, product?.image]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 bg-black flex items-center justify-center">
        <div className="text-center font-mono text-xs text-zinc-550 tracking-widest flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          ĐANG TẢI CHI TIẾT SẢN PHẨM...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="border border-zinc-800 bg-zinc-950 p-6 font-mono text-xs space-y-4 rounded-none">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-white uppercase tracking-widest">LỖI TẢI THÔNG TIN</p>
          <p className="text-zinc-500">{error || 'Không tìm thấy sản phẩm'}</p>
          <button
            onClick={onClose}
            className="w-full border border-white bg-white text-black py-2 font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-colors cursor-pointer rounded-none"
          >
            ĐÓNG QUAY LẠI TRANG CHỦ
          </button>
        </div>
      </div>
    );
  }

  // Check if variants exist
  const hasVariants = product.variants && product.variants.length > 0;

  // Group attributes dynamically
  const attributeKeys: string[] = hasVariants
    ? Array.from(new Set(product.variants.flatMap((v) => Object.keys(v.attributes || {}))))
    : [];

  const getUniqueValues = (key: string): string[] => {
    if (!hasVariants) return [];
    return Array.from(
      new Set(product.variants.map((v) => v.attributes?.[key]).filter(Boolean))
    ) as string[];
  };

  // Match current selected attributes to find active variant
  const activeVariant = hasVariants && Object.keys(selectedAttrs).length > 0
    ? product.variants.find((v) =>
        Object.entries(selectedAttrs).every(([key, val]) => v.attributes?.[key] === val)
      )
    : null;

  // Pricing & stock fallback for no-variant products
  const activePrice = hasVariants
    ? (activeVariant && activeVariant.price !== null ? activeVariant.price : product.price)
    : product.price;



  const categoryName =
    typeof product.category === 'object' && product.category
      ? product.category.name
      : String(product.category || 'GIÀY SNEAKER');

  const brandName =
    typeof product.brand === 'object' && product.brand
      ? product.brand.name
      : String(product.brand || 'JORDAN');

  const isAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role?.toLowerCase() === 'admin');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-black text-white relative font-sans">
      
      {/* Back to catalog link / button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onClose}
          className="flex items-center gap-2 border border-zinc-900 bg-zinc-950 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer rounded-none uppercase"
          id="detail-back-btn"
        >
          ← QUAY LẠI TRANG CHỦ
        </button>
      </div>

      {/* Nike Structural Grid Layout: 3 Columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Module 1: Image Gallery */}
        <div className="md:col-span-7 flex flex-col md:flex-row gap-4 w-full">
          {/* Thumbnails (The List) */}
          {productImages.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] w-full md:w-20 flex-shrink-0 pr-1 select-none">
              {productImages.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImage(imgUrl);
                    setSizeError(null);
                  }}
                  className={`h-16 w-16 md:w-full border flex-shrink-0 bg-black p-1 transition-all rounded-none ${
                    activeImage === imgUrl
                      ? 'border-white opacity-100 cursor-default'
                      : 'border-zinc-800 opacity-40 hover:opacity-100 transition-opacity cursor-pointer'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${i}`}
                    className="h-full w-full object-contain rounded-none"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 bg-zinc-950/30 overflow-hidden relative border border-zinc-900 aspect-square md:aspect-auto md:min-h-[450px] flex items-center justify-center rounded-none group">
            {activeImage && (
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full max-h-[400px] object-contain z-10 hover:scale-105 transition-transform duration-700 ease-out rounded-none"
                id="detail-main-image"
              />
            )}
          </div>
        </div>

        {/* Module 2 & 3: Product Info & Actions (Right Column) */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 font-mono text-[9px] tracking-widest text-zinc-550 uppercase">
                <span>SNEAKER ARCHIVE</span>
                <span>/</span>
                <span className="text-zinc-350">{categoryName}</span>
              </div>

              {/* Module 3: Admin Link */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    onClose();
                  }}
                  className="border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-[9px] tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-none uppercase"
                >
                  [ QUẢN TRỊ SẢN PHẨM ]
                </button>
              )}
            </div>

            {/* Title & Brand */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550 font-bold">{brandName}</span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-none mt-1">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-mono text-xl font-bold text-white">
                  {(activePrice * 25000).toLocaleString('vi-VN')} ₫
                </span>
                <span className="text-[10px] text-zinc-500 font-mono font-bold">VND</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-zinc-450 text-xs sm:text-sm font-light leading-relaxed border-t border-zinc-900 pt-4">
              {product.description}
            </p>

            {/* Dynamic Attributes: Render size grid conditionally based on variants existence */}
            {hasVariants && attributeKeys.map((key: string) => {
              const values = getUniqueValues(key);
              const isSizeKey = key.toLowerCase().includes('size') || key.toLowerCase().includes('kích cỡ') || key.toLowerCase().includes('specification');

              return (
                <div key={key} className="space-y-2 border-t border-zinc-900 pt-4">
                  <div className="flex justify-between items-center text-[10px] tracking-wider font-mono">
                    <span className="text-zinc-500 uppercase font-bold">CHỌN {key.toLowerCase() === 'specification' ? 'SIZE' : key}</span>
                    {isSizeKey && (
                      <button
                        onClick={() => setShowSizeChart(!showSizeChart)}
                        className="text-white hover:underline flex items-center gap-1 uppercase text-[9px] tracking-widest cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5" /> BẢNG SIZE
                      </button>
                    )}
                  </div>

                  {/* Size Chart Toggleable Drawer */}
                  {isSizeKey && showSizeChart && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="bg-black border border-zinc-850 p-2.5 text-[8px] font-mono grid grid-cols-5 text-center text-zinc-400 gap-1 rounded-none"
                    >
                      <div className="border-r border-zinc-800 pb-1 font-bold text-white">US</div>
                      <div className="border-r border-zinc-800 pb-1">8</div>
                      <div className="border-r border-zinc-800 pb-1">9</div>
                      <div className="border-r border-zinc-800 pb-1">10</div>
                      <div className="pb-1">11</div>
                      <div className="border-t border-r border-zinc-800 pt-1 font-bold text-white">UK</div>
                      <div className="border-t border-r border-zinc-800 pt-1">7</div>
                      <div className="border-t border-r border-zinc-800 pt-1">8</div>
                      <div className="border-t border-r border-zinc-800 pt-1">9</div>
                      <div className="border-t pt-1">10</div>
                      <div className="border-t border-r border-zinc-800 pt-1 font-bold text-white">EU</div>
                      <div className="border-t border-r border-zinc-800 pt-1">41</div>
                      <div className="border-t border-r border-zinc-800 pt-1">42.5</div>
                      <div className="border-t border-r border-zinc-800 pt-1">44</div>
                      <div className="border-t pt-1">45</div>
                    </motion.div>
                  )}

                  {/* Selector Size Grid Style */}
                  <div className="grid grid-cols-4 gap-2">
                    {values.map((val) => {
                      const isSelected = selectedAttrs[key] === val;
                      // Determine stock level if we select this attribute
                      const matchVar = product.variants.find((variantItem) =>
                        variantItem.attributes?.[key] === val &&
                        Object.entries(selectedAttrs).every(([k, v]) =>
                          k === key || variantItem.attributes?.[k] === v
                        )
                      );
                      const isOutOfStock = matchVar ? matchVar.quantity === 0 : false;

                      return (
                        <button
                          key={val}
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedAttrs((prev) => ({ ...prev, [key]: val }));
                            setSizeError(null);
                            // If variant has specific image, switch to it
                            const variantWithImage = product.variants.find((v) =>
                              v.attributes?.[key] === val && v.image
                            );
                            if (variantWithImage?.image) {
                              setActiveImage(variantWithImage.image);
                            }
                          }}
                          className={`border py-3 text-center font-mono text-xs transition-all flex items-center justify-center rounded-none cursor-pointer ${
                            isSelected
                              ? 'border-white bg-white text-black font-bold'
                              : 'border-zinc-800 bg-black text-zinc-300 hover:border-white'
                          } ${isOutOfStock ? 'opacity-35 line-through pointer-events-none' : ''}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  {isSizeKey && sizeError && (
                    <div className="text-red-500 font-mono text-[9px] tracking-widest font-black uppercase mt-1">
                      CẢNH BÁO: {sizeError}
                    </div>
                  )}
                </div>
              );
            })}


          </div>

          {/* Action Trigger Area (Social Commerce Inquiry Buttons) */}
          <div className="pt-4 border-t border-zinc-900">
            {hasVariants && activeVariant && activeVariant.quantity === 0 && (
              <div className="flex items-center gap-2 p-3 border border-red-950 bg-red-950/20 text-red-400 font-mono text-[10px] uppercase tracking-widest rounded-none mb-4">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>KÍCH THƯỚC NÀY TẠM THỜI HẾT HÀNG — HÃY INBOX ĐỂ ĐẶT TRƯỚC</span>
              </div>
            )}

            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest text-center mt-6">
              HÃY NHẮN TIN VỚI SHOP ĐỂ MUA HOẶC BIẾT THÊM CHI TIẾT VỀ SẢN PHẨM
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
              {/* Button 1 (Facebook - Primary) */}
              <a
                href="https://www.facebook.com/vinh.quach.3958"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-white text-black font-bold uppercase tracking-widest py-4 border border-white hover:bg-zinc-200 transition-colors w-full cursor-pointer font-mono text-xs rounded-none"
              >
                INBOX FACEBOOK
              </a>

              {/* Button 2 (Instagram - Secondary) */}
              <a
                href="https://www.instagram.com/kelvinnn_212/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-transparent text-white font-bold uppercase tracking-widest py-4 border border-zinc-700 hover:border-white transition-colors w-full cursor-pointer font-mono text-xs rounded-none"
              >
                INBOX INSTAGRAM
              </a>
            </div>

            <p className="text-center font-mono text-[8px] text-zinc-650 uppercase tracking-widest mt-4">
              HỖ TRỢ TƯ VẤN SIZE & SHIP COD TOÀN QUỐC 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Module 4: related products section "You Might Also Like" */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-zinc-900 pt-8 mt-12">
          <h3 className="font-display text-sm font-black uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
            <span>BẠN CÓ THỂ THÍCH</span>
            <span className="font-mono text-[9px] text-zinc-650 tracking-widest font-normal uppercase">(RECOMMENDED DISCOVERIES)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((p) => {
              const formattedPrice = (p.price * 25000).toLocaleString('vi-VN');
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct?.(String(p.id));
                    setSizeError(null);
                  }}
                  className="border border-zinc-900 bg-zinc-950 p-4 flex flex-col justify-between hover:border-zinc-600 transition-all cursor-pointer group rounded-none"
                >
                  <div className="h-32 flex items-center justify-center bg-black border border-zinc-950 p-2 overflow-hidden mb-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="font-sans text-xs font-bold text-white uppercase truncate">{p.name}</h4>
                    <p className="font-mono text-[10px] text-zinc-400">{formattedPrice} ₫</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetailsModal;
