
import React, { useState } from 'react';
import { VideoMetadata, TrimRange } from '../types';
import { Link2, Scissors, Play, FileText, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { MOCK_VIDEO_METADATA } from '../constants';

interface InputStepProps {
  onNext: (metadata: VideoMetadata, trim: TrimRange, transcript: string) => void;
}

const InputStep: React.FC<InputStepProps> = ({ onNext }) => {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');

  // Robust YouTube ID extraction
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleFetch = () => {
    setIsLoading(true);
    const ytId = extractYoutubeId(url);

    // Simulate API fetch (Purely for metadata display, not transcript due to CORS)
    setTimeout(() => {
      if (ytId) {
        setMetadata({
            url: url,
            platform: 'youtube',
            title: "YouTube 视频 (请下方粘贴文案)", 
            thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
            durationStr: "10:00",
            durationSec: 600
        });
      } else {
        // Fallback
        setMetadata({
            ...MOCK_VIDEO_METADATA,
            url: url || 'https://example.com',
            title: "自定义视频源",
            thumbnail: "https://picsum.photos/800/450",
            platform: 'other'
        });
      }
      setIsLoading(false);
    }, 500);
  };

  const formatTime = (percentage: number) => {
    if (!metadata) return '00:00';
    const totalSeconds = metadata.durationSec;
    const currentSeconds = (percentage / 100) * totalSeconds;
    const m = Math.floor(currentSeconds / 60);
    const s = Math.floor(currentSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">第一步：导入素材</h2>
        <p className="text-zinc-400">由于浏览器安全限制，Gemini API 无法直接“观看”在线视频，<br/>请粘贴链接并配合手动复制文案。</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        {/* URL Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴 YouTube 视频链接 (用于生成封面)..."
              className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-lg leading-5 bg-zinc-950 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={!url || isLoading}
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap border border-zinc-700"
          >
            {isLoading ? '解析封面...' : '获取封面'}
          </button>
        </div>

        {metadata && (
          <div className="mt-6 space-y-8 animate-slide-up">
            {/* Video Preview Card */}
            <div className="flex items-start gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <img src={metadata.thumbnail} alt="Thumbnail" className="w-32 h-20 object-cover rounded-lg bg-zinc-800" />
              <div>
                <h3 className="text-lg font-semibold text-white line-clamp-1">{metadata.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    YouTube
                    </span>
                    {extractYoutubeId(url) && <span className="text-xs text-zinc-500 font-mono">ID: {extractYoutubeId(url)}</span>}
                </div>
              </div>
            </div>

            {/* IMPORTANT: Transcript / Content Input */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        视频文案 / 内容描述 (核心步骤)
                    </label>
                </div>
                
                {/* Help Box */}
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 flex gap-3 text-sm text-indigo-200">
                    <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <div>
                        <p className="font-bold mb-1">如何获取文案？</p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-indigo-300">
                            <li>在 YouTube 视频下方，点击 <strong>...更多</strong> -> <strong>显示字幕</strong>。</li>
                            <li>复制右侧显示的字幕文字，粘贴到下方。</li>
                            <li>或者，直接用您的话概括视频讲了什么（只需 200 字左右）。</li>
                        </ul>
                    </div>
                </div>

                <div className="relative group">
                    <textarea
                        value={userTranscript}
                        onChange={(e) => setUserTranscript(e.target.value)}
                        placeholder="在此粘贴视频字幕或内容概要... &#10;（Gemini 将完全基于您在这里输入的内容进行分析和创作，请务必输入您的视频内容）"
                        className="w-full h-48 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                    />
                    {!userTranscript && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            必须输入内容才能继续
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => onNext(metadata, trimRange, userTranscript)}
                disabled={!userTranscript.trim() || userTranscript.length < 10}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:grayscale text-white font-bold rounded-xl shadow-lg transform hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
                开始 AI 提取与创作
                <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputStep;
