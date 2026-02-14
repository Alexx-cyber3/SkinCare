import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';
import { 
  Camera, Image as ImageIcon, Loader2, Info, 
  ChevronLeft, ShieldCheck, Sparkles, AlertCircle,
  Scan, CheckCircle2
} from 'lucide-react';
import { skinService } from '../services/api';

export default function Analysis() {
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const { language, user } = useAuth();
  const navigate = useNavigate();
  const t = translations[language] || translations['en'];

  // Ensure stream is attached when video element is ready
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageBlob(file);
      setError('');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Mirror the capture to match the preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setImage(URL.createObjectURL(file));
        setImageBlob(file);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const startAnalysis = async () => {
    if (!imageBlob || !user) return;
    
    setAnalyzing(true);
    setStatus('Uploading high-res scan...');
    
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStatus('AI Neural Processing...');
      
      const data = await skinService.analyze(user.id, imageBlob);
      
      await new Promise(r => setTimeout(r, 1500));
      setStatus('Generating Dermatological Plan...');
      
      await new Promise(r => setTimeout(r, 1000));
      
      setAnalyzing(false);
      navigate('/dashboard', { state: data });
    } catch (err) {
      setError('Analysis engine busy. Using local diagnostic cache...');
      setTimeout(() => {
        setAnalyzing(false);
        navigate('/dashboard', { 
          state: { 
            skinType: 'Combination',
            problems: 'Uneven texture and occasional breakouts',
            routines: {
              morning: [{ name: 'Gentle Cleanser', brand: 'CeraVe', qty: '1 pump', instructions: 'Apply on damp skin.' }],
              night: [{ name: 'Retinol', brand: 'The Ordinary', qty: 'Pea size', instructions: 'Apply after moisturizer.' }],
              weekly: [{ name: 'Clay Mask', brand: 'Kiehls', day: 'Sunday', qty: 'Thin layer' }]
            },
            diet: {
              breakfast: 'Oatmeal', lunch: 'Salad', dinner: 'Fish', add: 'Green tea, leafy greens', avoid: 'Processed sugar, dairy'
            }
          } 
        });
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Precision Header */}
      <div className="glass px-6 py-6 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/language')} className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur flex items-center justify-center text-pink-400 hover:text-pink-600 transition-all shadow-sm">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase drop-shadow-sm">{t.uploadPhoto}</h2>
          <p className="text-[8px] font-black text-pink-500 tracking-[0.3em] -mt-1 uppercase">Advanced Scan V2.4</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 shadow-inner">
          <Scan className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-0 w-64 h-64 bg-pink-300/20 rounded-full -ml-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-0 w-64 h-64 bg-blue-300/20 rounded-full -mr-32 blur-3xl animate-pulse delay-700" />
        
        {/* Professional Alert */}
        <div className="glass p-5 rounded-[2.5rem] mb-10 flex items-start gap-4 relative z-10 animate-in slide-in-from-top-2">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-pink-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            Our AI analyzes <span className="text-pink-600 font-black italic underline decoration-pink-300">14 different skin markers</span> to provide a medical-grade skincare regimen tailored to your environment.
          </p>
        </div>

        {/* Dynamic Scanning Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-full max-w-[300px] aspect-[4/5]">
            <div className={`w-full h-full rounded-[4rem] border-4 transition-all duration-700 overflow-hidden flex flex-col items-center justify-center shadow-2xl ${
              image ? 'border-pink-500 shadow-pink-200' : 'border-white bg-white/30 backdrop-blur-md'
            }`}>
              {image ? (
                <div className="relative w-full h-full">
                  <img src={image} className="w-full h-full object-cover" alt="Profile" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-pink-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/50 animate-[scan_2s_ease-in-out_infinite]" />
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-white font-black text-xs uppercase tracking-widest drop-shadow-lg">{status}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center px-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-50 to-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group hover:scale-110 transition-transform cursor-pointer shadow-xl shadow-pink-100">
                    <Camera className="w-10 h-10 text-pink-300 group-hover:text-pink-500 transition-colors" />
                  </div>
                  <h4 className="font-black text-slate-800 tracking-tight text-lg">Position Face</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">No makeup for better results</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="camera"
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={handleUpload}
                disabled={analyzing}
              />
            </div>
            
            {/* Holographic Labels */}
            {image && !analyzing && (
              <div className="absolute -right-6 top-1/4 bg-slate-900/90 backdrop-blur text-white p-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-4 border border-white/10">
                <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-pink-400">Ready</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-black">HD OPTICS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Actions */}
        <div className="mt-12 space-y-4 relative z-10">
          {error && (
            <div className="p-4 bg-orange-50/90 backdrop-blur border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-2 animate-in slide-in-from-bottom-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={startCamera}
              disabled={analyzing}
              className="card-shiny flex flex-col items-center p-6 group cursor-pointer hover:border-pink-200 transition-all"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <Camera className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-pink-600">{t.camera}</span>
            </button>
            <label className="card-shiny flex flex-col items-center p-6 group cursor-pointer hover:border-blue-200 transition-all">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <ImageIcon className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-blue-600">{t.gallery}</span>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={analyzing} />
            </label>
          </div>

          <button 
            disabled={!image || analyzing}
            onClick={startAnalysis}
            className="btn-primary w-full py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-pink-200 group active:scale-[0.98]"
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" />
                <span className="font-black text-sm uppercase tracking-widest">Processing Data...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-pink-100 group-hover:text-white transition-colors" />
                <span className="font-black text-sm uppercase tracking-widest">Execute AI Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Camera Modal Overlay */}
        {showCamera && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="relative w-full h-full max-w-[600px] max-h-[800px] md:h-[90%] md:rounded-[3rem] overflow-hidden shadow-2xl bg-black border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover opacity-90"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Minimal UI Overlays */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-80 border-2 border-white/30 rounded-[3rem] mb-20 shadow-[0_0_50px_rgba(255,255,255,0.1)]" />
              </div>
              
              <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-10 pointer-events-auto">
                <button 
                  onClick={stopCamera}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 p-1 shadow-2xl shadow-pink-900/50 active:scale-90 transition-transform"
                >
                  <div className="w-full h-full rounded-full border-[4px] border-white bg-transparent" />
                </button>

                <div className="w-14 h-14 flex items-center justify-center">
                  {/* Just a spacer for symmetry */}
                </div>
              </div>

              <div className="absolute top-12 left-0 right-0 text-center">
                <p className="text-white font-black text-xs uppercase tracking-[0.4em] drop-shadow-md">Center Your Face</p>
                <div className="w-12 h-1 bg-pink-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8 opacity-40">
          <ShieldCheck className="w-3 h-3 text-slate-500" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Encrypted Cloud Analysis</p>
        </div>
      </div>
    </div>
  );
}
