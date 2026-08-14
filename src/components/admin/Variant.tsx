/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, RefreshCw, Trash2, Plus, Check, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { Product, BackendVariant } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getAdminHeaders } from '../../utils/authHeaders';

interface AttributeRow {
  name: string;
  values: string; // Comma separated e.g. "White, Black, Red"
  useInVariants: boolean;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const VariantManagement: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [activeTab, setActiveTab] = useState<'attributes' | 'variants'>('variants');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Tab 1: Attributes list
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [newAttrUse, setNewAttrUse] = useState(true);

  // Tab 2: Variants list
  const [variants, setVariants] = useState<BackendVariant[]>([]);
  
  // Bulk action inputs
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkStock, setBulkStock] = useState<number | ''>('');

  // Image Picker state for specific variant
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);

  // Fetch all products for selection dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=all`);
      if (response.ok) {
        const result = await response.json();
        const prodList = result.data || [];
        setProducts(prodList);
        if (prodList.length > 0 && !selectedProductId) {
          setSelectedProductId(prodList[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching products list:', error);
    }
  };

  // Load product details (including attributes) and current variants
  const loadProductData = async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    try {
      // 1. Fetch details
      const detailRes = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (detailRes.ok) {
        const result = await detailRes.json();
        const prod = result.data;
        setSelectedProduct(prod);
        
        // Parse attributes
        let parsedAttrs: AttributeRow[] = [];
        if (prod.attributes) {
          let rawAttrs = prod.attributes;
          if (typeof rawAttrs === 'string') {
            try {
              rawAttrs = JSON.parse(rawAttrs);
            } catch (e) {}
          }
          if (typeof rawAttrs === 'object') {
            parsedAttrs = Object.entries(rawAttrs).map(([name, val]: [string, any]) => {
              const vals = Array.isArray(val) ? val.join(', ') : String(val);
              return {
                name,
                values: vals,
                useInVariants: true // Default true for legacy attributes
              };
            });
          }
        }
        setAttributes(parsedAttrs);
      }

      // 2. Fetch variants
      const varRes = await fetch(`${API_BASE_URL}/products/${productId}/variants`);
      if (varRes.ok) {
        const result = await varRes.json();
        const rawVars = result.data || [];
        
        // Map backend details back to UI attributes
        const formattedVars = rawVars.map((v: any) => {
          const mappedAttributes: Record<string, string> = {};
          if (v.details) {
            v.details.forEach((d: any) => {
              const renamedKey = d.attribute_name.toLowerCase() === 'specification' ? 'size' : d.attribute_name;
              mappedAttributes[renamedKey] = d.attribute_value;
            });
          }
          return {
            id: v.id,
            product_id: v.product_id,
            price: v.price,
            quantity: v.quantity,
            image: v.image,
            attributes: mappedAttributes
          };
        });
        setVariants(formattedVars);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductData(selectedProductId);
    }
  }, [selectedProductId]);

  // Add attribute key to list (Local state, needs save to product)
  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim() || !newAttrValues.trim()) { toast.warning('VUI LÒNG NHẬP TÊN VÀ GIÁ TRỊ THUỘC TÍNH'); return; }
    
    // Check duplication
    if (attributes.find(a => a.name.toLowerCase() === newAttrName.trim().toLowerCase())) {
      toast.warning('THUỘC TÍNH NÀY ĐÃ ĐƯỢC ĐỊNH NGHĨA'); return;
    }

    const row: AttributeRow = {
      name: newAttrName.trim(),
      values: newAttrValues.trim(),
      useInVariants: newAttrUse
    };

    setAttributes(prev => [...prev, row]);
    setNewAttrName('');
    setNewAttrValues('');
  };

  const handleDeleteAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  // Save attributes structure to Product record in DB
  const handleSaveAttributes = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    
    // Format to JSON object
    const attrsJson: Record<string, string[]> = {};
    attributes.forEach(attr => {
      const vals = attr.values.split(',').map(v => v.trim()).filter(Boolean);
      attrsJson[attr.name] = vals;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/products/${selectedProductId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ attributes: attrsJson })
      });
      if (response.ok) {
        toast.success('ĐÃ LƯU CẤU TRÚC THUỘC TÍNH THÀNH CÔNG');
        loadProductData(selectedProductId);
      } else {
        toast.error('LỖI KHI LƯU THUỘC TÍNH');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Generate Cartesian combinations based on active attributes
  const handleGenerateCombinations = () => {
    const activeAttrs = attributes.filter(a => a.useInVariants);
    if (activeAttrs.length === 0) {
      toast.warning('VUI LÒNG CHỌN ÍT NHẤT MỘT THUỘC TÍNH CÓ BẬT CHẾ ĐỘ "DÙNG CHO BIẾN THỂ"'); return;
    }

    const keys = activeAttrs.map(a => a.name);
    const valueLists = activeAttrs.map(a => a.values.split(',').map(v => v.trim()).filter(Boolean));

    // Cartesian product helper
    const cartesian = (lists: string[][]): string[][] => {
      return lists.reduce<string[][]>((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
    };

    const combinations = cartesian(valueLists);
    
    // Create new variant objects
    const newVariants: BackendVariant[] = combinations.map(combo => {
      const mappedAttrs: Record<string, string> = {};
      keys.forEach((key, idx) => {
        mappedAttrs[key] = combo[idx];
      });

      // Check if variant combination already exists in loaded variants
      const existing = variants.find(v => {
        return keys.every(k => v.attributes?.[k] === mappedAttrs[k]);
      });

      if (existing) return existing;

      return {
        product_id: Number(selectedProductId),
        price: selectedProduct?.price || null,
        quantity: 10, // default stock count
        image: selectedProduct?.image || null,
        attributes: mappedAttrs
      };
    });

    setVariants(newVariants);
  };

  // Bulk set action
  const handleApplyBulk = () => {
    setVariants(prev => prev.map(v => ({
      ...v,
      ...(bulkPrice !== '' ? { price: Number(bulkPrice) / 25000 } : {}),
      ...(bulkStock !== '' ? { quantity: Number(bulkStock) } : {})
    })));
    setBulkPrice('');
    setBulkStock('');
  };

  const handleUpdateVariantField = (index: number, field: keyof BackendVariant, value: any) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleDeleteVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      const confirmed = await confirmModal('BẠN CÓ CHẮC CHẮN MUỐN XÓA BIẾN THỂ NÀY KHỎI HỆ THỐNG KHÔNG?');
      if (!confirmed) return;

      try {
        const response = await fetch(`${API_BASE_URL}/product-variants/${variant.id}`, {
          method: 'DELETE',
          headers: getAdminHeaders()
        });

        if (response.ok) {
          toast.success('XÓA BIẾN THỂ THÀNH CÔNG');
          setVariants(prev => prev.filter((_, i) => i !== index));
        } else {
          const err = await response.json();
          toast.error(err.message || 'LỖI KHI XÓA BIẾN THỂ');
        }
      } catch (error) {
        console.error('Error deleting variant:', error);
        toast.error('LỖI KẾT NỐI MẠNG KHI XÓA BIẾN THỂ');
      }
    } else {
      // Local only variant (new combination not saved yet)
      setVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleOpenImagePicker = (index: number) => {
    setActivePickerIndex(index);
    setIsPickerOpen(true);
  };

  const handleSelectVariantImage = (url: string) => {
    if (activePickerIndex !== null) {
      handleUpdateVariantField(activePickerIndex, 'image', url);
    }
  };

  // Save the full variants list to the backend in bulk
  const handleSaveVariants = async () => {
    if (!selectedProductId) return;
    setSaving(true);

    // Map frontend 'size' attribute back to backend 'specification' on save
    const mappedVariants = variants.map(v => {
      const mappedAttrs: Record<string, string> = {};
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([k, val]) => {
          const keyToSend = (k.toLowerCase() === 'size' || k.toLowerCase() === 'kích cỡ') ? 'specification' : k;
          mappedAttrs[keyToSend] = val as string;
        });
      }
      return {
        ...v,
        attributes: mappedAttrs
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/products/${selectedProductId}/variants/bulk`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ variants: mappedVariants })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'LƯU BIẾN THỂ THÀNH CÔNG');
        loadProductData(selectedProductId);
      } else {
        const err = await response.json();
        toast.error(err.message || 'LỖI KHI LƯU DANH SÁCH BIẾN THỂ');
      }
    } catch (error) {
      console.error('Error saving variants:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-4 border border-zinc-900">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Settings className="h-4.5 w-4.5 text-zinc-500" />
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">CẤU HÌNH BIẾN THỂ CHO SẢN PHẨM:</span>
        </div>
        <select
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            setVariants([]);
          }}
          className="bg-black border border-zinc-850 text-xs text-white font-mono font-bold focus:outline-none focus:border-zinc-500 rounded-none px-4 py-2 uppercase tracking-widest cursor-pointer w-full sm:w-72"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 font-mono text-[10px] uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('variants')}
          className={`flex items-center gap-2 px-6 py-3 cursor-pointer transition-all border-b-2 ${
            activeTab === 'variants'
              ? 'border-white text-white font-semibold bg-zinc-900/20'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Danh sách biến thể
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex items-center gap-2 px-6 py-3 cursor-pointer transition-all border-b-2 ${
            activeTab === 'attributes'
              ? 'border-white text-white font-semibold bg-zinc-900/20'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Định nghĩa thuộc tính
        </button>
      </div>

      {/* Main Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 font-mono text-[10px] text-zinc-550 tracking-widest">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
          LOADING INTEGRATED CONFIGURATIONS...
        </div>
      ) : activeTab === 'attributes' ? (
        /* Tab 1: Attributes Schema Definition */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Add Attribute form */}
          <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4 font-mono text-xs">
            <h3 className="text-[10px] text-white uppercase tracking-widest font-bold border-b border-zinc-900 pb-2">
              Thêm thuộc tính mới
            </h3>
            
            <form onSubmit={handleAddAttribute} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Tên thuộc tính</label>
                <input
                  type="text"
                  required
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="E.G. MÀU SẮC, KÍCH CỠ..."
                  className="w-full bg-black border border-zinc-850 p-2 text-white focus:outline-none focus:border-white uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-zinc-555 uppercase tracking-widest">Giá trị (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  required
                  value={newAttrValues}
                  onChange={(e) => setNewAttrValues(e.target.value)}
                  placeholder="E.G. WHITE, BLACK, ROYAL BLUE..."
                  className="w-full bg-black border border-zinc-850 p-2 text-white focus:outline-none focus:border-white uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="useInVariants"
                  checked={newAttrUse}
                  onChange={(e) => setNewAttrUse(e.target.checked)}
                  className="bg-black border border-zinc-850 h-4 w-4 cursor-pointer accent-white"
                />
                <label htmlFor="useInVariants" className="text-[9px] text-zinc-400 uppercase tracking-wider cursor-pointer">
                  Dùng làm biến thể sản phẩm
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 border border-zinc-800 bg-zinc-900 text-white py-2 font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer rounded-none"
              >
                <Plus className="h-4 w-4" /> THÊM VÀO BẢNG
              </button>
            </form>
          </div>

          {/* Current Attributes Table */}
          <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-6 space-y-4">
            <h3 className="font-mono text-[10px] text-white uppercase tracking-widest font-bold border-b border-zinc-900 pb-2 flex justify-between items-center">
              Cấu trúc thuộc tính hiện tại
              <button
                onClick={handleSaveAttributes}
                disabled={saving}
                className="flex items-center gap-1 border border-white bg-white text-black px-4 py-1 text-[9px] font-bold hover:bg-black hover:text-white hover:border-zinc-800 transition-all cursor-pointer rounded-none"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                LƯU CẤU TRÚC
              </button>
            </h3>

            {attributes.length === 0 ? (
              <div className="py-16 text-center font-mono text-xs text-zinc-650 tracking-wider">
                CHƯA ĐỊNH NGHĨA THUỘC TÍNH NÀO
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-xs text-zinc-400 border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[9px] text-zinc-550 uppercase tracking-widest">
                      <th className="pb-2 font-semibold">TÊN THUỘC TÍNH</th>
                      <th className="pb-2 font-semibold">CÁC GIÁ TRỊ KHẢ DỤNG</th>
                      <th className="pb-2 font-semibold text-center">BIẾN THỂ?</th>
                      <th className="pb-2 font-semibold text-center">XÓA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributes.map((attr, idx) => (
                      <tr key={idx} className="border-b border-zinc-950 hover:bg-zinc-900/10">
                        <td className="py-3 font-bold text-white uppercase">{attr.name}</td>
                        <td className="py-3 pr-4 text-zinc-450 uppercase">{attr.values}</td>
                        <td className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={attr.useInVariants}
                            onChange={(e) => {
                              setAttributes(prev => prev.map((a, i) => i === idx ? { ...a, useInVariants: e.target.checked } : a));
                            }}
                            className="bg-black border border-zinc-800 h-3.5 w-3.5 accent-white cursor-pointer"
                          />
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDeleteAttribute(idx)}
                            className="p-1 text-zinc-550 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Tab 2: Combinatorial Variants List */
        <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-6">
          
          {/* Action bar for variants generation & bulk operations */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/15 p-4 border border-zinc-900 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
            {/* Combo generator */}
            <div className="space-y-1">
              <p className="text-zinc-550">I. AUTOMATED BATCHING GENERATOR</p>
              <button
                onClick={handleGenerateCombinations}
                className="border border-white bg-white text-black px-4 py-2 font-mono text-[10px] font-bold tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 transition-all rounded-none cursor-pointer"
              >
                TỰ ĐỘNG SINH BIẾN THỂ TỪ THUỘC TÍNH
              </button>
            </div>

            {/* Bulk overrides values */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 text-left">
                <span className="block text-[8px] text-zinc-550">II. GIÁ THIẾT LẬP LOẠT</span>
                <input
                  type="number"
                  placeholder="GIÁ CHUNG..."
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-black border border-zinc-850 p-2 text-white text-[10px] focus:outline-none w-28 uppercase"
                />
              </div>

              <div className="space-y-1 text-left">
                <span className="block text-[8px] text-zinc-555">III. KHO THIẾT LẬP LOẠT</span>
                <input
                  type="number"
                  placeholder="KHO CHUNG..."
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-black border border-zinc-850 p-2 text-white text-[10px] focus:outline-none w-28 uppercase"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBulk}
                className="border border-zinc-800 bg-zinc-900 text-white px-4 py-2 font-bold hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer rounded-none text-[10px]"
              >
                CHẠY TÁC VỤ
              </button>
            </div>
          </div>

          {/* Variants Table */}
          {variants.length === 0 ? (
            <div className="py-20 text-center font-mono text-xs text-zinc-650 tracking-wider">
              CHƯA CÓ BIẾN THỂ NÀO ĐƯỢC TẠO. HÃY THIẾT LẬP THUỘC TÍNH RỒI TỰ ĐỘNG SINH BIẾN THỂ.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-xs text-zinc-400 border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[9px] text-zinc-550 uppercase tracking-widest">
                      <th className="pb-3 font-semibold">ẢNH BIẾN THỂ</th>
                      <th className="pb-3 font-semibold">CÁC THUỘC TÍNH</th>
                      <th className="pb-3 font-semibold">GIÁ OVERRIDE (VNĐ)</th>
                      <th className="pb-3 font-semibold">SỐ LƯỢNG KHO</th>
                      <th className="pb-3 font-semibold text-center">XÓA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950">
                    {variants.map((v, idx) => {
                      const specStr = Object.entries(v.attributes || {})
                        .map(([name, val]) => `${name}: ${val}`)
                        .join(' | ') || 'N/A';
                      
                      return (
                        <tr key={idx} className="hover:bg-zinc-900/10">
                          {/* Image picker for variant */}
                          <td className="py-3">
                            <div
                              onClick={() => handleOpenImagePicker(idx)}
                              className="h-10 w-10 border border-zinc-900 bg-zinc-950 flex items-center justify-center p-1 cursor-pointer hover:border-zinc-555 transition-colors overflow-hidden group relative"
                              title="Thay đổi ảnh cho riêng biến thể này"
                            >
                              {v.image ? (
                                <img src={v.image} alt="Variant" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-zinc-600 group-hover:text-white" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] text-white uppercase font-bold text-center">
                                EDIT
                              </div>
                            </div>
                          </td>

                          {/* Attribute combo string */}
                          <td className="py-3 pr-4 font-bold text-white uppercase text-[10px]">
                            {specStr}
                          </td>

                          {/* Override price */}
                          <td className="py-3">
                            <input
                              type="number"
                              value={v.price === null ? '' : v.price * 25000}
                              onChange={(e) => handleUpdateVariantField(idx, 'price', e.target.value === '' ? null : Number(e.target.value) / 25000)}
                              placeholder="Kế thừa giá gốc..."
                              className="bg-black border border-zinc-900 focus:border-zinc-700 p-1.5 text-xs text-white w-32 focus:outline-none uppercase font-mono"
                            />
                          </td>

                          {/* Quantity Stock */}
                          <td className="py-3">
                            <input
                              type="number"
                              value={v.quantity}
                              onChange={(e) => handleUpdateVariantField(idx, 'quantity', Number(e.target.value))}
                              className="bg-black border border-zinc-900 focus:border-zinc-700 p-1.5 text-xs text-white w-24 focus:outline-none uppercase font-mono"
                            />
                          </td>

                          {/* Delete row */}
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteVariant(idx)}
                              className="p-1.5 text-zinc-550 hover:text-red-400 cursor-pointer"
                              title="Loại bỏ biến thể"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Master save button */}
              <div className="flex justify-end pt-4 border-t border-zinc-900">
                <button
                  onClick={handleSaveVariants}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 border border-white bg-white text-black px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-all rounded-none cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ĐANG LƯU DỮ LIỆU...
                    </>
                  ) : (
                    <>
                      <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                      Lưu tất cả biến thể ({variants.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Cloudinary Image Picker modal */}
      <CloudinaryImagePicker
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setActivePickerIndex(null);
        }}
        onSelect={handleSelectVariantImage}
        selectedUrl={activePickerIndex !== null ? variants[activePickerIndex]?.image || undefined : undefined}
      />
    </div>
  );
};
export default VariantManagement;
