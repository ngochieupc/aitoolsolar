import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// AI Chatbot endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: { role: "user" | "ai"; text: string }[];
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập nội dung câu hỏi." });
    }

    const ai = getAiClient();
    const formattedHistory = Array.isArray(history)
      ? history
          .filter((_, idx) => !(idx === 0 && history[0]?.role === "ai"))
          .map((m) => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.text }],
          }))
      : [];

    const chat = ai.chats.create({
      model: "gemini-4-hydrogen",
      history: formattedHistory,
      config: {
        systemInstruction: `Bạn là trợ lý AI của NGOCHIEUPC SOLAR, chuyên gia về năng lượng mặt trời tại Việt Nam.
Hãy giúp người dùng tính toán tiềm năng, giải thích lợi ích và trả lời các câu hỏi kỹ thuật.
Nếu người dùng cần tư vấn chuyên sâu, báo giá cụ thể hoặc khảo sát thực tế, hãy gợi ý họ chat với Tư vấn viên qua Zalo: 0908923886.
Trả lời ngắn gọn, chuyên nghiệp và thân thiện bằng tiếng Việt.`,
      },
    });

    const response = await chat.sendMessage({ message });
    return res.json({
      text: response.text || "Xin lỗi, tôi không thể trả lời lúc này.",
    });
  } catch (error) {
    console.error("Server /api/ai/chat error:", error);
    const msg =
      error instanceof Error ? error.message : "Lỗi kết nối máy chủ AI.";
    return res.status(500).json({ error: msg });
  }
});

// AI Electricity Price Suggestion endpoint
app.post("/api/ai/electricity-price", async (req, res) => {
  try {
    const {
      customerGroup = "Sinh hoạt (5 bậc)",
      vatRate = 0.08,
    } = (req.body || {}) as {
      customerGroup?: string;
      vatRate?: number;
    };

    const vatPercent = Math.round(Number(vatRate) * 100);
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Bạn là chuyên gia tư vấn biểu giá điện EVN tại Việt Nam năm 2026.
Dựa trên Quyết định số 2892/QĐ-BCT ngày 31/10/2026 (hiệu lực từ 01/11/2026) với giá bán lẻ điện bình quân 2.159,9037 đ/kWh (chưa VAT):
- Sinh hoạt 5 bậc mới (chưa VAT): Bậc 1 (0-100): 1.901; Bậc 2 (101-200): 2.289; Bậc 3 (201-400): 2.894; Bậc 4 (401-700): 3.456; Bậc 5 (>700): 3.844 đ/kWh.
- Sản xuất (chưa VAT): Trung áp 1-35kV (BT 1.814 / CĐ 3.348 / TĐ 1.166); Hạ áp <1kV (BT 1.966 / CĐ 3.586 / TĐ 1.274).
- Kinh doanh (chưa VAT): 6-22kV (BT 3.108 / CĐ 5.202 / TĐ 1.829); Hạ áp <6kV (BT 3.152 / CĐ 5.422 / TĐ 1.918).
- Hành chính sự nghiệp (chưa VAT): Bệnh viện/Trường học <=1kV: 2.030; Cơ quan HCSN <=1kV: 2.181.

Khách hàng đang chọn nhóm: "${customerGroup}" và thuế VAT: ${vatPercent}%.
Lưu ý với điện mặt trời phát vào ban ngày (chủ yếu rơi vào khung giờ Bình thường và khung giờ Cao điểm sáng 09:30-11:30 đối với nhóm 3 giá, hoặc bậc 3-4 đối với hộ gia đình dùng điều hòa ban ngày).
Hãy đề xuất 1 đơn giá điện tính toán hợp lý nhất (đã cộng ${vatPercent}% VAT, làm tròn số nguyên VNĐ/kWh) và giải thích ngắn gọn trong 1-2 câu bằng tiếng Việt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: {
              type: Type.INTEGER,
              description: "Đơn giá điện đề xuất (VNĐ/kWh, số nguyên đã tính VAT theo yêu cầu)",
            },
            explanation: {
              type: Type.STRING,
              description: "Giải thích ngắn gọn 1-2 câu bằng tiếng Việt theo QĐ 2892/QĐ-BCT và khung giờ nắng ban ngày",
            },
          },
          required: ["suggestedPrice", "explanation"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim()) as {
      suggestedPrice?: number;
      explanation?: string;
    };
    const suggestedPrice = Math.round(Number(parsed.suggestedPrice) || 0);
    const explanation =
      parsed.explanation ||
      `Đề xuất theo QĐ 2892/QĐ-BCT (VAT ${vatPercent}%) cho nhóm ${customerGroup}.`;

    return res.json({
      suggestedPrice,
      explanation,
      text: `${suggestedPrice.toLocaleString("vi-VN")} đ/kWh — ${explanation}`,
    });
  } catch (error) {
    console.error("Server /api/ai/electricity-price error:", error);
    const msg =
      error instanceof Error ? error.message : "Không thể lấy dữ liệu giá điện từ AI.";
    return res.status(500).json({ error: msg });
  }
});

