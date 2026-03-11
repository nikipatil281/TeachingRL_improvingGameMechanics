import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TableProperties, ArrowLeft, Download, Sun, Moon, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ProfitChart from './ProfitChart';

const PolicyReviewPage = ({ history, theme, toggleTheme, onBackToDebrief, onRestart }) => {
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!history || history.length < 2) return null;

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
                rlPrices: []
            };
        }

        if (record.playerPrice) {
            playerPolicyMap[stateKey].prices.push(record.playerPrice);
        }
        if (record.rlPrice) {
            playerPolicyMap[stateKey].rlPrices.push(record.rlPrice);
        }
    });

    // Calculate distributions for each state
    const playerPolicyTable = Object.values(playerPolicyMap).map(state => {
        const minPrice = state.prices.length > 0 ? Math.min(...state.prices) : null;
        const maxPrice = state.prices.length > 0 ? Math.max(...state.prices) : null;
        const rlMinPrice = state.rlPrices.length > 0 ? Math.min(...state.rlPrices) : null;
        const rlMaxPrice = state.rlPrices.length > 0 ? Math.max(...state.rlPrices) : null;

        // Calculate frequency map for the prices string
        const freqs = state.prices.reduce((acc, p) => {
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});

        // Find most frequent price
        let mostFrequentPrice = null;
        let maxCount = 0;
        Object.entries(freqs).forEach(([p, c]) => {
            if (c > maxCount) {
                maxCount = c;
                mostFrequentPrice = Number(p);
            }
        });

        const distributionString = Object.entries(freqs)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([price, count]) => `$${Number(price).toFixed(2)}\u00A0(${count}x)`)
            .join(', ');

        return {
            ...state,
            minPrice,
            maxPrice,
            rlRangeString: rlMinPrice === null
                ? 'N/A'
                : rlMinPrice === rlMaxPrice
                    ? `$${rlMinPrice.toFixed(2)}`
                    : `$${rlMinPrice.toFixed(2)} - $${rlMaxPrice.toFixed(2)}`,
            distributionString,
            mostFrequentPrice,
            count: state.prices.length
        };
    });

    return (
        <div className={`min-h-screen bg-coffee-950 text-coffee-100 p-4 md:p-8 flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto ${theme}`}>
            {/* Header / Actions */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-8">
                <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBackToDebrief}
                    className="flex items-center gap-2 text-coffee-300 hover:text-white transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Debrief
                </motion.button>

                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRestart}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Run Simulation Again
                    </motion.button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200"
                    >
                        {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </motion.button>
                </div>
            </div>

            {/* Main Content Area to Export */}
            <div ref={reportRef} className="w-full max-w-6xl flex flex-col items-center bg-coffee-900 p-8 rounded-2xl border border-coffee-700 shadow-2xl relative">
                <div className="flex items-center gap-3 mb-8">
                    <TableProperties className="w-8 h-8 text-emerald-400" />
                    <h2 className="text-3xl font-bold text-coffee-100">Reinforcement Learning Optimal Policy Review</h2>
                </div>

                {/* Final Chart Stretched - NOW USING PROFIT CHART */}
                <div className="w-full h-[550px] mb-8">
                    <ProfitChart data={history} showRLAgents={true} />
                </div>

                {/* Player Policy Summary Table */}
                <div className="w-full flex-1 flex flex-col mb-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden mt-8">
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
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-left">Weather</th>
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-center">Local Event</th>
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-center">Competitor</th>
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-right">Price Range</th>
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-right text-emerald-400">RL's Actual Range</th>
                                    <th className="px-4 py-3 font-bold border-b border-coffee-700 text-right text-amber-400">Distribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coffee-700/50">
                                {playerPolicyTable.length > 0 ? (
                                    playerPolicyTable.sort((a, b) => b.count - a.count).map((state, idx) => (
                                        <tr key={idx} className="hover:bg-coffee-700/20 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`font-medium px-2 py-1 rounded bg-coffee-900 border border-coffee-700 ${state.weather === 'Sunny' ? 'text-amber-400' : 'text-blue-300'}`}>
                                                    {state.weather}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {state.event ? (
                                                    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="text-coffee-500 text-xs">No</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {state.competitor ? (
                                                    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="text-coffee-500 text-xs">No</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-coffee-400 text-xs">
                                                {state.minPrice === state.maxPrice
                                                    ? `$${state.minPrice.toFixed(2)}`
                                                    : `$${state.minPrice.toFixed(2)} - $${state.maxPrice.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400 text-xs font-bold bg-emerald-500/5">
                                                {state.rlRangeString}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-amber-400 text-[11px] leading-relaxed max-w-[150px] truncate hover:whitespace-normal hover:break-all">
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

            </div>
        </div>
    );
};

export default PolicyReviewPage;
