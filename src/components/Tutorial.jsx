import React, { useState } from 'react';
import { Play, TrendingUp, TrendingDown, Info, Coffee, CheckCircle, AlertTriangle, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDemand, calculateSales, generateDailyConditions, calculateReward } from '../logic/MarketEngine';
import MarketView from './MarketView';
import ProfitChart from './ProfitChart';
import EmergencyRestockModal from './EmergencyRestockModal';
import WeeklyReportModal from './WeeklyReportModal';
import CafeMap from './CafeMap';

const TUTORIAL_DAYS = {
  1: { day: 'Monday', weather: 'Sunny', nearbyEvent: false, competitorPresent: false, competitorPrice: null },
  2: { day: 'Tuesday', weather: 'Sunny', nearbyEvent: true, competitorPresent: false, competitorPrice: null },
  3: { day: 'Wednesday', weather: 'Cloudy', nearbyEvent: false, competitorPresent: false, competitorPrice: null },
  4: { day: 'Thursday', weather: 'Rainy', nearbyEvent: false, competitorPresent: true, competitorPrice: 9.00 },
  5: { day: 'Friday', weather: 'Rainy', nearbyEvent: false, competitorPresent: false, competitorPrice: null, specialEvent: 'Unable to open shop due to lack of resources.' },
  6: { day: 'Saturday', weather: 'Sunny', nearbyEvent: true, competitorPresent: true, competitorPrice: 9.50 },
  7: { day: 'Sunday', weather: 'Rainy', nearbyEvent: false, competitorPresent: false, competitorPrice: null, specialEvent: 'Competitor electricity out.' }
};

