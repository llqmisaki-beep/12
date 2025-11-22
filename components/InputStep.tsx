import React, { useState, useRef } from 'react';
import { VideoMetadata, TrimRange, InputSourceType } from '../types';
import { Upload, Image as ImageIcon, Search, FileText, Film, Plus, X, PlayCircle } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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
        thumbnail: videoUrl || undefined, // Use video as thumb placeholder
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
      if (!searchQuery) return alert("请输入搜索关键词");
      metadata = {
        sourceType: 'SEARCH',
        title: `搜索: ${searchQuery}`,
      };
      transcript = searchQuery; // Pass query as transcript for Search mode
    }

    onNext(metadata, { start: 0, end: 100 }, transcript);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">开始创作</h2>
        <p className="text-zinc-400">选择一种方式，AI 将自动为您提取精华并生成视觉图。</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('VIDEO')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'VIDEO' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <Film className="w-5 h-5" />
          <span>视频分析</span>
        </button>
        <button 
          onClick={() => setActiveTab('IMAGES')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'IMAGES' ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <ImageIcon className="w-5 h-5" />
          <span>图文配字</span>
        </button>
        <button 
          onClick={() => setActiveTab('SEARCH')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${activeTab === 'SEARCH' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-105' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
        >
          <Search className="w-5 h-5" />
          <span>热点搜索</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-xl min-h-[400px] flex flex-col">
        
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
                  placeholder="请粘贴视频的文案，或者简单描述视频讲了什么。AI 将根据这段文字提取金句。"
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

        {/* MODE 3: SEARCH */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-6 animate-fade-in flex flex-col justify-center flex-1">
             <div className="space-y-4 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4">
                   <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">全网热点实时搜</h3>
                <p className="text-zinc-400 text-sm">输入任何感兴趣的话题（如“iPhone 16 最新爆料”），AI 将搜索最新资讯并生成知识卡片。</p>
             </div>

             <div className="max-w-2xl mx-auto w-full relative">
                <input 
                  type="text" 
                  className="w-full pl-6 pr-14 py-4 bg-zinc-950 border border-zinc-700 rounded-full text-lg text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-lg"
                  placeholder="输入话题关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-3 top-3 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors">
                   <Search className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}

        {/* Footer Action */}
        <div className="mt-auto pt-8 flex justify-end border-t border-zinc-800/50">
            <button 
              onClick={handleSubmit}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 shadow-lg shadow-white/10 transition-all flex items-center gap-2"
            >
              下一步: 生成内容
              <PlayCircle className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default InputStep;