import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, Image as ImageIcon, Sliders, Crop, Sparkles, Sun, Palette, Wind, Layers, Settings2 } from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageEditorProps {
  image: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    saturate: 100,
    blur: 0,
    exposure: 100,
    hueRotate: 0,
    red: 100,
    green: 100,
    blue: 100,
  });
  const [activeTab, setActiveTab] = useState<'crop' | 'filters' | 'presets'>('presets');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const PRESETS = [
    { name: 'Normal', filters: { brightness: 100, contrast: 100, grayscale: 0, sepia: 0, saturate: 100, blur: 0, exposure: 100, hueRotate: 0, red: 100, green: 100, blue: 100 } },
    { name: 'Vibrant', filters: { brightness: 110, contrast: 120, grayscale: 0, sepia: 0, saturate: 150, blur: 0, exposure: 105, hueRotate: 0, red: 100, green: 100, blue: 100 } },
    { name: 'Noir', filters: { brightness: 100, contrast: 130, grayscale: 100, sepia: 0, saturate: 0, blur: 0, exposure: 100, hueRotate: 0, red: 100, green: 100, blue: 100 } },
    { name: 'Warm', filters: { brightness: 100, contrast: 100, grayscale: 0, sepia: 30, saturate: 130, blur: 0, exposure: 105, hueRotate: 0, red: 110, green: 105, blue: 95 } },
    { name: 'Cool', filters: { brightness: 105, contrast: 90, grayscale: 0, sepia: 0, saturate: 80, blur: 0, exposure: 100, hueRotate: 0, red: 95, green: 100, blue: 115 } },
    { name: 'Dramatic', filters: { brightness: 90, contrast: 150, grayscale: 0, sepia: 0, saturate: 120, blur: 0, exposure: 95, hueRotate: 0, red: 100, green: 100, blue: 100 } },
    { name: 'Vintage', filters: { brightness: 100, contrast: 90, grayscale: 0, sepia: 50, saturate: 80, blur: 0, exposure: 100, hueRotate: 0, red: 105, green: 100, blue: 90 } },
  ];

  useEffect(() => {
    if (image) {
      createImage(image)
        .catch(err => {
          console.error("Initial load error:", err);
          setLoadError("Mage yaluwa, me photo eka load karanna be. (Image failed to load)");
        });
    }
  }, [image]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (error) => reject(error));
      if (!url.startsWith('data:') && !url.startsWith('blob:')) {
        img.setAttribute('crossOrigin', 'anonymous');
      }
      img.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    filtersObj: any
  ): Promise<string> => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      img.width,
      img.height,
      rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-img.width / 2, -img.height / 2);

    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    // Apply filters via a second canvas pass for better control or just use ctx.filter
    const filterCanvas = document.createElement('canvas');
    filterCanvas.width = canvas.width;
    filterCanvas.height = canvas.height;
    const filterCtx = filterCanvas.getContext('2d');
    if (filterCtx) {
      filterCtx.filter = `
        brightness(${filtersObj.brightness}%) 
        contrast(${filtersObj.contrast}%) 
        grayscale(${filtersObj.grayscale}%) 
        sepia(${filtersObj.sepia}%) 
        saturate(${filtersObj.saturate}%)
        blur(${filtersObj.blur}px)
        hue-rotate(${filtersObj.hueRotate}deg)
      `;
      filterCtx.drawImage(canvas, 0, 0);

      // Manual RGB shift for Color Balance
      if (filtersObj.red !== 100 || filtersObj.green !== 100 || filtersObj.blue !== 100) {
        const imageData = filterCtx.getImageData(0, 0, filterCanvas.width, filterCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * (filtersObj.red / 100));     // R
          data[i+1] = Math.min(255, data[i+1] * (filtersObj.green / 100)); // G
          data[i+2] = Math.min(255, data[i+2] * (filtersObj.blue / 100));  // B
        }
        filterCtx.putImageData(imageData, 0, 0);
      }

      return filterCanvas.toDataURL('image/jpeg', 0.9);
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (croppedAreaPixels) {
        const edited = await getCroppedImg(image, croppedAreaPixels, rotation, filters);
        onSave(edited);
      }
    } catch (e: any) {
      console.error("Save Error:", e);
      setLoadError("Hoda prashnayak awa (Save error): " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      sepia: 0,
      saturate: 100,
      blur: 0,
      exposure: 100,
      hueRotate: 0,
      red: 100,
      green: 100,
      blue: 100,
    });
    setRotation(0);
    setZoom(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#050505] z-[60] flex flex-col md:flex-row overflow-hidden font-sans"
    >
      <svg className="hidden">
        <filter id="yaka-color-balance">
          <feColorMatrix type="matrix" values={`
            ${filters.red / 100} 0 0 0 0
            0 ${filters.green / 100} 0 0 0
            0 0 ${filters.blue / 100} 0 0
            0 0 0 1 0
          `} />
        </filter>
      </svg>

      {/* Editor Header - Desktop only or universal top bar */}
      <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 pointer-events-none">
         <div className="flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={onCancel} 
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white/80 backdrop-blur-3xl transition-all active:scale-95"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm md:text-base tracking-tighter uppercase italic leading-none">YAKA<span className="text-blue-500">.</span>Lab</span>
              <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">Image Engine</span>
            </div>
         </div>

         <div className="flex items-center gap-2 pointer-events-auto md:hidden">
            <button 
              onClick={handleSave}
              disabled={isSaving || !!loadError}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isSaving ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {isSaving ? "Saving" : "Apply"}
            </button>
         </div>
      </div>

      {/* Editor Main Canvas Area */}
      <div className="flex-1 relative flex flex-col pt-20 pb-20 md:pb-0">
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
           {loadError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/80 z-50">
                <ImageIcon className="w-16 h-16 text-white/20 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Aiyo, Error ekak!</h3>
                <p className="text-white/40 text-sm max-w-sm mb-8">{loadError}</p>
                <button onClick={onCancel} className="px-8 py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-all">
                   Go Back
                </button>
             </div>
           ) : (
             <div className="absolute inset-4 md:inset-10">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={undefined}
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: {
                      background: 'transparent',
                      borderRadius: '1.5rem',
                      overflow: 'hidden',
                    },
                    mediaStyle: {
                      filter: `
                        brightness(${filters.brightness * (filters.exposure / 100)}%) 
                        contrast(${filters.contrast}%) 
                        grayscale(${filters.grayscale}%) 
                        sepia(${filters.sepia}%) 
                        saturate(${filters.saturate}%)
                        blur(${filters.blur}px)
                        hue-rotate(${filters.hueRotate}deg)
                        url(#yaka-color-balance)
                      `,
                    }
                  }}
                />
             </div>
           )}
        </div>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden flex h-24 items-center justify-around px-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-40">
            {[
              { id: 'presets', icon: Sparkles, label: 'PRESET' },
              { id: 'crop', icon: Crop, label: 'CROP' },
              { id: 'filters', icon: Sliders, label: 'ADJUST' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex flex-col items-center gap-2 py-2 px-4 rounded-2xl transition-all",
                  activeTab === tab.id ? "text-white" : "text-white/30"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-blue-500 scale-110" : "")} />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Settings Panel - Side on Desktop, Overlaid Bottom Sheet on Mobile */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 md:relative md:w-[400px] bg-[#0c0c0c]/90 md:bg-[#0c0c0c] backdrop-blur-3xl md:backdrop-blur-none border-t md:border-t-0 md:border-l border-white/5 flex flex-col z-[50] transition-all",
            "h-[60vh] md:h-full rounded-t-[2.5rem] md:rounded-none shadow-[0_-20px_100px_rgba(0,0,0,0.5)] md:shadow-none"
          )}
        >
          {/* Pull handler for mobile */}
          <div className="md:hidden flex justify-center py-4">
             <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex border-b border-white/5">
             {[
               { id: 'presets', label: 'Presets' },
               { id: 'crop', label: 'Crop' },
               { id: 'filters', label: 'Adjust' }
             ].map((t) => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id as any)}
                 className={cn(
                   "flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative",
                   activeTab === t.id ? "text-white" : "text-white/20 hover:text-white/40"
                 )}
               >
                 {t.label}
                 {activeTab === t.id && (
                   <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 )}
               </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 md:py-10 custom-scrollbar space-y-10">
            
            {activeTab === 'presets' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Master Presets</h3>
                  <button onClick={resetFilters} className="text-[8px] font-black uppercase tracking-widest text-blue-500/60 hover:text-blue-500 transition-colors">Reset</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setFilters(p.filters)}
                      className={cn(
                        "group relative aspect-square rounded-[2rem] border-2 transition-all flex items-center justify-center overflow-hidden",
                        JSON.stringify(filters) === JSON.stringify(p.filters)
                          ? "border-blue-600 bg-blue-600/10 shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                          : "border-white/5 bg-white/[0.02] hover:border-white/20"
                      )}
                    >
                      <div 
                        className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{
                          backgroundImage: `url(${image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: `
                            brightness(${p.filters.brightness}%) 
                            contrast(${p.filters.contrast}%) 
                            grayscale(${p.filters.grayscale}%) 
                            sepia(${p.filters.sepia}%) 
                            saturate(${p.filters.saturate}%)
                            blur(${p.filters.blur}px)
                          `
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className={cn(
                        "relative z-10 text-[10px] font-black uppercase tracking-widest transition-all",
                        JSON.stringify(filters) === JSON.stringify(p.filters) ? "text-white" : "text-white/40"
                      )}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'crop' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Transform Tools</h3>
                  
                  <div className="space-y-10">
                     <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                         <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Zoom</label>
                         <span className="text-[10px] font-mono text-blue-500 font-black">{Math.round(zoom * 100)}%</span>
                       </div>
                       <input 
                         type="range" 
                         min={1} 
                         max={3} 
                         step={0.1} 
                         value={zoom} 
                         onChange={(e) => setZoom(Number(e.target.value))}
                         className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                       />
                     </div>
                     
                     <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                         <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Rotation</label>
                         <span className="text-[10px] font-mono text-blue-500 font-black">{rotation}°</span>
                       </div>
                       <input 
                         type="range" 
                         min={0} 
                         max={360} 
                         step={1} 
                         value={rotation} 
                         onChange={(e) => setRotation(Number(e.target.value))}
                         className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                       />
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all">
                       <RotateCcw className="w-4 h-4 text-white/60" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Rotate L</span>
                    </button>
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all rotate-180">
                       <RotateCcw className="w-4 h-4 text-white/60" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-white/30 rotate-180">Rotate R</span>
                    </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'filters' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Basic Adjustments</h3>
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                     {showAdvanced ? "Simple" : "Advanced"}
                     <Settings2 className={cn("w-3 h-3 transition-transform", showAdvanced && "rotate-180")} />
                  </button>
                </div>
                
                <div className="grid gap-8">
                   {[
                     { key: 'exposure', label: 'Exposure', min: 0, max: 200, icon: Sun },
                     { key: 'brightness', label: 'Brightness', min: 0, max: 200, icon: Sun },
                     { key: 'contrast', label: 'Contrast', min: 0, max: 200, icon: Layers },
                     { key: 'saturate', label: 'Saturation', min: 0, max: 200, icon: Palette },
                   ].map((f) => (
                     <div key={f.key} className="space-y-4 group">
                        <div className="flex justify-between items-center px-1">
                           <div className="flex items-center gap-3">
                              <f.icon className="w-3 h-3 text-white/20 group-hover:text-blue-500/50 transition-colors" />
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">{f.label}</label>
                           </div>
                           <span className="text-[10px] text-blue-500 font-black font-mono">{(filters as any)[f.key]}%</span>
                        </div>
                        <input 
                          type="range" 
                          min={f.min} 
                          max={f.max} 
                          value={(filters as any)[f.key]} 
                          onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                          className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                        />
                     </div>
                   ))}

                   <AnimatePresence>
                     {showAdvanced && (
                       <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-8 overflow-hidden"
                       >
                         <div className="h-px bg-white/5 w-full" />
                         <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Color Science</h3>
                         
                         {[
                           { key: 'red', label: 'Red Balance', min: 0, max: 200, color: 'text-red-500' },
                           { key: 'green', label: 'Green Balance', min: 0, max: 200, color: 'text-green-500' },
                           { key: 'blue', label: 'Blue Balance', min: 0, max: 200, color: 'text-blue-500' },
                           { key: 'hueRotate', label: 'Hue Shift', min: 0, max: 360, color: 'text-purple-500' },
                           { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
                           { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
                           { key: 'blur', label: 'Gaussian Blur', min: 0, max: 25 },
                         ].map((f: any) => (
                          <div key={f.key} className="space-y-4 group">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">{f.label}</label>
                                <span className={cn("text-[10px] font-black font-mono", f.color || "text-white/40")}>
                                  {(filters as any)[f.key]}{f.key === 'blur' ? 'px' : f.key === 'hueRotate' ? '°' : '%'}
                                </span>
                             </div>
                             <input 
                               type="range" 
                               min={f.min} 
                               max={f.max} 
                               value={(filters as any)[f.key]} 
                               onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                               className={cn(
                                 "w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer",
                                 f.key === 'red' ? "accent-red-500" : 
                                 f.key === 'green' ? "accent-green-500" : 
                                 f.key === 'blue' ? "accent-blue-500" : "accent-white/20"
                               )}
                             />
                          </div>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </motion.div>
            )}

          </div>

          <div className="hidden md:flex p-10 border-t border-white/5 gap-4 bg-black/40">
             <button 
               onClick={onCancel}
               className="flex-1 px-6 py-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/5 transition-all active:scale-95"
             >
               Discard
             </button>
             <button 
               onClick={handleSave}
               disabled={isSaving || !!loadError}
               className="flex-2 px-8 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:scale-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
             >
               {isSaving ? (
                   <>
                     <RotateCcw className="w-4 h-4 animate-spin" />
                     Processing...
                   </>
               ) : (
                   <>
                     <Check className="w-4 h-4" />
                     Save Changes
                   </>
               )}
             </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
