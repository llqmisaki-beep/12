
import React, { useState } from 'react';
import { ContentSummary } from '../types';
import { Edit3, Check, Quote, List, Sparkles } from 'lucide-react';

interface TextReviewStepProps {
  summary: ContentSummary;
  onNext: (updatedSummary: ContentSummary) => void;
  onBack: () => void;
}

const TextReviewStep: React.FC<TextReviewStepProps> = ({ summary, onNext, onBack }) => {
  const [data, setData] = useState<ContentSummary>(summary);
  const [editingField, setEditingField] = useState<keyof ContentSummary | null>(null);

  // Helper to update specific fields
  const updateField = (field: keyof ContentSummary, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePointChange = (index: number, val: string) => {
    const newPoints = [...data.keyPoints];
    newPoints[index] = val;
    setData(prev => ({ ...prev, keyPoints: newPoints }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                AI 内容精华
            </h2>
            <p className="text-zinc-400 text-sm">生成图片前，请先检查并编辑 AI 提取的重点内容。</p>
        </div>
        <div className="flex gap-3">
             <button onClick={onBack} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                返回
             </button>
             <button 
                onClick={() => onNext(data)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-md transition-colors"
             >
                生成视觉图
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {/* Left Column: Core Info */}
        <div className="space-y-6">
            {/* Title Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">爆款标题</label>
                    <Edit3 className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400" />
                </div>
                <input 
                    className="w-full bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-indigo-500 pb-1"
                    value={data.title}
                    onChange={(e) => updateField('title', e.target.value)}
                />
            </div>

            {/* Core Idea */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">核心观点</label>
                    <Edit3 className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400" />
                </div>
                <textarea 
                    className="w-full bg-transparent text-zinc-200 resize-none focus:outline-none h-24"
                    value={data.coreIdea}
                    onChange={(e) => updateField('coreIdea', e.target.value)}
                />
            </div>

             {/* Golden Quotes */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Quote className="w-4 h-4 text-yellow-500" />
                    <label className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">金句摘录</label>
                </div>
                <div className="space-y-3">
                    {data.goldenQuotes.map((q, idx) => (
                        <div key={idx} className="flex gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                             <div className="text-xs text-zinc-500 font-mono pt-1">{q.timestamp}</div>
                             <textarea
                                className="w-full bg-transparent text-zinc-300 italic text-sm resize-none focus:outline-none"
                                rows={2}
                                value={q.text}
                                onChange={(e) => {
                                    const newQuotes = [...data.goldenQuotes];
                                    newQuotes[idx].text = e.target.value;
                                    setData(prev => ({...prev, goldenQuotes: newQuotes}));
                                }}
                             />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Key Points */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
             <div className="flex items-center gap-2 mb-6">
                <List className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">知识点总结</h3>
             </div>
             <div className="space-y-4">
                {data.keyPoints.map((point, idx) => (
                    <div key={idx} className="flex gap-3 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                            {idx + 1}
                        </div>
                        <textarea
                            className="w-full bg-transparent text-zinc-300 text-sm resize-none focus:outline-none border-b border-transparent focus:border-purple-500/50 pb-1 leading-relaxed"
                            rows={3}
                            value={point}
                            onChange={(e) => handlePointChange(idx, e.target.value)}
                        />
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default TextReviewStep;
