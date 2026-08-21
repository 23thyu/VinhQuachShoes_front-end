/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export interface FeedbackItem {
  id: string | number;
  content: string;
  image_url: string;
  created_at?: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const CustomerArchives: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Multiplied items list to guarantee a seamless continuous infinite marquee loop if feedbacks exist
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

      {/* Content Rendering: Marquee vs Brutalist Empty State */}
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
        /* Infinite Horizontal Marquee Carousel */
        <div className="relative w-full overflow-hidden">
          {/* Left & Right subtle edge fade gradient */}
          <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />

          {/* Marquee Track */}
          <div className="animate-marquee flex gap-6 py-2">
            {displayItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="aspect-[9/16] w-[260px] sm:w-[300px] md:w-[340px] flex-shrink-0 relative group rounded-none border border-zinc-850 overflow-hidden bg-zinc-950 transition-all duration-300 hover:border-white"
              >
                {/* Image with grayscale hover effect */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={`Feedback ${item.id}`}
                    className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-mono text-zinc-700 text-xs uppercase">
                    NO IMAGE
                  </div>
                )}

                {/* Darkening desaturation overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

                {/* Text Overlay at bottom */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end space-y-2 z-10">
                  <span className="font-mono text-[9px] text-zinc-450 tracking-[0.25em] uppercase font-bold">
                    ARCHIVE #{String(item.id).padStart(4, '0')}
                  </span>
                  <p className="font-mono text-xs text-white uppercase tracking-wider line-clamp-3 leading-relaxed font-normal">
                    "{item.content}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};

export default CustomerArchives;
