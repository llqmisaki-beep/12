import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";
import { ContentSummary, InputSourceType, SearchPlatform, SearchResultItem } from "../types";

// Helper to get the client with the best available key
const getClient = (customKey?: string) => {
  // Priority: Custom Key (from validation) -> LocalStorage -> Env Var
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const apiKey = customKey || storedKey || process.env.API_KEY;

  if (!apiKey) {
    console.warn("API Key not found. Using mock data where applicable.");
    // Return a client with a dummy key to prevent immediate instantiation errors, 
    // but calls will fail or need mock handling.
    return new GoogleGenAI({ apiKey: 'dummy-key' });
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Validates the API key by making a lightweight call.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const client = new GoogleGenAI({ apiKey });
    // Simple test generation to verify key validity
    await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'test',
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
    return false;
  }
};

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A viral, catchy title in Chinese." },
    coreIdea: { type: Type.STRING, description: "1-2 sentence core summary in Chinese." },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concise key takeaways in Chinese." },
    goldenQuotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Quote text in Chinese" },
          timestamp: { type: Type.STRING, description: "Timestamp or 'N/A'" },
        },
      },
      description: "1-2 impactful quotes.",
    },
    searchImageUrls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extracted image URLs." }
  },
  required: ["title", "coreIdea", "keyPoints", "goldenQuotes"],
};

export const searchTopic = async (query: string, platform: SearchPlatform): Promise<SearchResultItem[]> => {
  const client = getClient();
  const hasKey = !!(typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : process.env.API_KEY);

  if (!hasKey) {
     // Mock data fallback
     return [
         { id: '1', title: '演示数据：未配置 API Key', snippet: '请在首页输入有效的 Google Gemini API Key。', url: '#', source: 'System' },
         { id: '2', title: `[模拟] 关于 "${query}" 的 ${platform} 热门讨论`, snippet: '这是模拟搜索结果。配置 Key 后将连接真实 API。', url: '#', source: platform },
         { id: '3', title: `[模拟] ${platform} 趋势分析`, snippet: '模拟数据：用户勾选后将作为上下文。', url: '#', source: platform },
     ];
  }

  let searchPrompt = "";
  if (platform === 'X') {
      searchPrompt = `Search for latest tweets and discussions on X regarding: "${query}". Return 6-8 distinct results.`;
  } else if (platform === 'YOUTUBE') {
      searchPrompt = `Search for latest YouTube videos and descriptions regarding: "${query}". Return 6-8 distinct results.`;
  } else {
      searchPrompt = `Search for latest news and reports from the web regarding: "${query}". Return 6-8 distinct results.`;
  }

  const finalPrompt = `
  ${searchPrompt}
  IMPORTANT: Extract results and format as a JSON Array. No Markdown.
  Structure: [{ "id": "1", "title": "...", "snippet": "...", "url": "...", "source": "..." }]
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: finalPrompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    if (response.text) {
        let jsonStr = response.text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "").replace(/^```\s*/, "");
        try {
            const results = JSON.parse(jsonStr);
            if (Array.isArray(results)) return results as SearchResultItem[];
        } catch (e) { console.error("JSON Parse Error", e); }
    }
    return [];
  } catch (error) {
      console.error("Search Error:", error);
      return []; 
  }
};

export const generateContentSummary = async (input: string, sourceType: InputSourceType): Promise<ContentSummary> => {
  const client = getClient();
  const hasKey = !!(typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : process.env.API_KEY);

  if (!hasKey) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "演示模式：未配置 API Key",
          coreIdea: "当前处于演示模式。请在首页输入 API Key 以体验完整功能。",
          keyPoints: ["功能演示数据 1", "功能演示数据 2", "功能演示数据 3"],
          goldenQuotes: [{ text: "输入 Key 后，AI 将为您生成真实摘要。", timestamp: "00:00" }],
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
      prompt = `
      Task: Analyze the search results and create a viral summary for XiaoHongShu.
      Input: ${input}
      Requirements: Catchy title, core idea, 3-5 key points, 1-2 quotes. Extract image URLs if any.
      Output: JSON string matching structure: { title, coreIdea, keyPoints, goldenQuotes, searchImageUrls }
      NO Markdown.
      `;
      tools = [{ googleSearch: {} }];
      config = { tools: tools };
    } else {
      prompt = `
      Analyze the text/transcript for XiaoHongShu.
      Input: ${input}
      Task: Viral title, core idea, 3-5 key points, 1-2 quotes.
      Output: JSON matching schema.
      `;
      config = { responseMimeType: "application/json", responseSchema: summarySchema };
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    if (response.text) {
      let jsonStr = response.text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "").replace(/^```\s*/, "");
      return JSON.parse(jsonStr) as ContentSummary;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};