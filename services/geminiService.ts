
import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";
import { ContentSummary, InputSourceType } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
};

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A viral, catchy title for the content summary in Chinese.",
    },
    coreIdea: {
      type: Type.STRING,
      description: "A 1-2 sentence summary of the core pain point or topic in Chinese.",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 key takeaways in Chinese, concise and actionable.",
    },
    goldenQuotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The quote text in Chinese" },
          timestamp: { type: Type.STRING, description: "Estimated timestamp or 'N/A'" },
        },
      },
      description: "1-2 of the most impactful quotes from the text.",
    },
    searchImageUrls: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extract valid image URLs found in the search results if available.",
    }
  },
  required: ["title", "coreIdea", "keyPoints", "goldenQuotes"],
};

export const generateContentSummary = async (
  input: string, 
  sourceType: InputSourceType
): Promise<ContentSummary> => {
  const client = getClient();

  if (!process.env.API_KEY) {
    // Mock fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "演示模式：API Key 未配置",
          coreIdea: "请在 .env 文件中配置 API_KEY 以使用真实 AI 功能。",
          keyPoints: ["这是一个演示数据", "请检查环境配置", "支持视频、图片、搜索三模式"],
          goldenQuotes: [{ text: "AI 是未来的电力。", timestamp: "00:00" }],
          searchImageUrls: []
        });
      }, 1500);
    });
  }

  try {
    let prompt = "";
    let tools: Tool[] | undefined = undefined;
    let config: any = {};

    if (sourceType === 'SEARCH') {
      // Search Mode: Cannot use responseSchema/MimeType with Tools
      prompt = `
      Task: Search for the latest trending information, news, or videos about the topic: "${input}".
      Target Audience: Chinese social media users (XiaoHongShu).
      
      Requirements:
      1. Synthesize the search results into a viral summary.
      2. Create a catchy title.
      3. Summarize the core trend/idea.
      4. List 3-5 key facts or takeaways.
      5. Create 1-2 "Golden Quotes" based on the sentiment.
      6. Extract any relevant image URLs from the search results into 'searchImageUrls'.
      
      IMPORTANT: Return the result as a valid raw JSON string matching the following structure. Do not include Markdown formatting (like \`\`\`json).
      {
        "title": "string",
        "coreIdea": "string",
        "keyPoints": ["string"],
        "goldenQuotes": [{"text": "string", "timestamp": "N/A"}],
        "searchImageUrls": ["string"]
      }
      `;
      
      tools = [{ googleSearch: {} }];
      config = {
        tools: tools,
        // NOTE: responseMimeType and responseSchema MUST be undefined when using tools like googleSearch
      };
    } else {
      // Text/Video Analysis Mode: Use Strict JSON Schema
      prompt = `
      Analyze the following text/transcript.
      Target audience: Social media users (Little Red Book / TikTok) in China.
      Language: Chinese (Simplified).
      
      Task:
      1. Create a click-worthy, viral title.
      2. Summarize the core idea in 1-2 sentences.
      3. Extract 3-5 key knowledge points.
      4. Find 1-2 "Golden Quotes".
      
      Content:
      ${input}
      `;

      config = {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
      };
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    if (response.text) {
      let jsonStr = response.text.trim();
      
      // Cleanup Markdown code blocks if the model ignores the "no markdown" instruction (common in text-only mode)
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      return JSON.parse(jsonStr) as ContentSummary;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
