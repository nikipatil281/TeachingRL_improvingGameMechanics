import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TableProperties, ArrowLeft, Download, Sun, Moon, RotateCcw, LogOut, Check, X, Minus } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import RLPipelineFlow from './RLPipelineFlow';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PolicyReviewPage = ({ history, theme, toggleTheme, onBackToDebrief, onRestart, onGoToQuiz, onExitToLogin }) => {
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!history || history.length < 2) return null;

    const rlFallbackDays = history.filter(
        (h) => h.day !== 'Start' && h.rlSource === 'fallback'
    ).length;

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const target = reportRef.current;
            const originalStyle = target.getAttribute('style');
            const originalTransform = target.style.transform;

            // Expand the view completely for full capture
            target.style.maxHeight = 'none';
            target.style.overflow = 'visible';
            target.style.transform = 'none';

            // Also expand inner table containers
            const scrolls = target.querySelectorAll('.max-h-\\[400px\\]');
            scrolls.forEach(el => el.style.maxHeight = 'none');

            // Wait a tick for styles to apply
            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(target, {
                scale: 2,
                useCORS: true,
                backgroundColor: theme === 'theme-latte' ? '#f5ebe0' : '#1c1917',
            });

            // Restore original styles
            if (originalStyle) {
                target.setAttribute('style', originalStyle);
            } else {
                target.removeAttribute('style');
            }
            target.style.transform = originalTransform;
            scrolls.forEach(el => el.style.maxHeight = '');

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight; // Negative position to shift image up
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('Coffee_Shop_RL_Report.pdf');
        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    const playerPolicyMap = {};
    history.filter(h => h.day !== 'Start').forEach(record => {
        const stateKey = `${record.weather}_${record.nearbyEvent}_${record.competitorPresent}`;

        if (!playerPolicyMap[stateKey]) {
            playerPolicyMap[stateKey] = {
                weather: record.weather,
                event: record.nearbyEvent,
                competitor: record.competitorPresent,
                prices: [],
                rlPrices: [],
                dayCounts: {},
                startInventories: [],
            };
        }

        if (record.playerPrice) {
            playerPolicyMap[stateKey].prices.push(record.playerPrice);
        }
        if (record.rlPrice) {
            playerPolicyMap[stateKey].rlPrices.push(record.rlPrice);
        }
        if (record.dayName) {
            playerPolicyMap[stateKey].dayCounts[record.dayName] = (playerPolicyMap[stateKey].dayCounts[record.dayName] || 0) + 1;
        }
        if (Number.isFinite(record.startInventory)) {
            playerPolicyMap[stateKey].startInventories.push(record.startInventory);
        }
    });

    // Calculate distributions for each state
    const playerPolicyTable = Object.values(playerPolicyMap).map(state => {
        const minPrice = state.prices.length > 0 ? Math.min(...state.prices) : null;
        const maxPrice = state.prices.length > 0 ? Math.max(...state.prices) : null;
        const rlMinPrice = state.rlPrices.length > 0 ? Math.min(...state.rlPrices) : null;
        const rlMaxPrice = state.rlPrices.length > 0 ? Math.max(...state.rlPrices) : null;

        const groupedDays = Object.entries(state.dayCounts)
            .sort((a, b) => WEEKDAY_ORDER.indexOf(a[0]) - WEEKDAY_ORDER.indexOf(b[0]));
        const minInventory = state.startInventories.length > 0 ? Math.min(...state.startInventories) : null;
        const maxInventory = state.startInventories.length > 0 ? Math.max(...state.startInventories) : null;
        const hasFullMatch = minPrice !== null && maxPrice !== null && rlMinPrice !== null && rlMaxPrice !== null
            && minPrice >= rlMinPrice
            && maxPrice <= rlMaxPrice;
        const hasPartialMatch = !hasFullMatch
            && minPrice !== null
            && maxPrice !== null
            && rlMinPrice !== null
            && rlMaxPrice !== null
            && Math.max(minPrice, rlMinPrice) <= Math.min(maxPrice, rlMaxPrice);

        return {
            ...state,
            groupedDays,
            dayDistributionString: groupedDays.length > 0
                ? groupedDays
                    .map(([dayName]) => dayName.slice(0, 2))
                    .join(', ')
                : 'N/A',
            inventoryRangeString: minInventory === null
                ? 'N/A'
                : minInventory === maxInventory
                    ? `${minInventory}`
                    : `${minInventory} - ${maxInventory}`,
            minPrice,
            maxPrice,
            rlRangeString: rlMinPrice === null
                ? 'N/A'
                : rlMinPrice === rlMaxPrice
                    ? `$${rlMinPrice.toFixed(2)}`
                    : `$${rlMinPrice.toFixed(2)} - $${rlMaxPrice.toFixed(2)}`,
            policyMatch: hasFullMatch ? 'full' : hasPartialMatch ? 'partial' : 'none',
            count: state.prices.length
        };
    });

    return (
        <div className={`min-h-screen bg-coffee-950 text-coffee-100 p-4 md:p-8 flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto ${theme}`}>
            {/* Header / Actions */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-8">
                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBackToDebrief}
                        className="flex items-center gap-2 text-coffee-300 hover:text-coffee-100 transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Debrief
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRestart}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Run Simulation Again
                    </motion.button>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onGoToQuiz}
                            className="bg-amber-600 hover:bg-amber-500 text-coffee-950 font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all"
                        >
                            Go to Quiz
                        </motion.button>
                        <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-20">
                            <div className="bg-coffee-950 border border-coffee-700 text-coffee-100 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                                Test your understanding with some quick policy questions.
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Exporting..." : "Export report to PDF"}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExitToLogin}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.28)] transition-all flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit the Session
                    </motion.button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200"
                    >
                        {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Main Content Area to Export */}
            <div ref={reportRef} className="w-full max-w-6xl flex flex-col items-center bg-coffee-900 p-8 rounded-2xl border border-coffee-700 shadow-2xl relative">
                <div className="flex items-center gap-3 mb-8">
                    <TableProperties className="w-8 h-8 text-emerald-400" />
                    <h2 className="text-3xl font-bold text-coffee-100">Reinforcement Learning Optimal Policy Review</h2>
                </div>

                {rlFallbackDays > 0 && (
                    <div className="w-full mb-6 bg-red-900/20 border border-red-600/40 rounded-xl p-4">
                        <p className="text-sm text-red-200">
                            RL backend was unavailable on {rlFallbackDays} day(s), so fallback pricing may appear in this report.
                        </p>
                    </div>
                )}

                {/* Player Policy Summary Table */}
                <div className="w-full flex-1 flex flex-col mb-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden">
                    <div className="p-4 bg-coffee-900/50 border-b border-coffee-700">
                        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <TableProperties className="w-5 h-5" />
                            Pricing Policy Summary
                        </h3>
                        <p className="text-xs text-coffee-400 mt-1">Discover the prefered price range across different market states. Variables that affect demand are accounted for.</p>
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
                                    <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-right text-orange-400 whitespace-nowrap">RL's Learned Range</th>
                                    <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-right text-emerald-400 whitespace-nowrap">Your Price Range</th>
                                    <th className="px-3 py-2.5 font-bold border-b border-coffee-700 text-center">
                                        <div className="group relative flex justify-center">
                                            <span className="cursor-help">Range Match</span>
                                            <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border border-coffee-700 bg-coffee-950/95 px-3 py-2 text-[9px] font-medium normal-case text-coffee-300 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
                                                <p className="text-center leading-snug">
                                                    Shows whether your chosen range matched the RL agent&apos;s optimal range.
                                                </p>
                                                <div className="mt-2 grid gap-1.5">
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        in range
                                                    </span>
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <Minus className="w-3 h-3 text-amber-400" />
                                                        partial
                                                    </span>
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <X className="w-3 h-3 text-red-400" />
                                                        out of range
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coffee-700/50">
                                {playerPolicyTable.length > 0 ? (
                                    playerPolicyTable.sort((a, b) => b.count - a.count).map((state, idx) => (
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
                                                {state.inventoryRangeString}
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
                                            <td className="px-3 py-2.5 text-right font-mono text-orange-400 text-xs font-bold bg-orange-500/5 whitespace-nowrap">
                                                {state.rlRangeString}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-emerald-400 text-xs font-bold bg-emerald-500/5 whitespace-nowrap">
                                                {state.minPrice === null || state.maxPrice === null
                                                    ? 'N/A'
                                                    : state.minPrice === state.maxPrice
                                                    ? `$${state.minPrice.toFixed(2)}`
                                                    : `$${state.minPrice.toFixed(2)} - $${state.maxPrice.toFixed(2)}`}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                {state.policyMatch === 'full' ? (
                                                    <Check className="w-4 h-4 mx-auto text-emerald-400" />
                                                ) : state.policyMatch === 'partial' ? (
                                                    <Minus className="w-4 h-4 mx-auto text-amber-400" />
                                                ) : (
                                                    <X className="w-4 h-4 mx-auto text-red-400" />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-coffee-500 italic">No pricing entries found yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="w-full mt-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden">
                    <div className="p-4 bg-coffee-900/50 border-b border-coffee-700">
                        <h3 className="text-lg font-bold text-orange-400">How the RL Pipeline Works</h3>
                        <p className="text-xs text-coffee-400 mt-1">
                            This flow shows how the RL agent learns pricing over time by observing the market, acting, and updating its policy from rewards and penalties.
                        </p>
                    </div>

                    <div className="p-4 md:p-6">
                        <RLPipelineFlow theme={theme} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PolicyReviewPage;
