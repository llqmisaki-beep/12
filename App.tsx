import React, { useState, useEffect } from 'react';
import { AppStep, VideoMetadata, TrimRange, ContentSummary } from './types';
import InputStep from './components/InputStep';
import TextReviewStep from './components/TextReviewStep';
import ImageGenerationStep from './components/ImageGenerationStep';
import ApiKeyInputStep from './components/ApiKeyInputStep';
import { generateContentSummary } from './services/geminiService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.API_KEY_INPUT); // Start with API Key check
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [summary, setSummary] = useState<ContentSummary | null>(null);
  
  // Check for API Key on load
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey || process.env.API_KEY) {
        // If key exists in env or local storage, skip input step
        setStep(AppStep.INPUT);
    }
  }, []);

  const handleApiKeyComplete = () => {
      setStep(AppStep.INPUT);
  };

  const handleInputComplete = async (meta: VideoMetadata, trim: TrimRange, transcript: string) => {
    setMetadata(meta);
    setTrimRange(trim);
    setStep(AppStep.PROCESSING_TEXT);

    try {
      if (!transcript.trim()) {
         throw new Error("No content provided");
      }

      const aiResult = await generateContentSummary(transcript, meta.sourceType);
      setSummary(aiResult);
      setStep(AppStep.REVIEW_TEXT);
    } catch (error) {
      console.error(error);
      alert("AI 处理失败，请检查网络或 API Key 是否有效。");
      setStep(AppStep.INPUT);
    }
  };

  const handleTextReviewComplete = (updatedSummary: ContentSummary) => {
    setSummary(updatedSummary);
    setStep(AppStep.GENERATING_IMAGES);
    setTimeout(() => {
        setStep(AppStep.RESULT_EDITOR);
    }, 1500);
  };

  const handleRestart = () => {
    setStep(AppStep.INPUT);
    setMetadata(null);
    setSummary(null);
  };

  // Navbar Step Indicator Helper
  const getStepColor = (targetStep: AppStep) => {
      const order = [AppStep.API_KEY_INPUT, AppStep.INPUT, AppStep.PROCESSING_TEXT, AppStep.REVIEW_TEXT, AppStep.GENERATING_IMAGES, AppStep.RESULT_EDITOR];
      const currentIndex = order.indexOf(step);
      const targetIndex = order.indexOf(targetStep);
      return currentIndex >= targetIndex ? 'bg-indigo-500' : 'bg-zinc-800';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                C
            </div>
            <span className="font-bold text-xl tracking-tight">ClipEssence AI</span>
          </div>
          
          {step !== AppStep.API_KEY_INPUT && (
            <div className="flex gap-2">
                <div className={`h-2 w-2 rounded-full ${getStepColor(AppStep.INPUT)}`}></div>
                <div className={`h-2 w-2 rounded-full ${getStepColor(AppStep.REVIEW_TEXT)}`}></div>
                <div className={`h-2 w-2 rounded-full ${getStepColor(AppStep.RESULT_EDITOR)}`}></div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {step === AppStep.API_KEY_INPUT && (
            <ApiKeyInputStep onComplete={handleApiKeyComplete} />
        )}

        {step === AppStep.INPUT && (
          <InputStep onNext={handleInputComplete} />
        )}

        {step === AppStep.PROCESSING_TEXT && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
             <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
             <h3 className="text-xl font-medium text-white">正在分析内容...</h3>
             <p className="text-zinc-500 mt-2 text-center max-w-md">Gemini 正在{metadata?.sourceType === 'SEARCH' ? '搜索全网资讯' : '提取内容精华'}，<br/>并生成病毒式传播文案。</p>
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
             <p className="text-zinc-500 mt-2">正在应用排版引擎和上传的素材。</p>
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