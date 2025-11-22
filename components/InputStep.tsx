import React, { useState, useRef } from 'react';
import { VideoMetadata, TrimRange, InputSourceType, SearchPlatform, SearchResultItem } from '../types';
import { Upload, Image as ImageIcon, Search, FileText, Film, Plus, X, PlayCircle, Twitter, Youtube, Globe, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { searchTopic } from '../services/geminiService';

interface InputStepProps {
  onNext: (metadata: VideoMetadata, trim: TrimRange, transcript: string) => void;
}

const InputStep: React.FC<InputStepProps> = ({ onNext }) => {
  const [activeTab, setActiveTab] = useState<InputSourceType>('VIDEO');
  
  // State for VIDEO mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoContext, setVideoContext] = useState('');

  // State for IMAGES mode
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageContext, setImageContext] = useState('');

  // State for SEARCH mode
  const [searchPlatform, setSearchPlatform] = useState<SearchPlatform>('X');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newUrls = files.map((f: File) => URL.createObjectURL(f));
      setImageFiles(prev => [...prev, ...files]);
      setImageUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedResultIds([]);
    try {
        const results = await searchTopic(searchQuery, searchPlatform);
        setSearchResults(results);
    } catch (e) {
        alert("搜索失败，请重试");
    } finally {
        setIsSearching(false);
    }
  };

  const toggleResultSelection = (id: string) => {
      setSelectedResultIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleSubmit = () => {
    let metadata: VideoMetadata = {
      sourceType: activeTab,
      title: '未命名项目',
      uploadedImages: []
    };
    let transcript = '';

    if (activeTab === 'VIDEO') {
      if (!videoFile && !videoContext) return alert("请上传视频或输入描述");
      metadata = {
        sourceType: 'VIDEO',
        title: videoFile?.name || '本地视频分析',
        fileUrl: videoUrl || undefined,
        thumbnail: videoUrl || undefined,
      };
      transcript = videoContext || "（用户未提供文本，请根据视频画面生成通用的视觉描述和摘要）"; 
    } 
    else if (activeTab === 'IMAGES') {
      if (imageUrls.length === 0 && !imageContext) return alert("请至少上传一张图片或输入文案");
      metadata = {
        sourceType: 'IMAGES',
        title: '图文创作项目',
        uploadedImages: imageUrls
      };
      transcript = imageContext;
    } 
    else if (activeTab === 'SEARCH') {
      if (selectedResultIds.length === 0) return alert("请先搜索并至少选择一条结果");
      
      // Aggregate selected results
      const selectedItems = searchResults.filter(r => selectedResultIds.includes(r.id));
      const aggregatedText = selectedItems.map(item => 
          `[Title: ${item.title}]\n[Source: ${item.source}]\n[Content: ${item.snippet}]`
      ).join('\n\n');

      metadata = {
        sourceType: 'SEARCH',
        searchPlatform: searchPlatform,
        title: `搜索: ${searchQuery}`,
      };
      transcript = aggregatedText;
    }

    onNext(metadata, { start: 0, end: 100 }, transcript);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">开始创作</h2>
        <p className="text-zinc-400">选择一种方式，AI 将自动为您提取精华并生成视觉图。</p>
      </div>

      {/* Main Tabs (Scrollable on Mobile) */}
      <div className="flex overflow-x-auto md:justify-center gap-4 mb-8 pb-2 px-4 no-scrollbar">
        <button 
          onClick={() => setActiveTab('VIDEO')}
          className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'VIDEO' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <Film className="w-5 h-5" />
          <span>视频分析</span>
        </button>
        <button 
          onClick={() => setActiveTab('IMAGES')}
          className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'IMAGES' ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <ImageIcon className="w-5 h-5" />
          <span>图文配字</span>
        </button>
        <button 
          onClick={() => setActiveTab('SEARCH')}
          className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'SEARCH' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <Search className="w-5 h-5" />
          <span>热点搜索</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-8 rounded-3xl shadow-xl min-h-[400px] flex flex-col">
        
        {/* MODE 1: VIDEO */}
        {activeTab === 'VIDEO' && (
          <div className="space-y-6 animate-fade-in">
            <div 
              className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:border-indigo-500 hover:bg-zinc-800/50 transition-all cursor-pointer bg-zinc-950"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept="video/*" hidden ref={fileInputRef} onChange={handleVideoUpload} />
              {videoUrl ? (
                <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden relative group">
                  <video src={videoUrl} className="w-full h-full object-contain" controls />
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">预览中</div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mb-4 text-indigo-500" />
                  <h3 className="text-lg font-medium text-white">点击上传视频文件</h3>
                  <p className="text-sm mt-2">支持 MP4, MOV (仅用于提取画面，不占用流量)</p>
                </>
              )}
            </div>

            <div className="space-y-3">
               <label className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  视频内容描述 / 文案
               </label>
               <textarea 
                  className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder={`请粘贴视频的文案，或者简单描述视频讲了什么。\nAI 将根据这段文字提取金句。`}
                  value={videoContext}
                  onChange={(e) => setVideoContext(e.target.value)}
               />
            </div>
          </div>
        )}

        {/* MODE 2: IMAGES */}
        {activeTab === 'IMAGES' && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-[3/4] group rounded-xl overflow-hidden border border-zinc-700">
                    <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-[3/4] border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:border-purple-500 hover:text-purple-400 hover:bg-zinc-800/50 transition-all"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-xs">添加图片</span>
                </button>
                <input type="file" accept="image/*" multiple hidden ref={imageInputRef} onChange={handleImageUpload} />
             </div>

             <div className="space-y-3">
               <label className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  配文 / 笔记内容
               </label>
               <textarea 
                  className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
                  placeholder="输入你想发布的笔记内容，AI 会自动整理成爆款格式..."
                  value={imageContext}
                  onChange={(e) => setImageContext(e.target.value)}
               />
            </div>
          </div>
        )}

        {/* MODE 3: SEARCH (Enhanced) */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-6 animate-fade-in flex flex-col h-full">
             
             {/* Sub-platform Selector */}
             <div className="flex justify-center gap-3 mb-2">
                 <button 
                    onClick={() => setSearchPlatform('X')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${searchPlatform === 'X' ? 'bg-black border-white text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                 >
                    <Twitter className="w-4 h-4" /> X (推特)
                 </button>
                 <button 
                    onClick={() => setSearchPlatform('YOUTUBE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${searchPlatform === 'YOUTUBE' ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                 >
                    <Youtube className="w-4 h-4" /> YouTube
                 </button>
                 <button 
                    onClick={() => setSearchPlatform('WEB')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${searchPlatform === 'WEB' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                 >
                    <Globe className="w-4 h-4" /> 全网搜索
                 </button>
             </div>

             {/* Search Bar */}
             <div className="max-w-2xl mx-auto w-full relative shrink-0">
                <input 
                  type="text" 
                  className="w-full pl-6 pr-24 py-4 bg-zinc-950 border border-zinc-700 rounded-full text-lg text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-lg"
                  placeholder={`搜索 ${searchPlatform === 'X' ? '推文' : searchPlatform === 'YOUTUBE' ? '视频' : '新闻'} 关键词...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                />
                <button 
                    onClick={performSearch}
                    disabled={isSearching || !searchQuery}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors font-medium flex items-center gap-2"
                >
                   {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '搜索'}
                </button>
             </div>

             {/* Search Results Area */}
             <div className="flex-1 min-h-[300px] bg-zinc-950/50 rounded-2xl border border-zinc-800 p-4 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <p>正在从 {searchPlatform} 检索最新内容...</p>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                             <span className="text-xs text-zinc-400">找到 {searchResults.length} 条结果</span>
                             <span className="text-xs text-emerald-400">请勾选需要整合的内容</span>
                        </div>
                        {searchResults.map((item) => {
                            const isSelected = selectedResultIds.includes(item.id);
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => toggleResultSelection(item.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${isSelected ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                            {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{item.title}</h4>
                                            <p className="text-xs text-zinc-500 line-clamp-2">{item.snippet}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">{item.source}</span>
                                                {item.url && item.url !== '#' && (
                                                    <a href={item.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-indigo-400 hover:underline">
                                                        查看原文
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                        <Search className="w-12 h-12 mb-2 opacity-20" />
                        <p>暂无搜索结果，请输入关键词开始</p>
                    </div>
                )}
             </div>
          </div>
        )}

        {/* Footer Action */}
        <div className="mt-auto pt-8 flex justify-end border-t border-zinc-800/50">
            <button 
              onClick={handleSubmit}
              className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${activeTab === 'SEARCH' && selectedResultIds.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'}`}
              disabled={activeTab === 'SEARCH' && selectedResultIds.length === 0}
            >
              {activeTab === 'SEARCH' ? `整合选定内容 (${selectedResultIds.length})` : '下一步: 生成内容'}
              <PlayCircle className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default InputStep;