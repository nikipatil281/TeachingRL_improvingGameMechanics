import React, { useState, useEffect } from "react";
import { Play, RotateCcw, DollarSign, Coffee, Moon, Sun, TrendingUp, TrendingDown, Info, CheckCircle, ArrowRight, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MarketView from "./MarketView";
import ProfitChart from "./ProfitChart";
import CafeMap from "./CafeMap";
import EndGameModal from "./EndGameModal";
import WeeklyReportModal from "./WeeklyReportModal";
import WeatherEffects from "./WeatherEffects";
import EmergencyRestockModal from "./EmergencyRestockModal";
import PolicyReviewPage from "./PolicyReviewPage";

import {
  calculateDemand,
  calculateSales,
  generateMainGameConditions,
  calculateReward
} from "../logic/MarketEngine";
import { getMLPrice, getMLFormula, initMLModel } from "../logic/MLAgent";
import { rlAgent } from "../logic/RLAgent";

const Dashboard = ({ theme, toggleTheme, shopName, userName, onRestart }) => {

  // Game State
  const [day, setDay] = useState(1);
  const [conditions, setConditions] = useState(generateMainGameConditions(1));
  const [playerPrice, setPlayerPrice] = useState(4.5);

  // Independent Weekly Inventories for Phase 2
  const [playerInventory, setPlayerInventory] = useState(1500);
  const [mlInventory, setMlInventory] = useState(1500);
  const [rlInventory, setRlInventory] = useState(1500);
  const [competitorInventory, setCompetitorInventory] = useState(1500);

  const [history, setHistory] = useState([
    {
      day: "Start",
      playerRevenue: 0,
      mlRevenue: 0,
      rlRevenue: 0,
      playerSales: 0,
      mlSales: 0,
      rlSales: 0,
    },
  ]);

  const [mlSuggestion, setMLSuggestion] = useState(5.5);
  const [rlSuggestion, setRLSuggestion] = useState({
    price: 5.5,
    action: "medium",
    isExploring: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weekData, setWeekData] = useState(null);
  const [toast, setToast] = useState(null);
  const [gameActive, setGameActive] = useState(true);
  const [mlReady, setMlReady] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [pendingNextDayStr, setPendingNextDayStr] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pendingWeeklyStats, setPendingWeeklyStats] = useState(null);
  const [showPolicyPage, setShowPolicyPage] = useState(false);

  // Dynamic Memory Recall
  const getMemoryRecall = () => {
    if (day <= 7 || history.length <= 1) return null; // No history yet or disabling for Week 1
    // Ignore any history from prior to the start of the 28-day simulation (e.g. Day 1 of Main Simulation)
    // We assume the tutorial ends when history resets/starts over at day 1. 
    // Wait, the history array is passed entirely from App state? 
    // Actually, Dashboard gets a fresh `history` state when it mounts or the game starts. 
    const pastSimilarDays = history.filter((h, index) => index > 0 && typeof h.day === 'string' && h.day.includes("Day ") && h.weather === conditions.weather && h.nearbyEvent === conditions.nearbyEvent && h.competitorPresent === conditions.competitorPresent);

    if (pastSimilarDays.length > 0) {
      // Find the day with the maximum profit
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

  // 1. Initialize ML Model (Frontend-only mode)
  useEffect(() => {
    setMlReady(true);
  }, []);

  async function updateSuggestions() {
    // Async ML prediction (incorporates the potentially forced config conditions)
    const mlP = await getMLPrice(
      conditions.weather,
      false, // Phase 2 ML doesn't use simple rules flag
      conditions.nearbyEvent,
    );
    setMLSuggestion(mlP);

    // RL prediction (using JSON logic based on active configs)
    const rlResult = rlAgent.getAction(
      conditions
    );
    setRLSuggestion(rlResult);
  };

  // 2. Update Suggestions when conditions change
  useEffect(() => {
    updateSuggestions();
  }, [conditions, mlReady]);

  const handleStartDay = () => {
    if (!gameActive) return;

    // 1. Calculate Player Results
    const yesterdayPlayerPrice = history[history.length - 1]?.playerPrice;
    const playerDemand = calculateDemand(
      playerPrice,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice,
      yesterdayPlayerPrice
    );
    const playerSales = calculateSales(playerDemand, playerInventory);
    const playerRevenue = playerSales * playerPrice;

    // 2. Calculate ML Results
    const mlPrice = mlSuggestion;
    const yesterdayMlPrice = history[history.length - 1]?.mlPrice;
    const mlDemand = calculateDemand(
      mlPrice,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice,
      yesterdayMlPrice
    );
    // ML act on its own inventory
    const mlSales = calculateSales(mlDemand, mlInventory);
    const mlRevenue = mlSales * mlPrice;

    // 3. Calculate RL Results
    const rlPrice = rlSuggestion.price;
    const yesterdayRlPrice = history[history.length - 1]?.rlPrice;
    const rlDemand = calculateDemand(
      rlPrice,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice,
      yesterdayRlPrice
    );
    const rlSales = calculateSales(rlDemand, rlInventory);
    const rlRevenue = rlSales * rlPrice;

    const playerDailyProfit = playerRevenue - (playerSales * 1.00);
    const mlDailyProfit = mlRevenue - (mlSales * 1.00);
    const rlDailyProfit = rlRevenue - (rlSales * 1.00);

    // Capture condition states for the log
    const currentConditions = { ...conditions };

    // 4. Update RL Agent (Learning Disabled in Phase 2, policy is fixed)

    // 5. Calculate Competitor Benchmark (Approximation)
    let compRevenue = 0;
    let compSales = 0;
    if (conditions.competitorPresent && conditions.competitorPrice) {
      // The competitor is just another genuine seller in the exact same market.
      // Their demand is calculated identically, treating the player as *their* competitor.
      const yesterdayCompPrice = history[history.length - 1]?.competitorPrice;
      const cDemand = calculateDemand(
        conditions.competitorPrice,
        conditions.weather,
        conditions.nearbyEvent,
        conditions.day,
        true, // Player is present
        playerPrice, // Player's price acts as the competitor price against them
        yesterdayCompPrice
      );

      // Apply Inventory Cap (Fairness)
      compSales = Math.min(Math.floor(cDemand), competitorInventory);
      compRevenue = compSales * conditions.competitorPrice;
    }
    const compDailyProfit = compRevenue - (compSales * 1.00);

    // 6. Deduct Inventories Early to calculate Reward
    const nextPlayerInv = playerInventory - playerSales;
    const nextMlInv = mlInventory - mlSales;
    const nextRlInv = rlInventory - rlSales;
    const nextCompInv = competitorInventory - compSales;

    const playerDailyReward = calculateReward(playerDailyProfit, nextPlayerInv, conditions.day, playerPrice, conditions.competitorPresent, conditions.competitorPrice);
    const mlDailyReward = calculateReward(mlDailyProfit, nextMlInv, conditions.day, mlPrice, conditions.competitorPresent, conditions.competitorPrice);
    const rlDailyReward = calculateReward(rlDailyProfit, nextRlInv, conditions.day, rlPrice, conditions.competitorPresent, conditions.competitorPrice);

    // 7. Update History
    const lastRecord = history[history.length - 1];

    // Map Weather text to proper case for the component (e.g. sunny -> Sunny)
    const mappedWeatherStr = currentConditions.weather.charAt(0).toUpperCase() + currentConditions.weather.slice(1);

    const newRecord = {
      day: `Day ${day}`,

      // Rewards
      playerReward: (lastRecord.playerReward || 0) + playerDailyReward,
      mlReward: (lastRecord.mlReward || 0) + mlDailyReward,
      rlReward: (lastRecord.rlReward || 0) + rlDailyReward,
      playerDailyReward,
      mlDailyReward,
      rlDailyReward,

      // Cumulative Revenue
      playerRevenue: lastRecord.playerRevenue + playerRevenue,
      mlRevenue: lastRecord.mlRevenue + mlRevenue,
      rlRevenue: lastRecord.rlRevenue + rlRevenue,
      competitorRevenue: (lastRecord.competitorRevenue || 0) + compRevenue,

      // Cumulative Profit (Required for ProfitChart line)
      playerProfit: (lastRecord.playerProfit || 0) + playerDailyProfit,
      mlProfit: (lastRecord.mlProfit || 0) + mlDailyProfit,
      rlProfit: (lastRecord.rlProfit || 0) + rlDailyProfit,
      competitorProfit: (lastRecord.competitorProfit || 0) + compDailyProfit,

      // Daily Revenue (For Tooltip)
      playerDailyRevenue: playerRevenue,
      mlDailyRevenue: mlRevenue,
      rlDailyRevenue: rlRevenue,
      competitorDailyRevenue: compRevenue,

      // Daily Profit (Required for ProfitChart bars/table)
      playerDailyProfit: playerDailyProfit,
      mlDailyProfit: mlDailyProfit,
      rlDailyProfit: rlDailyProfit,
      competitorDailyProfit: compDailyProfit,

      // Daily Sales
      playerSales: playerSales,
      mlSales: mlSales,
      rlSales: rlSales,
      competitorSales: compSales,

      // RL Specific Stats for Policy Table
      startInventory: playerInventory, // Specifically for the ProfitChart Table view
      mlStartInventory: mlInventory,
      rlStartInventory: rlInventory,
      competitorStartInventory: competitorInventory,

      rlDemand: rlDemand,
      rlPrice: rlPrice,
      mlPrice: mlPrice,
      playerPrice: playerPrice, // Track player action for end game comparison
      weather: mappedWeatherStr,
      nearbyEvent: currentConditions.nearbyEvent,
      competitorPresent: currentConditions.competitorPresent,
      competitorPrice: currentConditions.competitorPrice,

      // Cumulative Sales (For Tooltip)
      playerTotalSales: (lastRecord.playerTotalSales || 0) + playerSales,
      mlTotalSales: (lastRecord.mlTotalSales || 0) + mlSales,
      rlTotalSales: (lastRecord.rlTotalSales || 0) + rlSales,
      competitorTotalSales: (lastRecord.competitorTotalSales || 0) + compSales,
    };
    setHistory([...history, newRecord]);

    // 8. Advance Day Logic
    // Update State first
    const updatedHistory = [...history, newRecord];
    setHistory(updatedHistory);

    // AI Emergency Restock (Auto-handled for agents if they run out)
    let autoMlPenalty = 0;
    let autoRlPenalty = 0;
    let actualNextMlInv = nextMlInv;
    let actualNextRlInv = nextRlInv;

    if (day < 28 && day % 7 !== 0) {
      if (nextMlInv <= 0) {
        actualNextMlInv = 200;
        autoMlPenalty = 95; // Bulk discount for 200 cups
      }
      if (nextRlInv <= 0) {
        actualNextRlInv = 200;
        autoRlPenalty = 95;
      }

      // Apply AI penalties immediately to the new record
      if (autoMlPenalty > 0 || autoRlPenalty > 0) {
        const penalizedAIRecord = {
          ...newRecord,
          mlRevenue: newRecord.mlRevenue - autoMlPenalty,
          rlRevenue: newRecord.rlRevenue - autoRlPenalty,
          mlPenalty: autoMlPenalty,
          rlPenalty: autoRlPenalty
        };
        const historyWithAIPenalty = [...history, penalizedAIRecord];
        setHistory(historyWithAIPenalty);
      }
    }


    // Check for Weekly Report (Day 7, 14, 21, 28)
    if (day % 7 === 0) {
      // 1. Calculate Storage Penalty ($0.50 per unsold cup)
      const PENALTY_RATE = 0.5;
      const playerPenalty = nextPlayerInv * PENALTY_RATE;
      const mlPenalty = nextMlInv * PENALTY_RATE;
      const rlPenalty = nextRlInv * PENALTY_RATE;
      const competitorPenalty = nextCompInv * PENALTY_RATE;

      // 2. Apply Penalty to the New Record before calculating Weekly Stats
      const finalRecord = {
        ...newRecord,
        playerRevenue: newRecord.playerRevenue - playerPenalty,
        mlRevenue: newRecord.mlRevenue - mlPenalty,
        rlRevenue: newRecord.rlRevenue - rlPenalty,
        competitorRevenue: (newRecord.competitorRevenue || 0) - competitorPenalty,

        // Store penalties for modal viewing
        playerPenalty,
        mlPenalty,
        rlPenalty,
        competitorPenalty,
      };

      // Replace the last record in history with the penalized one
      const penalizedHistory = [...history, finalRecord];
      setHistory(penalizedHistory);

      const weekStartIndex = penalizedHistory.length - 7;
      const weekSlice = penalizedHistory.slice(weekStartIndex);

      const startOfWeek = penalizedHistory[penalizedHistory.length - 8] || {
        playerRevenue: 0,
        mlRevenue: 0,
        rlRevenue: 0,
      };
      const endOfWeek = finalRecord;

      const weeklyStats = {
        playerTotal: endOfWeek.playerRevenue - startOfWeek.playerRevenue,
        mlTotal: endOfWeek.mlRevenue - startOfWeek.mlRevenue,
        rlTotal: endOfWeek.rlRevenue - startOfWeek.rlRevenue,
        competitorTotal:
          (endOfWeek.competitorRevenue || 0) -
          (startOfWeek.competitorRevenue || 0),

        // Pass the penalties to the modal
        playerPenalty,
        mlPenalty,
        rlPenalty,
        competitorPenalty,

        playerInventoryLeft: nextPlayerInv,
        mlInventoryLeft: nextMlInv,
        rlInventoryLeft: nextRlInv,
        competitorInventoryLeft: nextCompInv,

        playerSales: weekSlice.reduce(
          (sum, d) => sum + (d.playerSales || 0),
          0,
        ),
        mlSales: weekSlice.reduce((sum, d) => sum + (d.mlSales || 0), 0),
        rlSales: weekSlice.reduce((sum, d) => sum + (d.rlSales || 0), 0),
        competitorSales: weekSlice.reduce(
          (sum, d) => sum + (d.competitorSales || 0),
          0,
        ),
      };

      setPendingWeeklyStats(weeklyStats);
    }

    // Prepare state for Next Day (handleContinue will process this)
    setPendingNextDayStr({
      nextDayNum: day + 1,
      pInv: nextPlayerInv,
      mInv: actualNextMlInv,
      rInv: actualNextRlInv,
      cInv: nextCompInv
    });

    // Setup Feedback for Popup
    const dailyProfit = playerRevenue - (playerSales * 1.00);
    const fColor = 'blue';
    const fIcon = <Info />;
    const fTitle = "Daily Results";

    setFeedback({
      color: fColor,
      icon: fIcon,
      title: fTitle,
      value: dailyProfit,
      playerSales: playerSales
    });

    setShowPopup(true);
  };

  const handleContinue = () => {
    setShowPopup(false);

    if (day % 7 === 0 && pendingWeeklyStats) {
      setWeekData(pendingWeeklyStats);
      setWeeklyModalOpen(true);
      return;
    }

    // End Game Trap
    if (day >= 28) {
      setModalOpen(true);
      return;
    }

    // Emergency Restock Trap
    if (pendingNextDayStr.pInv <= 0) {
      setShowRestockModal(true);
      return; // handleEmergencyRestock will take over
    }

    // Standard Advance
    advanceDay(pendingNextDayStr.nextDayNum, pendingNextDayStr.pInv, pendingNextDayStr.mInv, pendingNextDayStr.rInv, pendingNextDayStr.cInv);
  };

  const advanceDay = (nextDayNum, pInv = 1500, mInv = 1500, rInv = 1500, cInv = 1500) => {
    setDay(nextDayNum);
    const nextConditions = generateMainGameConditions(nextDayNum);
    setConditions(nextConditions);

    // Weekly Refill logic
    if (nextDayNum % 7 === 1) {
      setPlayerInventory(1500);
      setMlInventory(1500);
      setRlInventory(1500);
      setCompetitorInventory(1500);
    } else {
      setPlayerInventory(pInv);
      setMlInventory(mInv);
      setRlInventory(rInv);
      setCompetitorInventory(cInv);
    }
  };

  const handleNextWeek = () => {
    // Close modal and start next day
    setWeeklyModalOpen(false);

    // Check if player had 0 inventory and needs emergency restock right after weekly report
    if (pendingNextDayStr && pendingNextDayStr.pInv <= 0) {
      setShowRestockModal(true);
      return;
    }

    if (pendingNextDayStr) {
      let nextDayNum = pendingNextDayStr.nextDayNum;

      // End game after week 4 report
      if (day === 28) {
        setModalOpen(true);
        return;
      }

      // DEMO MODE: Fast-forward straight from end of Week 1 (Day 7) to start of Week 4 (Day 22)
      if (nextDayNum === 8) {
        nextDayNum = 22;

        setToast({
          title: "Demo Fast-Forward",
          message: `Skipping Weeks 2 & 3. Jumping straight to Week 4 (Day 22).`,
          icon: 'play'
        });
        setTimeout(() => setToast(null), 4000);
      }

      advanceDay(nextDayNum, pendingNextDayStr.pInv, pendingNextDayStr.mInv, pendingNextDayStr.rInv, pendingNextDayStr.cInv);
    } else {
      if (day === 28) {
        setModalOpen(true);
      } else {
        advanceDay(day + 1);
      }
    }
  };

  const handleEmergencyRestock = (amount, cost) => {
    setShowRestockModal(false);

    // Apply cost to player revenue in history
    const lastHistoryIndex = history.length - 1;
    const currentHist = [...history];
    const latestRecord = { ...currentHist[lastHistoryIndex] };
    latestRecord.playerRevenue -= cost;
    latestRecord.playerPenalty = (latestRecord.playerPenalty || 0) + cost; // Add to tooltips!
    currentHist[lastHistoryIndex] = latestRecord;
    setHistory(currentHist);

    // Proceed to next day with new inventory
    advanceDay(pendingNextDayStr.nextDayNum, amount, pendingNextDayStr.mInv, pendingNextDayStr.rInv, pendingNextDayStr.cInv);
    setPendingNextDayStr(null);
  };

  const handleBackToWeekly = () => {
    setModalOpen(false);
    setWeeklyModalOpen(true);
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      window.location.reload();
    }
  };

  if (showPolicyPage) {
    return (
      <PolicyReviewPage
        history={history}
        shopName={shopName}
        onBackToDebrief={() => setShowPolicyPage(false)}
        theme={theme}
      />
    );
  }

  return (
    <div
      className={`h-screen bg-coffee-900 text-coffee-100 p-4 font-sans relative overflow-hidden transition-colors duration-500 flex flex-col ${theme}`}
    >
      {/* Doodle Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.08] mix-blend-screen' : 'bg-amber-900 opacity-[0.15] mix-blend-luminosity'}`} />

      {/* Dynamic Background */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-30 mix-blend-screen' : 'opacity-50 mix-blend-color-burn'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-900/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-coffee-800/20 rounded-full blur-[100px] animate-slow-spin opacity-50" />
      </div>

      <WeatherEffects weather={conditions.weather} />

      <header className="mb-4 flex flex-col md:flex-row items-center justify-between relative z-10 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-coffee-100 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            Coffee Shop RL Simulation
          </h1>
          <p className="text-coffee-300 font-medium text-sm">
            Master the art of pricing with the assistance of an RL agent.
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-8 justify-end w-full md:w-auto">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-coffee-700 bg-coffee-800 hover:bg-coffee-700 transition-colors text-xs font-bold shadow-md"
          >
            {theme === "theme-black-coffee" ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" /> Latte
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-300" /> Black Coffee
              </>
            )}
          </button>
          <div className="text-right">
            <motion.div
              key={`badge-${day}`}
              initial={{ scale: 1.5, color: "#f59e0b" }}
              animate={{ scale: 1, color: "#10b981" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-xl font-bold"
            >
              Day {day} / 28
            </motion.div>
            <div className="text-xs font-semibold text-coffee-400">
              {conditions.day}
            </div>
          </div>
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
                inventory={playerInventory}
                nearbyEvent={conditions.nearbyEvent}
                competitorPresent={conditions.competitorPresent}
                specialEvent={conditions.specialEvent}
              />
            </div>

            {/* Tier 2: Controls & Chart + Insights (Split 38/62) */}
            <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0">
              {/* Left: Price Selection & Settings */}
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
                      {memoryData && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg text-[10px] lg:text-[11px] text-blue-200 leading-snug">
                          <div className="font-bold text-blue-800 dark:text-blue-400 mb-0.5 flex items-center gap-1"><Info className="w-3 h-3" /> In case you want to try Exploiting...</div>
                          <span className="text-blue-900 dark:text-blue-200">According to your past, on {memoryData.dayStr.toLowerCase()} you encountered a similar state and received a profit of <span className="font-bold text-blue-900 dark:text-white">${memoryData.profit?.toFixed(0)}</span> - which is the maximum profit you've gained till now in this state at a price of <span className="font-bold text-blue-900 dark:text-white">${memoryData.price.toFixed(2)}</span>.</span>
                        </motion.div>
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
                        whileHover={{ scale: (gameActive && playerPrice > 0 && !showPopup) ? 1.05 : 1 }}
                        whileTap={{ scale: (gameActive && playerPrice > 0 && !showPopup) ? 0.95 : 1 }}
                        onClick={handleStartDay}
                        disabled={!gameActive || !playerPrice || playerPrice <= 0 || showPopup}
                        className={`shrink-0 px-4 py-2 rounded-xl text-white font-black flex items-center justify-center gap-2 text-sm transition-all shadow-lg ${(gameActive && playerPrice > 0 && !showPopup)
                          ? "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20"
                          : "bg-coffee-700 text-coffee-500 cursor-not-allowed opacity-50"
                          }`}
                      >
                        {gameActive ? (
                          <>
                            <Play className="fill-current w-4 h-4" /> {playerPrice > 0 ? `OPEN SHOP` : "INVALID"}
                          </>
                        ) : (
                          "ENDED"
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Insights Grid (Split ML Box and Feedback Box) */}
              <div className="lg:w-[62%] flex flex-col gap-4">

                {/* Top Row: Chart (moved from below so it sits at the top of the right column!) */}
                {/* Wait, user asked to separate ML box and insight box. Let's arrange them side by side. */}
                <div className="flex flex-row gap-4 h-[180px]">
                  {/* Insight 1: ML Suggestion (Constant) */}
                  <div className="w-1/2 p-4 bg-coffee-800/80 rounded-xl shadow-2xl border border-coffee-700 flex flex-col justify-between relative overflow-hidden opacity-50">
                    <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay pointer-events-none" />
                    <div className="flex items-center gap-2 mb-1 relative z-10">
                      <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-coffee-400">Baseline Price</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto relative z-10">
                      <span className="text-3xl font-black text-coffee-100">${mlSuggestion.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-coffee-500 leading-tight relative z-10">Static reference price for the simulation.</div>
                  </div>

                  {/* Insight 2: Realized Profit Yesterday or Popup */}
                  <div className="w-1/2 p-0 flex flex-col relative bg-coffee-800/80 rounded-xl shadow-2xl border border-coffee-700 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {showPopup && feedback ? (
                        <motion.div
                          key="feedback-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`absolute inset-0 p-4 flex flex-col h-full justify-between shadow-inner ${feedback.color === 'emerald' ? 'bg-emerald-900/20 border-l-4 border-emerald-500' :
                            feedback.color === 'red' ? 'bg-red-900/20 border-l-4 border-red-500' :
                              'bg-blue-900/20 border-l-4 border-blue-500'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${feedback.color === 'emerald' ? 'bg-emerald-900/50 text-emerald-400' :
                                feedback.color === 'red' ? 'bg-red-900/50 text-red-400' :
                                  'bg-blue-900/50 text-blue-400'
                                }`}>
                                {React.cloneElement(feedback.icon || <Info />, { className: "w-5 h-5" })}
                              </div>
                              <div>
                                <h2 className={`text-sm font-black ${feedback.color === 'emerald' ? 'text-emerald-400' :
                                  feedback.color === 'red' ? 'text-red-400' :
                                    'text-blue-400'
                                  }`}>{feedback.title}</h2>
                                <div className="text-xl font-black text-coffee-100 tracking-tight">
                                  ${feedback.value.toFixed(2)} <span className="text-[8px] font-bold text-coffee-400 uppercase tracking-widest">PROFIT</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-coffee-950/80 border border-coffee-700/50 rounded-lg px-2 py-1 shadow-inner">
                              <div className="flex items-center gap-1">
                                <Coffee className="w-3 h-3 text-amber-500" />
                                <span className="text-sm font-black text-coffee-100 leading-none">{feedback.playerSales}</span>
                              </div>
                              <span className="text-[7px] text-coffee-400 uppercase tracking-widest mt-1 leading-none">Sold</span>
                            </div>
                          </div>
                          <div className="flex justify-end mt-auto">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleContinue}
                              className={`shrink-0 px-4 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${feedback.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20' :
                                feedback.color === 'red' ? 'bg-red-500 hover:bg-red-400 text-red-950 shadow-red-500/20' :
                                  'bg-blue-500 hover:bg-blue-400 text-blue-950 shadow-blue-500/20'
                                }`}
                            >
                              {day >= 28 ? "Finish" : "Next Day"}
                              <ArrowRight className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="waiting-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full flex items-center justify-center flex-col opacity-50 p-4"
                        >
                          <Info className="w-5 h-5 text-coffee-500 mb-1" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-coffee-400 shrink-0">Awaiting Day {day} Action</span>
                          <span className="text-[9px] text-coffee-600 mt-1">Open shop to view results.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>

            {/* Tier 3: Graph and Map (50/50 Split) matching Tutorial */}
            <div className="w-full flex-grow min-h-0 flex flex-col md:flex-row gap-4 lg:gap-6">
              <div className="md:w-1/2 bg-coffee-800/50 rounded-2xl border border-coffee-700/50 h-[350px] flex flex-col overflow-hidden">
                <div className="flex-grow w-full">
                  <ProfitChart data={history} showRLAgents={true} shopName={shopName} hideRLLine={true} hideMLReward={true} />
                </div>
              </div>

              {/* Animation / Simulation Box */}
              <div className="md:w-1/2 bg-coffee-800/50 rounded-2xl h-[350px] flex flex-col overflow-hidden relative group">
                <div className="absolute inset-0 w-full h-full xl:bg-coffee-900/80 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 w-full h-full">
                    <CafeMap shopName={shopName} weather={conditions.weather} competitorPresent={conditions.competitorPresent} />
                  </div>
                  <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAaaAE0lEQVQIW2PAwn/MfxjA1MAAAwANJwH++eK/eQAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar: Timeline (Desktop Only) specifically for 28 Days */}
        <div className="hidden lg:flex flex-col items-center w-[60px] shrink-0 h-full">
          <div className="flex flex-col items-center w-full bg-coffee-800/30 py-4 px-2 rounded-2xl border border-coffee-700/50 relative overflow-hidden h-full">

            <div className="text-[10px] font-bold text-coffee-400 relative z-10 tracking-widest uppercase mb-4 text-center leading-tight">
              Day<br /><span className="text-blue-400 text-sm">{day}</span>
            </div>

            <div className="relative w-full flex-grow flex flex-col items-center mb-2 overflow-y-auto no-scrollbar scroll-smooth">
              {/* Timeline continuous axis */}
              <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-0.5 bg-coffee-700/40 z-0 h-full" />

              {/* Nodes for all 28 days with spacing */}
              <div className="relative z-10 flex flex-col h-auto w-full items-center gap-1.5 py-2">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
                  const isPast = d < day;
                  const isCurrent = d === day;
                  const isLocked = d >= 8 && d <= 21;
                  return (
                    <div key={d} className="flex items-center justify-center relative group w-full bg-transparent shrink-0">
                      <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-500 relative z-10 ${isPast ? 'border-amber-500/50 text-amber-500 bg-[#1e130d] shadow-[0_0_8px_rgba(245,158,11,0.1)]' :
                        isCurrent ? 'border-blue-500/80 bg-blue-500/20 dark:bg-blue-900/40 shadow-[0_0_12px_rgba(96,165,250,0.3)] scale-125' :
                          isLocked ? 'border-coffee-700/30 bg-coffee-800/50 opacity-40' :
                            'border-coffee-500/30 bg-coffee-900/50'
                        }`}>
                        {isPast ? (
                          <CheckCircle className="w-3 h-3 opacity-80" />
                        ) : isLocked ? (
                          <Lock className="w-2.5 h-2.5 text-coffee-500" />
                        ) : (
                          <span className={`text-[9px] font-bold ${isCurrent ? 'opacity-100 text-blue-700 dark:text-blue-400' : 'opacity-80 text-coffee-300'}`}>{d}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EndGameModal
        isOpen={modalOpen}
        onRestart={handleRestart}
        history={history}
        theme={theme}
        toggleTheme={toggleTheme}
        shopName={shopName}
        userName={userName}
        onBackToWeeklyReport={handleBackToWeekly}
        onShowPolicyPage={setShowPolicyPage}
      />

      <WeeklyReportModal
        isOpen={weeklyModalOpen}
        weekNumber={Math.floor(day / 7)}
        data={
          weekData || {
            playerTotal: 0,
            mlTotal: 0,
            rlTotal: 0,
            competitorTotal: 0,
            playerSales: 0,
            mlSales: 0,
            rlSales: 0,
            competitorSales: 0,
          }
        }
        onContinue={handleNextWeek}
        theme={theme}
        toggleTheme={toggleTheme}
        shopName={shopName}
        isTutorial={false}
        weekHistoryData={history.slice(-7)}
      />

      <EmergencyRestockModal
        isOpen={showRestockModal}
        onRestock={handleEmergencyRestock}
        theme={theme}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-emerald-900/90 backdrop-blur-md border border-emerald-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-start gap-4 max-w-sm"
          >
            <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-500/30 shrink-0">
              {toast.icon === 'play' ? (
                <Play className="w-8 h-8 text-amber-400" />
              ) : (
                <Info className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <h4 className="text-emerald-100 font-bold text-lg mb-1">{toast.title}</h4>
              <p className="text-emerald-200/80 text-sm leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
