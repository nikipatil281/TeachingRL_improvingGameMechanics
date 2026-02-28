import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ChevronRight, Target, AlertCircle, ShoppingCart, Info, Clock, Thermometer, Calendar } from 'lucide-react';

const PrePhase1Transition = ({ onComplete, theme }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
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

    const SLIDER_WIDTH = containerWidth > 0 ? Math.min(360, containerWidth - 32) : 360; // px
    const HANDLE_WIDTH = 56; // px
    const MAX_SLIDE = SLIDER_WIDTH - HANDLE_WIDTH - 8;

    const handleDragUpdate = (event, info) => {
        // Optional: map the opacity of the text to the drag position
        const slidePercent = info.point.x / MAX_SLIDE;
        // We could fade out the text, but framer motion handles it beautifully if we just use a state or ignore it.
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
            text: "A week starts on Monday morning and ends on Sunday night."
        },
        {
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
            title: "Fixed Inventories",
            text: "Raw materials for 1,000 cups of coffee are restocked every Sunday night."
        },
        {
            color: "text-red-400",
            bg: "bg-red-400/10",
            border: "border-red-400/20",
            title: "Perishable Goods",
            text: "The shelf-life of raw materials is exactly one week. Any unsold materials will incur a wastage penalty on Sunday night."
        },
        {
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
            title: "Emergency Restocking",
            text: "If you sell out mid-week, you receive an emergency restock, but at a premium cost."
        },
        {
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/20",
            title: "Cost Per Cup",
            text: "Every cup has a base cost of $1.00. Setting your price too close to this ensures zero profit."
        },
        {
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
            title: "External Variables",
            text: "Consider the weather, day of the week, local events, and competitor pricing to balance demand."
        }
    ];

    return (
        <div className={`min-h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto transition-colors duration-500 ${theme}`}>

            {/* Background Decor */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-40 mix-blend-color-burn'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-900/40 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-5xl p-4 md:p-8"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30"
                    >
                        <Target className="w-8 h-8 text-amber-500" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-coffee-100 to-coffee-400 bg-clip-text text-transparent">
                        Objectives of Phase 1 (the Orientation)
                    </h1>
                    <p className="text-lg md:text-xl text-coffee-300 font-medium max-w-2xl mx-auto">
                        Your goal is to learn the essential terminologies of Reinforcement Learning while mastering the core mechanics of the simulation.
                    </p>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 mb-10">
                    <div className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 flex-1">
                        <h2 className="text-xl font-bold mb-6 text-coffee-100 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-400" />
                            The Rules of the Simulation
                        </h2>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {rules.map((rule, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    className="flex items-start gap-4 transition-all duration-300"
                                >
                                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-lg ${rule.bg} ${rule.color} border ${rule.border} shadow-lg`}>
                                        {(idx + 1).toString().padStart(2, '0')}
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

                    {/* Key Terminologies Box */}
                    <div className="bg-coffee-950/50 rounded-2xl p-6 md:p-8 border border-coffee-800 xl:w-[350px] shrink-0 flex flex-col self-start">
                        <h2 className="text-xl font-bold mb-6 text-coffee-100 flex items-center gap-2">
                            <Info className="w-5 h-5 text-emerald-400" />
                            Key RL Terms to Learn
                        </h2>
                        <p className="text-sm text-coffee-400 font-medium leading-relaxed mb-6">
                            Pay close attention as the game engine will gradually introduce you to these concepts:
                        </p>
                        <ul className="space-y-4 text-sm text-coffee-300 font-medium">
                            <li className="flex items-start gap-3"><span className="text-emerald-400 font-bold shrink-0 w-24">Agent</span> The decision maker (You).</li>
                            <li className="flex items-start gap-3"><span className="text-blue-400 font-bold shrink-0 w-24">Action</span> The decision made (Setting Price).</li>
                            <li className="flex items-start gap-3"><span className="text-amber-400 font-bold shrink-0 w-24">State</span> The current situation (Weather, Events).</li>
                            <li className="flex items-start gap-3"><span className="text-purple-400 font-bold shrink-0 w-24">Reward</span> The feedback received (Profit/Loss).</li>
                            <li className="flex items-start gap-3"><span className="text-red-400 font-bold shrink-0 w-24">Environment</span> The world you interact with.</li>
                        </ul>
                    </div>
                </div>

                {/* Slide to Proceed Button */}
                <div className="flex justify-center mt-8 pb-8" ref={sliderRef}>
                    <div
                        className="relative h-16 rounded-full flex items-center shadow-inner overflow-hidden border border-coffee-700/50 bg-coffee-900/80"
                        style={{ width: SLIDER_WIDTH }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <span className={`font-black uppercase tracking-widest text-sm ${isUnlocked ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${theme === 'theme-black-coffee' ? 'text-coffee-400' : 'text-coffee-300'}`}>
                                Start Phase 1
                            </span>
                        </div>

                        <motion.div
                            drag={isUnlocked ? false : "x"}
                            dragConstraints={{ left: 0, right: MAX_SLIDE }}
                            dragElastic={0}
                            onDragUpdate={handleDragUpdate}
                            onDragEnd={handleDragEnd}
                            animate={controls}
                            className={`h-14 w-14 rounded-full ml-1 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg ${isUnlocked ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-amber-400 to-amber-600 text-coffee-950'}`}
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

export default PrePhase1Transition;
