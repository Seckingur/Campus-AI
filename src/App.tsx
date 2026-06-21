import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Bot, 
  Calendar, 
  CheckSquare, 
  Upload, 
  FileText, 
  Layers, 
  HelpCircle, 
  ArrowUpRight,
  Home,
  BarChart2,
  Flame,
  Target,
  Clock,
  Trophy,
  Send,
  BookOpen,
  ChevronRight,
  Bell,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
}

interface Exam {
  id: number;
  name: string;
  date: string;
  daysLeft?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{id: number, text: string, isBot: boolean}[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // PDF Upload State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Exams State
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  // Progress State
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const stored = localStorage.getItem('weeklyGoal');
    return stored ? parseInt(stored, 10) : 20;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(weeklyGoal);

  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(() => {
    const stored = localStorage.getItem('dailyStudy');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (data.date === today) return data.minutes;
      } catch (e) {}
    }
    return 0;
  });

  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState(() => {
    return parseInt(localStorage.getItem('weeklyStudyMinutes') || '0', 10);
  });

  const [totalStudyMinutes, setTotalStudyMinutes] = useState(() => {
    return parseInt(localStorage.getItem('totalStudyMinutes') || '0', 10);
  });

  const [streakDays, setStreakDays] = useState(() => {
    return parseInt(localStorage.getItem('streakDays') || '0', 10);
  });

  const [isAddingStudy, setIsAddingStudy] = useState(false);
  const [studyMinutesInput, setStudyMinutesInput] = useState(30);

  const handleAddStudy = () => {
    const mins = studyMinutesInput;
    if (mins <= 0) return;

    const newDaily = dailyStudyMinutes + mins;
    setDailyStudyMinutes(newDaily);
    localStorage.setItem('dailyStudy', JSON.stringify({ date: new Date().toISOString().split('T')[0], minutes: newDaily }));

    const newWeekly = weeklyStudyMinutes + mins;
    setWeeklyStudyMinutes(newWeekly);
    localStorage.setItem('weeklyStudyMinutes', newWeekly.toString());

    const newTotal = totalStudyMinutes + mins;
    setTotalStudyMinutes(newTotal);
    localStorage.setItem('totalStudyMinutes', newTotal.toString());

    if (dailyStudyMinutes === 0 && mins > 0) {
      const newStreak = streakDays + 1;
      setStreakDays(newStreak);
      localStorage.setItem('streakDays', newStreak.toString());
    }

    setIsAddingStudy(false);
    addToast(`${mins} dakika çalışma eklendi!`, 'success');
  };

  const saveGoal = () => {
    setWeeklyGoal(tempGoal);
    localStorage.setItem('weeklyGoal', tempGoal.toString());
    setIsEditingGoal(false);
    addToast('Haftalık hedef güncellendi!', 'success');
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}s ${m}d` : `${m}d`;
  };

  const [dailyLimit, setDailyLimit] = useState(() => {
    const stored = localStorage.getItem('dailyUsage');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            const today = new Date().toISOString().split('T')[0];
            if (data.date === today) return data.count;
            return 0;
        } catch(e) {}
    }
    return 0;
  });

  const incrementDailyLimit = () => {
    const newCount = dailyLimit + 1;
    setDailyLimit(newCount);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dailyUsage', JSON.stringify({ date: today, count: newCount }));
  };

  const addToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSubmit = textOverride || prompt;
    if (!textToSubmit.trim() || isLoading) return;
    
    if (dailyLimit >= 5) {
      addToast('Günlük 5 soru limitine ulaştınız. Sınırsız kullanım için Premium hesabına geçin.', 'warning');
      return;
    }

    setMessages(prev => [...prev, { id: Date.now(), text: textToSubmit, isBot: false }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          history: messages,
          pdfData: pdfData,
          fileName: uploadedFileName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { id: Date.now(), text: data.text, isBot: true }]);
        incrementDailyLimit();
      } else {
        addToast(data.error || 'Bir hata oluştu', 'warning');
      }
    } catch (err) {
       addToast('Sunucuya bağlanılamadı.', 'warning');
    } finally {
       setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    handleSendMessage(text);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPdfData(base64String);
        setUploadedFileName(file.name);
        addToast(`${file.name} başarıyla yüklendi!`, 'success');
        setActiveTab('chat');
        setMessages([{ id: Date.now(), text: `"${file.name}" yüklendi. Bu dosya hakkında ne öğrenmek istersin?`, isBot: true }]);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      addToast('Lütfen sadece PDF dosyası yükleyin.', 'warning');
    }
  };

  const handleAddExam = () => {
    if (!newExamName || !newExamDate) {
      addToast('Lütfen sınav adı ve tarihi girin.', 'warning');
      return;
    }
    
    // Calculate simple days left based on dummy logic or simple static number for now
    const today = new Date();
    const examDate = new Date(newExamDate);
    const diffTime = Math.abs(examDate.getTime() - today.getTime());
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if exam is in the future
    if (examDate < today) {
       addToast('Geçmişte bir tarih seçemezsiniz.', 'warning');
       return;
    }

    const newExam: Exam = {
      id: Date.now(),
      name: newExamName,
      date: newExamDate,
      daysLeft: daysLeft
    };
    
    setExams(prev => [...prev, newExam]);
    setNewExamName('');
    setNewExamDate('');
    setIsAddingExam(false);
    addToast('Sınav başarıyla eklendi!', 'success');
  };

  useEffect(() => {
    // Sınava yaklaşma kontrolleri gerçek verilerle yapılabilir...
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1017] text-white flex justify-center font-sans">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-[#0d1017] min-h-screen flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Study Time Modal Overview */}
        <AnimatePresence>
          {isAddingStudy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1c212b] border border-[#2d3545] rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl"
              >
                <h2 className="text-xl font-bold">Çalışma Süresi Ekle</h2>
                <p className="text-sm text-[#6e7686]">Bugün ne kadar çalıştınız?</p>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1"
                    value={studyMinutesInput} 
                    onChange={(e) => setStudyMinutesInput(Number(e.target.value))}
                    className="flex-1 bg-[#0d1017] border border-[#2d3545] rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-blue-500" 
                  />
                  <span className="text-lg font-semibold text-gray-400">Dakika</span>
                </div>
                
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => setIsAddingStudy(false)}
                    className="flex-1 py-3 font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleAddStudy}
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <div className="absolute top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl w-full max-w-[90%] sm:max-w-sm ${
                  toast.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-100' 
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-100'
                }`}
              >
                {toast.type === 'success' ? (
                  <Bell className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
                ) : (
                  <Bell className="w-5 h-5 flex-shrink-0 text-orange-400 mt-0.5" />
                )}
                <span className="text-sm font-medium leading-relaxed flex-1">{toast.message}</span>
                <button 
                  onClick={() => removeToast(toast.id)} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                   <X className="w-4 h-4 opacity-70" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Header Section */}
        <header className="px-6 pt-12 pb-4 z-10 bg-[#0d1017]">
          <div className="flex items-center gap-3">
             {/* Logo Mockup */}
             <div className="relative w-8 h-8 flex-shrink-0">
                <div className="absolute top-0 left-0 w-6 h-6 bg-pink-500 rounded-[4px] mix-blend-screen opacity-80 z-10" />
                <div className="absolute top-1 left-1 w-6 h-6 bg-green-400 rounded-[4px] mix-blend-screen opacity-80 z-20" />
                <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-[4px] mix-blend-screen opacity-90 z-30" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight leading-none text-white">Campus AI</h1>
               <p className="text-[#6e7686] text-xs font-medium mt-1">Öğrencinin yapay zeka asistanı</p>
             </div>
          </div>
        </header>

        {/* Separator */}
        <div className="px-6 z-10 bg-[#0d1017]">
           <div className="h-px w-full bg-[#242b3b]"></div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6 no-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                {/* Günlük Çalışma & Streak */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4 flex flex-col gap-2 relative">
                    <button 
                      onClick={() => setIsAddingStudy(true)}
                      className="absolute top-3 right-3 text-[#6e7686] hover:text-white transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#2d3545] flex items-center justify-center font-bold text-sm">+</div>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6e7686] font-semibold">Günlük Çalışma</p>
                      <p className="text-xl font-bold tracking-tight">{formatTime(dailyStudyMinutes)}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/10 to-[#1c212b] border border-orange-500/20 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-500/80 font-semibold">Streak</p>
                      <p className="text-xl font-bold tracking-tight text-orange-400">{streakDays} Gün</p>
                    </div>
                  </div>
                </div>

                {/* Hedef */}
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" /> 
                      Haftalık Hedef
                    </h2>
                    <span className="text-xs font-semibold text-purple-400">
                      {Math.min(100, Math.round((weeklyStudyMinutes / (weeklyGoal * 60)) * 100))}%
                    </span>
                  </div>
                  <div className="bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4">
                    {isEditingGoal ? (
                      <div className="flex items-center gap-2 mb-2 w-full">
                        <input 
                          type="number" 
                          value={tempGoal} 
                          onChange={(e) => setTempGoal(Number(e.target.value))} 
                          className="w-16 bg-[#0d1017] border border-[#2d3545] rounded p-1 text-white text-sm focus:outline-none focus:border-[#4d5a75]" 
                        />
                        <span className="text-gray-300 text-sm font-medium">Saat</span>
                        <div className="flex gap-2 ml-auto">
                          <button onClick={() => { setIsEditingGoal(false); setTempGoal(weeklyGoal); }} className="text-[#6e7686] text-xs font-semibold px-2 py-1">İptal</button>
                          <button onClick={saveGoal} className="text-white text-xs font-semibold px-2 py-1 bg-purple-500/30 rounded">Kaydet</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-gray-300">
                          {Math.floor(weeklyStudyMinutes / 60)} / {weeklyGoal} Saat
                        </span>
                        <div className="flex gap-3 items-center">
                          <button onClick={() => setIsEditingGoal(true)} className="text-[#6e7686] hover:text-white text-xs underline">Düzenle</button>
                          <span className="text-[#6e7686]">Pazar'a kadar</span>
                        </div>
                      </div>
                    )}
                    <div className="w-full bg-[#0d1017] rounded-full h-2.5 overflow-hidden border border-[#2d3545]">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round((weeklyStudyMinutes / (weeklyGoal * 60)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </section>

                {/* Yaklaşan Sınavlar */}
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" /> 
                      Yaklaşan Sınavlar
                    </h2>
                    <button onClick={() => setActiveTab('exams')} className="text-xs font-semibold flex items-center text-[#6e7686] hover:text-white transition-colors">Tümü <ChevronRight className="w-3 h-3 ml-0.5" /></button>
                  </div>
                  
                  {exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-[#1c212b] border border-[#2d3545] rounded-2xl gap-2 mt-2">
                      <Calendar className="w-8 h-8 text-gray-500 opacity-50 mb-1" />
                      <p className="text-sm text-gray-400">Yaklaşan sınavın yok.</p>
                      <button 
                        onClick={() => {
                          setActiveTab('exams');
                          setTimeout(() => setIsAddingExam(true), 100);
                        }}
                        className="text-xs text-blue-400 font-semibold mt-1"
                      >
                        + Sınav Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      {exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 2).map((exam, index) => (
                        <div key={exam.id} className={`bg-[#1c212b] border border-[#2d3545] rounded-xl p-3 flex justify-between items-center group ${index !== 0 ? 'opacity-70' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 text-blue-400 rounded-lg w-10 h-10 flex flex-col items-center justify-center font-bold">
                              <span className="text-[10px] uppercase leading-none mb-0.5">
                                {new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short' }).replace('.', '')}
                              </span>
                              <span className="text-sm leading-none">
                                {new Date(exam.date).getDate()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{exam.name}</p>
                              <p className="text-xs text-[#6e7686]">{exam.daysLeft === 0 ? "Bugün" : `${exam.daysLeft} gün kaldı`}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => addToast(`${exam.name} için hatırlatıcı kuruldu!`, 'success')}
                            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white rounded-md hover:bg-[#242b3b]"
                          >
                             <Bell className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </motion.div>
            )}

            {activeTab === 'pdf' && (
              <motion.div 
                key="pdf"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-8"
              >
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold tracking-tight">PDF Yükle</h2>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#1c212b] border-2 border-dashed border-[#2d3545] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-colors hover:border-[#4d5a75] hover:bg-[#202631] cursor-pointer overflow-hidden relative"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={handleFileUpload}
                    />
                    {uploadedFileName ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                           <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-green-400 truncate max-w-[200px]">{uploadedFileName}</p>
                          <p className="text-[#6e7686] text-xs font-medium mt-1">Başarıyla yüklendi</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#242b3b] border border-[#3d485e] flex items-center justify-center">
                           <Upload className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-200">Doküman yüklemek için dokun</p>
                          <p className="text-[#6e7686] text-xs font-medium mt-1">
                            Sınır 200MB • PDF
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold tracking-tight">PDF Araçları</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => {
                        if (!uploadedFileName) {
                           addToast('PDF yükledikten sonra kullanabileceksiniz.', 'warning');
                        } else {
                           handleQuickPrompt('Özet çıkarır mısın?');
                           setActiveTab('chat');
                        }
                      }}
                      className={`flex items-center gap-4 bg-[#161b22] border border-[#2d3545] rounded-xl p-4 transition-all group ${uploadedFileName ? 'hover:bg-[#1c212b] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="bg-red-500/10 p-2.5 rounded-lg group-hover:bg-red-500/20 transition-colors">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-sm font-semibold transition-colors ${uploadedFileName ? 'text-gray-200 group-hover:text-white' : 'text-gray-400'}`}>Özet Çıkar</p>
                        <p className="text-xs text-[#6e7686]">Uzun metinlerin kısa özetleri</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button 
                      onClick={() => {
                        if (!uploadedFileName) {
                           addToast('PDF yükledikten sonra kullanabileceksiniz.', 'warning');
                        } else {
                           handleQuickPrompt('Bu PDF için çoktan seçmeli test hazırlar mısın?');
                           setActiveTab('chat');
                        }
                      }}
                      className={`flex items-center gap-4 bg-[#161b22] border border-[#2d3545] rounded-xl p-4 transition-all group ${uploadedFileName ? 'hover:bg-[#1c212b] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                       <div className="bg-blue-500/10 p-2.5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <HelpCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-sm font-semibold transition-colors ${uploadedFileName ? 'text-gray-200 group-hover:text-white' : 'text-gray-400'}`}>Test Hazırla</p>
                        <p className="text-xs text-[#6e7686]">Çoktan seçmeli sorular üret</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>

                    <button 
                      onClick={() => {
                        if (!uploadedFileName) {
                           addToast('PDF yükledikten sonra kullanabileceksiniz.', 'warning');
                        } else {
                           handleQuickPrompt('Bu PDF için flashcard hazırlar mısın?');
                           setActiveTab('chat');
                        }
                      }}
                      className={`flex items-center gap-4 bg-[#161b22] border border-[#2d3545] rounded-xl p-4 transition-all group ${uploadedFileName ? 'hover:bg-[#1c212b] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                       <div className="bg-pink-500/10 p-2.5 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                        <Layers className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">Flashcard</p>
                        <p className="text-xs text-[#6e7686]">Ezber kartları oluştur</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full gap-4"
              >
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 no-scrollbar">
                  {messages.length === 0 ? (
                    <>
                      {/* Empty state / Suggestions */}
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                         </div>
                         <div className="bg-[#1c212b] border border-[#2d3545] rounded-2xl rounded-tl-sm p-3 max-w-[85%] text-sm text-gray-200">
                            Sana nasıl yardımcı olabilirim? Aşağıdaki hızlı komutları kullanabilirsin.
                         </div>
                      </div>
                      
                      {/* Quick Prompts */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button 
                          onClick={() => handleQuickPrompt('Bu konuyu anlat')}
                          className="bg-[#161b22] hover:bg-[#1c212b] border border-[#2d3545] rounded-full py-1.5 px-3 text-xs font-semibold text-blue-400 transition-colors"
                        >
                          "Bu konuyu anlat"
                        </button>
                        <button 
                          onClick={() => handleQuickPrompt('Sınav sorusu üret')}
                          className="bg-[#161b22] hover:bg-[#1c212b] border border-[#2d3545] rounded-full py-1.5 px-3 text-xs font-semibold text-pink-400 transition-colors"
                        >
                          "Sınav sorusu üret"
                        </button>
                        <button 
                          onClick={() => handleQuickPrompt('Kolaylaştır')}
                          className="bg-[#161b22] hover:bg-[#1c212b] border border-[#2d3545] rounded-full py-1.5 px-3 text-xs font-semibold text-green-400 transition-colors"
                        >
                          "Kolaylaştır"
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                          {msg.isBot ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shadow-lg shrink-0 mt-1">
                                <span className="text-white text-xs font-bold">Sen</span>
                            </div>
                          )}
                          <div className={`p-3 text-sm max-w-[85%] leading-relaxed ${
                            msg.isBot 
                              ? 'bg-[#1c212b] border border-[#2d3545] rounded-xl rounded-tl-sm text-gray-200' 
                              : 'bg-blue-600 border border-blue-500 rounded-xl rounded-tr-sm text-white'
                          }`}>
                            {msg.isBot ? (
                               <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                  <Markdown>{msg.text}</Markdown>
                               </div>
                            ) : (
                               msg.text
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="p-4 text-sm max-w-[85%] bg-[#1c212b] border border-[#2d3545] rounded-xl rounded-tl-sm text-gray-200 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Bir şeyler sor..."
                    className="w-full bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-[#5c6475] focus:outline-none focus:border-[#4d5a75] focus:ring-1 focus:ring-[#4d5a75] transition-all resize-none shadow-lg h-14 overflow-hidden"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2.5 top-2.5 w-9 h-9 bg-white hover:bg-gray-200 text-black rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'exams' && (
              <motion.div 
                key="exams"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Sınavlar</h2>
                  <button 
                    onClick={() => setIsAddingExam(true)}
                    className="bg-[#1c212b] border border-[#2d3545] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#242b3b] transition-colors"
                  >
                    <span className="text-lg leading-none mb-1">+</span>
                  </button>
                </div>

                <AnimatePresence>
                  {isAddingExam && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
                    >
                       <h3 className="text-sm font-bold text-gray-200">Yeni Sınav Ekle</h3>
                       <input 
                          type="text"
                          value={newExamName}
                          onChange={(e) => setNewExamName(e.target.value)}
                          placeholder="Sınav Adı (örn: Fizik Vize)"
                          className="bg-[#0d1017] border border-[#2d3545] rounded-xl px-3 py-2 text-sm text-white focus:border-[#4d5a75] focus:outline-none"
                       />
                       <input 
                          type="date"
                          value={newExamDate}
                          onChange={(e) => setNewExamDate(e.target.value)}
                          className="bg-[#0d1017] border border-[#2d3545] rounded-xl px-3 py-2 text-sm text-white focus:border-[#4d5a75] focus:outline-none placeholder-gray-500"
                          style={{ colorScheme: 'dark' }}
                       />
                       <div className="flex gap-2">
                         <button 
                           onClick={() => setIsAddingExam(false)}
                           className="flex-1 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                         >
                           İptal
                         </button>
                         <button 
                           onClick={handleAddExam}
                           className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl py-2 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
                         >
                           Ekle
                         </button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {exams.length === 0 && !isAddingExam ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-[#1c212b] border border-[#2d3545] rounded-2xl gap-3 opacity-80 mt-4">
                    <Calendar className="w-10 h-10 text-gray-500 opacity-50" />
                    <p className="text-sm text-gray-400 text-center">Henüz yaklaşan bir sınavınız yok.<br/>Üstteki + butonundan ekleyebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(exam => (
                      <div key={exam.id} className="bg-gradient-to-br from-blue-500/10 to-[#1c212b] border border-blue-500/20 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold">{exam.name}</h3>
                            <p className="text-sm text-[#6e7686] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> 
                              {new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-blue-400/80 font-bold uppercase tracking-wider">Kalan</span>
                            <span className="text-2xl font-black text-blue-400 leading-none mt-1">
                              {exam.daysLeft === 0 ? "Bugün" : `${exam.daysLeft} Gün`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="h-px w-full bg-blue-500/10"></div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              handleQuickPrompt(`${exam.name} için bana bir çalışma planı oluşturur musun?`);
                              setActiveTab('chat');
                            }}
                            className="flex-1 bg-[#161b22]/50 hover:bg-[#1c212b] border border-blue-500/20 rounded-xl py-3 px-4 flex items-center justify-center transition-colors group"
                          >
                            <span className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                Çalışma planı
                            </span>
                          </button>
                          <button 
                            onClick={() => addToast(`${exam.name} için hatırlatıcı kuruldu!`, 'success')}
                            className="bg-[#161b22]/50 hover:bg-[#1c212b] border border-blue-500/20 rounded-xl px-4 flex items-center justify-center transition-colors group"
                            title="Hatırlatıcı Ayarla"
                          >
                            <Bell className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/50">
                    <span className="text-xl font-black text-indigo-400">{Math.floor(totalStudyMinutes / 60) + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {Math.floor(totalStudyMinutes / 60) + 1 === 1 ? 'Yeni Öğrenci' : 'Çalışkan Öğrenci'}
                    </h3>
                     <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-indigo-300 font-semibold">{totalStudyMinutes % 60} / 60 XP</span>
                      <div className="w-24 bg-[#0d1017]/50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-400 to-purple-400 h-1.5 rounded-full" style={{ width: `${Math.round(((totalStudyMinutes % 60) / 60) * 100)}%` }}></div>
                      </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
                    <p className="text-2xl font-bold">{Math.floor(totalStudyMinutes / 60)}s</p>
                    <p className="text-xs text-[#6e7686] font-medium">Toplam Çalışma</p>
                  </div>
                  <div className="bg-[#1c212b] border border-[#2d3545] rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-[#6e7686] font-medium">Tamamlanan Test</p>
                  </div>
                </div>

                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-bold tracking-tight">Başarılar</h2>
                  <div className="flex flex-col gap-2">
                    <div className="bg-[#1c212b] border border-[#2d3545] rounded-xl p-3 flex items-center gap-4 opacity-50 grayscale">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">İlk Kan</p>
                        <p className="text-xs text-[#6e7686]">İlk sınavından A al.</p>
                      </div>
                    </div>
                    <div className="bg-[#1c212b] border border-[#2d3545] rounded-xl p-3 flex items-center gap-4 opacity-50 grayscale">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Ateşli Öğrenci</p>
                        <p className="text-xs text-[#6e7686]">7 gün üst üste çalış.</p>
                      </div>
                    </div>
                     <div className="bg-[#1c212b] border border-[#2d3545] rounded-xl p-3 flex items-center gap-4 opacity-50 grayscale">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Kitap Kurdu</p>
                        <p className="text-xs text-[#6e7686]">100 PDF özeti çıkar.</p>
                      </div>
                    </div>
                  </div>
                </section>

              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0d1017]/90 backdrop-blur-md border-t border-[#242b3b] p-2 pb-6 z-20">
          <nav className="flex justify-around items-center">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-[#6e7686] hover:text-gray-400'}`}
            >
              <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-blue-400 fill-blue-400/20' : ''}`} />
              <span className="text-[10px] font-semibold">Ana Sayfa</span>
            </button>
            <button 
              onClick={() => setActiveTab('pdf')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'pdf' ? 'text-white' : 'text-[#6e7686] hover:text-gray-400'}`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'pdf' ? 'text-red-400 fill-red-400/20' : ''}`} />
              <span className="text-[10px] font-semibold">PDF Oku</span>
            </button>
            
            {/* Center Floating Action Button style for Chat */}
            <button 
              onClick={() => setActiveTab('chat')}
              className="relative -top-5 flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${activeTab === 'chat' ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-105' : 'bg-[#1c212b] border border-[#2d3545]'}`}>
                <Bot className={`w-6 h-6 ${activeTab === 'chat' ? 'text-white' : 'text-gray-300'}`} />
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'exams' ? 'text-white' : 'text-[#6e7686] hover:text-gray-400'}`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'exams' ? 'text-pink-400 fill-pink-400/20' : ''}`} />
              <span className="text-[10px] font-semibold">Sınavlar</span>
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'progress' ? 'text-white' : 'text-[#6e7686] hover:text-gray-400'}`}
            >
              <BarChart2 className={`w-5 h-5 ${activeTab === 'progress' ? 'text-green-400 fill-green-400/20' : ''}`} />
              <span className="text-[10px] font-semibold">Gelişim</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

