/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll tracker over the 400vh scroll height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  // Preloading image frames state
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [useGiayFallback, setUseGiayFallback] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Map scroll progress to image frame indexes 1-99
  const imageIndex = useTransform(scrollYProgress, [0, 1], [1, 99]);

  // Parallax transform fadeout effects for text content past 20% scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const textYOffset = useTransform(scrollYProgress, [0, 0.2], ['0px', '-100px']);

  // Parallax background transform scaling and opacity
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '110%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);



  // Preload all 99 frames of the sneaker
  useEffect(() => {
    let loadedCount = 0;
    let failed = false;
    const tempImages: HTMLImageElement[] = [];

    for (let i = 1; i <= 99; i++) {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      
      // Try local assets first, fall back to /giay/ if needed
      img.src = useGiayFallback ? `/giay/frame_${num}.jpg` : `/assets/frame/frame_${num}.jpg`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount === 99) {
          imagesRef.current = tempImages;
          setImagesLoaded(true);
        }
      };

      img.onerror = () => {
        if (!useGiayFallback && !failed) {
          failed = true;
          setUseGiayFallback(true);
        } else {
          // Keep incrementing on total failures to avoid freezing the canvas
          loadedCount++;
          if (loadedCount === 99) {
            imagesRef.current = tempImages;
            setImagesLoaded(true);
          }
        }
      };

      tempImages.push(img);
    }
  }, [useGiayFallback]);

  // Draw image sequence onto canvas in sync with scroll changes
  useEffect(() => {
    if (!imagesLoaded || imagesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High DPI retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);

    const drawFrame = (index: number) => {
      const rounded = Math.min(99, Math.max(1, Math.round(index)));
      const img = imagesRef.current[rounded - 1];

      if (img && img.complete) {
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Aspect fit draw
        const imgRatio = img.width / img.height;
        let drawW = canvasW;
        let drawH = canvasW / imgRatio;

        if (drawH > canvasH) {
          drawH = canvasH;
          drawW = canvasH * imgRatio;
        }

        const x = (canvasW - drawW) / 2;
        const y = (canvasH - drawH) / 2;
        ctx.drawImage(img, x, y, drawW, drawH);
      }
    };

    // Initial render
    drawFrame(1);

    // Subscribe to framer motion transform value
    const unsubscribe = imageIndex.on('change', (latest) => {
      requestAnimationFrame(() => {
        drawFrame(latest);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [imagesLoaded, imageIndex]);

  return (
    <section
      ref={containerRef}
      className="relative h-[400vh] bg-black border-b border-zinc-900"
      id="hero-scroll-track"
    >
      {/* Sticky Frame Container */}
      <div className="sticky top-0 min-h-[100dvh] h-[100dvh] w-full flex flex-col justify-between py-8 md:py-0 md:justify-center items-center overflow-hidden">
        
        {/* Brutalist Parallax Typographic Background */}
        <motion.div
          style={{ y: bgY, scale: bgScale, opacity: bgOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-0"
        >
          <h1 className="font-display text-[15vw] font-black leading-none tracking-tighter text-zinc-900 text-center uppercase">
            FLIGHT
          </h1>
          <div className="hidden md:flex w-full max-w-7xl justify-between px-10 text-[10px] font-mono tracking-[0.3em] text-zinc-800">
            <span>KHỞI NGUỒN: 1985</span>
            <span>CHROME / THÉP / GRAIN</span>
            <span>BEAVERTON, OR</span>
          </div>
        </motion.div>

        {/* Layout Grid */}
        <div className="relative mx-auto flex flex-col justify-center items-center gap-4 md:grid md:grid-cols-2 md:gap-8 z-10 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mt-12 md:mt-0">
          
          {/* Left Details */}
          <motion.div
            style={{ opacity: textOpacity, y: textYOffset }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center text-center md:items-start md:text-left text-white space-y-2 md:space-y-4 max-w-sm md:max-w-lg px-2 md:px-0"
          >
            <div className="flex items-center gap-2 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-550">
              <span className="h-1.5 w-1.5 bg-white rounded-none" />
              JORDAN RETRO ARCHIVE
            </div>

            <h2 className="font-display text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight uppercase leading-none">
              AIR JORDAN 1 <br />
              <span className="text-zinc-400 font-light font-sans tracking-wide">CHICAGO</span>
            </h2>

            <p className="font-sans text-xs md:text-sm text-zinc-400 leading-relaxed font-light max-w-xs md:max-w-none">
              Phối màu Chicago kinh điển gắn liền với tên tuổi Michael Jordan năm 1984. Chất liệu da Tumbled nguyên bản, form dáng OG 1985 sắc nét.
            </p>

            <div className="pt-2 md:pt-4">
              <span className="font-mono text-xl text-white font-bold tracking-widest uppercase">
                {(190 * 25000).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </motion.div>

          {/* Right Presentation: Canvas for scroll-linked sequence */}
          <div className="relative flex flex-col items-center justify-center w-full h-[32vh] md:h-[500px] max-h-[240px] md:max-h-none">
            {/* Ambient background soft glow */}
            <div className="absolute top-1/2 left-1/2 h-[150px] w-[150px] md:h-[300px] md:w-[300px] -translate-x-1/2 -translate-y-1/2 bg-zinc-900/30 rounded-full blur-[60px] md:blur-[100px] z-0" />

            <canvas
              ref={canvasRef}
              className="z-10 w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)] cursor-ns-resize"
              id="hero-sequence-canvas"
            />

            {/* Micro details overlay */}
            <div className="relative md:absolute md:right-0 md:bottom-4 mt-2 md:mt-0 font-mono text-[8px] md:text-[9px] text-zinc-550 uppercase tracking-widest leading-relaxed text-center md:text-right select-none z-10">
              <span>MẪU: AJ1-XOAY-360</span><br />
              <span>CẢM BIẾN XOAY TƯƠNG TÁC</span>
            </div>
          </div>

        </div>

        {/* Scroll Helper */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="relative md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 mt-auto md:mt-0 flex flex-col items-center gap-1 z-10 opacity-70"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-650">CUỘN XUỐNG ĐỂ XOAY</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </motion.div>
        </motion.div>

      </div>

      {/* Visually distinct next section reveal trigger at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-40 flex items-center justify-center bg-black border-t border-zinc-900/80 z-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center space-y-1.5 font-mono"
        >
          <span className="text-[9px] text-zinc-550 tracking-[0.3em] uppercase block">TẤT CẢ SẢN PHẨM</span>
          <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
            SNEAKER COLLECTION
          </h3>
        </motion.div>
      </div>

    </section>
  );
};
