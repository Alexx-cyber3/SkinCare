import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';
import { 
  Sun, Moon, Calendar, Utensils, CheckCircle, Download, 
  Award, Bell, Settings, ChevronRight, Droplets, Leaf,
  History, Info, ExternalLink, Flame, AlertCircle, ShieldAlert,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import { skinService, progressService } from '../services/api';

export default function Dashboard() {
  const { language, logout, user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const t = translations[language];
  
  const [skinData, setSkinData] = useState(state || null);
  const [loading, setLoading] = useState(!state);
  const [activeTab, setActiveTab] = useState('routine');
  const [history, setHistory] = useState([]);
  const [todayProgress, setTodayProgress] = useState({ morningDone: false, nightDone: false, weeklyDone: false });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchData() {
      if (!skinData && user) {
        try {
          const data = await skinService.getCurrentPlan(user.id);
          if (data) setSkinData(data);
          else navigate('/analysis');
        } catch (err) {
          navigate('/analysis');
        } finally {
          setLoading(false);
        }
      }
      
      if (user) {
        try {
          const h = await progressService.getHistory(user.id);
          setHistory(h || []);
          const todayEntry = h.find(e => e.date === today);
          if (todayEntry) {
            setTodayProgress({
              morningDone: todayEntry.morningDone,
              nightDone: todayEntry.nightDone,
              weeklyDone: todayEntry.weeklyDone
            });
          }
        } catch (e) {}
      }
    }
    fetchData();
  }, [user, skinData, navigate, today]);

  const handleCompleteSession = async (type) => {
    if (todayProgress[type]) return;

    try {
      const updated = await progressService.updateProgress(user.id, today, type);
      setTodayProgress(prev => ({ ...prev, [type]: true }));
      
      // Refresh history
      const h = await progressService.getHistory(user.id);
      setHistory(h || []);
    } catch (e) {
      console.error("Failed to update progress", e);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Personalizing Your Regimen...</p>
    </div>
  );

  const skinType = skinData?.skinType || 'Combination';
  const routines = skinData?.routines;
  const diet = skinData?.diet;
  const problems = skinData?.problems;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text('SkinSmart Pro Analysis', 20, 30);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 40, 190, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Patient: ${user?.username}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text(`${skinType} Skin Profile`, 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Concerns: ${problems}`, 20, 72);
    let y = 85;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Daily Routine', 20, y);
    y += 10;
    doc.setFontSize(9);
    routines.morning.forEach(item => {
      doc.setTextColor(15, 23, 42);
      doc.text(`[MORNING] ${item.name}: ${item.brand}`, 25, y);
      doc.setTextColor(100);
      doc.text(`Qty: ${item.qty} | Wait: ${item.timeGap}`, 30, y + 5);
      y += 12;
    });
    y += 5;
    routines.night.forEach(item => {
      doc.setTextColor(15, 23, 42);
      doc.text(`[NIGHT] ${item.name}: ${item.brand}`, 25, y);
      doc.setTextColor(100);
      doc.text(`Qty: ${item.qty} | Wait: ${item.timeGap}`, 30, y + 5);
      y += 12;
    });
    if (y > 250) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Diet & Lifestyle', 20, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(70);
    doc.text(`Breakfast: ${diet.breakfast}`, 25, y);
    doc.text(`Lunch: ${diet.lunch}`, 25, y + 8);
    doc.text(`Dinner: ${diet.dinner}`, 25, y + 16);
    y += 30;
    doc.setTextColor(16, 185, 129);
    doc.text(`ADD: ${diet.add}`, 20, y);
    doc.setTextColor(239, 68, 68);
    doc.text(`AVOID: ${diet.avoid}`, 20, y + 8);
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Flame className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <span className="font-black text-slate-900 tracking-tighter text-xl">SkinSmart</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white px-6 pt-6 pb-16 rounded-b-[4rem] shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl">
            <Droplets className="w-10 h-10 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skin Type Identified</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{skinType}</h2>
            <div className="mt-3 flex items-start gap-2 bg-sky-50 p-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-sky-800 leading-tight">{problems}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-5 rounded-[2.5rem] border border-white">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Daily Streak</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{calculateStreak()}</span>
              <Flame className="w-5 h-5 text-orange-500 mb-1" />
            </div>
          </div>
          <button onClick={generatePDF} className="bg-sky-600 p-5 rounded-[2.5rem] shadow-xl shadow-sky-100 flex flex-col justify-between items-start active:scale-[0.97] transition-all">
            <Download className="w-6 h-6 text-white/50" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-slate-900 p-2 rounded-3xl shadow-2xl flex gap-1">
          {[
            { id: 'routine', label: 'Routine', icon: <Sun className="w-4 h-4" /> },
            { id: 'diet', label: 'Diet & Tips', icon: <Utensils className="w-4 h-4" /> },
            { id: 'progress', label: 'History', icon: <History className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                activeTab === tab.id ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-10 pb-28">
        {activeTab === 'routine' && (
          <RoutineSection 
            data={routines} 
            progress={todayProgress} 
            onComplete={handleCompleteSession} 
          />
        )}
        {activeTab === 'diet' && <DietSection data={diet} />}
        {activeTab === 'progress' && <HistorySection history={history} />}
      </div>
    </div>
  );
}

function RoutineSection({ data, progress, onComplete }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {[
        { title: 'Morning Routine', icon: <Sun className="text-orange-400" />, items: data.morning, id: 'morningDone' },
        { title: 'Night Routine', icon: <Moon className="text-sky-400" />, items: data.night, id: 'nightDone' },
        { title: 'Weekly Care', icon: <Calendar className="text-emerald-400" />, items: data.weekly, id: 'weeklyDone' }
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
                : 'bg-white text-slate-400 border border-slate-100 hover:border-sky-500 hover:text-sky-600'
              }`}
            >
              {progress[section.id] ? <><Check className="w-3 h-3" /> Completed</> : "Mark All Done"}
            </button>
          </div>
          
          <div className={`space-y-4 transition-all ${progress[section.id] ? 'opacity-50 grayscale' : ''}`}>
            {section.items.map((item, i) => (
              <div key={i} className="bg-white rounded-[2rem] border-2 border-slate-50 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-0.5">{item.brand}</p>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <div className="flex gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{item.qty}</span>
                    {item.timeGap && <span>• {item.timeGap} wait</span>}
                    {item.day && <span className="text-emerald-500">• {item.day}</span>}
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
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-sky-400" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Dermatological Diet</h3>
        </div>
        <div className="space-y-4">
          {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
            <div key={meal} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase text-sky-400 shrink-0 w-16">{meal}</span>
              <p className="text-xs font-bold text-slate-200">{data[meal.toLowerCase()]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
          <div>
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Add to Routine</h4>
            <p className="text-sm font-bold text-emerald-900">{data.add}</p>
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex items-start gap-4">
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
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 text-center">
        <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-900 mb-2">Completion History</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing your progress</p>
      </div>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center py-10 text-slate-300 font-bold">No activity logged yet.</p>
        ) : (
          [...history].sort((a,b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
            <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-50 flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-slate-800">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                <div className="flex gap-2 mt-1">
                  {h.morningDone && <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Morning</span>}
                  {h.nightDone && <span className="text-[8px] font-black bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded uppercase">Night</span>}
                  {h.weeklyDone && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase">Weekly</span>}
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