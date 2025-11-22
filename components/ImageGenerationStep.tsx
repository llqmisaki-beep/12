import React, { useState, useRef, useEffect } from 'react';
import { ContentSummary, ImageMode, VideoMetadata } from '../types';
import { Layout, Film, Download, AlignJustify, Image as ImageIcon, Smartphone, CreditCard, RefreshCw, ArrowLeft, Type, Shuffle, X, Upload, ChevronLeft, Zap, Aperture, Grid, FileText, Layers, Sparkles, BookOpen } from 'lucide-react';

interface ImageGenerationStepProps {
  summary: ContentSummary;
  metadata: VideoMetadata;
  onRestart: () => void;
  onBack: () => void;
}

type InfographicStyle = 'COVER' | 'MEMO' | 'CARD' | 'MINIMAL' | 'NEON' | 'GRADIENT' | 'POLAROID' | 'MAGAZINE' | 'PAPER' | 'GLASS' | 'LITERATURE';
type FontStyle = 'SANS' | 'SERIF' | 'CALLIGRAPHY' | 'HAPPY' | 'ELEGANT';

type SeedKey = 'hero' | 'frame1' | 'frame2' | 'frame3' | 'frame4';

const FONT_MAP: Record<FontStyle, string> = {
  SANS: 'font-sans-sc',
  SERIF: 'font-serif-sc',
  CALLIGRAPHY: 'font-calligraphy',
  HAPPY: 'font-happy',
  ELEGANT: 'font-elegant',
};

const COLORS = [
  { name: '白', value: '#FFFFFF' },
  { name: '黑', value: '#000000' },
  { name: '黄', value: '#FACC15' }, 
  { name: '红', value: '#EF4444' }, 
  { name: '蓝', value: '#3B82F6' }, 
  { name: '紫', value: '#A855F7' }, 
  { name: '绿', value: '#22C55E' }, 
  { name: '粉', value: '#EC4899' },
  { name: '橙', value: '#F97316' },
];

// --- Custom Hook for Draggable ---
const useDraggable = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  return { position, onMouseDown, style: { transform: `translate(${position.x}px, ${position.y}px)`, cursor: isDragging ? 'grabbing' : 'grab' } };
};

