/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldAlert, LogIn, Users, ShieldCheck, ChevronLeft, ChevronRight, Loader2, User, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Images
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
    desc: 'Bridging the gap with secure dialogue portals to keep parents updated on your child\'s success.'
  },
  {
    url: ClassPhoto3,
    title: 'Real-Time Performance Tracking',
    desc: 'Instantly monitor academic grades, daily attendance roll calls, and fee ledger updates.'
  }
];

// Cascading Form Animations
const formContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const formItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
};

export default function Login() {
  const { login } = useSchool();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = Math.abs(page % SLIDER_IMAGES.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
  }, [page]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.02
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
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
        setIsLoading(false); 
      }
    } catch (error) {
      setErrorMsg('A system error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    // 🌍 MAIN CONTAINER: 100dvh specifically to handle mobile browsers properly without scrollbars
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row bg-slate-100 p-3 sm:p-4 lg:p-5 gap-3 lg:gap-4 overflow-hidden font-sans relative selection:bg-blue-500/30">

      {/* 📸 CONTAINER ONE: Curved Edge Image Slider (Top on Mobile, Left on Desktop) */}
      <div className="w-full h-[35%] sm:h-[40%] lg:h-full lg:w-[55%] xl:w-[58%] flex relative overflow-hidden bg-slate-950 rounded-[1.5rem] lg:rounded-[2.5rem] isolation-isolate z-20 shadow-xl lg:shadow-2xl shrink-0">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 180, damping: 24 }, opacity: { duration: 0.3 } }}
            className="absolute inset-0 w-full h-full rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden"
          >
            <img 
              src={SLIDER_IMAGES[imageIndex].url} 
              alt={SLIDER_IMAGES[imageIndex].title} 
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 lg:via-slate-900/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 lg:from-slate-950/30 to-transparent" />
            
            {/* Adjusted Mobile Text Positioning */}
            <div className="absolute bottom-4 left-5 right-20 lg:bottom-16 lg:left-16 lg:right-16 text-left text-white z-10 space-y-1.5 lg:space-y-4">
              <motion.span 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-[9px] lg:text-xs bg-blue-600 text-white font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-full uppercase tracking-wider font-mono shadow-lg inline-block"
              >
                {SLIDER_IMAGES[imageIndex].title}
              </motion.span>
              <motion.p 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-xs sm:text-sm lg:text-xl text-slate-200 leading-snug lg:leading-relaxed max-w-2xl font-medium drop-shadow-md line-clamp-2 lg:line-clamp-none"
              >
                {SLIDER_IMAGES[imageIndex].desc}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Adjusted Mobile Nav Buttons Positioning */}
        <div className="absolute bottom-4 right-4 lg:bottom-12 lg:right-12 z-30 flex gap-1.5 lg:gap-3">
          <button 
            type="button" onClick={() => paginate(-1)} 
            className="p-2 lg:p-3 rounded-full bg-white/10 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/10 hover:border-blue-500"
          >
            <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <button 
            type="button" onClick={() => paginate(1)} 
            className="p-2 lg:p-3 rounded-full bg-white/10 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/10 hover:border-blue-500"
          >
            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </div>

      {/* 🔐 CONTAINER TWO: Form Area (Bottom on Mobile, Right on Desktop) */}
      <div className="w-full flex-1 lg:h-full lg:w-[45%] xl:w-[42%] bg-white rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col justify-center items-center p-5 sm:p-8 lg:p-16 relative z-10 overflow-hidden shadow-2xl">
        
        <motion.div 
          variants={formContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-md space-y-4 lg:space-y-7"
        >
          
          <motion.div variants={formItem} className="text-left space-y-1.5 lg:space-y-3">
            <span className="text-[9px] lg:text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full uppercase tracking-wider font-mono border border-blue-100 inline-block shadow-sm">
              Private Academy Hub
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Welcome Back
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 leading-relaxed font-medium hidden sm:block">
              Securely login to access course materials, track student performance, and manage academy ledgers.
            </p>
          </motion.div>

          {/* Feature Badges - Scaled slightly for mobile */}
          <motion.div variants={formItem} className="grid grid-cols-2 gap-2 lg:gap-3 pt-1">
            <div className="p-2 lg:p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2 lg:gap-2.5 items-center shadow-sm">
              <div className="bg-blue-100 p-1 lg:p-1.5 rounded-lg"><ShieldCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-700" /></div>
              <p className="text-[10px] lg:text-xs text-slate-700 font-bold leading-tight">256-bit Encrypted</p>
            </div>
            <div className="p-2 lg:p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2 lg:gap-2.5 items-center shadow-sm">
              <div className="bg-emerald-100 p-1 lg:p-1.5 rounded-lg"><Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-700" /></div>
              <p className="text-[10px] lg:text-xs text-slate-700 font-bold leading-tight">Role-Based Access</p>
            </div>
          </motion.div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 lg:p-3.5 text-red-700 text-xs lg:text-sm flex gap-2.5 items-center shadow-sm overflow-hidden"
              >
                <ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 text-red-600" />
                <p className="font-semibold leading-none">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Fields */}
          <motion.form variants={formItem} onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-5">
            <div className="space-y-1.5 lg:space-y-2">
              <label className="text-[10px] lg:text-xs text-slate-700 font-extrabold uppercase tracking-wide">Authorized ID</label>
              <div className="relative group">
                <User className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="e.g. admin, teacher"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs lg:text-sm font-mono border border-slate-200 rounded-xl py-3 lg:py-3.5 pl-10 lg:pl-11 pr-4 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5 lg:space-y-2">
              <label className="text-[10px] lg:text-xs text-slate-700 font-extrabold uppercase tracking-wide">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Enter secure password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs lg:text-sm font-mono border border-slate-200 rounded-xl py-3 lg:py-3.5 pl-10 lg:pl-11 pr-4 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.01 } : {}}
              whileTap={!isLoading ? { scale: 0.99 } : {}}
              className="w-full py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 mt-1 lg:mt-2 disabled:bg-blue-500 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 lg:w-5 lg:h-5" />
                  Enter Academic Portal
                </>
              )}
            </motion.button>
          </motion.form>

        </motion.div>
      </div>
    </div>
  );
}