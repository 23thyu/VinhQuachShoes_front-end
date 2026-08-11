/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Product } from '../../types';
import { Plus, Eye, Calendar } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  // Motion values for 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for high-end feel
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative position inside the card, normalized between -0.5 and 0.5
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="perspective-[1000px] w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        className="group relative flex flex-col w-full border border-zinc-850 bg-zinc-950/80 hover:bg-zinc-950 p-4 transition-all duration-300 cursor-pointer select-none"
        id={`product-card-${product.id}`}
      >
        {/* Release year and metadata - high-end look */}
        <div className="flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-550 uppercase z-10">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {product.releaseYear} EDITION
          </span>
          <span className="border border-zinc-850 px-1.5 py-0.5">
            {typeof product.category === 'object' && product.category ? (product.category as any).name : product.category}
          </span>
        </div>

        {/* Sneaker Canvas Area */}
        <div 
          className="relative h-52 sm:h-64 w-full my-4 flex items-center justify-center overflow-hidden z-10"
          style={{ transform: 'translateZ(30px)' }}
        >
          {/* Subtle Ambient circular background gradient */}
          <div className="absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/35 blur-3xl group-hover:bg-zinc-900/50 transition-colors" />

          {/* Product Image */}
          <motion.img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full max-h-[160px] sm:max-h-[200px] object-contain transition-transform duration-500 ease-out group-hover:scale-108 group-hover:-rotate-3 drop-shadow-[0_15px_20px_rgba(0,0,0,0.8)]"
          />

          {/* Eye hover trigger */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-350">
            <span className="flex items-center gap-1.5 border border-white bg-white text-black text-[10px] font-mono tracking-widest font-bold uppercase px-3 py-1.5 rounded-none">
              <Eye className="h-3.5 w-3.5" />
              XEM CHI TIẾT
            </span>
          </div>
        </div>

        {/* Details Area */}
        <div 
          className="flex flex-col gap-1 z-10 pt-2 border-t border-zinc-900"
          style={{ transform: 'translateZ(15px)' }}
        >
          <div className="flex justify-between items-start gap-4">
            <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase group-hover:text-zinc-300 transition-colors truncate max-w-[80%]">
              {product.name}
            </h4>
            <span className="font-mono text-sm font-medium tracking-wider text-zinc-350">
              {(product.price * 25000).toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <p className="font-mono text-[9px] text-zinc-600 mt-1 uppercase tracking-wider">
            SKU: {product.sku}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
