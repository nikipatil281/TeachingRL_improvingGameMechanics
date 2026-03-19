import React, { useState } from 'react';
import { Play, TrendingUp, TrendingDown, Info, Coffee, CheckCircle, AlertTriangle, Sun, Moon, ArrowRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculateDemand,
  calculateSales,
  calculateReward,
  calculateDailyProfit,
  calculateWeekWastagePenalty,
  getNormalizedPrice,
  WEEKLY_START_INVENTORY
} from '../logic/MarketEngine';
import { getMLPrice } from "../logic/MLAgent";
import MarketView from './MarketView';
import ProfitChart from './ProfitChart';
import EmergencyRestockModal from './EmergencyRestockModal';
import WeeklyReportModal from './WeeklyReportModal';
import CafeMap from './CafeMap';

const TUTORIAL_DAYS = {
  1: { day: 'Monday', weather: 'Sunny', nearbyEvent: false, eventName: null, competitorPresent: false, competitorPrice: null },
  2: { day: 'Tuesday', weather: 'Cloudy', nearbyEvent: true, eventName: 'Food Fest', competitorPresent: false, competitorPrice: null },
  3: { day: 'Wednesday', weather: 'Cloudy', nearbyEvent: false, eventName: null, competitorPresent: false, competitorPrice: null },
  4: { day: 'Thursday', weather: 'Rainy', nearbyEvent: false, eventName: null, competitorPresent: true, competitorPrice: 9.00 },
  5: { day: 'Friday', weather: 'Rainy', nearbyEvent: false, eventName: null, competitorPresent: false, competitorPrice: null, specialEvent: 'Unable to open shop due to lack of resources.' },
  6: { day: 'Saturday', weather: 'Rainy', nearbyEvent: true, eventName: 'Music Concert', competitorPresent: true, competitorPrice: 3.00 },
  7: { day: 'Sunday', weather: 'Rainy', nearbyEvent: false, eventName: null, competitorPresent: false, competitorPrice: null, specialEvent: 'Competitor electricity out.' }
};

