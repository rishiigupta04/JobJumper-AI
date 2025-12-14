import React, { useState, useRef } from 'react';
import { generateAvatar } from '../services/geminiService';
import { 
  Camera, Upload, Sparkles, Download, RefreshCw, 
  Image as ImageIcon, Loader2, Wand2 
} from 'lucide-react';

const AvatarBuilder: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predefinedStyles = [
    "Studio lighting, dark blue suit, neutral grey background",
    "Business casual, blazer, modern office background, bokeh",
    "Minimalist, white background, professional headshot",
    "Tech industry style, smart casual, vibrant lighting"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError("Please upload an image first.");
      return;
    }
    if (!prompt) {
      setError("Please describe the desired style.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAvatar(selectedImage, prompt);
      setGeneratedImage(result);
    } catch (err) {
      setError("Failed to generate avatar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'professional-avatar.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Controls */}
      <div className="flex-1 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Wand2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Avatar Studio</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Professionalize your selfies with AI.</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            1. Upload Portrait
          </label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative h-64 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden group
              ${selectedImage 
                ? 'border-indigo-500 bg-slate-50 dark:bg-slate-950' 
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }
            `}
          >
            {selectedImage ? (
              <>
                <img 
                  src={selectedImage} 
                  alt="Original" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" 
                />
                <div className="relative z-10 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2">
                  <RefreshCw size={16} /> Change Image
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                   <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700 dark:text-slate-200">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Prompt Section */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            2. Define Style
          </label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 placeholder:text-slate-400"
            placeholder="e.g. A professional headshot with studio lighting, wearing a navy blue blazer, against a blurred office background..."
          />
          
          <div className="mt-3 flex flex-wrap gap-2">
            {predefinedStyles.map((style, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(style)}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border border-slate-200 dark:border-slate-700"
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isLoading || !selectedImage || !prompt}
          className={`
            w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
            ${isLoading || !selectedImage || !prompt
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 active:scale-[0.98]'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Professionalizing...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Avatar
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}
      </div>

      {/* Right Panel: Preview */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {generatedImage ? (
            <div className="relative group w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800">
              <img 
                src={generatedImage} 
                alt="Generated Avatar" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                   onClick={downloadImage}
                   className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all hover:scale-105"
                 >
                   <Download size={20} /> Download
                 </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 dark:text-slate-500">
              <div className="bg-slate-200 dark:bg-slate-900 w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center">
                 <ImageIcon size={48} className="opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-600 dark:text-slate-300">No Avatar Generated</h3>
              <p className="max-w-xs mx-auto text-sm">Upload an image and set your style prompt to see the magic happen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarBuilder;
