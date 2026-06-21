import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, history, pdfData, fileName } = req.body;
      
      let systemInstruction = "Sen samimi, yardımsever ve Türkçe konuşan bir çalışma asistanısın. Öğrencinin derslerine yardım et.";
      
      let contents: any[] = [];
      
      if (pdfData) {
        // If there's a PDF, we might use a specific prompt style or include the PDF inline
        contents.push({
          inlineData: {
            mimeType: "application/pdf",
            data: pdfData // Base64 without data URL prefix
          }
        });
        
        systemInstruction += ` Ekte '${fileName}' adlı belge var. Gerekirse soruları buna göre cevapla.`;
      }
      
      contents.push(prompt);

      // We'll format the history to just text prompts if possible, or omit history when a file is initially uploaded 
      // since the File + text combination in history is complex for a simple setup. For now we will just use 
      // a single generateContent call with the PDF every time or just answer directly.
      // To simulate conversation, we could just include past messages as text context.
      if (history && history.length > 0) {
         let historyText = history.map((m: any) => `${m.isBot ? 'Asistan' : 'Kullanıcı'}: ${m.text}`).join("\n");
         contents = [ `Geçmiş konuşma:\n${historyText}\n\nŞuanki soru:\n`, ...contents ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
           systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Bir hata oluştu" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