const Tutorial = ({ onComplete, theme, toggleTheme, shopName, userAvatar = 'Leo', backendStatus }) => {
  const DEFAULT_PLAYER_PRICE = 1;
  const [day, setDay] = useState(1);
  const [conditions, setConditions] = useState(TUTORIAL_DAYS[1]);
  const [playerPrice, setPlayerPrice] = useState(DEFAULT_PLAYER_PRICE);

  // Weekly starting inventory
  const [inventory, setInventory] = useState(WEEKLY_START_INVENTORY);

  const [history, setHistory] = useState([
    {
      day: 'Start',
      dayName: '',
      playerRevenue: 0,
      playerProfit: 0,
      playerGrossProfit: 0,
      playerReward: 0,
      playerSales: 0,
      mlRevenue: 0,
      mlProfit: 0,
      mlGrossProfit: 0,
      mlReward: 0,
      mlSales: 0,
      competitorGrossProfit: 0
    }
  ]);

  const [mlInventory, setMlInventory] = useState(WEEKLY_START_INVENTORY);
  const [mlSuggestion, setMLSuggestion] = useState(5);
  const mlReady = backendStatus?.ml?.ready ?? false;

  const [feedback, setFeedback] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [pendingWeeklyStats, setPendingWeeklyStats] = useState(null);
  const [pendingInventory, setPendingInventory] = useState(WEEKLY_START_INVENTORY);
  const mutedPanelClass = showPopup
    ? "opacity-55 grayscale brightness-75"
    : "opacity-100 grayscale-0 brightness-100";

  // Update ML Suggestions
  React.useEffect(() => {
    const updateML = async () => {
      if (!mlReady) return;
      const price = await getMLPrice(
        conditions.day,
        conditions.weather,
        conditions.nearbyEvent,
        mlInventory,
        conditions.competitorPresent,
        conditions.competitorPrice || 0
      );
      setMLSuggestion(getNormalizedPrice(price));
    };
    updateML();
  }, [conditions, mlInventory, mlReady]);

  const recallHistory = showPopup ? history.slice(0, -1) : history;

  // Dynamic Memory Recall for Tutorial
  const getMemoryRecall = () => {
    if (day <= 3 || recallHistory.length <= 1) return null; // Too early
    const pastSimilarDays = recallHistory.filter((h, index) => index > 0 && typeof h.day === 'string' && h.day.includes("Day ") && h.weather === conditions.weather && h.nearbyEvent === conditions.nearbyEvent && h.competitorPresent === conditions.competitorPresent);

    if (pastSimilarDays.length > 0) {
      let maxProfitDay = pastSimilarDays[0];
      for (let i = 1; i < pastSimilarDays.length; i++) {
        if (pastSimilarDays[i].playerDailyProfit > maxProfitDay.playerDailyProfit) {
          maxProfitDay = pastSimilarDays[i];
        }
      }

      return {
        dayStr: maxProfitDay.dayName || maxProfitDay.day,
        price: maxProfitDay.playerPrice,
        profit: maxProfitDay.playerDailyGrossProfit ?? Math.max(maxProfitDay.playerDailyProfit ?? 0, 0),
        reward: maxProfitDay.playerDailyReward || 0
      };
    }
    return null;
  };
  const memoryData = getMemoryRecall();

  const getTutorialDemand = (price) => {
    const demand = calculateDemand(
      price,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice,
      history[history.length - 1].playerPrice
    );

    if (day === 6) return Math.min(demand, 235);
    if (day !== 7) return demand;

    const dayFiveLikeDemand = calculateDemand(
      price,
      TUTORIAL_DAYS[5].weather,
      TUTORIAL_DAYS[5].nearbyEvent,
      TUTORIAL_DAYS[5].day,
      TUTORIAL_DAYS[5].competitorPresent,
      TUTORIAL_DAYS[5].competitorPrice
    );

    return dayFiveLikeDemand + 8;
  };

  const handleStartDay = () => {
    const normalizedPlayerPrice = getNormalizedPrice(playerPrice);
    if (normalizedPlayerPrice !== playerPrice) {
      setPlayerPrice(normalizedPlayerPrice);
    }

    // 1. Calculate Results
    const playerDemand = getTutorialDemand(normalizedPlayerPrice);

    const playerSales = calculateSales(playerDemand, inventory);
    const playerRevenue = playerSales * normalizedPlayerPrice;
    const playerProfitBreakdown = calculateDailyProfit(playerSales, normalizedPlayerPrice, conditions.day);
    const nextPlayerInv = inventory - playerSales;
    const playerPenalty = day === 7 ? calculateWeekWastagePenalty(nextPlayerInv) : 0;
    const playerRewardComponent = playerProfitBreakdown.gross - playerProfitBreakdown.cogs;
    const playerPenaltyComponent = playerProfitBreakdown.penalty + playerPenalty;
    const playerProfit = playerRewardComponent - playerPenaltyComponent;

    // Calculate Competitor Results for Graph
    let compRevenue = 0;
    let compProfit = 0;
    let compGrossProfit = 0;
    let compSales = 0;
    if (conditions.competitorPresent && conditions.competitorPrice) {
      let cDemand = 120 - (conditions.competitorPrice * 15);

      if (conditions.weather === 'Sunny') cDemand += 30;
      if (conditions.weather === 'Rainy') cDemand -= 20;
      if (conditions.nearbyEvent) cDemand += 40;
      if (['Saturday', 'Sunday'].includes(conditions.day)) cDemand += 20;

      if (normalizedPlayerPrice < conditions.competitorPrice) {
        cDemand *= 0.2;
      } else {
        cDemand *= 1.5;
      }

      cDemand = Math.max(0, cDemand);

      compSales = Math.min(Math.floor(cDemand), inventory);
      compRevenue = compSales * conditions.competitorPrice;

      compGrossProfit = (compSales * conditions.competitorPrice) - compSales;

      if (day === 5) {
        // Balance competitor profit: They are heavily sponsored, but we want the player 
        // to feel that their 'Exploration' choice was still the winning move!
        // So we peg the competitor to slightly trail the player's success.
        compProfit = playerProfit > 0 ? playerProfit * 0.85 : 50;
      } else {
        compProfit = calculateDailyProfit(compSales, conditions.competitorPrice, conditions.day).netProfit;
      }
    }

    // Calculate ML Results (Simulated in Tutorial)
    const mlPrice = getNormalizedPrice(mlSuggestion);
    const mlDemandBase = day === 7
      ? calculateDemand(
        mlPrice,
        TUTORIAL_DAYS[5].weather,
        TUTORIAL_DAYS[5].nearbyEvent,
        TUTORIAL_DAYS[5].day,
        TUTORIAL_DAYS[5].competitorPresent,
        TUTORIAL_DAYS[5].competitorPrice
      ) + 8
      : calculateDemand(
        mlPrice,
        conditions.weather,
        conditions.nearbyEvent,
        conditions.day,
        conditions.competitorPresent,
        conditions.competitorPrice,
        history[history.length - 1].mlPrice || 4.50
      );
    const mlDemand = day === 6 ? Math.min(mlDemandBase, 235) : mlDemandBase;
    const mlSales = calculateSales(mlDemand, mlInventory);
    const mlRevenue = mlSales * mlPrice;
    const mlProfitBreakdown = calculateDailyProfit(mlSales, mlPrice, conditions.day);
    const mlGrossProfit = mlProfitBreakdown.gross - mlProfitBreakdown.cogs;
    const mlProfit = mlProfitBreakdown.netProfit;

    // 2. Determine Feedback (Observation only)
    let message = "";

    if (normalizedPlayerPrice === 1) {
      if (day === 4) {
        // Just setting the tip if it's day 4, keep the overall flow intact.
      }
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
      title: 'Results for Today',
      message: message,
      icon: <Info className="text-blue-400 w-12 h-12" />,
      color: 'blue',
      value: playerProfit,
      playerSales: playerSales,
      showZeroMarginInsight: normalizedPlayerPrice === 1
    };

    // Smart Educational Tips based on Day and User Action
    switch (day) {
      case 1:
        fb.educationalTip = { title: "Concept 1: State, Agent & Action", text: "In Reinforcement Learning, the 'State' is exactly what you see on the top (Weather, Day, Events etc.) - it is the complete current condition of your environment. As an intelligent 'Agent' your 'Action' is to set the daily price of coffee by observing the state." };
        break;
      case 2:
        fb.educationalTip = { title: "Concept 2: Environment", text: "The 'Environment' is the world you interact with. It receives your Action (Price) for that State and then gives you the outcome." };
        break;
      case 3:
        fb.educationalTip = { title: "Concept 3: Sequential Learning", text: "Reinforcement Learning relies on 'Sequential Learning'. This means your actions today affect the state tomorrow(like your remaining inventory). You must plan ahead, not just act for today!" };
        break;
      case 4:
        if (normalizedPlayerPrice > conditions.competitorPrice) {
          fb.educationalTip = { title: "Concept 4: Reward", text: "Even by pricing higher than $9, your loyal customers still bought! Right now, you can view 'Profit' as your Reward. But for a true Reinforcement Learning agent, 'Reward' is much deeper - it includes many factors like strictly managing daily inventory targets to avoid storage or sell-out penalties etc." };
        } else {
          fb.educationalTip = { title: "Concept 4: Reward", text: "You undercut or matched the $9 competitor. Right now, you can view 'Profit' as your Reward. But for a true Reinforcement Learning agent, 'Reward' is much deeper - it includes many factors like strictly managing daily inventory targets to avoid storage or sell-out penalties etc." };
        }
        break;
      case 5: {
        const prevPriceDay3 = history[3]?.playerPrice;
        if (normalizedPlayerPrice === prevPriceDay3) {
          fb.educationalTip = { title: "Concept 5: Exploitation", text: "You chose the same price as Wednesday! Relying on past knowledge to make a decision is called 'Exploitation'. However, exploiting too early in an Reinforcement Learning agent's life might not always yield the best results because the agent hasn't fully explored other options that could be better." };
        } else {
          fb.educationalTip = { title: "Concept 5: Exploration", text: "You chose a different price than Wednesday, even though conditions were the same! Trying new actions to see if they yield better results is called 'Exploration'." };
        }
        break;
      }
      case 6:
        fb.educationalTip = { title: "Concept 6: Penalty", text: "For a true Reinforcement Learning agent, 'Penalty' includes factors like missing daily sales targets. In this orientation, the RL agent would receive a penalty if demand stays below the required threshold, showing how low demand can reduce the model's final net reward." };
        break;
      case 7: {
        const price3 = history[3]?.playerPrice;
        const price5 = history[5]?.playerPrice;
        if (normalizedPlayerPrice === price3 || normalizedPlayerPrice === price5) {
          fb.educationalTip = { title: "Exploitation vs Exploration", text: "You relied on your past prices again! Understanding when to Exploit known strategies and when to Explore new ones is the core dilemma for any Reinforcement Learning Agent. A good agent must balance both." };
        } else {
          fb.educationalTip = { title: "Exploration vs Exploitation", text: "You tried a brand new price! Exploring helps discover optimal strategies, but eventually, an agent must Exploit its knowledge to maximize profits. A good agent must balance both." };
        }
        break;
      }
      default:
        break;
    }

    const playerRewardData = calculateReward(playerProfit);
    const playerDailyReward = playerRewardData.total;
    fb.value = playerRewardComponent;
    fb.playerReward = playerDailyReward;
    setFeedback(fb);

    // 3. Update History
    setHistory([...history, {
      day: `Day ${day}`,
      dayName: conditions.day,
      playerRevenue: history[history.length - 1].playerRevenue + playerRevenue,
      playerProfit: (history[history.length - 1].playerProfit || 0) + playerProfit,
      playerGrossProfit: (history[history.length - 1].playerGrossProfit || 0) + playerRewardComponent,
      playerDailyRevenue: playerRevenue,
      playerDailyProfit: playerProfit,
      playerDailyGrossProfit: playerRewardComponent,
      playerSales: playerSales,
      playerPenalty,
      playerLowSalesPenalty: playerProfitBreakdown.penalty,
      playerReward: (history[history.length - 1].playerReward || 0) + playerDailyReward,
      playerDailyReward: playerDailyReward,
      playerDailyRewardPoints: parseFloat(playerRewardComponent.toFixed(2)),
      playerDailyPenaltyPoints: parseFloat(playerPenaltyComponent.toFixed(2)),
      competitorRevenue: (history[history.length - 1].competitorRevenue || 0) + compRevenue,
      competitorProfit: (history[history.length - 1].competitorProfit || 0) + compProfit,
      competitorGrossProfit: (history[history.length - 1].competitorGrossProfit || 0) + compGrossProfit,
      competitorDailyRevenue: compRevenue,
      competitorDailyProfit: compProfit,
      competitorDailyGrossProfit: compGrossProfit,
      competitorSales: compSales,
      playerTotalSales: (history[history.length - 1].playerTotalSales || 0) + playerSales,
      mlTotalSales: (history[history.length - 1].mlTotalSales || 0) + mlSales,
      competitorTotalSales: (history[history.length - 1].competitorTotalSales || 0) + compSales,
      playerPrice: normalizedPlayerPrice,
      mlPrice: mlPrice,
      mlRevenue: (history[history.length - 1].mlRevenue || 0) + mlRevenue,
      mlProfit: (history[history.length - 1].mlProfit || 0) + mlProfit,
      mlGrossProfit: (history[history.length - 1].mlGrossProfit || 0) + mlGrossProfit,
      mlDailyProfit: mlProfit,
      mlDailyGrossProfit: mlGrossProfit,
      mlSales: mlSales,
      weather: conditions.weather,
      nearbyEvent: conditions.nearbyEvent,
      competitorPresent: conditions.competitorPresent,
      competitorPrice: conditions.competitorPrice,
      startInventory: inventory,
      mlStartInventory: mlInventory,
    }]);

    // 4. Prepare next day's inventory but wait for user to click continue
    setPendingInventory(inventory - playerSales);
    setMlInventory(mlInventory - mlSales);
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
      const playerPenalty = calculateWeekWastagePenalty(pendingInventory);
      const finalHistory = [...history];
      const startOfWeek = finalHistory[0] || { playerProfit: 0 };
      const endOfWeek = finalHistory[finalHistory.length - 1] || { playerProfit: 0 };

      const weeklyStats = {
        playerTotal: endOfWeek.playerProfit - startOfWeek.playerProfit,
        mlTotal: 0, // No ML in tutorial
        rlTotal: 0,
        competitorTotal: 0,
        playerPenalty,
        playerInventoryLeft: pendingInventory,
        playerSales: finalHistory.reduce((sum, d) => sum + (d.playerSales || 0), 0),
        mlSales: 0,
        mlInventoryLeft: mlInventory,
      };

      setPendingWeeklyStats(weeklyStats);
      setWeeklyModalOpen(true);
      return; // Ensure we don't clear showPopup when going to the modal; it stays open behind.
    } else {
      setShowPopup(false);

      proceedToNextDay(pendingInventory);
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
    setPlayerPrice(DEFAULT_PLAYER_PRICE);
    setConditions(TUTORIAL_DAYS[day + 1]);

    if ((day + 1) % 7 === 1) {
      setInventory(WEEKLY_START_INVENTORY);
      setMlInventory(WEEKLY_START_INVENTORY);
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
    <div className={`h-screen bg-coffee-900 text-coffee-100 p-4 font-sans flex flex-col relative overflow-x-hidden overflow-y-auto transition-colors duration-500 ${theme}`}>
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
            <h1 className="text-lg lg:text-xl font-bold text-coffee-100 whitespace-nowrap">Phase 1: Orientation Phase</h1>
          </div>
          <span className="text-coffee-600 shrink-0 hidden md:inline">|</span>
          <p className="text-coffee-300 text-xs truncate hidden md:block">
            Learn how the market reacts to your prices. Maximise your <span className="text-emerald-400 font-bold">Rewards</span> and avoid <span className="text-red-400 font-bold">Penalties</span>.
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
            <div className={`w-full shrink-0 transition-all duration-300 ${mutedPanelClass}`}>
              <MarketView
                day={conditions.day}
                weather={conditions.weather}
                inventory={showPopup ? pendingInventory : inventory}
                isDayEnd={showPopup}
                nearbyEvent={conditions.nearbyEvent}
                eventName={conditions.eventName}
                competitorPresent={conditions.competitorPresent}
                competitorPrice={conditions.competitorPrice}
                specialEvent={conditions.specialEvent}
              />
            </div>

            {/* Tier 2: Graph and Map (50/50 Split) */}
            <div className="w-full flex-grow min-h-0 flex flex-col md:flex-row gap-4 lg:gap-6">
              <div className="md:w-1/2 bg-coffee-800/50 rounded-2xl border border-coffee-700/50 h-full flex flex-col overflow-hidden">
                <div className="flex-grow w-full">
                  <ProfitChart data={history} showRLAgents={false} showMLAgent={false} hideRLLine={true} hideRLRewardLine={true} enableRewardsView={true} shopName={shopName} />
                </div>
              </div>

              {/* Animation / Simulation Box */}
              <div className={`md:w-1/2 bg-coffee-800/50 rounded-2xl h-full flex flex-col overflow-hidden relative group transition-all duration-300 ${mutedPanelClass}`}>
                {/* Background image container for retro 2D map */}
                <div className="absolute inset-0 w-full h-full xl:bg-coffee-900/80 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 w-full h-full">
                    <CafeMap shopName={shopName} weather={conditions.weather} competitorPresent={conditions.competitorPresent} userAvatar={userAvatar} />
                  </div>
                  {/* Retro CRT/Scanline overlay effect */}
                  <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2PAwn/MfxjA1MAAAwANJwH++eK/eQAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                </div>

              </div>
            </div>
            {/* Tier 3: Controls & Insights (Split 38/62) */}
            <div className="flex flex-col lg:flex-row gap-4 shrink-0 lg:h-[190px]">
              {/* Left: Price Selection */}
              <div className="lg:w-[38%] flex flex-col">
                <div className={`${theme === 'theme-latte'
                  ? 'bg-gradient-to-br from-amber-100/85 via-amber-50/80 to-orange-100/75 border-amber-500/70 ring-amber-500/35 shadow-amber-500/20'
                  : 'bg-gradient-to-br from-amber-700/35 via-coffee-700/85 to-coffee-800/85 border-amber-400/55 ring-amber-300/35 shadow-amber-900/20'
                  } p-4 rounded-xl border ring-1 shadow-xl relative overflow-hidden flex flex-col h-full gap-3 transition-all duration-300 ${mutedPanelClass}`}>
                  {/* Decor */}
                  <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl pointer-events-none ${theme === 'theme-latte' ? 'bg-amber-300/45' : 'bg-amber-400/30'}`} />

                  {/* TOP: Labels, Slider, Input Side-by-Side */}
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-extrabold uppercase tracking-wider shrink-0 bg-amber-200/10 border border-amber-300/30 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${theme === 'theme-latte' ? 'text-amber-900' : 'text-amber-50'}`}>Set Price for the day:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={playerPrice}
                      onChange={(e) => setPlayerPrice(parseFloat(e.target.value))}
                      className="flex-grow h-2 bg-coffee-950/80 rounded-lg appearance-none cursor-pointer accent-amber-400 shadow-inner"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-lg text-amber-300 font-black">$</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={playerPrice}
                        onChange={(e) => setPlayerPrice(e.target.value)}
                        onBlur={(e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val)) val = 1;
                          val = Math.round(val);
                          if (val < 1) val = 1;
                          if (val > 10) val = 10;
                          setPlayerPrice(val);
                        }}
                        className={`w-16 bg-coffee-900/80 border border-amber-600/40 text-base font-black rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-400 transition-colors shadow-inner ${theme === 'theme-latte' ? 'text-amber-900' : 'text-amber-200'}`}
                      />
                    </div>
                  </div>

                  {/* MIDDLE: Memory Retrieval Box (Full Width) */}
                  <div className="w-full">
                    {memoryData && !showPopup && (
                      <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg text-[10px] lg:text-[11px] text-blue-200 leading-snug w-full">
                        <div className="font-bold text-blue-800 dark:text-blue-400 mb-0.5 flex items-center gap-1"><Info className="w-3 h-3" /> If you wanna try exploiting...</div>
                        <span className="text-blue-900 dark:text-blue-200">
                          On a previous {memoryData.dayStr}, a similar state gave a profit of <span className="font-bold text-blue-900 dark:text-white">${memoryData.profit?.toFixed(0)}</span> and net reward of <span className="font-bold text-blue-900 dark:text-white">{memoryData.reward?.toFixed(0)} Pts</span> at the price per cup of <span className="font-bold text-blue-900 dark:text-white">${memoryData.price.toFixed(2)}</span>.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM: Action Button (Full Width) */}
                  <motion.button
                    whileHover={{ scale: (day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup) ? 1.01 : 1 }}
                    whileTap={{ scale: (day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup) ? 0.99 : 1 }}
                    onClick={handleStartDay}
                    disabled={day > 7 || !playerPrice || playerPrice < 1 || playerPrice > 10 || showPopup}
                    className={`w-full px-4 py-3 rounded-xl text-white font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg mt-auto ${(day <= 7 && playerPrice >= 1 && playerPrice <= 10 && !showPopup)
                      ? "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20"
                      : "bg-coffee-700 text-coffee-500 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <Play className="fill-current w-4 h-4 shrink-0" />
                    <span>Action: Set price for today</span>
                  </motion.button>
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
                      className={`p-4 rounded-xl border flex flex-col h-full shadow-2xl relative overflow-hidden ${feedback.color === 'emerald'
                        ? (theme === 'theme-latte' ? 'border-emerald-300 bg-emerald-100' : 'border-emerald-500/50 bg-emerald-950')
                        : feedback.color === 'red'
                          ? (theme === 'theme-latte' ? 'border-red-300 bg-red-100' : 'border-red-500/50 bg-red-950')
                          : (theme === 'theme-latte' ? 'border-blue-300 bg-blue-100' : 'border-blue-500/50 bg-blue-950')
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
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 border bg-amber-100/95 border-amber-300 text-amber-900 shadow-md dark:bg-amber-500/25 dark:border-amber-400/40 dark:text-amber-100">
                                <div className="flex items-center gap-1">
                                  <Coffee className="w-3 h-3" />
                                  <span className="text-sm font-black leading-none">{feedback.playerSales}</span>
                                </div>
                                <span className="text-[7px] uppercase tracking-widest mt-1 leading-none opacity-85">Sold</span>
                              </div>
                              <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 border bg-emerald-100/95 border-emerald-300 text-emerald-900 shadow-md dark:bg-emerald-500/25 dark:border-emerald-400/40 dark:text-emerald-100">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-sm font-black leading-none">{feedback.value.toFixed(2)}</span>
                                </div>
                                <span className="text-[7px] uppercase tracking-widest mt-1 leading-none opacity-85">Profit</span>
                              </div>
                              <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 border bg-violet-100/95 border-violet-300 text-violet-900 shadow-md dark:bg-violet-500/25 dark:border-violet-400/40 dark:text-violet-100">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-sm font-black leading-none">{(feedback.playerReward ?? 0).toFixed(1)}</span>
                                </div>
                                <span className="text-[7px] uppercase tracking-widest mt-1 leading-none opacity-85">Net Reward</span>
                              </div>
                              {feedback.showZeroMarginInsight && (
                                <div className={`max-w-[240px] rounded-lg border border-red-500/40 px-2 py-1.5 shadow-md ${theme === 'theme-latte' ? 'bg-red-100 text-red-900' : 'bg-red-900/30 text-red-100'}`}>
                                  <div className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-3 h-3 text-red-300 shrink-0 mt-0.5" />
                                    <p className="text-[8px] leading-snug">
                                      Since the cost per cup is $1.00 and you priced coffee at $1.00, this day ends with zero profit.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
                      <p className="text-coffee-600 text-[10px] mt-1 px-8">Insights and Reinforcement Learning concepts will appear here once the shop opens.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
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
      {
        pendingWeeklyStats && (
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
          />
        )
      }
    </div >
  );
};

export default Tutorial;
