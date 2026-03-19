import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TransitionPhase = ({ onComplete, theme }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // 5 seconds transition

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((current) => (current > 1 ? current - 1 : current));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-center relative overflow-y-auto transition-colors duration-500 ${theme}`}>
      <style>
        {`
          .transition-loader {
            width: 100px;
            height: 80px;
            position: relative;
            display: flex;
            justify-items: center;
            align-items: center;
          }

          .transition-loader .cup {
            position: absolute;
            width: 25px;
            height: 18px;
            background-color: #fff;
            border: 1px solid #2e2e2e;
            z-index: 1;
            border-radius: 2px 2px 10px 10px;
            animation: transition-expansion 5s infinite ease-in-out;
            transform-origin: center;
          }

          .transition-loader .cup::after {
            content: "";
            position: absolute;
            top: -2px;
            width: calc(100% - 2px);
            height: 2px;
            background: #fed59fca;
            border: 1px solid #2e2e2ebe;
            border-radius: 50%;
          }

          .transition-loader .cup .cup-handle {
            position: absolute;
            width: 5px;
            height: 10px;
            background-color: #fff;
            border: 1px solid #2e2e2e;
            right: -5px;
            top: 2px;
            border-radius: 2px 10px 20px 2px;
          }

          .transition-loader .cup .smoke {
            position: absolute;
            bottom: 100%;
            left: 50%;
            width: 15px;
            height: 25px;
            background: rgba(107, 102, 102, 0.433);
            border-radius: 50%;
            transform: translateX(-50%);
            animation: transition-rise 5s infinite ease-in-out;
            filter: blur(8px);
          }

          .transition-loader .cup .smoke.one {
            animation-delay: 0s;
          }

          .transition-loader .cup .smoke.two {
            animation-delay: 0.5s;
          }

          .transition-loader .cup .smoke.three {
            animation-delay: 1s;
          }

          .transition-loader .load {
            position: absolute;
            font-size: 10px;
            opacity: 0.7;
            top: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #d6ccc2;
          }

          @keyframes transition-expansion {
            0% {
              width: 25px;
              transform: translateX(0);
            }
            40% {
              width: 100%;
              transform: translateX(0);
            }
            80% {
              width: 25px;
              transform: translateX(64px);
            }
            90% {
              width: 100%;
              transform: translateX(0);
            }
            100% {
              width: 25px;
              transform: translateX(0);
            }
          }

          @keyframes transition-rise {
            0% {
              transform: translate(-50%, 0) scale(0.4);
              opacity: 0;
            }
            30% {
              opacity: 0.7;
            }
            60% {
              opacity: 0.4;
            }
            100% {
              transform: translate(-50%, -120px) scale(1);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* Doodle Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-amber-900 bg-doodle-mask opacity-[0.15] mix-blend-luminosity z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center px-4 pt-12 md:pt-16"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Time for the main Simulation!
        </h1>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4"
        >
          <div className="transition-loader">
            <div className="cup">
              <div className="cup-handle" />
              <div className="smoke one" />
              <div className="smoke two" />
              <div className="smoke three" />
            </div>
            <div className="load">Brewing</div>
          </div>
        </motion.div>
        <motion.div
          key={countdown}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 md:mt-12 mb-4 text-5xl md:text-6xl font-black text-amber-400"
        >
          {countdown}
        </motion.div>
        <p className="text-coffee-300 text-lg md:text-xl font-medium">
          Get ready to work alongside the Reinforcement Learning algorithm...
        </p>
      </motion.div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-color-burn">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/30 rounded-full blur-[150px] animate-blob" />
      </div>
    </div>
  );
};

export default TransitionPhase;
