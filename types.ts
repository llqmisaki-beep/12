export enum AppStep {
  INPUT = 'INPUT',
  PROCESSING_TEXT = 'PROCESSING_TEXT',
  REVIEW_TEXT = 'REVIEW_TEXT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  RESULT_EDITOR = 'RESULT_EDITOR'
}

export interface VideoMetadata {
  url: string;
  platform: 'youtube' | 'bilibili' | 'tiktok' | 'other';
  title: string;
  thumbnail: string;
  durationStr: string;
  durationSec: number;
}

export interface TrimRange {
  start: number;
  end: number;
}

export interface ContentSummary {
  title: string; // The "viral" title
  coreIdea: string; // 1-2 sentences core pain point
  keyPoints: string[]; // 3-5 key takeaways with emojis
  goldenQuotes: Quote[]; // 1-2 best sentences
}

export interface Quote {
  text: string;
  timestamp: string; // Mock timestamp string e.g., "02:15"
}

export enum ImageMode {
  SUBTITLE_STITCH = 'SUBTITLE_STITCH',
  INFOGRAPHIC = 'INFOGRAPHIC'
}

export interface GeneratedImage {
  id: string;
  type: ImageMode;
  url: string; // Can be a data URL or placeholder for this demo
  description: string;
}
