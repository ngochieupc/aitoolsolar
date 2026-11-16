import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, Mail, Globe, Info, Download, Image as ImageIcon, 
  Send, Printer, MapPin, Layout, Zap, Settings, TrendingUp, 
  BarChart3, CheckCircle2, X, Cloud, Sun, CloudRain, Wind,
  MessageCircle, ChevronRight, ChevronLeft, Calculator,
  Sparkles, AlertTriangle, Wrench, Activity, Droplets, RefreshCw, GitCompareArrows
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, BarController, LineController, Filler, ChartData, ChartOptions } from 'chart.js';
import { Chart, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { KVDATA, PIN_DB, INV_DB, Province, Panel, Inverter } from './data/solarData';
import {
  EVN_2026_META,
  RESIDENTIAL_TIERS_2026,
  PRODUCTION_TARIFFS_2026,
  BUSINESS_TARIFFS_2026,
  ADMIN_TARIFFS_2026,
  SURPLUS_POLICY_PRESETS,
  DEFAULT_SURPLUS_BUYBACK_PRICE,
  SurplusPolicyId,
  applyVat,
  calculateKwhFromBill2026,
} from './data/evn2026';
import SystemComparison from './components/SystemComparison';
import SolarRegulations2026 from './components/SolarRegulations2026';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, 
  Title, Tooltip, Legend, BarController, LineController, Filler
);

