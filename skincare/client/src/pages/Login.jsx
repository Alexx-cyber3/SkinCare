import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const data = await authService.login(username, password);
        login({ username: data.username, id: data.userId, token: data.token });
      } else {
        await authService.signup(username, password);
        const data = await authService.login(username, password);
        login({ username: data.username, id: data.userId, token: data.token });
      }
      navigate('/language');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-sky-50 animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-sky-600 rounded-3xl mb-6 flex items-center justify-center text-white shadow-xl shadow-sky-200 ring-8 ring-sky-50">
        <Sparkles className="w-10 h-10" />
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">SkinSmart <span className="text-sky-500">Pro</span></h1>
        <p className="text-slate-500 mt-2 font-medium">Advanced Dermatological Assistance</p>
      </div>
      
      <div className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-sky-100/50 border border-white relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input
              type="text"
              placeholder="e.g. alex_skin"
              className="input-field bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-sky-50/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-sky-50/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary w-full py-5 mt-2 flex items-center justify-center gap-3 shadow-xl shadow-sky-200/50 group"
          >
            {isLogin ? (
              <><LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> <span className="tracking-tight">Sign In to Dashboard</span></>
            ) : (
              <><UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> <span className="tracking-tight">Create Expert Account</span></>
            )}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-6">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            {isLogin ? "New to SkinSmart? Join Now" : "Already a member? Secure Login"}
          </button>
          
          <div className="flex items-center gap-2 text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            HIPAA Compliant Security
          </div>
        </div>
      </div>
    </div>
  );
}
