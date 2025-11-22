import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";
import { ContentSummary, InputSourceType, SearchPlatform, SearchResultItem } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. Using mock data.");
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

/**
 * Performs a search on a specific platform and returns structured result items.
 */
export const searchTopic = async (query: string, platform: SearchPlatform): Promise<SearchResultItem[]> => {
  const client = getClient();
  
  // Graceful fallback for missing API Key
  if (!process.env.API_KEY) {
     return [
         { id: '1', title: '演示数据：API Key 未配置', snippet: '请在 Vercel 项目设置中配置 API_KEY 环境变量以使用真实搜索。', url: '#', source: 'System' },
         { id: '2', title: `[模拟] 关于 "${query}" 的 ${platform} 热门讨论`, snippet: '这是一个模拟的搜索结果摘要，用于演示界面交互。在真实环境中，这里会显示 Gemini 搜索到的实时内容。', url: '#', source: platform },
         { id: '3', title: `[模拟] ${platform} 上的相关趋势分析`, snippet: '这是另一条模拟数据。用户勾选这些条目后，AI 会将其作为上下文进行分析生成。', url: '#', source: platform },
         { id: '4', title: `[模拟] 深度解析：${query}`, snippet: '详细的内容分析，揭示了背后的原因...', url: '#', source: platform },
         { id: '5', title: `[模拟] 为什么 ${query} 最近这么火？`, snippet: '点击勾选此条目，将其加入到生成素材中。', url: '#', source: platform },
     ];
  }

  let searchPrompt = "";
  if (platform === 'X') {
      searchPrompt = `Search for the latest tweets, threads, and hot discussions on X (Twitter) regarding: "${query}". Return 6-8 distinct results.`;
  } else if (platform === 'YOUTUBE') {
      searchPrompt = `Search for the latest YouTube videos, titles, and descriptions regarding: "${query}". Return 6-8 distinct results.`;
  } else {
      searchPrompt = `Search for the latest news, articles, and reports from the web regarding: "${query}". Return 6-8 distinct results.`;
  }

  const finalPrompt = `
  ${searchPrompt}

  IMPORTANT: After searching, extract the results and format them as a JSON Array.
  Do NOT use Markdown code blocks. Just return the raw JSON string.
  Structure:
  [
    {
      "id": "unique_id_1",
      "title": "Title of the post/video/article",
      "snippet": "A brief summary of the content (max 100 chars)",
      "url": "URL if available",
      "source": "Author/Channel/Site Name"
    }
  ]
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: finalPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (response.text) {
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        
        try {
            const results = JSON.parse(jsonStr);
            if (Array.isArray(results)) {
                return results as SearchResultItem[];
            }
        } catch (e) {
            console.error("Failed to parse search results JSON", e);
        }
    }
    return [];

  } catch (error) {
      console.error("Search Error:", error);
      return []; 
  }
};

export const generateContentSummary = async (
  input: string, 
  sourceType: InputSourceType
): Promise<ContentSummary> => {
  const client = getClient();

  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "演示模式：API Key 未配置",
          coreIdea: "当前处于演示模式。请在 .env 文件中配置 API_KEY 以连接真实 Gemini AI。",
          keyPoints: ["这是一个演示数据", "支持视频、图片、搜索三模式", "请检查环境变量配置"],
          goldenQuotes: [{ text: "配置 API Key 后，AI 将为您生成真实摘要。", timestamp: "00:00" }],
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
      // SEARCH Mode: Input is aggregated text from user selection
      prompt = `
      Task: Analyze the following gathered information (Search Results) and create a viral summary.
      Target Audience: Chinese social media users (XiaoHongShu).
      
      Input Data:
      ${input}
      
      Requirements:
      1. Synthesize the provided information into a viral summary.
      2. Create a catchy title.
      3. Summarize the core trend/idea.
      4. List 3-5 key facts or takeaways.
      5. Create 1-2 "Golden Quotes" based on the sentiment.
      6. If the input data contains URLs or references to images, extract them into 'searchImageUrls'.
      
      IMPORTANT: Return the result as a valid raw JSON string matching the structure. Do not include Markdown.
      {
        "title": "string",
        "coreIdea": "string",
        "keyPoints": ["string"],
        "goldenQuotes": [{"text": "string", "timestamp": "N/A"}],
        "searchImageUrls": ["string"]
      }
      `;
      
      tools = [{ googleSearch: {} }];
      config = { tools: tools };
    } else {
      // Video/Image Mode
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