export interface Province {
  ten: string;
  mien: string;
  nang: number;
  monthly: number[];
}

export const KVDATA: Province[] = [
  {ten:"Hà Nội",mien:"Miền Bắc",nang:3.94,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.084]},
  {ten:"Hải Phòng",mien:"Miền Bắc",nang:3.90,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.082]},
  {ten:"Quảng Ninh",mien:"Miền Bắc",nang:4.00,monthly:[.074,.071,.078,.086,.091,.089,.090,.092,.088,.083,.080,.084]},
  {ten:"Nam Định",mien:"Miền Bắc",nang:3.85,monthly:[.072,.069,.076,.084,.089,.087,.090,.092,.087,.082,.079,.083]},
  {ten:"Thanh Hóa",mien:"Miền Bắc",nang:4.10,monthly:[.074,.072,.079,.087,.092,.090,.091,.093,.089,.084,.081,.084]},
  {ten:"Nghệ An",mien:"Miền Trung",nang:4.30,monthly:[.075,.073,.080,.088,.094,.092,.093,.094,.090,.085,.082,.084]},
  {ten:"Hà Tĩnh",mien:"Miền Trung",nang:4.40,monthly:[.075,.073,.080,.088,.094,.092,.093,.095,.091,.086,.082,.085]},
  {ten:"Quảng Bình",mien:"Miền Trung",nang:4.50,monthly:[.076,.074,.081,.089,.095,.093,.094,.095,.092,.087,.083,.085]},
  {ten:"Quảng Trị",mien:"Miền Trung",nang:4.60,monthly:[.076,.074,.082,.090,.096,.094,.095,.096,.092,.087,.083,.085]},
  {ten:"Thừa Thiên Huế",mien:"Miền Trung",nang:4.50,monthly:[.076,.074,.081,.089,.095,.093,.094,.095,.092,.087,.083,.085]},
  {ten:"Đà Nẵng",mien:"Miền Trung",nang:4.90,monthly:[.077,.075,.082,.090,.097,.096,.097,.097,.093,.088,.084,.086]},
  {ten:"Quảng Nam",mien:"Miền Trung",nang:5.00,monthly:[.077,.075,.083,.091,.098,.097,.098,.098,.094,.089,.085,.086]},
  {ten:"Quảng Ngãi",mien:"Miền Trung",nang:5.10,monthly:[.078,.076,.083,.091,.099,.098,.099,.099,.095,.090,.086,.086]},
  {ten:"Bình Định",mien:"Miền Trung",nang:5.20,monthly:[.078,.076,.084,.092,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Phú Yên",mien:"Miền Trung",nang:5.30,monthly:[.079,.077,.084,.092,.100,.100,.101,.100,.096,.091,.087,.087]},
  {ten:"Khánh Hòa",mien:"Miền Trung",nang:5.40,monthly:[.079,.077,.085,.093,.101,.101,.102,.101,.097,.092,.088,.088]},
  {ten:"Ninh Thuận",mien:"Miền Trung",nang:5.80,monthly:[.081,.079,.087,.095,.103,.105,.106,.105,.100,.095,.091,.089]},
  {ten:"Bình Thuận",mien:"Miền Trung",nang:5.70,monthly:[.080,.078,.086,.094,.103,.104,.105,.104,.100,.095,.090,.089]},
  {ten:"Kon Tum",mien:"Tây Nguyên",nang:5.00,monthly:[.077,.076,.083,.091,.097,.095,.097,.098,.094,.090,.086,.086]},
  {ten:"Gia Lai",mien:"Tây Nguyên",nang:5.10,monthly:[.078,.076,.083,.091,.098,.097,.098,.099,.095,.090,.086,.086]},
  {ten:"Đắk Lắk",mien:"Tây Nguyên",nang:5.20,monthly:[.078,.077,.084,.092,.099,.098,.099,.100,.096,.091,.087,.087]},
  {ten:"Đắk Nông",mien:"Tây Nguyên",nang:5.10,monthly:[.078,.076,.083,.091,.098,.097,.098,.099,.095,.090,.086,.086]},
  {ten:"Lâm Đồng",mien:"Tây Nguyên",nang:4.90,monthly:[.077,.075,.082,.090,.097,.096,.097,.097,.093,.089,.085,.086]},
  {ten:"TP. Hồ Chí Minh",mien:"Miền Nam",nang:5.50,monthly:[.080,.079,.086,.093,.102,.102,.103,.102,.098,.093,.089,.089]},
  {ten:"Bình Dương",mien:"Miền Nam",nang:5.40,monthly:[.079,.078,.085,.092,.101,.101,.102,.101,.097,.093,.088,.088]},
  {ten:"Đồng Nai",mien:"Miền Nam",nang:5.40,monthly:[.079,.078,.085,.092,.101,.101,.102,.101,.097,.093,.088,.088]},
  {ten:"Bà Rịa - Vũng Tàu",mien:"Miền Nam",nang:5.60,monthly:[.080,.079,.086,.094,.103,.103,.104,.103,.099,.094,.090,.089]},
  {ten:"Long An",mien:"Miền Nam",nang:5.30,monthly:[.079,.077,.085,.092,.100,.100,.101,.100,.096,.092,.088,.087]},
  {ten:"Tiền Giang",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Bến Tre",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Trà Vinh",mien:"Miền Nam",nang:5.10,monthly:[.078,.076,.083,.091,.098,.097,.098,.099,.095,.090,.086,.086]},
  {ten:"Vĩnh Long",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Đồng Tháp",mien:"Miền Nam",nang:5.10,monthly:[.078,.076,.083,.091,.098,.097,.098,.099,.095,.090,.086,.086]},
  {ten:"An Giang",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Kiên Giang",mien:"Miền Nam",nang:5.40,monthly:[.079,.078,.085,.092,.101,.101,.102,.101,.097,.093,.088,.088]},
  {ten:"Cần Thơ",mien:"Miền Nam",nang:5.30,monthly:[.079,.077,.085,.092,.100,.100,.101,.100,.096,.092,.088,.087]},
  {ten:"Hậu Giang",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Sóc Trăng",mien:"Miền Nam",nang:5.10,monthly:[.078,.076,.083,.091,.098,.097,.098,.099,.095,.090,.086,.086]},
  {ten:"Bạc Liêu",mien:"Miền Nam",nang:5.20,monthly:[.078,.076,.084,.091,.100,.099,.100,.099,.096,.091,.087,.087]},
  {ten:"Cà Mau",mien:"Miền Nam",nang:5.00,monthly:[.077,.075,.083,.090,.097,.096,.097,.097,.093,.089,.085,.086]},
  {ten:"Tây Ninh",mien:"Miền Nam",nang:5.50,monthly:[.080,.079,.086,.093,.102,.102,.103,.102,.098,.093,.089,.089]},
  {ten:"Bình Phước",mien:"Miền Nam",nang:5.30,monthly:[.079,.077,.085,.092,.100,.100,.101,.100,.096,.092,.088,.087]},
  {ten:"Lào Cai",mien:"Miền Bắc",nang:3.80,monthly:[.072,.069,.076,.084,.088,.086,.089,.091,.087,.081,.079,.082]},
  {ten:"Yên Bái",mien:"Miền Bắc",nang:3.75,monthly:[.072,.068,.076,.083,.087,.086,.088,.090,.086,.081,.078,.081]},
  {ten:"Sơn La",mien:"Miền Bắc",nang:4.20,monthly:[.075,.073,.080,.088,.093,.091,.092,.093,.089,.084,.081,.084]},
  {ten:"Điện Biên",mien:"Miền Bắc",nang:4.10,monthly:[.074,.072,.079,.087,.092,.090,.091,.092,.088,.083,.080,.084]},
  {ten:"Lai Châu",mien:"Miền Bắc",nang:4.00,monthly:[.073,.071,.078,.086,.091,.089,.090,.091,.088,.083,.080,.083]},
  {ten:"Hòa Bình",mien:"Miền Bắc",nang:3.90,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.082]},
  {ten:"Phú Thọ",mien:"Miền Bắc",nang:3.85,monthly:[.072,.069,.076,.084,.089,.087,.090,.091,.087,.082,.079,.082]},
  {ten:"Vĩnh Phúc",mien:"Miền Bắc",nang:3.90,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.082]},
  {ten:"Bắc Ninh",mien:"Miền Bắc",nang:3.92,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.083]},
  {ten:"Bắc Giang",mien:"Miền Bắc",nang:3.88,monthly:[.072,.070,.077,.085,.090,.087,.089,.091,.087,.082,.079,.082]},
  {ten:"Thái Nguyên",mien:"Miền Bắc",nang:3.85,monthly:[.072,.069,.076,.084,.089,.087,.090,.091,.087,.082,.079,.082]},
  {ten:"Cao Bằng",mien:"Miền Bắc",nang:4.10,monthly:[.074,.072,.079,.087,.092,.090,.091,.092,.088,.083,.080,.084]},
  {ten:"Bắc Kạn",mien:"Miền Bắc",nang:3.95,monthly:[.073,.071,.078,.086,.091,.089,.090,.092,.088,.083,.080,.083]},
  {ten:"Lạng Sơn",mien:"Miền Bắc",nang:4.05,monthly:[.074,.072,.079,.087,.091,.089,.090,.092,.088,.083,.080,.084]},
  {ten:"Tuyên Quang",mien:"Miền Bắc",nang:3.80,monthly:[.072,.069,.076,.084,.088,.086,.089,.091,.087,.081,.079,.082]},
  {ten:"Hà Giang",mien:"Miền Bắc",nang:3.75,monthly:[.071,.068,.075,.083,.087,.086,.088,.090,.086,.081,.078,.081]},
  {ten:"Hưng Yên",mien:"Miền Bắc",nang:3.92,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.083]},
  {ten:"Hải Dương",mien:"Miền Bắc",nang:3.90,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.082]},
  {ten:"Thái Bình",mien:"Miền Bắc",nang:3.88,monthly:[.072,.070,.077,.085,.090,.087,.089,.091,.087,.082,.079,.082]},
  {ten:"Hà Nam",mien:"Miền Bắc",nang:3.90,monthly:[.073,.070,.077,.085,.090,.088,.090,.092,.088,.083,.080,.082]},
  {ten:"Ninh Bình",mien:"Miền Bắc",nang:3.95,monthly:[.073,.071,.078,.086,.091,.089,.090,.092,.088,.083,.080,.083]}
];

