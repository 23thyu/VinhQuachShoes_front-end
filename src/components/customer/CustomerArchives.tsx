/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

export interface FeedbackItem {
  id: string | number;
  content: string;
  image_url: string;
  created_at?: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

const getOptimizedImageUrl = (url: string | undefined | null): string => {
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

export const CustomerArchives: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/feedbacks`);
        if (response.ok) {
          const result = await response.json();
          const items = Array.isArray(result) 
            ? result 
            : (Array.isArray(result.data) ? result.data : []);
          setFeedbacks(items);
        } else {
          setFeedbacks([]);
        }
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Smooth Auto-Scrolling JS ticker loop
  useEffect(() => {
    if (isPaused || feedbacks.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      if (!container) return;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 2) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 1;
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isPaused, feedbacks]);

  // Duplicated items list to support smooth continuous scrolling loop
  const displayItems = feedbacks.length > 0
    ? (feedbacks.length < 5 
        ? [...feedbacks, ...feedbacks, ...feedbacks, ...feedbacks, ...feedbacks, ...feedbacks]
        : [...feedbacks, ...feedbacks, ...feedbacks, ...feedbacks])
    : [];

  return (
    <section className="bg-black py-20 border-b border-zinc-900 w-full overflow-hidden relative select-none" id="customer-archives-section">
      
      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-550 block mb-1">
              COMMUNITY & UNFILTERED REVIEWS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter text-white">
              CUSTOMER ARCHIVES
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>LIVE FEEDBACK STREAM</span>
          </div>
        </div>
      </div>

      {/* Content Rendering: Scrollable Marquee vs Brutalist Empty State */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center border border-dashed border-zinc-850 bg-black py-20">
            <span className="font-mono text-zinc-600 text-xs uppercase tracking-[0.2em] animate-pulse">
              LOADING ARCHIVES...
            </span>
          </div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center border border-zinc-850 bg-black py-20">
            <span className="font-mono text-zinc-600 text-xs uppercase tracking-[0.2em] text-center">
              NO ARCHIVES FOUND // CHƯA CÓ ĐÁNH GIÁ NÀO
            </span>
          </div>
        </div>
      ) : (
        /* Touch/Swipeable & Auto-scrolling Track Container */
        <div className="relative w-full overflow-hidden">
          {/* Left & Right subtle edge fade gradient */}
          <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />

          {/* Swipeable + Auto-scrolling Track */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            className="flex gap-6 py-2 px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing"
          >
            {displayItems.map((item, index) => {
              const hasText = item.content && item.content.trim() !== '';
              const imageUrl = getOptimizedImageUrl(item.image_url);

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="aspect-[9/16] w-[260px] sm:w-[300px] md:w-[340px] flex-shrink-0 relative group rounded-none border border-zinc-850 overflow-hidden bg-zinc-950 transition-all duration-300 hover:border-white snap-start"
                >
                  {/* Image in FULL COLOR at all times (NO grayscale) */}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Feedback ${item.id}`}
                      className="object-cover w-full h-full scale-100 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-mono text-zinc-700 text-xs uppercase">
                      NO IMAGE
                    </div>
                  )}

                  {/* Darkening overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />

                  {/* Text Overlay at bottom - ONLY IF CONTENT EXISTS */}
                  {hasText && (
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end space-y-2 z-10">
                      <span className="font-mono text-[9px] text-zinc-450 tracking-[0.25em] uppercase font-bold">
                        ARCHIVE #{String(item.id).padStart(4, '0')}
                      </span>
                      <p className="font-mono text-xs text-white uppercase tracking-wider line-clamp-3 leading-relaxed font-normal">
                        "{item.content}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
};

export default CustomerArchives;
