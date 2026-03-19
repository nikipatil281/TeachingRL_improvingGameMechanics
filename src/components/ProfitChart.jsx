import React, { useState } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter
} from 'recharts';
import { Calendar, CloudSun, CloudRain, Sun, Star, Store, Coffee, DollarSign, Coins, Check, X, Award, AlertCircle } from 'lucide-react';

const ZeroLineAxisTick = ({ cx, cy, payload }) => {
    if (!payload?.showZeroLineLabel) {
        return null;
    }

    return (
        <g transform={`translate(${cx},${cy})`} pointerEvents="none">
            <line x1={0} y1={0} x2={0} y2={6} stroke="#9ca3af" strokeWidth={1} />
            <text x={0} y={18} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                {payload.day}
            </text>
        </g>
    );
};

const getNiceStep = (roughStep, minimumStep = 10) => {
    const normalizedRough = Math.max(minimumStep, roughStep);
    const magnitude = 10 ** Math.floor(Math.log10(normalizedRough));
    const normalized = normalizedRough / magnitude;

    if (normalized <= 1) return 1 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 2.5) return 2.5 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
};

const buildNiceDomain = (minValue, maxValue, targetSteps = 4) => {
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 0;

    if (safeMin === safeMax) {
        const fallbackStep = getNiceStep(Math.abs(safeMax || 10));
        return {
            min: Math.min(0, safeMin - fallbackStep),
            max: safeMax + fallbackStep,
            step: fallbackStep,
        };
    }

    const step = getNiceStep((safeMax - safeMin) / targetSteps);
    return {
        min: Math.floor(safeMin / step) * step,
        max: Math.ceil(safeMax / step) * step,
        step,
    };
};

const buildRewardTicksFromDomain = (minValue, maxValue, minimumStep = 10) => {
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue === maxValue) {
        return [0];
    }

    const step = getNiceStep((maxValue - minValue) / 4, minimumStep);
    const startTick = Math.ceil(minValue / step) * step;
    const endTick = Math.floor(maxValue / step) * step;
    const ticks = [];

    for (let value = startTick; value <= endTick; value += step) {
        ticks.push(value);
    }

    if (!ticks.includes(0) && minValue < 0 && maxValue > 0) {
        ticks.push(0);
    }

    if (!ticks.includes(minValue)) {
        ticks.push(minValue);
    }

    if (!ticks.includes(maxValue)) {
        ticks.push(maxValue);
    }

    ticks.sort((a, b) => a - b);
    return [...new Set(ticks)];
};