export default function App() {
  // --- State ---
  const [province, setProvince] = useState<Province>(KVDATA[0]);
  const [sunHours, setSunHours] = useState<number>(KVDATA[0].nang);
  const [customerType, setCustomerType] = useState<'dd' | 'cn'>('dd');
  
  const [panelBrand, setPanelBrand] = useState<string>('jinko');
  const [panelModel, setPanelModel] = useState<string>(PIN_DB['jinko'][0].model);
  const [panelWp, setPanelWp] = useState<number>(PIN_DB['jinko'][0].wp);
  const [panelEff, setPanelEff] = useState<number>(PIN_DB['jinko'][0].eff);
  const [panelTC, setPanelTC] = useState<number>(PIN_DB['jinko'][0].tc);
  const [panelArea, setPanelArea] = useState<number>(2.17);
  const [panelDai, setPanelDai] = useState<number>(2094);
  const [panelRong, setPanelRong] = useState<number>(1038);
  const [panelManual, setPanelManual] = useState<string>('');

  const [roofArea, setRoofArea] = useState<number>(100);
  const [roofUsage, setRoofUsage] = useState<number>(80);
  const [panelQty, setPanelQty] = useState<number>(36);
  const [systemCapacity, setSystemCapacity] = useState<number>(16.2);

  const [invBrand, setInvBrand] = useState<string>('huawei');
  const [invModel, setInvModel] = useState<string>(INV_DB['huawei'][0].model);
  const [invKw, setInvKw] = useState<number>(INV_DB['huawei'][0].kw);
  const [invEff, setInvEff] = useState<number>(INV_DB['huawei'][0].eff);
  const [invQty, setInvQty] = useState<number>(1);
  const [invManual, setInvManual] = useState<string>('');

  const [pr, setPr] = useState<number>(0.80);
  const [lossCable, setLossCable] = useState<number>(1.5);
  const [lossDust, setLossDust] = useState<number>(2.0);
  const [tempAvg, setTempAvg] = useState<number>(35);

  const [investment, setInvestment] = useState<number>(0);
  const [degradation, setDegradation] = useState<number>(0.5);
  const [priceIncrease, setPriceIncrease] = useState<number>(3);
  const [vatRate, setVatRate] = useState<number>(0.08);
  const [selectedBasePrice, setSelectedBasePrice] = useState<number | null>(2894);
  const [elecPrice, setElecPrice] = useState<number>(applyVat(2894, 0.08));

  // --- Self-consumption & Surplus Export (NĐ 58/2025 & NĐ 243/2026) ---
  const [selfConsumptionRate, setSelfConsumptionRate] = useState<number>(80);
  const [surplusPolicy, setSurplusPolicy] = useState<SurplusPolicyId>('nd243_50');
  const [surplusSellPrice, setSurplusSellPrice] = useState<number>(DEFAULT_SURPLUS_BUYBACK_PRICE);

  // --- New State for Demand ---
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [monthlyKwh, setMonthlyKwh] = useState<number>(0);

  // --- Battery Storage State ---
  const [hasBattery, setHasBattery] = useState<boolean>(false);
  const [batteryCapacity, setBatteryCapacity] = useState<number>(5);
  const [batteryDod, setBatteryDod] = useState<number>(80);
  const [batteryEfficiency, setBatteryEfficiency] = useState<number>(95);
  const [batteryCostPerKwh, setBatteryCostPerKwh] = useState<number>(5.5); // Triệu VNĐ/kWh
  const [batteryCRate, setBatteryCRate] = useState<number>(0.5); // C-rate (0.5C, 1C)
  const [nightConsumption, setNightConsumption] = useState<number>(40); // % điện dùng ban đêm

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPriceFeedback, setAiPriceFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newsRefreshNotice, setNewsRefreshNotice] = useState<string | null>(null);
  const [emailData, setEmailData] = useState({ name: '', to: '', project: '', note: '' });

  const [priceTab, setPriceTab] = useState(0);
  const [activeMainTab, setActiveMainTab] = useState<'calc' | 'news' | 'weather' | 'om-inv'>('calc');
  const [showFloating, setShowFloating] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [weatherDaily, setWeatherDaily] = useState<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    irradiationKwhM2: number;
    sunshineHours: number;
  }[]>([]);
  const [weatherLocationLabel, setWeatherLocationLabel] = useState<string>('Đang xác định...');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // --- AI Chatbot State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI của NGOCHIEUPC SOLAR. Tôi có thể giúp gì cho bạn về giải pháp năng lượng mặt trời?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isContactHidden, setIsContactHidden] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- AI Predictive Maintenance State ---
  const [envType, setEnvType] = useState<'urban' | 'industrial' | 'coastal' | 'rural'>('urban');
  const [daysSinceCleaning, setDaysSinceCleaning] = useState<number>(65);
  const [daysSinceInverterCheck, setDaysSinceInverterCheck] = useState<number>(150);
  const [historyRatios, setHistoryRatios] = useState<number[]>([1.0, 0.99, 0.97, 0.94, 0.91, 0.88]);
  const [manualActualKwh, setManualActualKwh] = useState<Record<number, number>>({});
  const [isForecastLoading, setIsForecastLoading] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [maintenanceForecast, setMaintenanceForecast] = useState<{
    overallStatus: 'TỐT' | 'CẦN CHÚ Ý' | 'CẦN BẢO TRÌ NGAY';
    riskScore: number;
    summary: string;
    panelCleaning: {
      urgency: string;
      recommendedDate: string;
      nextCycleDays: number;
      estimatedLossPercent: number;
      estimatedMonthlyLossVnd: number;
      reason: string;
      checklist: string[];
    };
    inverterInspection: {
      urgency: string;
      recommendedDate: string;
      nextCycleMonths: number;
      dcAcAssessment: string;
      reason: string;
      checklist: string[];
    };
    climateImpactNotes: string;
  } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartX === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;

    // Swipe right (positive diff) -> Hide
    if (diff > 50) {
      setIsContactHidden(true);
    }
    // Swipe left (negative diff) -> Show
    else if (diff < -50) {
      setIsContactHidden(false);
    }
    setDragStartX(null);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isChatOpen]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    const prevHistory = [...chatMessages];
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: prevHistory }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể kết nối AI');
      }
      setChatMessages(prev => [...prev, { role: 'ai', text: data.text || "Xin lỗi, tôi không thể trả lời lúc này." }]);
    } catch (error) {
      console.error("Chat AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, tôi gặp chút sự cố kỹ thuật. Bạn có thể liên hệ trực tiếp với tư vấn viên qua Zalo: 0908923886 để được hỗ trợ ngay nhé!' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const calcMainRef = useRef<HTMLDivElement>(null);

  const fetchWeatherByCoords = async (latitude: number, longitude: number, label: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,direct_radiation,diffuse_radiation,shortwave_radiation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,shortwave_radiation_sum,sunshine_duration&forecast_days=5&timezone=auto`
      );
      if (!res.ok) throw new Error("Open-Meteo API error");
      const data = await res.json();
      setWeather(data.current || null);
      setWeatherLocationLabel(label);

      if (data.daily && Array.isArray(data.daily.time)) {
        const dailyList = data.daily.time.map((dateStr: string, i: number) => {
          const radMj = Number(data.daily.shortwave_radiation_sum?.[i] ?? 0);
          const sunSec = Number(data.daily.sunshine_duration?.[i] ?? 0);
          return {
            date: dateStr,
            weatherCode: Number(data.daily.weather_code?.[i] ?? 0),
            tempMax: Number(data.daily.temperature_2m_max?.[i] ?? 0),
            tempMin: Number(data.daily.temperature_2m_min?.[i] ?? 0),
            precipitationSum: Number(data.daily.precipitation_sum?.[i] ?? 0),
            irradiationKwhM2: Number((radMj / 3.6).toFixed(2)),
            sunshineHours: Number((sunSec / 3600).toFixed(1)),
          };
        });
        setWeatherDaily(dailyList);
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      setWeatherError("Không thể tải dữ liệu thời tiết. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchWeatherByProvince = async (provinceName: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const cleanName = provinceName.replace(/^TP\.\s*/i, '');
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=vi&format=json`
      );
      const geoData = await geoRes.json();
      const hit = geoData?.results?.[0];
      if (hit && typeof hit.latitude === 'number' && typeof hit.longitude === 'number') {
        await fetchWeatherByCoords(hit.latitude, hit.longitude, provinceName);
      } else {
        await fetchWeatherByCoords(21.0285, 105.8542, `${provinceName} (Mặc định)`);
      }
    } catch (err) {
      console.error("Province geocoding error:", err);
      await fetchWeatherByCoords(21.0285, 105.8542, 'Hà Nội');
    }
  };

  const fetchWeather = () => {
    if ("geolocation" in navigator) {
      setWeatherLoading(true);
      setWeatherError(null);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchWeatherByCoords(latitude, longitude, 'Vị trí GPS của bạn');
        },
        async (err) => {
          console.warn("Geolocation unavailable, falling back to province:", err?.message);
          await fetchWeatherByProvince(province.ten);
        },
        { timeout: 6000 }
      );
    } else {
      fetchWeatherByProvince(province.ten);
    }
  };

  useEffect(() => {
    // Visitor counter simulation
    const base = parseInt(localStorage.getItem("vs_total") || "0");
    const newCount = base === 0 ? Math.floor(Math.random() * 3500) + 1200 : base + 1;
    localStorage.setItem("vs_total", newCount.toString());
    setVisitorCount(newCount);

    // Initial Weather fetch
    fetchWeather();

    // Scroll listener
    const handleScroll = () => {
      const y = window.scrollY;
      setShowFloating(y > 200);
      setShowBackToTop(y > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Helpers ---
  const formatVN = (val: number | string) => {
    if (val === undefined || val === null || val === '' || val === 0) return '';
    const num = typeof val === 'string' ? Number(val.replace(/\D/g, '')) : val;
    return num.toLocaleString('vi-VN');
  };

  const parseVN = (val: string) => {
    return Number(val.replace(/\D/g, ''));
  };

  // --- AI Price Suggestion ---
  const askAiForPrice = async () => {
    setIsAiLoading(true);
    setAiPriceFeedback(null);
    const tabLabels = ['Sinh hoạt (5 bậc)', 'Sản xuất / Công nghiệp (3 giá)', 'Kinh doanh / Dịch vụ (3 giá)', 'Hành chính sự nghiệp'];
    try {
      const res = await fetch('/api/ai/electricity-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerGroup: tabLabels[priceTab] || 'Sinh hoạt (5 bậc)',
          vatRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể kết nối AI');
      }
      const suggested = Number(data.suggestedPrice) || 0;
      const text = data.text || '';
      if (suggested > 0) {
        setSelectedBasePrice(null);
        setElecPrice(suggested);
        setAiPriceFeedback({ text, type: 'success' });
      } else {
        const priceMatch = text.match(/\d{1,}\.\d{3}|\d{4}/);
        if (priceMatch) {
          const fallbackPrice = Number(priceMatch[0].replace('.', ''));
          setSelectedBasePrice(null);
          setElecPrice(fallbackPrice);
        }
        setAiPriceFeedback({ text: text || 'Đã nhận phản hồi từ AI.', type: 'success' });
      }
    } catch (error) {
      console.error("AI Error:", error);
      setAiPriceFeedback({
        text: error instanceof Error ? error.message : "Không thể kết nối với AI để lấy giá điện. Vui lòng thử lại.",
        type: 'error',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Handlers ---
  const selectTariffBasePrice = (basePrice: number) => {
    setSelectedBasePrice(basePrice);
    setElecPrice(applyVat(basePrice, vatRate));
  };

  const handleVatRateChange = (newVat: number) => {
    setVatRate(newVat);
    if (selectedBasePrice !== null) {
      setElecPrice(applyVat(selectedBasePrice, newVat));
    }
    if (monthlyBill > 0) {
      const kwh = calculateKwhFromBill2026(monthlyBill, newVat);
      setMonthlyKwh(kwh);
      calculateCapacityFromDemand(kwh);
    }
  };

  const calculateKwhFromBill = (bill: number) => {
    return calculateKwhFromBill2026(bill, vatRate);
  };

  const handleMonthlyBillChange = (val: number) => {
    setMonthlyBill(val);
    const kwh = calculateKwhFromBill(val);
    setMonthlyKwh(kwh);
    calculateCapacityFromDemand(kwh);
  };

  const handleMonthlyKwhChange = (val: number) => {
    setMonthlyKwh(val);
    calculateCapacityFromDemand(val);
  };

  const calculateCapacityFromDemand = (kwh: number) => {
    if (kwh > 0 && sunHours > 0) {
      // Required Daily kWh = Monthly kWh / 30
      // Required kWp = Daily kWh / (Sun Hours * PR)
      const dailyKwh = kwh / 30;
      const requiredKwp = dailyKwh / (sunHours * pr);
      handleSystemCapacityChange(Number(requiredKwp.toFixed(2)));
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = KVDATA.find(k => k.ten === e.target.value);
    if (p) {
      setProvince(p);
      setSunHours(p.nang);
    }
  };

  const handlePanelBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brand = e.target.value;
    setPanelBrand(brand);
    if (brand && brand !== 'other' && PIN_DB[brand]?.length > 0) {
      updatePanelFromModel(brand, PIN_DB[brand][0].model);
    }
  };

  const handlePanelModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePanelFromModel(panelBrand, e.target.value);
  };

  const updatePanelFromModel = (brand: string, model: string) => {
    const d = PIN_DB[brand]?.find(m => m.model === model);
    if (d) {
      setPanelModel(model);
      setPanelWp(d.wp);
      setPanelDai(d.dai);
      setPanelRong(d.rong);
      setPanelEff(d.eff);
      setPanelTC(d.tc);
      const area = (d.dai * d.rong) / 1e6;
      setPanelArea(Number(area.toFixed(3)));
      
      // Recalculate based on current roof area
      const sl = Math.floor((roofArea * (roofUsage / 100)) / area);
      setPanelQty(sl);
      setSystemCapacity(Number(((sl * d.wp) / 1000).toFixed(2)));
    }
  };

  const handleInvBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brand = e.target.value;
    setInvBrand(brand);
    if (brand && brand !== 'other' && INV_DB[brand]?.length > 0) {
      updateInvFromModel(brand, INV_DB[brand][0].model);
    }
  };

  const handleInvModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateInvFromModel(invBrand, e.target.value);
  };

  const updateInvFromModel = (brand: string, model: string) => {
    const d = INV_DB[brand]?.find(m => m.model === model);
    if (d) {
      setInvModel(model);
      setInvKw(d.kw);
      setInvEff(d.eff);
    }
  };

  // --- Bidirectional Logic ---
  const handleRoofAreaChange = (val: number) => {
    setRoofArea(val);
    const sl = Math.floor((val * (roofUsage / 100)) / panelArea);
    setPanelQty(sl);
    setSystemCapacity(Number(((sl * panelWp) / 1000).toFixed(2)));
  };

  const handleRoofUsageChange = (val: number) => {
    setRoofUsage(val);
    const sl = Math.floor((roofArea * (val / 100)) / panelArea);
    setPanelQty(sl);
    setSystemCapacity(Number(((sl * panelWp) / 1000).toFixed(2)));
  };

  const handlePanelQtyChange = (val: number) => {
    setPanelQty(val);
    const dt = roofUsage > 0 ? Number(((val * panelArea) / (roofUsage / 100)).toFixed(1)) : 0;
    setRoofArea(dt);
    setSystemCapacity(Number(((val * panelWp) / 1000).toFixed(2)));
  };

  const handleSystemCapacityChange = (val: number) => {
    setSystemCapacity(val);
    if (val > 0 && panelWp > 0) {
      const sl = Math.round((val * 1000) / panelWp);
      setPanelQty(sl);
      const dt = roofUsage > 0 ? Number(((sl * panelArea) / (roofUsage / 100)).toFixed(1)) : 0;
      setRoofArea(dt);
    }
  };

  // --- Calculations ---
  const results = useMemo(() => {
    const tempLoss = Math.abs(panelTC) * (tempAvg - 25) / 100;
    const prEff = pr * (1 - lossCable / 100) * (1 - lossDust / 100) * (invEff / 100) * (1 - tempLoss);
    
    const csLapDat = (panelQty * panelWp) / 1000;
    const csDinh = csLapDat * prEff;
    const slNgay = csDinh * sunHours;
    const slNam = slNgay * 365;
    const co2 = slNam * 0.000533;
    const yield_val = csLapDat > 0 ? Math.round(slNam / csLapDat) : 0;
    const dcac = (csLapDat > 0 && invKw > 0) ? (csLapDat / (invKw * invQty)) : 0;

    // Battery Storage Calcs
    const usableBatteryCapacity = hasBattery ? (batteryCapacity * (batteryDod / 100) * (batteryEfficiency / 100)) : 0;
    const selfConsumedDirectKwh = slNam * (selfConsumptionRate / 100);
    const remainingDayKwh = Math.max(0, slNam - selfConsumedDirectKwh);
    const dailyKwhBattery = hasBattery
      ? Math.min(remainingDayKwh / 365, slNgay * (nightConsumption / 100), usableBatteryCapacity)
      : 0;
    const yearlyKwhBattery = dailyKwhBattery * 365;
    const totalBatteryCost = hasBattery ? (batteryCapacity * batteryCostPerKwh * 1e6) : 0;
    const batteryMaxPower = hasBattery ? (batteryCapacity * batteryCRate) : 0;

    // Self-consumption & Surplus Export (NĐ 58/2025 & NĐ 243/2026)
    const totalSelfUsedKwh = Math.min(slNam, selfConsumedDirectKwh + yearlyKwhBattery);
    const actualSelfUsePercent = slNam > 0 ? (totalSelfUsedKwh / slNam) * 100 : selfConsumptionRate;
    const rawSurplusKwh = Math.max(0, slNam - totalSelfUsedKwh);
    const policyPreset = SURPLUS_POLICY_PRESETS.find(p => p.id === surplusPolicy) || SURPLUS_POLICY_PRESETS[0];
    const maxExportAllowedKwh = slNam * (policyPreset.maxExportPercent / 100);
    const exportedKwh = Math.min(rawSurplusKwh, maxExportAllowedKwh);
    const curtailedKwh = Math.max(0, rawSurplusKwh - exportedKwh);

    const selfUseSavingsYear = totalSelfUsedKwh * elecPrice;
    const surplusRevenueYear = exportedKwh * Math.max(0, surplusSellPrice);
    const tienNam = selfUseSavingsYear + surplusRevenueYear;

    // Financial
    const totalInvestment = (investment * 1e6) + totalBatteryCost;
    const effectiveYearlySavings = tienNam;
    
    let total25 = 0;
    let tn = effectiveYearlySavings;
    let gp = 1;
    const yearlyCashFlow: {
      year: number;
      annualSavings: number;
      cumulativeSavings: number;
      cumulativeProfit: number;
    }[] = [
      {
        year: 0,
        annualSavings: 0,
        cumulativeSavings: 0,
        cumulativeProfit: -totalInvestment,
      }
    ];
    let exactPaybackYear: number | null = totalInvestment <= 0 ? 0 : null;

    for (let i = 1; i <= 25; i++) {
      const annualSavings = tn * gp;
      const prevCumProfit = yearlyCashFlow[i - 1].cumulativeProfit;
      total25 += annualSavings;
      const cumulativeProfit = total25 - totalInvestment;

      if (exactPaybackYear === null && cumulativeProfit >= 0 && annualSavings > 0) {
        const fraction = Math.abs(prevCumProfit) / annualSavings;
        exactPaybackYear = (i - 1) + fraction;
      }

      yearlyCashFlow.push({
        year: i,
        annualSavings,
        cumulativeSavings: total25,
        cumulativeProfit,
      });

      gp *= (1 + priceIncrease / 100);
      tn *= (1 - degradation / 100);
    }
    const payback = effectiveYearlySavings > 0 ? (totalInvestment / effectiveYearlySavings) : 0;
    const irr = totalInvestment > 0 ? ((total25 - totalInvestment) / totalInvestment / 25 * 100) : 0;

    return {
      csLapDat, csDinh, slNgay, slNam, tienNam, co2, yield_val, dcac,
      total25, payback, irr, totalInvestment, exactPaybackYear, yearlyCashFlow,
      usableBatteryCapacity, dailyKwhBattery, yearlyKwhBattery, totalBatteryCost, batteryMaxPower,
      selfConsumedDirectKwh, totalSelfUsedKwh, actualSelfUsePercent,
      exportedKwh, curtailedKwh, selfUseSavingsYear, surplusRevenueYear,
      maxExportPercent: policyPreset.maxExportPercent,
    };
  }, [panelQty, panelWp, pr, lossCable, lossDust, invEff, tempAvg, panelTC, sunHours, elecPrice, investment, degradation, priceIncrease, invKw, invQty, hasBattery, batteryCapacity, batteryDod, batteryEfficiency, batteryCostPerKwh, nightConsumption, batteryCRate, selfConsumptionRate, surplusPolicy, surplusSellPrice]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const slM = province.monthly.map(f => Math.round(f * results.slNam));
    const effectiveRate = results.slNam > 0 ? results.tienNam / results.slNam : elecPrice;
    const revM = slM.map(s => Math.round(s * effectiveRate / 1000));

    return {
      labels: months,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Sản lượng (kWh)',
          data: slM,
          backgroundColor: '#1565c0',
          yAxisID: 'y1',
          order: 2,
        },
        {
          type: 'line' as const,
          label: 'Doanh thu (nghìn đ)',
          data: revM,
          borderColor: '#f9a825',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#f9a825',
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y2',
          order: 1,
        }
      ],
    };
  }, [province, results.slNam, results.tienNam, elecPrice]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y1: { type: 'linear' as const, position: 'left' as const, ticks: { font: { size: 10 } } },
      y2: { type: 'linear' as const, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } } },
    },
  };

  // --- 25-Year Cumulative Profit Line Chart ---
  const profitChartData: ChartData<'line'> = useMemo(() => {
    const labels = results.yearlyCashFlow.map(d => `Năm ${d.year}`);
    const profitMillions = results.yearlyCashFlow.map(d => Number((d.cumulativeProfit / 1e6).toFixed(2)));
    const pointColors = results.yearlyCashFlow.map(d => d.cumulativeProfit >= 0 ? '#059669' : '#ef4444');

    return {
      labels,
      datasets: [
        {
          label: 'Lợi nhuận tích lũy (triệu đ)',
          data: profitMillions,
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
          pointBackgroundColor: pointColors,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: (ctx) => (ctx.dataIndex === 0 || ctx.dataIndex === 25 || ctx.dataIndex % 5 === 0) ? 4 : 2,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.25,
          fill: {
            target: 'origin',
            above: 'rgba(16, 185, 129, 0.14)',
            below: 'rgba(239, 68, 68, 0.12)',
          },
        },
        {
          label: 'Mốc hòa vốn (0 đ)',
          data: results.yearlyCashFlow.map(() => 0),
          borderColor: 'rgba(100, 116, 139, 0.5)',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        }
      ],
    };
  }, [results.yearlyCashFlow]);

  const ENV_LABELS: Record<'urban' | 'industrial' | 'coastal' | 'rural', string> = {
    urban: 'Đô thị / Bụi giao thông trung bình',
    industrial: 'KCN / Gần công trình / Nhiều bụi mịn',
    coastal: 'Ven biển / Hơi muối & độ ẩm cao',
    rural: 'Nông thôn / Thoáng, ít bụi',
  };

  const productionHistory = useMemo(() => {
    const currentMonthIdx = new Date().getMonth(); // 0..11
    return Array.from({ length: 6 }, (_, i) => {
      const mIdx = (currentMonthIdx - (5 - i) + 12) % 12;
      const expectedKwh = Math.max(1, Math.round(province.monthly[mIdx] * results.slNam));
      const defaultActual = Math.round(expectedKwh * (historyRatios[i] ?? 1));
      const actualKwh = manualActualKwh[i] !== undefined ? manualActualKwh[i] : defaultActual;
      const diffPercent = expectedKwh > 0 ? ((actualKwh - expectedKwh) / expectedKwh) * 100 : 0;
      return {
        index: i,
        monthLabel: `T${mIdx + 1}`,
        expectedKwh,
        actualKwh,
        diffPercent,
      };
    });
  }, [province, results.slNam, historyRatios, manualActualKwh]);

  const recent3Performance = useMemo(() => {
    const recent3 = productionHistory.slice(-3);
    const exp = recent3.reduce((s, x) => s + x.expectedKwh, 0);
    const act = recent3.reduce((s, x) => s + x.actualKwh, 0);
    return exp > 0 ? (act / exp) * 100 : 100;
  }, [productionHistory]);

  const handlePredictMaintenance = async () => {
    setIsForecastLoading(true);
    setForecastError(null);
    try {
      const res = await fetch('/api/ai/maintenance-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDate: new Date().toISOString().slice(0, 10),
          location: {
            province: province.ten,
            region: province.mien,
            sunHours,
            avgTemp: tempAvg,
            environmentType: envType,
            environmentLabel: ENV_LABELS[envType],
            currentWeather: weather || null,
          },
          system: {
            capacityKwp: Number(results.csLapDat.toFixed(2)),
            panelBrand: panelBrand.toUpperCase(),
            panelModel: panelModel || panelManual || 'N/A',
            panelQty,
            inverterBrand: invBrand.toUpperCase(),
            inverterModel: invModel || invManual || 'N/A',
            invKw,
            invQty,
            dcAcRatio: Number(results.dcac.toFixed(2)),
            dustLossPercent: lossDust,
            elecPrice,
            daysSinceCleaning,
            daysSinceInverterCheck,
          },
          productionHistory: productionHistory.map(p => ({
            monthLabel: p.monthLabel,
            expectedKwh: p.expectedKwh,
            actualKwh: p.actualKwh,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể phân tích dự báo bảo trì.');
      }
      setMaintenanceForecast(data);
    } catch (err) {
      console.error('Maintenance forecast error:', err);
      setForecastError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI.');
    } finally {
      setIsForecastLoading(false);
    }
  };

  const weatherForecastDetails = useMemo(() => {
    const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weatherDaily.map((d, idx) => {
      const dt = new Date(`${d.date}T00:00:00`);
      const dayLabel = idx === 0 ? 'Hôm nay' : weekdayNames[dt.getDay()];
      const dateShort = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const estimatedOutputKwh = Number((results.csDinh * d.irradiationKwhM2).toFixed(1));
      return {
        ...d,
        dayLabel,
        dateShort,
        chartLabel: `${dayLabel} (${dateShort})`,
        estimatedOutputKwh,
      };
    });
  }, [weatherDaily, results.csDinh]);

  const weatherForecastChartData = useMemo(() => {
    return {
      labels: weatherForecastDetails.map(d => d.chartLabel),
      datasets: [
        {
          type: 'line' as const,
          label: 'Bức xạ dự kiến (kWh/m²)',
          data: weatherForecastDetails.map(d => d.irradiationKwhM2),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.16)',
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          yAxisID: 'y1',
          order: 1,
        },
        {
          type: 'bar' as const,
          label: 'Sản lượng ước tính (kWh)',
          data: weatherForecastDetails.map(d => d.estimatedOutputKwh),
          backgroundColor: 'rgba(5, 150, 105, 0.75)',
          hoverBackgroundColor: '#059669',
          borderRadius: 8,
          barPercentage: 0.55,
          yAxisID: 'y2',
          order: 2,
        },
      ],
    };
  }, [weatherForecastDetails]);

  const weatherForecastChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          afterBody: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex;
            const d = idx !== undefined ? weatherForecastDetails[idx] : undefined;
            if (!d) return [];
            const estRev = Math.round(d.estimatedOutputKwh * elecPrice);
            return [
              `Giờ nắng hiệu dụng: ${d.sunshineHours} giờ`,
              `Tiết kiệm ước tính: ~${estRev.toLocaleString('vi-VN')} đ`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11, weight: 'bold' as const } },
        grid: { display: false },
      },
      y1: {
        type: 'linear' as const,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Bức xạ (kWh/m²)',
          font: { size: 10, weight: 'bold' as const },
          color: '#b45309',
        },
        ticks: { font: { size: 10 }, color: '#b45309' },
      },
      y2: {
        type: 'linear' as const,
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: 'Sản lượng (kWh)',
          font: { size: 10, weight: 'bold' as const },
          color: '#047857',
        },
        ticks: { font: { size: 10 }, color: '#047857' },
      },
    },
  }), [weatherForecastDetails, elecPrice]);

  const profitChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (item) => item.datasetIndex === 0,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            return idx === 0 ? 'Năm 0 (Đầu tư ban đầu)' : `Năm ${idx}`;
          },
          label: (ctx) => {
            const row = results.yearlyCashFlow[ctx.dataIndex];
            if (!row) return '';
            const sign = row.cumulativeProfit >= 0 ? '+' : '';
            return `Lợi nhuận tích lũy: ${sign}${Math.round(row.cumulativeProfit).toLocaleString('vi-VN')} đ (${(row.cumulativeProfit / 1e6).toFixed(1)} triệu)`;
          },
          afterLabel: (ctx) => {
            const row = results.yearlyCashFlow[ctx.dataIndex];
            if (!row || row.year === 0) return '';
            return `Tiết kiệm năm ${row.year}: ${Math.round(row.annualSavings).toLocaleString('vi-VN')} đ`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: false,
          callback: (_val, index) => (index === 0 || index === 25 || index % 5 === 0) ? `N${index}` : '',
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          font: { size: 10 },
          callback: (value) => `${Number(value).toLocaleString('vi-VN')} tr`,
        },
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? 'rgba(100, 116, 139, 0.45)' : 'rgba(226, 232, 240, 0.7)',
        },
      },
    },
  }), [results.yearlyCashFlow]);

  const getResultSummary = () => {
    return `NGOCHIEUPC SOLAR — KẾT QUẢ TÍNH TOÁN HỆ THỐNG ĐIỆN MẶT TRỜI
=======================================================
Khu vực     : ${province.ten}
Số tấm PIN  : ${panelQty} tấm × ${panelWp} Wp
Tấm pin     : ${panelBrand.toUpperCase()} / ${panelModel || panelManual || '—'}
Inverter    : ${invBrand.toUpperCase()} / ${invModel || invManual || '—'}
Hệ số PR    : ${(pr * 100).toFixed(0)}%
-------------------------------------------------------
Công suất lắp đặt   : ${results.csLapDat.toFixed(2)} kWp
Công suất đỉnh (AC) : ${results.csDinh.toFixed(2)} kWp
Điện năng / ngày    : ${results.slNgay.toFixed(2)} kWh
Điện năng / năm     : ${Math.round(results.slNam).toLocaleString()} kWh (Tự dùng ${results.actualSelfUsePercent.toFixed(0)}% · Bán dư ${Math.round(results.exportedKwh).toLocaleString()} kWh)
Specific Yield      : ${results.yield_val} kWh/kWp/năm
-------------------------------------------------------
Giá điện (VAT ${Math.round(vatRate * 100)}%)  : ${elecPrice.toLocaleString()} đ/kWh | Giá bán dư: ${surplusSellPrice.toLocaleString('vi-VN')} đ/kWh
Tiết kiệm / tháng   : ${Math.round(results.tienNam / 12).toLocaleString()} đồng
Tổng lợi ích / năm  : ${Math.round(results.tienNam).toLocaleString()} đồng (Tự dùng ${Math.round(results.selfUseSavingsYear).toLocaleString()} đ + Bán dư ${Math.round(results.surplusRevenueYear).toLocaleString()} đ)
Giảm phát thải CO₂  : ${results.co2.toFixed(2)} tấn/năm
-------------------------------------------------------
NGOCHIEUPC SOLAR | ĐT/Zalo: 0908.923.886 | https://www.facebook.com/ngochieupc/
"Giải pháp điện mặt trời tối ưu — Tận tâm & Bền vững"`;
  };

  const exportPDF = async () => {
    const element = document.getElementById('solar-report-content');
    if (!element) {
      alert("Không tìm thấy nội dung báo cáo!");
      return;
    }

    setIsAiLoading(true);
    try {
      // Give a tiny bit of time for any pending renders
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit A4
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth - 20; // 10mm margin each side
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save(`NGOCHIEUPC_Solar_BaoCao_${province.ten}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Lỗi xuất PDF: " + (error instanceof Error ? error.message : "Vui lòng thử lại"));
    } finally {
      setIsAiLoading(false);
    }
  };

  const exportImage = async () => {
    const element = document.getElementById('solar-report-content');
    if (!element) {
      alert("Không tìm thấy nội dung báo cáo!");
      return;
    }

    setIsAiLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `NGOCHIEUPC_Solar_KetQua_${province.ten}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Image Export Error:", error);
      alert("Lỗi tải ảnh: " + (error instanceof Error ? error.message : "Vui lòng thử lại"));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePrint = () => {
    // For iframes, window.print() might need to be called on the parent or handled specially
    // but usually window.print() works if the iframe has focus.
    window.focus();
    window.print();
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Kết quả tính toán điện mặt trời - ${emailData.project || 'Dự án Solar'}`);
    const summary = getResultSummary();
    const body = encodeURIComponent(`Kính gửi ${emailData.name},\n\n${emailData.note ? emailData.note + '\n\n' : ''}${summary}\n\n---\nEmail được tạo tự động từ công cụ tính toán của NGOCHIEUPC SOLAR (https://www.facebook.com/ngochieupc/)`);
    window.location.href = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
    setIsEmailModalOpen(false);
  };

  useEffect(() => {
    // Initial calculation trigger
    handleRoofAreaChange(100);
  }, []);

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/ngochieupc/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
              <img src="/assets/aistudio/NGOCHIEUPC-SOLAR-logo-mau-4-nen-trong-suot_ccb5f30d.png" alt="NGOCHIEUPC SOLAR" className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]" />
              <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
                <span className="text-[11px] font-black text-slate-800 tracking-wider leading-none uppercase">NGOCHIEUPC SOLAR</span>
                <span className="text-[9px] font-bold text-emerald-600 tracking-[0.15em] uppercase mt-1">Giải pháp năng lượng sạch</span>
              </div>
            </a>
          </div>
          
          <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setActiveMainTab('calc')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'calc' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>CÔNG CỤ TÍNH</button>
            <button onClick={() => setActiveMainTab('news')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'news' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>TIN TỨC & HD</button>
            <button 
              onClick={() => setActiveMainTab('om-inv')} 
              className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${activeMainTab === 'om-inv' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layout size={12} /> O&M INVERTER <Zap size={10} className="text-yellow-400 fill-yellow-400" />
            </button>
            <a 
              href="https://cisolar.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-2 px-4 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            >
              <Calculator size={12} /> TÍNH TOÁN ĐIỆN
            </a>
            <button onClick={() => setActiveMainTab('weather')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'weather' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>THỜI TIẾT</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end border-l border-slate-200 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hotline 24/7</span>
              <a href="tel:0908923886" className="text-emerald-600 font-black text-sm">0908.923.886</a>
            </div>
            <button className="lg:hidden p-2 text-slate-600"><Layout size={24} /></button>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-slate-100 flex p-2 gap-2 overflow-x-auto no-scrollbar sticky top-20 z-40 shadow-sm">
        <button onClick={() => setActiveMainTab('calc')} className={`flex-shrink-0 py-2 px-4 rounded-lg text-[10px] font-black transition-all ${activeMainTab === 'calc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>CÔNG CỤ TÍNH</button>
        <button onClick={() => setActiveMainTab('news')} className={`flex-shrink-0 py-2 px-4 rounded-lg text-[10px] font-black transition-all ${activeMainTab === 'news' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>TIN TỨC</button>
        <button 
          onClick={() => setActiveMainTab('om-inv')} 
          className={`flex-shrink-0 py-2 px-4 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${activeMainTab === 'om-inv' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}
        >
          O&M INVERTER <Zap size={8} className="text-yellow-400 fill-yellow-400" />
        </button>
        <a 
          href="https://cisolar.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-shrink-0 py-2 px-4 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 bg-slate-50 text-slate-500 hover:text-slate-700"
        >
          <Calculator size={10} /> TÍNH TOÁN ĐIỆN
        </a>
        <button onClick={() => setActiveMainTab('weather')} className={`flex-shrink-0 py-2 px-4 rounded-lg text-[10px] font-black transition-all ${activeMainTab === 'weather' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>THỜI TIẾT</button>
      </div>

      {/* Hero */}
      <section className="bg-hero-gradient py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, white 35px, white 70px)' }}></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-red-500-15 border border-red-500-30 rounded-full px-3 py-1 text-red-400 text-[10px] font-bold mb-4 animate-pulse">
            ★ Cập nhật giá điện QĐ {EVN_2026_META.decision} ({EVN_2026_META.effectiveDate}) & Quy định ĐMT 2026
          </div>
          <h1 className="text-white font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
            Tính toán hệ thống<br /><span className="text-red-500">điện mặt trời</span> chuyên nghiệp
          </h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
            Nhập bất kỳ thông số nào — hệ thống tự động tính toán ngược/xuôi tất cả các dữ liệu liên quan. Dữ liệu bức xạ NASA POWER 63 tỉnh thành.
          </p>
          <div className="flex flex-wrap gap-2">
            {["63 tỉnh thành", "Tính 2 chiều", "Dân dụng & CN", "Giá điện EVN", "Xuất PDF/Ảnh"].map(tag => (
              <span key={tag} className="bg-white-5 border border-white-10 rounded-full px-3 py-1 text-neutral-400 text-[11px]">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {activeMainTab === 'weather' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card border-2 border-emerald-100 shadow-emerald-500-5">
              <div className="card-head bg-emerald-50 border-b-2 border-emerald-100 flex-wrap gap-3">
                <Sun size={18} className="text-emerald-600" />
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-black text-slate-800 uppercase tracking-wider">Dashboard Thời tiết & Quang năng thời gian thực</h3>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> Khu vực: <strong>{weatherLocationLabel}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={KVDATA.some(p => p.ten === weatherLocationLabel) ? weatherLocationLabel : ''}
                    onChange={e => {
                      if (e.target.value) fetchWeatherByProvince(e.target.value);
                    }}
                    className="text-[11px] font-bold text-slate-700 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                  >
                    <option value="">Chọn nhanh tỉnh/thành...</option>
                    {KVDATA.map(p => (
                      <option key={p.ten} value={p.ten}>{p.ten}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={fetchWeather}
                    className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin size={11} /> Theo GPS
                  </button>
                  <div className="flex items-center gap-1.5 pl-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-emerald-600 font-black uppercase">Live Data</span>
                  </div>
                </div>
              </div>
              <div className="card-body p-6 md:p-8 space-y-8">
                {weatherLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu quang năng & dự báo 5 ngày...</p>
                  </div>
                ) : weather ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Weather Info */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-gradient rounded-3xl p-8 text-white shadow-emerald-500-20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-20">
                            {(() => {
                              const code = weather.weather_code;
                              if (code <= 1) return <Sun size={120} />;
                              if (code <= 3) return <Cloud size={120} />;
                              if (code <= 67) return <CloudRain size={120} />;
                              return <Wind size={120} />;
                            })()}
                          </div>
                          <div className="relative z-10">
                            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Nhiệt độ hiện tại</div>
                            <div className="text-7xl font-black mb-4">{weather.temperature_2m}°C</div>
                            <div className="flex items-center gap-2 text-emerald-100 font-bold">
                              <Info size={16} />
                              <span>Cảm giác như {weather.apparent_temperature}°C</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white border-2 border-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                            <Wind className="text-blue-500 mb-2" size={24} />
                            <div className="text-lg font-black text-slate-800">{weather.wind_speed_10m} km/h</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Tốc độ gió</div>
                          </div>
                          <div className="bg-white border-2 border-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                            <Info className="text-emerald-500 mb-2" size={24} />
                            <div className="text-lg font-black text-slate-800">{weather.relative_humidity_2m}%</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Độ ẩm</div>
                          </div>
                          <div className="bg-white border-2 border-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                            <Cloud className="text-slate-400 mb-2" size={24} />
                            <div className="text-lg font-black text-slate-800">{weather.cloud_cover}%</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Độ che phủ mây</div>
                          </div>
                          <div className="bg-white border-2 border-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                            <CloudRain className="text-blue-400 mb-2" size={24} />
                            <div className="text-lg font-black text-slate-800">{weather.precipitation} mm</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Lượng mưa</div>
                          </div>
                        </div>
                      </div>

                      {/* Solar Irradiance Info */}
                      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-slate-900-20">
                        <div>
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                              <Zap size={18} />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Chỉ số Quang năng</span>
                          </div>
                          
                          <div className="mb-8">
                            <div className="text-5xl font-black text-amber-400 mb-2">{Math.round(weather.shortwave_radiation)} <span className="text-xl">W/m²</span></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tổng bức xạ sóng ngắn</div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white-5 rounded-xl border border-white-10">
                              <span className="text-xs text-slate-400">Bức xạ trực tiếp</span>
                              <span className="text-sm font-black text-amber-200">{Math.round(weather.direct_radiation)} W/m²</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white-5 rounded-xl border border-white-10">
                              <span className="text-xs text-slate-400">Bức xạ khuếch tán</span>
                              <span className="text-sm font-black text-amber-200">{Math.round(weather.diffuse_radiation)} W/m²</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 p-4 bg-amber-500-10 rounded-2xl border border-amber-500-20">
                          <p className="text-[10px] text-amber-200 italic leading-relaxed">
                            Dữ liệu bức xạ mặt trời được lấy theo tọa độ thực tế ({weatherLocationLabel}), giúp đánh giá hiệu suất tức thời và dự báo sản lượng 5 ngày tới.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 5-Day Solar Irradiation Forecast & Output Estimation */}
                    {weatherForecastDetails.length > 0 && (
                      <div className="bg-slate-50/80 rounded-3xl p-5 md:p-6 border border-slate-200 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <TrendingUp size={18} className="text-amber-500" />
                              <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                                Dự báo xu hướng bức xạ & sản lượng 5 ngày tới
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Ước tính cho hệ thống hiện tại (<strong>{results.csLapDat.toFixed(2)} kWp</strong> · Hiệu suất tổng PR thực tế)
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-[11px]">
                              <span className="text-slate-500">Bức xạ TB 5 ngày: </span>
                              <strong className="text-amber-600">
                                {(weatherForecastDetails.reduce((s, d) => s + d.irradiationKwhM2, 0) / weatherForecastDetails.length).toFixed(2)} kWh/m²/ngày
                              </strong>
                            </div>
                            <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-[11px]">
                              <span className="text-slate-500">Tổng SL 5 ngày dự kiến: </span>
                              <strong className="text-emerald-700">
                                {weatherForecastDetails.reduce((s, d) => s + d.estimatedOutputKwh, 0).toFixed(1)} kWh
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                          <div className="h-64 md:h-72">
                            <Chart type="bar" data={weatherForecastChartData} options={weatherForecastChartOptions} />
                          </div>
                          <div className="mt-3 flex flex-wrap justify-center gap-6 text-[11px] text-slate-700 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-0.5 bg-amber-500 inline-block"></span>
                              <span>Xu hướng bức xạ mặt trời (kWh/m²/ngày)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-emerald-600/80 rounded-sm inline-block"></span>
                              <span>Sản lượng điện dự kiến (kWh/ngày)</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {weatherForecastDetails.map((day, idx) => (
                            <div
                              key={day.date}
                              className={`bg-white rounded-2xl p-3.5 border shadow-sm flex flex-col justify-between ${
                                idx === 0 ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="text-[12px] font-black text-slate-900">{day.dayLabel}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold">{day.dateShort}</div>
                                  </div>
                                  <div className="text-amber-500">
                                    {day.weatherCode <= 1 ? (
                                      <Sun size={22} />
                                    ) : day.weatherCode <= 3 ? (
                                      <Cloud size={22} className="text-slate-400" />
                                    ) : (
                                      <CloudRain size={22} className="text-blue-500" />
                                    )}
                                  </div>
                                </div>

                                <div className="text-[11px] font-bold text-slate-700 mb-2">
                                  {Math.round(day.tempMin)}° – {Math.round(day.tempMax)}°C
                                  {day.precipitationSum > 0 && (
                                    <span className="ml-1.5 text-[10px] text-blue-600 font-semibold">
                                      ({day.precipitationSum.toFixed(1)}mm)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Bức xạ:</span>
                                  <span className="font-black text-amber-600">{day.irradiationKwhM2.toFixed(2)} kWh/m²</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Giờ nắng:</span>
                                  <span className="font-bold text-slate-700">{day.sunshineHours} h</span>
                                </div>
                                <div className="mt-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 text-center">
                                  <div className="text-[9px] text-emerald-700 font-bold uppercase">Sản lượng dự kiến</div>
                                  <div className="text-[13px] font-black text-emerald-700">~{day.estimatedOutputKwh.toFixed(1)} kWh</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20">
                    <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold max-w-md mx-auto">{weatherError || "Vui lòng cho phép truy cập vị trí để xem dữ liệu quang năng tại khu vực của bạn."}</p>
                    <button onClick={fetchWeather} className="mt-4 btn btn-green">THỬ LẠI</button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setActiveMainTab('calc')} className="btn btn-green w-full justify-center py-4 text-sm font-black shadow-emerald-500-20">QUAY LẠI CÔNG CỤ TÍNH TOÁN</button>
          </div>
        ) : activeMainTab === 'om-inv' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Poster Header */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="relative z-10 text-center">
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-white rounded-2xl px-4 py-2 shadow-lg flex items-center justify-center">
                      <img src="/assets/aistudio/NGOCHIEUPC-SOLAR-logo-mau-4-nen-trong-suot_ccb5f30d.png" alt="NGOCHIEUPC SOLAR" className="h-9 w-auto object-contain" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-black text-amber-400 tracking-tighter">NGOCHIEUPC SOLAR</div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded-full">Huawei Inverter Expert</div>
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-2 leading-tight">
                  HƯỚNG DẪN VẬN HÀNH <span className="text-emerald-400">AN TOÀN</span><br />
                  BIẾN TẦN (INVERTER)
                </h2>
                <div className="text-slate-400 text-xs uppercase tracking-widest font-black">SOLAR INVERTER SAFE OPERATION PROCEDURE · NGOCHIEUPC-OM-INV-001 v2.0</div>
              </div>
            </div>

            {/* Danger Banner */}
            <div className="bg-red-600 p-4 rounded-2xl flex flex-wrap items-center justify-center gap-4 shadow-lg border-y-2 border-red-400 animate-pulse">
              <Zap size={24} className="text-yellow-400 fill-yellow-400" />
              <div className="text-white font-black text-sm text-center uppercase tracking-wider">
                CẢNH BÁO: ĐIỆN ÁP DC {'>'} <span className="text-yellow-300">600V</span> — NGUY HIỂM CHẾT NGƯỜI | 
                CHỜ TỐI THIỂU <span className="text-yellow-300">15 PHÚT</span> MỚI ĐƯỢC THAO TÁC
              </div>
              <Zap size={24} className="text-yellow-400 fill-yellow-400" />
            </div>

            {/* Flow Selection Strip */}
            <div className="card overflow-hidden border-slate-900">
               <div className="card-head bg-slate-900 border-none text-white p-6">
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-black uppercase tracking-widest w-full text-center sm:text-left">
                    <span className="text-slate-500">Khởi động:</span>
                    <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/30">DC OFF ✓</span>
                    <ChevronRight size={14} className="text-slate-700" />
                    <span className="text-emerald-400">Đo VAC</span>
                    <ChevronRight size={14} className="text-slate-700" />
                    <span className="text-emerald-400">AC ON</span>
                    <ChevronRight size={14} className="text-slate-700" />
                    <span className="text-emerald-400">DC SW1 ON</span>
                    <ChevronRight size={14} className="text-slate-700" />
                    <span className="text-emerald-400">HÒA LƯỚI ✓</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: POWER ON */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Khởi động hệ thống</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { s: "BƯỚC 1", t: "Kiểm tra TẤT CẢ DC SWITCH ở vị trí OFF", d: "Xác nhận DC SW1 và DC SW2 đều OFF trước khi bắt đầu.", c: "emerald" },
                    { s: "BƯỚC 2", t: "Đo điện áp lưới tại đầu vào AC", d: "Multimeter thang VAC đo ngõ vào AC inverter (198–242V cho 220V).", c: "emerald" },
                    { s: "BƯỚC 3", t: "Bật CÔNG TẮC AC lên vị trí ON", d: "Đèn báo AC trên inverter sáng → lưới điện đã cấp đến inverter.", c: "emerald" },
                    { s: "BƯỚC 4", t: "Bật DC SWITCH 1 → vị trí ON", d: "Chỉ bật DC SW1. Chưa bật SW2 — chờ kiểm tra đèn báo.", c: "emerald" },
                    { s: "BƯỚC 5", t: "Kiểm tra đèn PV CONNECTION", d: "Đèn xanh ổn định (Steady Green) → Bật DC SWITCH 2 lên ON.", c: "emerald" },
                    { s: "BƯỚC 6", t: "HÒA LƯỚI & KIỂM TRA", d: "Xác nhận trạng thái GRID: Steady Green và ALARM không đỏ.", c: "emerald" }
                  ].map((step, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex gap-4 hover:border-emerald-200 transition-colors">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs border border-emerald-100`}>
                          {i + 1}
                        </div>
                        {i < 5 && <div className="w-0.5 h-full bg-slate-100 mt-2"></div>}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-emerald-600 mb-1 uppercase tracking-widest">{step.s}</div>
                        <div className="text-sm font-black text-slate-800 mb-1">{step.t}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed">{step.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: SHUTDOWN */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <X size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Tắt máy & Bảo trì</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { s: "BƯỚC 1", t: "Gửi lệnh tắt qua App / SmartLogger", d: "Dùng phần mềm chuyển Inverter sang trạng thái Stand-by/Stop.", c: "orange" },
                    { s: "BƯỚC 2", t: "Tắt CÔNG TẮC AC → vị trí OFF", d: "Thực hiện sau khi inverter đã ngừng phát điện để tránh hồ quang.", c: "orange" },
                    { s: "BƯỚC 3", t: "Đặt DC SW2 về OFF → rồi DC SW1 về OFF", d: "Xoay công tắc dứt khoát về vị trí O (OFF).", c: "orange" },
                    { s: "BƯỚC 4", t: "Đo dòng DC từng string = 0A", d: "Kiểm tra bằng kìm đo dòng DC, kết quả phải = 0A.", c: "orange" },
                    { s: "BƯỚC 5", t: "Kiểm tra điện áp dư AC = 0V", d: "Xác nhận an toàn trước khi thao tác bên trong khoang đấu nối.", c: "orange" },
                    { s: "BƯỚC 6", t: "CHỜ TỐI THIỂU 15 PHÚT", d: "QUAN TRỌNG: Linh kiện bên trong vẫn tích điện áp cao.", c: "red" }
                  ].map((step, i) => (
                    <div key={i} className={`p-5 rounded-2xl border-2 shadow-sm flex gap-4 transition-colors ${step.c === 'red' ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-white border-slate-100 hover:border-orange-200'}`}>
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full bg-${step.c === 'red' ? 'red-50' : 'orange-50'} flex items-center justify-center text-${step.c}-600 font-black text-xs border border-${step.c === 'red' ? 'red-100' : 'orange-100'}`}>
                          {i + 1}
                        </div>
                        {i < 5 && <div className="w-0.5 h-full bg-slate-100 mt-2"></div>}
                      </div>
                      <div>
                        <div className={`text-[10px] font-black text-${step.c}-600 mb-1 uppercase tracking-widest`}>{step.s}</div>
                        <div className="text-sm font-black text-slate-800 mb-1">{step.t}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed">{step.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DC States */}
            <div className="p-8 bg-slate-100 rounded-3xl border-2 border-slate-200 text-center sm:text-left">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-center sm:justify-start gap-2">
                <Layout size={18} className="text-slate-600" /> Trạng thái DC Switch & Cách nhận biết
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500">
                   <div className="text-3xl font-black text-emerald-600 mb-2 uppercase">ON</div>
                   <div className="text-sm font-black text-slate-800 mb-1">Đóng hoàn toàn</div>
                   <div className="text-[11px] text-slate-500">Vận hành bình thường, phát điện ổn định.</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-red-500">
                   <div className="text-3xl font-black text-red-600 mb-2 uppercase">OFF</div>
                   <div className="text-sm font-black text-slate-800 mb-1">Mở an toàn</div>
                   <div className="text-[11px] text-slate-500">Cắt DC, sẵn sàng bảo trì sau khi xả tụ (15p).</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-orange-500 bg-orange-50">
                   <div className="text-3xl font-black text-orange-600 mb-2 uppercase italic text-center">TRIP</div>
                   <div className="text-sm font-black text-slate-800 mb-1">NGUY HIỂM — Kẹt giữa</div>
                   <div className="text-[11px] text-slate-500 font-medium text-orange-800">Không bật lại! Liên hệ kỹ thuật xử lý lỗi gốc.</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { i: <MapPin />, t: "Nối đất (PE)", d: "Đấu PE trước tiên, tháo cuối cùng. Trở kháng ≤ 4Ω. Không dùng N làm PE.", c: "amber" },
                { i: <Info />, t: "Không tháo Connector khi có tải", d: "Không tháo MC4 khi đang hòa lưới → nguy cơ hồ quang điện.", c: "red" },
                { i: <Layout />, t: "DC Switch tự ngắt", d: "Tuyệt đối không bật lại nếu TRIP cho đến khi xử lý nguyên nhân.", c: "orange" },
                { i: <CheckCircle2 />, t: "Bảo hộ (PPE)", d: "Găng cách điện, kính, giày cách điện, mũ. Không làm khi mưa.", c: "blue" },
                { i: <Phone />, t: "Hỗ trợ 24/7", d: "Gọi 0908.923.886 nếu inverter báo động hoặc switch tự ngắt.", c: "emerald" }
              ].map((item, i) => (
                <div key={i} className={`bg-white p-6 rounded-2xl border-l-4 border-${item.c}-500 shadow-sm hover:translate-y-[-4px] transition-all`}>
                  <div className={`text-${item.c}-500 mb-4`}>{item.i}</div>
                  <div className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">{item.t}</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.d}</div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0 animate-bounce shadow-lg">
                <Zap size={32} />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2 text-center md:text-left">Lưu ý đặc biệt — String Reverse / Backfeed</h4>
                <p className="text-[12px] text-amber-800 leading-relaxed text-center md:text-left">
                  Lỗi "String Reverse Connection" hoặc "String Current Backfeed" và DC switch TRIP: Sau khi sửa lỗi vật lý, hãy chờ <strong>3 phút</strong> trước khi reset DC switch về vị trí OFF rồi mới bật lại ON.
                </p>
              </div>
            </div>

            <button onClick={() => setActiveMainTab('calc')} className="btn btn-green w-full justify-center py-4 text-sm font-black shadow-emerald-500-20">QUAY LẠI CÔNG CỤ TÍNH TOÁN</button>
          </div>
        ) : activeMainTab === 'news' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card">
              <div className="card-head bg-emerald-50 border-b-2 border-emerald-100">
                <Zap size={16} className="text-emerald-600" />
                <h3 className="flex-1">Tin tức, Chính sách & Hướng dẫn Solar 2026</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setNewsRefreshNotice(`Đã đồng bộ quy định NĐ 243/2026/NĐ-CP và biểu giá EVN QĐ ${EVN_2026_META.decision} (hiệu lực ${EVN_2026_META.effectiveDate}).`);
                  }}
                  className="btn btn-green text-[10px] py-1 px-3"
                >
                  CẬP NHẬT MỚI
                </button>
              </div>
              <div className="card-body space-y-8">
                {newsRefreshNotice && (
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl">
                    <span>{newsRefreshNotice}</span>
                    <button type="button" onClick={() => setNewsRefreshNotice(null)} className="text-emerald-600 hover:text-emerald-900">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <SolarRegulations2026 />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-900 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider text-sm">Tin tức & Văn bản pháp lý 2026</h4>
                    <ul className="space-y-4">
                      {[
                        { t: `Biểu giá bán lẻ điện EVN 2026 theo QĐ ${EVN_2026_META.decision} (Cơ cấu sinh hoạt 5 bậc)`, s: "EVN · Bộ Công Thương", l: EVN_2026_META.sourceUrl },
                        { t: "Nghị định 243/2026/NĐ-CP: Nâng trần bán điện mặt trời dư lên tối đa 50%", s: "Chính phủ · Hiệu lực 26/06/2026", l: "https://baochinhphu.vn/" },
                        { t: "Nghị định 58/2025/NĐ-CP & 57/2025/NĐ-CP: Tự sản tự tiêu và cơ chế DPPA", s: "Báo Chính phủ", l: "https://baochinhphu.vn/" },
                        { t: "Xu hướng công nghệ pin N-Type TOPCon / BC năm 2026", s: "Năng lượng Việt Nam", l: "https://nangluongvietnam.vn/" },
                        { t: "Giá pin lưu trữ Lithium (BESS) giảm mạnh, tối ưu cho hộ gia đình & C&I", s: "Tuổi Trẻ", l: "https://tuoitre.vn/" },
                      ].map((n, i) => (
                        <li key={i} className="group border-b border-slate-50 pb-3 last:border-0">
                          <a href={n.l} target="_blank" rel="noopener noreferrer" className="flex flex-col hover:bg-emerald-50-50 p-2 rounded-lg transition-all">
                            <span className="text-[13px] font-black text-slate-800 group-hover:text-emerald-600">{n.t}</span>
                            <span className="text-[10px] text-slate-400 mt-1">Nguồn: {n.s}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-900 border-l-4 border-blue-500 pl-3 uppercase tracking-wider text-sm">Hướng dẫn kỹ thuật</h4>
                    <ul className="space-y-4">
                      {[
                        { t: "Quy trình vệ sinh tấm pin mặt trời chuẩn O&M", s: "NGOCHIEUPC SOLAR", l: "https://ngochieupc.github.io/quytrinhvesinh/" },
                        { t: "Cách kiểm tra hiệu suất Inverter qua App", s: "Kỹ thuật Solar", l: "#" },
                        { t: "Lưu ý an toàn khi lắp đặt hệ thống Solar", s: "EVN SPC", l: "https://evnspc.vn/" },
                        { t: "Hướng dẫn tính toán dung lượng pin lưu trữ (ESS)", s: "NGOCHIEUPC SOLAR", l: "#" },
                        { t: "Khắc phục các lỗi thường gặp ở Inverter hòa lưới", s: "Kỹ thuật Solar", l: "#" },
                      ].map((n, i) => (
                        <li key={i} className="group border-b border-slate-50 pb-3 last:border-0">
                          <a href={n.l} target="_blank" className="flex flex-col hover:bg-blue-50-50 p-2 rounded-lg transition-all">
                            <span className="text-[13px] font-black text-slate-800 group-hover:text-blue-600">{n.t}</span>
                            <span className="text-[10px] text-slate-400 mt-1">Nguồn: {n.s}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Video Section */}
                <div className="mt-12">
                  <h4 className="font-black text-slate-900 border-l-4 border-red-500 pl-3 uppercase tracking-wider text-sm mb-6">Video Solar nổi bật</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { id: "v_u3_p0Zf6S", t: "Quy trình lắp đặt điện mặt trời mái nhà", s: "Nguồn: EVN" },
                      { id: "0eH6O727u3k", t: "How Solar Panels Work", s: "Nguồn: TED-Ed" },
                      { id: "xKxrkht7CpY", t: "Solar Energy 101", s: "Nguồn: National Geographic" },
                    ].map((v, i) => (
                      <div key={i} className="space-y-2">
                        <div className="video-container">
                          <iframe 
                            src={`https://www.youtube.com/embed/${v.id}`} 
                            title={v.t}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>
                        </div>
                        <p className="text-[12px] font-black text-slate-800 line-clamp-1">{v.t}</p>
                        <p className="text-[10px] text-slate-400">Nguồn: {v.s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 shadow-inner">
                  <p className="text-[11px] text-emerald-800 italic leading-relaxed">
                    * Các thông tin và video trên được tổng hợp từ các nguồn internet miễn phí, chính thống và các Youtuber uy tín. NGOCHIEUPC SOLAR cam kết tôn trọng bản quyền, ghi rõ nguồn và dẫn link đầy đủ. Nếu có bất kỳ vấn đề nào về bản quyền, vui lòng liên hệ với chúng tôi.
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveMainTab('calc')} className="btn btn-green w-full justify-center py-4 text-sm font-black shadow-emerald-500-20">QUAY LẠI CÔNG CỤ TÍNH TOÁN</button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
        <div className="toolbar-glass">
          <button onClick={exportPDF} className="btn btn-red"><Download size={18} /> Tải PDF Báo cáo</button>
          <button onClick={exportImage} className="btn btn-blue"><ImageIcon size={18} /> Tải ảnh PNG</button>
          <button onClick={() => setIsEmailModalOpen(true)} className="btn btn-green"><Send size={18} /> Gửi qua Email</button>
          <button onClick={handlePrint} className="btn btn-outline"><Printer size={18} /> In trang</button>
          <button
            type="button"
            onClick={() => document.getElementById('system-comparison-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn bg-slate-900 text-white hover:bg-slate-800"
          >
            <GitCompareArrows size={18} /> So sánh 2 cấu hình
          </button>
          <a 
            href="https://ngochieupc.github.io/quytrinhvesinh/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn bg-amber-gradient text-white"
          >
            <Settings size={18} /> O&M Solar
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="solar-report-content">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Location & Customer */}
            <div className="card">
              <div className="card-head">
                <MapPin size={16} className="text-[--red]" />
                <h3>Khu vực & Loại khách hàng</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="fg">
                    <label>Khu vực lắp đặt <span className="tip"><i className="tip-icon">i</i><span className="tip-box">Mỗi khu vực lắp đặt sẽ có số giờ chiếu nắng trong ngày khác nhau</span></span></label>
                    <select value={province.ten} onChange={handleProvinceChange} className="input-focus-ring">
                      {KVDATA.map(p => <option key={p.ten} value={p.ten}>{p.ten}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Giờ nắng TB/ngày (h)</label>
                    <input type="number" step="0.01" className="editable-calc input-focus-ring" value={sunHours} onChange={e => setSunHours(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Loại khách hàng</label>
                    <select value={customerType} onChange={e => {
                      const type = e.target.value as 'dd' | 'cn';
                      setCustomerType(type);
                      const base = type === 'dd' ? 2894 : 1814;
                      setPriceTab(type === 'dd' ? 0 : 1);
                      selectTariffBasePrice(base);
                    }} className="input-focus-ring">
                      <option value="dd">Dân dụng (Hộ gia đình)</option>
                      <option value="cn">Công nghiệp / Thương mại</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhu cầu sử dụng điện - Tính ngược công suất */}
            <div className="card border-l-4 border-l-orange-500">
              <div className="card-head">
                <TrendingUp size={16} className="text-orange-600" />
                <h3 className="text-slate-900">Nhu cầu sử dụng điện <span className="demand-badge bg-orange-100 text-orange-600 ml-2">Tính ngược công suất</span></h3>
              </div>
              <div className="card-body">
                <p className="text-[11px] text-slate-700 mb-4 italic">Nhập số tiền điện hoặc số kWh hàng tháng để hệ thống gợi ý công suất lắp đặt phù hợp.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="fg">
                    <label className="text-orange-800 font-bold">Tiền điện trung bình/tháng (VNĐ)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="pr-10 border-orange-200 focus:border-orange-500 ring-orange-500-10 text-slate-900 font-medium" 
                        placeholder="Ví dụ: 2.000.000"
                        value={formatVN(monthlyBill)}
                        onChange={e => handleMonthlyBillChange(parseVN(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 font-bold">₫</span>
                    </div>
                  </div>
                  <div className="fg">
                    <label className="text-blue-800 font-bold">Sản lượng tiêu thụ/tháng (kWh)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="pr-10 border-blue-200 focus:border-blue-500 ring-blue-500-10 text-slate-900 font-medium" 
                        placeholder="Ví dụ: 500"
                        value={formatVN(monthlyKwh)}
                        onChange={e => handleMonthlyKwhChange(parseVN(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold flex items-center"><Zap size={14} /></span>
                    </div>
                  </div>
                </div>
                {monthlyKwh > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-md">
                        <Zap size={24} />
                      </div>
                      <div>
                        <div className="text-[11px] text-orange-700 font-bold uppercase tracking-wider">Gợi ý công suất lắp đặt</div>
                        <div className="text-2xl font-black text-orange-950">~ {((monthlyKwh / 30) / (sunHours * pr)).toFixed(2)} kWp</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        <span className="font-bold text-red-600">Ghi chú:</span> Công suất khuyến nghị lắp đặt mang tính tham khảo. Mọi chi tiết liên hệ đơn vị thi công chuyên nghiệp hoặc <span className="font-bold">Mr. Hiếu</span>: <br />
                        <span className="inline-flex items-center gap-1 mt-1">
                          <Phone size={10} /> Tel: 0908.923.886
                        </span>
                        <span className="inline-flex items-center gap-1 ml-3">
                          <Zap size={10} /> Zalo: 0908.923.886
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Solar Panels */}
            <div className="card">
              <div className="card-head">
                <Layout size={16} className="text-[--green]" />
                <h3>Tấm pin mặt trời (PV Module)</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="fg">
                    <label>Hãng sản xuất</label>
                    <select value={panelBrand} onChange={handlePanelBrandChange}>
                      <option value="jinko">Jinko Solar</option>
                      <option value="longi">LONGi Solar</option>
                      <option value="trina">Trina Solar</option>
                      <option value="canadian">Canadian Solar</option>
                      <option value="ja">JA Solar</option>
                      <option value="risen">Risen Energy</option>
                      <option value="sunpower">SunPower</option>
                      <option value="hanwha">Hanwha Q Cells</option>
                      <option value="other">Hãng khác / Nhập thủ công</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label>Model tấm pin</label>
                    <select value={panelModel} onChange={handlePanelModelChange} disabled={panelBrand === 'other'}>
                      {panelBrand !== 'other' && PIN_DB[panelBrand]?.map(m => (
                        <option key={m.model} value={m.model}>{m.model} ({m.wp}Wp)</option>
                      ))}
                      {panelBrand === 'other' && <option value="">Nhập thủ công bên dưới</option>}
                    </select>
                  </div>
                </div>

                {panelBrand === 'other' && (
                  <div className="fg mb-4">
                    <label>Nhập mã model thủ công</label>
                    <input type="text" placeholder="Ví dụ: JKM580N-72HL4-BDV" value={panelManual} onChange={e => setPanelManual(e.target.value)} />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="fg">
                    <label>Công suất (Wp)</label>
                    <input type="number" value={panelWp} onChange={e => { setPanelWp(Number(e.target.value)); handlePanelQtyChange(panelQty); }} />
                  </div>
                  <div className="fg">
                    <label>Hiệu suất (%)</label>
                    <input type="number" step="0.1" value={panelEff} onChange={e => setPanelEff(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Hệ số nhiệt (%/°C)</label>
                    <input type="number" step="0.01" value={panelTC} onChange={e => setPanelTC(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Diện tích 1 tấm (m²)</label>
                    <input type="number" step="0.01" value={panelArea} onChange={e => { setPanelArea(Number(e.target.value)); handleRoofAreaChange(roofArea); }} />
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-3">Quy mô lắp đặt (Tính toán 2 chiều)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="fg">
                      <label>Diện tích mái (m²)</label>
                      <input type="number" className="editable-calc" value={roofArea} onChange={e => handleRoofAreaChange(Number(e.target.value))} />
                    </div>
                    <div className="fg">
                      <label>Hệ số sd mái (%)</label>
                      <input type="number" value={roofUsage} onChange={e => handleRoofUsageChange(Number(e.target.value))} />
                    </div>
                    <div className="fg">
                      <label>Số lượng tấm</label>
                      <input type="number" className="editable-calc" value={panelQty} onChange={e => handlePanelQtyChange(Number(e.target.value))} />
                    </div>
                    <div className="fg">
                      <label>Công suất (kWp)</label>
                      <input type="number" step="0.01" className="editable-calc" value={systemCapacity} onChange={e => handleSystemCapacityChange(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inverter */}
            <div className="card">
              <div className="card-head">
                <Settings size={16} className="text-[--red]" />
                <h3>Inverter (Bộ biến tần)</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="fg">
                    <label>Hãng Inverter</label>
                    <select value={invBrand} onChange={handleInvBrandChange}>
                      <option value="huawei">Huawei</option>
                      <option value="sungrow">Sungrow</option>
                      <option value="growatt">Growatt</option>
                      <option value="sma">SMA</option>
                      <option value="solis">SOLIS</option>
                      <option value="fronius">Fronius</option>
                      <option value="goodwe">GoodWe</option>
                      <option value="deye">Deye</option>
                      <option value="senergy">Senergy</option>
                      <option value="other">Hãng khác / Nhập thủ công</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label>Model Inverter</label>
                    <select value={invModel} onChange={handleInvModelChange} disabled={invBrand === 'other'}>
                      {invBrand !== 'other' && INV_DB[invBrand]?.map(m => (
                        <option key={m.model} value={m.model}>{m.model} ({m.kw}kW)</option>
                      ))}
                      {invBrand === 'other' && <option value="">Nhập thủ công bên dưới</option>}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="fg">
                    <label>Công suất định mức (kW)</label>
                    <input type="number" value={invKw} onChange={e => setInvKw(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Hiệu suất (%)</label>
                    <input type="number" step="0.1" value={invEff} onChange={e => setInvEff(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Số lượng</label>
                    <input type="number" min="1" value={invQty} onChange={e => setInvQty(Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Storage System - NEW SECTION */}
            <div className="card border-l-4 border-l-purple-500">
              <div className="card-head">
                <div className="flex items-center gap-2 flex-1">
                  <Zap size={16} className="text-purple-600" />
                  <h3>Hệ thống Lưu trữ (BESS)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer" htmlFor="battery-toggle">Sử dụng</label>
                  <button 
                    id="battery-toggle"
                    onClick={() => setHasBattery(!hasBattery)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${hasBattery ? 'bg-purple-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${hasBattery ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
              <div className={`card-body transition-all duration-300 ${hasBattery ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="fg">
                      <label className="text-purple-800 font-bold">Dung lượng bộ lưu trữ (kWh)</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.5"
                        value={batteryCapacity} 
                        onChange={e => setBatteryCapacity(Number(e.target.value))} 
                        className="input-focus-ring border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div className="fg">
                      <label>Độ sâu xả (DoD %)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={batteryDod} 
                        onChange={e => setBatteryDod(Number(e.target.value))} 
                      />
                      <p className="text-[9px] text-slate-400">Deep Cycle Lithium thường ~80-90%</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="fg">
                      <label>Hiệu suất sạc/xả (%)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={batteryEfficiency} 
                        onChange={e => setBatteryEfficiency(Number(e.target.value))} 
                      />
                    </div>
                    <div className="fg">
                      <label>Chi phí lưu trữ (Triệu VNĐ/kWh)</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.1"
                        value={batteryCostPerKwh} 
                        onChange={e => setBatteryCostPerKwh(Number(e.target.value))} 
                      />
                    </div>
                    <div className="fg">
                      <label>Tốc độ xả (C-Rate)</label>
                      <select value={batteryCRate} onChange={e => setBatteryCRate(Number(e.target.value))}>
                        <option value={0.2}>0.2C (Tiết kiệm Pin)</option>
                        <option value={0.5}>0.5C (Tiêu chuẩn)</option>
                        <option value={1.0}>1.0C (Xả nhanh)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Info size={16} className="text-purple-600" />
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Cấu hình sử dụng</h4>
                  </div>
                  <div className="fg">
                    <label className="text-[11px] text-slate-600 font-bold">Tỷ lệ điện tiêu thụ ban đêm (%)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={nightConsumption} 
                        onChange={e => setNightConsumption(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <span className="text-sm font-black text-purple-900 w-10">{nightConsumption}%</span>
                    </div>
                    <p className="text-[9px] text-slate-500 italic mt-1">Lượng điện mặt trời nạp vào pin để dùng khi trời tối.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dung lượng thực tế</div>
                      <div className="text-lg font-black text-purple-700">{(results.usableBatteryCapacity || 0).toFixed(1)} kWh</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Công suất sạc/xả Max</div>
                      <div className="text-lg font-black text-purple-700">{(results.batteryMaxPower || 0).toFixed(1)} kW</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Vốn đầu tư Pin</div>
                      <div className="text-lg font-black text-purple-700">{formatVN(results.totalBatteryCost || 0)} đ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Self-Consumption & Surplus Export Policy (NĐ 58/2025 & NĐ 243/2026) */}
            <div className="card border-l-4 border-l-blue-600">
              <div className="card-head bg-blue-50/70 border-b border-blue-100">
                <Zap size={16} className="text-blue-600" />
                <h3 className="flex-1 text-slate-900">Tự sản tự tiêu & Bán điện dư lên lưới (NĐ 58/2025 · NĐ 243/2026)</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  Trần bán dư {results.maxExportPercent}%
                </span>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="fg">
                    <label className="text-[11px] font-bold text-slate-700">
                      Tỷ lệ tự dùng trực tiếp ban ngày ({selfConsumptionRate}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selfConsumptionRate}
                      onChange={e => setSelfConsumptionRate(Number(e.target.value))}
                      className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>0% (Phát lưới toàn bộ)</span>
                      <span>100% (Tự dùng hết)</span>
                    </div>
                  </div>
                  <div className="fg">
                    <label>Cơ chế bán điện dư áp dụng</label>
                    <select
                      value={surplusPolicy}
                      onChange={e => setSurplusPolicy(e.target.value as SurplusPolicyId)}
                      className="input-focus-ring"
                    >
                      {SURPLUS_POLICY_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>{p.shortLabel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Giá mua điện dư (đ/kWh chưa VAT)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={surplusSellPrice}
                        onChange={e => setSurplusSellPrice(Number(e.target.value))}
                        className="input-focus-ring flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setSurplusSellPrice(DEFAULT_SURPLUS_BUYBACK_PRICE)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 whitespace-nowrap"
                        title="Khôi phục giá thị trường bình quân tham chiếu"
                      >
                        Mặc định
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">Sản lượng tự dùng{hasBattery ? ' (+Pin)' : ''}</div>
                    <div className="text-base font-black text-emerald-800 mt-0.5">
                      {Math.round(results.totalSelfUsedKwh).toLocaleString('vi-VN')} <span className="text-[10px] font-semibold">kWh/năm</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Chiếm {results.actualSelfUsePercent.toFixed(1)}% tổng phát</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-blue-700 uppercase">Điện dư bán lên lưới</div>
                    <div className="text-base font-black text-blue-800 mt-0.5">
                      {Math.round(results.exportedKwh).toLocaleString('vi-VN')} <span className="text-[10px] font-semibold">kWh/năm</span>
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold">
                      Doanh thu: {Math.round(results.surplusRevenueYear).toLocaleString('vi-VN')} đ/năm
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-amber-700 uppercase">Tiết kiệm tự dùng</div>
                    <div className="text-base font-black text-amber-800 mt-0.5">
                      {Math.round(results.selfUseSavingsYear).toLocaleString('vi-VN')} <span className="text-[10px] font-semibold">đ/năm</span>
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold">Theo giá {elecPrice.toLocaleString('vi-VN')} đ/kWh</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Cắt giảm vượt trần</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      {Math.round(results.curtailedKwh).toLocaleString('vi-VN')} <span className="text-[10px] font-semibold">kWh/năm</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {results.curtailedKwh > 0 ? 'Vượt ngưỡng phát lưới cho phép' : 'Không bị cắt giảm công suất'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="card border-emerald-200">
              <div className="card-head bg-emerald-50">
                <BarChart3 size={16} className="text-[--green]" />
                <h3>Kết quả tính toán</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <div className="rcard bl">
                    <div className="text-[11px] font-medium text-blue-700 mb-1">Công suất lắp đặt</div>
                    <div className="rcard-val">{results.csLapDat.toFixed(2)}</div>
                    <div className="text-[10px] text-blue-500 mt-1">kWp</div>
                  </div>
                  <div className="rcard bl">
                    <div className="text-[11px] font-medium text-blue-700 mb-1">Công suất đỉnh (AC)</div>
                    <div className="rcard-val">{results.csDinh.toFixed(2)}</div>
                    <div className="text-[10px] text-blue-500 mt-1">kWp</div>
                  </div>
                  <div className="rcard bl">
                    <div className="text-[11px] font-medium text-blue-700 mb-1">DC/AC Ratio</div>
                    <div className="rcard-val">{results.dcac.toFixed(2)}</div>
                    <div className="text-[10px] text-blue-500 mt-1">Khuyến nghị 1.1 - 1.3</div>
                  </div>
                  <div className="rcard gr">
                    <div className="text-[11px] font-medium text-emerald-700 mb-1">Điện năng / ngày</div>
                    <div className="rcard-val">{results.slNgay.toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-500 mt-1">kWh</div>
                  </div>
                  <div className="rcard gr">
                    <div className="text-[11px] font-medium text-emerald-700 mb-1">Điện năng / năm</div>
                    <div className="rcard-val">{Math.round(results.slNam).toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-500 mt-1">kWh/năm</div>
                  </div>
                  <div className="rcard gr">
                    <div className="text-[11px] font-medium text-emerald-700 mb-1">Specific Yield</div>
                    <div className="rcard-val">{results.yield_val}</div>
                    <div className="text-[10px] text-emerald-500 mt-1">kWh/kWp/năm</div>
                  </div>
                  <div className="rcard or">
                    <div className="text-[11px] font-medium text-orange-700 mb-1">Tổng lợi ích / tháng</div>
                    <div className="rcard-val">{Math.round(results.tienNam / 12).toLocaleString()}</div>
                    <div className="text-[10px] text-orange-500 mt-1">đồng (tự dùng + bán dư)</div>
                  </div>
                  <div className="rcard or">
                    <div className="text-[11px] font-medium text-orange-700 mb-1">Tổng lợi ích / năm</div>
                    <div className="rcard-val">{Math.round(results.tienNam).toLocaleString()}</div>
                    <div className="text-[10px] text-orange-500 mt-1">đồng (tự dùng + bán dư)</div>
                  </div>
                  <div className="rcard or">
                    <div className="text-[11px] font-medium text-orange-700 mb-1">Giảm phát thải CO₂</div>
                    <div className="rcard-val">{results.co2.toFixed(2)}</div>
                    <div className="text-[10px] text-orange-500 mt-1">tấn CO₂/năm</div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-[11px] font-bold text-gray-400 uppercase mb-4">Phân tích hoàn vốn</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="fg">
                      <label>Chi phí đầu tư (triệu đ)</label>
                      <input type="number" value={investment} onChange={e => setInvestment(Number(e.target.value))} />
                    </div>
                    <div className="fg">
                      <label>Suy giảm CS/năm (%)</label>
                      <input type="number" step="0.1" value={degradation} onChange={e => setDegradation(Number(e.target.value))} />
                    </div>
                    <div className="fg">
                      <label>Tăng giá điện/năm (%)</label>
                      <input type="number" step="0.5" value={priceIncrease} onChange={e => setPriceIncrease(Number(e.target.value))} />
                    </div>
                  </div>
                  
                  {(investment > 0 || results.totalBatteryCost > 0) && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <table className="hv-table">
                        <tbody>
                          <tr><td>Vốn đầu tư thiết bị Solar</td><td>{(investment * 1e6).toLocaleString()} đ</td></tr>
                          {hasBattery && (
                            <tr><td>Vốn đầu tư Pin lưu trữ</td><td className="text-purple-700 font-bold">{results.totalBatteryCost.toLocaleString()} đ</td></tr>
                          )}
                          <tr className="border-t-2 border-emerald-200">
                            <td className="font-black text-emerald-900 uppercase text-[10px]">Tổng mức đầu tư</td>
                            <td className="text-right font-black text-red-600">
                              {results.totalInvestment.toLocaleString()} đ
                            </td>
                          </tr>
                          <tr><td>Tiết kiệm tự dùng năm 1</td><td>{Math.round(results.selfUseSavingsYear).toLocaleString()} đ/năm</td></tr>
                          <tr><td>Doanh thu bán điện dư năm 1 ({Math.round(results.exportedKwh).toLocaleString()} kWh)</td><td className="text-blue-700 font-semibold">{Math.round(results.surplusRevenueYear).toLocaleString()} đ/năm</td></tr>
                          <tr><td className="font-bold text-slate-800">Tổng lợi ích dự kiến năm 1</td><td className="font-bold text-slate-900">{Math.round(results.tienNam).toLocaleString()} đ/năm</td></tr>
                          <tr><td>Thời gian hoàn vốn</td><td>{results.payback.toFixed(1)} năm</td></tr>
                          <tr><td>Lợi nhuận ròng 25 năm</td><td>{Math.round(results.total25 - results.totalInvestment).toLocaleString()} đ</td></tr>
                          <tr><td><span className="font-bold text-emerald-700">IRR (Lợi suất dự kiến)</span></td><td className="font-black text-emerald-700">{results.irr.toFixed(1)}%/năm</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 25-Year Cumulative Profit Line Chart */}
                  <div className="mt-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={15} className="text-emerald-600" />
                        <span className="text-[12px] font-bold text-slate-800">Tăng trưởng lợi nhuận tích lũy (25 năm)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                        {results.totalInvestment > 0 && results.exactPaybackYear !== null && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            Hòa vốn thực tế: ~{results.exactPaybackYear.toFixed(1)} năm
                          </span>
                        )}
                        {results.totalInvestment <= 0 && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                            Nhập chi phí đầu tư để xem điểm hòa vốn
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-60 bg-white rounded-lg p-2 border border-slate-100">
                      <Line data={profitChartData} options={profitChartOptions} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
                          <span>Lợi nhuận tích lũy (triệu đ)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 border-t border-dashed border-slate-500 inline-block"></span>
                          <span>Mốc hòa vốn (0 đ)</span>
                        </div>
                      </div>
                      <div className="text-slate-500">
                        Suy giảm: <strong className="text-slate-700">{degradation}%/năm</strong> · Tăng giá điện: <strong className="text-slate-700">{priceIncrease}%/năm</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="card">
              <div className="card-head">
                <BarChart3 size={16} className="text-[--red]" />
                <h3>Biểu đồ sản lượng & doanh thu</h3>
              </div>
              <div className="card-body">
                <div className="h-64">
                  <Chart type='bar' data={chartData} options={chartOptions} />
                </div>
                <div className="mt-4 flex justify-center gap-6 text-[11px] text-gray-700">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1565c0] rounded-sm"></div> Sản lượng (kWh)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f9a825] rounded-sm"></div> Doanh thu (nghìn đ)</div>
                </div>
              </div>
            </div>

            {/* AI Predictive Maintenance Forecast */}
            <div className="card border-l-4 border-l-emerald-600">
              <div className="card-head bg-emerald-50/70 border-b border-emerald-100">
                <Wrench size={16} className="text-emerald-600" />
                <h3 className="flex-1 text-slate-900">AI Dự báo Bảo trì Hệ thống (Vệ sinh Pin & Kiểm tra Inverter)</h3>
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  <Sparkles size={10} /> Gemini AI
                </span>
              </div>
              <div className="card-body space-y-5">
                {/* Local climate summary strip */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin size={13} className="text-emerald-600" />
                    {province.ten} ({province.mien})
                  </div>
                  <span>Nắng TB: <strong>{sunHours} h/ngày</strong></span>
                  <span>Nhiệt độ TB: <strong>{tempAvg}°C</strong></span>
                  {weather ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sun size={12} /> Thời tiết thực tế: {weather.temperature_2m}°C · Độ ẩm {weather.relative_humidity_2m}% · Gió {weather.wind_speed_10m} km/h · Mưa {weather.precipitation} mm
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Dùng dữ liệu khí hậu địa phương theo tỉnh/thành</span>
                  )}
                </div>

                {/* Environment & Operating Age Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="fg mb-0">
                    <label>Đặc thù môi trường lắp đặt</label>
                    <select
                      value={envType}
                      onChange={e => setEnvType(e.target.value as 'urban' | 'industrial' | 'coastal' | 'rural')}
                    >
                      <option value="urban">Đô thị / Bụi giao thông</option>
                      <option value="industrial">KCN / Công trình / Nhiều bụi</option>
                      <option value="coastal">Ven biển / Hơi muối ăn mòn</option>
                      <option value="rural">Nông thôn / Thoáng ít bụi</option>
                    </select>
                  </div>
                  <div className="fg mb-0">
                    <label>Chưa vệ sinh pin (ngày)</label>
                    <input
                      type="number"
                      min="0"
                      value={daysSinceCleaning}
                      onChange={e => setDaysSinceCleaning(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                  <div className="fg mb-0">
                    <label>Chưa kiểm tra Inverter (ngày)</label>
                    <input
                      type="number"
                      min="0"
                      value={daysSinceInverterCheck}
                      onChange={e => setDaysSinceInverterCheck(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                </div>

                {/* 6-Month Production History */}
                <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={13} className="text-blue-600" />
                        Lịch sử sản lượng thực tế 6 tháng gần nhất (kWh)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Nhập số kWh thực tế từ app Inverter (Solar/FusionSolar) hoặc chọn nhanh kịch bản bên phải để AI đối chiếu với mức kỳ vọng.
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryRatios([1.0, 1.0, 0.99, 0.99, 0.99, 0.98]);
                          setManualActualKwh({});
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-pointer"
                      >
                        Sản lượng chuẩn
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryRatios([1.0, 0.99, 0.97, 0.94, 0.91, 0.88]);
                          setManualActualKwh({});
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors cursor-pointer"
                      >
                        Mô phỏng bám bụi
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {productionHistory.map(item => {
                      const isDrop = item.diffPercent <= -5;
                      const isWarn = item.diffPercent < -2 && item.diffPercent > -5;
                      return (
                        <div key={item.index} className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-black text-slate-800">{item.monthLabel}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDrop ? 'bg-red-50 text-red-600' : isWarn ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {item.diffPercent >= 0 ? `+${item.diffPercent.toFixed(1)}%` : `${item.diffPercent.toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 mb-1.5">
                            Kỳ vọng: {item.expectedKwh.toLocaleString('vi-VN')}
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={item.actualKwh}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setManualActualKwh(prev => ({ ...prev, [item.index]: val }));
                            }}
                            className="w-full px-2 py-1 text-[12px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-500 focus:bg-white outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
                    <span>
                      Hiệu suất 3 tháng gần nhất so với kỳ vọng:{' '}
                      <strong className={recent3Performance < 93 ? 'text-red-600' : recent3Performance < 97 ? 'text-amber-600' : 'text-emerald-600'}>
                        {recent3Performance.toFixed(1)}%
                      </strong>
                    </span>
                    <span>
                      Tỷ lệ DC/AC Inverter: <strong className={results.dcac > 1.25 ? 'text-amber-600' : 'text-slate-800'}>{results.dcac.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {/* Analyze Button */}
                <button
                  type="button"
                  onClick={handlePredictMaintenance}
                  disabled={isForecastLoading}
                  className="btn btn-green w-full justify-center py-3 text-[12px] uppercase tracking-wider disabled:opacity-60"
                >
                  {isForecastLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Đang phân tích khí hậu & lịch sử sản lượng...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> AI Dự báo thời điểm bảo trì ngay
                    </>
                  )}
                </button>

                {forecastError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 flex items-start gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{forecastError}</span>
                  </div>
                )}

                {/* Forecast Output */}
                {maintenanceForecast && (
                  <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-300">
                    {/* Overall Status Banner */}
                    <div className={`p-4 rounded-xl border ${
                      maintenanceForecast.overallStatus === 'CẦN BẢO TRÌ NGAY'
                        ? 'bg-red-50 border-red-200'
                        : maintenanceForecast.overallStatus === 'CẦN CHÚ Ý'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            maintenanceForecast.overallStatus === 'CẦN BẢO TRÌ NGAY'
                              ? 'bg-red-600 text-white'
                              : maintenanceForecast.overallStatus === 'CẦN CHÚ Ý'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {maintenanceForecast.overallStatus}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">
                            Chỉ số ưu tiên bảo trì: <strong>{maintenanceForecast.riskScore}/100</strong>
                          </span>
                        </div>
                        <div className="w-28 h-2 bg-white/80 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              maintenanceForecast.riskScore >= 70 ? 'bg-red-500' : maintenanceForecast.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, maintenanceForecast.riskScore))}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-800 leading-relaxed font-medium">
                        {maintenanceForecast.summary}
                      </p>
                    </div>

                    {/* Two Maintenance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Panel Cleaning Card */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Droplets size={15} />
                              </div>
                              <span className="text-[12px] font-black text-slate-900 uppercase">Vệ sinh tấm pin</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              Ưu tiên: {maintenanceForecast.panelCleaning.urgency}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Thời điểm đề xuất</div>
                              <div className="font-black text-emerald-700">{maintenanceForecast.panelCleaning.recommendedDate}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Chu kỳ tiếp theo</div>
                              <div className="font-bold text-slate-800">{maintenanceForecast.panelCleaning.nextCycleDays} ngày/lần</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Hao hụt bụi ước tính</div>
                              <div className="font-bold text-amber-700">~{maintenanceForecast.panelCleaning.estimatedLossPercent}%</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Thất thoát / tháng</div>
                              <div className="font-bold text-red-600">~{maintenanceForecast.panelCleaning.estimatedMonthlyLossVnd.toLocaleString('vi-VN')} đ</div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {maintenanceForecast.panelCleaning.reason}
                          </p>

                          <ul className="space-y-1">
                            {maintenanceForecast.panelCleaning.checklist.map((step, idx) => (
                              <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <a
                          href="https://ngochieupc.github.io/quytrinhvesinh/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
                        >
                          Xem quy trình vệ sinh chuẩn O&M <ChevronRight size={12} />
                        </a>
                      </div>

                      {/* Inverter Inspection Card */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Zap size={15} />
                              </div>
                              <span className="text-[12px] font-black text-slate-900 uppercase">Kiểm tra Biến tần</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                              Ưu tiên: {maintenanceForecast.inverterInspection.urgency}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Thời điểm đề xuất</div>
                              <div className="font-black text-orange-700">{maintenanceForecast.inverterInspection.recommendedDate}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Chu kỳ kiểm tra</div>
                              <div className="font-bold text-slate-800">{maintenanceForecast.inverterInspection.nextCycleMonths} tháng/lần</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[9px] text-slate-400 uppercase font-bold">Đánh giá tải DC/AC & nhiệt</div>
                              <div className="font-semibold text-slate-800">{maintenanceForecast.inverterInspection.dcAcAssessment}</div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {maintenanceForecast.inverterInspection.reason}
                          </p>

                          <ul className="space-y-1">
                            {maintenanceForecast.inverterInspection.checklist.map((step, idx) => (
                              <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <CheckCircle2 size={12} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMainTab('om-inv');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[11px] font-bold text-orange-600 hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100 cursor-pointer bg-transparent border-x-0 border-b-0 text-left"
                        >
                          Mở hướng dẫn vận hành O&M Inverter <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Climate Impact Note */}
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                      <Cloud size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="uppercase text-[10px] tracking-wider">Lưu ý khí hậu địa phương ({province.ten}):</strong>{' '}
                        {maintenanceForecast.climateImpactNotes}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Weather & Solar Irradiance (Mini View) */}
            {weather && (
              <div className="card overflow-hidden border-2 border-emerald-100 shadow-lg bg-weather-card-gradient cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setActiveMainTab('weather')}>
                <div className="card-head bg-emerald-50-50 border-b border-emerald-100">
                  <Sun size={16} className="text-emerald-600" />
                  <h3 className="text-emerald-900 font-black text-[11px] uppercase tracking-wider">Quang năng hiện tại</h3>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] text-emerald-600 font-black">LIVE</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-black text-slate-800">{weather.temperature_2m}°C</div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <div className="text-xl font-black text-emerald-600">{Math.round(weather.shortwave_radiation)}</div>
                        <div className="text-[9px] text-emerald-500 font-bold uppercase">W/m²</div>
                      </div>
                    </div>
                    <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors">
                      <Layout size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Electricity Prices */}
            <div className="card overflow-hidden border-2 border-slate-100 shadow-lg">
              <div className="card-head bg-slate-50 border-b-2 flex-wrap gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <div className="flex-1 min-w-[140px]">
                  <h3 className="font-black text-slate-800">GIÁ ĐIỆN EVN 2026</h3>
                  <div className="text-[9px] text-slate-500 font-semibold">
                    QĐ {EVN_2026_META.decision} ({EVN_2026_META.effectiveDate}) · TB {EVN_2026_META.avgRetailPrice.toLocaleString('vi-VN')} đ/kWh
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <a 
                    href={EVN_2026_META.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    CỔNG EVN
                  </a>
                  <button 
                    type="button"
                    onClick={askAiForPrice}
                    disabled={isAiLoading}
                    className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 border border-blue-200"
                  >
                    {isAiLoading ? "ĐANG HỎI AI..." : "HỎI AI GIÁ MỚI"}
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* VAT Selector */}
                <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Thuế suất VAT:</span>
                  <div className="flex gap-1">
                    {[
                      { label: 'Chưa VAT', value: 0 },
                      { label: 'VAT 8%', value: 0.08 },
                      { label: 'VAT 10%', value: 0.10 },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleVatRateChange(opt.value)}
                        className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${vatRate === opt.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {aiPriceFeedback && (
                  <div className={`mb-3 p-2.5 rounded-xl border text-[11px] flex items-start justify-between gap-2 ${aiPriceFeedback.type === 'success' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <span className="leading-snug"><strong>AI Gợi ý:</strong> {aiPriceFeedback.text}</span>
                    <button type="button" onClick={() => setAiPriceFeedback(null)} className="flex-shrink-0 opacity-70 hover:opacity-100">
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {['Sinh hoạt', 'SX/CN', 'Kinh doanh', 'HCSN'].map((tab, idx) => (
                    <button 
                      key={tab}
                      type="button"
                      onClick={() => {
                        setPriceTab(idx);
                        const basePrices = [2894, 1814, 3108, 2030];
                        selectTariffBasePrice(basePrices[idx]);
                      }}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${priceTab === idx ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                {priceTab === 0 && (
                  <>
                    <div className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 mb-2 font-semibold">
                      Cơ cấu 5 bậc mới (thay biểu 6 bậc cũ) · {vatRate > 0 ? `Đã gồm ${Math.round(vatRate * 100)}% VAT` : 'Đơn giá chưa gồm VAT'}
                    </div>
                    <table className="ptab mb-4">
                      <thead><tr><th>Bậc</th><th>kWh</th><th className="text-right">đ/kWh</th></tr></thead>
                      <tbody>
                        {RESIDENTIAL_TIERS_2026.map(t => {
                          const displayPrice = applyVat(t.basePrice, vatRate);
                          const isSelected = selectedBasePrice === t.basePrice || elecPrice === displayPrice;
                          return (
                            <tr
                              key={t.tier}
                              className={`cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50 text-emerald-700 font-black' : ''}`}
                              onClick={() => selectTariffBasePrice(t.basePrice)}
                            >
                              <td>Bậc {t.tier}</td>
                              <td>{t.rangeLabel}</td>
                              <td className="text-right">
                                {displayPrice.toLocaleString('vi-VN')}
                                {vatRate > 0 && (
                                  <span className="block text-[9px] font-normal text-slate-400">
                                    Gốc: {t.basePrice.toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

                {priceTab === 1 && (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="text-[9px] text-slate-500 mb-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                      * Giờ cao điểm: 09:30-11:30, 17:00-20:00 (T2-T7).<br />
                      * Giờ thấp điểm: 22:00-04:00 (Hàng ngày).<br />
                      * Giờ bình thường: Các khung giờ còn lại & Chủ Nhật.
                    </div>
                    <table className="ptab mb-4">
                      <thead><tr><th>Cấp ĐA</th><th>Khung Giờ</th><th className="text-right">đ/kWh</th></tr></thead>
                      <tbody>
                        {PRODUCTION_TARIFFS_2026.map(row => (
                          <React.Fragment key={row.voltageLabel}>
                            <tr className="bg-slate-50 font-bold"><td colSpan={3}>{row.voltageLabel}</td></tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.normal ? 'bg-emerald-50 font-black text-emerald-700' : ''}`}
                              onClick={() => selectTariffBasePrice(row.normal)}
                            >
                              <td>Bình thường</td>
                              <td className="text-[10px]">04:00-09:30...</td>
                              <td className="text-right">{applyVat(row.normal, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.peak ? 'bg-emerald-50 font-black' : ''}`}
                              onClick={() => selectTariffBasePrice(row.peak)}
                            >
                              <td>Cao điểm</td>
                              <td className="text-[10px] text-red-600">09:30-11:30...</td>
                              <td className="text-right text-red-600">{applyVat(row.peak, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.offPeak ? 'bg-emerald-50 font-black' : ''}`}
                              onClick={() => selectTariffBasePrice(row.offPeak)}
                            >
                              <td>Thấp điểm</td>
                              <td className="text-[10px] text-emerald-600">22:00-04:00</td>
                              <td className="text-right text-emerald-600">{applyVat(row.offPeak, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {priceTab === 2 && (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="text-[9px] text-slate-500 mb-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                      * Giờ cao điểm: 09:30-11:30, 17:00-20:00 (T2-T7).<br />
                      * Giờ thấp điểm: 22:00-04:00 (Hàng ngày).<br />
                      * Giờ bình thường: Các khung giờ còn lại & Chủ Nhật.
                    </div>
                    <table className="ptab mb-4">
                      <thead><tr><th>Cấp ĐA</th><th>Khung Giờ</th><th className="text-right">đ/kWh</th></tr></thead>
                      <tbody>
                        {BUSINESS_TARIFFS_2026.map(row => (
                          <React.Fragment key={row.voltageLabel}>
                            <tr className="bg-slate-50 font-bold"><td colSpan={3}>{row.voltageLabel}</td></tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.normal ? 'bg-emerald-50 font-black text-emerald-700' : ''}`}
                              onClick={() => selectTariffBasePrice(row.normal)}
                            >
                              <td>Bình thường</td>
                              <td className="text-[10px]">04:00-09:30...</td>
                              <td className="text-right">{applyVat(row.normal, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.peak ? 'bg-emerald-50 font-black' : ''}`}
                              onClick={() => selectTariffBasePrice(row.peak)}
                            >
                              <td>Cao điểm</td>
                              <td className="text-[10px] text-red-600">09:30-11:30...</td>
                              <td className="text-right text-red-600">{applyVat(row.peak, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                            <tr
                              className={`cursor-pointer hover:bg-emerald-50 ${selectedBasePrice === row.offPeak ? 'bg-emerald-50 font-black' : ''}`}
                              onClick={() => selectTariffBasePrice(row.offPeak)}
                            >
                              <td>Thấp điểm</td>
                              <td className="text-[10px] text-emerald-600">22:00-04:00</td>
                              <td className="text-right text-emerald-600">{applyVat(row.offPeak, vatRate).toLocaleString('vi-VN')}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {priceTab === 3 && (
                  <table className="ptab mb-4">
                    <thead><tr><th>Đối tượng</th><th>Cấp ĐA</th><th className="text-right">đ/kWh</th></tr></thead>
                    <tbody>
                      {ADMIN_TARIFFS_2026.map((row, idx) => {
                        const displayPrice = applyVat(row.basePrice, vatRate);
                        const isSelected = selectedBasePrice === row.basePrice;
                        return (
                          <tr
                            key={idx}
                            className={`cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-emerald-50 font-black text-emerald-700' : ''}`}
                            onClick={() => selectTariffBasePrice(row.basePrice)}
                          >
                            <td>{row.groupLabel}</td>
                            <td>{row.voltageLabel}</td>
                            <td className="font-bold text-right">{displayPrice.toLocaleString('vi-VN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                <div className="fg mt-4 p-4 bg-emerald-50-50 rounded-2xl border-2 border-emerald-100 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-emerald-800 font-black uppercase text-[10px] tracking-wider">Giá điện tính toán (đ/kWh)</label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {vatRate > 0 ? `Gồm VAT ${Math.round(vatRate * 100)}%` : 'Chưa VAT'}
                    </span>
                  </div>
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="number" 
                      className="text-2xl font-black text-emerald-600 bg-transparent border-none focus:ring-0 p-0" 
                      value={elecPrice} 
                      onChange={e => {
                        setSelectedBasePrice(null);
                        setElecPrice(Number(e.target.value));
                      }} 
                    />
                    <span className="ml-auto text-[11px] font-black text-emerald-400">VNĐ/kWh</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 italic mt-2">* Click vào các dòng trong bảng để chọn nhanh giá điện theo QĐ {EVN_2026_META.decision}.</p>
              </div>
            </div>

            {/* Technical Factors */}
            <div className="card">
              <div className="card-head">
                <Settings size={16} className="text-[--gold]" />
                <h3>Hệ số kỹ thuật (PR)</h3>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[12px] font-medium">Hệ số PR: <span className="text-red-600 font-bold">{(pr * 100).toFixed(0)}%</span></label>
                    <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">Tiêu chuẩn</span>
                  </div>
                  <input type="range" min="0.7" max="0.9" step="0.01" value={pr} onChange={e => setPr(Number(e.target.value))} className="w-full accent-red-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>Cũ/Bụi (70%)</span>
                    <span>Mới/Sạch (90%)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="fg">
                    <label>Tổn thất dây (%)</label>
                    <input type="number" step="0.1" value={lossCable} onChange={e => setLossCable(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Tổn thất bụi (%)</label>
                    <input type="number" step="0.1" value={lossDust} onChange={e => setLossDust(Number(e.target.value))} />
                  </div>
                  <div className="fg">
                    <label>Nhiệt độ TB (°C)</label>
                    <input type="number" value={tempAvg} onChange={e => setTempAvg(Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            {/* About NGOCHIEUPC SOLAR */}
            <div className="card bg-neutral-900 border-emerald-900-10 shadow-emerald-900-10">
              <div className="card-body">
                <div className="mb-4">
                  <div className="bg-white rounded-xl px-3 py-2 inline-flex items-center justify-center shadow-sm">
                    <img src="/assets/aistudio/NGOCHIEUPC-SOLAR-logo-mau-4-nen-trong-suot_ccb5f30d.png" alt="NGOCHIEUPC SOLAR" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="text-lg font-black text-emerald-500 tracking-tight mt-2.5">NGOCHIEUPC SOLAR</div>
                </div>
                <p className="text-emerald-500 text-[11px] italic mb-4 leading-relaxed font-bold">"Giải pháp điện mặt trời tối ưu — Tận tâm & Bền vững"</p>
                <p className="text-neutral-400 text-[11px] mb-6 leading-relaxed">
                  <span className="text-emerald-500 font-bold">NGOCHIEUPC SOLAR</span> là thương hiệu cá nhân chuyên tư vấn, thiết kế, tính toán hiệu suất và cung cấp giải pháp điện mặt trời tại Việt Nam. Cam kết mang đến những giá trị kỹ thuật chuẩn xác, minh bạch và bền vững cho khách hàng.
                </p>
                <div className="space-y-3">
                  <a href="tel:0908923886" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--brand-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500-20 rounded-full flex items-center justify-center text-emerald-500"><Phone size={12} /></div> 0908.923.886
                  </a>
                  <a href="mailto:ngochieupc@gmail.com" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--brand-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500-20 rounded-full flex items-center justify-center text-emerald-500"><Mail size={12} /></div> ngochieupc@gmail.com
                  </a>
                  <a href="https://www.facebook.com/ngochieupc/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--brand-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500-20 rounded-full flex items-center justify-center text-emerald-500"><Globe size={12} /></div> facebook.com/ngochieupc
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SystemComparison
          province={province}
          sunHours={sunHours}
          elecPrice={elecPrice}
          pr={pr}
          lossCable={lossCable}
          lossDust={lossDust}
          tempAvg={tempAvg}
          roofUsage={roofUsage}
          degradation={degradation}
          priceIncrease={priceIncrease}
          currentMainConfig={{
            label: 'Cấu hình A (Từ máy tính)',
            panelBrand: panelBrand === 'other' ? 'jinko' : panelBrand,
            panelModel: panelBrand === 'other' ? PIN_DB.jinko[0].model : panelModel,
            panelWp,
            panelEff,
            panelTc: panelTC,
            panelArea,
            panelQty,
            invBrand: invBrand === 'other' ? 'huawei' : invBrand,
            invModel: invBrand === 'other' ? INV_DB.huawei[0].model : invModel,
            invKw,
            invEff,
            invQty,
            investmentMillions: investment,
          }}
        />
      </>
    )}
  </main>

      {/* Footer */}
      <div className="vc-bar">
        <span className="vc-online"></span>Đang online: <span>{Math.floor(Math.random() * 8) + 1}</span> người &nbsp;|&nbsp; Tổng lượt truy cập: <span>{visitorCount.toLocaleString('vi-VN')}</span>
      </div>
      <footer className="bg-[--gray-900] py-12 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-col items-center mb-5">
            <div className="bg-white rounded-2xl px-5 py-2.5 mb-3 shadow-lg inline-flex items-center justify-center">
              <img src="/assets/aistudio/NGOCHIEUPC-SOLAR-logo-mau-4-nen-trong-suot_ccb5f30d.png" alt="NGOCHIEUPC SOLAR" className="h-10 w-auto object-contain" />
            </div>
            <span className="text-2xl font-black text-emerald-500 tracking-tight">NGOCHIEUPC SOLAR</span>
          </div>
          <p className="text-emerald-400 text-xs italic font-semibold mb-2">"Giải pháp điện mặt trời tối ưu — Tận tâm & Bền vững"</p>
          <p className="text-neutral-400 text-xs mb-4">ĐT / Zalo: <a href="tel:0908923886" className="text-neutral-200 hover:text-emerald-400">0908.923.886</a> | Email: <a href="mailto:ngochieupc@gmail.com" className="text-neutral-200 hover:text-emerald-400">ngochieupc@gmail.com</a> | Web: <a href="https://www.facebook.com/ngochieupc/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">https://www.facebook.com/ngochieupc/</a></p>
          <div className="w-12 h-0.5 bg-emerald-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 text-[10px] max-w-md mx-auto leading-relaxed">Kết quả mang tính tham khảo dựa trên dữ liệu bức xạ NASA POWER. Hiệu quả thực tế phụ thuộc điều kiện lắp đặt và vận hành cụ thể.</p>
        </div>
      </footer>

      {/* Floating Contact Bar (Circular & Draggable) */}
      <div 
        className={`fc-container ${showFloating ? 'fc-show' : ''} ${isContactHidden ? 'fc-hidden' : ''}`}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="fc-drag-handle">
          <div className="fc-drag-indicator"></div>
        </div>

        {/* Call Button (Always at top of bar) */}
        <a href="tel:0908923886" className="fc-btn-circle fc-phone-circle animate-pulse" title="Gọi ngay">
          <Phone size={24} fill="white" />
        </a>

        {/* Other Buttons */}
        <a href="https://zalo.me/0908923886" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-zalo-circle" title="Zalo">
          <Zap size={24} />
        </a>
        <a href="https://www.messenger.com/t/7884017904953833/" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-msg-circle" title="Messenger">
          <Mail size={24} />
        </a>
        <a href="https://www.facebook.com/ngochieupc/" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-fb-circle" title="Facebook">
          <Globe size={24} />
        </a>
      </div>

      {/* AI Chatbot */}
      <div className="ai-chat-container">
        {!isChatOpen && (
          <button 
            className="ai-chat-btn"
            onClick={() => setIsChatOpen(true)}
            title="Chat với AI"
          >
            <MessageCircle size={28} />
          </button>
        )}

        {isChatOpen && (
          <div className="ai-chat-window animate-in zoom-in-50 duration-300">
            <div className="ai-chat-header">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white-20 rounded-lg flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">AI Assistant</div>
                  <div className="text-[9px] opacity-80">NGOCHIEUPC SOLAR Expert</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white-20 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="ai-chat-body">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`}>
                  {msg.text}
                </div>
              ))}
              {isChatLoading && (
                <div className="ai-msg ai-msg-bot flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-2 bg-emerald-50 border-t border-emerald-100">
              <button 
                onClick={() => window.open('https://zalo.me/0908923886', '_blank')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Phone size={14} /> CHAT VỚI TƯ VẤN VIÊN (ZALO)
              </button>
            </div>

            <div className="ai-chat-footer">
              <input 
                type="text" 
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
              />
              <button 
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back to Top */}
      <button 
        className={`btt-btn ${showBackToTop ? 'btt-show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <TrendingUp size={24} style={{ transform: 'rotate(-45deg)' }} />
      </button>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-display font-bold text-lg text-gray-900">Gửi kết quả qua Email</h4>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="fg">
                  <label>Tên người nhận</label>
                  <input type="text" placeholder="Nguyễn Văn A" value={emailData.name} onChange={e => setEmailData({...emailData, name: e.target.value})} />
                </div>
                <div className="fg">
                  <label>Email người nhận</label>
                  <input type="email" placeholder="khachhang@email.com" value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} />
                </div>
                <div className="fg">
                  <label>Tên dự án / ghi chú</label>
                  <input type="text" placeholder="Hệ thống solar 50kWp - Hà Nội" value={emailData.project} onChange={e => setEmailData({...emailData, project: e.target.value})} />
                </div>
                <div className="fg">
                  <label>Nội dung thêm (tuỳ chọn)</label>
                  <textarea placeholder="Cảm ơn quý khách đã quan tâm..." value={emailData.note} onChange={e => setEmailData({...emailData, note: e.target.value})} className="h-24"></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsEmailModalOpen(false)} className="flex-1 btn btn-outline justify-center">Huỷ</button>
                <button onClick={sendEmail} className="flex-2 btn btn-green justify-center"><Send size={16} /> Mở ứng dụng Mail</button>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 text-center">* Sẽ mở ứng dụng email mặc định với kết quả tính toán đã điền sẵn.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
