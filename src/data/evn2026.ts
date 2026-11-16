export interface ResidentialTier2026 {
  tier: number;
  rangeLabel: string;
  kwhSpan: number; // Infinity for the top tier
  basePrice: number; // VNĐ/kWh excl. VAT
}

export interface TouTariffRow2026 {
  voltageLabel: string;
  normal: number;
  peak: number;
  offPeak: number;
}

export interface AdminTariffRow2026 {
  groupLabel: string;
  voltageLabel: string;
  basePrice: number;
}

export type SurplusPolicyId = 'nd243_50' | 'nd58_20' | 'nd243_agree' | 'zero_export';

export interface SurplusPolicyPreset {
  id: SurplusPolicyId;
  label: string;
  shortLabel: string;
  maxExportPercent: number;
  description: string;
}

export const EVN_2026_META = {
  decision: '2892/QĐ-BCT',
  issuedDate: '31/10/2026',
  effectiveDate: '01/11/2026',
  avgRetailPrice: 2159.9037,
  sourceUrl: 'https://www.evn.com.vn/c3/evn-va-khach-hang/Bieu-gia-ban-le-dien-2-12.aspx',
};

// Cơ cấu biểu giá bán lẻ điện sinh hoạt 5 bậc mới theo QĐ 2892/QĐ-BCT (chưa gồm VAT)
export const RESIDENTIAL_TIERS_2026: ResidentialTier2026[] = [
  { tier: 1, rangeLabel: '0 – 100', kwhSpan: 100, basePrice: 1901 },
  { tier: 2, rangeLabel: '101 – 200', kwhSpan: 100, basePrice: 2289 },
  { tier: 3, rangeLabel: '201 – 400', kwhSpan: 200, basePrice: 2894 },
  { tier: 4, rangeLabel: '401 – 700', kwhSpan: 300, basePrice: 3456 },
  { tier: 5, rangeLabel: '> 700', kwhSpan: Infinity, basePrice: 3844 },
];

// Biểu giá bán lẻ điện cho Sản xuất theo QĐ 2892/QĐ-BCT (chưa gồm VAT)
export const PRODUCTION_TARIFFS_2026: TouTariffRow2026[] = [
  { voltageLabel: 'Từ 220 kV trở lên', normal: 1771, peak: 3110, offPeak: 1101 },
  { voltageLabel: 'Từ 35 kV đến dưới 220 kV', normal: 1792, peak: 3218, offPeak: 1123 },
  { voltageLabel: 'Trung áp (1 kV đến < 35 kV)', normal: 1814, peak: 3348, offPeak: 1166 },
  { voltageLabel: 'Hạ áp (Dưới 1 kV)', normal: 1966, peak: 3586, offPeak: 1274 },
];

// Biểu giá bán lẻ điện cho Kinh doanh, dịch vụ theo QĐ 2892/QĐ-BCT (chưa gồm VAT)
export const BUSINESS_TARIFFS_2026: TouTariffRow2026[] = [
  { voltageLabel: 'Từ 22 kV trở lên', normal: 2887, peak: 5025, offPeak: 1609 },
  { voltageLabel: 'Từ 6 kV đến dưới 22 kV', normal: 3108, peak: 5202, offPeak: 1829 },
  { voltageLabel: 'Hạ áp (Dưới 6 kV)', normal: 3152, peak: 5422, offPeak: 1918 },
];

// Biểu giá bán lẻ điện cho Hành chính sự nghiệp theo QĐ 2892/QĐ-BCT (chưa gồm VAT)
export const ADMIN_TARIFFS_2026: AdminTariffRow2026[] = [
  { groupLabel: 'Bệnh viện, cơ sở giáo dục', voltageLabel: 'Trung áp (> 1 kV)', basePrice: 1901 },
  { groupLabel: 'Bệnh viện, cơ sở giáo dục', voltageLabel: 'Hạ áp (≤ 1 kV)', basePrice: 2030 },
  { groupLabel: 'Chiếu sáng CC & Cơ quan HCSN', voltageLabel: 'Trung áp (> 1 kV)', basePrice: 2095 },
  { groupLabel: 'Chiếu sáng CC & Cơ quan HCSN', voltageLabel: 'Hạ áp (≤ 1 kV)', basePrice: 2181 },
];

export const DEFAULT_SURPLUS_BUYBACK_PRICE = 844.8; // VNĐ/kWh (chưa VAT, giá thị trường bình quân năm liền kề)

export const SURPLUS_POLICY_PRESETS: SurplusPolicyPreset[] = [
  {
    id: 'nd243_50',
    label: 'Nghị định 243/2026 (Bán tối đa 50% sản lượng)',
    shortLabel: 'NĐ 243/2026 · Tối đa 50%',
    maxExportPercent: 50,
    description: 'Từ 26/06/2026, ĐMTMN tự sản tự tiêu đấu nối lưới được bán tối đa 50% sản lượng phát tại đầu ra Inverter.',
  },
  {
    id: 'nd58_20',
    label: 'Nghị định 58/2025 (Bán tối đa 20% sản lượng)',
    shortLabel: 'NĐ 58/2025 · Tối đa 20%',
    maxExportPercent: 20,
    description: 'Mức trần 20% sản lượng phát ban đầu theo Nghị định 58/2025/NĐ-CP.',
  },
  {
    id: 'nd243_agree',
    label: 'Thỏa thuận vượt 50% đến 31/12/2030 (Không giới hạn)',
    shortLabel: 'Thỏa thuận >50% (đến 2030)',
    maxExportPercent: 100,
    description: 'Áp dụng khi lưới khu vực còn khả năng tiếp nhận và hai bên thỏa thuận tỷ lệ bán dư cao hơn 50% đến hết 2030.',
  },
  {
    id: 'zero_export',
    label: 'Không phát lưới / Bám tải 100% (Zero-Export 0%)',
    shortLabel: 'Zero-Export · 0%',
    maxExportPercent: 0,
    description: 'Hệ thống lắp đặt thiết bị chống phát ngược, chỉ dùng nội bộ và không bán điện dư lên lưới.',
  },
];

export const applyVat = (basePrice: number, vatRate: number): number => {
  return Math.round(basePrice * (1 + vatRate));
};

export const calculateKwhFromBill2026 = (bill: number, vatRate: number): number => {
  if (!bill || bill <= 0) return 0;
  let remainingBill = bill / (1 + vatRate);
  let totalKwh = 0;

  for (const tier of RESIDENTIAL_TIERS_2026) {
    if (!Number.isFinite(tier.kwhSpan)) {
      totalKwh += remainingBill / tier.basePrice;
      remainingBill = 0;
      break;
    }
    const tierMaxCost = tier.kwhSpan * tier.basePrice;
    if (remainingBill > tierMaxCost) {
      totalKwh += tier.kwhSpan;
      remainingBill -= tierMaxCost;
    } else {
      totalKwh += remainingBill / tier.basePrice;
      remainingBill = 0;
      break;
    }
  }
  return Math.round(totalKwh);
};
