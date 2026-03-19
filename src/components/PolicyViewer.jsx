import React from 'react';
import { motion } from 'framer-motion';

const PolicyViewer = ({ qTable }) => {
  if (!qTable || Object.keys(qTable).length === 0) return null;

  // Helper to find best action
  const getBestAction = (stateData) => {
    let best = -Infinity;
    let actionName = '';
    Object.entries(stateData).forEach(([action, value]) => {
      if (value > best) {
        best = value;
        actionName = action;
      }
    });
    return actionName;
  };

  const states = [
    { key: 'Sunny', label: 'Sunny Day' },
    { key: 'Cloudy', label: 'Cloudy Day' },
    { key: 'Rainy', label: 'Rainy Day' },
    { key: 'Hot', label: 'Hot Day' }
  ];

  const actions = ['low', 'medium', 'high'];

  // Color scale helper using HSL
  // value range roughly 0 to 1000? 
  // Let's normalize visually.
  const getColor = (value) => {
    // Sigmoid-ish or linear normalization
    // Max revenue is likely around 600-800. Min is 0 (or negative penalty).
    const maxVal = 800;
    const intensity = Math.min(1, Math.max(0, value / maxVal));

    // Green (120deg) to Red (0deg)
    // Actually let's go Indigo/Purple for "Cool/High Value" vs Dark for Low
    const hue = 120; // Green
    const lightness = 10 + (intensity * 40); // 10% to 50%

    if (value <= 0) return 'rgba(239, 68, 68, 0.2)'; // Red tint for 0/negative
    return `hsla(${hue}, 70%, ${lightness}%, 0.8)`;
  };

  const getValueTextClass = (value) => {
    if (value <= 0) return 'text-coffee-100';

    const maxVal = 800;
    const intensity = Math.min(1, Math.max(0, value / maxVal));
    return intensity >= 0.65 ? 'text-coffee-950' : 'text-white';
  };

  return (
    <div className="w-full bg-coffee-900/80 rounded-xl p-4 border border-coffee-700/50 backdrop-blur-md">
      <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
        <span>🧠</span> Reinforcement Learning Agent's Brain (Q-Table)
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {states.map((state) => (
          <div key={state.key} className="space-y-3">
            <h4 className="text-coffee-300 text-sm font-semibold border-b border-coffee-700 pb-1">
              State: {state.label}
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {actions.map((action) => {
                const value = qTable[state.key][action];
                const isBest = getBestAction(qTable[state.key]) === action;

                return (
                  <motion.div
                    key={action}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${isBest
                        ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : 'border-coffee-700 opacity-70'
                      }`}
                    style={{ backgroundColor: getColor(value) }}
                  >
                    <span className="text-[10px] uppercase font-bold text-coffee-300 mb-0.5">{action}</span>
                    <span className={`text-sm font-mono font-bold ${getValueTextClass(value)}`}>{value.toFixed(0)}</span>
                    {isBest && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[10px] font-bold px-1.5 rounded-full">
                        BEST
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-coffee-400 bg-coffee-800/50 p-3 rounded-lg border border-coffee-700/50">
        <p className="font-bold text-coffee-300 mb-1">How to read this:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="text-emerald-400 font-bold">Green (BEST):</span> The action the agent thinks is most profitable.</li>
          <li><span className="text-coffee-300 font-bold">Number:</span> The "Q-Value" (Estimated Future Revenue). Higher is better.</li>
          <li>If values are <span className="font-mono">0</span>, the agent hasn't tried that action enough yet.</li>
        </ul>
      </div>
    </div>
  );
};

export default PolicyViewer;
