import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';
import { Globe, Check, ChevronRight } from 'lucide-react';

export default function LanguageSelection() {
  const { language, changeLanguage } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];

  const handleSelect = (lang) => {
    changeLanguage(lang);
    setTimeout(() => {
      navigate('/analysis');
    }, 300);
  };

  const languages = [
    { code: 'en', name: 'English', sub: 'Native Language' },
    { code: 'ml', name: 'മലയാളം', sub: 'Malayalam' }
  ];

  return (
    <div className="p-6 min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      
      <div className="mt-12 mb-12 animate-in slide-in-from-bottom-8">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-pink-100">
          <Globe className="w-8 h-8 text-pink-500" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Choose your <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Preferred Language</span>
        </h2>
        <p className="text-slate-500 mt-3 font-medium">Select a language to personalize your experience.</p>
      </div>
      
      <div className="space-y-4 animate-in slide-in-from-bottom-8 delay-100">
        {languages.map((lang) => (
          <button 
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`group w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left shadow-lg ${
              language === lang.code 
                ? 'border-pink-500 bg-white/80 backdrop-blur-md shadow-pink-200' 
                : 'border-white bg-white/40 hover:bg-white/60 hover:border-pink-200 backdrop-blur-sm'
            }`}
          >
            <div>
              <p className={`text-xl font-black ${language === lang.code ? 'text-slate-900' : 'text-slate-700'}`}>
                {lang.name}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-pink-400 transition-colors">
                {lang.sub}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              language === lang.code 
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-300' 
                : 'bg-white text-slate-300 group-hover:text-pink-400'
            }`}>
              {language === lang.code ? <Check className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto py-8">
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">
          Powered by SkinSmart AI
        </p>
      </div>
    </div>
  );
}