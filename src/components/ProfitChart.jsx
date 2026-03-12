import React, { useState } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar, CloudSun, CloudRain, Sun, Star, Store, Package, Coffee, DollarSign, Coins, Check, X, Award, AlertCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, viewMode, shopName, showRLAgents, showMLAgent, hideRLLine, hideRLRewardLine }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // The raw data object for this day

        const renderAgentInfo = (prefix, name, color) => {
            const dailySales = data[`${prefix}Sales`] || 0;
            const totalSales = data[`${prefix}TotalSales`] || 0;
            const dailyProfit = data[`${prefix}DailyProfit`] || 0;
            const totalProfit = (prefix === 'player' ? data.playerProfit : data[`${prefix}Profit`]) || 0;
            const dailyReward = data[`${prefix}DailyReward`] || 0;
            const totalReward = data[`${prefix}Reward`] || 0;

            if (viewMode === 'Rewards') {
                if (prefix === 'ml') return null; // No ML reward
                if (prefix === 'rl' && hideRLRewardLine) return null;
                const rewardColor = prefix === 'player' ? '#a855f7' : color;
                return (
                    <div className="mb-3 last:mb-0 border-b last:border-0 border-coffee-700 pb-2 last:pb-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                            <span style={{ color: rewardColor }} className="font-bold">{prefix === 'player' ? 'Your' : `${name}'s`} Reward</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-xs text-coffee-400">
                            <div className="flex justify-between">
                                <span>Reward on this day:</span>
                                <span className="text-coffee-200">{dailyReward.toFixed(1)} Pts</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cumulative Reward:</span>
                                <span className="text-coffee-200">{totalReward.toFixed(1)} Pts</span>
                            </div>
                        </div>
                    </div>
                );
            }

            // In Combined (Overview) view, hide RL if hideRLLine is true
            if (viewMode === 'Combined' && prefix === 'rl' && hideRLLine) return null;

            return (
                <div className="mb-3 last:mb-0 border-b last:border-0 border-coffee-700 pb-2 last:pb-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <span style={{ color }} className="font-bold">{name}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs text-coffee-400">
                        <div className="flex justify-between gap-4">
                            <span>Cups sold on that day:</span>
                            <span className="text-coffee-200 font-mono">{dailySales} units</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Cumulative cups sold:</span>
                            <span className="text-coffee-200 font-mono">{totalSales} units</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Profit of that Day:</span>
                            <span className="text-coffee-200 font-mono">${dailyProfit.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Cumulative Profit:</span>
                            <span className="text-coffee-200 font-mono">${totalProfit.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="bg-coffee-800 p-3 border border-coffee-700 rounded-lg shadow-xl text-sm z-50 min-w-[240px]">
                <p className="text-coffee-200 font-bold mb-2">{label}</p>
                {renderAgentInfo('player', 'You', '#10b981')}
                {showMLAgent && (showRLAgents || data.mlSales !== undefined) && renderAgentInfo('ml', 'ML Agent', '#3b82f6')}
                {showRLAgents && renderAgentInfo('rl', 'RL Agent', '#f97316')}
            </div>
        );
    }
    return null;
};

const ProfitChart = ({ data, showRLAgents = true, showMLAgent = true, shopName = "You", hideRLLine = false, hideMLReward = false, enableRewardsView, hideRLRewardLine = false }) => {
    const [viewMode, setViewMode] = useState('Combined'); // 'Combined' or 'Secondary'
    const canShowRewardsView = enableRewardsView ?? showRLAgents;

    // Calculate total columns for formatting the divider row
    const totalColumns = 10;

    return (
        <div className="bg-coffee-800 p-4 md:p-6 rounded-xl border border-coffee-700 shadow-lg h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex-1">
                    {viewMode === 'Combined' ? (
                        <h2 className="text-base md:text-lg font-bold flex items-center gap-x-1.5 whitespace-nowrap">
                            <span className="text-coffee-100">Performance Overview:</span>
                            <span className="text-emerald-400">Profit</span>
                            <span className="text-coffee-400 text-sm font-medium">and</span>
                            <span className="text-amber-400">Cups sold</span>
                        </h2>
                    ) : viewMode === 'Rewards' ? (
                        <h2 className="text-base md:text-lg font-bold flex items-center gap-x-1.5 whitespace-nowrap">
                            <span className="text-coffee-100">Deep RL Metrics:</span>
                            <span className="text-purple-400">NetRewards = Rewards - Penalties</span>
                        </h2>
                    ) : (
                        <div>
                            <h2 className="text-lg font-bold text-coffee-100">Daily Ledger & Market Data</h2>
                            <p className="text-[10px] text-coffee-400 mt-0.5">
                                Hint: Hover over the table header icons to see the full column titles.
                            </p>
                        </div>
                    )}
                </div>

                {/* Toggle - Kept for future expandability */}
                <div className="flex bg-coffee-900/50 rounded-lg p-1 border border-coffee-700/50 shrink-0">
                    <button
                        onClick={() => setViewMode('Combined')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Combined' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                    >
                        Overview
                    </button>
                    {canShowRewardsView && (
                        <button
                            onClick={() => setViewMode('Rewards')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Rewards' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                        >
                            Rewards
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('Secondary')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Secondary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="flex-grow min-h-0 flex flex-col">
                <div className="flex-1 w-full min-h-[150px] relative">
                    {viewMode === 'Rewards' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={data}
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />

                                {/* Left Y-Axis for daily net reward */}
                                <YAxis
                                    yAxisId="left"
                                    stroke="#a855f7"
                                    tick={{ fill: '#a855f7', fontSize: 10 }}
                                    label={{ value: 'Daily Net Reward ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#a855f7', fontSize: 10 }}
                                />

                                <Tooltip content={<CustomTooltip viewMode={viewMode} shopName={shopName} showRLAgents={showRLAgents} showMLAgent={showMLAgent} hideRLLine={hideRLLine} hideRLRewardLine={hideRLRewardLine} />} />

                                {/* Grouped bars for daily net rewards */}
                                <Bar
                                    yAxisId="left"
                                    dataKey="playerDailyReward"
                                    name="Your Net Reward"
                                    fill="#a855f7"
                                    fillOpacity={0.85}
                                    radius={[3, 3, 0, 0]}
                                    barSize={16}
                                />

                                {showRLAgents && !hideRLRewardLine && (
                                    <>
                                        <Bar
                                            yAxisId="left"
                                            dataKey="rlDailyReward"
                                            name="RL Agent Net Reward"
                                            fill="#f97316"
                                            fillOpacity={0.65}
                                            radius={[3, 3, 0, 0]}
                                            barSize={16}
                                        />
                                    </>
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : viewMode === 'Combined' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={data}
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />

                                {/* Left Y-Axis for Profit */}
                                <YAxis
                                    yAxisId="left"
                                    stroke="#10b981"
                                    tick={{ fill: '#10b981', fontSize: 10 }}
                                    label={{ value: 'Cumulative Profit ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#10b981', fontSize: 10 }}
                                />

                                {/* Right Y-Axis for Sales */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#f59e0b"
                                    tick={{ fill: '#f59e0b', fontSize: 10 }}
                                    label={{ value: 'Cups Sold', angle: 90, position: 'insideRight', offset: 0, fill: '#f59e0b', fontSize: 10 }}
                                />

                                <Tooltip content={<CustomTooltip viewMode={viewMode} shopName={shopName} showRLAgents={showRLAgents} showMLAgent={showMLAgent} hideRLLine={hideRLLine} hideRLRewardLine={hideRLRewardLine} />} />

                                {/* Cups Sold as Bars */}
                                <Bar
                                    yAxisId="right"
                                    dataKey="playerSales"
                                    name="Cups Sold"
                                    fill="#f59e0b"
                                    fillOpacity={0.3}
                                    radius={[2, 2, 0, 0]}
                                    barSize={30}
                                />

                                {/* Profit as Line */}
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="playerProfit"
                                    name="Profit"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ fill: '#064e3b', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                />

                                {showMLAgent && (
                                    <>
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="mlProfit"
                                            name="ML Agent Profit"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                        {!hideRLLine && (
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="rlProfit"
                                                name="RL Agent Profit"
                                                stroke="#f97316"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                                opacity={0.5}
                                            />
                                        )}
                                    </>
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar bg-coffee-800 rounded-lg border border-coffee-700/50">
                            <table className="w-full text-left text-xs text-coffee-200 table-fixed">
                                <thead className="sticky top-0 bg-coffee-800 z-10 border-b border-coffee-700">
                                    <tr>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Calendar className="w-4 h-4 mx-auto text-coffee-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Day</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <CloudSun className="w-4 h-4 mx-auto text-blue-300" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Weather</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Star className="w-4 h-4 mx-auto text-yellow-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Local Event</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Store className="w-4 h-4 mx-auto text-red-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Competitor Present</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Package className="w-4 h-4 mx-auto text-orange-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Start Inventory</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Coffee className="w-4 h-4 mx-auto text-amber-600" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Cups Sold</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <DollarSign className="w-4 h-4 mx-auto text-emerald-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Price Chosen ($)</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Coins className="w-4 h-4 mx-auto text-yellow-500" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Profit Made ($)</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Award className="w-4 h-4 mx-auto text-purple-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Reward ($)</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <AlertCircle className="w-4 h-4 mx-auto text-red-500" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Penalty ($)</div>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.filter(d => d.day !== 'Start').map((row, idx) => (
                                        <React.Fragment key={idx}>
                                            {/* Week Divider */}
                                            {idx % 7 === 0 && (
                                                <tr>
                                                    <td colSpan={totalColumns} className="text-center text-coffee-400/60 font-mono text-[10px] uppercase tracking-widest py-1.5 border-b border-coffee-700/50 border-dashed bg-coffee-800/30">
                                                        -------Week {Math.floor(idx / 7) + 1}-------
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="border-b border-coffee-700/30 hover:bg-coffee-700/20 transition-colors">
                                                <td className="p-2 text-center font-mono">{row.day?.replace('Day ', '')}</td>
                                                <td className="p-2 text-center">
                                                    {row.weather === 'Sunny' ? <Sun className="w-4 h-4 mx-auto text-amber-500" /> :
                                                        row.weather === 'Rainy' ? <CloudRain className="w-4 h-4 mx-auto text-blue-400" /> :
                                                            <CloudSun className="w-4 h-4 mx-auto text-gray-400" />}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {row.nearbyEvent ? <Check className="w-4 h-4 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto text-red-500/50" />}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {row.competitorPresent ? <Check className="w-4 h-4 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto text-red-500/50" />}
                                                </td>
                                                <td className="p-2 text-center font-mono">{row.startInventory ?? '-'}</td>
                                                <td className="p-2 text-center font-mono text-amber-500">{row.playerSales}</td>
                                                <td className="p-2 text-center font-mono text-emerald-400">${row.playerPrice?.toFixed(2)}</td>
                                                <td className="p-2 text-center font-mono font-bold text-yellow-500">${row.playerDailyProfit?.toFixed(2)}</td>
                                                <td className="p-2 text-center font-mono text-purple-400">{row.playerDailyRewardPoints?.toFixed(1) || row.playerDailyReward?.toFixed(1) || '0'}</td>
                                                <td className="p-2 text-center font-mono text-red-500">{row.playerDailyPenaltyPoints?.toFixed(1) || '0.0'}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    {data.filter(d => d.day !== 'Start').length === 0 && (
                                        <tr>
                                            <td colSpan={totalColumns} className="p-8 text-center text-coffee-500 italic">No data available yet. Open the shop to see results!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfitChart;
