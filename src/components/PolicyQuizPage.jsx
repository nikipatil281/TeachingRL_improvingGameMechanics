import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardCheck, Sun, Moon, CheckCircle2, LogOut, PlusCircle, Trash2, XCircle, RotateCcw } from 'lucide-react';
import { rlAgent } from '../logic/RLAgent';

const POLICY_QUESTIONS = [
  {
    id: 'wastage',
    prompt: 'Why does leftover inventory matter at the end of the week?',
    options: [
      { value: 'higher_demand', label: 'Because leftover cups increase demand next week.' },
      { value: 'bonus_reward', label: 'Because leftover cups earn a bonus reward.' },
      { value: 'wastage_penalty', label: 'Because leftover cups lead to a wastage penalty.' },
    ],
    correctAnswer: 'wastage_penalty',
    explanation: 'Correct RL behavior must account for Sunday wastage, so excess inventory can reduce reward even if daily profit looked acceptable.',
  },
  {
    id: 'rainy_competitor',
    prompt: 'On a rainy day with a competitor present, what is usually a safer policy?',
    options: [
      { value: 'raise_far_above', label: 'Price far above the competitor.' },
      { value: 'stay_competitive', label: 'Stay competitive instead of pricing too high.' },
      { value: 'always_one_dollar', label: 'Always charge exactly $1.' },
    ],
    correctAnswer: 'stay_competitive',
    explanation: 'When traffic is weaker and a competitor is active, the RL policy usually stays competitive rather than giving away demand with an overly high price.',
  },
  {
    id: 'sequential',
    prompt: 'What makes this game a sequential decision problem?',
    options: [
      { value: 'same_day_only', label: 'Only the current day matters, not the future.' },
      { value: 'inventory_future', label: 'Today’s sales change the inventory you carry into future days.' },
      { value: 'weather_never_changes', label: 'The weather stays fixed for the whole game.' },
    ],
    correctAnswer: 'inventory_future',
    explanation: 'The agent is not solving isolated one-day tasks. Each choice changes future inventory and later opportunities.',
  },
  {
    id: 'event_pricing',
    prompt: 'When a nearby event increases demand, what does the RL policy often allow?',
    options: [
      { value: 'slightly_higher', label: 'A somewhat higher price because demand is stronger.' },
      { value: 'always_cheapest', label: 'The cheapest possible price regardless of context.' },
      { value: 'inventory_ignored', label: 'Inventory no longer matters on event days.' },
    ],
    correctAnswer: 'slightly_higher',
    explanation: 'Higher event traffic often supports stronger margins, so the learned policy can raise price somewhat instead of defaulting to discounting.',
  },
  {
    id: 'reward_vs_profit',
    prompt: 'How does reward differ from pure daily profit in this simulation?',
    options: [
      { value: 'equals_revenue', label: 'Reward is just another name for revenue.' },
      { value: 'ignores_inventory', label: 'Reward ignores inventory and wastage effects.' },
      { value: 'penalties_included', label: 'Reward also reflects penalties and target-based behavior, not just profit.' },
    ],
    correctAnswer: 'penalties_included',
    explanation: 'Net reward goes beyond gross profit. It also reflects RL-oriented penalties such as wastage, sell-out behavior, and other target conditions.',
  },
];