// --- Widget Wrapper ---
const DeletableWidget: React.FC<{
    id: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    isHidden?: boolean;
    onDelete: (id: string) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    initialY?: number;
}> = ({ id, children, className, style, isHidden, onDelete, isSelected, onSelect, initialY }) => {
    const { position, onMouseDown, style: dragStyle } = useDraggable();
    
    if (isHidden) return null;

    return (
        <div 
            className={`absolute group/widget ${isSelected ? 'z-50 ring-2 ring-dashed ring-indigo-500' : 'z-10'} ${className || ''}`} 
            style={{ ...style, top: initialY ? undefined : style?.top, transform: `translate(${position.x}px, ${initialY ? initialY + position.y : position.y}px)` }}
            onMouseDown={(e) => {
                onMouseDown(e);
                onSelect(id);
            }}
        >
            {children}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover/widget:opacity-100 transition-opacity shadow-sm z-50 hover:bg-red-600 cursor-pointer"
                title="删除组件"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
};

// --- Main Component ---
const ImageGenerationStep: React.FC<ImageGenerationStepProps> = ({ summary, metadata, onRestart, onBack }) => {
  const [localSummary, setLocalSummary] = useState<ContentSummary>(summary);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [hiddenFields, setHiddenFields] = useState<Record<string, boolean>>({});
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [elementStyles, setElementStyles] = useState<Record<string, { fontSize?: number, color?: string, fontFamily?: FontStyle }>>({});

  const [activeMode, setActiveMode] = useState<ImageMode>(ImageMode.INFOGRAPHIC);
  const [infoStyle, setInfoStyle] = useState<InfographicStyle>('COVER');
  
  const [activeFont, setActiveFont] = useState<FontStyle>('SANS');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [highlightColor, setHighlightColor] = useState<string>('#FACC15');

  const [imageSeeds, setImageSeeds] = useState<Record<SeedKey, number>>({
    hero: 0, frame1: 1, frame2: 2, frame3: 3, frame4: 4,
  });
  const [customImages, setCustomImages] = useState<Partial<Record<SeedKey, string>>>({});

  // Initialize custom images from metadata (uploaded images OR search images)
  useEffect(() => {
      const initialImages: Partial<Record<SeedKey, string>> = {};
      
      // 1. VIDEO MODE
      if (metadata.sourceType === 'VIDEO' && metadata.fileUrl) {
          initialImages['hero'] = metadata.fileUrl; 
          if (metadata.thumbnail) initialImages['hero'] = metadata.thumbnail;
      }
      
      // 2. IMAGES MODE
      if (metadata.sourceType === 'IMAGES' && metadata.uploadedImages && metadata.uploadedImages.length > 0) {
          const imgs = metadata.uploadedImages;
          if (imgs[0]) initialImages['hero'] = imgs[0];
          if (imgs[1]) initialImages['frame1'] = imgs[1];
          if (imgs[2]) initialImages['frame2'] = imgs[2];
          if (imgs[3]) initialImages['frame3'] = imgs[3];
          if (imgs[4]) initialImages['frame4'] = imgs[4];
      }

      // 3. SEARCH MODE (New: Populate from extracted search images)
      if (metadata.sourceType === 'SEARCH' && summary.searchImageUrls && summary.searchImageUrls.length > 0) {
          const imgs = summary.searchImageUrls;
          if (imgs[0]) initialImages['hero'] = imgs[0];
          if (imgs[1]) initialImages['frame1'] = imgs[1];
          if (imgs[2]) initialImages['frame2'] = imgs[2];
          if (imgs[3]) initialImages['frame3'] = imgs[3];
      }

      setCustomImages(prev => ({ ...prev, ...initialImages }));
  }, [metadata, summary]);


  const getImageUrl = (seedKey: SeedKey) => {
    if (customImages[seedKey]) return customImages[seedKey]!;
    const seed = imageSeeds[seedKey];
    // Random placeholders
    return `https://picsum.photos/seed/${seed + 200}/800/1000`;
  };

  const refreshImage = (key: SeedKey) => {
    if (customImages[key]) {
        const newCustom = { ...customImages };
        delete newCustom[key];
        setCustomImages(newCustom);
    } else {
        const newSeed = Math.floor(Math.random() * 5000); 
        setImageSeeds(prev => ({ ...prev, [key]: newSeed }));
    }
  };

  const handleImageUpload = (key: SeedKey, file: File) => {
      const url = URL.createObjectURL(file);
      setCustomImages(prev => ({ ...prev, [key]: url }));
  };

  const shuffleAllImages = () => {
    // Reset custom images to allow random seeds to take over, or reshuffle existing ones?
    // Simple approach: clear overrides and randomize seeds.
    if (metadata.sourceType === 'IMAGES') {
        setCustomImages({}); // Clear uploads to show randoms (user can re-upload)
    }
    setImageSeeds({
        hero: Math.floor(Math.random() * 5000),
        frame1: Math.floor(Math.random() * 5000),
        frame2: Math.floor(Math.random() * 5000),
        frame3: Math.floor(Math.random() * 5000),
        frame4: Math.floor(Math.random() * 5000),
    });
  };

  const shuffleTextContent = () => {
    const shuffledPoints = [...localSummary.keyPoints].sort(() => 0.5 - Math.random());
    setLocalSummary(prev => ({ ...prev, keyPoints: shuffledPoints }));
  };

  const updateLocalText = (path: string, value: string) => {
     const parts = path.split('.');
     if (parts.length === 1) {
        setLocalSummary(prev => ({...prev, [parts[0]]: value}));
     } else if (parts[0] === 'keyPoints') {
        const idx = parseInt(parts[1]);
        const newPoints = [...localSummary.keyPoints];
        newPoints[idx] = value;
        setLocalSummary(prev => ({...prev, keyPoints: newPoints}));
     }
  };

  const updateElementStyle = (prop: 'fontSize' | 'color' | 'fontFamily', value: any) => {
      if (!selectedElementId) return;
      setElementStyles(prev => ({
          ...prev,
          [selectedElementId]: {
              ...prev[selectedElementId],
              [prop]: value
          }
      }));
  };

  const EditableText = ({ value, path, className, style, placeholder, colorOverride }: { value: string, path?: string, className?: string, style?: React.CSSProperties, placeholder?: string, colorOverride?: string }) => {
    const isHidden = path && hiddenFields[path];
    const isSelected = path && selectedElementId === path;
    const customStyle = path ? elementStyles[path] : {};
    if (isHidden) return null;

    const fontSizeStyle = customStyle?.fontSize ? { fontSize: `${customStyle.fontSize}px` } : {};
    const finalColor = customStyle?.color || colorOverride || textColor;
    const fontClass = customStyle?.fontFamily ? FONT_MAP[customStyle.fontFamily] : FONT_MAP[activeFont];

    return (
        <div 
            className={`relative group/edit ${className || ''} ${isSelected ? 'ring-1 ring-dashed ring-indigo-400 rounded' : ''}`} 
            style={{ ...style, ...fontSizeStyle }}
            onClick={(e) => {
                if(path) {
                    e.stopPropagation();
                    setSelectedElementId(path);
                }
            }}
        >
             <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                    const newVal = e.currentTarget.innerText;
                    if (path) updateLocalText(path, newVal);
                }}
                style={{ color: finalColor }}
                className={`outline-none transition-all cursor-text empty:before:content-[attr(placeholder)] empty:before:text-gray-400 block w-full h-full ${fontClass}`}
                placeholder={placeholder}
            >
                {value}
            </div>
        </div>
    );
  };

  const EditableImage = ({ seedKey, className, imgStyle, showControls = true }: { seedKey: SeedKey, className?: string, imgStyle?: React.CSSProperties, showControls?: boolean }) => {
    const src = getImageUrl(seedKey);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(seedKey, e.target.files[0]);
        }
    };
    
    const displaySrc = src; 

    return (
        <div className={`relative group overflow-hidden ${className || ''} bg-zinc-800`}>
            <img src={displaySrc} className="w-full h-full object-cover" style={imgStyle} alt="Content" crossOrigin="anonymous" />
            {showControls && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); refreshImage(seedKey); }}
                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all transform hover:scale-105 shadow-lg"
                        title={customImages[seedKey] ? "还原/换图" : "随机换图"}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all transform hover:scale-105 shadow-lg"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                </div>
            )}
        </div>
    );
  };

  const handleDownload = async () => {
    if (!previewRef.current || !(window as any).html2canvas) {
        alert("导出组件未加载");
        return;
    }
    const button = document.getElementById('download-btn');
    if(button) button.innerText = "生成中...";

    try {
        window.scrollTo(0, 0);
        const canvas = await (window as any).html2canvas(previewRef.current, {
            useCORS: true, 
            scale: 2, 
            backgroundColor: null,
            logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `clipessence-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    } catch (e) {
        console.error(e);
        alert("导出失败，请尝试上传本地图片代替。");
    } finally {
        if(button) button.innerText = "导出 JPEG";
    }
  };

  // --- Render Templates ---
  const renderInfographicContent = () => {
    
    // 1. MEMO (Apple Notes)
    if (infoStyle === 'MEMO') {
        return (
            <div className="w-full h-full bg-[#f2f2f7] flex flex-col relative overflow-hidden font-sans">
                <div className="absolute inset-0 pointer-events-none opacity-[0.3] bg-white mix-blend-overlay"></div>
                <div className="px-4 py-3 flex items-center justify-between text-[#e0aa3e] z-10 bg-[#f2f2f7]/90 backdrop-blur-sm border-b border-zinc-200/50 shrink-0">
                        <div className="flex items-center gap-1 text-xs font-medium"><ChevronLeft className="w-4 h-4" /> 文件夹</div>
                        <div className="text-xs font-semibold text-black">备忘录</div>
                        <div className="w-6 h-6 rounded-full border border-[#e0aa3e] flex items-center justify-center text-[10px]">●●●</div>
                </div>
                <div className="m-4 mt-2 flex-1 bg-white rounded-xl shadow-sm p-6 relative z-10 overflow-hidden">
                    <DeletableWidget id="memo-container" isHidden={hiddenFields["memo-container"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="memo-container"} onSelect={(id)=>setSelectedElementId(id)} className="w-full h-full">
                        <div className="space-y-5">
                            <div className="text-xs text-zinc-400 font-medium text-center mb-4">
                                {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} · {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <EditableText value={localSummary.title} path="title" colorOverride="#000000" className="text-3xl font-bold leading-tight tracking-tight" />
                            <div className="flex gap-3 items-start bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <span className="text-yellow-500 text-lg mt-0.5">💡</span>
                                <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride="#666" className="text-sm leading-relaxed font-medium" />
                            </div>
                            <div className="space-y-3">
                                {localSummary.keyPoints.map((point, i) => (
                                    <div key={i} className="flex gap-3 items-start border-b border-zinc-50 pb-2">
                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#e0aa3e] flex-shrink-0"></div>
                                        <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#1c1c1e" className="text-base leading-relaxed" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DeletableWidget>
                </div>
            </div>
        );
    }

    // 2. CARD (Knowledge)
    if (infoStyle === 'CARD') {
        return (
            <div className="w-full h-full bg-zinc-50 flex flex-col relative border-[12px]" style={{ borderColor: highlightColor }}>
                <div className="p-8 pb-12 text-center relative overflow-hidden shrink-0" style={{ backgroundColor: highlightColor }}>
                        <DeletableWidget id="card-title" className="relative z-10 w-full" isHidden={hiddenFields["card-title"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="card-title"} onSelect={(id)=>setSelectedElementId(id)}>
                            <EditableText value={localSummary.title} path="title" colorOverride='#FFFFFF' className="text-3xl font-black leading-tight text-shadow-sm" />
                        </DeletableWidget>
                </div>
                <div className="flex-1 bg-white -mt-6 mx-6 mb-6 rounded-t-2xl shadow-xl p-6 flex flex-col relative z-20 overflow-hidden">
                    <DeletableWidget id="card-content" className="w-full relative flex-1 flex flex-col" isHidden={hiddenFields["card-content"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="card-content"} onSelect={(id)=>setSelectedElementId(id)}>
                        <div className="flex flex-col gap-6">
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 shrink-0">
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <Sparkles className="w-4 h-4" style={{ color: highlightColor }} />
                                    <span className="text-xs font-bold uppercase" style={{ color: highlightColor }}>核心摘要</span>
                                </div>
                                <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride="#52525b" className="text-sm leading-relaxed font-medium" />
                            </div>
                            <div className="space-y-4 shrink-0">
                                {localSummary.keyPoints.map((point, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 font-bold flex items-center justify-center text-xs bg-opacity-10" style={{ borderColor: highlightColor, color: highlightColor, backgroundColor: `${highlightColor}20` }}>{i+1}</div>
                                        <EditableText value={point} path={`keyPoints.${i}`} colorOverride={textColor === '#FFFFFF' ? '#27272a' : textColor} className="text-sm font-medium pt-0.5 leading-snug" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DeletableWidget>
                    <div className="mt-auto pt-6 shrink-0 h-24">
                        <div className="h-full rounded-xl overflow-hidden relative">
                            <EditableImage seedKey="frame1" className="w-full h-full opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. MINIMAL
    if (infoStyle === 'MINIMAL') {
        return (
             <div className="w-full h-full bg-[#FDFBF7] flex flex-col p-8 relative border-8 border-white shadow-inner">
                 <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900"></div>
                 
                 <DeletableWidget id="minimal-container" className="w-full mt-8 flex flex-col gap-10" isHidden={hiddenFields["minimal-container"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="minimal-container"} onSelect={(id)=>setSelectedElementId(id)}>
                     <div className="text-center space-y-6">
                        <div className="inline-block border-b-2 border-zinc-900 pb-1 mb-2">
                            <span className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">ESSENCE</span>
                        </div>
                        <EditableText value={localSummary.title} path="title" colorOverride="#18181b" className="text-4xl font-serif-sc font-bold leading-tight text-zinc-900" />
                        <div className="w-12 h-1 bg-zinc-200 mx-auto rounded-full"></div>
                        <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride="#52525b" className="text-sm leading-relaxed text-zinc-600 max-w-[90%] mx-auto font-serif-sc italic" />
                     </div>

                     <div className="space-y-6 pl-4 border-l border-zinc-200 ml-2">
                        {localSummary.keyPoints.map((point, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-2 h-2 bg-zinc-300 rounded-full ring-4 ring-[#FDFBF7]"></div>
                                <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#27272a" className="text-base font-medium leading-relaxed" />
                            </div>
                        ))}
                     </div>
                 </DeletableWidget>
             </div>
        );
    }

    // 4. NEON
    if (infoStyle === 'NEON') {
        return (
             <div className="w-full h-full bg-[#050505] flex flex-col p-6 relative overflow-hidden border-2 border-[#050505]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                 <div className="absolute top-4 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent shadow-[0_0_10px_#00ff9d]"></div>
                 <div className="absolute bottom-4 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent shadow-[0_0_10px_#ff00ff]"></div>

                 <DeletableWidget id="neon-container" className="w-full mt-10 relative z-10 flex flex-col gap-8" isHidden={hiddenFields["neon-container"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="neon-container"} onSelect={(id)=>setSelectedElementId(id)}>
                    <div className="border border-zinc-800 bg-black/50 backdrop-blur-xl p-6 rounded-none relative">
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#00ff9d]"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#ff00ff]"></div>
                        <EditableText value={localSummary.title} path="title" colorOverride="#ffffff" className="text-3xl font-black tracking-wider mb-4" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }} />
                        <div className="text-[#00ff9d] text-xs font-mono mb-2">// CORE_DATA_DUMP</div>
                        <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride="#a1a1aa" className="text-sm font-mono leading-relaxed" />
                    </div>

                    <div className="space-y-4">
                        {localSummary.keyPoints.map((point, i) => (
                            <div key={i} className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 p-3 hover:border-[#ff00ff]/50 transition-colors">
                                <div className="text-[#ff00ff] font-mono text-lg font-bold">0{i+1}</div>
                                <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#e4e4e7" className="text-sm font-bold tracking-wide" />
                            </div>
                        ))}
                    </div>
                 </DeletableWidget>
             </div>
        );
    }

    // 5. GRADIENT
    if (infoStyle === 'GRADIENT') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col p-8 relative text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-10 mix-blend-overlay"></div>
                
                <DeletableWidget id="grad-container" className="mt-12 w-full flex flex-col gap-8" isHidden={hiddenFields["grad-container"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="grad-container"} onSelect={(id)=>setSelectedElementId(id)}>
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl">
                        <EditableText value={localSummary.title} path="title" colorOverride="#fff" className="text-4xl font-black leading-tight drop-shadow-md" />
                    </div>

                    <div className="space-y-4">
                         {localSummary.keyPoints.map((point, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl shadow-inner flex-shrink-0">
                                    {i+1}
                                </div>
                                <div className="pt-1">
                                    <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#fff" className="text-lg font-medium leading-snug text-shadow-sm" />
                                </div>
                            </div>
                         ))}
                    </div>
                </DeletableWidget>
            </div>
        );
    }

    // 6. POLAROID - Fixed Overflow
    if (infoStyle === 'POLAROID') {
        return (
            <div className="w-full h-full bg-zinc-200 flex flex-col p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-50"></div>
                
                <DeletableWidget id="polaroid-hero" className="w-full mt-4 relative z-10" isHidden={hiddenFields["polaroid-hero"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="polaroid-hero"} onSelect={(id)=>setSelectedElementId(id)}>
                    <div className="bg-white p-3 pb-10 shadow-xl shadow-black/10 transform rotate-2">
                        <div className="aspect-video bg-zinc-100 overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                             <EditableImage seedKey="hero" className="w-full h-full" />
                        </div>
                        <div className="mt-4 px-2">
                            <EditableText value={localSummary.title} path="title" colorOverride="#000" className="text-xl font-happy text-center leading-tight" placeholder="写个标题..." />
                        </div>
                    </div>
                </DeletableWidget>

                <DeletableWidget id="polaroid-list" className="w-full mt-8 relative z-10" isHidden={hiddenFields["polaroid-list"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="polaroid-list"} onSelect={(id)=>setSelectedElementId(id)}>
                     <div className="bg-white p-6 shadow-lg shadow-black/5 transform -rotate-1">
                        <div className="space-y-3">
                             {localSummary.keyPoints.slice(0,3).map((point, i) => (
                                 <div key={i} className="flex gap-2 items-start border-b border-dashed border-zinc-200 pb-2">
                                     <span className="font-happy text-zinc-400">#{i+1}</span>
                                     <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#333" className="text-sm font-sans-sc" />
                                 </div>
                             ))}
                        </div>
                     </div>
                </DeletableWidget>
            </div>
        );
    }

    // 7. MAGAZINE
    if (infoStyle === 'MAGAZINE') {
        return (
            <div className="w-full h-full bg-white flex flex-col relative font-serif-sc">
                 <div className="absolute inset-0">
                    <EditableImage seedKey="hero" className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30"></div>
                 </div>

                 <div className="p-8 h-full flex flex-col justify-between relative z-10">
                     <DeletableWidget id="mag-header" className="w-full border-t border-white/50 pt-4" isHidden={hiddenFields["mag-header"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="mag-header"} onSelect={(id)=>setSelectedElementId(id)}>
                        <div className="flex justify-between text-white/80 text-xs tracking-[0.2em] font-sans mb-2">
                            <span>ISSUE 01</span>
                            <span>ESSENCE</span>
                        </div>
                     </DeletableWidget>

                     <DeletableWidget id="mag-content" className="w-full text-center flex flex-col gap-6" isHidden={hiddenFields["mag-content"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="mag-content"} onSelect={(id)=>setSelectedElementId(id)}>
                        <div>
                            <EditableText value={localSummary.title} path="title" colorOverride="#fff" className="text-5xl font-serif-sc font-bold leading-tight drop-shadow-2xl" />
                        </div>
                        <div className="w-full h-[1px] bg-white/40"></div>
                        <div className="grid grid-cols-1 gap-4 text-left">
                            {localSummary.keyPoints.slice(0,3).map((point, i) => (
                                <div key={i} className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md backdrop-blur-sm bg-black/10 p-2">
                                     <EditableText value={point} path={`keyPoints.${i}`} />
                                </div>
                            ))}
                        </div>
                     </DeletableWidget>
                 </div>
            </div>
        );
    }

    // 8. PAPER
    if (infoStyle === 'PAPER') {
        return (
            <div className="w-full h-full bg-[#fdf6e3] flex flex-col p-8 relative font-serif-sc border-[16px] border-[#eee8d5]">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                 
                 <DeletableWidget id="paper-container" className="w-full h-full flex flex-col gap-6" isHidden={hiddenFields["paper-container"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="paper-container"} onSelect={(id)=>setSelectedElementId(id)}>
                     <div className="text-center border-b-4 border-black pb-6">
                         <EditableText value={localSummary.title} path="title" colorOverride="#000" className="text-4xl font-bold leading-tight" />
                         <div className="mt-2 text-xs tracking-widest text-zinc-500 uppercase">Daily Knowledge</div>
                     </div>
                     
                     <div className="flex-1 space-y-6 pt-2">
                        <div className="bg-[#eee8d5] p-4 border-l-4 border-black italic">
                            <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride="#333" className="text-sm leading-relaxed" />
                        </div>
                        
                        <div className="space-y-4">
                            {localSummary.keyPoints.map((point, i) => (
                                <div key={i} className="flex gap-3 items-baseline">
                                    <span className="font-black text-xl">0{i+1}.</span>
                                    <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#000" className="text-base leading-relaxed border-b border-dashed border-zinc-400 pb-1" />
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="h-32 shrink-0 border-2 border-black p-1 rotate-1 bg-white shadow-lg">
                        <EditableImage seedKey="frame2" className="w-full h-full grayscale contrast-125" />
                     </div>
                 </DeletableWidget>
            </div>
        );
    }

    // 9. GLASS
    if (infoStyle === 'GLASS') {
        return (
            <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-80"></div>
                 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-400 rounded-full blur-[100px] opacity-50 animate-pulse"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-yellow-400 rounded-full blur-[120px] opacity-40 animate-pulse"></div>

                 <DeletableWidget id="glass-card" className="w-[90%] h-[90%] relative z-10" isHidden={hiddenFields["glass-card"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="glass-card"} onSelect={(id)=>setSelectedElementId(id)}>
                     <div className="w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col p-6 text-white">
                        <div className="mb-6">
                             <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-wider mb-3">FEATURED</div>
                             <EditableText value={localSummary.title} path="title" colorOverride="#fff" className="text-3xl font-bold leading-tight text-shadow-sm" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden">
                            {localSummary.keyPoints.map((point, i) => (
                                <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-black/30 transition-colors">
                                    <EditableText value={point} path={`keyPoints.${i}`} colorOverride="#fff" className="text-sm font-medium leading-relaxed" />
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 h-24 rounded-xl overflow-hidden border border-white/10">
                             <EditableImage seedKey="hero" className="w-full h-full opacity-90" />
                        </div>
                     </div>
                 </DeletableWidget>
            </div>
        );
    }

    // 10. LITERATURE (New Style) - Fixed Overflow
    if (infoStyle === 'LITERATURE') {
        return (
            <div className="w-full h-full relative flex flex-col bg-black overflow-hidden">
                {/* Background Hero - The Paper */}
                <div className="absolute inset-0">
                    <EditableImage seedKey="hero" className="w-full h-full" />
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                {/* Content Container */}
                <DeletableWidget 
                    id="lit-container" 
                    className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-8 z-10 w-full"
                    isHidden={hiddenFields["lit-container"]} 
                    onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} 
                    isSelected={selectedElementId==="lit-container"} 
                    onSelect={(id)=>setSelectedElementId(id)}
                >
                    {/* English Abstract / Core Idea (Bilingual Mock) */}
                    <div className="space-y-2">
                         <div className="border-l-4 border-orange-500 pl-4">
                            <EditableText 
                                value={localSummary.coreIdea} 
                                path="coreIdea" 
                                colorOverride="#d4d4d8" // Zinc 300
                                className="text-xl font-serif-sc font-medium leading-relaxed italic opacity-90" 
                            />
                         </div>
                         <EditableText 
                             value="The root cause of the problem is often hidden in plain sight." 
                             path="subtitle_placeholder" 
                             colorOverride="#a1a1aa" 
                             className="text-sm font-sans font-medium opacity-70 pl-5"
                             placeholder="输入英文摘要..."
                         />
                    </div>

                    {/* Big Chinese Title */}
                    <div>
                        <EditableText 
                            value={localSummary.title} 
                            path="title" 
                            colorOverride="#ffffff" 
                            className="text-5xl font-black tracking-tight leading-none mb-2 font-sans-sc" 
                        />
                         <EditableText 
                            value="SCIENCE & LIFE" 
                            path="lit_tag" 
                            colorOverride="#f97316" // Orange 500
                            className="text-xs font-bold tracking-[0.5em] uppercase" 
                        />
                    </div>
                </DeletableWidget>
            </div>
        );
    }

    // Default COVER
    return (
        <div className="w-full h-full relative">
            <EditableImage seedKey="hero" className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 pointer-events-none"></div>
            
            <DeletableWidget id="cover-header" className="top-12 left-6 right-6 z-20 w-auto" isHidden={hiddenFields["cover-header"]} onDelete={(id) => setHiddenFields(prev => ({...prev, [id]: true}))} isSelected={selectedElementId === "cover-header"} onSelect={(id) => setSelectedElementId(id)}>
                <div className="inline-block px-3 py-1 bg-yellow-400 text-black font-black text-xs rounded-full mb-4 shadow-lg rotate-[-2deg]"># 必看精华</div>
                <EditableText value={localSummary.title} path="title" className="text-5xl font-black text-white leading-[1.1] drop-shadow-2xl mb-4 line-clamp-3" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }} />
            </DeletableWidget>

            <DeletableWidget id="cover-center" className="top-1/2 left-6 right-6 z-10 w-auto" style={{ transform: 'translateY(-50%)' }} isHidden={hiddenFields["cover-center"]} onDelete={(id) => setHiddenFields(prev => ({...prev, [id]: true}))} isSelected={selectedElementId === "cover-center"} onSelect={(id) => setSelectedElementId(id)}>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl">
                        <EditableText value={localSummary.coreIdea} path="coreIdea" colorOverride={highlightColor} className="text-lg font-bold text-shadow-md leading-relaxed" />
                    </div>
            </DeletableWidget>

            <DeletableWidget id="cover-list" className="bottom-12 left-6 right-6 z-20 w-auto" initialY={400} isHidden={hiddenFields["cover-list"]} onDelete={(id)=>setHiddenFields({...hiddenFields, [id]:true})} isSelected={selectedElementId==="cover-list"} onSelect={(id)=>setSelectedElementId(id)}>
                <div className="space-y-3">
                    {localSummary.keyPoints.slice(0,3).map((point, i) => (
                        <div key={i} className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center text-xs">{i+1}</span>
                            <EditableText value={point} path={`keyPoints.${i}`} className="text-sm text-white font-medium line-clamp-2" />
                        </div>
                    ))}
                </div>
            </DeletableWidget>
        </div>
    );
  };

  // Render Subtitle Stitch
  const renderSubtitleStitch = () => {
    return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="h-[60%] w-full relative z-10 shrink-0">
                <EditableImage seedKey="hero" className="w-full h-full" />
            </div>
            
            <div className="flex-1 flex flex-col gap-[1px] overflow-hidden">
                {[0, 1, 2].map((idx) => (
                    <div key={idx} className="flex-1 w-full relative overflow-hidden group/strip">
                        <div className="absolute inset-0 scale-110">
                            <EditableImage 
                                seedKey={`frame${idx + 1}` as SeedKey} 
                                className="w-full h-full" 
                                imgStyle={{ filter: 'blur(8px) brightness(0.6)', transform: 'scale(1.1)' }}
                                showControls={false}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/20"></div>

                        <DeletableWidget 
                            id={`stitch-sub-${idx}`}
                            className="absolute inset-0 flex items-center justify-center w-full h-full"
                            isHidden={hiddenFields[`stitch-sub-${idx}`]}
                            onDelete={(id) => setHiddenFields(prev => ({...prev, [id]: true}))}
                            isSelected={selectedElementId === `stitch-sub-${idx}`}
                            onSelect={(id) => setSelectedElementId(id)}
                        >
                            <div className="w-[90%] text-center">
                                    <EditableText 
                                    value={localSummary.keyPoints[idx] || "这里是重点剧情台词..."} 
                                    path={`keyPoints.${idx}`}
                                    colorOverride={highlightColor} 
                                    className="text-shadow-lg font-bold text-lg md:text-xl leading-tight tracking-wide drop-shadow-md" 
                                    style={{ textShadow: '0 2px 6px rgba(0,0,0,1)' }}
                                />
                            </div>
                        </DeletableWidget>
                        
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover/strip:opacity-100 z-20">
                             <button onClick={() => refreshImage(`frame${idx+1}` as SeedKey)} className="p-1 bg-white/20 rounded-full text-white"><RefreshCw className="w-3 h-3"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-white">视觉工坊</h2>
                <p className="text-zinc-400 text-sm mt-1">
                    {metadata.sourceType === 'SEARCH' ? '搜索源' : (metadata.sourceType === 'IMAGES' ? '图文创作' : '视频分析')}
                </p>
            </div>
         </div>
         <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button onClick={() => setActiveMode(ImageMode.SUBTITLE_STITCH)} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeMode === ImageMode.SUBTITLE_STITCH ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                <Film className="w-4 h-4" /> 台词拼图
            </button>
            <button onClick={() => setActiveMode(ImageMode.INFOGRAPHIC)} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeMode === ImageMode.INFOGRAPHIC ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                <Layout className="w-4 h-4" /> 爆款笔记
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[800px] flex-col-reverse lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0 h-fit">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                    {activeMode === ImageMode.SUBTITLE_STITCH ? '拼图模式' : '选择模板'}
                </h3>
                <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {activeMode === ImageMode.SUBTITLE_STITCH ? (
                        <button className="w-full p-3 rounded-xl flex flex-col items-center gap-2 bg-indigo-500/10 border border-indigo-500 text-indigo-400">
                            <AlignJustify className="w-6 h-6" />
                            <span className="text-xs font-medium">经典台词</span>
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setInfoStyle('COVER')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'COVER' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">封面大图</span>
                            </button>
                            <button onClick={() => setInfoStyle('LITERATURE')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'LITERATURE' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <BookOpen className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">文献分享</span>
                            </button>
                            <button onClick={() => setInfoStyle('MEMO')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'MEMO' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <Smartphone className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">备忘录</span>
                            </button>
                             <button onClick={() => setInfoStyle('CARD')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'CARD' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <CreditCard className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">知识卡片</span>
                            </button>
                            <button onClick={() => setInfoStyle('MINIMAL')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'MINIMAL' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <AlignJustify className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">极简风</span>
                            </button>
                            <button onClick={() => setInfoStyle('NEON')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'NEON' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <Zap className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">暗黑霓虹</span>
                            </button>
                            <button onClick={() => setInfoStyle('GRADIENT')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'GRADIENT' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <Aperture className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">弥散渐变</span>
                            </button>
                            <button onClick={() => setInfoStyle('POLAROID')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'POLAROID' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <Grid className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">胶片故事</span>
                            </button>
                            <button onClick={() => setInfoStyle('MAGAZINE')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'MAGAZINE' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <FileText className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">时尚杂志</span>
                            </button>
                            <button onClick={() => setInfoStyle('PAPER')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'PAPER' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <FileText className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">复古纸</span>
                            </button>
                            <button onClick={() => setInfoStyle('GLASS')} className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${infoStyle === 'GLASS' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                                <Layers className="w-5 h-5" />
                                <span className="text-[10px] font-medium text-center">毛玻璃</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

             {/* Styles & Download - Keep as is */}
             <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4 transition-all">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Type className="w-3 h-3" /> 
                        {selectedElementId ? '组件样式' : '全局样式'}
                    </h3>
                    {selectedElementId && (
                        <button onClick={() => setSelectedElementId(null)} className="text-xs text-indigo-400 hover:text-indigo-300">重置选中</button>
                    )}
                 </div>

                 {selectedElementId && (
                     <div>
                         <label className="text-[10px] text-zinc-400 block mb-1">字号大小</label>
                         <input type="range" min="12" max="120" value={elementStyles[selectedElementId]?.fontSize || 24} onChange={(e) => updateElementStyle('fontSize', parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                     </div>
                 )}

                 <div>
                    <label className="text-[10px] text-zinc-400 block mb-2">字体</label>
                    <div className="grid grid-cols-3 gap-1">
                        {Object.entries(FONT_MAP).map(([key, cls]) => (
                            <button key={key} onClick={() => selectedElementId ? updateElementStyle('fontFamily', key) : setActiveFont(key as FontStyle)} className={`px-1 py-1.5 rounded text-[10px] border truncate ${cls} ${(selectedElementId ? elementStyles[selectedElementId]?.fontFamily === key : activeFont === key) ? 'bg-zinc-800 text-white border-zinc-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                                {key}
                            </button>
                        ))}
                    </div>
                 </div>
                
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-zinc-400 block mb-2">{selectedElementId ? '文字色' : '主色'}</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {COLORS.map(c => (
                                <button key={c.value} onClick={() => selectedElementId ? updateElementStyle('color', c.value) : setTextColor(c.value)} className={`w-4 h-4 rounded-full ring-1 ring-offset-1 ring-offset-zinc-900 ${ (selectedElementId ? elementStyles[selectedElementId]?.color === c.value : textColor === c.value) ? 'ring-indigo-500 scale-110' : 'ring-transparent'}`} style={{ backgroundColor: c.value }} />
                            ))}
                        </div>
                    </div>
                    {!selectedElementId && (
                        <div>
                            <label className="text-[10px] text-zinc-400 block mb-2">高亮色</label>
                            <div className="flex gap-1.5 flex-wrap">
                                {COLORS.map(c => (
                                    <button key={c.value} onClick={() => setHighlightColor(c.value)} className={`w-4 h-4 rounded-full ring-1 ring-offset-1 ring-offset-zinc-900 ${highlightColor === c.value ? 'ring-indigo-500 scale-110' : 'ring-transparent'}`} style={{ backgroundColor: c.value }} />
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
             </div>

            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 mt-auto space-y-3">
                <div className="flex gap-2">
                    <button onClick={shuffleAllImages} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors border border-zinc-700 flex justify-center gap-1">
                        <Shuffle className="w-3 h-3" /> 随机配图
                    </button>
                    <button onClick={shuffleTextContent} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors border border-zinc-700 flex justify-center gap-1">
                        <RefreshCw className="w-3 h-3" /> 换文案
                    </button>
                </div>
                <button id="download-btn" onClick={handleDownload} className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Download className="w-4 h-4" /> 导出 JPEG
                </button>
            </div>
        </div>

        <div className="flex-1 flex justify-center bg-zinc-950/50 rounded-3xl border border-zinc-900/50 p-8 overflow-hidden relative" onClick={() => setSelectedElementId(null)}>
            <div id="preview-container" ref={previewRef} className="relative w-[480px] h-[640px] flex-shrink-0 shadow-2xl transition-all duration-500 select-none overflow-hidden bg-black origin-top scale-[0.65] sm:scale-100" style={{ aspectRatio: '3/4' }}>
                {activeMode === ImageMode.SUBTITLE_STITCH ? renderSubtitleStitch() : renderInfographicContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationStep;