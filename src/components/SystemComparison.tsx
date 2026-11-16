import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import {
  GitCompareArrows, Copy, Zap, Layout, Settings, TrendingUp, Award, ArrowRight
} from 'lucide-react';
import { PIN_DB, INV_DB, Province } from '../data/solarData';

export interface SystemConfigSpec {
  label: string;
  panelBrand: string;
  panelModel: string;
  panelWp: number;
  panelEff: number;
  panelTc: number;
  panelArea: number;
  panelQty: number;
  invBrand: string;
  invModel: string;
  invKw: number;
  invEff: number;
  invQty: number;
  investmentMillions: number;
}

interface SystemComparisonProps {
  province: Province;
  sunHours: number;
  elecPrice: number;
  pr: number;
  lossCable: number;
  lossDust: number;
  tempAvg: number;
  roofUsage: number;
  degradation: number;
  priceIncrease: number;
  currentMainConfig: SystemConfigSpec;
}

const PANEL_BRAND_OPTIONS = [
  { value: 'jinko', label: 'Jinko Solar' },
  { value: 'longi', label: 'LONGi Solar' },
  { value: 'trina', label: 'Trina Solar' },
  { value: 'canadian', label: 'Canadian Solar' },
  { value: 'ja', label: 'JA Solar' },
  { value: 'risen', label: 'Risen Energy' },
  { value: 'sunpower', label: 'SunPower' },
  { value: 'hanwha', label: 'Hanwha Q Cells' },
];

const INV_BRAND_OPTIONS = [
  { value: 'huawei', label: 'Huawei' },
  { value: 'sungrow', label: 'Sungrow' },
  { value: 'growatt', label: 'Growatt' },
  { value: 'sma', label: 'SMA' },
  { value: 'solis', label: 'SOLIS' },
  { value: 'fronius', label: 'Fronius' },
  { value: 'goodwe', label: 'GoodWe' },
  { value: 'deye', label: 'Deye' },
  { value: 'senergy', label: 'Senergy' },
];

export default function SystemComparison({
  province,
  sunHours,
  elecPrice,
  pr,
  lossCable,
  lossDust,
  tempAvg,
  roofUsage,
  degradation,
  priceIncrease,
  currentMainConfig,
}: SystemComparisonProps) {
  const defaultPanelA = PIN_DB.jinko[0];
  const defaultInvA = INV_DB.growatt[1] || INV_DB.growatt[0];

  const defaultPanelB = PIN_DB.longi.find(p => p.wp === 640) || PIN_DB.longi[0];
  const defaultInvB = INV_DB.huawei[1] || INV_DB.huawei[0];

  const [configA, setConfigA] = useState<SystemConfigSpec>({
    label: 'Cấu hình A (Tiêu chuẩn)',
    panelBrand: 'jinko',
    panelModel: defaultPanelA.model,
    panelWp: defaultPanelA.wp,
    panelEff: defaultPanelA.eff,
    panelTc: defaultPanelA.tc,
    panelArea: Number(((defaultPanelA.dai * defaultPanelA.rong) / 1e6).toFixed(2)),
    panelQty: 24,
    invBrand: 'growatt',
    invModel: defaultInvA.model,
    invKw: defaultInvA.kw,
    invEff: defaultInvA.eff,
    invQty: 1,
    investmentMillions: 140,
  });

  const [configB, setConfigB] = useState<SystemConfigSpec>({
    label: 'Cấu hình B (Hiệu suất cao)',
    panelBrand: 'longi',
    panelModel: defaultPanelB.model,
    panelWp: defaultPanelB.wp,
    panelEff: defaultPanelB.eff,
    panelTc: defaultPanelB.tc,
    panelArea: Number(((defaultPanelB.dai * defaultPanelB.rong) / 1e6).toFixed(2)),
    panelQty: 17,
    invBrand: 'huawei',
    invModel: defaultInvB.model,
    invKw: defaultInvB.kw,
    invEff: defaultInvB.eff,
    invQty: 1,
    investmentMillions: 162,
  });

  const calculateMetrics = (cfg: SystemConfigSpec) => {
    const tempLoss = (Math.abs(cfg.panelTc) * (tempAvg - 25)) / 100;
    const prEff =
      pr *
      (1 - lossCable / 100) *
      (1 - lossDust / 100) *
      (cfg.invEff / 100) *
      (1 - tempLoss);

    const csLapDat = (cfg.panelQty * cfg.panelWp) / 1000;
    const csDinh = csLapDat * prEff;
    const slNgay = csDinh * sunHours;
    const slNam = slNgay * 365;
    const specificYield = csLapDat > 0 ? Math.round(slNam / csLapDat) : 0;
    const totalInvKw = cfg.invKw * cfg.invQty;
    const dcAcRatio = csLapDat > 0 && totalInvKw > 0 ? csLapDat / totalInvKw : 0;
    const roofAreaNeeded =
      roofUsage > 0 ? (cfg.panelQty * cfg.panelArea) / (roofUsage / 100) : cfg.panelQty * cfg.panelArea;
    const tienNam1 = slNam * elecPrice;
    const totalInvestment = cfg.investmentMillions * 1e6;
    const costPerKwp = csLapDat > 0 ? cfg.investmentMillions / csLapDat : 0;

    let total25 = 0;
    let tn = tienNam1;
    let gp = 1;
    const cumulativeProfitSeries: number[] = [-totalInvestment / 1e6];
    let exactPaybackYear: number | null = totalInvestment <= 0 ? 0 : null;

    for (let i = 1; i <= 25; i++) {
      const annualSavings = tn * gp;
      const prevCumProfit = total25 - totalInvestment;
      total25 += annualSavings;
      const currentCumProfit = total25 - totalInvestment;

      if (exactPaybackYear === null && currentCumProfit >= 0 && annualSavings > 0) {
        exactPaybackYear = (i - 1) + Math.abs(prevCumProfit) / annualSavings;
      }

      cumulativeProfitSeries.push(Number((currentCumProfit / 1e6).toFixed(2)));
      gp *= 1 + priceIncrease / 100;
      tn *= 1 - degradation / 100;
    }

    const simplePayback = tienNam1 > 0 ? totalInvestment / tienNam1 : 0;
    const netProfit25 = total25 - totalInvestment;
    const irr = totalInvestment > 0 ? (netProfit25 / totalInvestment / 25) * 100 : 0;

    return {
      prEffPercent: prEff * 100,
      csLapDat,
      slNgay,
      slNam,
      specificYield,
      dcAcRatio,
      roofAreaNeeded,
      tienNam1,
      totalInvestment,
      costPerKwp,
      simplePayback,
      exactPaybackYear,
      netProfit25,
      irr,
      cumulativeProfitSeries,
    };
  };

  const metricsA = useMemo(
    () => calculateMetrics(configA),
    [configA, province, sunHours, elecPrice, pr, lossCable, lossDust, tempAvg, roofUsage, degradation, priceIncrease]
  );

  const metricsB = useMemo(
    () => calculateMetrics(configB),
    [configB, province, sunHours, elecPrice, pr, lossCable, lossDust, tempAvg, roofUsage, degradation, priceIncrease]
  );

  const updatePanelBrand = (
    setter: React.Dispatch<React.SetStateAction<SystemConfigSpec>>,
    brand: string
  ) => {
    const models = PIN_DB[brand];
    if (models && models.length > 0) {
      const first = models[0];
      setter(prev => ({
        ...prev,
        panelBrand: brand,
        panelModel: first.model,
        panelWp: first.wp,
        panelEff: first.eff,
        panelTc: first.tc,
        panelArea: Number(((first.dai * first.rong) / 1e6).toFixed(2)),
      }));
    } else {
      setter(prev => ({ ...prev, panelBrand: brand, panelModel: '' }));
    }
  };

  const updatePanelModel = (
    setter: React.Dispatch<React.SetStateAction<SystemConfigSpec>>,
    brand: string,
    modelName: string
  ) => {
    const found = PIN_DB[brand]?.find(p => p.model === modelName);
    if (found) {
      setter(prev => ({
        ...prev,
        panelModel: found.model,
        panelWp: found.wp,
        panelEff: found.eff,
        panelTc: found.tc,
        panelArea: Number(((found.dai * found.rong) / 1e6).toFixed(2)),
      }));
    }
  };

  const updateInvBrand = (
    setter: React.Dispatch<React.SetStateAction<SystemConfigSpec>>,
    brand: string
  ) => {
    const models = INV_DB[brand];
    if (models && models.length > 0) {
      const first = models[0];
      setter(prev => ({
        ...prev,
        invBrand: brand,
        invModel: first.model,
        invKw: first.kw,
        invEff: first.eff,
      }));
    } else {
      setter(prev => ({ ...prev, invBrand: brand, invModel: '' }));
    }
  };

  const updateInvModel = (
    setter: React.Dispatch<React.SetStateAction<SystemConfigSpec>>,
    brand: string,
    modelName: string
  ) => {
    const found = INV_DB[brand]?.find(i => i.model === modelName);
    if (found) {
      setter(prev => ({
        ...prev,
        invModel: found.model,
        invKw: found.kw,
        invEff: found.eff,
      }));
    }
  };

  const matchCapacityBToA = () => {
    const targetWp = configA.panelQty * configA.panelWp;
    if (targetWp > 0 && configB.panelWp > 0) {
      const qtyB = Math.max(1, Math.round(targetWp / configB.panelWp));
      setConfigB(prev => ({ ...prev, panelQty: qtyB }));
    }
  };

  const syncAFromMain = () => {
    setConfigA(prev => ({
      ...currentMainConfig,
      label: prev.label,
      investmentMillions:
        currentMainConfig.investmentMillions > 0
          ? currentMainConfig.investmentMillions
          : prev.investmentMillions,
    }));
  };

  const compareChartData: ChartData<'line'> = useMemo(() => {
    const labels = Array.from({ length: 26 }, (_, i) => `Năm ${i}`);
    return {
      labels,
      datasets: [
        {
          label: configA.label,
          data: metricsA.cumulativeProfitSeries,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          pointBackgroundColor: '#059669',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: ctx => (ctx.dataIndex === 0 || ctx.dataIndex === 25 || ctx.dataIndex % 5 === 0 ? 4 : 1.5),
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.25,
          fill: false,
        },
        {
          label: configB.label,
          data: metricsB.cumulativeProfitSeries,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: ctx => (ctx.dataIndex === 0 || ctx.dataIndex === 25 || ctx.dataIndex % 5 === 0 ? 4 : 1.5),
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.25,
          fill: false,
        },
        {
          label: 'Mốc hòa vốn (0 đ)',
          data: Array.from({ length: 26 }, () => 0),
          borderColor: 'rgba(100, 116, 139, 0.5)',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    };
  }, [configA.label, configB.label, metricsA.cumulativeProfitSeries, metricsB.cumulativeProfitSeries]);

  const compareChartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: item => item.datasetIndex !== 2,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: items => {
              const idx = items[0]?.dataIndex ?? 0;
              return idx === 0 ? 'Năm 0 (Đầu tư ban đầu)' : `Năm ${idx}`;
            },
            label: ctx => {
              const val = Number(ctx.parsed.y || 0);
              const sign = val >= 0 ? '+' : '';
              return `${ctx.dataset.label}: ${sign}${val.toLocaleString('vi-VN')} triệu đ`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            font: { size: 10 },
            autoSkip: false,
            maxRotation: 0,
            callback: (_v, idx) => (idx === 0 || idx === 25 || idx % 5 === 0 ? `N${idx}` : ''),
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: val => `${Number(val).toLocaleString('vi-VN')} tr`,
          },
          grid: {
            color: ctx => (ctx.tick.value === 0 ? 'rgba(100, 116, 139, 0.5)' : 'rgba(226, 232, 240, 0.7)'),
          },
        },
      },
    }),
    []
  );

  const renderConfigColumn = (
    cfg: SystemConfigSpec,
    setter: React.Dispatch<React.SetStateAction<SystemConfigSpec>>,
    metrics: ReturnType<typeof calculateMetrics>,
    variant: 'A' | 'B'
  ) => {
    const isA = variant === 'A';
    const accentBorder = isA ? 'border-emerald-200' : 'border-blue-200';
    const accentHeader = isA ? 'bg-emerald-50/80 border-emerald-100' : 'bg-blue-50/80 border-blue-100';
    const badgeColor = isA ? 'bg-emerald-600' : 'bg-blue-600';

    return (
      <div className={`rounded-2xl border-2 ${accentBorder} bg-white overflow-hidden shadow-sm`}>
        <div className={`px-4 py-3 border-b ${accentHeader} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <span className={`${badgeColor} text-white text-[10px] font-black px-2 py-0.5 rounded-md`}>
              {variant}
            </span>
            <input
              type="text"
              value={cfg.label}
              onChange={e => setter(prev => ({ ...prev, label: e.target.value }))}
              className="text-[13px] font-black text-slate-900 bg-transparent border-b border-transparent focus:border-slate-400 outline-none w-48 sm:w-56"
            />
          </div>
          {isA ? (
            <button
              type="button"
              onClick={syncAFromMain}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy size={11} /> Lấy từ máy tính chính
            </button>
          ) : (
            <button
              type="button"
              onClick={matchCapacityBToA}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight size={11} /> Cân bằng kWp theo A
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Panel Section */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Layout size={11} /> Tấm pin mặt trời (PV Module)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="fg mb-0">
                <label>Hãng tấm pin</label>
                <select
                  value={cfg.panelBrand}
                  onChange={e => updatePanelBrand(setter, e.target.value)}
                >
                  {PANEL_BRAND_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg mb-0">
                <label>Model tấm pin</label>
                <select
                  value={cfg.panelModel}
                  onChange={e => updatePanelModel(setter, cfg.panelBrand, e.target.value)}
                >
                  {PIN_DB[cfg.panelBrand]?.map(m => (
                    <option key={m.model} value={m.model}>
                      {m.model} ({m.wp}Wp)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <div className="fg mb-0">
                <label>Số tấm pin</label>
                <input
                  type="number"
                  min="1"
                  value={cfg.panelQty}
                  onChange={e =>
                    setter(prev => ({ ...prev, panelQty: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
              <div className="fg mb-0">
                <label>Hiệu suất (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cfg.panelEff}
                  onChange={e => setter(prev => ({ ...prev, panelEff: Number(e.target.value) }))}
                />
              </div>
              <div className="fg mb-0">
                <label>HS nhiệt (%/°C)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cfg.panelTc}
                  onChange={e => setter(prev => ({ ...prev, panelTc: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {/* Inverter Section */}
          <div className="pt-3 border-t border-dashed border-slate-200">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Settings size={11} /> Bộ biến tần (Inverter)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="fg mb-0">
                <label>Hãng Inverter</label>
                <select
                  value={cfg.invBrand}
                  onChange={e => updateInvBrand(setter, e.target.value)}
                >
                  {INV_BRAND_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg mb-0">
                <label>Model Inverter</label>
                <select
                  value={cfg.invModel}
                  onChange={e => updateInvModel(setter, cfg.invBrand, e.target.value)}
                >
                  {INV_DB[cfg.invBrand]?.map(m => (
                    <option key={m.model} value={m.model}>
                      {m.model} ({m.kw}kW)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <div className="fg mb-0">
                <label>CS Inverter (kW)</label>
                <input
                  type="number"
                  min="1"
                  value={cfg.invKw}
                  onChange={e =>
                    setter(prev => ({ ...prev, invKw: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
              <div className="fg mb-0">
                <label>Hiệu suất (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cfg.invEff}
                  onChange={e => setter(prev => ({ ...prev, invEff: Number(e.target.value) }))}
                />
              </div>
              <div className="fg mb-0">
                <label>Số lượng máy</label>
                <input
                  type="number"
                  min="1"
                  value={cfg.invQty}
                  onChange={e =>
                    setter(prev => ({ ...prev, invQty: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Investment & Quick Preview */}
          <div className="pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-3 items-end">
            <div className="fg mb-0">
              <label className="font-bold text-slate-800">Chi phí đầu tư (triệu đ)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={cfg.investmentMillions}
                onChange={e =>
                  setter(prev => ({
                    ...prev,
                    investmentMillions: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="font-bold"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-right">
              <div className="text-[9px] text-slate-400 font-bold uppercase">Tổng công suất dàn pin</div>
              <div className="text-base font-black text-slate-900">
                {metrics.csLapDat.toFixed(2)} kWp
              </div>
              <div className="text-[10px] text-slate-500">
                DC/AC: <strong>{metrics.dcAcRatio.toFixed(2)}</strong> · Mái ~{metrics.roofAreaNeeded.toFixed(0)} m²
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const diffYield = metricsB.specificYield - metricsA.specificYield;
  const diffSlNam = metricsB.slNam - metricsA.slNam;
  const paybackA = metricsA.exactPaybackYear ?? metricsA.simplePayback;
  const paybackB = metricsB.exactPaybackYear ?? metricsB.simplePayback;
  const diffPayback = paybackB - paybackA;
  const diffNet25 = metricsB.netProfit25 - metricsA.netProfit25;

  return (
    <section id="system-comparison-section" className="mt-8 scroll-mt-24">
      <div className="card border-2 border-slate-200 shadow-lg">
        <div className="card-head bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <GitCompareArrows size={18} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-wider">
                So sánh trực tiếp 2 cấu hình hệ thống (Panel & Inverter)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Đối chiếu song song hiệu suất hệ thống, sản lượng điện và thời gian hoàn vốn tại {province.ten} ({sunHours} h/ngày · Giá điện {elecPrice.toLocaleString('vi-VN')} đ/kWh)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg">
            <span>Nhiệt độ TB: <strong>{tempAvg}°C</strong></span>
            <span>·</span>
            <span>Suy giảm: <strong>{degradation}%/năm</strong></span>
            <span>·</span>
            <span>Tăng giá điện: <strong>{priceIncrease}%/năm</strong></span>
          </div>
        </div>

        <div className="card-body p-4 md:p-6 space-y-6 bg-slate-50/50">
          {/* Side-by-side Config Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {renderConfigColumn(configA, setConfigA, metricsA, 'A')}
            {renderConfigColumn(configB, setConfigB, metricsB, 'B')}
          </div>

          {/* Highlight Delta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Zap size={12} className="text-emerald-600" /> Hiệu suất riêng (Specific Yield)
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-emerald-700">A: {metricsA.specificYield.toLocaleString()}</span>
                <span className="text-xs font-bold text-blue-700">B: {metricsB.specificYield.toLocaleString()}</span>
              </div>
              <div className={`text-[11px] font-black mt-1.5 ${diffYield >= 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {diffYield === 0
                  ? 'Tương đương nhau (kWh/kWp/năm)'
                  : diffYield > 0
                  ? `Cấu hình B cao hơn +${diffYield} kWh/kWp/năm`
                  : `Cấu hình A cao hơn +${Math.abs(diffYield)} kWh/kWp/năm`}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-blue-600" /> Sản lượng điện năm 1
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-emerald-700">A: {Math.round(metricsA.slNam).toLocaleString()} kWh</span>
                <span className="text-xs font-bold text-blue-700">B: {Math.round(metricsB.slNam).toLocaleString()} kWh</span>
              </div>
              <div className={`text-[11px] font-black mt-1.5 ${diffSlNam >= 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {diffSlNam >= 0 ? '+' : ''}
                {Math.round(diffSlNam).toLocaleString()} kWh/năm ({metricsA.slNam > 0 ? `${((diffSlNam / metricsA.slNam) * 100).toFixed(1)}%` : '0%'})
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Award size={12} className="text-amber-500" /> Hoàn vốn thực tế
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-emerald-700">A: {paybackA.toFixed(1)} năm</span>
                <span className="text-xs font-bold text-blue-700">B: {paybackB.toFixed(1)} năm</span>
              </div>
              <div className={`text-[11px] font-black mt-1.5 ${diffPayback <= 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {Math.abs(diffPayback) < 0.05
                  ? 'Thời gian hoàn vốn tương đương'
                  : diffPayback < 0
                  ? `B hoàn vốn nhanh hơn ${Math.abs(diffPayback).toFixed(1)} năm`
                  : `A hoàn vốn nhanh hơn ${diffPayback.toFixed(1)} năm`}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Award size={12} className="text-emerald-600" /> Lợi nhuận ròng 25 năm
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-emerald-700">A: {Math.round(metricsA.netProfit25 / 1e6).toLocaleString()} tr</span>
                <span className="text-xs font-bold text-blue-700">B: {Math.round(metricsB.netProfit25 / 1e6).toLocaleString()} tr</span>
              </div>
              <div className={`text-[11px] font-black mt-1.5 ${diffNet25 >= 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {diffNet25 >= 0
                  ? `B lời hơn +${Math.round(diffNet25 / 1e6).toLocaleString()} triệu đ`
                  : `A lời hơn +${Math.round(Math.abs(diffNet25) / 1e6).toLocaleString()} triệu đ`}
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Table & 25-Year Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                Bảng đối chiếu thông số & hiệu quả tài chính
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500">
                      <th className="py-2 px-3 text-left font-bold">Chỉ tiêu</th>
                      <th className="py-2 px-3 text-right font-black text-emerald-700">Cấu hình A</th>
                      <th className="py-2 px-3 text-right font-black text-blue-700">Cấu hình B</th>
                      <th className="py-2 px-3 text-right font-bold">Chênh (B - A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Công suất lắp đặt (DC)</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsA.csLapDat.toFixed(2)} kWp</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsB.csLapDat.toFixed(2)} kWp</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {(metricsB.csLapDat - metricsA.csLapDat) >= 0 ? '+' : ''}
                        {(metricsB.csLapDat - metricsA.csLapDat).toFixed(2)} kWp
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Hiệu suất tấm pin / HS nhiệt</td>
                      <td className="py-2 px-3 text-right font-semibold">{configA.panelEff}% / {configA.panelTc}%</td>
                      <td className="py-2 px-3 text-right font-semibold">{configB.panelEff}% / {configB.panelTc}%</td>
                      <td className="py-2 px-3 text-right font-semibold text-blue-600">
                        {(configB.panelEff - configA.panelEff) >= 0 ? '+' : ''}
                        {(configB.panelEff - configA.panelEff).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Hiệu suất hệ thống (PR hiệu dụng)</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsA.prEffPercent.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsB.prEffPercent.toFixed(1)}%</td>
                      <td className={`py-2 px-3 text-right font-bold ${metricsB.prEffPercent >= metricsA.prEffPercent ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(metricsB.prEffPercent - metricsA.prEffPercent) >= 0 ? '+' : ''}
                        {(metricsB.prEffPercent - metricsA.prEffPercent).toFixed(2)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Tỷ lệ DC/AC Inverter</td>
                      <td className="py-2 px-3 text-right font-semibold">{metricsA.dcAcRatio.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">{metricsB.dcAcRatio.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {(metricsB.dcAcRatio - metricsA.dcAcRatio) >= 0 ? '+' : ''}
                        {(metricsB.dcAcRatio - metricsA.dcAcRatio).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Diện tích mái ước tính</td>
                      <td className="py-2 px-3 text-right">{metricsA.roofAreaNeeded.toFixed(1)} m²</td>
                      <td className="py-2 px-3 text-right">{metricsB.roofAreaNeeded.toFixed(1)} m²</td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {(metricsB.roofAreaNeeded - metricsA.roofAreaNeeded) >= 0 ? '+' : ''}
                        {(metricsB.roofAreaNeeded - metricsA.roofAreaNeeded).toFixed(1)} m²
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Sản lượng năm đầu</td>
                      <td className="py-2 px-3 text-right font-bold">{Math.round(metricsA.slNam).toLocaleString()} kWh</td>
                      <td className="py-2 px-3 text-right font-bold">{Math.round(metricsB.slNam).toLocaleString()} kWh</td>
                      <td className={`py-2 px-3 text-right font-bold ${diffSlNam >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {diffSlNam >= 0 ? '+' : ''}
                        {Math.round(diffSlNam).toLocaleString()} kWh
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Tiền tiết kiệm Năm 1</td>
                      <td className="py-2 px-3 text-right font-semibold">{(metricsA.tienNam1 / 1e6).toFixed(1)} tr</td>
                      <td className="py-2 px-3 text-right font-semibold">{(metricsB.tienNam1 / 1e6).toFixed(1)} tr</td>
                      <td className={`py-2 px-3 text-right font-bold ${metricsB.tienNam1 >= metricsA.tienNam1 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(metricsB.tienNam1 - metricsA.tienNam1) >= 0 ? '+' : ''}
                        {((metricsB.tienNam1 - metricsA.tienNam1) / 1e6).toFixed(1)} tr
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">Tổng đầu tư (Suất ĐT/kWp)</td>
                      <td className="py-2 px-3 text-right font-bold">{configA.investmentMillions} tr ({metricsA.costPerKwp.toFixed(1)} tr)</td>
                      <td className="py-2 px-3 text-right font-bold">{configB.investmentMillions} tr ({metricsB.costPerKwp.toFixed(1)} tr)</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-semibold">
                        {(configB.investmentMillions - configA.investmentMillions) >= 0 ? '+' : ''}
                        {(configB.investmentMillions - configA.investmentMillions).toFixed(0)} tr
                      </td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 font-bold text-slate-800">Hoàn vốn thực tế</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700">{paybackA.toFixed(1)} năm</td>
                      <td className="py-2 px-3 text-right font-black text-blue-700">{paybackB.toFixed(1)} năm</td>
                      <td className={`py-2 px-3 text-right font-black ${diffPayback <= 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {diffPayback >= 0 ? '+' : ''}
                        {diffPayback.toFixed(1)} năm
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/40">
                      <td className="py-2 px-3 font-bold text-slate-800">Lợi nhuận ròng 25 năm</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700">{Math.round(metricsA.netProfit25 / 1e6).toLocaleString()} tr</td>
                      <td className="py-2 px-3 text-right font-black text-blue-700">{Math.round(metricsB.netProfit25 / 1e6).toLocaleString()} tr</td>
                      <td className={`py-2 px-3 text-right font-black ${diffNet25 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {diffNet25 >= 0 ? '+' : ''}
                        {Math.round(diffNet25 / 1e6).toLocaleString()} tr
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">IRR dự kiến</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsA.irr.toFixed(1)}%/năm</td>
                      <td className="py-2 px-3 text-right font-bold">{metricsB.irr.toFixed(1)}%/năm</td>
                      <td className={`py-2 px-3 text-right font-bold ${metricsB.irr >= metricsA.irr ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(metricsB.irr - metricsA.irr) >= 0 ? '+' : ''}
                        {(metricsB.irr - metricsA.irr).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Biểu đồ so sánh lợi nhuận tích lũy 25 năm
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Cấu hình A
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-700">
                      <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> Cấu hình B
                    </span>
                  </div>
                </div>
                <div className="h-72">
                  <Line data={compareChartData} options={compareChartOptions} />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap justify-between gap-2">
                <span>Đường cắt trục 0 tr là thời điểm hòa vốn thực tế của từng phương án.</span>
                <span>Đơn vị: Triệu đồng (VNĐ)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
