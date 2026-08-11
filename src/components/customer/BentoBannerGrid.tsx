/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: 'air-jordan-1-chicago-lost-and-found',
    title: "SỰ TRỞ LẠI CỦA AIR JORDAN 1 'CHICAGO' LOST & FOUND",
    excerpt: 'Phối màu Chicago kinh điển tái sinh với hiệu ứng nứt nẻ Vintage cổ điển, mô phỏng chiếc hộp giày bị bỏ quên từ thập niên 80 tại các cửa hàng bán lẻ truyền thống.',
    category: 'HERITAGE',
    date: '20.07.2026',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDZCj_-uX_2YszW1UQTolrJrHBmyi5yV-ZLw8Y1NHMUG3e34awX1_72z3lme9xVTgMIVmbpzaZ6KCuk3sdVvmd7wZS07l3Scol_QggvWqxzI3_FrVC-DCk37z813LiXKmuXCWxFdRxRYwjI3ny7aU8v4bLfTbYmy16-_mHlhCR2X8Z10dEDeF9TkkJrKQASXvLLNLqLp-FqAERGcc15qtKabQiitu7g5k7FL6LZpYVT0O-dhsYhUpEgVxQUWgCLyCGfpD9MYN1-Dk'
  },
  {
    slug: 'travis-scott-jordan-1-low-olive',
    title: "TRAVIS SCOTT x AIR JORDAN 1 LOW 'MEDIUM OLIVE'",
    excerpt: 'Hợp tác đình đám giữa Travis Scott và Jordan tiếp tục bùng nổ với bản phối màu Olive đặc trưng kết hợp dấu Swoosh ngược kinh điển.',
    category: 'LIMITED RELEASE',
    date: '18.07.2026',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArZaY0ADWU11zkHKQsxrp2bGw1B5qKoDhoLQFLyIEVWoaW2yde5BnlP6m0IUb6AIH2YEiArQDiKlGp60CouXhzXkyO1HKdwqvgZjOZV6rbeuawl0lSsXs1dn_a3_1iFTqPDgkgJ3lcOU6cPv7JGfnhUClRC-MEJo0awC3di5a24GP6-RmIAKSDbDh55H22ZtTWLFQUNrrrs-TGz1pC1bsbI4irKSqHz-3WAz-RgT9DRi2OzaXHLsIDrat79HXoJsEXUxrpaC3na54'
  },
  {
    slug: 'air-jordan-release-calendar-july-2026',
    title: 'LỊCH PHÁT HÀNH AIR JORDAN THÁNG 7 NĂM 2026',
    excerpt: 'Tháng 7 năm 2026 hứa hẹn là một khoảng thời gian bùng nổ của giới sneakerheads toàn cầu với hàng loạt phiên bản Air Jordan huyền thoại rục rịch ra mắt.',
    category: 'SNEAKER NEWS',
    date: '15.07.2026',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWUTDFVNQ_ecm-U58rSQsrdZcg1ypNDYHT_MsJlioX4OJtjvI-eXCtJUpeYBLuQYxXSKXEMi9y0019_3owb2Fh3nOzEHu-Zx77KeI9a-IIheyqD4EGPvLp7bOpFDswUmSAeyCvj5zB04ZmgI-DITlgpDdTEizsaFKlEaATu6WliCl4N88BEtuNtG8kIIaSGwFwQZoJdsu5w6jQHVAp6Rft9frcoxddt5sAC3SRwuKmJHrQLZt9hRvDnXd3mEs-6VSIMmqNanFHFXE'
  }
];

export const BentoBannerGrid: React.FC = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-black" id="bento-editorial-section">
      <div className="flex flex-col items-start mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">
          EDITORIAL ARCHIVE
        </span>
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          SNKRS NEWS & STORIES
        </h3>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px] md:auto-rows-[350px]">
        {NEWS_ARTICLES.map((article, index) => {
          const isLarge = index === 0;
          return (
            <Link
              key={article.slug}
              to={`/news/${article.slug}`}
              className={`group relative border border-zinc-800 bg-black rounded-none overflow-hidden cursor-pointer flex flex-col justify-end ${
                isLarge ? 'col-span-1 md:col-span-2 row-span-1 md:row-span-2' : 'col-span-1 row-span-1'
              }`}
            >
              {/* Image wrap with static container and scaled hover effect */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Dark overlay that lightens on hover */}
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500 z-10" />
              </div>

              {/* Upper right arrow index link */}
              <div className="absolute top-4 right-4 z-20">
                <span className="h-8 w-8 rounded-none border border-zinc-800 bg-black/80 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </span>
              </div>

              {/* Editorial copy content */}
              <div className="p-6 z-20 space-y-2 max-w-xl">
                {/* Category & Date badge */}
                <div className="mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 bg-white/10 px-2 py-1 inline-block">
                    {article.category} // {article.date}
                  </span>
                </div>

                {/* Aggressive Title */}
                <h4 className={`font-display font-bold text-white uppercase leading-none tracking-tight mb-2 ${
                  isLarge ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'
                }`}>
                  {article.title}
                </h4>

                {/* Excerpt description */}
                <p className="font-sans text-xs sm:text-sm text-zinc-400 font-light leading-relaxed truncate-2-lines">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
