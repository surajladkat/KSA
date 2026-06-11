/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldAlert, LogIn, Users, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 📸 तुमच्या 'assets' फोल्डरमधून इमेजेस ऍड करण्यासाठीच्या सूचना:
// 1. तुमचे फोटो src/assets/ फोल्डरमध्ये टाका.
// 2. खालीलप्रमाणे त्यांना इम्पोर्ट करा (कमेंट्स काढून टाका):
// import ClassPhoto1 from '../../assets/class-photo-1.jpg';
// import ClassPhoto2 from '../../assets/class-photo-2.jpg';
// import ClassPhoto3 from '../../assets/class-photo-3.jpg';

const SLIDER_IMAGES = [
  {
    // 3. इथे 'url' च्या पुढे सिंगल कोट्स ('') काढून थेट व्हेरिएबलचे नाव लिहा. उदा: url: ClassPhoto1,
    url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1600&q=80',
    title: 'Digital Classrooms',
    desc: 'Access your coursework and resources from anywhere.'
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    title: 'Collaborative Study',
    desc: 'Direct interaction channels between teachers and students.'
  },
  {
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    title: 'Real-time Progress',
    desc: 'Track grades, performance analytics, and fee ledgers instantly.'
  }
];

export default function Login() {
  const { login } = useSchool();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sliding window states
  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = Math.abs(page % SLIDER_IMAGES.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // Auto-play sliding mechanism
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 6000); // 6 सेकंदांनी फोटो बदलेल
    return () => clearInterval(timer);
  }, [page]);

  // Sliding animation configurations
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid username or password.');
      }
    } catch (error) {
      setErrorMsg('A system error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Master layout: Full height, split screen on desktop
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden relative">
      
      {/* ⬅️ LEFT SIDE: Full-Page Photo Slider (Hidden on Mobile, visible on Desktop) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-slate-900">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 150, damping: 22 }, opacity: { duration: 0.4 } }}
            className="absolute inset-0 w-full h-full"
          >
            {/* The Image */}
            <img 
              src={SLIDER_IMAGES[imageIndex].url} 
              alt={SLIDER_IMAGES[imageIndex].title} 
              className="w-full h-full object-cover opacity-85"
            />
            {/* Dark premium overlay gradient to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
            
            {/* Dynamic Text Captions over the photo */}
            <div className="absolute bottom-16 left-12 right-12 text-left text-white z-10 space-y-3">
              <span className="text-[11px] bg-blue-600/90 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono shadow-lg">
                {SLIDER_IMAGES[imageIndex].title}
              </span>
              <p className="text-base text-slate-200 leading-relaxed max-w-xl font-medium drop-shadow-md">
                {SLIDER_IMAGES[imageIndex].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Manual Controls inside the image */}
        <div className="absolute bottom-12 right-12 z-20 flex gap-3">
          <button 
            type="button" 
            onClick={() => paginate(-1)} 
            className="p-3 rounded-full bg-slate-900/60 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={() => paginate(1)} 
            className="p-3 rounded-full bg-slate-900/60 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ➡️ RIGHT SIDE: Login Form (Takes full width on Mobile, centered beautifully) */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-12 xl:px-16 relative bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-10 h-screen overflow-y-auto">
        
        {/* Mobile Background Fallback: Subtle background on small screens */}
        <div className="absolute inset-0 lg:hidden z-0 opacity-[0.03] pointer-events-none">
          <img src={SLIDER_IMAGES[imageIndex].url} className="w-full h-full object-cover" alt="mobile-bg" />
        </div>

        <div className="w-full max-w-md mx-auto space-y-8 z-10 py-10">
          
          {/* Brand Header */}
          <div className="text-left space-y-3">
            <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono border border-blue-100 inline-block">
              Private Academy Hub
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Login to access course materials, track student performance, and manage fee ledgers fluidly.
            </p>
          </div>

          {/* Quick Features Badges */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5 items-start">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 font-semibold">Private Folders</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5 items-start">
              <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 font-semibold">Parent Access</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-xs flex gap-2 items-start"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </motion.div>
          )}

          {/* The Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <div className="space-y-1.5 w-full">
              <label className="text-xs text-slate-600 font-bold font-sans uppercase tracking-wide">Authorized ID (Username)</label>
              <input 
                type="text"
                required
                placeholder="e.g. admin, teacher"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5 w-full">
              <label className="text-xs text-slate-600 font-bold font-sans uppercase tracking-wide">Password</label>
              <input 
                type="password"
                required
                placeholder="Enter secure password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 font-sans mt-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Verifying Credentials...' : 'Enter Academic Portal'}
            </motion.button>
          </form>

          {/* Default Credentials Info Box */}
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500 font-sans w-full">
            <p className="font-semibold text-slate-600">Initial Setup & Access:</p>
            <p className="leading-relaxed">Only the administrative office can issue new student and teacher accounts.</p>
            <div className="font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-600 select-all w-full flex flex-col gap-1 mt-1">
              <span>Username: <strong className="text-blue-700">admin</strong></span>
              <span>Password: <strong className="text-blue-700">admin123</strong></span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
