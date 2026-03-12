import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, AlertCircle, Sun, Moon, TableProperties } from 'lucide-react';
import ProfitChart from './ProfitChart';
import { rlAgent } from '../logic/RLAgent';
import { WASTAGE_COST_PER_CUP } from '../logic/MarketEngine';

const WeeklyReportModal = ({ isOpen, weekNumber, data, onContinue, onBackToTutorial, theme, toggleTheme, shopName = "You", isTutorial = false, weekHistoryData = [] }) => {
  if (!isOpen) return null;

  // data = { playerTotal, mlTotal, rlTotal, playerSales, mlSales, rlSales } for the week
  // User Requested: Don't show the user the RL and competitor prices/reports.

  // 1. Build Policy Map from this week's history
  const policyMap = {};
  weekHistoryData.filter(h => h.day !== 'Start').forEach(record => {
    // Only process days where a player actually played/priced
    if (!record.playerPrice) return;

    const stateKey = `${record.weather}_${record.nearbyEvent}_${record.competitorPresent}`;

    if (!policyMap[stateKey]) {
      policyMap[stateKey] = {
        weather: record.weather,
        event: record.nearbyEvent,
        competitor: record.competitorPresent,
        playerPrices: [],
        rlPrices: []
      };
    }

    policyMap[stateKey].playerPrices.push(record.playerPrice);
    if (!isTutorial && record.rlPrice) {
      policyMap[stateKey].rlPrices.push(record.rlPrice);
    }
  });

  const policyTable = Object.values(policyMap).map(state => {
    const playerMin = state.playerPrices.length > 0 ? Math.min(...state.playerPrices) : null;
    const playerMax = state.playerPrices.length > 0 ? Math.max(...state.playerPrices) : null;

    let rlMin = null, rlMax = null;
    if (!isTutorial && state.rlPrices.length > 0) {
      rlMin = Math.min(...state.rlPrices);
      rlMax = Math.max(...state.rlPrices);
    }

    return {
      ...state,
      playerRangeStr: playerMin === playerMax ? `$${playerMin?.toFixed(2)}` : `$${playerMin?.toFixed(2)} - $${playerMax?.toFixed(2)}`,
      rlRangeStr: rlMin === null ? "Fetching..." : (rlMin === rlMax ? `$${rlMin?.toFixed(2)}` : `$${rlMin?.toFixed(2)} - $${rlMax?.toFixed(2)}`),
      count: state.playerPrices.length
    };
  });

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden ${theme}`}>
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/40 rounded-full blur-[120px] animate-blob [animation-delay:2s] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-coffee-900 border border-coffee-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-coffee-900 p-6 border-b border-coffee-700 relative">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award className="text-yellow-400 w-8 h-8" />
              Week {weekNumber} Report
            </h2>
            <p className="text-blue-200 mt-2">Performance Summary (Days {(weekNumber - 1) * 7 + 1} - {weekNumber * 7})</p>

            <button
              onClick={toggleTheme}
              className="absolute top-6 right-6 p-2 bg-coffee-800 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700 transition-all text-coffee-200"
            >
              {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">


            {/* Comparison Grid (Player vs ML Only) */}
            <div className={`grid gap-4 text-center grid-cols-1 ${!isTutorial ? 'md:grid-cols-2' : ''} max-w-2xl mx-auto`}>
              {/* Player */}
              <div className="bg-coffee-800 p-5 rounded-lg border-2 border-amber-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="text-amber-600 dark:text-amber-500 font-bold mb-2 text-lg truncate" title={shopName}>{isTutorial ? "Your Perfomance" : shopName}</div>
                <div className="text-3xl font-mono text-coffee-50 dark:text-white mb-2">${data.playerTotal.toFixed(0)}</div>
                <div className="text-sm text-coffee-500 dark:text-coffee-300 mb-2">{data.playerSales} cups sold</div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-950/30 rounded py-2 px-3 mt-3 border border-red-200 dark:border-red-900/50 leading-relaxed text-left flex flex-col gap-1">
                  <div className="flex justify-between font-bold">
                    <span>Wastage Penalty:</span>
                    <span>-${data.playerPenalty?.toFixed(2) || '0.00'}</span>
                  </div>
                  <span className="text-[10px] text-red-500/80 leading-tight">{`(${data.playerInventoryLeft} cups left over at the end of the week x $${WASTAGE_COST_PER_CUP.toFixed(2)} wastage fee)`}</span>
                </div>
              </div>

              {/* ML Agent - Hide in Tutorial */}
              {!isTutorial && (
                <div className="bg-coffee-800 p-5 rounded-lg border border-coffee-700/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500/10 rounded-br-full -ml-8 -mt-8"></div>
                  <div className="text-blue-700 dark:text-blue-400 font-bold mb-2 text-lg">ML Agent</div>
                  <div className="text-3xl font-mono text-coffee-50 dark:text-white mb-2">${data.mlTotal.toFixed(0)}</div>
                  <div className="text-sm text-coffee-500 dark:text-coffee-300 mb-2">{data.mlSales} cups sold</div>
                  <div className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-950/30 rounded py-2 px-3 mt-3 border border-red-200 dark:border-red-900/50 leading-relaxed text-left flex flex-col gap-1">
                    <div className="flex justify-between font-bold">
                      <span>Wastage Penalty:</span>
                      <span>-${data.mlPenalty?.toFixed(2) || '0.00'}</span>
                    </div>
                    <span className="text-[10px] text-red-500/80 leading-tight">{`(${data.mlInventoryLeft} cups left over at the end of the week x $${WASTAGE_COST_PER_CUP.toFixed(2)} wastage fee)`}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shared Chart rendering for Week Data */}
            {isTutorial && weekHistoryData.length > 0 && (
              <div className="bg-coffee-950/50 border border-coffee-800 rounded-xl p-4 h-[300px]">
                <ProfitChart data={weekHistoryData} showRLAgents={false} showMLAgent={false} shopName={shopName} />
              </div>
            )}

            {/* Policy Summary Table for the week */}
            {policyTable.length > 0 && (
              <div className="w-full flex flex-col mb-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden mt-8">
                <div className="p-4 bg-coffee-900/50 border-b border-coffee-700">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <TableProperties className="w-5 h-5" />
                    Week {weekNumber} Pricing Policy Summary
                  </h3>
                  <p className="text-xs text-coffee-400 mt-1">Review your exact prices during the market states encountered this week vs the Reinforcement Learning agent pricing system</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-coffee-200">
                    <thead className="bg-coffee-900/30 text-coffee-400 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="px-3 py-3 font-bold border-b border-coffee-700 text-left">Weather</th>
                        <th className="px-3 py-3 font-bold border-b border-coffee-700 text-center">Event</th>
                        <th className="px-3 py-3 font-bold border-b border-coffee-700 text-center">Competitor</th>
                        <th className="px-3 py-3 font-bold border-b border-coffee-700 text-center text-amber-400">Your Range</th>
                        {!isTutorial && (
                          <th className="px-3 py-3 font-bold border-b border-coffee-700 text-center text-emerald-400">Reinforcement Learning Agent's Mastered Price</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coffee-700/50">
                      {policyTable.sort((a, b) => b.count - a.count).map((state, idx) => (
                        <tr key={idx} className="hover:bg-coffee-700/20 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`font-medium px-2 py-1 rounded bg-coffee-900 border border-coffee-700 ${state.weather === 'Sunny' ? 'text-amber-400' : 'text-blue-300'}`}>
                              {state.weather}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {state.event ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">Yes</span>
                            ) : (
                              <span className="text-coffee-500 text-[10px]">No</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {state.competitor ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">Yes</span>
                            ) : (
                              <span className="text-coffee-500 text-[10px]">No</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-amber-400 font-bold bg-amber-500/5">
                            {state.playerRangeStr}
                          </td>
                          {!isTutorial && (
                            <td className="px-3 py-3 text-center font-mono text-emerald-400 font-bold bg-emerald-500/5">
                              {state.rlRangeStr}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-coffee-950 flex gap-4 justify-end">
            {isTutorial && onBackToTutorial && (
              <button
                onClick={onBackToTutorial}
                className="bg-transparent hover:bg-coffee-800 text-coffee-400 hover:text-white px-6 py-3 rounded-lg font-bold border border-coffee-700 transition-colors"
              >
                Back to Orientation
              </button>
            )}
            <button
              onClick={onContinue}
              className="bg-amber-500 hover:bg-amber-400 text-coffee-900 px-8 py-3 rounded-lg font-bold shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
            >
              {isTutorial ? "Proceed" : (weekNumber === 4 ? "Show the month end results of all agents" : `Continue to Week ${weekNumber + 1}`)}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WeeklyReportModal;