export interface Panel {
  model: string;
  wp: number;
  dai: number;
  rong: number;
  eff: number;
  tc: number;
}

export const PIN_DB: Record<string, Panel[]> = {
  jinko:[
    {model:"JKM450N-54HL4-V",wp:450,dai:2094,rong:1038,eff:21.5,tc:-0.35},
    {model:"JKM550M-72HL4-V",wp:550,dai:2256,rong:1133,eff:21.3,tc:-0.34},
    {model:"JKM580N-72HL4",wp:580,dai:2465,rong:1134,eff:20.8,tc:-0.35},
    {model:"JKM605N-78HL4-BDV",wp:605,dai:2465,rong:1134,eff:21.6,tc:-0.30},
    {model:"JKM620N-78HL4-BDV",wp:620,dai:2465,rong:1134,eff:22.1,tc:-0.29}
  ],
  longi:[
    {model:"Hi-MO 6 LR5-54HTH-420M",wp:420,dai:1722,rong:1134,eff:21.3,tc:-0.34},
    {model:"Hi-MO 6 LR5-66HTH-500M",wp:500,dai:2094,rong:1134,eff:21.1,tc:-0.34},
    {model:"Hi-MO X6 LR5-72HGT-580M",wp:580,dai:2278,rong:1134,eff:22.6,tc:-0.29},
    {model:"Hi-MO X6 Explorer LR5-72HTH-600M",wp:600,dai:2384,rong:1303,eff:22.2,tc:-0.29},
    {model:"Hi-MO X10 LR7-72HVHF-640M (Anti-Dust)",wp:640,dai:2382,rong:1134,eff:23.7,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-645M (Anti-Dust)",wp:645,dai:2382,rong:1134,eff:23.9,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-650M (Anti-Dust)",wp:650,dai:2382,rong:1134,eff:24.1,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-655M (Anti-Dust)",wp:655,dai:2382,rong:1134,eff:24.2,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-660M (Anti-Dust)",wp:660,dai:2382,rong:1134,eff:24.4,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-665M (Anti-Dust)",wp:665,dai:2382,rong:1134,eff:24.6,tc:-0.26},
    {model:"Hi-MO X10 LR7-72HVHF-670M (Anti-Dust)",wp:670,dai:2382,rong:1134,eff:24.8,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-535M (Light Design)",wp:535,dai:1990,rong:1134,eff:23.7,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-540M (Light Design)",wp:540,dai:1990,rong:1134,eff:23.9,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-545M (Light Design)",wp:545,dai:1990,rong:1134,eff:24.2,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-550M (Light Design)",wp:550,dai:1990,rong:1134,eff:24.4,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-555M (Light Design)",wp:555,dai:1990,rong:1134,eff:24.6,tc:-0.26},
    {model:"Hi-MO X10 LR7-60HVHL-560M (Light Design)",wp:560,dai:1990,rong:1134,eff:24.8,tc:-0.26}
  ],
  trina:[
    {model:"TSM-DE09R.05 400W",wp:400,dai:1903,rong:1134,eff:20.8,tc:-0.35},
    {model:"TSM-NEG9R.28 575W",wp:575,dai:2384,rong:1303,eff:22.3,tc:-0.29},
    {model:"TSM-NEG21C.20 700W",wp:700,dai:2384,rong:1303,eff:22.5,tc:-0.29}
  ],
  canadian:[
    {model:"CS6W-545MS",wp:545,dai:2279,rong:1134,eff:21.0,tc:-0.34},
    {model:"CS6W-440MS",wp:440,dai:1903,rong:1134,eff:20.3,tc:-0.35},
    {model:"HiKu7 CS7N-655MS",wp:655,dai:2384,rong:1303,eff:21.0,tc:-0.34}
  ],
  ja:[
    {model:"JAM54S30-405/MR",wp:405,dai:1722,rong:1134,eff:20.8,tc:-0.35},
    {model:"JAM72S30-545/MR",wp:545,dai:2256,rong:1133,eff:21.2,tc:-0.35},
    {model:"JAM72D40-580/LB",wp:580,dai:2278,rong:1134,eff:22.4,tc:-0.29},
    {model:"JAM72D42-625/LB (Double Glass)",wp:625,dai:2465,rong:1134,eff:22.4,tc:-0.29},
    {model:"JAM72D42-630/LB (Double Glass)",wp:630,dai:2465,rong:1134,eff:22.5,tc:-0.29},
    {model:"JAM72D42-635/LB (Double Glass)",wp:635,dai:2465,rong:1134,eff:22.7,tc:-0.29},
    {model:"JAM72D42-640/LB (Double Glass)",wp:640,dai:2465,rong:1134,eff:22.9,tc:-0.29},
    {model:"JAM72D42-645/LB (Double Glass)",wp:645,dai:2465,rong:1134,eff:23.1,tc:-0.29},
    {model:"JAM72D42-650/LB (Double Glass)",wp:650,dai:2465,rong:1134,eff:23.3,tc:-0.29},
    {model:"JAM66D45-605/LB (Double Glass)",wp:605,dai:2382,rong:1134,eff:22.4,tc:-0.29},
    {model:"JAM66D45-610/LB (Double Glass)",wp:610,dai:2382,rong:1134,eff:22.6,tc:-0.29},
    {model:"JAM66D45-615/LB (Double Glass)",wp:615,dai:2382,rong:1134,eff:22.8,tc:-0.29},
    {model:"JAM66D45-620/LB (Double Glass)",wp:620,dai:2382,rong:1134,eff:23.0,tc:-0.29},
    {model:"JAM66D45-625/LB (Double Glass)",wp:625,dai:2382,rong:1134,eff:23.1,tc:-0.29},
    {model:"JAM66D45-630/LB (Double Glass)",wp:630,dai:2382,rong:1134,eff:23.3,tc:-0.29}
  ],
  risen:[
    {model:"RSM40-8-400M",wp:400,dai:1903,rong:950,eff:22.1,tc:-0.34},
    {model:"RSM110-8-540BMDG",wp:540,dai:2279,rong:1134,eff:21.0,tc:-0.34},
    {model:"RSM132-8-660BMDG",wp:660,dai:2384,rong:1303,eff:21.2,tc:-0.34}
  ],
  sunpower:[
    {model:"SPR-MAX3-400",wp:400,dai:1690,rong:1046,eff:22.7,tc:-0.29},
    {model:"SPR-MAX6-440",wp:440,dai:1812,rong:1046,eff:22.8,tc:-0.27}
  ],
  hanwha:[
    {model:"Q.PEAK DUO XL-G10 420",wp:420,dai:1724,rong:1134,eff:21.4,tc:-0.34},
    {model:"Q.PEAK DUO ML-G10+ 500",wp:500,dai:2094,rong:1038,eff:22.3,tc:-0.34},
    {model:"Q.TRON M-G2+ 420",wp:420,dai:1756,rong:1096,eff:21.8,tc:-0.34}
  ],
  other:[]
};

export interface Inverter {
  model: string;
  kw: number;
  eff: number;
}

export const INV_DB: Record<string, Inverter[]> = {
  huawei:[
    {model:"SUN2000-5KTL-L1",kw:5,eff:98.6},{model:"SUN2000-10KTL-M1",kw:10,eff:98.7},
    {model:"SUN2000-20KTL-M2",kw:20,eff:98.8},{model:"SUN2000-36KTL-M3",kw:36,eff:98.9},
    {model:"SUN2000-50KTL-M3",kw:50,eff:98.9},{model:"SUN2000-100KTL-M1",kw:100,eff:99.0},
    {model:"SUN2000-100KTL-M2",kw:100,eff:98.8},
    {model:"SUN2000-150K-MG0",kw:150,eff:98.8},
    {model:"SUN2000-200KTL-H1",kw:200,eff:99.0}
  ],
  sungrow:[
    {model:"SG5.0RS",kw:5,eff:98.4},{model:"SG10RT",kw:10,eff:98.6},
    {model:"SG25RT",kw:25,eff:98.9},{model:"SG50CX",kw:50,eff:98.7},
    {model:"SG110CX",kw:110,eff:99.0},{model:"SG250HX",kw:250,eff:99.0}
  ],
  growatt:[
    {model:"MIN 5000TL-X",kw:5,eff:97.8},{model:"MID 15KTL3-X",kw:15,eff:98.2},
    {model:"MAX 50KTL3 LV",kw:50,eff:98.6},{model:"MAX 100KTL3",kw:100,eff:98.8}
  ],
  sma:[
    {model:"Sunny Boy 5.0",kw:5,eff:98.1},{model:"Sunny Tripower 15000TL",kw:15,eff:98.5},
    {model:"Sunny Tripower 50",kw:50,eff:98.7},{model:"Sunny Central 100",kw:100,eff:98.8}
  ],
  solis:[
    {model:"S5-GR1P3K",kw:3,eff:97.7},{model:"S5-GR3P10K",kw:10,eff:98.2},
    {model:"S5-GR3P25K",kw:25,eff:98.5},{model:"S5-GR3P50K",kw:50,eff:98.5},
    {model:"S6-GR3P110K",kw:110,eff:98.8}
  ],
  fronius:[
    {model:"Primo 5.0-1",kw:5,eff:97.9},{model:"Symo 15.0-3-M",kw:15,eff:98.3},
    {model:"Tauro 50",kw:50,eff:98.8},{model:"Tauro 100",kw:100,eff:98.9}
  ],
  goodwe:[
    {model:"GW5000-MS",kw:5,eff:97.8},{model:"GW15000-ET",kw:15,eff:98.4},
    {model:"GW50K-MT",kw:50,eff:98.6},{model:"GW100K-HT",kw:100,eff:98.8}
  ],
  deye:[
    {model:"SUN-5K-G05",kw:5,eff:97.6},{model:"SUN-8K-G05",kw:8,eff:97.8},
    {model:"SUN-10K-G05",kw:10,eff:98.0},{model:"SUN-12K-G05",kw:12,eff:98.1},
    {model:"SUN-15K-G05",kw:15,eff:98.2},{model:"SUN-17K-G05",kw:17,eff:98.2},
    {model:"SUN-20K-G05",kw:20,eff:98.3},{model:"SUN-25K-G05",kw:25,eff:98.5},
    {model:"SUN-33K-G04",kw:33,eff:98.6},{model:"SUN-50K-G03",kw:50,eff:98.7},
    {model:"SUN-75K-G03",kw:75,eff:98.8},{model:"SUN-110K-G03",kw:110,eff:98.8},
    {model:"SUN-136K-G03",kw:136,eff:98.8}
  ],
  senergy:[
    {model:"SE-5K",kw:5,eff:97.5},{model:"SE-10K",kw:10,eff:97.8},
    {model:"SE-15K",kw:15,eff:98.0},{model:"SE-30K",kw:30,eff:98.3},
    {model:"SE-50K",kw:50,eff:98.3}
  ],
  other:[]
};
