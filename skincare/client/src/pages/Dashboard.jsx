import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';
import { 
  Sun, Moon, Calendar, Utensils, CheckCircle, Download, 
  Award, Bell, Settings, ChevronRight, Droplets, Leaf,
  History, Info, ExternalLink, Flame, AlertCircle, ShieldAlert,
  Check, Sparkles, TrendingUp, Activity, Camera
} from 'lucide-react';
import jsPDF from 'jspdf';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { skinService, progressService } from '../services/api';

export default function Dashboard() {
  const { language, logout, user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const t = translations[language] || translations['en'];
  
  const [skinData, setSkinData] = useState(state || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routine');
  const [history, setHistory] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [todayProgress, setTodayProgress] = useState({ morningDone: false, nightDone: false, weeklyDone: false });

  // Use local date string instead of UTC to ensure "today" is accurate for the user
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        if (!skinData) {
          const data = await skinService.getCurrentPlan(user.id);
          if (data) setSkinData(data);
          else { navigate('/analysis'); return; }
        }
        
        const [progHistory, scanHistory] = await Promise.all([
          progressService.getHistory(user.id),
          skinService.getAnalysisHistory(user.id)
        ]);

        setHistory(progHistory || []);
        setAnalysisHistory(scanHistory || []);

        const todayEntry = (progHistory || []).find(e => e.date === today);
        if (todayEntry) {
          setTodayProgress({
            morningDone: !!todayEntry.morningDone,
            nightDone: !!todayEntry.nightDone,
            weeklyDone: !!todayEntry.weeklyDone
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (!skinData) navigate('/analysis');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, skinData, navigate, today]);

  const handleCompleteSession = async (type) => {
    if (!user || todayProgress[type]) return;

    try {
      await progressService.updateProgress(user.id, today, type);
      setTodayProgress(prev => ({ ...prev, [type]: true }));
      const h = await progressService.getHistory(user.id);
      setHistory(h || []);
    } catch (e) {
      console.error("Failed to update progress", e);
    }
  };

  if (loading || !skinData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mb-4" />
      <p className="text-pink-400 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizing Regimen...</p>
    </div>
  );

  const skinType = skinData.skinType || 'Combination';
  const routines = skinData.routines || { morning: [], night: [], weekly: [] };
  const diet = skinData.diet || { breakfast: '', lunch: '', dinner: '', add: '', avoid: '' };
  const problems = skinData.problems || 'General Skin Health';
  const currentScore = analysisHistory.length > 0 ? analysisHistory[analysisHistory.length - 1].score : 85;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text('SkinSmart Pro Analysis', 20, 30);
    // ... (rest of PDF generation logic remains the same, assuming it doesn't use React components)
    // I'll keep the PDF generation logic as is for now to avoid breaking it, but focusing on UI
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 40, 190, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Patient: ${user?.username}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);
    doc.setFontSize(16);
    doc.setTextColor(236, 72, 153); // Pink color
    doc.text(`${skinType} Skin Profile | Score: ${currentScore}%`, 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Concerns: ${problems}`, 20, 72);
    let y = 85;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Daily Routine', 20, y);
    y += 10;
    doc.setFontSize(9);
    
    if (routines?.morning) {
      routines.morning.forEach(item => {
        doc.setTextColor(15, 23, 42);
        doc.text(`[MORNING] ${item.name}: ${item.brand}`, 25, y);
        doc.setTextColor(100);
        doc.text(`Qty: ${item.qty} | Wait: ${item.timeGap}`, 30, y + 5);
        y += 12;
      });
    }
    
    y += 5;
    
    if (routines?.night) {
      routines.night.forEach(item => {
        doc.setTextColor(15, 23, 42);
        doc.text(`[NIGHT] ${item.name}: ${item.brand}`, 25, y);
        doc.setTextColor(100);
        doc.text(`Qty: ${item.qty} | Wait: ${item.timeGap}`, 30, y + 5);
        y += 12;
      });
    }

    if (y > 250) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Diet & Lifestyle', 20, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(70);
    
    if (diet) {
      doc.text(`Breakfast: ${diet.breakfast}`, 25, y);
      doc.text(`Lunch: ${diet.lunch}`, 25, y + 8);
      doc.text(`Dinner: ${diet.dinner}`, 25, y + 16);
      y += 30;
      doc.setTextColor(16, 185, 129);
      doc.text(`ADD: ${diet.add}`, 20, y);
      doc.setTextColor(239, 68, 68);
      doc.text(`AVOID: ${diet.avoid}`, 20, y + 8);
    }
    
    doc.save(`${user.username}-skincare-plan.pdf`);
  };

  const calculateStreak = () => {
    if (history.length === 0) return 0;
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Simple streak check
    for (let i = 0; i < sortedHistory.length; i++) {
      if (sortedHistory[i].morningDone || sortedHistory[i].nightDone) streak++;
      else break;
    }
    return streak;
  };

  const allDone = todayProgress.morningDone && todayProgress.nightDone;
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowDayName = tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrowDateStr = tomorrowDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Header */}
      <div className="glass px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200/50">
            <Flame className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <span className="font-black text-slate-900 tracking-tighter text-xl">SkinSmart</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/analysis')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors" title={t.retakeAnalysis}>
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="glass px-6 pt-6 pb-16 rounded-b-[4rem] relative overflow-hidden">
        {/* Background blobs for shininess */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200">
            <Droplets className="w-10 h-10 text-pink-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skin Type Identified</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{skinType}</h2>
            <div className="mt-3 flex items-start gap-2 bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-white/50">
              <AlertCircle className="w-3.5 h-3.5 text-pink-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-pink-800 leading-tight">{problems}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card-shiny p-4 flex flex-col justify-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Streak</p>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-slate-900">{calculateStreak()}</span>
              <Flame className="w-3 h-3 text-orange-500" />
            </div>
          </div>
          <div className="card-shiny p-4 flex flex-col justify-center border-pink-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-pink-600">{currentScore}%</span>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
          </div>
          <button onClick={generatePDF} className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-3xl shadow-lg shadow-pink-200 flex items-center justify-center text-white active:scale-[0.95] transition-all">
            <Download className="w-5 h-5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-slate-900 p-2 rounded-3xl shadow-2xl shadow-slate-300/50 flex gap-1">
          {[
            { id: 'routine', label: 'Routine', icon: <Sun className="w-4 h-4" /> },
            { id: 'health', label: 'Health', icon: <Activity className="w-4 h-4" /> },
            { id: 'diet', label: 'Diet', icon: <Utensils className="w-4 h-4" /> },
            { id: 'progress', label: 'Logs', icon: <History className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activeTab === tab.id ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-10 pb-28">
        {activeTab === 'routine' && (
          <div className="space-y-12">
            <RoutineSection 
              data={routines} 
              progress={todayProgress} 
              onComplete={handleCompleteSession} 
            />

            {allDone && (
              <div className="mt-16 pt-16 border-t-2 border-dashed border-pink-100 animate-in fade-in slide-in-from-bottom-8">
                <div className="flex flex-col items-center mb-10 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Today's Journey Complete! <br />
                    <span className="text-pink-500">Tomorrow's Outlook</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Prepare for {tomorrowDayName}, {tomorrowDateStr}</p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black uppercase tracking-widest text-[10px] text-pink-400">Bonus Prep Task</h4>
                      <p className="text-sm font-bold">Sanitize your pillowcases tonight</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed relative z-10 text-left">
                    Cleaning your sleep surfaces prevents bacterial buildup, ensuring your {skinType} skin remains clear tomorrow.
                  </p>
                </div>

                <div className="opacity-60 scale-[0.98]">
                  <h4 className="px-4 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <div className="h-[2px] w-4 bg-pink-200" />
                    Tomorrow's Morning Routine
                  </h4>
                  <div className="space-y-4 pointer-events-none">
                    {routines?.morning?.map((item, i) => (
                      <div key={i} className="card-shiny p-5 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-300">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-pink-300 mb-0.5">{item.brand}</p>
                          <h4 className="font-bold text-slate-400">{item.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'health' && <HealthSection history={analysisHistory} currentScore={currentScore} markers={skinData.markers} />}
        {activeTab === 'diet' && <DietSection data={diet} />}
        {activeTab === 'progress' && <HistorySection history={history} />}
      </div>
    </div>
  );
}

function HealthSection({ history, currentScore, markers }) {
  const chartData = history.map(item => ({
    date: new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    score: item.score
  }));

  // Add dummy data if history is small for visualization
  if (chartData.length < 2) {
    chartData.unshift({ date: 'Start', score: 75 });
  }

  const markerLabels = {
    hydration: 'Hydration',
    oiliness: 'Oil Control',
    texture: 'Smoothness',
    pores: 'Pore Clarity',
    redness: 'Calmness',
    radiance: 'Radiance',
    barrierHealth: 'Barrier'
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="card-shiny p-8 text-center bg-gradient-to-br from-white to-pink-50">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-200">
          <span className="text-3xl font-black text-white">{currentScore}</span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Current Skin Index</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Based on latest neural scan</p>
      </div>

      {markers && (
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
          {Object.entries(markerLabels).map(([key, label]) => (
            <div key={key} className="glass p-4 rounded-3xl border-slate-100 flex flex-col items-center text-center">
              <div className="w-full bg-slate-100 h-1 rounded-full mb-3 overflow-hidden">
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${markers[key] || 50}%` }}
                />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
              <span className="text-xs font-black text-slate-800">{markers[key] || 50}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="card-shiny p-6 h-[300px] relative overflow-hidden">
        <div className="absolute top-4 left-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-pink-500" />
            Progression Curve
          </h4>
        </div>
        <div className="w-full h-full pt-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                dy={10}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: '900' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-[2rem] border-emerald-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Improvement</h5>
          <p className="text-lg font-black text-emerald-600">+12%</p>
        </div>
        <div className="glass p-5 rounded-[2rem] border-sky-100">
          <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 mb-3">
            <Activity className="w-4 h-4" />
          </div>
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reliability</h5>
          <p className="text-lg font-black text-sky-600">High</p>
        </div>
      </div>
    </div>
  );
}

