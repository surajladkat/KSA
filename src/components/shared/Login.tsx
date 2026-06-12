/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldAlert, LogIn, Users, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ✅ FIX: .jpg ऐवजी .jpeg केले आहे (तुमच्या फाईल्सच्या नावानुसार)
import ClassPhoto1 from '../../assets/class-photo-1.jpeg';
import ClassPhoto2 from '../../assets/class-photo-2.jpeg';
import ClassPhoto3 from '../../assets/class-photo-3.jpeg';
import ClassPhoto4 from '../../assets/class-photo-4.jpeg';
import ClassPhoto5 from '../../assets/class-photo-5.jpeg';
const SLIDER_IMAGES = [
  {
    url: ClassPhoto1,
    title: 'Smart Digital Classrooms',
    desc: 'Experience interactive learning with 24/7 access to your coursework and study resources.'
  },
  {
    url: ClassPhoto2,
    title: 'Seamless Collaboration',
    desc: 'Foster better learning with direct interaction channels between our expert faculty and students.'
  },
  {
    url: ClassPhoto4,
    title: 'Board & CET Excellence',
    desc: 'Curated assignments and reference materials designed to help you conquer your exams.'
  },
  {
    url: ClassPhoto5,
    title: 'Transparent Parent Connect',
    desc: 'Bridging the gap with secure dialogue portals to keep parents updated on their child\'s success.'
  },
  {
    url: ClassPhoto3,
    title: 'Real-Time Performance Tracking',
    desc: 'Instantly monitor academic grades, daily attendance roll calls, and fee ledger updates.'
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
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden relative">
      
      {/* ⬅️ LEFT SIDE: Full-Page Photo Slider */}
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
            <img 
              src={SLIDER_IMAGES[imageIndex].url} 
              alt={SLIDER_IMAGES[imageIndex].title} 
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
            
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

      {/* ➡️ RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-12 xl:px-16 relative bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-10 h-screen overflow-y-auto">
        
        <div className="absolute inset-0 lg:hidden z-0 opacity-[0.03] pointer-events-none">
          <img src={SLIDER_IMAGES[imageIndex].url} className="w-full h-full object-cover" alt="mobile-bg" />
        </div>

        <div className="w-full max-w-md mx-auto space-y-8 z-10 py-10">
          
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