const TERMINOLOGY_QUESTIONS = [
  {
    id: 'state_term',
    prompt: 'In this simulation, what is the best description of a state?',
    options: [
      { value: 'weather_only', label: 'Only the weather condition for the day.' },
      { value: 'last_price_only', label: 'Only the price chosen on the previous day.' },
      { value: 'full_context', label: 'The market context the agent is in, such as weather, events, competition, and inventory.' },
    ],
    correctAnswer: 'full_context',
    explanation: 'A state is the context the agent uses to decide. Here that includes multiple variables, not just one signal like weather.',
  },
  {
    id: 'action_term',
    prompt: 'What is the main action the RL agent takes in this game?',
    options: [
      { value: 'choose_price', label: 'Choose the coffee price for that day.' },
      { value: 'change_weather', label: 'Change the weather to increase demand.' },
      { value: 'reset_inventory', label: 'Reset inventory at any time during the week.' },
    ],
    correctAnswer: 'choose_price',
    explanation: 'The action space in this simulation is centered on pricing decisions.',
  },
  {
    id: 'policy_term',
    prompt: 'Which statement best defines a policy?',
    options: [
      { value: 'one_time_score', label: 'A one-time score the agent gets after training.' },
      { value: 'mapping', label: 'A mapping from state to the action the agent tends to choose.' },
      { value: 'weather_forecast', label: 'A forecast of what the weather will be tomorrow.' },
    ],
    correctAnswer: 'mapping',
    explanation: 'A policy tells the agent what to do in each state. It is not the same thing as reward or prediction.',
  },
  {
    id: 'exploration_term',
    prompt: 'Which example is exploration?',
    options: [
      { value: 'repeat_best', label: 'Repeating the current best-known price every time.' },
      { value: 'skip_reward', label: 'Ignoring reward and choosing a random answer after the game ends.' },
      { value: 'try_uncertain', label: 'Trying a less-certain price to learn whether it performs better in that state.' },
    ],
    correctAnswer: 'try_uncertain',
    explanation: 'Exploration means testing less-certain actions to gather information that may improve later decisions.',
  },
  {
    id: 'exploitation_term',
    prompt: 'Which example is exploitation?',
    options: [
      { value: 'test_new', label: 'Testing a new price mainly to gather more information.' },
      { value: 'ignore_state', label: 'Ignoring the state and choosing the same price for every day.' },
      { value: 'use_known_good', label: 'Using the price that has already worked well in a familiar state.' },
    ],
    correctAnswer: 'use_known_good',
    explanation: 'Exploitation means leaning on what the agent already believes is the best option for the current state.',
  },
];

const ALL_QUESTIONS = [...TERMINOLOGY_QUESTIONS, ...POLICY_QUESTIONS];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEATHER_OPTIONS = ['Sunny', 'Cloudy', 'Rainy'];
const TRAFFIC_OPTIONS = ['normal with no events', 'high due to a nearby event'];
const MAX_SCENARIO_CHECKS = 5;

const createScenarioCheck = (id) => ({
  id,
  day: 'Monday',
  weather: 'Sunny',
  traffic: 'normal with no events',
  competitor: 'absent',
  competitorPrice: '',
  optimalPrice: '',
});

const formatPriceRange = (minPrice, maxPrice) => {
  if (minPrice === maxPrice) {
    return `$${Number(minPrice).toFixed(2)}`;
  }
  return `$${Number(minPrice).toFixed(2)} to $${Number(maxPrice).toFixed(2)}`;
};

const getScenarioEvaluation = (scenario) => {
  const competitorPresent = scenario.competitor === 'present';
  const competitorPrice = competitorPresent ? Number(scenario.competitorPrice) : null;
  const optimalPrice = Number(scenario.optimalPrice);
  const policyRange = rlAgent.getOptimalRange({
    day: scenario.day,
    weather: scenario.weather,
    nearbyEvent: scenario.traffic === 'high due to a nearby event',
    competitorPresent,
    competitorPrice,
  });

  const rangeText = formatPriceRange(policyRange.minPrice, policyRange.maxPrice);
  const isCorrect = Number.isFinite(optimalPrice)
    && optimalPrice >= policyRange.minPrice
    && optimalPrice <= policyRange.maxPrice;

  let feedbackTone = 'emerald';
  let feedbackTitle = 'Aligned with the learned policy';
  let feedbackBody = `Your answer of $${optimalPrice.toFixed(2)} sits inside the RL policy range of ${rangeText}.`;

  if (!isCorrect) {
    if (optimalPrice < policyRange.minPrice) {
      feedbackTone = 'amber';
      feedbackTitle = 'A bit too low';
      feedbackBody = `The RL policy range here is ${rangeText}, so $${optimalPrice.toFixed(2)} underprices this state.`;
    } else {
      feedbackTone = 'rose';
      feedbackTitle = 'A bit too high';
      feedbackBody = `The RL policy range here is ${rangeText}, so $${optimalPrice.toFixed(2)} is higher than the learned policy would usually prefer.`;
    }
  }

  return {
    isCorrect,
    rangeText,
    feedbackTone,
    feedbackTitle,
    feedbackBody,
  };
};

