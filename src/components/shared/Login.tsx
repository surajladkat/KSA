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

// Form animation variants
const formContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const formItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
      scale: 1.05
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
    // OUTER VIEWPORT: Locked to h-screen and overflow-hidden to kill browser scrollbars
    <div className="flex h-screen w-full bg-slate-900 font-sans items-center justify-center p-4 lg:p-6 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Mobile Full-Screen Background */}
      <div className="absolute inset-0 lg:hidden z-0">
        <img 
          src={SLIDER_IMAGES[imageIndex].url} 
          className="w-full h-full object-cover opacity-40 transition-opacity duration-1000" 
          alt="mobile-bg" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40 backdrop-blur-[2px]" />
      </div>

      {/* MASTER FLOATING CARD: Scaled up to 96vw and 94vh to maximize screen space */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[96vw] max-w-[1536px] h-[94vh] max-h-[950px] flex flex-col lg:flex-row bg-transparent lg:bg-white rounded-3xl lg:rounded-[2.5rem] overflow-hidden lg:shadow-2xl relative z-10"
      >
        
        {/* ⬅️ LEFT SIDE: Desktop Photo Slider */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-slate-950">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.3 } }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={SLIDER_IMAGES[imageIndex].url} 
                alt={SLIDER_IMAGES[imageIndex].title} 
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />
              
              <div className="absolute bottom-16 left-12 right-12 text-left text-white z-10 space-y-4">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-xs bg-blue-600 text-white font-bold px-4 py-2 rounded-full uppercase tracking-wider font-mono shadow-lg"
                >
                  {SLIDER_IMAGES[imageIndex].title}
                </motion.span>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-xl text-slate-200 leading-relaxed max-w-2xl font-medium drop-shadow-md"
                >
                  {SLIDER_IMAGES[imageIndex].desc}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-12 right-12 z-20 flex gap-3">
            <button 
              type="button" onClick={() => paginate(-1)} 
              className="p-3 rounded-full bg-white/10 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/10 hover:border-blue-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              type="button" onClick={() => paginate(1)} 
              className="p-3 rounded-full bg-white/10 hover:bg-blue-600 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/10 hover:border-blue-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ➡️ RIGHT SIDE: Login Form Area */}
        {/* Added internal overflow-y-auto with hidden scrollbars just in case it's viewed on a short landscape screen */}
        <div className="w-full lg:w-[45%] xl:w-[40%] h-full flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <motion.div 
            variants={formContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-md bg-white/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none rounded-3xl lg:rounded-none shadow-2xl lg:shadow-none p-8 sm:p-10 lg:p-6 border border-white/20 lg:border-none space-y-8"
          >
            
            <motion.div variants={formItem} className="text-left space-y-3">
              <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono border border-blue-100 inline-block shadow-sm">
                Private Academy Hub
              </span>
              <h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
                Welcome Back
              </h2>
              <p className="text-sm xl:text-base text-slate-500 leading-relaxed font-medium">
                Securely login to access course materials, track student performance, and manage academy ledgers.
              </p>
            </motion.div>

            <motion.div variants={formItem} className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 lg:bg-slate-50/50 border border-slate-100 rounded-xl flex gap-2.5 items-center shadow-sm">
                <div className="bg-blue-100 p-1.5 rounded-lg"><ShieldCheck className="w-5 h-5 text-blue-700" /></div>
                <p className="text-xs xl:text-sm text-slate-700 font-bold">256-bit Encrypted</p>
              </div>
              <div className="p-3 bg-slate-50 lg:bg-slate-50/50 border border-slate-100 rounded-xl flex gap-2.5 items-center shadow-sm">
                <div className="bg-emerald-100 p-1.5 rounded-lg"><Users className="w-5 h-5 text-emerald-700" /></div>
                <p className="text-xs xl:text-sm text-slate-700 font-bold">Role-Based Access</p>
              </div>
            </motion.div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex gap-3 items-start shadow-sm overflow-hidden"
                >
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form variants={formItem} onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-xs text-slate-700 font-extrabold uppercase tracking-wide">Authorized ID</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="e.g. admin, teacher"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full text-base font-mono border border-slate-200 rounded-xl py-4 pl-12 pr-4 bg-slate-50 lg:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs text-slate-700 font-extrabold uppercase tracking-wide">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="password"
                    required
                    disabled={isLoading}
                    placeholder="Enter secure password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-base font-mono border border-slate-200 rounded-xl py-4 pl-12 pr-4 bg-slate-50 lg:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 disabled:opacity-50"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.01 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 mt-6 disabled:bg-blue-500 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Enter Academic Portal
                  </>
                )}
              </motion.button>
            </motion.form>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}