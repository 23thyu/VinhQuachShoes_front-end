/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  image: string;
  content: string[];
  author: string;
}

const ARTICLES_DATA: Article[] = [
  {
    slug: 'air-jordan-1-chicago-lost-and-found',
    title: "SỰ TRỞ LẠI CỦA AIR JORDAN 1 'CHICAGO' LOST & FOUND",
    category: 'HERITAGE',
    date: '20.07.2026',
    author: 'TASTE SKILL EDITORIAL',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDZCj_-uX_2YszW1UQTolrJrHBmyi5yV-ZLw8Y1NHMUG3e34awX1_72z3lme9xVTgMIVmbpzaZ6KCuk3sdVvmd7wZS07l3Scol_QggvWqxzI3_FrVC-DCk37z813LiXKmuXCWxFdRxRYwjI3ny7aU8v4bLfTbYmy16-_mHlhCR2X8Z10dEDeF9TkkJrKQASXvLLNLqLp-FqAERGcc15qtKabQiitu7g5k7FL6LZpYVT0O-dhsYhUpEgVxQUWgCLyCGfpD9MYN1-Dk',
    content: [
      "Phối màu Air Jordan 1 'Chicago' kinh điển đã chính thức quay trở lại thế giới sneaker dưới phiên bản đặc biệt 'Lost & Found'. Không chỉ dừng lại ở một đợt phát hành retro thông thường, phiên bản năm nay là sự phục dựng hoàn hảo câu chuyện lịch sử của đôi giày bóng rổ vĩ đại nhất mọi thời đại. Với hiệu ứng nứt nẻ Vintage chân thực ở cổ giày và chất liệu da cao cấp nhăn tự nhiên, đôi giày tái hiện diện mạo của những hộp giày nằm lưu kho suốt hàng chục năm từ thập niên 80.",
      "Cảm hứng thiết kế bắt nguồn từ câu chuyện về những cửa hàng giày thể thao truyền thống (Mom-and-Pop shops) vào cuối thế kỷ 20, nơi những đôi AJ1 nguyên bản bị xếp xó trong kho và lãng quên. Đi kèm với đôi giày là chiếc hộp đựng được làm cũ nhân tạo cùng biên lai mua hàng viết tay giả lập từ năm 1985, tạo nên sự xúc động mạnh mẽ cho những nhà sưu tầm lâu năm.",
      "Sự xuất hiện của Air Jordan 1 Chicago 'Lost & Found' một lần nữa khẳng định vị thế bất bại của thương hiệu Jordan trong nền văn hóa sát mặt đất. Đây không chỉ là một sản phẩm thời trang đường phố cao cấp, mà còn là một phần di sản bóng rổ được lưu giữ và truyền lại cho thế hệ tiếp theo."
    ]
  },
  {
    slug: 'travis-scott-jordan-1-low-olive',
    title: "TRAVIS SCOTT x AIR JORDAN 1 LOW 'MEDIUM OLIVE'",
    category: 'LIMITED RELEASE',
    date: '18.07.2026',
    author: 'TASTE SKILL EDITORIAL',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArZaY0ADWU11zkHKQsxrp2bGw1B5qKoDhoLQFLyIEVWoaW2yde5BnlP6m0IUb6AIH2YEiArQDiKlGp60CouXhzXkyO1HKdwqvgZjOZV6rbeuawl0lSsXs1dn_a3_1iFTqPDgkgJ3lcOU6cPv7JGfnhUClRC-MEJo0awC3di5a24GP6-RmIAKSDbDh55H22ZtTWLFQUNrrrs-TGz1pC1bsbI4irKSqHz-3WAz-RgT9DRi2OzaXHLsIDrat79HXoJsEXUxrpaC3na54',
    content: [
      "Sự kết hợp giữa rapper tài năng Travis Scott và thương hiệu Jordan tiếp tục viết nên một chương mới với phiên bản Air Jordan 1 Low 'Medium Olive'. Đây được đánh giá là một trong những sản phẩm có sức hút lớn nhất nửa cuối năm nay nhờ thiết kế phối màu rêu đặc trưng và kiểu dáng Swoosh ngược làm nên thương hiệu của Travis.",
      "Phần upper của đôi giày được hoàn thiện với chất liệu da nubuck cao cấp, tạo cảm giác mềm mịn cùng phối màu Olive trầm ấm tương phản sắc nét với các mảng da buồm Sail. Lưỡi gà mang logo Cactus Jack biểu tượng màu đỏ nổi bật tạo điểm nhấn phá cách mạnh mẽ cho tổng thể thiết kế tối giản.",
      "Bản phát hành giới hạn này nhanh chóng cháy hàng tại tất cả các hệ thống phân phối chính thức của Nike SNKRS. Sức ảnh hưởng của Travis Scott đối với thời trang đương đại một lần nữa được khẳng định, đưa Medium Olive trở thành mục tiêu săn lùng hàng đầu của giới mộ điệu."
    ]
  },
  {
    slug: 'air-jordan-release-calendar-july-2026',
    title: "LỊCH PHÁT HÀNH AIR JORDAN THÁNG 7 NĂM 2026",
    category: 'SNEAKER NEWS',
    date: '15.07.2026',
    author: 'TASTE SKILL EDITORIAL',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWUTDFVNQ_ecm-U58rSQsrdZcg1ypNDYHT_MsJlioX4OJtjvI-eXCtJUpeYBLuQYxXSKXEMi9y0019_3owb2Fh3nOzEHu-Zx77KeI9a-IIheyqD4EGPvLp7bOpFDswUmSAeyCvj5zB04ZmgI-DITlgpDdTEizsaFKlEaATu6WliCl4N88BEtuNtG8kIIaSGwFwQZoJdsu5w6jQHVAp6Rft9frcoxddt5sAC3SRwuKmJHrQLZt9hRvDnXd3mEs-6VSIMmqNanFHFXE',
    content: [
      "Tháng 7 năm 2026 hứa hẹn là một khoảng thời gian bùng nổ của giới sneakerheads toàn cầu với hàng loạt phiên bản Air Jordan huyền thoại rục rịch ra mắt. Từ những phối màu Retro cổ điển cho tới các dự án hợp tác độc quyền của các nhà thiết kế đình đám, Nike đang chuẩn bị những chiến lược ấn tượng nhất cho mùa hè này.",
      "Nổi bật nhất trong danh sách phát hành là sự quay lại của Air Jordan 3 'Black Cement' bản chuẩn chỉnh hình dáng OG, cùng với Air Jordan 4 phối màu sắc sảo mới lạ. Phân khúc Jordan 1 Low cũng chứng kiến sự đổ bộ của nhiều phối màu nguyên bản được mong đợi từ lâu.",
      "Các tín đồ thời trang hãy sẵn sàng để tham gia đợt bốc thăm trên ứng dụng Nike SNKRS và các cửa hàng đối tác uy tín. Hãy tiếp tục theo dõi lịch cập nhật chi tiết của chúng tôi để không bỏ lỡ cơ hội sở hữu những đôi giày tuyệt vời nhất."
    ]
  }
];

