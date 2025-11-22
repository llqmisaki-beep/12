export enum AppStep {
  API_KEY_INPUT = 'API_KEY_INPUT',
  INPUT = 'INPUT',
  PROCESSING_TEXT = 'PROCESSING_TEXT',
  REVIEW_TEXT = 'REVIEW_TEXT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  RESULT_EDITOR = 'RESULT_EDITOR'
}

export type InputSourceType = 'VIDEO' | 'IMAGES' | 'SEARCH';

export type SearchPlatform = 'X' | 'YOUTUBE' | 'WEB';

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface VideoMetadata {
  sourceType: InputSourceType;
  searchPlatform?: SearchPlatform;
  url?: string; 
  fileUrl?: string; 
  uploadedImages?: string[]; 
  title: string;
  thumbnail?: string;
  durationStr?: string;
  durationSec?: number;
}

export interface TrimRange {
  start: number;
  end: number;
}

export interface ContentSummary {
  title: string; 
  coreIdea: string; 
  keyPoints: string[]; 
  goldenQuotes: Quote[]; 
  searchImageUrls?: string[]; 
}

export interface Quote {
  text: string;
  timestamp: string; 
}

export enum ImageMode {
  SUBTITLE_STITCH = 'SUBTITLE_STITCH',
  INFOGRAPHIC = 'INFOGRAPHIC'
}

export interface GeneratedImage {
  id: string;
  type: ImageMode;
  url: string; 
  description: string;
}