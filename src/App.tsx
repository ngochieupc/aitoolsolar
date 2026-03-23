import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, Mail, Globe, Info, Download, Image as ImageIcon, 
  Send, Printer, MapPin, Layout, Zap, Settings, TrendingUp, 
  BarChart3, CheckCircle2, X, Cloud, Sun, CloudRain, Wind,
  MessageCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, BarController, LineController } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { KVDATA, PIN_DB, INV_DB, Province, Panel, Inverter } from './data/solarData';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, 
  Title, Tooltip, Legend, BarController, LineController
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
  const [elecPrice, setElecPrice] = useState<number>(2729);

  // --- New State for Demand ---
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [monthlyKwh, setMonthlyKwh] = useState<number>(0);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [emailData, setEmailData] = useState({ name: '', to: '', project: '', note: '' });

  const [priceTab, setPriceTab] = useState(0);
  const [activeMainTab, setActiveMainTab] = useState<'calc' | 'news' | 'weather'>('calc');
  const [showFloating, setShowFloating] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // --- AI Chatbot State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI của Vity Solar. Tôi có thể giúp gì cho bạn về giải pháp năng lượng mặt trời?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isContactHidden, setIsContactHidden] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userMsg,
        config: {
          systemInstruction: `Bạn là trợ lý AI của Vity Solar, chuyên gia về năng lượng mặt trời tại Việt Nam. 
          Hãy giúp người dùng tính toán tiềm năng, giải thích lợi ích và trả lời các câu hỏi kỹ thuật. 
          Nếu người dùng cần tư vấn chuyên sâu, báo giá cụ thể hoặc khảo sát thực tế, hãy gợi ý họ chat với Tư vấn viên qua Zalo: 0908923886. 
          Trả lời ngắn gọn, chuyên nghiệp và thân thiện.`,
        },
      });
      
      const text = response.text || "Xin lỗi, tôi không thể trả lời lúc này.";
      setChatMessages(prev => [...prev, { role: 'ai', text }]);
    } catch (error) {
      console.error("Chat AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, tôi gặp chút sự cố kỹ thuật. Bạn có thể liên hệ trực tiếp với tư vấn viên qua Zalo: 0908923886 để được hỗ trợ ngay nhé!' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const calcMainRef = useRef<HTMLDivElement>(null);

  const fetchWeather = () => {
    if ("geolocation" in navigator) {
      setWeatherLoading(true);
      setWeatherError(null);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,direct_radiation,diffuse_radiation,shortwave_radiation&timezone=auto`);
            const data = await res.json();
            setWeather(data.current);
          } catch (err) {
            console.error("Weather fetch error:", err);
            setWeatherError("Không thể tải dữ liệu thời tiết. Vui lòng kiểm tra kết nối mạng.");
          } finally {
            setWeatherLoading(false);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          let msg = "Vui lòng cho phép truy cập vị trí để xem dữ liệu quang năng tại khu vực của bạn.";
          if (err.code === 1) msg = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.";
          else if (err.code === 2) msg = "Không thể xác định vị trí của bạn. Vui lòng thử lại.";
          else if (err.code === 3) msg = "Yêu cầu xác định vị trí đã hết thời gian. Vui lòng thử lại.";
          setWeatherError(msg);
          setWeatherLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setWeatherError("Trình duyệt của bạn không hỗ trợ định vị GPS.");
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
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hãy cho biết biểu giá điện EVN mới nhất tại Việt Nam (tháng 3/2026 hoặc gần nhất). Chỉ trả về con số giá điện trung bình (VNĐ/kWh) và một câu giải thích ngắn gọn.",
      });
      const text = response.text || "";
      const priceMatch = text.match(/\d{1,}\.\d{3}|\d{4}/);
      if (priceMatch) {
        const suggestedPrice = Number(priceMatch[0].replace('.', ''));
        setElecPrice(suggestedPrice);
        alert(`AI Gợi ý: ${text}`);
      } else {
        alert(`AI Phản hồi: ${text}`);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Không thể kết nối với AI để lấy giá điện. Vui lòng kiểm tra kết nối.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Handlers ---
  const calculateKwhFromBill = (bill: number) => {
    // EVN Tiers 2024 (Residential)
    const tiers = [
      { max: 50, price: 1806 },
      { max: 50, price: 1866 },
      { max: 100, price: 2167 },
      { max: 100, price: 2729 },
      { max: 100, price: 3050 },
      { max: Infinity, price: 3151 }
    ];
    
    let remainingBill = bill / 1.08; // Subtract 8% VAT
    let totalKwh = 0;
    
    for (const tier of tiers) {
      const tierMaxCost = tier.max * tier.price;
      if (remainingBill > tierMaxCost) {
        totalKwh += tier.max;
        remainingBill -= tierMaxCost;
      } else {
        totalKwh += remainingBill / tier.price;
        remainingBill = 0;
        break;
      }
    }
    return Math.round(totalKwh);
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
    const tienNam = slNam * elecPrice;
    const co2 = slNam * 0.000533;
    const yield_val = csLapDat > 0 ? Math.round(slNam / csLapDat) : 0;
    const dcac = (csLapDat > 0 && invKw > 0) ? (csLapDat / (invKw * invQty)) : 0;

    // Financial
    let total25 = 0;
    let tn = tienNam;
    let gp = 1;
    for (let i = 0; i < 25; i++) {
      total25 += tn * gp;
      gp *= (1 + priceIncrease / 100);
      tn *= (1 - degradation / 100);
    }
    const payback = tienNam > 0 ? (investment * 1e6 / tienNam) : 0;
    const irr = investment > 0 ? ((total25 - investment * 1e6) / (investment * 1e6) / 25 * 100) : 0;

    return {
      csLapDat, csDinh, slNgay, slNam, tienNam, co2, yield_val, dcac,
      total25, payback, irr
    };
  }, [panelQty, panelWp, pr, lossCable, lossDust, invEff, tempAvg, panelTC, sunHours, elecPrice, investment, degradation, priceIncrease, invKw, invQty]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const slM = province.monthly.map(f => Math.round(f * results.slNam));
    const revM = slM.map(s => Math.round(s * elecPrice / 1000));

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
  }, [province, results.slNam, elecPrice]);

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

  const getResultSummary = () => {
    return `VITY SOLAR — KẾT QUẢ TÍNH TOÁN HỆ THỐNG ĐIỆN MẶT TRỜI
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
Điện năng / năm     : ${Math.round(results.slNam).toLocaleString()} kWh
Specific Yield      : ${results.yield_val} kWh/kWp/năm
-------------------------------------------------------
Tiết kiệm / tháng   : ${Math.round(results.tienNam / 12).toLocaleString()} đồng
Tiết kiệm / năm     : ${Math.round(results.tienNam).toLocaleString()} đồng
Giảm phát thải CO₂  : ${results.co2.toFixed(2)} tấn/năm
-------------------------------------------------------
VITY SOLAR | ĐT: 0766.39.6699 | vitysolar.vn
"Xây dựng một cuộc sống xanh, ổn định và bền vững"`;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const summary = getResultSummary();
    const lines = summary.split('\n');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(lines[0], 15, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 30;
    lines.slice(1).forEach(line => {
      doc.text(line, 15, y);
      y += 6;
    });

    // Add Chart if possible
    const chartCanvas = document.querySelector('canvas');
    if (chartCanvas) {
      const chartImg = chartCanvas.toDataURL('image/png');
      doc.addImage(chartImg, 'PNG', 15, y + 10, 180, 80);
    }

    doc.save(`VitySolar_TinhToan_${province.ten}.pdf`);
  };

  const exportImage = async () => {
    if (calcMainRef.current) {
      const canvas = await html2canvas(calcMainRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fafafa'
      });
      const link = document.createElement('a');
      link.download = `VitySolar_Result_${province.ten}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Kết quả tính toán điện mặt trời - ${emailData.project || 'Dự án Solar'}`);
    const summary = getResultSummary();
    const body = encodeURIComponent(`Kính gửi ${emailData.name},\n\n${emailData.note ? emailData.note + '\n\n' : ''}${summary}\n\n---\nEmail được tạo tự động từ công cụ tính toán tại vitysolar.vn`);
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
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
                <Zap className="text-white" size={24} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">VITY SOLAR</span>
                <span className="text-[10px] font-bold text-emerald-600 tracking-[0.2em] uppercase mt-1">Năng lượng xanh</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setActiveMainTab('calc')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'calc' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>CÔNG CỤ TÍNH</button>
            <button onClick={() => setActiveMainTab('news')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'news' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>TIN TỨC & HD</button>
            <button onClick={() => setActiveMainTab('weather')} className={`py-2 px-4 rounded-lg text-[11px] font-black transition-all ${activeMainTab === 'weather' ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>THỜI TIẾT & QUANG NĂNG</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end border-l border-slate-200 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hotline 24/7</span>
              <a href="tel:0766396699" className="text-emerald-600 font-black text-sm">0766.39.6699</a>
            </div>
            <button className="lg:hidden p-2 text-slate-600"><Layout size={24} /></button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-neutral-900 via-emerald-950 to-red-950 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, white 35px, white 70px)' }}></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1 text-red-400 text-[10px] font-bold mb-4 animate-pulse">
            ★ Cập nhật giá điện QĐ 1279/QĐ-BCT — Hiệu lực từ 10/5/2025
          </div>
          <h1 className="text-white font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
            Tính toán hệ thống<br /><span className="text-red-500">điện mặt trời</span> chuyên nghiệp
          </h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
            Nhập bất kỳ thông số nào — hệ thống tự động tính toán ngược/xuôi tất cả các dữ liệu liên quan. Dữ liệu bức xạ NASA POWER 63 tỉnh thành.
          </p>
          <div className="flex flex-wrap gap-2">
            {["63 tỉnh thành", "Tính 2 chiều", "Dân dụng & CN", "Giá điện EVN", "Xuất PDF/Ảnh"].map(tag => (
              <span key={tag} className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-neutral-400 text-[11px]">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {activeMainTab === 'weather' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card border-2 border-emerald-100 shadow-2xl shadow-emerald-500/5">
              <div className="card-head bg-emerald-50 border-b-2 border-emerald-100">
                <Sun size={18} className="text-emerald-600" />
                <h3 className="flex-1 font-black text-slate-800 uppercase tracking-wider">Dashboard Thời tiết & Quang năng thời gian thực</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-emerald-600 font-black uppercase">Live Data</span>
                </div>
              </div>
              <div className="card-body p-8">
                {weatherLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Đang xác định vị trí và tải dữ liệu quang năng...</p>
                  </div>
                ) : weather ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Weather Info */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
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
                    <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-slate-900/20">
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
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xs text-slate-400">Bức xạ trực tiếp</span>
                            <span className="text-sm font-black text-amber-200">{Math.round(weather.direct_radiation)} W/m²</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xs text-slate-400">Bức xạ khuếch tán</span>
                            <span className="text-sm font-black text-amber-200">{Math.round(weather.diffuse_radiation)} W/m²</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <p className="text-[10px] text-amber-200 italic leading-relaxed">
                          Dữ liệu bức xạ mặt trời được tính toán dựa trên tọa độ GPS thực tế của bạn, giúp đánh giá hiệu suất tức thời của hệ thống Solar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold max-w-md mx-auto">{weatherError || "Vui lòng cho phép truy cập vị trí để xem dữ liệu quang năng tại khu vực của bạn."}</p>
                    <button onClick={fetchWeather} className="mt-4 btn btn-green">THỬ LẠI</button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setActiveMainTab('calc')} className="btn btn-green w-full justify-center py-4 text-sm font-black shadow-lg shadow-emerald-500/20">QUAY LẠI CÔNG CỤ TÍNH TOÁN</button>
          </div>
        ) : activeMainTab === 'news' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card">
              <div className="card-head bg-emerald-50 border-b-2 border-emerald-100">
                <Zap size={16} className="text-emerald-600" />
                <h3 className="flex-1">Tin tức & Hướng dẫn Solar</h3>
                <button 
                  onClick={() => {
                    alert("Đang cập nhật dữ liệu mới nhất từ hệ thống...");
                    // Logic to refresh data could go here
                  }}
                  className="btn btn-green text-[10px] py-1 px-3"
                >
                  CẬP NHẬT MỚI
                </button>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-900 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider text-sm">Tin tức ngành năng lượng</h4>
                    <ul className="space-y-4">
                      {[
                        { t: "Cập nhật biểu giá điện EVN 2025 mới nhất", s: "EVN", l: "https://www.evn.com.vn/" },
                        { t: "Chính sách khuyến khích điện mặt trời mái nhà tự sản tự tiêu", s: "Báo Chính phủ", l: "https://baochinhphu.vn/" },
                        { t: "Xu hướng công nghệ pin N-Type năm 2026", s: "Năng lượng Việt Nam", l: "https://nangluongvietnam.vn/" },
                        { t: "Việt Nam đặt mục tiêu 50% mái nhà lắp điện mặt trời vào 2030", s: "VnExpress", l: "https://vnexpress.net/" },
                        { t: "Giá pin lưu trữ giảm mạnh, cơ hội cho hộ gia đình", s: "Tuổi Trẻ", l: "https://tuoitre.vn/" },
                      ].map((n, i) => (
                        <li key={i} className="group border-b border-slate-50 pb-3 last:border-0">
                          <a href={n.l} target="_blank" className="flex flex-col hover:bg-emerald-50/50 p-2 rounded-lg transition-all">
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
                        { t: "Quy trình vệ sinh tấm pin mặt trời chuẩn O&M", s: "Vity Solar", l: "https://ngochieupc.github.io/quytrinhvesinh/" },
                        { t: "Cách kiểm tra hiệu suất Inverter qua App", s: "Kỹ thuật Solar", l: "#" },
                        { t: "Lưu ý an toàn khi lắp đặt hệ thống Solar", s: "EVN SPC", l: "https://evnspc.vn/" },
                        { t: "Hướng dẫn tính toán dung lượng pin lưu trữ (ESS)", s: "Vity Solar", l: "#" },
                        { t: "Khắc phục các lỗi thường gặp ở Inverter hòa lưới", s: "Kỹ thuật Solar", l: "#" },
                      ].map((n, i) => (
                        <li key={i} className="group border-b border-slate-50 pb-3 last:border-0">
                          <a href={n.l} target="_blank" className="flex flex-col hover:bg-blue-50/50 p-2 rounded-lg transition-all">
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
                    * Các thông tin và video trên được tổng hợp từ các nguồn internet miễn phí, chính thống và các Youtuber uy tín. Vity Solar cam kết tôn trọng bản quyền, ghi rõ nguồn và dẫn link đầy đủ. Nếu có bất kỳ vấn đề nào về bản quyền, vui lòng liên hệ với chúng tôi.
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveMainTab('calc')} className="btn btn-green w-full justify-center py-4 text-sm font-black shadow-lg shadow-emerald-500/20">QUAY LẠI CÔNG CỤ TÍNH TOÁN</button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
        <div className="toolbar-glass">
          <button onClick={exportPDF} className="btn btn-red"><Download size={18} /> Tải PDF Báo cáo</button>
          <button onClick={exportImage} className="btn btn-blue"><ImageIcon size={18} /> Tải ảnh PNG</button>
          <button onClick={() => setIsEmailModalOpen(true)} className="btn btn-green"><Send size={18} /> Gửi qua Email</button>
          <button onClick={() => window.print()} className="btn btn-outline"><Printer size={18} /> In trang</button>
          <a 
            href="https://ngochieupc.github.io/quytrinhvesinh/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
          >
            <Settings size={18} /> O&M Solar
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6" ref={calcMainRef}>
            
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
                      setElecPrice(type === 'dd' ? 2729 : 1673);
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
                        className="pr-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500/10 text-slate-900 font-medium" 
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
                        className="pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500/10 text-slate-900 font-medium" 
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
                          <Phone size={10} /> Tel: 0766.39.6699 / 0908.923.886
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
                    <div className="text-[11px] font-medium text-orange-700 mb-1">Tiết kiệm / tháng</div>
                    <div className="rcard-val">{Math.round(results.tienNam / 12).toLocaleString()}</div>
                    <div className="text-[10px] text-orange-500 mt-1">đồng</div>
                  </div>
                  <div className="rcard or">
                    <div className="text-[11px] font-medium text-orange-700 mb-1">Tiết kiệm / năm</div>
                    <div className="rcard-val">{Math.round(results.tienNam).toLocaleString()}</div>
                    <div className="text-[10px] text-orange-500 mt-1">đồng</div>
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
                  
                  {investment > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <table className="hv-table">
                        <tbody>
                          <tr><td>Chi phí đầu tư</td><td>{(investment * 1e6).toLocaleString()} đ</td></tr>
                          <tr><td>Doanh thu điện năm 1</td><td>{Math.round(results.tienNam).toLocaleString()} đ/năm</td></tr>
                          <tr><td>Thời gian hoàn vốn</td><td>{results.payback.toFixed(1)} năm</td></tr>
                          <tr><td>Tổng doanh thu 25 năm</td><td>{Math.round(results.total25).toLocaleString()} đ</td></tr>
                          <tr><td>Lợi nhuận ròng 25 năm</td><td>{Math.round(results.total25 - investment * 1e6).toLocaleString()} đ</td></tr>
                          <tr><td><span className="font-bold">IRR đơn giản</span></td><td>{results.irr.toFixed(1)}%/năm</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
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

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Weather & Solar Irradiance (Mini View) */}
            {weather && (
              <div className="card overflow-hidden border-2 border-emerald-100 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setActiveMainTab('weather')}>
                <div className="card-head bg-emerald-50/50 border-b border-emerald-100">
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
              <div className="card-head bg-slate-50 border-b-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <h3 className="flex-1 font-black text-slate-800">GIÁ ĐIỆN EVN 2025</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open('https://www.evn.com.vn/c3/evn-va-khach-hang/Bieu-gia-ban-le-dien-2-12.aspx', '_blank')}
                    className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    CẬP NHẬT GIÁ MỚI
                  </button>
                  <button 
                    onClick={askAiForPrice}
                    disabled={isAiLoading}
                    className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 border border-blue-200"
                  >
                    {isAiLoading ? "ĐANG HỎI AI..." : "HỎI AI GIÁ MỚI"}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {['Sinh hoạt', 'SX/CN', 'Kinh doanh', 'HCSN'].map((tab, idx) => (
                    <button 
                      key={tab}
                      onClick={() => {
                        setPriceTab(idx);
                        const prices = [2998, 1979, 3108, 2010];
                        setElecPrice(prices[idx]);
                      }}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${priceTab === idx ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                {priceTab === 0 && (
                  <table className="ptab mb-4">
                    <thead><tr><th>Bậc</th><th>kWh</th><th>đ/kWh</th></tr></thead>
                    <tbody>
                      {[
                        { b: 1, k: '0-50', p: 1984 },
                        { b: 2, k: '51-100', p: 2050 },
                        { b: 3, k: '101-200', p: 2380 },
                        { b: 4, k: '201-300', p: 2998 },
                        { b: 5, k: '301-400', p: 3350 },
                        { b: 6, k: '>400', p: 3460 },
                      ].map(t => (
                        <tr key={t.b} className={`cursor-pointer hover:bg-slate-50 transition-colors ${elecPrice === t.p ? 'bg-emerald-50 text-emerald-700 font-black' : ''}`} onClick={() => setElecPrice(t.p)}>
                          <td>Bậc {t.b}</td><td>{t.k}</td><td className="text-right">{t.p.toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {priceTab === 1 && (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="text-[9px] text-slate-500 mb-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                      * Giờ cao điểm: 09:30-11:30, 17:00-20:00 (T2-T7).<br />
                      * Giờ thấp điểm: 22:00-04:00 (Hàng ngày).<br />
                      * Giờ bình thường: Các khung giờ còn lại & Chủ Nhật.
                    </div>
                    <table className="ptab mb-4">
                      <thead><tr><th>Cấp ĐA</th><th>Khung Giờ</th><th>đ/kWh</th></tr></thead>
                      <tbody>
                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp từ 110 kV trở lên</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1853)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">1.853</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3391)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">3.391</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1136)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.136</td></tr>
                        
                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp từ 22 kV đến dưới 110 kV</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1922)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">1.922</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3515)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">3.515</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1181)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.181</td></tr>

                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp từ 6 kV đến dưới 22 kV</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1979)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">1.979</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3612)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">3.612</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1213)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.213</td></tr>

                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp dưới 6 kV</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(2037)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">2.037</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3718)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">3.718</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1252)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.252</td></tr>
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
                      <thead><tr><th>Cấp ĐA</th><th>Khung Giờ</th><th>đ/kWh</th></tr></thead>
                      <tbody>
                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp từ 22 kV trở lên</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(2864)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">2.864</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(4924)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">4.924</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1750)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.750</td></tr>
                        
                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp từ 6 kV đến dưới 22 kV</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3031)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">3.031</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(5189)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">5.189</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1841)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.841</td></tr>

                        <tr className="bg-slate-50 font-bold"><td colSpan={3}>Cấp điện áp dưới 6 kV</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(3108)}><td>Bình thường</td><td className="text-[10px]">04:00-09:30...</td><td className="text-right">3.108</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(5312)}><td>Cao điểm</td><td className="text-[10px] text-red-600">09:30-11:30...</td><td className="text-right text-red-600">5.312</td></tr>
                        <tr className="cursor-pointer hover:bg-emerald-50" onClick={() => setElecPrice(1890)}><td>Thấp điểm</td><td className="text-[10px] text-emerald-600">22:00-04:00</td><td className="text-right text-emerald-600">1.890</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {priceTab === 3 && (
                  <table className="ptab mb-4">
                    <thead><tr><th>Đối tượng</th><th>Cấp ĐA</th><th>đ/kWh</th></tr></thead>
                    <tbody>
                      <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setElecPrice(2010)}>
                        <td>Bệnh viện, trường học</td><td>Dưới 6kV</td><td className="font-bold text-right">2.010</td>
                      </tr>
                      <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setElecPrice(1935)}>
                        <td>Chiếu sáng công cộng</td><td>Dưới 6kV</td><td className="font-bold text-right">1.935</td>
                      </tr>
                      <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setElecPrice(2150)}>
                        <td>Cơ quan hành chính</td><td>Dưới 6kV</td><td className="font-bold text-right">2.150</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <div className="fg mt-4 p-4 bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 shadow-inner">
                  <label className="text-emerald-800 font-black uppercase text-[10px] tracking-wider">Giá điện tính toán (đ/kWh)</label>
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      className="text-2xl font-black text-emerald-600 bg-transparent border-none focus:ring-0 p-0" 
                      value={elecPrice} 
                      onChange={e => setElecPrice(Number(e.target.value))} 
                    />
                    <span className="ml-auto text-[11px] font-black text-emerald-400">VNĐ/kWh</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 italic mt-2">* Click vào các dòng trong bảng để chọn nhanh giá điện.</p>
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

            {/* About Vity Solar */}
            <div className="card bg-neutral-900 border-emerald-900/30 shadow-2xl shadow-emerald-900/10">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-lg">
                    <Zap className="text-white" size={18} fill="currentColor" />
                  </div>
                  <span className="text-lg font-black text-emerald-600 tracking-tighter">VITY SOLAR</span>
                </div>
                </div>
                <p className="text-emerald-600 text-[11px] italic mb-4 leading-relaxed font-bold">"Xây dựng một cuộc sống xanh, ổn định và bền vững"</p>
                <p className="text-neutral-400 text-[11px] mb-6">
                  <span className="text-emerald-600 font-bold">CÔNG TY CỔ PHẦN NĂNG LƯỢNG XANH VITY SOLAR</span> tự hào là đơn vị tiên phong trong lĩnh vực cung cấp giải pháp năng lượng sạch tại Việt Nam. Chúng tôi cam kết mang đến những giá trị bền vững cho khách hàng và cộng đồng.
                </p>
                <div className="space-y-3">
                  <a href="tel:07663966699" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--vity-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><Phone size={12} /></div> 0766.39.6699
                  </a>
                  <a href="mailto:ngochieupc@gmail.com" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--vity-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><Mail size={12} /></div> ngochieupc@gmail.com
                  </a>
                  <a href="https://vitysolar.vn" target="_blank" className="flex items-center gap-3 text-neutral-300 text-xs hover:text-[--vity-green] transition-colors">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><Globe size={12} /></div> vitysolar.vn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </main>

      {/* Footer */}
      <div className="vc-bar">
        <span className="vc-online"></span>Đang online: <span>{Math.floor(Math.random() * 8) + 1}</span> người &nbsp;|&nbsp; Tổng lượt truy cập: <span>{visitorCount.toLocaleString('vi-VN')}</span>
      </div>
      <footer className="bg-[--gray-900] py-12 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-col items-center mb-6 opacity-80">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-2xl mb-2 shadow-lg shadow-emerald-600/20">
              <Zap className="text-white" size={28} fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-emerald-600 tracking-tighter">VITY SOLAR</span>
          </div>
          <h4 className="text-emerald-600 font-display font-black text-sm mb-2 uppercase tracking-widest">CÔNG TY CỔ PHẦN NĂNG LƯỢNG XANH VITY SOLAR</h4>
          <p className="text-neutral-400 text-xs mb-4">ĐT: 0766.39.6699 | Email: ngochieupc@gmail.com | Web: <a href="https://vitysolar.vn" className="text-emerald-600 hover:underline">vitysolar.vn</a></p>
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
        <a href="tel:0766396699" className="fc-btn-circle fc-phone-circle animate-pulse" title="Gọi ngay">
          <Phone size={24} fill="white" />
        </a>

        {/* Other Buttons */}
        <a href="https://zalo.me/0908923886" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-zalo-circle" title="Zalo">
          <Zap size={24} />
        </a>
        <a href="https://www.messenger.com/t/7884017904953833/" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-msg-circle" title="Messenger">
          <Mail size={24} />
        </a>
        <a href="https://www.facebook.com/ngochieupc" target="_blank" rel="noopener noreferrer" className="fc-btn-circle fc-fb-circle" title="Facebook">
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
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">AI Assistant</div>
                  <div className="text-[9px] opacity-80">Vity Solar Expert</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