const feedbackClassNames = {
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
};

const PolicyQuizPage = ({
  theme,
  toggleTheme,
  onBackToPolicyReview,
  onRestart,
  onExitToLogin,
  quizState,
  setQuizState,
}) => {
  const {
    answers = {},
    scenarios = [createScenarioCheck(1)],
    submitAttempted = false,
    submitted = false,
  } = quizState;

  const allAnswered = useMemo(() => {
    const hasMcqAnswers = ALL_QUESTIONS.every((question) => answers[question.id]);
    const hasScenarioAnswers = scenarios.every((scenario) => (
      scenario.optimalPrice !== ''
      && (scenario.competitor === 'absent' || scenario.competitorPrice !== '')
    ));

    return hasMcqAnswers && hasScenarioAnswers;
  }, [answers, scenarios]);

  const mcqScore = useMemo(() => {
    return ALL_QUESTIONS.reduce((total, question) => (
      total + (answers[question.id] === question.correctAnswer ? 1 : 0)
    ), 0);
  }, [answers]);

  const scenarioResults = useMemo(() => {
    return scenarios.map((scenario) => getScenarioEvaluation(scenario));
  }, [scenarios]);

  const scenarioScore = useMemo(() => {
    return scenarioResults.reduce((total, result) => total + (result.isCorrect ? 1 : 0), 0);
  }, [scenarioResults]);

  const updateQuizState = (updater) => {
    setQuizState((previous) => (typeof updater === 'function' ? updater(previous) : updater));
  };

  const handleAnswerChange = (questionId, value) => {
    if (submitted) return;
    updateQuizState((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        [questionId]: value,
      },
    }));
  };

  const handleScenarioChange = (scenarioId, field, value) => {
    if (submitted) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) => (
        scenario.id === scenarioId
          ? {
              ...scenario,
              [field]: value,
              ...(field === 'competitor' && value === 'absent' ? { competitorPrice: '' } : {}),
            }
          : scenario
      )),
    }));
  };

  const handleAddScenario = () => {
    if (submitted || scenarios.length >= MAX_SCENARIO_CHECKS) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: [...previous.scenarios, createScenarioCheck(previous.nextScenarioId)],
      nextScenarioId: previous.nextScenarioId + 1,
    }));
  };

  const handleRemoveScenario = (scenarioId) => {
    if (submitted || scenarios.length === 1) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: previous.scenarios.filter((scenario) => scenario.id !== scenarioId),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    updateQuizState((previous) => ({
      ...previous,
      submitAttempted: true,
      submitted: previous.submitted || allAnswered,
    }));
  };

  const renderQuestionBlock = (question, displayIndex) => {
    const isCorrect = answers[question.id] === question.correctAnswer;

    return (
      <div key={question.id} className="bg-coffee-950/60 border border-coffee-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-coffee-100 mb-3">
          {displayIndex}. {question.prompt}
        </p>
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.value} className={`flex items-start gap-3 text-sm cursor-pointer ${submitted ? 'text-coffee-300' : 'text-coffee-200'}`}>
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={answers[question.id] === option.value}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={submitted}
                className="mt-1 accent-amber-500 disabled:opacity-70"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {submitted && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${isCorrect ? feedbackClassNames.emerald : feedbackClassNames.rose}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
              <div>
                <p className="font-semibold">{isCorrect ? 'Correct' : 'Not quite'}</p>
                <p>{question.explanation}</p>
                {!isCorrect && (
                  <p className="mt-1">
                    Correct answer: <span className="font-semibold">{question.options.find((option) => option.value === question.correctAnswer)?.label}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-coffee-950 text-coffee-100 p-4 md:p-8 flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto ${theme}`}>
      <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-coffee-900 p-6 md:p-8 rounded-2xl border border-coffee-700 shadow-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-amber-400" />
            <div>
              <h2 className="text-3xl font-bold text-coffee-100">Policy Quiz</h2>
              <p className="text-sm text-coffee-400 mt-1">Test whether the policy patterns and RL terminology really clicked.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200"
          >
            {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-coffee-400 mb-3">RL Terminology Questions</p>
            <div className="space-y-4">
              {TERMINOLOGY_QUESTIONS.map((question, index) => renderQuestionBlock(question, index + 1))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-coffee-400 mb-3">Simulation Questions</p>
            <div className="space-y-4">
              {POLICY_QUESTIONS.map((question, index) => renderQuestionBlock(question, TERMINOLOGY_QUESTIONS.length + index + 1))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-coffee-400">Policy Question</p>
                <p className="text-sm text-coffee-400 mt-1">Add up to {MAX_SCENARIO_CHECKS} scenario checks and compare your chosen price against the learned RL policy.</p>
              </div>
              {!submitted && (
                <button
                  type="button"
                  onClick={handleAddScenario}
                  disabled={scenarios.length >= MAX_SCENARIO_CHECKS}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-coffee-100 border border-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add another scenario
                </button>
              )}
            </div>

            <div className="space-y-4">
              {scenarios.map((scenario, index) => {
                const scenarioResult = scenarioResults[index];

                return (
                  <div key={scenario.id} className="bg-coffee-950/60 border border-coffee-700 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-coffee-100">Scenario Check {index + 1}</p>
                      {!submitted && scenarios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScenario(scenario.id)}
                          className="inline-flex items-center gap-2 text-xs text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <select
                        value={scenario.day}
                        onChange={(e) => handleScenarioChange(scenario.id, 'day', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                      <select
                        value={scenario.weather}
                        onChange={(e) => handleScenarioChange(scenario.id, 'weather', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {WEATHER_OPTIONS.map((weather) => <option key={weather} value={weather}>{weather}</option>)}
                      </select>
                      <select
                        value={scenario.traffic}
                        onChange={(e) => handleScenarioChange(scenario.id, 'traffic', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {TRAFFIC_OPTIONS.map((traffic) => <option key={traffic} value={traffic}>{traffic}</option>)}
                      </select>
                      <select
                        value={scenario.competitor}
                        onChange={(e) => handleScenarioChange(scenario.id, 'competitor', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        <option value="absent">competitor absent</option>
                        <option value="present">competitor present</option>
                      </select>
                    </div>

                    <div className="bg-coffee-900/60 border border-coffee-700 rounded-lg p-4 text-sm text-coffee-100 leading-relaxed">
                      For a <span className="text-amber-400 font-bold">{scenario.day}</span>, when the weather is <span className="text-amber-400 font-bold">{scenario.weather}</span>, the market traffic is <span className="text-amber-400 font-bold">{scenario.traffic}</span> and the competitor is{' '}
                      {scenario.competitor === 'present' ? (
                        <>
                          <span className="text-red-400 font-bold">present</span> with a price of $
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="10"
                            value={scenario.competitorPrice}
                            onChange={(e) => handleScenarioChange(scenario.id, 'competitorPrice', e.target.value)}
                            disabled={submitted}
                            placeholder="__"
                            className="mx-1 w-20 bg-coffee-950 border border-coffee-700 rounded px-2 py-1 text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                          />
                          : the optimal price of coffee for that day is $
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-400 font-bold">absent</span>: the optimal price of coffee for that day is $
                        </>
                      )}
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        value={scenario.optimalPrice}
                        onChange={(e) => handleScenarioChange(scenario.id, 'optimalPrice', e.target.value)}
                        disabled={submitted}
                        placeholder="__"
                        className="mx-1 w-20 bg-coffee-950 border border-coffee-700 rounded px-2 py-1 text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      />
                    </div>

                    {submitted && (
                      <div className={`rounded-lg border px-4 py-3 text-sm ${feedbackClassNames[scenarioResult.feedbackTone]}`}>
                        <div className="flex items-start gap-3">
                          {scenarioResult.isCorrect ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                          <div>
                            <p className="font-semibold">{scenarioResult.feedbackTitle}</p>
                            <p>{scenarioResult.feedbackBody}</p>
                            <p className="mt-1">RL policy range for this state: <span className="font-semibold">{scenarioResult.rangeText}</span></p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!submitted && (
            <button
              type="submit"
              className="self-start px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-coffee-950 font-semibold transition-colors shadow-lg shadow-amber-900/20"
            >
              Submit Quiz
            </button>
          )}

          {submitAttempted && !allAnswered && !submitted && (
            <p className="text-sm text-rose-300">
              Please answer all multiple-choice questions and fill in every scenario check before submitting.
            </p>
          )}

          {submitted && (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative overflow-hidden flex items-start gap-3 rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/16 via-emerald-500/10 to-amber-400/10 px-4 py-3 text-sm text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.16)]"
              >
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-24 w-24 bg-gradient-to-r from-transparent via-white/18 to-transparent"
                  animate={{ x: [0, 520] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.1, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-4 top-3 h-2.5 w-2.5 rounded-full bg-emerald-300/80"
                  animate={{ y: [0, -8, 0], opacity: [0.55, 1, 0.55], scale: [1, 1.25, 1] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-8 top-4 h-2 w-2 rounded-full bg-amber-300/80"
                  animate={{ y: [0, -10, 0], opacity: [0.45, 0.95, 0.45], scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/3 top-2 h-2.5 w-2.5 rotate-45 bg-yellow-300/80"
                  animate={{ y: [0, -12, 0], rotate: [45, 90, 45], opacity: [0.4, 1, 0.4], scale: [0.9, 1.3, 0.9] }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-1/4 top-2 h-2 w-2 rounded-full bg-pink-300/75"
                  animate={{ y: [0, -9, 0], x: [0, 3, 0], opacity: [0.35, 0.95, 0.35], scale: [0.85, 1.25, 0.85] }}
                  transition={{ duration: 1.95, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-16 bottom-3 h-3 w-3 rounded-full border border-emerald-200/70"
                  animate={{ y: [0, 6, 0], opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/4 bottom-3 h-2.5 w-2.5 rounded-full bg-amber-300/80"
                  animate={{ y: [0, 8, 0], opacity: [0.35, 0.9, 0.35], scale: [0.85, 1.2, 0.85] }}
                  transition={{ duration: 2.15, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-10 top-1/2 h-2.5 w-2.5 rounded-full bg-emerald-200/80"
                  animate={{ x: [0, 5, 0], y: [0, -6, 0], opacity: [0.3, 0.85, 0.3], scale: [0.9, 1.25, 0.9] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-10 bottom-2 h-8 w-8 rounded-full bg-emerald-300/10 blur-xl"
                  animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10"
                >
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-300" />
                </motion.div>
                <div>
                  <p className="font-semibold">Quiz submitted. Nice work!</p>
                  <p>Thank you for taking the time to finish the quiz.</p>
                  <p>You got <span className="font-semibold">{mcqScore} out of {ALL_QUESTIONS.length}</span> multiple-choice questions correct.</p>
                  <p>Your scenario-check answers matched the RL policy on <span className="font-semibold">{scenarioScore} out of {scenarios.length}</span> case{scenarios.length === 1 ? '' : 's'}.</p>
                  <p className="text-emerald-200/80 mt-1">Your answers are now locked in, but you can still scroll through the quiz and review the feedback for each question.</p>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="flex flex-col gap-3 md:relative md:min-h-[44px] md:flex-row md:items-center md:justify-between">
            <motion.button
              type="button"
              whileHover={{ scale: submitted ? 1 : 1.05, x: submitted ? 0 : -5 }}
              whileTap={{ scale: submitted ? 1 : 0.95 }}
              onClick={onBackToPolicyReview}
              className="inline-flex items-center gap-2 text-coffee-300 hover:text-coffee-100 transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50 self-start"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Policy Review
            </motion.button>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:ml-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-lg shadow-emerald-900/20 md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2"
              >
                <RotateCcw className="w-4 h-4" />
                Run Simulation Again
              </motion.button>

              <button
                type="button"
                onClick={onExitToLogin}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-lg shadow-red-900/20 md:self-end"
              >
                <LogOut className="w-4 h-4" />
                Exit the Session
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PolicyQuizPage;