interface ArticleDetailProps {
  slug: string;
  onClose: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ slug, onClose }) => {
  const article = ARTICLES_DATA.find((a) => a.slug === slug);

  if (!article) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-black px-4">
        <div className="border border-zinc-800 bg-zinc-950 p-8 sm:p-12 max-w-md w-full text-center space-y-6 rounded-none">
          <div className="mx-auto w-12 h-12 border border-zinc-850 flex items-center justify-center text-zinc-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550">ERROR 404</p>
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">BÀI VIẾT KHÔNG TỒN TẠI</h2>
          </div>
          <p className="font-mono text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">
            Đường dẫn bài viết không đúng hoặc nội dung đã bị gỡ khỏi hệ thống tin tức lưu trữ.
          </p>
          <button
            onClick={onClose}
            className="border border-zinc-800 hover:border-white bg-black text-white px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer rounded-none"
          >
            ← QUAY LẠI CỬA HÀNG
          </button>
        </div>
      </section>
    );
  }

  return (
    <article className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation header */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <button
            onClick={onClose}
            className="border border-zinc-800 hover:border-white text-zinc-400 hover:text-white transition-colors uppercase font-mono text-[10px] px-4 py-2 rounded-none cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3 w-3" /> ← QUAY LẠI TIN TỨC
          </button>
          <span className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest">
            DIGITAL EDITORIAL ARCHIVE
          </span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">
            {article.category} // {article.date} // BY {article.author}
          </div>

          {/* Aggressive Massive Title */}
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none my-6">
            {article.title}
          </h1>

          {/* Hero Image in sharp wrapper */}
          <div className="w-full h-[300px] sm:h-[500px] border border-zinc-800 bg-zinc-950 overflow-hidden relative rounded-none">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Article Body Content */}
        <div className="max-w-3xl mx-auto py-8 space-y-6">
          {article.content.map((paragraph, index) => (
            <p
              key={index}
              className="font-sans text-lg text-zinc-300 leading-relaxed font-light first-letter:text-3xl first-letter:font-bold first-letter:font-display first-letter:float-left first-letter:mr-2"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bottom Back Button */}
        <div className="pt-6 border-t border-zinc-900 flex justify-center">
          <button
            onClick={onClose}
            className="border border-zinc-800 hover:border-white text-zinc-400 hover:text-white transition-colors uppercase font-mono text-[10px] px-6 py-2.5 rounded-none cursor-pointer"
          >
            ← QUAY LẠI TIN TỨC
          </button>
        </div>

      </div>
    </article>
  );
};
