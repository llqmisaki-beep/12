import React, { useState, useEffect } from 'react';
import { Key, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyInputStepProps {
  onComplete: () => void;
}

const ApiKeyInputStep: React.FC<ApiKeyInputStepProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError("请输入 API Key");
      return;
    }
    
    setIsValidating(true);
    setError(null);

    const isValid = await validateApiKey(apiKey);
    
    if (isValid) {
      setSuccess(true);
      localStorage.setItem('gemini_api_key', apiKey);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      setError("API Key 无效，请检查后重试。");
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        
        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-inner">
            {success ? (
                <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />
            ) : (
                <Key className="w-8 h-8 text-indigo-500" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">配置 Gemini API</h2>
        <p className="text-zinc-400 text-sm mb-8">
          ClipEssence 需要使用 Google Gemini API 来分析视频、生成文案和搜索热点。
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">API Key</label>
            <div className="relative mt-1">
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setError(null); }}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                />
                {isValidating && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                )}
            </div>
            {error && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-2 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> {error}
                </div>
            )}
          </div>

          <button 
            onClick={handleValidate}
            disabled={isValidating || success}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${success ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
          >
            {success ? '验证成功，正在进入...' : (isValidating ? '验证中...' : '验证并开始')}
            {!isValidating && !success && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
            >
                没有 Key？点击这里免费获取 →
            </a>
            <p className="text-[10px] text-zinc-600 mt-2">
                您的 Key 仅存储在本地浏览器中，不会上传至任何服务器。
            </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInputStep;