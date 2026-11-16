import React from 'react';
import { ShieldCheck, FileText, Zap, AlertCircle, CheckCircle2, ArrowUpRight, Scale } from 'lucide-react';
import { EVN_2026_META, DEFAULT_SURPLUS_BUYBACK_PRICE } from '../data/evn2026';

export default function SolarRegulations2026() {
  const procedureRows = [
    {
      connection: 'Không đấu nối lưới quốc gia',
      capacity: 'Dưới 100 kW',
      procedure: 'Không bắt buộc thủ tục thông báo phát triển nguồn điện',
      authority: 'Tự lắp đặt, đảm bảo an toàn điện & xây dựng',
    },
    {
      connection: 'Không đấu nối lưới quốc gia',
      capacity: 'Từ 100 kW trở lên',
      procedure: 'Gửi Thông báo phát triển nguồn điện trước khi vận hành',
      authority: 'UBND cấp xã nơi lắp đặt',
    },
    {
      connection: 'Đấu nối lưới hạ áp (< 1 kV)',
      capacity: 'Dưới 1 kW',
      procedure: 'Miễn thủ tục thông báo (quy mô siêu nhỏ)',
      authority: 'Tuân thủ an toàn thiết bị đấu nối',
    },
    {
      connection: 'Đấu nối lưới hạ áp (< 1 kV)',
      capacity: 'Từ 1 kW trở lên (tự dùng / có bán dư)',
      procedure: 'Gửi Thông báo theo Mẫu; ký thỏa thuận đấu nối & HĐ mua bán điện dư nếu phát lưới',
      authority: 'UBND cấp xã & Điện lực (EVN) địa phương',
    },
    {
      connection: 'Đấu nối lưới trung áp (≥ 1 kV)',
      capacity: 'Không đăng ký bán điện dư',
      procedure: 'Gửi Thông báo theo Mẫu kèm hồ sơ kỹ thuật chống phát ngược (Zero-Export)',
      authority: 'UBND cấp tỉnh / Sở Công Thương & EVN',
    },
    {
      connection: 'Đấu nối lưới trung áp (≥ 1 kV)',
      capacity: 'Có bán điện dư / Quy mô công nghiệp',
      procedure: 'Thỏa thuận đấu nối, hệ thống giám sát/cắt giảm công suất từ xa, PCCC & giấy phép điện lực (nếu thuộc diện)',
      authority: 'Sở Công Thương, EVN & Cơ quan PCCC',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Policy Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-emerald-700/50 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
            <Scale size={12} /> Cập nhật Pháp lý Việt Nam 2025 – 2026
          </span>
          <span className="text-[11px] text-slate-300 font-semibold">
            NĐ 58/2025/NĐ-CP · NĐ 243/2026/NĐ-CP · QĐ {EVN_2026_META.decision}
          </span>
        </div>
        <h4 className="text-lg md:text-xl font-black text-white leading-snug">
          Chính sách Điện mặt trời mái nhà & Biểu giá điện mới nhất 2026
        </h4>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-4xl">
          Từ ngày <strong>26/06/2026</strong>, <strong>Nghị định 243/2026/NĐ-CP</strong> chính thức sửa đổi, bổ sung Nghị định 57/2025/NĐ-CP và 58/2025/NĐ-CP, tháo gỡ nút thắt về tỷ lệ bán điện dư và đơn giản hóa thủ tục cho hộ gia đình, doanh nghiệp. Song song đó, <strong>Quyết định {EVN_2026_META.decision}</strong> (hiệu lực <strong>{EVN_2026_META.effectiveDate}</strong>) cơ cấu lại biểu giá điện sinh hoạt còn 5 bậc.
        </p>
      </div>

      {/* 3 Core Regulatory Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wide">
            <Zap size={16} className="text-emerald-600" />
            1. Nâng trần bán điện dư lên 50%
          </div>
          <p className="text-[12px] text-slate-700 leading-relaxed">
            Nghị định <strong>243/2026/NĐ-CP</strong> nâng tỷ lệ bán điện dư lên lưới từ tối đa <strong>20%</strong> (theo NĐ 58/2025) lên tối đa <strong>50% sản lượng phát</strong> tại đầu ra Inverter.
          </p>
          <div className="text-[11px] text-emerald-700 font-semibold bg-white/80 rounded-lg p-2 border border-emerald-100">
            Đến hết 31/12/2030: Được thỏa thuận tỷ lệ bán dư <strong>&gt; 50%</strong> nếu lưới điện khu vực còn khả năng tiếp nhận.
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wide">
            <ShieldCheck size={16} className="text-blue-600" />
            2. Giá mua điện dư theo thị trường
          </div>
          <p className="text-[12px] text-slate-700 leading-relaxed">
            Cơ chế giá FIT cố định 20 năm đã kết thúc. Giá mua sản lượng điện dư được xác định theo <strong>giá điện năng thị trường bình quân năm trước liền kề</strong> do NSMO công bố.
          </p>
          <div className="text-[11px] text-blue-800 font-semibold bg-white/80 rounded-lg p-2 border border-blue-100">
            Mức tham chiếu hiện hành: ~<strong>{DEFAULT_SURPLUS_BUYBACK_PRICE.toLocaleString('vi-VN')} đ/kWh</strong> (chưa VAT), không vượt trần khung giá điện mặt trời mặt đất.
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
            <FileText size={16} className="text-amber-600" />
            3. Miễn GP kinh doanh & DPPA
          </div>
          <p className="text-[12px] text-slate-700 leading-relaxed">
            Hộ gia đình lắp ĐMTMN tự sản tự tiêu dưới 100 kW khi bán điện dư được <strong>miễn / không phải điều chỉnh Giấy đăng ký hộ kinh doanh</strong> và miễn giấy phép hoạt động điện lực.
          </p>
          <div className="text-[11px] text-amber-800 font-semibold bg-white/80 rounded-lg p-2 border border-amber-100">
            Doanh nghiệp lớn có thể tham gia cơ chế mua bán điện trực tiếp <strong>DPPA</strong> theo NĐ 57/2025 & NĐ 243/2026.
          </div>
        </div>
      </div>

      {/* EVN 2026 Tariff Snapshot & Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            Điểm mới biểu giá EVN theo QĐ {EVN_2026_META.decision} ({EVN_2026_META.effectiveDate})
          </h5>
          <ul className="space-y-2 text-[12px] text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>Giá bán lẻ điện bình quân: <strong>{EVN_2026_META.avgRetailPrice.toLocaleString('vi-VN')} đ/kWh</strong> (chưa gồm VAT).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>Biểu giá sinh hoạt rút gọn từ 6 bậc xuống <strong>5 bậc</strong>: 1.901 (0–100 kWh), 2.289 (101–200), 2.894 (201–400), 3.456 (401–700) và 3.844 đ/kWh (&gt;700 kWh).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>Nhà trọ sinh viên / người lao động: cứ <strong>04 người</strong> được tính là 01 hộ để cấp định mức bậc thang.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>Nhóm Sản xuất (4 cấp điện áp) & Kinh doanh (3 cấp điện áp) áp dụng biểu 3 khung giờ (Bình thường, Cao điểm, Thấp điểm).</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600" />
            Chiến lược đầu tư hiệu quả theo cơ chế 2026
          </h5>
          <ul className="space-y-2 text-[12px] text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <span>Chênh lệch giá mua lưới (2.289 – 5.422 đ/kWh) cao gấp <strong>3 – 6 lần</strong> giá bán điện dư (~844,8 đ/kWh) → <strong>ưu tiên tự tiêu thụ ban ngày</strong> là sinh lời cao nhất.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <span>Hộ dùng nhiều vào buổi tối nên kết hợp <strong>Pin lưu trữ (Hybrid/BESS)</strong> để tích điện ban ngày dùng cho khung giờ tối thay vì bán dư giá thấp.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <span>Bắt buộc thực hiện <strong>Thông báo / Đăng ký</strong> với chính quyền địa phương và Điện lực theo quy mô để tránh bị xử phạt hành chính khi vận hành.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Registration & Notification Threshold Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Bảng tra cứu thủ tục thông báo & đấu nối theo Nghị định 243/2026/NĐ-CP
          </h5>
          <a
            href="https://www.evn.com.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            Cổng thông tin EVN <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Hình thức đấu nối</th>
                <th className="py-2.5 px-3">Quy mô công suất</th>
                <th className="py-2.5 px-3">Thủ tục cần thực hiện</th>
                <th className="py-2.5 px-3">Cơ quan tiếp nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {procedureRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{row.connection}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700 whitespace-nowrap">{row.capacity}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.procedure}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.authority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
