import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ChevronRight, Target, Info, Cpu, TrendingUp, Zap, Server, Shield, Check, X, CloudSun, Star, Store } from 'lucide-react';

const PrePhase2Transition = ({ onComplete, theme }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [enabledVariables, setEnabledVariables] = useState({
        weather: true,
        event: true,
        competitor: true
    });
    const controls = useAnimation();
    const [containerWidth, setContainerWidth] = useState(0);
    const sliderRef = React.useRef(null);

    useEffect(() => {
        const updateWidth = () => {
            if (sliderRef.current) {
                setContainerWidth(sliderRef.current.parentElement.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const SLIDER_WIDTH = containerWidth > 0 ? Math.min(360, containerWidth - 32) : 360;
    const HANDLE_WIDTH = 56;
    const MAX_SLIDE = SLIDER_WIDTH - HANDLE_WIDTH - 8;

    const handleDragUpdate = (event, info) => {
        // Optional drag behavior styling
    };

    const handleDragEnd = async (event, info) => {
        if (info.offset.x > MAX_SLIDE * 0.7) {
            setIsUnlocked(true);
            await controls.start({ x: MAX_SLIDE });
            setTimeout(() => {
                onComplete(enabledVariables);
            }, 400);
        } else {
            controls.start({ x: 0 });
        }
    };

    const rules = [
        {
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
            title: "AI in the Background",
            icon: <Cpu className="w-5 h-5" />,
            text: "You will be getting help from the Machine Learning (ML) model. This will act as your assistant. But beware! The ML purely predicts based on past patterns and might not always give the most optimal price."
        },
        {
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
            title: "RL in the Background",
            icon: <Server className="w-5 h-5" />,
            text: "A Reinforcement Learning (RL) algorithm will execute quietly in the background - experiencing the exact same things you do."
        },
        {
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/20",
            title: "The Ultimate Goal",
            icon: <Zap className="w-5 h-5" />,
            text: "The main goal of this 28-day simulation is to truly understand how an RL agent dynamically balances Exploring new options and Exploiting known strategies."
        }
    ];

    return (
        <div className={`min-h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-center p-2 md:p-8 relative overflow-y-auto transition-colors duration-500 ${theme}`}>

            {/* Background Decor */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-40 mix-blend-color-burn'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/40 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-[95vw] lg:max-w-5xl p-2 md:p-8"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30"
                    >
                        <Target className="w-8 h-8 text-blue-500" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-blue-300 to-indigo-400 bg-clip-text text-transparent">
                        Objectives of Phase 2 (Main Simulation)
                    </h1>
                    <p className="text-lg md:text-xl text-coffee-300 font-medium max-w-2xl mx-auto">
                        Welcome to the 28-day challenge. It's time to refine your pricing strategies alongside Artificial Intelligence!
                    </p>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 mb-10">
                    <div className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 flex-1">
                        <h2 className="text-xl font-bold mb-6 text-coffee-100 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-400" />
                            Notes for Phase 2: Main Simulation
                        </h2>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-8">
                            {rules.map((rule, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    className="flex items-start gap-4 transition-all duration-300"
                                >
                                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-lg ${rule.bg} ${rule.color} border ${rule.border} shadow-lg`}>
                                        {rule.icon ? rule.icon : (idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="pt-0.5">
                                        <h3 className="font-black text-coffee-100 mb-1.5 flex items-center gap-2">
                                            {rule.title}
                                        </h3>
                                        <p className="text-sm text-coffee-400 font-medium leading-relaxed">{rule.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Variable Selection Box */}
                    <div className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 xl:w-[350px] shrink-0 flex flex-col">
                        <h2 className="text-xl font-bold mb-3 text-coffee-100 flex items-center gap-2">
                            <Info className="w-5 h-5 text-amber-500" />
                            Variable Selection
                        </h2>
                        <p className="text-sm text-coffee-400 font-medium leading-relaxed mb-6">
                            To help you focus, you can optionally disable one of the complex market variables below. If disabled, they will be locked to a neutral <span className="font-bold text-coffee-200">constant.</span><br /><br />
                            <span className="font-bold text-coffee-200">The AI agents will face the exact same conditions you choose.</span> Inventory and Day of Week cannot be disabled.
                        </p>

                        <div className="flex flex-col gap-4 mt-auto">
                            {/* Weather Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-coffee-800 bg-coffee-900/50 transition-colors hover:bg-coffee-900">
                                <div className="flex items-center gap-3">
                                    <CloudSun className={`w-5 h-5 ${enabledVariables.weather ? 'text-blue-400' : 'text-coffee-600'}`} />
                                    <span className={`font-bold ${enabledVariables.weather ? 'text-coffee-100' : 'text-coffee-500'}`}>Weather</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (enabledVariables.weather) {
                                            const falseCount = Object.values(enabledVariables).filter(v => !v).length;
                                            if (falseCount >= 1) {
                                                alert("You must keep at least two market variables enabled.");
                                                return;
                                            }
                                        }
                                        setEnabledVariables(prev => ({ ...prev, weather: !prev.weather }))
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledVariables.weather ? 'bg-emerald-500' : 'bg-coffee-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledVariables.weather ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Local Event Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-coffee-800 bg-coffee-900/50 transition-colors hover:bg-coffee-900">
                                <div className="flex items-center gap-3">
                                    <Star className={`w-5 h-5 ${enabledVariables.event ? 'text-yellow-400' : 'text-coffee-600'}`} />
                                    <span className={`font-bold ${enabledVariables.event ? 'text-coffee-100' : 'text-coffee-500'}`}>Local Events</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (enabledVariables.event) {
                                            const falseCount = Object.values(enabledVariables).filter(v => !v).length;
                                            if (falseCount >= 1) {
                                                alert("You must keep at least two market variables enabled.");
                                                return;
                                            }
                                        }
                                        setEnabledVariables(prev => ({ ...prev, event: !prev.event }))
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledVariables.event ? 'bg-emerald-500' : 'bg-coffee-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledVariables.event ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Competitor Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-coffee-800 bg-coffee-900/50 transition-colors hover:bg-coffee-900">
                                <div className="flex items-center gap-3">
                                    <Store className={`w-5 h-5 ${enabledVariables.competitor ? 'text-red-400' : 'text-coffee-600'}`} />
                                    <span className={`font-bold ${enabledVariables.competitor ? 'text-coffee-100' : 'text-coffee-500'}`}>Competitor</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (enabledVariables.competitor) {
                                            const falseCount = Object.values(enabledVariables).filter(v => !v).length;
                                            if (falseCount >= 1) {
                                                alert("You must keep at least two market variables enabled.");
                                                return;
                                            }
                                        }
                                        setEnabledVariables(prev => ({ ...prev, competitor: !prev.competitor }))
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledVariables.competitor ? 'bg-emerald-500' : 'bg-coffee-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledVariables.competitor ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slide to Proceed Button */}
                <div className="flex justify-center mt-8 pb-8" ref={sliderRef}>
                    <div
                        className="relative h-16 rounded-full flex items-center shadow-inner overflow-hidden border border-coffee-700/50 bg-coffee-900/80"
                        style={{ width: SLIDER_WIDTH }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <span className={`font-black uppercase tracking-widest text-sm ${isUnlocked ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${theme === 'theme-black-coffee' ? 'text-blue-400' : 'text-blue-300'}`}>
                                Start Phase 2
                            </span>
                        </div>

                        <motion.div
                            drag={isUnlocked ? false : "x"}
                            dragConstraints={{ left: 0, right: MAX_SLIDE }}
                            dragElastic={0}
                            onDragUpdate={handleDragUpdate}
                            onDragEnd={handleDragEnd}
                            animate={controls}
                            className={`h-14 w-14 rounded-full ml-1 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg ${isUnlocked ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white'}`}
                            style={{ width: HANDLE_WIDTH }}
                        >
                            {isUnlocked ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <ChevronRight className="w-7 h-7 font-black" />
                            )}
                        </motion.div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default PrePhase2Transition;
