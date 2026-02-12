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
    <div className="p-6 flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl mb-6 flex items-center justify-center text-white shadow-2xl shadow-pink-200 ring-8 ring-pink-50/50 backdrop-blur-xl">
        <Sparkles className="w-12 h-12" />
      </div>
      
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">SkinSmart <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Pro</span></h1>
        <p className="text-slate-500 mt-2 font-medium">Advanced Dermatological Assistance</p>
      </div>
      
      <div className="w-full max-w-sm glass p-8 rounded-[2.5rem] relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
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
              className="input-field bg-white/50 border-white/50 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50/50 placeholder:text-slate-300"
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
              className="input-field bg-white/50 border-white/50 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50/50 placeholder:text-slate-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary w-full py-5 mt-2 flex items-center justify-center gap-3 shadow-xl shadow-pink-200/50 group bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 border-none"
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
            className="text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors"
          >
            {isLogin ? "New to SkinSmart? Join Now" : "Already a member? Secure Login"}
          </button>
          
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black opacity-60">
            <ShieldCheck className="w-3.5 h-3.5" />
            HIPAA Compliant Security
          </div>
        </div>
      </div>
    </div>
  );
}
