/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const FloatingSocial: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col gap-2 font-mono">
      {/* Facebook Link */}
      <a
        href="https://www.facebook.com/vinh.quach.3958"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 md:w-12 md:h-12 bg-black border border-zinc-800 text-white flex items-center justify-center rounded-none hover:bg-white hover:border-white transition-colors duration-200 shadow-2xl cursor-pointer p-2.5 group"
        title="FACEBOOK"
      >
        <img
          src="/logoFB.webp"
          alt="FB"
          className="w-full h-full object-contain filter invert group-hover:invert-0 transition-all duration-200"
        />
      </a>

      {/* Instagram Link */}
      <a
        href="https://www.instagram.com/kelvinnn_212/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 md:w-12 md:h-12 bg-black border border-zinc-800 text-white flex items-center justify-center rounded-none hover:bg-white hover:border-white transition-colors duration-200 shadow-2xl cursor-pointer p-2.5 group"
        title="INSTAGRAM"
      >
        <img
          src="/logoIG.webp"
          alt="IG"
          className="w-full h-full object-contain filter invert group-hover:invert-0 transition-all duration-200"
        />
      </a>
    </div>
  );
};