// AI Predictive Maintenance Forecast endpoint
app.post("/api/ai/maintenance-forecast", async (req, res) => {
  try {
    const { location, system, productionHistory, currentDate } = req.body;

    if (!location || !system || !Array.isArray(productionHistory)) {
      return res.status(400).json({ error: "Thiếu dữ liệu đầu vào để dự báo bảo trì." });
    }

    const totalExpected = productionHistory.reduce(
      (sum: number, item: { expectedKwh: number }) => sum + (Number(item.expectedKwh) || 0),
      0
    );
    const totalActual = productionHistory.reduce(
      (sum: number, item: { actualKwh: number }) => sum + (Number(item.actualKwh) || 0),
      0
    );
    const overallRatio = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 100;

    const recent3 = productionHistory.slice(-3);
    const recent3Expected = recent3.reduce(
      (sum: number, item: { expectedKwh: number }) => sum + (Number(item.expectedKwh) || 0),
      0
    );
    const recent3Actual = recent3.reduce(
      (sum: number, item: { actualKwh: number }) => sum + (Number(item.actualKwh) || 0),
      0
    );
    const recent3Ratio = recent3Expected > 0 ? (recent3Actual / recent3Expected) * 100 : 100;

    const ai = getAiClient();

    const prompt = `Phân tích dữ liệu vận hành hệ thống điện mặt trời dưới đây và dự báo thời điểm cần bảo trì (vệ sinh tấm pin & kiểm tra biến tần):

Ngày hiện tại: ${currentDate || new Date().toISOString().slice(0, 10)}

1. KHÍ HẬU & MÔI TRƯỜNG ĐỊA PHƯƠNG:
- Tỉnh/Thành phố: ${location.province} (${location.region})
- Giờ nắng trung bình: ${location.sunHours} giờ/ngày
- Nhiệt độ môi trường trung bình: ${location.avgTemp}°C
- Đặc thù môi trường lắp đặt: ${location.environmentLabel}
- Thời tiết thực tế hiện tại (nếu có GPS): ${
      location.currentWeather
        ? `Nhiệt độ ${location.currentWeather.temperature_2m}°C, Độ ẩm ${location.currentWeather.relative_humidity_2m}%, Lượng mưa ${location.currentWeather.precipitation} mm, Mây ${location.currentWeather.cloud_cover}%, Tốc độ gió ${location.currentWeather.wind_speed_10m} km/h, Bức xạ ${Math.round(location.currentWeather.shortwave_radiation)} W/m²`
        : "Chưa có dữ liệu GPS thời gian thực (dùng dữ liệu khí hậu địa phương theo tỉnh/thành)"
    }

2. THÔNG SỐ KỸ THUẬT HỆ THỐNG:
- Công suất dàn pin: ${system.capacityKwp} kWp (${system.panelQty} tấm ${system.panelBrand} ${system.panelModel})
- Biến tần (Inverter): ${system.invQty} × ${system.inverterBrand} ${system.inverterModel} (${system.invKw} kW/máy)
- Tỷ lệ DC/AC: ${system.dcAcRatio}
- Tổn thất bụi đang giả định: ${system.dustLossPercent}%
- Giá điện tham chiếu: ${system.elecPrice} đ/kWh
- Số ngày kể từ lần vệ sinh tấm pin gần nhất: ${system.daysSinceCleaning} ngày
- Số ngày kể từ lần kiểm tra biến tần gần nhất: ${system.daysSinceInverterCheck} ngày

3. LỊCH SỬ SẢN LƯỢNG 6 THÁNG GẦN NHẤT:
${productionHistory
  .map(
    (m: { monthLabel: string; expectedKwh: number; actualKwh: number }) =>
      `- ${m.monthLabel}: Thực tế ${m.actualKwh} kWh / Kỳ vọng ${m.expectedKwh} kWh (${
        m.expectedKwh > 0 ? ((m.actualKwh / m.expectedKwh) * 100).toFixed(1) : "100.0"
      }%)`
  )
  .join("\n")}
- Hiệu suất 6 tháng tổng thể: ${overallRatio.toFixed(1)}%
- Hiệu suất 3 tháng gần nhất: ${recent3Ratio.toFixed(1)}%

Hãy đánh giá kỹ:
- Nếu 3 tháng gần nhất sản lượng giảm rõ rệt so với kỳ vọng hoặc số ngày chưa vệ sinh lâu kết hợp môi trường nhiều bụi/khô hạn -> ưu tiên vệ sinh tấm pin sớm và tính toán tổn thất doanh thu ước tính hợp lý.
- Nếu nhiệt độ cao, độ ẩm/hơi muối cao, DC/AC ratio cao (> 1.25), hoặc sụt giảm sản lượng đột ngột không chỉ do bụi -> cảnh báo kiểm tra biến tần (quạt làm mát, đầu nối MC4/DC, tản nhiệt, phần mềm/log lỗi, chống sét SPD).
- Trả về JSON đúng schema yêu cầu, hoàn toàn bằng tiếng Việt, thực tế và hữu ích cho kỹ sư O&M.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction:
          "Bạn là kỹ sư trưởng O&M điện mặt trời (Solar Predictive Maintenance AI) tại Việt Nam. Hãy phân tích chính xác dữ liệu khí hậu địa phương, môi trường bụi/muối, thông số DC/AC và chuỗi sản lượng lịch sử để đưa ra dự báo thời điểm bảo trì sát thực tế.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallStatus: {
              type: Type.STRING,
              description: "Một trong 3 giá trị: 'TỐT', 'CẦN CHÚ Ý', 'CẦN BẢO TRÌ NGAY'",
            },
            riskScore: {
              type: Type.INTEGER,
              description: "Điểm rủi ro/ưu tiên bảo trì từ 0 đến 100",
            },
            summary: {
              type: Type.STRING,
              description: "Tóm tắt nhận định tổng quan về tình trạng hệ thống trong 2-3 câu",
            },
            panelCleaning: {
              type: Type.OBJECT,
              properties: {
                urgency: {
                  type: Type.STRING,
                  description: "Mức độ khẩn cấp: 'Thấp', 'Trung bình', 'Cao', hoặc 'Khẩn cấp'",
                },
                recommendedDate: {
                  type: Type.STRING,
                  description: "Thời điểm khuyến nghị vệ sinh pin (VD: 'Trong 3 - 5 ngày tới' hoặc ngày cụ thể)",
                },
                nextCycleDays: {
                  type: Type.INTEGER,
                  description: "Chu kỳ vệ sinh định kỳ khuyến nghị tiếp theo (số ngày)",
                },
                estimatedLossPercent: {
                  type: Type.NUMBER,
                  description: "Phần trăm suy giảm sản lượng ước tính do bụi bẩn (%)",
                },
                estimatedMonthlyLossVnd: {
                  type: Type.INTEGER,
                  description: "Thiệt hại tiền điện ước tính mỗi tháng do suy giảm (VNĐ)",
                },
                reason: {
                  type: Type.STRING,
                  description: "Phân tích nguyên nhân dựa trên lịch sử sản lượng và điều kiện bụi/mưa địa phương",
                },
                checklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3-4 đầu việc vệ sinh tấm pin cụ thể",
                },
              },
              required: [
                "urgency",
                "recommendedDate",
                "nextCycleDays",
                "estimatedLossPercent",
                "estimatedMonthlyLossVnd",
                "reason",
                "checklist",
              ],
            },
            inverterInspection: {
              type: Type.OBJECT,
              properties: {
                urgency: {
                  type: Type.STRING,
                  description: "Mức độ khẩn cấp: 'Thấp', 'Trung bình', 'Cao', hoặc 'Khẩn cấp'",
                },
                recommendedDate: {
                  type: Type.STRING,
                  description: "Thời điểm khuyến nghị kiểm tra biến tần",
                },
                nextCycleMonths: {
                  type: Type.INTEGER,
                  description: "Chu kỳ kiểm tra biến tần định kỳ tiếp theo (số tháng)",
                },
                dcAcAssessment: {
                  type: Type.STRING,
                  description: "Đánh giá tỷ lệ DC/AC, tải nhiệt và môi trường hoạt động của Inverter",
                },
                reason: {
                  type: Type.STRING,
                  description: "Lý do khuyến nghị kiểm tra biến tần",
                },
                checklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3-4 đầu việc kiểm tra biến tần an toàn",
                },
              },
              required: [
                "urgency",
                "recommendedDate",
                "nextCycleMonths",
                "dcAcAssessment",
                "reason",
                "checklist",
              ],
            },
            climateImpactNotes: {
              type: Type.STRING,
              description: "Lưu ý riêng theo mùa và đặc thù khí hậu tại tỉnh/thành phố đang lắp đặt",
            },
          },
          required: [
            "overallStatus",
            "riskScore",
            "summary",
            "panelCleaning",
            "inverterInspection",
            "climateImpactNotes",
          ],
        },
      },
    });

    const jsonStr = (response.text ?? "{}").trim();
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (error) {
    console.error("Server /api/ai/maintenance-forecast error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Không thể phân tích dự báo bảo trì lúc này.";
    return res.status(500).json({ error: msg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
