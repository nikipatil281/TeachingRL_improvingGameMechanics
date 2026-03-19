import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, ArrowRight, TrendingUp, Scale, BrainCircuit, Target, Sparkles, MapPin, Sun, Moon } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const AVATAR_OPTIONS = ['Leo', 'Aiden', 'Riley', 'Liam', 'Sadie', 'Jocelyn', 'Ryan', 'Liliana', 'Luis', 'Mason', 'Sarah', 'Avery', 'Vivian', 'Jack', 'Alexander'];

const LandingPage = ({ onComplete, theme, toggleTheme }) => {
  const [step, setStep] = useState(1);

  const stories = [
    {
      id: 1,
      title: "The Vision",
      content: "You've just inherited your dream coffee shop on 5th Avenue. The aroma of freshly roasted beans fills the air and the neighborhood is buzzing with excitement. But running a business is more than just brewing great coffee...",
      image: "/story_1.png",
      icon: <Coffee className="w-8 h-8 text-amber-500" />,
      color: "from-amber-500/20 to-orange-500/10"
    },
    {
      id: 2,
      title: "The intuition of Business",
      content: "Deciding the daily price of coffee is a balancing act. Set prices too high, and the competitor 'BeanMean' may steal your customers. Set them too low, and you'll pile up on costs!",
      image: "/aesthetic_cafe.png",
      icon: <Scale className="w-8 h-8 text-orange-400" />,
      color: "from-orange-500/20 to-amber-500/10"
    },
    {
      id: 3,
      title: "Factors to consider",
      content: "Managing inventory is crucial. Running out of beans means lost sales for the rest of the week, while overstocking leads to Sunday wastage penalties. You may consider factors like the weather, day of the week and BeanMean's pricing before setting your own price for the day.",
      image: "/story_2.png",
      icon: <TrendingUp className="w-8 h-8 text-amber-500" />,
      color: "from-amber-500/20 to-orange-500/10"
    },
    {
      id: 4,
      title: "The Judgement",
      content: "You have an Machine Learning (ML) Model trained on large amount of data which will assist you in suggesting prices. While powerful, remember that Machine Learning models aren't always perfect—use its suggestions as a guide, but trust your judgment when the market shifts unexpectedly.",
      image: "/story_3_rl.png",
      icon: <BrainCircuit className="w-8 h-8 text-purple-500" />,
      color: "from-purple-500/20 to-blue-500/10"
    },
    {
      id: 5,
      title: "Your Mission",
      content: <>Your journey begins with a 1-week orientation of deciding the daily price of coffee while understanding the fundamental concepts of Reinforcement Learning. Upon completion, you'll lead a high-stakes 4-week mission facing real-world dynamic pricing pressure. <br /><br />Are you ready?</>,
      isEnd: true,
      icon: <Target className="w-8 h-8 text-emerald-500" />,
      color: "from-emerald-500/20 to-teal-500/10",
      goals: [
        { icon: <BrainCircuit className="w-4 h-4" />, text: "Understand Reinforcement Learning concepts" },
        { icon: <TrendingUp className="w-4 h-4" />, text: "Goal: Maximise your Weekly Rewards" }
      ],
      missionImage: "/aesthetic_cafe_mission.png"
    }
  ];

  const [selectedAvatar, setSelectedAvatar] = useState('Leo');

  const avatarUriMap = useMemo(() => {
    const map = {};
    AVATAR_OPTIONS.forEach(seed => {
      map[seed] = createAvatar(adventurer, {
        seed,
        radius: 50,
        backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']
      }).toDataUri();
    });
    return map;
  }, []);

  const currentUri = avatarUriMap[selectedAvatar];

  const currentStory = stories[step - 1];

  const nextStep = () => {
    if (step < stories.length) {
      setStep(step + 1);
    } else {
      onComplete(selectedAvatar);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-start md:justify-center p-4 md:p-8 relative overflow-x-hidden overflow-y-auto transition-colors duration-500 ${theme}`}>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-3 bg-coffee-800/80 backdrop-blur-md border border-coffee-700/50 rounded-2xl text-amber-500 shadow-xl"
        >
          {theme === 'theme-black-coffee' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Doodle Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.07] mix-blend-screen' : 'bg-amber-900 opacity-[0.1] mix-blend-luminosity'}`} />

      {/* Background Decor */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-40 mix-blend-color-burn'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-900/40 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="z-10 w-full max-w-6xl bg-coffee-800/50 backdrop-blur-xl border border-coffee-700/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[calc(100vh-4rem)] md:max-h-[880px] mt-16 md:mt-0">

        {/* Image / Visual Side */}
        <div className={`w-full md:w-1/2 relative bg-gradient-to-br ${currentStory.color} flex items-center justify-center p-8 md:p-12 md:min-h-0`}>
          <AnimatePresence mode="wait">
            {!currentStory.isEnd ? (
              <motion.img
                key={currentStory.image}
                src={currentStory.image}
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.1, opacity: 0, rotate: 5 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-full h-full object-cover drop-shadow-2xl rounded-3xl"
              />
            ) : (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 w-full max-w-md"
              >
                <div className="grid gap-4">
                  {currentStory.goals.map((goal, i) => (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="bg-coffee-900/80 p-6 rounded-2xl border border-coffee-700 flex items-center gap-4 shadow-lg"
                    >
                      <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        {goal.icon}
                      </div>
                      <span className="font-bold text-lg">{goal.text}</span>
                    </motion.div>
                  ))}
                </div>

                {currentStory.missionImage && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    src={currentStory.missionImage}
                    className="w-full rounded-3xl border border-coffee-700 shadow-2xl"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-coffee-800/80 md:min-h-0 md:overflow-hidden">
          <div className="flex-1 min-h-0 md:overflow-y-auto md:pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex flex-col justify-center relative md:min-h-full"
              >
              {/* Story Avatar */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, delay: 0.3 }}
                  className="absolute top-0 right-0 w-24 h-24 p-1.5 bg-coffee-700/50 rounded-full border-2 border-amber-500/30 shadow-2xl backdrop-blur-sm z-20"
                >
                  <div className="w-full h-full rounded-full overflow-hidden border border-coffee-600 shadow-inner">
                    <img src={currentUri} alt="Story Character" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-coffee-950 p-1.5 rounded-full shadow-lg border-2 border-coffee-800">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                  </div>
                </motion.div>
                <div className="mb-8">{currentStory.icon}</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-coffee-100 to-coffee-400 bg-clip-text text-transparent leading-tight">
                  {currentStory.title}
                </h2>
                <p className={`text-lg md:text-xl lg:text-2xl leading-relaxed ${theme === 'theme-black-coffee' ? 'text-coffee-300' : 'text-coffee-100 font-bold'} font-medium`}>
                  {currentStory.content}
                </p>

                {/* Avatar Selection UI - Only for Story 1 */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-4 bg-coffee-900/40 rounded-3xl border border-coffee-700/50"
                  >
                    <div className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> This is you! Choose your avatar:
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                      {AVATAR_OPTIONS.map((seed) => (
                        <motion.button
                          key={seed}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedAvatar(seed)}
                          className={`shrink-0 w-14 h-14 rounded-full border-2 p-0.5 transition-all shadow-md ${selectedAvatar === seed ? 'border-amber-500 bg-amber-500/20 shadow-amber-500/20' : 'border-coffee-700 bg-coffee-800/50 hover:border-coffee-500'}`}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border border-coffee-700">
                            <img src={avatarUriMap[seed]} alt={seed} className="w-full h-full object-cover" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 shrink-0 border-t border-coffee-700/40 pt-6">
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${currentStory.isEnd
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                  : `bg-gradient-to-r from-amber-500 to-orange-600 ${theme === 'theme-black-coffee' ? 'text-coffee-950' : 'text-coffee-100'} shadow-amber-500/20`
                  }`}
              >
                {currentStory.isEnd ? "RULES OF SIMULATION" : "CONTINUE STORY"}
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {step > 1 && (
                <button
                  onClick={prevStep}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-coffee-700/50 ${theme === 'theme-black-coffee' ? 'text-coffee-400' : 'text-coffee-300'}`}
                >
                  <ArrowRight className="w-3 h-3 rotate-180" /> PREVIOUS
                </button>
              )}
            </div>
            <p className="text-center text-[10px] text-coffee-500 mt-4 uppercase font-bold tracking-widest">
              {step} of 5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
