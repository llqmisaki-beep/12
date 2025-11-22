import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";
import { ContentSummary, InputSourceType, SearchPlatform, SearchResultItem } from "../types";

const getClient = (customKey?: string) => {
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const apiKey = customKey || storedKey || process.env.API_KEY;

  if (!apiKey) {
    console.warn("API Key not found. Using mock data where applicable.");
    return new GoogleGenAI({ apiKey: 'dummy-key' });
  }
  return new GoogleGenAI({ apiKey });
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const client = new GoogleGenAI({ apiKey });
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

// ... (keep existing schema constants if needed, or redefine inside) ...
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
    searchImageUrls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Valid image URLs extracted from the search results." }
  },
  required: ["title", "coreIdea", "keyPoints", "goldenQuotes"],
};

export const searchTopic = async (query: string, platform: SearchPlatform): Promise<SearchResultItem[]> => {
  const client = getClient();
  const hasKey = !!(typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : process.env.API_KEY);

  if (!hasKey) {
     // Mock data
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

export const regenerateSingleQuote = async (context: string): Promise<string> => {
    const client = getClient();
    const hasKey = !!(typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : process.env.API_KEY);
    if(!hasKey) return "API Key 未配置，无法生成新金句。";

    const prompt = `
    Context: ${context.substring(0, 500)}...
    Task: Generate ONE impactful, viral "Golden Quote" (金句) in Chinese based on this context.
    Style: Emotional, catchy, suitable for social media.
    Output: Just the plain text string of the quote. No JSON.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text?.trim() || "生成失败";
    } catch(e) {
        console.error(e);
        return "重试失败";
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

    // --- PROMPT STRATEGY ---
    
    if (sourceType === 'SEARCH') {
      // Persona: Senior News Editor
      // Goal: Factual, conflict-driven, dense information
      prompt = `
      Role: Senior News Editor & Social Media Strategist.
      Task: Analyze the provided search results and synthesize a viral summary for Chinese social media (XiaoHongShu/TikTok).
      
      Input Data:
      ${input}
      
      Directives:
      1. **Title**: Click-bait style but factual. Highlight conflict or trends.
      2. **Core Idea**: Summarize facts objectively but compactly.
      3. **Key Points**: 3-5 distinct facts/takeaways. High information density.
      4. **Quotes**: Extract or synthesize 1-2 punchy statements representing the sentiment.
      5. **Images**: CRITICAL - Extract valid image URLs from the input if available and put in 'searchImageUrls'.
      
      Output Format: JSON string matching structure: { title, coreIdea, keyPoints, goldenQuotes, searchImageUrls }
      NO Markdown code blocks.
      `;
      
      tools = [{ googleSearch: {} }];
      config = { tools: tools };

    } else {
      // Persona: Million-follower Influencer
      // Goal: Emotional value, relatable, "spoon-fed" advice, anxiety-inducing or healing
      prompt = `
      Role: Top-tier XiaoHongShu (Little Red Book) Influencer.
      Task: Analyze the text/transcript and create a viral note.
      
      Input Content:
      ${input}
      
      Directives:
      1. **Title**: Emotional, uses keywords like "保姆级" (Nanny-level guide), "避坑" (Avoid pitfalls), "真相" (Truth). Use Emojis.
      2. **Core Idea**: Conversational tone. Focus on emotional value or solving specific pain points.
      3. **Key Points**: 3-5 actionable steps or "mind-blowing" realizations. Use Emojis as bullets.
      4. **Quotes**: Emotional, memorable, "Golden Quotes" that make people want to save/share.
      
      Output Format: JSON matching schema.
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