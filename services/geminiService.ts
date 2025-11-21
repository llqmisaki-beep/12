
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContentSummary } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    // In a real app, handle this gracefully. For this demo, we might fail or mock.
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-ui-mock' });
};

// Define the response schema for structured output
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
          timestamp: { type: Type.STRING, description: "Estimated timestamp format MM:SS" },
        },
      },
      description: "1-2 of the most impactful quotes from the text.",
    },
  },
  required: ["title", "coreIdea", "keyPoints", "goldenQuotes"],
};

export const generateContentSummary = async (rawText: string): Promise<ContentSummary> => {
  const client = getClient();

  // If no API key is present (demo mode without env), return mock data to prevent crash
  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "拒绝隐形贫穷！你的钱都被“拿铁因子”偷走了☕️",
          coreIdea: "普通人存不下钱的根本原因不是收入低，而是忽视了生活中的非必要微小支出（拿铁因子）。记账是为了看见花销，强制储蓄才是王道。",
          keyPoints: [
            "警惕“拿铁因子”：那些非必要但习惯性的微小支出，一年下来是一笔巨款。",
            "记账的意义：不是为了省钱，而是为了“看见”钱的去向。",
            "强制储蓄法则：工资到账第一件事，雷打不动存下 20%。",
            "复利思维：不要嫌本金少，种一棵树最好的时间是现在。"
          ],
          goldenQuotes: [
            { text: "种一棵树最好的时间是十年前，其次是现在。", timestamp: "06:30" },
            { text: "存钱是为了在生活给你一巴掌的时候，你有底气反手给它一巴掌。", timestamp: "08:10" }
          ]
        });
      }, 2000);
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following video transcript. 
      Target audience: Social media users (Little Red Book / TikTok / Douyin) in China.
      Language: Chinese (Simplified).
      
      Task:
      1. Create a click-worthy, viral title (Little Red Book style).
      2. Summarize the core idea in 1-2 sentences.
      3. Extract 3-5 key knowledge points. Use plain, engaging Chinese.
      4. Find 1-2 "Golden Quotes" that are inspiring.
      
      Transcript:
      ${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        systemInstruction: "You are an expert content editor for Chinese social media. You are concise, engaging, and accurate.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ContentSummary;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