const Tutorial = ({ onComplete, theme, toggleTheme, shopName }) => {
  const [day, setDay] = useState(1);
  const [conditions, setConditions] = useState(TUTORIAL_DAYS[1]);
  const [playerPrice, setPlayerPrice] = useState(4.50);

  // Weekly starting inventory
  const [inventory, setInventory] = useState(1000);

  const [history, setHistory] = useState([
    { day: 'Start', playerRevenue: 0, playerProfit: 0, playerSales: 0 }
  ]);

  const [feedback, setFeedback] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [pendingWeeklyStats, setPendingWeeklyStats] = useState(null);
  const [pendingInventory, setPendingInventory] = useState(1000);
  const [warnings, setWarnings] = useState([]);

  // Dynamic Memory Recall for Tutorial
  const getMemoryRecall = () => {
    if (day <= 3 || history.length <= 1) return null; // Too early
    const pastSimilarDays = history.filter((h, index) => index > 0 && typeof h.day === 'string' && h.day.includes("Day ") && h.weather === conditions.weather && h.nearbyEvent === conditions.nearbyEvent && h.competitorPresent === conditions.competitorPresent);

    if (pastSimilarDays.length > 0) {
      let maxProfitDay = pastSimilarDays[0];
      for (let i = 1; i < pastSimilarDays.length; i++) {
        if (pastSimilarDays[i].playerDailyProfit > maxProfitDay.playerDailyProfit) {
          maxProfitDay = pastSimilarDays[i];
        }
      }

      return {
        dayStr: maxProfitDay.day,
        price: maxProfitDay.playerPrice,
        profit: maxProfitDay.playerDailyProfit
      };
    }
    return null;
  };
  const memoryData = getMemoryRecall();

  const handleStartDay = () => {
    // 1. Calculate Results
    let playerDemand = calculateDemand(
      playerPrice,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice
    );

    // Force high demand on Day 6 to organically trigger the sell-out
    if (day === 6) {
      playerDemand = inventory;
    }

    const playerSales = calculateSales(playerDemand, inventory);
    const playerRevenue = playerSales * playerPrice;

    const COGS = 1.00;
    const playerProfit = (playerSales * playerPrice) - (playerSales * COGS);

    // Calculate Competitor Results for Graph
    let compRevenue = 0;
    let compProfit = 0;
    let compSales = 0;
    if (conditions.competitorPresent && conditions.competitorPrice) {
      let cDemand = 120 - (conditions.competitorPrice * 15);
      if (conditions.weather === 'Hot') cDemand += 50;
      if (conditions.weather === 'Sunny') cDemand += 30;
      if (conditions.weather === 'Rainy') cDemand -= 20;
      if (conditions.nearbyEvent) cDemand += 40;
      if (['Saturday', 'Sunday'].includes(conditions.day)) cDemand += 20;

      if (playerPrice < conditions.competitorPrice) {
        cDemand *= 0.2;
      } else {
        cDemand *= 1.5;
      }

      cDemand = Math.max(0, cDemand);

      compSales = Math.min(Math.floor(cDemand), inventory);
      compRevenue = compSales * conditions.competitorPrice;

      if (day === 5) {
        // Balance competitor profit: They are heavily sponsored, but we want the player 
        // to feel that their 'Exploration' choice was still the winning move!
        // So we peg the competitor to slightly trail the player's success.
        compProfit = playerProfit > 0 ? playerProfit * 0.85 : 50;
      } else {
        compProfit = compRevenue - (compSales * COGS);
      }
    }

    // 2. Determine Feedback (Observation only)
    let message = "";

    if (playerPrice === COGS) {
      if (day === 4) {
        // Just setting the tip if it's day 4, keep the overall flow intact.
      }
      setWarnings(prev => [...prev, {
        id: Date.now(),
        day: day,
        message: `Since your price ($${playerPrice.toFixed(2)}) is equal to the Cost of Raw Materials to make coffee ($${COGS.toFixed(2)}/cup), you made zero profit despite your sales!`
      }]);
      message += `Stable day in the market, but zero profit.`;
    } else if (playerSales === 0) {
      message += `Your price might be too high!`;
    } else if (playerSales === inventory) {
      message += `You sold out completely!`;
    } else {
      message += `Stable day in the market.`;
    }

    let fb = {
      type: 'neutral',
      title: 'Day Complete',
      message: message,
      icon: <Info className="text-blue-400 w-12 h-12" />,
      color: 'blue',
      value: playerProfit,
      playerSales: playerSales
    };

    // Smart Educational Tips based on Day and User Action
    switch (day) {
      case 1:
        fb.educationalTip = { title: "Concept 1: State, Agent, & Action", text: "In RL, the 'State' is exactly what you see on the top (Weather, Day, Events) - it is the complete current condition of your environment. You act as the intelligent 'Agent' observing this world, and the precise price you just set is your explicit 'Action' taken in response to that State." };
        break;
      case 2:
        fb.educationalTip = { title: "Concept 2: Environment", text: "The 'Environment' is the world you interact with. It receives your Action (Price) and the State, and then gives you the outcome." };
        break;
      case 3:
        fb.educationalTip = { title: "Concept 3: Sequential Learning", text: "RL relies on 'Sequential Learning'. This means your actions today affect your future state (like your remaining inventory). You must plan ahead, not just act for today!" };
        break;
      case 4:
        if (playerPrice > conditions.competitorPrice) {
          fb.educationalTip = { title: "Concept 4: Reward", text: "Even by pricing higher than $9, your loyal customers still bought! Right now, you can view 'Profit' as your Reward. But for a true RL agent, 'Reward' is much deeper - it includes strictly managing daily inventory targets to avoid storage or sell-out penalties." };
        } else {
          fb.educationalTip = { title: "Concept 4: Reward", text: "You undercut or matched the $9 competitor. Right now, you can view 'Profit' as your Reward. But for a true RL agent, 'Reward' is much deeper - it includes strictly managing daily inventory targets to avoid storage or sell-out penalties." };
        }
        break;
      case 5:
        const prevPriceDay3 = history[3]?.playerPrice;
        if (playerPrice === prevPriceDay3) {
          fb.educationalTip = { title: "Concept 5: Exploitation", text: "You chose the same price as Wednesday! Relying on past knowledge to make a decision is called 'Exploitation'. However, exploiting too early in an RL agent's life might not always yield the best results because the agent hasn't fully explored other options that could be better." };
        } else {
          fb.educationalTip = { title: "Concept 5: Exploration", text: "You chose a different price than Wednesday, even though conditions were the same! Trying new actions to see if they yield better results is called 'Exploration'." };
        }
        break;
      case 6:
        fb.educationalTip = { title: "Concept 6: Penalty", text: "Because the competitor priced at $9.50 today, your lower price drove massive demand and you sold out! However, hitting 0 inventory triggers an emergency restock 'Penalty'." };
        break;
      case 7:
        const price3 = history[3]?.playerPrice;
        const price5 = history[5]?.playerPrice;
        if (playerPrice === price3 || playerPrice === price5) {
          fb.educationalTip = { title: "Exploitation vs Exploration", text: "You relied on your past prices again! Understanding when to Exploit known strategies and when to Explore new ones is the core dilemma for any AI Agent. A good agent must balance both." };
        } else {
          fb.educationalTip = { title: "Exploration vs Exploitation", text: "You tried a brand new price! Exploring helps discover optimal strategies, but eventually, an agent must Exploit its knowledge to maximize profits. A good agent must balance both." };
        }
        break;
      default:
        break;
    }

    setFeedback(fb);

    const nextPlayerInv = inventory - playerSales;
    const playerDailyReward = calculateReward(playerProfit, nextPlayerInv, conditions.day, playerPrice, conditions.competitorPresent, conditions.competitorPrice);

    // 3. Update History
    setHistory([...history, {
      day: `Day ${day}`,
      playerRevenue: history[history.length - 1].playerRevenue + playerRevenue,
      playerProfit: (history[history.length - 1].playerProfit || 0) + playerProfit,
      playerDailyRevenue: playerRevenue,
      playerDailyProfit: playerProfit,
      playerSales: playerSales,
      playerReward: (history[history.length - 1].playerReward || 0) + playerDailyReward,
      playerDailyReward: playerDailyReward,
      competitorRevenue: (history[history.length - 1].competitorRevenue || 0) + compRevenue,
      competitorProfit: (history[history.length - 1].competitorProfit || 0) + compProfit,
      competitorDailyRevenue: compRevenue,
      competitorDailyProfit: compProfit,
      competitorSales: compSales,
      playerTotalSales: (history[history.length - 1].playerTotalSales || 0) + playerSales,
      competitorTotalSales: (history[history.length - 1].competitorTotalSales || 0) + compSales,
      playerPrice: playerPrice,
      weather: conditions.weather,
      nearbyEvent: conditions.nearbyEvent,
      competitorPresent: conditions.competitorPresent,
      competitorPrice: conditions.competitorPrice,
      startInventory: inventory,
    }]);

    // 4. Prepare next day's inventory but wait for user to click continue
    setPendingInventory(inventory - playerSales);
    setShowPopup(true);
  };

  const handleContinue = () => {
    if (day >= 7) {
      // If we already calculated the week's stats, just show the modal again
      if (pendingWeeklyStats) {
        setWeeklyModalOpen(true);
        return;
      }

      // End Tutorial - Show Weekly Report first
      // Calculate Storage Penalty ($0.50 per unsold cup)
      const PENALTY_RATE = 0.5;
      const playerPenalty = pendingInventory * PENALTY_RATE;

      // Apply Penalty to the New Record before calculating Weekly Stats
      const finalHistory = [...history];
      const weekEndRecord = { ...finalHistory[finalHistory.length - 1] };
      weekEndRecord.playerProfit -= playerPenalty;
      weekEndRecord.playerPenalty = playerPenalty;
      finalHistory[finalHistory.length - 1] = weekEndRecord;
      setHistory(finalHistory);

      const startOfWeek = finalHistory[0] || { playerProfit: 0 };
      const endOfWeek = weekEndRecord;

      const weeklyStats = {
        playerTotal: endOfWeek.playerProfit - startOfWeek.playerProfit,
        mlTotal: 0, // No ML in tutorial
        rlTotal: 0,
        competitorTotal: 0,
        playerPenalty,
        playerInventoryLeft: pendingInventory,
        playerSales: finalHistory.reduce((sum, d) => sum + (d.playerSales || 0), 0),
        mlSales: 0,
      };

      setPendingWeeklyStats(weeklyStats);
      setWeeklyModalOpen(true);
      return; // Ensure we don't clear showPopup when going to the modal; it stays open behind.
    } else {
      setShowPopup(false);
      setWarnings([]); // Clear warnings when moving to the next day

      if (pendingInventory <= 0) {
        setShowRestockModal(true);
      } else {
        proceedToNextDay(pendingInventory);
      }
    }
  };

  const handleNextWeek = () => {
    setWeeklyModalOpen(false);
    if (onComplete) onComplete();
  };

  const handleBackToTutorial = () => {
    setWeeklyModalOpen(false); // Just hide the modal, letting user sit on Day 7 finish screen
  };

  const proceedToNextDay = (startInv) => {
    setDay(day + 1);
    setConditions(TUTORIAL_DAYS[day + 1]);

    if ((day + 1) % 7 === 1) {
      setInventory(1000);
    } else {
      setInventory(startInv);
    }
  };

  const handleTutorialRestock = (amount, cost) => {
    setShowRestockModal(false);

    // Educational alert overlay if they restocked (handled by the history chart dipping)
    const lastHistoryIndex = history.length - 1;
    const currentHist = [...history];
    const latestRecord = { ...currentHist[lastHistoryIndex] };
    latestRecord.playerProfit -= cost;
    latestRecord.playerPenalty = cost;

    // Force an educational tip into feedback for them to read *before* they play the next day?
    // Actually, since they just paid it, the deduction on the graph is educational enough.
    // But let's add an explicit tip into the *next* day's feedback if we wanted.
    currentHist[lastHistoryIndex] = latestRecord;
    setHistory(currentHist);

    proceedToNextDay(amount);
  };

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 p-4 font-sans flex flex-col relative overflow-hidden transition-colors duration-500 ${theme}`}>
      {/* Doodle Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.08] mix-blend-screen' : 'bg-amber-900 opacity-[0.15] mix-blend-luminosity'}`} />

      {/* Dynamic Background */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-30 mix-blend-screen' : 'opacity-50 mix-blend-color-burn'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-900/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>


      {/* Full-width distinct Header */}
      <header className="w-full max-w-[95rem] mx-auto mb-4 bg-gradient-to-r from-coffee-800/80 to-transparent border-l-4 border-l-amber-500 rounded-r-xl border-y border-r border-coffee-700/30 p-3 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-2">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <Coffee className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg lg:text-xl font-bold text-coffee-100 whitespace-nowrap">Phase 1: Training Mode</h1>
          </div>
          <span className="text-coffee-600 shrink-0 hidden md:inline">|</span>
          <p className="text-coffee-300 text-xs truncate hidden md:block">
            Learn how the market reacts to your prices. Maximize your <span className="text-emerald-400 font-bold">Profit</span> and avoid negative <span className="text-red-400 font-bold">Penalties</span>. Cost of Raw Materials to make coffee = $1.00/cup.
          </p>
        </div>
        <div className="shrink-0 flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <div className="md:hidden text-xs text-coffee-300 line-clamp-1 flex-1">
            Learn how the market reacts...
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-coffee-700 bg-coffee-800/80 hover:bg-coffee-700 transition-colors text-xs font-bold shadow-md shrink-0"
          >
            {theme === 'theme-black-coffee' ? <><Sun className="w-3 h-3 text-amber-500" /> Latte</> : <><Moon className="w-3 h-3 text-blue-300" /> Dark Mode</>}
          </button>
        </div>
      </header>

      <div className="w-full max-w-[95rem] mx-auto flex gap-4 lg:gap-6 flex-grow min-h-0 relative z-10 pr-2">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4 flex-grow min-h-0">
            {/* Tier 1: Conditions (Full Width) */}
            <div className="w-full shrink-0">
              <MarketView
                day={conditions.day}
                weather={conditions.weather}
                inventory={showPopup ? pendingInventory : inventory}
                isDayEnd={showPopup}
                nearbyEvent={conditions.nearbyEvent}
                competitorPresent={conditions.competitorPresent}
                competitorPrice={conditions.competitorPrice}
                specialEvent={conditions.specialEvent}
              />
            </div>

            {/* Tier 2: Controls & Insights (Split 38/62) */}
            <div className="flex flex-col lg:flex-row gap-4 shrink-0 lg:h-[190px]">
              {/* Left: Price Selection */}
              <div className="lg:w-[38%] flex flex-col">
                <div className="bg-coffee-800 p-4 rounded-xl border border-coffee-700 shadow-xl relative overflow-hidden flex flex-col h-full justify-between">
                  {/* Decor */}
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* TOP: Labels */}
                  <div className="flex flex-col mb-4">
                    <label className="text-[10px] text-coffee-400 font-bold uppercase tracking-widest mb-1">Price Configuration</label>
                    <span className="text-sm text-coffee-300 font-bold uppercase tracking-wider">Set Price for the day:</span>
                  </div>

                  {/* BOTTOM: Memory + Controls */}
                  <div className="flex items-end justify-between gap-4 mt-auto">
                    {/* Memory Retrieval Box (Left Side) */}
                    <div className="w-full max-w-[55%] flex flex-col justify-end">
                      {memoryData && !showPopup && (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg text-[10px] lg:text-[11px] text-blue-200 leading-snug">
                          <div className="font-bold text-blue-800 dark:text-blue-400 mb-0.5 flex items-center gap-1"><Info className="w-3 h-3" /> In case you want to try Exploiting...</div>
                          <span className="text-blue-900 dark:text-blue-200">According to your past, on {memoryData.dayStr.toLowerCase()} you encountered a similar state and received a profit of <span className="font-bold text-blue-900 dark:text-white">${memoryData.profit?.toFixed(0)}</span> - which is the maximum profit you've gained till now in this state at a price of <span className="font-bold text-blue-900 dark:text-white">${memoryData.price.toFixed(2)}</span>.</span>
                        </div>
                      )}
                    </div>

                    {/* Controls (Right Side) */}
                    <div className="flex flex-col items-end gap-3 z-10 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-amber-400 font-black">$</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.50"
                          value={playerPrice}
                          onChange={(e) => setPlayerPrice(e.target.value)}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) val = 1;
                            val = Math.round(val / 0.5) * 0.5;
                            if (val < 1) val = 1;
                            if (val > 10) val = 10;
                            setPlayerPrice(val);
                          }}
                          className="w-20 bg-coffee-900 border-2 border-coffee-700 text-amber-400 text-lg font-black rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: (day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup) ? 1.05 : 1 }}
                        whileTap={{ scale: (day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup) ? 0.95 : 1 }}
                        onClick={handleStartDay}
                        disabled={day > 7 || !playerPrice || playerPrice < 1 || playerPrice > 10 || showPopup}
                        className={`shrink-0 px-4 py-2 rounded-xl text-white font-black flex items-center gap-2 text-sm transition-all shadow-lg ${(day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup)
                          ? "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20"
                          : "bg-coffee-700 text-coffee-500 cursor-not-allowed opacity-50"
                          }`}
                      >
                        <Play className="fill-current w-4 h-4" /> {(playerPrice >= 1 && playerPrice <= 10) ? `START DAY ${day}` : "INVALID"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Insights / Results */}
              <div className="lg:w-[62%] flex flex-col">
                <AnimatePresence mode="wait">
                  {showPopup && feedback ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-xl border flex flex-col h-full shadow-2xl relative overflow-hidden ${feedback.color === 'emerald' ? 'border-emerald-500/50 bg-emerald-900/20' :
                        feedback.color === 'red' ? 'border-red-500/50 bg-red-900/20' :
                          'border-blue-500/50 bg-blue-900/20'
                        }`}>
                      <div className="flex items-center justify-between gap-4 mb-4 relative">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${feedback.color === 'emerald' ? 'bg-emerald-900/50 text-emerald-400' :
                            feedback.color === 'red' ? 'bg-red-900/50 text-red-400' :
                              'bg-blue-900/50 text-blue-400'
                            }`}>
                            {React.cloneElement(feedback.icon, { className: "w-6 h-6" })}
                          </div>
                          <div>
                            <h2 className={`text-sm font-black ${feedback.color === 'emerald' ? 'text-emerald-400' :
                              feedback.color === 'red' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                              {feedback.title}
                            </h2>
                            <div className="text-xl font-black text-coffee-100 tracking-tight">
                              ${feedback.value.toFixed(2)} <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest">Profit</span>
                            </div>
                          </div>
                        </div>

                        {/* Cups Sold Subbox Inline */}
                        <div className="flex flex-col items-center justify-center bg-coffee-900/80 border border-coffee-700/50 rounded-lg px-3 py-1.5 shadow-inner">
                          <div className="flex items-center gap-1">
                            <Coffee className="w-3 h-3 text-amber-500" />
                            <span className="text-sm font-black text-coffee-100 leading-none">{feedback.playerSales}</span>
                          </div>
                          <span className="text-[8px] text-coffee-400 uppercase tracking-widest mt-1 leading-none">Sold</span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleContinue}
                          className={`shrink-0 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${feedback.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20' :
                            feedback.color === 'red' ? 'bg-red-500 hover:bg-red-400 text-red-950 shadow-red-500/20' :
                              'bg-blue-500 hover:bg-blue-400 text-blue-950 shadow-blue-500/20'
                            }`}
                        >
                          {day >= 7 ? "Finish" : "Next Day"}
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </div>


                      {feedback.educationalTip && (
                        <div className="w-full bg-coffee-950/40 border-l-4 border-amber-500 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Coffee className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{feedback.educationalTip.title}</span>
                          </div>
                          <p className="text-xs text-coffee-100 leading-snug">
                            {feedback.educationalTip.text}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-coffee-800/30 border border-coffee-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full border-dashed"
                    >
                      <TrendingUp className="w-8 h-8 text-coffee-700 mb-2" />
                      <h3 className="text-coffee-500 font-bold uppercase tracking-widest text-[10px]">Waiting for action...</h3>
                      <p className="text-coffee-600 text-[10px] mt-1 px-8">Insights and RL concepts will appear here once the shop opens.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tier 3: Graph and Map (50/50 Split) */}
            <div className="w-full flex-grow min-h-0 flex flex-col md:flex-row gap-4 lg:gap-6">
              <div className="md:w-1/2 bg-coffee-800/50 rounded-2xl border border-coffee-700/50 h-full flex flex-col overflow-hidden">
                <div className="flex-grow w-full">
                  <ProfitChart data={history} showRLAgents={false} shopName={shopName} />
                </div>
              </div>

              {/* Animation / Simulation Box */}
              <div className="md:w-1/2 bg-coffee-800/50 rounded-2xl h-full flex flex-col overflow-hidden relative group">
                {/* Background image container for retro 2D map */}
                <div className="absolute inset-0 w-full h-full xl:bg-coffee-900/80 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 w-full h-full">
                    <CafeMap shopName={shopName} weather={conditions.weather} competitorPresent={conditions.competitorPresent} />
                  </div>
                  {/* Retro CRT/Scanline overlay effect */}
                  <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2PAwn/MfxjA1MAAAwANJwH++eK/eQAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Timeline (Desktop Only) */}
        <div className="hidden lg:flex flex-col items-center w-[60px] shrink-0 h-full">
          <div className="flex flex-col items-center w-full bg-coffee-800/30 py-4 px-2 rounded-2xl border border-coffee-700/50 relative overflow-hidden h-full">

            <div className="text-[10px] font-bold text-coffee-400 relative z-10 tracking-widest uppercase mb-4 text-center leading-tight">
              Day<br /><span className="text-blue-400 text-sm">{day}</span>
            </div>

            <div className="relative w-full flex-grow flex flex-col items-center mb-2 min-h-0">
              {/* Timeline continuous axis */}
              <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-0.5 bg-coffee-700/40 z-0" />

              {/* Nodes */}
              <div className="relative z-10 flex flex-col justify-between h-full w-full items-center">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const isPast = d < day;
                  const isCurrent = d === day;
                  return (
                    <div key={d} className="flex items-center justify-center relative group w-full bg-transparent">
                      <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-500 relative z-10 ${isPast ? 'border-amber-500/50 text-amber-500 bg-[#1e130d] shadow-[0_0_8px_rgba(245,158,11,0.1)]' :
                        isCurrent ? 'border-blue-500/80 bg-blue-500/20 dark:bg-blue-900/40 shadow-[0_0_12px_rgba(96,165,250,0.3)] scale-125' :
                          'border-coffee-500/30 bg-coffee-900/50'
                        }`}>
                        {isPast ? <CheckCircle className="w-3 h-3 opacity-80" /> : <span className={`text-[10px] font-bold ${isCurrent ? 'opacity-100 text-blue-700 dark:text-blue-400' : 'opacity-80 text-coffee-300'}`}>{d}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmergencyRestockModal
        isOpen={showRestockModal}
        onRestock={handleTutorialRestock}
        theme={theme}
      />

      {/* Weekly Report Modal for End of Tutorial */}
      {pendingWeeklyStats && (
        <WeeklyReportModal
          isOpen={weeklyModalOpen}
          weekNumber={1}
          data={pendingWeeklyStats}
          onContinue={handleNextWeek}
          onBackToTutorial={handleBackToTutorial}
          theme={theme}
          toggleTheme={() => { }} // No-op for tutorial
          shopName={shopName}
          isTutorial={true}
          weekHistoryData={history}
          gameConfig={{ weather: true, event: true, competitor: true }}
        />
      )}

      {/* Toast Warnings */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {warnings.map(warning => (
            <motion.div
              key={warning.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-950 border border-red-500 rounded-lg p-3 shadow-2xl w-72 pointer-events-auto relative flex items-start gap-3"
            >
              <button
                onClick={() => setWarnings(w => w.filter(x => x.id !== warning.id))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-300 transition-colors"
                aria-label="Close warning"
              >
                <span className="text-base leading-none block">&times;</span>
              </button>
              <div className="p-1.5 bg-red-900/50 rounded-md shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="pr-2">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Zero Profit (Day {warning.day})</h4>
                <p className="text-[10px] text-red-200 leading-snug">
                  {warning.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default Tutorial;
