import React, { useState } from 'react';
import { Coffee, ArrowRight, BrainCircuit, Target, Trophy, Sun, Moon, MapPin, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ onJoin, theme, toggleTheme, userName }) => {
  const [roomCode, setRoomCode] = useState('');
  const [userNameInput, setUserNameInput] = useState(userName || '');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim().length < 4) {
      setError('Please enter a valid room code (at least 4 characters).');
      return;
    }
    setError('');
    onJoin('You', userNameInput);
  };

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center p-4 md:p-8 relative overflow-x-hidden overflow-y-auto transition-colors duration-500 ${theme}`}>

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-coffee-700 bg-coffee-800 hover:bg-coffee-700 transition-colors text-xs font-bold shadow-md"
        >
          {theme === 'theme-black-coffee' ? <><Sun className="w-4 h-4 text-amber-500" /> Latte</> : <><Moon className="w-4 h-4 text-blue-300" /> Black Coffee</>}
        </button>
      </div>

      {/* Doodle Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.07] mix-blend-screen' : 'bg-amber-900 opacity-[0.1] mix-blend-luminosity'}`} />

      {/* Background Decor */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-60 mix-blend-color-burn'}`}>
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-amber-900/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-orange-900/20 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-center justify-center flex-grow py-12 gap-8 md:gap-12">

        {/* Title Section */}
        <div className="text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-black flex flex-col items-center justify-center tracking-tighter"
          >
            <div className="flex items-center gap-3">
              <Coffee className="w-10 h-10 md:w-14 md:h-14 text-amber-500" />
              <span className="text-4xl md:text-6xl bg-gradient-to-b from-amber-400 to-orange-600 bg-clip-text text-transparent">
                ROAST & REWARD
              </span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-coffee-100/90 mt-1">COFFEE SHOP REINFORCEMENT LEARNING SIMULATION</span>
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full max-w-5xl items-stretch mx-auto">

          {/* Left Column: Join Session */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-coffee-800 p-6 md:p-8 rounded-[2rem] border-2 border-amber-600/30 w-full shadow-2xl relative overflow-hidden flex flex-col items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/5 to-transparent pointer-events-none" />

              <div className="w-16 h-16 md:w-20 md:h-20 bg-coffee-900 rounded-3xl flex items-center justify-center mb-4 md:mb-6 border border-coffee-700 shadow-inner">
                <Target className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black mb-1 md:mb-2 text-coffee-100">Join Session</h2>
              <p className="text-coffee-400 text-xs md:text-sm mb-6 md:mb-8 text-center leading-tight">Enter details to start simulation.</p>

              <form onSubmit={handleJoin} className="w-full space-y-3 relative z-10">
                <div className="relative">
                  <div className="w-full text-left ml-2 mb-1">
                    <label className="text-[10px] text-coffee-400 font-bold uppercase tracking-wider">Session Code</label>
                  </div>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="SESS-0000"
                    maxLength={10}
                    className="w-full bg-coffee-950 border-2 border-coffee-700 rounded-2xl py-3 px-6 text-center text-xl font-black tracking-widest text-coffee-100 focus:outline-none focus:border-amber-500 uppercase placeholder:text-coffee-900 transition-all shadow-inner mb-3"
                  />

                  <div className="w-full text-left ml-2 mb-1">
                    <label className="text-[10px] text-coffee-400 font-bold uppercase tracking-wider">Your Name</label>
                  </div>
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    placeholder="Enter Your Name"
                    maxLength={30}
                    className="w-full bg-coffee-950 border-2 border-coffee-700 rounded-2xl py-3 px-6 text-center text-lg font-bold tracking-wide text-coffee-100 focus:outline-none focus:border-amber-500 placeholder:text-coffee-900 transition-all shadow-inner mb-3"
                  />

                  {error && <p className="text-red-400 text-[10px] text-center mt-2 font-semibold absolute -bottom-6 left-0 right-0">{error}</p>}
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 ${theme === 'theme-black-coffee' ? 'text-coffee-950' : 'text-coffee-100'} font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 transition-all group`}
                  >
                    Enter the session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right Column: Visual Layout */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-coffee-800/40 p-3 rounded-3xl border border-coffee-700/50 backdrop-blur-md h-full flex flex-col overflow-hidden"
            >

              <div className="relative flex-grow rounded-2xl overflow-hidden border border-coffee-700/50 shadow-2xl aspect-[1/1] lg:aspect-auto bg-coffee-900 flex items-center justify-center">
                <img
                  src="/cafe_interior.png"
                  alt="Modern Cafe Interior"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-coffee-500 text-[10px] uppercase font-bold tracking-widest mt-4">
          RL Intelligence Pack v4.2 • Stable Release
        </div>
      </div>
    </div>
  );
};

export default Login;
