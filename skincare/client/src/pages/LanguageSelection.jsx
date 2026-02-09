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
    <div className="p-6 min-h-screen bg-white flex flex-col">
      <div className="mt-12 mb-12">
        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-6">
          <Globe className="w-8 h-8 text-sky-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Choose your <br /> 
          <span className="text-sky-600">Preferred Language</span>
        </h2>
        <p className="text-slate-500 mt-3 font-medium">Select a language to personalize your experience.</p>
      </div>
      
      <div className="space-y-4">
        {languages.map((lang) => (
          <button 
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`group w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left ${
              language === lang.code 
                ? 'border-sky-600 bg-sky-50' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div>
              <p className={`text-xl font-bold ${language === lang.code ? 'text-sky-900' : 'text-slate-800'}`}>
                {lang.name}
              </p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                {lang.sub}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              language === lang.code ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-300'
            }`}>
              {language === lang.code ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto py-8">
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Powered by SkinSmart AI
        </p>
      </div>
    </div>
  );
}