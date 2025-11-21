
import React, { useState } from 'react';
import { AppStep, VideoMetadata, TrimRange, ContentSummary } from './types';
import InputStep from './components/InputStep';
import TextReviewStep from './components/TextReviewStep';
import ImageGenerationStep from './components/ImageGenerationStep';
import { generateContentSummary } from './services/geminiService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [summary, setSummary] = useState<ContentSummary | null>(null);
  
  // Handlers
  const handleInputComplete = async (meta: VideoMetadata, trim: TrimRange, transcript: string) => {
    setMetadata(meta);
    setTrimRange(trim);
    setStep(AppStep.PROCESSING_TEXT);

    try {
      // STRICT: Only use user transcript. No fallbacks to mock data.
      // If transcript is empty (should be blocked by UI), throw error.
      if (!transcript.trim()) {
         throw new Error("No transcript provided");
      }

      const aiResult = await generateContentSummary(transcript);
      setSummary(aiResult);
      setStep(AppStep.REVIEW_TEXT);
    } catch (error) {
      console.error(error);
      alert("生成总结失败，请检查网络或输入内容是否过短。");
      setStep(AppStep.INPUT);
    }
  };

  const handleTextReviewComplete = (updatedSummary: ContentSummary) => {
    setSummary(updatedSummary);
    setStep(AppStep.GENERATING_IMAGES);
    // Simulate short loading for image preparation
    setTimeout(() => {
        setStep(AppStep.RESULT_EDITOR);
    }, 1500);
  };

  const handleRestart = () => {
    setStep(AppStep.INPUT);
    setMetadata(null);
    setSummary(null);
  };

  // Render Logic
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                C
            </div>
            <span className="font-bold text-xl tracking-tight">ClipEssence AI</span>
          </div>
          <div className="flex gap-2">
             <div className={`h-2 w-2 rounded-full ${step === AppStep.INPUT ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
             <div className={`h-2 w-2 rounded-full ${step === AppStep.REVIEW_TEXT ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
             <div className={`h-2 w-2 rounded-full ${step === AppStep.RESULT_EDITOR ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {step === AppStep.INPUT && (
          <InputStep onNext={handleInputComplete} />
        )}

        {step === AppStep.PROCESSING_TEXT && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
             <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
             <h3 className="text-xl font-medium text-white">正在分析您的文案...</h3>
             <p className="text-zinc-500 mt-2 text-center max-w-md">Gemini 正在阅读您提供的内容，<br/>去除冗余信息，并提取核心金句。</p>
          </div>
        )}

        {step === AppStep.REVIEW_TEXT && summary && (
          <TextReviewStep 
            summary={summary} 
            onNext={handleTextReviewComplete} 
            onBack={() => setStep(AppStep.INPUT)}
          />
        )}

        {step === AppStep.GENERATING_IMAGES && (
           <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
             <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-6" />
             <h3 className="text-xl font-medium text-white">正在设计视觉图...</h3>
             <p className="text-zinc-500 mt-2">正在调用 YouTube 封面并生成排版。</p>
          </div>
        )}

        {step === AppStep.RESULT_EDITOR && summary && metadata && (
          <ImageGenerationStep 
            summary={summary} 
            metadata={metadata} 
            onRestart={handleRestart}
            onBack={() => setStep(AppStep.REVIEW_TEXT)}
          />
        )}

      </main>
    </div>
  );
};

export default App;
