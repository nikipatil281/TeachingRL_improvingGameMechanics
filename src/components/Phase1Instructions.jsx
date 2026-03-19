import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';

const TOUR_STEPS = Array.from({ length: 9 }, (_, index) => index + 1);
const TOUR_LIGHT_FULL_IMAGE = '/tourLight/tourLight_full.png';
const TOUR_DARK_FULL_IMAGE = '/tourDark/tourDark_full.png';
const TOUR_LIGHT_IMAGES = TOUR_STEPS.map((step) => `/tourLight/tourLight_${step}.png`);
const TOUR_DARK_IMAGES = TOUR_STEPS.map((step) => `/tourDark/tourDark_${step}.png`);

const Phase1Instructions = ({ onComplete, theme, toggleTheme }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIntroImage, setShowIntroImage] = useState(true);
  const isLightTheme = theme === 'theme-latte';
  const activeFullImage = isLightTheme ? TOUR_LIGHT_FULL_IMAGE : TOUR_DARK_FULL_IMAGE;
  const activeTourImages = useMemo(
    () => (isLightTheme ? TOUR_LIGHT_IMAGES : TOUR_DARK_IMAGES),
    [isLightTheme]
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeTourImages.length - 1;

  useEffect(() => {
    [TOUR_LIGHT_FULL_IMAGE, TOUR_DARK_FULL_IMAGE, ...TOUR_LIGHT_IMAGES, ...TOUR_DARK_IMAGES].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowIntroImage(false);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-x-hidden overflow-y-auto transition-colors duration-500 ${theme}`}>
      <style>
        {`
          .tour-image-loader {
            width: 96px;
            height: 40px;
            position: relative;
            z-index: 1;
            --loader-dot: #fbbf24;
            --loader-shadow: rgba(12, 10, 9, 0.55);
          }

          .theme-latte .tour-image-loader {
            --loader-dot: #b45309;
            --loader-shadow: rgba(120, 53, 15, 0.28);
          }

          .tour-image-loader__circle {
            width: 10px;
            height: 10px;
            position: absolute;
            border-radius: 9999px;
            background-color: var(--loader-dot);
            left: 16%;
            top: 0;
            transform-origin: 50%;
            animation: tour-loader-bounce 0.55s alternate infinite ease;
          }

          .tour-image-loader__circle:nth-child(2) {
            left: 45%;
            animation-delay: 0.18s;
          }

          .tour-image-loader__circle:nth-child(3) {
            left: auto;
            right: 16%;
            animation-delay: 0.3s;
          }

          .tour-image-loader__shadow {
            width: 10px;
            height: 3px;
            border-radius: 9999px;
            background-color: var(--loader-shadow);
            position: absolute;
            top: 27px;
            left: 16%;
            z-index: -1;
            filter: blur(1px);
            transform-origin: 50%;
            animation: tour-loader-shadow 0.55s alternate infinite ease;
          }

          .tour-image-loader__shadow:nth-child(4) {
            left: 45%;
            animation-delay: 0.18s;
          }

          .tour-image-loader__shadow:nth-child(5) {
            left: auto;
            right: 16%;
            animation-delay: 0.3s;
          }

          @keyframes tour-loader-bounce {
            0% {
              top: 24px;
              height: 4px;
              border-radius: 9999px 9999px 10px 10px;
              transform: scaleX(1.45);
            }

            40% {
              height: 10px;
              border-radius: 9999px;
              transform: scaleX(1);
            }

            100% {
              top: 0;
            }
          }

          @keyframes tour-loader-shadow {
            0% {
              transform: scaleX(1.5);
            }

            40% {
              transform: scaleX(1);
              opacity: 0.75;
            }

            100% {
              transform: scaleX(0.35);
              opacity: 0.35;
            }
          }
        `}
      </style>

      {/* Header / Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200 shadow-xl backdrop-blur-md"
        >
          {theme === 'theme-latte' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>
      </div>

      {/* Background Decor */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-40 mix-blend-color-burn'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-900/40 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-900/20 rounded-full blur-[100px] animate-slow-spin opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-7xl bg-coffee-950/50 backdrop-blur-xl border border-coffee-800 rounded-3xl p-5 md:p-8 shadow-2xl flex flex-col items-center text-center relative"
      >
        {/* Annotated Tutorial Dashboard Screenshot */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-coffee-900/50 rounded-2xl flex items-center justify-center mb-6 border border-coffee-800 relative overflow-hidden p-3 md:p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50" />
          <div className="relative z-10 w-full">
            <img
              src={activeTourImages[0]}
              alt=""
              aria-hidden="true"
              className="block w-full h-auto max-h-[84vh] object-contain rounded-xl opacity-0 pointer-events-none select-none"
            />
            <div className="absolute inset-0">
              <img
                src={activeFullImage}
                alt={showIntroImage ? 'Full dashboard walkthrough overview' : ''}
                aria-hidden={!showIntroImage}
                className={`absolute inset-0 block w-full h-full object-contain rounded-xl transition-opacity duration-200 ease-out ${
                  showIntroImage ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                loading="eager"
                decoding="async"
              />
              {activeTourImages.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={index === currentStepIndex ? `Annotated tutorial dashboard walkthrough step ${currentStepIndex + 1}` : ''}
                  aria-hidden={index !== currentStepIndex}
                  className={`absolute inset-0 block w-full h-full object-contain rounded-xl transition-opacity duration-200 ease-out ${
                    !showIntroImage && index === currentStepIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  loading="eager"
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {showIntroImage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 flex flex-col items-center justify-center"
            aria-hidden="true"
          >
            <div className="tour-image-loader">
              <div className="tour-image-loader__circle" />
              <div className="tour-image-loader__circle" />
              <div className="tour-image-loader__circle" />
              <div className="tour-image-loader__shadow" />
              <div className="tour-image-loader__shadow" />
              <div className="tour-image-loader__shadow" />
            </div>
          </motion.div>
        )}

        {!showIntroImage && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4 flex items-center gap-3"
          >
            <button
              type="button"
              onClick={() => setCurrentStepIndex((step) => Math.max(0, step - 1))}
              disabled={isFirstStep}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-coffee-700 bg-coffee-900/70 text-coffee-200 transition-all hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous tour step"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[84px] text-center text-xs font-semibold tracking-wide text-coffee-400">
              Step {currentStepIndex + 1} / {activeTourImages.length}
            </div>
            <button
              type="button"
              onClick={() => setCurrentStepIndex((step) => Math.min(activeTourImages.length - 1, step + 1))}
              disabled={isLastStep}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-coffee-700 bg-coffee-900/70 text-coffee-200 transition-all hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next tour step"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {!showIntroImage && isLastStep && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <style>
              {`
                        .Btn {
                          --amber-400: #fbbf24;
                          --amber-500: #f59e0b;
                          --amber-600: #d97706;
                          --coffee-950: #0c0a09;
                          
                          display: flex;
                          align-items: center;
                          justify-content: flex-start;
                          width: 45px;
                          height: 45px;
                          border: none;
                          border-radius: 12px;
                          cursor: pointer;
                          position: relative;
                          overflow: hidden;
                          transition-duration: .4s;
                          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                          background-color: var(--amber-500);
                        }

                        /* arrow sign */
                        .sign {
                          width: 100%;
                          transition-duration: .4s;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }

                        .sign svg {
                          width: 18px;
                          fill: var(--coffee-950) !important;
                        }

                        /* text */
                        .text {
                          position: absolute;
                          right: 0%;
                          width: 0%;
                          opacity: 0;
                          color: var(--coffee-950) !important;
                          font-size: 1.05rem;
                          font-weight: 900;
                          transition-duration: .4s;
                          white-space: nowrap;
                          text-transform: uppercase;
                          letter-spacing: 0.025em;
                        }
                        /* hover effect on button width */
                        .Btn:hover {
                          width: 500px;
                          border-radius: 12px;
                          transition-duration: .4s;
                          background-color: var(--amber-400);
                          box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
                        }

                        .Btn:hover .sign {
                          width: 12%;
                          transition-duration: .4s;
                          padding-left: 15px;
                        }
                        /* hover effect button's text */
                        .Btn:hover .text {
                          opacity: 1;
                          width: 88%;
                          transition-duration: .4s;
                          padding-right: 15px;
                          display: flex;
                          justify-content: center;
                        }
                        /* button click effect*/
                        .Btn:active {
                          transform: scale(0.95);
                          transition-duration: .1s;
                        }
                        `}
            </style>
            <button className="Btn" onClick={onComplete}>
              <div className="sign">
                <svg viewBox="0 0 512 512">
                  <path d="M334.5 414c8.8 3.8 19 2 25.8-4.8l144-144c6.2-6.2 6.2-16.4 0-22.6l-144-144c-6.9-6.9-17.2-8.7-25.8-4.8s-14.3 12.5-14.3 22.1v72H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h288.2v72c0 9.6 5.7 18.2 14.3 22.1z" />
                </svg>
              </div>
              <div className="text">Understood! Take me to the Orientation!</div>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Phase1Instructions;
