import React, { useState, useMemo } from 'react';
import { Trophy, BarChart3, TrendingUp, Presentation, Lightbulb, ArrowRight, TableProperties, Sun, Moon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfitChart from './ProfitChart';

const ENDGAME_GRAPH_TABS = [
    { id: 'Combined', label: 'Profit' },
    { id: 'Rewards', label: 'Rewards' },
    { id: 'RLRewards', label: 'RL Rewards' },
    { id: 'Secondary', label: 'History' },
];
const ENDGAME_GRAPH_TAB_STYLES = {
    Combined: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm',
    Rewards: 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-sm',
    RLRewards: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-sm',
    Secondary: 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm',
};
const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const roundInventoryDownToHundred = (value) => Math.floor(value / 100) * 100;
const roundInventoryUpToHundred = (value) => Math.ceil(value / 100) * 100;

const formatInventoryRange = (minInventory, maxInventory) => {
    if (minInventory === null || maxInventory === null) {
        return { label: 'N/A', approximate: false };
    }

    if (minInventory === maxInventory) {
        return {
            label: `${roundInventoryDownToHundred(minInventory)}`,
            approximate: true,
        };
    }

    return {
        label: `${roundInventoryDownToHundred(minInventory)} - ${roundInventoryUpToHundred(maxInventory)}`,
        approximate: false,
    };
};

const EndGameModal = ({ isOpen, history, theme, toggleTheme, shopName = "You", onBackToWeeklyReport, onShowPolicyPage }) => {
    const [activeEndgameChartView, setActiveEndgameChartView] = useState(null);
    const hasRenderableHistory = Boolean(history && history.length >= 2);

    const finalRecord = hasRenderableHistory ? history[history.length - 1] : null;
    const {
        playerRevenue = 0,
        mlRevenue = 0,
        rlRevenue = 0,
        playerTotalSales = 0,
        mlTotalSales = 0,
        rlTotalSales = 0,
    } = finalRecord || {};

    // Since penalties are calculated weekly, we sum them up across the entire history
    const totalPlayerPenalty = (history || []).reduce((sum, r) => sum + (r.playerPenalty || 0), 0);
    const totalMlPenalty = (history || []).reduce((sum, r) => sum + (r.mlPenalty || 0), 0);
    const totalRlPenalty = (history || []).reduce((sum, r) => sum + (r.rlPenalty || 0), 0);
    // Calculate total starting stock over 4 weeks
    const totalCupsStock = 20000;

    // Calculate raw left-over cups at the very end
    const playerRemaining = totalCupsStock - playerTotalSales;
    const mlRemaining = totalCupsStock - mlTotalSales;
    const rlRemaining = totalCupsStock - rlTotalSales;
    const winner = playerRevenue > rlRevenue && playerRevenue > mlRevenue ? shopName : (rlRevenue > mlRevenue ? 'RL Agent' : 'ML Agent');
    const delta = Math.abs(playerRevenue - rlRevenue).toFixed(2);

    const getFeedback = () => {
        if (winner === shopName) {
            return "Outstanding execution! You intuitively grasped the market shock dynamics better than the mathematical models. You perfectly balanced undercutting the competitor without sacrificing margins on high-demand days.";
        }
        if (winner === 'RL Agent') {
            return `The Reinforcement Learning Agent outperformed you by $${delta}. The Reinforcement Learning Agent's pre-trained policy allowed it to aggressively slash prices on Rainy/Cloudy days to steal vital market share, while maximizing margins during local events. Try to be more fluid with your pricing next time!`;
        }
        return `The Machine Learning Agent outperformed you! It relied on static linear weights, which means you might have been pricing too emotionally or inconsistently. Keep an eye on the baseline weather multipliers during the simulation.`;
    };

    // Calculate Policy Summary for the modal
    const playerPolicyTable = useMemo(() => {
        const playerPolicyMap = {};
        (history || []).filter(h => h.day !== 'Start').forEach(record => {
            const stateKey = `${record.weather}_${record.nearbyEvent}_${record.competitorPresent}`;

            if (!playerPolicyMap[stateKey]) {
                playerPolicyMap[stateKey] = {
                    weather: record.weather,
                    event: record.nearbyEvent,
                    competitor: record.competitorPresent,
                    prices: [],
                    dayCounts: {},
                    startInventories: [],
                };
            }

            if (record.playerPrice) {
                playerPolicyMap[stateKey].prices.push(record.playerPrice);
            }
            if (record.dayName) {
                playerPolicyMap[stateKey].dayCounts[record.dayName] = (playerPolicyMap[stateKey].dayCounts[record.dayName] || 0) + 1;
            }
            if (Number.isFinite(record.startInventory)) {
                playerPolicyMap[stateKey].startInventories.push(record.startInventory);
            }
        });

        return Object.values(playerPolicyMap).map(state => {
            const minPrice = state.prices.length > 0 ? Math.min(...state.prices) : null;
            const maxPrice = state.prices.length > 0 ? Math.max(...state.prices) : null;
            const freqs = state.prices.reduce((acc, p) => {
                acc[p] = (acc[p] || 0) + 1;
                return acc;
            }, {});
            const distributionString = Object.entries(freqs)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([price, count]) => `$${Number(price).toFixed(2)} (${count}x)`)
                .join(', ');
            const groupedDays = Object.entries(state.dayCounts)
                .sort((a, b) => WEEKDAY_ORDER.indexOf(a[0]) - WEEKDAY_ORDER.indexOf(b[0]));
            const minInventory = state.startInventories.length > 0 ? Math.min(...state.startInventories) : null;
            const maxInventory = state.startInventories.length > 0 ? Math.max(...state.startInventories) : null;
            const inventoryDisplay = formatInventoryRange(minInventory, maxInventory);

            return {
                ...state,
                minPrice,
                maxPrice,
                dayDistributionString: groupedDays.length > 0
                    ? groupedDays.map(([dayName, count]) => `${dayName.slice(0, 2)} (${count}x)`).join(', ')
                    : 'N/A',
                inventoryRangeString: inventoryDisplay.label,
                inventoryIsApproximate: inventoryDisplay.approximate,
                distributionString,
                count: state.prices.length
            };
        }).sort((a, b) => b.count - a.count);
    }, [history]);

    if (!isOpen || !hasRenderableHistory) return null;
 
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden ${theme}`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-coffee-900 text-coffee-100 border border-coffee-700/50 p-1 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl relative flex flex-col"
            >
                <div className="absolute inset-0 pointer-events-none bg-amber-900 bg-doodle-mask opacity-[0.05] mix-blend-luminosity z-0" />

                <div className="relative z-10 p-8 flex flex-col items-center w-full">

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="absolute top-4 right-4 p-3 bg-coffee-800 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700 transition-all text-coffee-200"
                    >
                        {theme === 'theme-latte' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </button>

                    <div className="w-full mb-6 text-center">
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-500 mb-2">
                            Endgame Debrief
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-coffee-100">
                            Final Performance Summary
                        </h1>
                        <p className="text-coffee-400 mt-2 text-sm md:text-base">
                            A complete comparison of your pricing performance against the benchmark agents.
                        </p>
                    </div>

                    {/* Top Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-4">
                        {/* Player */}
                        <div className={`p-4 rounded-xl border ${winner === shopName ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.22)]' : 'bg-coffee-800/50 border-coffee-700'}`}>
                            <div className="text-sm font-bold mb-1 text-center truncate text-emerald-700 dark:text-emerald-400" title={shopName}>{shopName}</div>
                            <div className="text-3xl font-mono font-bold text-center mb-2 text-emerald-700 dark:text-emerald-400">${playerRevenue.toFixed(0)}</div>
                            <div className="text-xs text-coffee-500 dark:text-coffee-300 text-center mb-2">{playerTotalSales} cups sold</div>
                            <div className="text-[10px] text-red-600 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-950/30 rounded py-1 px-2 border border-red-200 dark:border-red-900/50 flex flex-col items-center">
                                <span>Cups wasted = {playerRemaining}</span>
                                <span>Penalty for wastage = -${totalPlayerPenalty.toFixed(2)}</span>
                            </div>
                        </div>
                        {/* ML */}
                        <div className={`p-4 rounded-xl border ${winner === 'ML Agent' ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500' : 'bg-coffee-800/50 border-coffee-700'}`}>
                            <div className={`text-sm font-bold mb-1 text-center ${winner === 'ML Agent' ? 'text-blue-700 dark:text-blue-400' : 'text-blue-400'}`}>ML Agent</div>
                            <div className={`text-3xl font-mono font-bold text-center mb-2 ${winner === 'ML Agent' ? 'text-blue-700 dark:text-blue-400' : 'text-coffee-100'}`}>${mlRevenue.toFixed(0)}</div>
                            <div className="text-xs text-coffee-500 dark:text-coffee-300 text-center mb-2">{mlTotalSales} cups sold</div>
                            <div className="text-[10px] text-red-600 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-950/30 rounded py-1 px-2 border border-red-200 dark:border-red-900/50 flex flex-col items-center">
                                <span>Cups wasted = {mlRemaining}</span>
                                <span>Penalty for wastage = -${totalMlPenalty.toFixed(2)}</span>
                            </div>
                        </div>
                        {/* RL */}
                        <div className="p-4 rounded-xl border relative overflow-hidden bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-500">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                            <div className="text-sm font-bold mb-1 text-center text-orange-700 dark:text-orange-400">RL Agent</div>
                            <div className="text-3xl font-mono font-bold text-center mb-2 text-orange-700 dark:text-orange-400">${rlRevenue.toFixed(0)}</div>
                            <div className="text-xs text-coffee-500 dark:text-coffee-300 text-center mb-2">{rlTotalSales} cups sold</div>
                            <div className="text-[10px] text-red-600 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-950/30 rounded py-1 px-2 border border-red-200 dark:border-red-900/50 flex flex-col items-center">
                                <span>Cups wasted = {rlRemaining}</span>
                                <span>Penalty for wastage = -${totalRlPenalty.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RL Feedback */}
                    <div className="bg-coffee-800/50 p-6 rounded-xl border border-coffee-700/50 backdrop-blur-sm w-full mb-6 text-left shadow-inner">
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-coffee-100">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                            Performance Analysis Summary
                        </h3>
                        <p className="text-coffee-300 text-base leading-relaxed">
                            {getFeedback()}
                        </p>
                    </div>

                    <div className="w-full mb-6 bg-coffee-950/50 border border-coffee-800 rounded-xl overflow-hidden">
                        <div className="p-4 bg-coffee-900/60 border-b border-coffee-800">
                            <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
                                <div className="text-sm font-bold text-coffee-100">Performance Graphs</div>
                                <div className="text-xs text-coffee-400">
                                    Pick a view below. Clicking the active toggle again closes the graph panel.
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {ENDGAME_GRAPH_TABS.map((tab) => {
                                    const isActive = activeEndgameChartView === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveEndgameChartView((current) => (current === tab.id ? null : tab.id))}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                                isActive
                                                    ? ENDGAME_GRAPH_TAB_STYLES[tab.id]
                                                    : 'bg-coffee-900/50 text-coffee-300 hover:text-coffee-100 border-coffee-700/60'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {activeEndgameChartView && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 border-t border-coffee-800 h-[560px]">
                                        <ProfitChart
                                            data={history}
                                            showRLAgents={true}
                                            enableWeeklyRlRewardsToggle={true}
                                            forcedViewMode={activeEndgameChartView}
                                            hideInternalViewToggles={true}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-full flex flex-col mb-6 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden">
                        <div className="p-4 bg-coffee-900/50 border-b border-coffee-700">
                            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                <TableProperties className="w-5 h-5" />
                                Pricing Policy Summary
                            </h3>
                            <p className="text-xs text-coffee-400 mt-1">A summary of the price ranges you used across the market states encountered in the simulation.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-coffee-200">
                                <thead className="bg-coffee-900/30 text-coffee-400 uppercase text-[10px] sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Weather</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Day(s)</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Start Inventory</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Local Event</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Competitor</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-right whitespace-nowrap">Your Price Range</th>
                                        <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-right whitespace-nowrap">Distribution</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-coffee-700/50">
                                    {playerPolicyTable.length > 0 ? (
                                        playerPolicyTable.map((state, idx) => (
                                            <tr key={idx} className="hover:bg-coffee-700/20 transition-colors">
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <span className={`font-medium px-2 py-1 rounded bg-coffee-900 border border-coffee-700 ${state.weather === 'Sunny' ? 'text-amber-400' : 'text-blue-300'}`}>
                                                        {state.weather}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-left text-xs text-coffee-300 whitespace-nowrap">
                                                    {state.dayDistributionString}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono text-xs text-coffee-300 whitespace-nowrap">
                                                    <span>{state.inventoryIsApproximate ? `~${state.inventoryRangeString}` : state.inventoryRangeString}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {state.event ? (
                                                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">Yes</span>
                                                    ) : (
                                                        <span className="text-coffee-500 text-xs">No</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {state.competitor ? (
                                                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">Yes</span>
                                                    ) : (
                                                        <span className="text-coffee-500 text-xs">No</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-coffee-400 text-xs whitespace-nowrap">
                                                    {state.minPrice === state.maxPrice
                                                        ? `$${state.minPrice.toFixed(2)}`
                                                        : `$${state.minPrice.toFixed(2)} - $${state.maxPrice.toFixed(2)}`}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-amber-400 text-[11px] leading-relaxed max-w-[140px] truncate hover:whitespace-normal hover:break-all">
                                                    {state.distributionString}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-coffee-500 italic">No pricing entries found yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center w-full gap-4 mt-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBackToWeeklyReport}
                            className="bg-coffee-700 hover:bg-coffee-600 text-coffee-100 font-bold py-3 px-8 rounded-xl border border-coffee-600 transition-all flex items-center gap-2 text-base"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                            Back to Week 4 Report
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onShowPolicyPage(true)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 text-base"
                        >
                            Next: view the actual policy table
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default EndGameModal;
