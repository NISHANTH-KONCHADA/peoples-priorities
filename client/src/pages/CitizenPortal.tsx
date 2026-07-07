import { useState } from 'react';
import { Mic, CheckCircle, Send } from 'lucide-react';

const CATEGORIES = [
  'Education', 'Health', 'Roads & Infrastructure', 
  'Water & Sanitation', 'Employment & Skilling', 
  'Electricity', 'Public Safety', 'Other'
];

const CitizenPortal = () => {
  const [lang, setLang] = useState<'en' | 'hi' | 'ta' | 'te' | 'ml'>('en');
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [ward, setWard] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const texts = {
    en: { title: "Voice Your Priority", subtitle: "Help shape the development of your constituency.", placeholder: "Describe the issue or suggestion..." },
    hi: { title: "अपनी प्राथमिकता बताएं", subtitle: "अपने निर्वाचन क्षेत्र के विकास में मदद करें।", placeholder: "समस्या या सुझाव का वर्णन करें..." },
    ta: { title: "உங்கள் முன்னுரிமையை ஒலிக்கவும்", subtitle: "உங்கள் தொகுதியின் வளர்ச்சியை வடிவமைக்க உதவுங்கள்.", placeholder: "பிரச்சனை அல்லது ஆலோசனையை விவரிக்கவும்..." },
    te: { title: "మీ ప్రాధాన్యతను వినిపించండి", subtitle: "మీ నియోజకవర్గ అభివృద్ధికి సహాయపడండి.", placeholder: "సమస్య లేదా సూచనను వివరించండి..." },
    ml: { title: "നിങ്ങളുടെ മുൻഗണന അറിയിക്കുക", subtitle: "നിങ്ങളുടെ നിയോജകമണ്ഡലത്തിന്റെ വികസനത്തിന് സഹായിക്കുക.", placeholder: "പ്രശ്നമോ നിർദ്ദേശമോ വിവരിക്കുക..." }
  };

  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-IN';
      recognition.start();
      recognition.onresult = (event: any) => {
        setText(text + ' ' + event.results[0][0].transcript);
      };
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !category) return;
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://peoples-priorities-backend-ejsprvcwza-el.a.run.app';
      await fetch(`${apiUrl}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          text,
          language: lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : lang === 'te' ? 'Telugu' : 'Malayalam',
          wardNumber: ward ? parseInt(ward) : undefined
        })
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-sm w-full text-center transform transition-all duration-500 hover:scale-[1.02]">
          <div className="bg-green-500/10 p-3 rounded-full inline-block mb-4 border border-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Submitted Successfully!</h2>
          <p className="text-slate-600 mb-6 text-sm font-medium">Your voice has been recorded and will be analyzed by the planning committee.</p>
          <button onClick={() => setSubmitted(false)} className="glass-button w-full py-2.5 rounded-xl font-bold">Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto glass-panel rounded-3xl overflow-hidden">
        <div className="bg-slate-800/5 border-b border-white/40 px-6 py-6 relative backdrop-blur-md">
          <div className="absolute top-4 right-4 flex space-x-1.5 bg-white/40 p-1 rounded-lg backdrop-blur-sm border border-white/60">
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${lang==='en' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>EN</button>
            <button onClick={() => setLang('hi')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${lang==='hi' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>HI</button>
            <button onClick={() => setLang('ta')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${lang==='ta' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>TA</button>
            <button onClick={() => setLang('te')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${lang==='te' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>TE</button>
            <button onClick={() => setLang('ml')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${lang==='ml' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>ML</button>
          </div>
          <h1 className="text-2xl font-extrabold mb-1 text-slate-800 tracking-tight">{texts[lang].title}</h1>
          <p className="text-slate-600 text-sm font-medium">{texts[lang].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
            <select 
              className="w-full glass-input rounded-xl px-4 py-3 appearance-none text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Ward Number (Optional)</label>
            <select 
              className="w-full glass-input rounded-xl px-4 py-3 appearance-none text-sm"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            >
              <option value="">Select your ward...</option>
              {[1, 7, 12, 15, 22].map(w => <option key={w} value={w}>Ward {w}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Details</label>
            <div className="relative group">
              <textarea 
                className="w-full glass-input rounded-2xl px-4 py-3 pr-12 min-h-[100px] resize-none text-sm"
                placeholder={texts[lang].placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={handleSpeech}
                className="absolute bottom-3 right-3 bg-white/50 hover:bg-white/80 border border-slate-200 p-2 rounded-full text-indigo-600 transition-all duration-300 shadow-sm"
                title="Speak to type"
              >
                <Mic size={18} />
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full glass-button py-3 rounded-2xl flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <span className="animate-pulse">Processing...</span> : (
                <>
                  <Send size={18} />
                  <span>Submit Priority</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitizenPortal;