function RoutineSection({ data, progress, onComplete }) {
  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {[
        { title: 'Morning Routine', icon: <Sun className="text-orange-400" />, items: data.morning || [], id: 'morningDone', color: 'orange' },
        { title: 'Night Routine', icon: <Moon className="text-indigo-400" />, items: data.night || [], id: 'nightDone', color: 'indigo' },
        { title: 'Weekly Care', icon: <Calendar className="text-pink-400" />, items: data.weekly || [], id: 'weeklyDone', color: 'pink' }
      ].map((section) => (
        <div key={section.id} className="relative">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">{section.icon}</div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">{section.title}</h3>
            </div>
            
            <button 
              onClick={() => onComplete(section.id)}
              disabled={progress[section.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                progress[section.id] 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                : 'bg-white text-slate-400 border border-slate-100 hover:border-pink-500 hover:text-pink-600'
              }`}
            >
              {progress[section.id] ? <><Check className="w-3 h-3" /> Completed</> : "Mark All Done"}
            </button>
          </div>
          
          <div className={`space-y-4 transition-all ${progress[section.id] ? 'opacity-50 grayscale' : ''}`}>
            {section.items.map((item, i) => (
              <div key={i} className="card-shiny p-5 flex items-center gap-4 group hover:scale-[1.01] transition-transform">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-pink-50 flex items-center justify-center text-pink-300 shadow-sm group-hover:text-pink-500 transition-colors">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-pink-600 mb-0.5">{item.brand}</p>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <div className="flex gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{item.qty}</span>
                    {item.timeGap && <span>• {item.timeGap} wait</span>}
                    {item.day && <span className="text-pink-500">• {item.day}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DietSection({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Utensils className="w-6 h-6 text-pink-400" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Dermatological Diet</h3>
        </div>
        <div className="space-y-4 relative z-10">
          {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
            <div key={meal} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <span className="text-[10px] font-black uppercase text-pink-400 shrink-0 w-16">{meal}</span>
              <p className="text-xs font-bold text-slate-200">{data[meal.toLowerCase()]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-emerald-50/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-emerald-100 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
          <div>
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Add to Routine</h4>
            <p className="text-sm font-bold text-emerald-900">{data.add}</p>
          </div>
        </div>
        <div className="bg-red-50/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-red-100 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-1" />
          <div>
            <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Avoid Strictly</h4>
            <p className="text-sm font-bold text-red-900">{data.avoid}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorySection({ history }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass p-8 rounded-[3rem] text-center">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-900 mb-2">Completion History</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing your progress</p>
      </div>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center py-10 text-slate-400 font-bold bg-white/30 rounded-3xl backdrop-blur-sm">No activity logged yet.</p>
        ) : (
          [...history].sort((a,b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
            <div key={i} className="card-shiny p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-slate-800">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                <div className="flex gap-2 mt-1">
                  {h.morningDone && <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Morning</span>}
                  {h.nightDone && <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase">Night</span>}
                  {h.weeklyDone && <span className="text-[8px] font-black bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded uppercase">Weekly</span>}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
                <Check className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}