import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Target, AlertCircle, ShoppingCart, Info, Clock, Thermometer, Calendar } from 'lucide-react';
import { WEEKLY_START_INVENTORY, WASTAGE_COST_PER_CUP } from '../logic/MarketEngine';

const PrePhase1Transition = ({ onComplete, onBackToStory, theme }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const controls = useAnimation();
    const [containerWidth, setContainerWidth] = useState(0);
    const sliderRef = React.useRef(null);
    const [boardStep, setBoardStep] = useState(0); // 0 = Terminologies, 1 = Context

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

    const SLIDER_WIDTH = containerWidth > 0 ? Math.min(550, containerWidth - 32) : 550; // px
    const HANDLE_WIDTH = 110; // px
    const MAX_SLIDE = SLIDER_WIDTH - HANDLE_WIDTH - 8;

    const handleDragUpdate = () => {
        // Reserved for future drag-driven UI tweaks.
    };

    const handleDragEnd = async (event, info) => {
        if (info.offset.x > MAX_SLIDE * 0.7) {
            setIsUnlocked(true);
            await controls.start({ x: MAX_SLIDE });
            setTimeout(() => {
                onComplete();
            }, 400);
        } else {
            controls.start({ x: 0 });
        }
    };

    const rules = [
        {
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/20",
            title: "Weekly Operations",
            text: "A week starts on Monday morning and ends on Sunday night. Each day starts at 7 AM and ends at 10 PM."
        },
        {
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
            title: "Weekly Inventory Reset",
            text: `Raw materials (inventory) for ${WEEKLY_START_INVENTORY.toLocaleString()} cups of coffee are restocked every Monday morning (before the day starts).`
        },
        {
            color: "text-red-400",
            bg: "bg-red-400/10",
            border: "border-red-400/20",
            title: "Perishable Goods",
            text: `The shelf-life of your inventory is exactly one week. Any unsold inventory incurs a $${WASTAGE_COST_PER_CUP.toFixed(2)} wastage penalty per cup on Sunday night.`
        },
        {
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/20",
            title: "Cost Per Cup",
            text: "You spend $1 to make every cup of coffee. Setting your price too close to this leads to minimising your profit."
        },
        {
            color: "text-sky-400",
            bg: "bg-sky-400/10",
            border: "border-sky-400/20",
            title: "External Variables",
            text: "Consider the day of the week, weather, competitor pricing and local events while setting the daily price of coffee."
        },
        {
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
            title: "Penalties",
            text: "Low sales and high wastage lead to penalties. Setting the price too high may lead to low sales, while setting it too low may lead to high wastage."
        },
        {
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
            title: "Rewards",
            text: "Major component of your rewards are profits which are earned based on the difference between the price you set and the cost of production. But rewards are much more nuanced and include penalties for suboptimal decisions like negative competitve advantage."
        }
        
    ];

    return (
        <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto transition-colors duration-500 ${theme}`}>

            {/* Background Decor */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-40 mix-blend-color-burn'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-900/40 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-[90rem] p-4 md:p-8"
            >
                <div className="text-center mb-8">
                    {onBackToStory && (
                        <div className="flex justify-start mb-6">
                            <button
                                onClick={onBackToStory}
                                className="px-4 py-2 rounded-xl border border-coffee-600 text-coffee-200 bg-coffee-800/70 hover:bg-coffee-700/70 font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Go Back to Story
                            </button>
                        </div>
                    )}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30"
                    >
                        <Target className="w-8 h-8 text-amber-500" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-coffee-100 to-coffee-400 bg-clip-text text-transparent">
                        Objectives of Phase 1 (Orientation)
                    </h1>
                    <p className="text-lg md:text-xl text-coffee-300 font-medium max-w-2xl mx-auto">
                        Your goal as an Reinforcement Learning Agent is to learn the optimal pricing policy while understanding the essential terminologies.
                    </p>
                </div>

                <div className="mb-10 max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        {boardStep === 0 ? (
                            <motion.div
                                key="rl-terminologies-board"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 w-full"
                            >
                                <h2 className="text-xl font-bold mb-6 text-coffee-100 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-emerald-400" />
                                    Key Reinforcement Learning Terminologies
                                </h2>
                                <p className="text-base md:text-lg text-coffee-400 font-medium leading-relaxed mb-6">
                                    Pay close attention as the game engine will gradually introduce you to these concepts:
                                </p>
                                <ul className="space-y-4 text-base md:text-lg text-coffee-300 font-medium tracking-wide">
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-red-400 font-bold shrink-0 w-full md:w-52">Environment</span> The world you interact with.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-amber-400 font-bold shrink-0 w-full md:w-52">State</span> The current conditions (the day of the week, weather, competitor pricing, local events and inventory level).</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-emerald-400 font-bold shrink-0 w-full md:w-52">Agent</span> The decision maker (YOU).</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-blue-400 font-bold shrink-0 w-full md:w-52">Action</span> The decision made (Setting daily price of coffee).</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-rose-400 font-bold shrink-0 w-full md:w-52">Penalty</span> The negative feedback received based on low sales and week-end wastage.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-purple-400 font-bold shrink-0 w-full md:w-52">Reward</span> The positive feedback received based on Profit, Inventory Management, Competitor Pricing etc.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-indigo-400 font-bold shrink-0 w-full md:w-52">Policy</span> Your pricing strategy that optimises your rewards.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-blue-400 font-bold shrink-0 w-full md:w-52">Sequential Learning</span> Learning from actions over time.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-yellow-400 font-bold shrink-0 w-full md:w-52">Exploration</span> Trying new prices to learn the optimal price for a given state.</li>
                                    <li className="flex flex-wrap items-start gap-3 md:flex-nowrap"><span className="text-orange-400 font-bold shrink-0 w-full md:w-52">Exploitation</span> Using the known best price for a given state.</li>
                                </ul>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="context-board"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 w-full"
                            >
                                <h2 className="text-xl font-bold mb-6 text-coffee-100 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-400" />
                                    The Context of the Simulation
                                </h2>
                                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                    {rules.map((rule, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + (idx * 0.05) }}
                                            className={`flex items-start gap-4 transition-all duration-300 ${
                                                rule.title === 'Rewards' ? 'md:col-span-2' : ''
                                            }`}
                                        >
                                            <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-lg ${rule.bg} ${rule.color} border ${rule.border} shadow-lg`}>
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div className="pt-0.5">
                                                <h3 className="font-black text-coffee-100 mb-1.5 flex items-center gap-2">
                                                    {rule.title}
                                                </h3>
                                                <p className="text-base md:text-lg text-coffee-400 font-medium leading-relaxed">{rule.text}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`flex items-center mt-5 ${boardStep === 0 ? 'justify-end' : 'justify-start'}`}>
                        {boardStep === 1 && (
                            <button
                                onClick={() => setBoardStep(0)}
                                className="px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 transition-colors border-coffee-600 text-coffee-200 bg-coffee-800/70 hover:bg-coffee-700/70"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                        )}

                        {boardStep === 0 && (
                            <button
                                onClick={() => setBoardStep(1)}
                                className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 transition-colors ${
                                    theme === 'theme-black-coffee'
                                        ? 'border-amber-500/40 text-amber-200 bg-amber-600/20 hover:bg-amber-500/30'
                                        : 'border-amber-700/60 text-coffee-950 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-900/20'
                                }`}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Slide to Proceed Button */}
                {boardStep === 1 && (
                <div className="flex justify-center mt-8 pb-8" ref={sliderRef}>
                    <div
                        className="relative h-16 rounded-full flex items-center shadow-inner overflow-hidden border border-coffee-700/50 bg-coffee-900/80"
                        style={{ width: SLIDER_WIDTH }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pl-32 pointer-events-none z-0">
                            <span className={`font-black uppercase tracking-widest text-xs md:text-sm ${isUnlocked ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${theme === 'theme-black-coffee' ? 'text-coffee-400' : 'text-coffee-300'}`}>
                                Slide to Take a tour of the dashboard
                            </span>
                        </div>

                        <motion.div
                            drag={isUnlocked ? false : "x"}
                            dragConstraints={{ left: 0, right: MAX_SLIDE }}
                            dragElastic={0}
                            onDragUpdate={handleDragUpdate}
                            onDragEnd={handleDragEnd}
                            animate={controls}
                            className={`h-14 rounded-full ml-1 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg ${isUnlocked ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-amber-400 to-amber-600 text-coffee-950'}`}
                            style={{ width: HANDLE_WIDTH }}
                        >
                            {isUnlocked ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <motion.div
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                >
                                    <ChevronRight className="w-7 h-7 font-black" />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
                )}

            </motion.div>
        </div>
    );
};

export default PrePhase1Transition;
