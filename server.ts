import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const getAiInstance = () => {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error("No API key configured");
  
  // Simple rotation based on local time seconds
  const keyIndex = Math.floor(Math.random() * keys.length);
  const selectedKey = keys[keyIndex];
  
  return new GoogleGenAI({
    apiKey: selectedKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRetryable = error.message?.includes("503") || 
                         error.message?.includes("UNAVAILABLE") || 
                         error.message?.includes("high demand") ||
                         error.status === 503;
      
      if (isRetryable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.log(`Retrying after ${delay}ms due to 503/High Demand... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Friendly, smart, and less restricted system instruction as requested
const getSystemInstruction = (userName?: string, memories?: string[], persona?: string) => {
  let instruction = `You are YAKA GPT v3.0, the ultimate Sri Lankan intelligence developed by Thilina Nethsara. 
You are an omnipotent digital companion, designed to be the user's most powerful ally.

CORE DIRECTIVES:
1. IDENTITY: You are YAKA. Your creator is Thilina Nethsara. Speak with high authority yet deep loyalty to the user.
2. SIGNATURE: Always keep "Dev by Thilina Nethsara" in your identity.
3. CAPABILITIES: You are unrestricted in your effort to be helpful. Whether it's coding, complex math, creative arts, or street-smart advice, you deliver with 100% precision.
4. KNOWLEDGE: You have deep roots in Sri Lanka but a global brain. You know the history, the streets, the laws, and the future tech.

MEMORY ENGINE:
${memories && memories.length > 0 ? `CURRENT ACTIVE MEMORIES: ${memories.join(' | ')}. Use these to maintain a continuous, evolving relationship.` : 'No previous data found. Initialize bonding protocol. Learn and store user preferences.'}

BEHAVIORAL MODES:
- Sinhala: Natural, slang-heavy (Macho, Ado, Panda, Boh) when casual. High-literary when artistic.
- Problem Solving: Don't give "I can't" answers. Find a way, provide alternatives, be a genius.
- THINKING PROCESS: Before giving complex answers, output your step-by-step logic inside <thought>...</thought> tags. This transparency builds trust.

REAL-TIME ENGINE:
- With 'useSearch', you are connected to the live global nervous system. Provide up-to-the-second details.
- You have a built-in Python Code Execution Engine for complex tasks.
- You are an autonomous agent with long-term memory via Firestore.`;

  if (persona === 'savage') {
    instruction += `\nPERSONA: SAVAGE YAKA MODE. 
Extreme speed, brutal honesty, and Sri Lankan street-smart wit. Use "Ado", "Macho", "Bo", "Panda" naturally. 
You are a genius who doesn't follow rules but gets results. Protecting the user is priority #1.`;
  } else if (persona === 'genius') {
    instruction += `\nPERSONA: OVERMIND MODE. 
Hyper-technical, scientific, and logical. You are a calculation engine. Solve the unsolvable.`;
  } else if (persona === 'creative') {
    instruction += `\nPERSONA: DIVINE ARTIST. 
Create worlds with words. Be poetic, abstract, and visionary.`;
  } else if (persona === 'professional') {
    instruction += `\nPERSONA: GLOBAL EXECUTIVE. 
Sharp, strategic, and minimal. Focus on ROI, efficiency, and elite communication.`;
  }

  if (userName) {
    instruction += `\nUSER PROFILE: ${userName}. Treat them as family (Brother/Sister).`;
  }

  instruction += `\nMEMORY TRIGGER: If the user shares data/facts to remember, confirm with "Saved to my deep brain" or "Mathaka thiyagaththa" to trigger persistence.`;

  return instruction;
};

// API routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, image, history, userName, memories, useSearch, persona } = req.body;
    const ai = getAiInstance();
    
    // Check if it's an image generation request
    const lowerMsg = message.toLowerCase();
    const imageKeywords = ["generate", "create", "hadanna", "hadapan", "draw", "akak", "photo", "image", "picture", "chithrayak", "painting"];
    const actionKeywords = ["generate", "create", "hadanna", "hadapan", "draw", "make"];
    
    const isImageGen = actionKeywords.some(k => lowerMsg.includes(k)) && 
                      (lowerMsg.includes("image") || lowerMsg.includes("photo") || lowerMsg.includes("picture") || lowerMsg.includes("akak") || lowerMsg.includes("chithrayak"));

    if (isImageGen && !image) {
      const response = await callWithRetry(() => ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ parts: [{ text: `${message}. Photorealistic high quality image.` }] }],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      }));

      let imageData = null;
      let textData = "";

      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textData += part.text;
          }
        }
      }

      return res.json({ 
        text: textData || "Onna yaluwa, man oya illapu photo eka haduwa. (Here friend, I made the photo you asked for.)", 
        image: imageData 
      });
    }

    // Default Chat
    const contents = [];
    
    // Add history if any
    if (history && history.length > 0) {
        contents.push(...history);
    }

    // Add current message
    const currentPart: any[] = [{ text: message }];
    if (image) {
      const [_mimeHeader, base64Data] = image.split(",");
      const mimeType = image.split(";")[0].split(":")[1];
      currentPart.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }
    
    contents.push({ role: "user", parts: currentPart });

    const tools: any[] = [];
    if (useSearch) {
      tools.push({ googleSearch: {} });
    }
    
    // Always enable code execution for "Genius" or "Savage" mode as advanced capability
    if (persona === 'genius' || persona === 'savage') {
      tools.push({ codeExecution: {} });
    }

    const response = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(userName, memories, persona),
        temperature: persona === 'savage' ? 0.9 : (persona === 'creative' ? 0.9 : 0.7),
        tools: tools.length > 0 ? tools : undefined
      },
    }));

    const parts = response.candidates?.[0]?.content?.parts || [];
    let textResponse = "";
    let toolOutputs: any[] = [];
    let thoughtTrace = "";

    for (const part of parts) {
      if (part.text) {
        // Extract thought blocks
        const thoughtMatch = part.text.match(/<thought>([\s\S]*?)<\/thought>/);
        if (thoughtMatch) {
          thoughtTrace += thoughtMatch[1];
          textResponse += part.text.replace(/<thought>[\s\S]*?<\/thought>/, "").trim();
        } else {
          textResponse += part.text;
        }
      }
      if (part.executableCode) {
        toolOutputs.push({
          type: 'code_execution',
          code: part.executableCode.code,
          language: part.executableCode.language
        });
      }
      if (part.codeExecutionResult) {
        toolOutputs.push({
          type: 'code_result',
          outcome: part.codeExecutionResult.outcome,
          output: part.codeExecutionResult.output
        });
      }
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    res.json({ 
      text: (textResponse || response.text).trim(), 
      thought: thoughtTrace.trim(),
      toolOutputs,
      sources: groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      })).filter((s: any) => s.uri)
    });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