const CustomTooltip = ({ active, payload, label, viewMode, showRLAgents, showMLAgent, hideRLLine, hideRLRewardLine, rewardFocusAgent = 'all' }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // The raw data object for this day

        const renderAgentInfo = (prefix, name, color) => {
            const dailySales = data[`${prefix}Sales`] || 0;
            const totalSales = data[`${prefix}TotalSales`] || 0;
            const dailyProfit = data[`${prefix}DailyGrossProfit`] || 0;
            const totalProfit = data[`${prefix}GrossProfit`] || 0;
            const dailyReward = data[`${prefix}DailyReward`] || 0;
            const totalReward = data[`${prefix}Reward`] || 0;

            if (viewMode === 'Rewards' || viewMode === 'RLRewards') {
                if (prefix === 'ml') return null; // No ML reward
                if (prefix === 'rl' && hideRLRewardLine) return null;
                if (rewardFocusAgent === 'rl' && prefix === 'player') return null;
                if (rewardFocusAgent === 'player' && prefix === 'rl') return null;
                const rewardColor = prefix === 'player' ? '#a855f7' : color;
                return (
                    <div className="mb-3 last:mb-0 border-b last:border-0 border-coffee-700 pb-2 last:pb-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                            <span style={{ color: rewardColor }} className="font-bold">{prefix === 'player' ? 'Your' : `${name}'s`} Reward</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-xs text-coffee-400">
                            <div className="flex justify-between">
                                <span>Reward for the day:</span>
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
                            <span>Cups sold:</span>
                            <span className="text-coffee-200 font-mono">{dailySales} units</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Cumulative cups sold:</span>
                            <span className="text-coffee-200 font-mono">{totalSales} units</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Profit:</span>
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
                {showMLAgent && (showRLAgents || data.mlSales !== undefined) && renderAgentInfo('ml', 'ML Agent', '#1d4ed8')}
                {showRLAgents && renderAgentInfo('rl', 'RL Agent', '#f97316')}
            </div>
        );
    }
    return null;
};

const ProfitChart = ({ data, showRLAgents = true, showMLAgent = true, hideRLLine = false, enableRewardsView, hideRLRewardLine = false, enableWeeklyRlRewardsToggle = false, forcedViewMode = null, hideInternalViewToggles = false }) => {
    const [internalViewMode, setInternalViewMode] = useState('Combined'); // 'Combined' or 'Rewards' or 'RLRewards' or 'Secondary'
    const viewMode = forcedViewMode ?? internalViewMode;
    const canShowRewardsView = enableRewardsView ?? showRLAgents;
    const visibleData = data.filter((row) => row.day !== 'Start');
    const rewardFocusAgent = viewMode === 'RLRewards' ? 'rl' : viewMode === 'Rewards' ? 'player' : 'all';
    const isRlRewardsView = viewMode === 'RLRewards';
    const rewardAxisLeftColor = isRlRewardsView ? '#ef4444' : '#a855f7';
    const rewardAxisRightColor = isRlRewardsView ? '#f59e0b' : '#f472b6';
    const rewardReferenceLineColor = isRlRewardsView ? '#fb7185' : '#c084fc';
    const activeRewardDailyKey = isRlRewardsView ? 'rlDailyReward' : 'playerDailyReward';
    const activeRewardCumulativeKey = isRlRewardsView ? 'rlReward' : 'playerReward';
    const shouldFloatRewardXAxis = visibleData.some((row) => Number(row[activeRewardDailyKey] ?? 0) < 0);
    const maxFloatingAxisLabels = visibleData.length <= 8 ? visibleData.length : 8;
    const floatingAxisStride = Math.max(1, Math.ceil(visibleData.length / maxFloatingAxisLabels));
    const rewardZeroLineData = visibleData.map((row, index) => ({
        ...row,
        zeroLineAnchor: 0,
        showZeroLineLabel:
            index === 0 ||
            index === visibleData.length - 1 ||
            index % floatingAxisStride === 0,
    }));
    const dailyRewardValues = visibleData.map((row) => Number(row[activeRewardDailyKey] ?? 0));
    const cumulativeRewardValues = visibleData.map((row) => Number(row[activeRewardCumulativeKey] ?? 0));
    const dailyRewardMin = dailyRewardValues.length ? Math.min(...dailyRewardValues, 0) : 0;
    const dailyRewardMax = dailyRewardValues.length ? Math.max(...dailyRewardValues, 0) : 0;
    const cumulativeRewardMin = cumulativeRewardValues.length ? Math.min(...cumulativeRewardValues, 0) : 0;
    const cumulativeRewardMax = cumulativeRewardValues.length ? Math.max(...cumulativeRewardValues, 0) : 0;
    const leftRewardDomain = shouldFloatRewardXAxis
        ? buildNiceDomain(dailyRewardMin, dailyRewardMax)
        : null;
    const standardLeftRewardDomain = buildNiceDomain(dailyRewardMin, dailyRewardMax);
    const leftRewardAxisDomain = leftRewardDomain
        ? [leftRewardDomain.min, leftRewardDomain.max]
        : [standardLeftRewardDomain.min, standardLeftRewardDomain.max];
    const leftRewardTicks = buildRewardTicksFromDomain(leftRewardAxisDomain[0], leftRewardAxisDomain[1]);
    let alignedCumulativeRewardDomain = ['auto', 'auto'];
    let roundedCumulativeRewardTicks = undefined;
    const standardCumulativeRewardDomain = buildNiceDomain(cumulativeRewardMin, cumulativeRewardMax);

    if (shouldFloatRewardXAxis && leftRewardDomain && leftRewardDomain.max > leftRewardDomain.min) {
        const zeroRatio = (0 - leftRewardDomain.min) / (leftRewardDomain.max - leftRewardDomain.min);

        if (zeroRatio > 0 && zeroRatio < 1) {
            const minDrivenMax = cumulativeRewardMin < 0
                ? ((-cumulativeRewardMin) * (1 - zeroRatio)) / zeroRatio
                : 0;
            const alignedMax = Math.max(cumulativeRewardMax, minDrivenMax, 1);
            const alignedMin = (-zeroRatio * alignedMax) / (1 - zeroRatio);
            alignedCumulativeRewardDomain = [alignedMin, alignedMax];
            roundedCumulativeRewardTicks = buildRewardTicksFromDomain(alignedMin, alignedMax);
        }
    }

    const rightRewardAxisDomain = roundedCumulativeRewardTicks
        ? alignedCumulativeRewardDomain
        : [standardCumulativeRewardDomain.min, standardCumulativeRewardDomain.max];
    const rightRewardTicks = roundedCumulativeRewardTicks
        ?? buildRewardTicksFromDomain(rightRewardAxisDomain[0], rightRewardAxisDomain[1]);

    // Calculate total columns for formatting the divider row
    const totalColumns = 12;

    return (
        <div className="bg-coffee-800 p-4 md:p-6 rounded-xl border border-coffee-700 shadow-lg h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex-1">
                    {viewMode === 'Combined' ? (
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-coffee-100">
                                Performance Overview
                            </h2>
                            <p className="text-[10px] md:text-xs mt-0.5">
                                <span className="text-emerald-400">Cumulative Profit</span>
                                <span className="text-coffee-400"> with </span>
                                <span className="text-sky-400">Daily Profit</span>
                                <span className="text-coffee-400"> and </span>
                                <span className="text-amber-400">Cups sold</span>
                            </p>
                        </div>
                    ) : viewMode === 'Rewards' || viewMode === 'RLRewards' ? (
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-coffee-100">
                                {viewMode === 'RLRewards' ? 'RL Reward Metrics' : 'Deep RL Metrics - Your NetRewards'}
                            </h2>
                            <p className="text-[10px] md:text-xs font-medium text-purple-400 mt-0.5">
                                {viewMode === 'RLRewards' ? "RL NetRewards = Rewards - Penalties" : 'NetRewards = Rewards - Penalties'}
                            </p>
                        </div>
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
                {!hideInternalViewToggles && (
                <div className="flex bg-coffee-900/50 rounded-lg p-1 border border-coffee-700/50 shrink-0">
                    <button
                        onClick={() => setInternalViewMode('Combined')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Combined' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                    >
                        Profit
                    </button>
                    {canShowRewardsView && (
                        <button
                            onClick={() => setInternalViewMode('Rewards')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Rewards' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                        >
                            Rewards
                        </button>
                    )}
                    {enableWeeklyRlRewardsToggle && (
                        <button
                            onClick={() => setInternalViewMode('RLRewards')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'RLRewards' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                        >
                            RL Rewards
                        </button>
                    )}
                    <button
                        onClick={() => setInternalViewMode('Secondary')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'Secondary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-coffee-400 hover:text-coffee-200 border border-transparent'}`}
                    >
                        History
                    </button>
                </div>
                )}
            </div>

            <div className="flex-grow min-h-0 flex flex-col">
                <div className="flex-1 w-full min-h-[150px] relative">
                    {viewMode === 'Rewards' || viewMode === 'RLRewards' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={visibleData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="#9ca3af"
                                    tick={shouldFloatRewardXAxis ? false : { fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={!shouldFloatRewardXAxis}
                                    tickLine={!shouldFloatRewardXAxis}
                                />

                                <YAxis
                                    yAxisId="left"
                                    stroke={rewardAxisLeftColor}
                                    interval={0}
                                    allowDecimals={false}
                                    tick={{ fill: rewardAxisLeftColor, fontSize: 10 }}
                                    domain={leftRewardAxisDomain}
                                    ticks={leftRewardTicks}
                                    tickFormatter={(value) => `${Math.round(value)}`}
                                    label={{
                                        value: viewMode === 'RLRewards' ? 'Daily RL Net Reward' : 'Daily Net Reward',
                                        angle: -90,
                                        position: 'insideLeft',
                                        offset: 0,
                                        fill: rewardAxisLeftColor,
                                        fontSize: 10,
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke={rewardAxisRightColor}
                                    interval={0}
                                    allowDecimals={false}
                                    tick={{ fill: rewardAxisRightColor, fontSize: 10 }}
                                    domain={rightRewardAxisDomain}
                                    ticks={rightRewardTicks}
                                    tickFormatter={(value) => `${Math.round(value)}`}
                                    label={{
                                        value: viewMode === 'RLRewards' ? 'Cumulative RL Net Reward' : 'Cumulative Net Reward',
                                        angle: 90,
                                        position: 'insideRight',
                                        offset: 0,
                                        fill: rewardAxisRightColor,
                                        fontSize: 10,
                                    }}
                                />

                                <ReferenceLine
                                    yAxisId="left"
                                    y={0}
                                    stroke={rewardReferenceLineColor}
                                    strokeWidth={1}
                                    strokeOpacity={0.85}
                                />

                                <Tooltip content={<CustomTooltip viewMode={viewMode} showRLAgents={showRLAgents} showMLAgent={showMLAgent} hideRLLine={hideRLLine} hideRLRewardLine={hideRLRewardLine} rewardFocusAgent={rewardFocusAgent} />} />

                                {shouldFloatRewardXAxis && (
                                    <Scatter
                                        yAxisId="left"
                                        data={rewardZeroLineData}
                                        dataKey="zeroLineAnchor"
                                        shape={(props) => <ZeroLineAxisTick {...props} />}
                                        isAnimationActive={false}
                                        legendType="none"
                                    />
                                )}

                                {rewardFocusAgent !== 'rl' && (
                                    <Bar
                                        yAxisId="left"
                                        dataKey="playerDailyReward"
                                        name="Your Net Reward"
                                        fill="#a855f7"
                                        fillOpacity={0.85}
                                        radius={[3, 3, 0, 0]}
                                        barSize={16}
                                    />
                                )}

                                {showRLAgents && !hideRLRewardLine && rewardFocusAgent !== 'player' && (
                                    <>
                                        <Bar
                                            yAxisId="left"
                                            dataKey="rlDailyReward"
                                            name="RL Agent Net Reward"
                                            fill="#ef4444"
                                            fillOpacity={0.65}
                                            radius={[3, 3, 0, 0]}
                                            barSize={16}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="rlReward"
                                            name="RL Agent Cumulative Net Reward"
                                            stroke="#fb923c"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    </>
                                )}
                                {rewardFocusAgent !== 'rl' && (
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="playerReward"
                                        name="Your Cumulative Net Reward"
                                        stroke="#f472b6"
                                        strokeWidth={3}
                                        dot={{ fill: '#831843', stroke: '#f472b6', strokeWidth: 2, r: 3 }}
                                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : viewMode === 'Combined' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={visibleData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />

                                <YAxis
                                    yAxisId="left"
                                    stroke="#38bdf8"
                                    tick={{ fill: '#38bdf8', fontSize: 10 }}
                                    label={{ value: 'Daily Profit ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#38bdf8', fontSize: 10 }}
                                />

                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#f59e0b"
                                    tick={{ fill: '#f59e0b', fontSize: 10 }}
                                    label={{ value: 'Cups Sold', angle: 90, position: 'insideRight', offset: 0, fill: '#f59e0b', fontSize: 10 }}
                                />
                                <YAxis yAxisId="profitCumulative" hide domain={['auto', 'auto']} />

                                <Tooltip content={<CustomTooltip viewMode={viewMode} showRLAgents={showRLAgents} showMLAgent={showMLAgent} hideRLLine={hideRLLine} hideRLRewardLine={hideRLRewardLine} />} />

                                <ReferenceLine
                                    yAxisId="left"
                                    y={0}
                                    stroke="#34d399"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.45}
                                />

                                <Bar
                                    yAxisId="left"
                                    dataKey="playerDailyGrossProfit"
                                    name="Daily Profit"
                                    fill="#38bdf8"
                                    fillOpacity={0.75}
                                    radius={[2, 2, 0, 0]}
                                    barSize={14}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="playerSales"
                                    name="Cups Sold"
                                    fill="#f59e0b"
                                    fillOpacity={0.45}
                                    radius={[2, 2, 0, 0]}
                                    barSize={14}
                                />

                                <Line
                                    yAxisId="profitCumulative"
                                    type="monotone"
                                    dataKey="playerGrossProfit"
                                    name="Cumulative Profit"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ fill: '#064e3b', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                />

                                {showMLAgent && (
                                    <>
                                        <Line
                                            yAxisId="profitCumulative"
                                            type="monotone"
                                            dataKey="mlGrossProfit"
                                            name="ML Agent Cumulative Profit"
                                            stroke="#1d4ed8"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                        {!hideRLLine && (
                                            <Line
                                                yAxisId="profitCumulative"
                                                type="monotone"
                                                dataKey="rlGrossProfit"
                                                name="RL Agent Cumulative Profit"
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
                            <div className="px-4 pt-4 pb-4 border-b border-coffee-700/40 bg-coffee-800/80">
                                <div className="px-2 pb-1">
                                    <div className="text-center text-sm font-semibold text-coffee-300">
                                        Environment
                                    </div>
                                    <div className="relative mt-2 h-3">
                                        <div className="absolute left-0 right-0 top-0 border-t border-coffee-400/65" />
                                        <div className="absolute left-0 top-0 h-3 border-l border-coffee-400/65" />
                                        <div className="absolute right-0 top-0 h-3 border-r border-coffee-400/65" />
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-12 gap-1.5 text-center">
                                    <div className="col-span-6">
                                        <div className="text-xs font-semibold text-coffee-300">State</div>
                                        <div className="relative mt-2 px-2 pt-3">
                                            <div className="absolute left-0 right-0 top-0 border-t border-coffee-500/60" />
                                            <div className="absolute left-0 top-0 h-3 border-l border-coffee-500/60" />
                                            <div className="absolute right-0 top-0 h-3 border-r border-coffee-500/60" />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="text-xs font-semibold text-emerald-300">Action</div>
                                        <div className="relative mt-2 px-1 pt-3">
                                            <div className="absolute left-0 right-0 top-0 border-t border-emerald-400/70" />
                                            <div className="absolute left-0 top-0 h-3 border-l border-emerald-400/70" />
                                            <div className="absolute right-0 top-0 h-3 border-r border-emerald-400/70" />
                                        </div>
                                    </div>
                                    <div className="col-span-5">
                                        <div className="text-xs font-semibold text-purple-300">Feedback from the environment</div>
                                        <div className="relative mt-2 px-2 pt-3">
                                            <div className="absolute left-0 right-0 top-0 border-t border-purple-400/55" />
                                            <div className="absolute left-0 top-0 h-3 border-l border-purple-400/55" />
                                            <div className="absolute right-0 top-0 h-3 border-r border-purple-400/55" />
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                                <Calendar className="w-4 h-4 mx-auto text-coffee-300" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Day of the Week</div>
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
                                                <img
                                                    src="/coffee-bean-sack.png"
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="w-6 h-6 mx-auto object-contain"
                                                />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Start Inventory</div>
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
                                                <Coffee className="w-4 h-4 mx-auto text-amber-600" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Cups Sold</div>
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
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Reward</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <AlertCircle className="w-4 h-4 mx-auto text-red-500" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Penalty</div>
                                            </div>
                                        </th>
                                        <th className="p-0 text-center">
                                            <div className="relative group inline-block p-3 hover:bg-coffee-700/50 rounded transition-colors cursor-help">
                                                <Award className="w-4 h-4 mx-auto text-fuchsia-400" />
                                                <div className="absolute opacity-0 group-hover:opacity-100 bg-coffee-900 border border-coffee-600 text-coffee-100 text-[10px] py-1.5 px-3 rounded top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[60] shadow-xl">Net Reward</div>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleData.map((row, idx) => (
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
                                                <td className="p-2 text-center">{row.dayName ? row.dayName.slice(0, 2) : '-'}</td>
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
                                                <td className="p-2 text-center font-mono text-emerald-400">${Math.round(row.playerPrice ?? 0)}</td>
                                                <td className="p-2 text-center font-mono text-amber-500">{row.playerSales}</td>
                                                <td className="p-2 text-center font-mono font-bold text-yellow-500">${(row.playerDailyGrossProfit ?? 0).toFixed(1)}</td>
                                                <td className="p-2 text-center font-mono text-purple-400">{row.playerDailyRewardPoints?.toFixed(1) || row.playerDailyReward?.toFixed(1) || '0'}</td>
                                                <td className="p-2 text-center font-mono text-red-500">{row.playerDailyPenaltyPoints?.toFixed(1) || '0.0'}</td>
                                                <td className="p-2 text-center font-mono text-fuchsia-400">{row.playerDailyReward?.toFixed(1) || '0'}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    {visibleData.length === 0 && (
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
