import marketStates from '../../market_states.json' with { type: 'json' };

// Pre-calculated schedule for the 28-day simulation
let mainGameSchedule = null;

const LOCAL_EVENTS = [
    "Music Concert",
    "Movie Screening",
    "Carnival",
    "Food Fest",
    "Local Marathon",
    "Street Fair",
    "Art Exhibition"
];

const getRandomEventName = () => LOCAL_EVENTS[Math.floor(Math.random() * LOCAL_EVENTS.length)];

const evaluateFormula = (formula, context = {}) => {
    if (!formula || typeof formula !== 'string') return 0;

    try {
        const argNames = Object.keys(context);
        const argValues = Object.values(context);
        return Function(...argNames, `"use strict"; return (${formula});`)(...argValues);
    } catch (error) {
        console.warn('[MarketEngine] Formula evaluation failed:', formula, error);
        return 0;
    }
};

const splitTopLevelByPlus = (formula) => {
    const terms = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < formula.length; i++) {
        const ch = formula[i];
        if (ch === '(') depth += 1;
        if (ch === ')') depth -= 1;

        if (ch === '+' && depth === 0) {
            terms.push(formula.slice(start, i).trim());
            start = i + 1;
        }
    }

    terms.push(formula.slice(start).trim());
    return terms.filter(Boolean);
};

const findMatchingMarketState = (weather, nearbyEvent, competitorPresent, dayName) => {
    return marketStates.find((s) =>
        s.Weather.toLowerCase() === String(weather || '').toLowerCase() &&
        s.Event.toLowerCase() === (nearbyEvent ? 'yes' : 'no') &&
        s.Competitor.toLowerCase() === (competitorPresent ? 'yes' : 'no') &&
        s['Day of the week'] === dayName
    );
};

const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const initMainGameSchedule = (forceReset = false) => {
    if (mainGameSchedule && !forceReset) return mainGameSchedule;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const statesByDay = {};
    days.forEach(d => {
        statesByDay[d] = marketStates.filter(s => s['Day of the week'] === d);
    });

    let validSchedule = false;
    let attempts = 0;
    let newSchedule = new Array(28);

    while (!validSchedule && attempts < 100) {
        attempts++;
        const chosenPairs = {};

        // For each day of the week, pick 2 states and repeat each twice
        days.forEach(dayName => {
            const available = statesByDay[dayName];
            const idx1 = Math.floor(Math.random() * available.length);
            let idx2 = Math.floor(Math.random() * available.length);
            while (idx2 === idx1) idx2 = Math.floor(Math.random() * available.length);

            const states = [available[idx1], available[idx1], available[idx2], available[idx2]];
            chosenPairs[dayName] = shuffleArray(states);
        });

        // Fill the 28-day schedule
        for (let i = 0; i < 28; i++) {
            const dayName = days[i % 7];
            const weekIdx = Math.floor(i / 7);
            newSchedule[i] = { ...chosenPairs[dayName][weekIdx], dayNumber: i + 1 };
        }

        // Validate constraints per week
        let allWeeksValid = true;
        for (let w = 0; w < 4; w++) {
            const weekSlice = newSchedule.slice(w * 7, (w + 1) * 7);
            const compCount = weekSlice.filter(s => s.Competitor.toLowerCase() === 'yes').length;
            const eventCount = weekSlice.filter(s => s.Event.toLowerCase() === 'yes').length;

            if (compCount < 3 || eventCount < 1) {
                allWeeksValid = false;
                break;
            }
        }

        if (allWeeksValid) {
            validSchedule = true;
        }
    }

    mainGameSchedule = newSchedule;
    return mainGameSchedule;
};

export const calculateDemand = (price, weather, nearbyEvent, day, competitorPresent, competitorPrice, yesterdayPrice = null) => {
    const state = findMatchingMarketState(weather, nearbyEvent, competitorPresent, day);
    const context = {
        price,
        yesterday_price: yesterdayPrice ?? 4.50,
        competitor_price: competitorPrice || 0,
        inventory: 1500
    };

    if (state?.Footfall) {
        const demand = evaluateFormula(state.Footfall, context);
        return Math.max(0, Math.floor(Number(demand) || 0));
    }

    return 0;
};

export const calculateSales = (demand, inventory) => {
    return Math.min(demand, inventory);
};

export const generateDailyConditions = (dayNumber) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = days[(dayNumber - 1) % 7];
    const weatherPattern = ['Sunny', 'Cloudy', 'Rainy', 'Sunny', 'Sunny', 'Rainy', 'Cloudy'];
    const weather = weatherPattern[(dayNumber - 1) % 7];
    const nearbyEvent = dayName === 'Friday' || dayName === 'Saturday';
    const competitorPresent = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayName);

    let competitorPrice = null;
    if (competitorPresent) {
        const w = weather.toLowerCase();
        if (w === 'rainy') {
            competitorPrice = [4.50, 5.00, 5.50][Math.floor(Math.random() * 3)];
        } else if (w === 'cloudy') {
            competitorPrice = [5.50, 6.00, 6.50][Math.floor(Math.random() * 3)];
        } else if (w === 'sunny') {
            competitorPrice = [4.00, 4.50, 5.00][Math.floor(Math.random() * 3)];
        } else {
            competitorPrice = 4.00;
        }

        if (dayName === 'Saturday' || dayName === 'Sunday') competitorPrice += [0.50, 1.00][Math.floor(Math.random() * 2)];
        if (nearbyEvent) competitorPrice += [0.50, 1.00][Math.floor(Math.random() * 2)];
    }

    const eventName = nearbyEvent ? getRandomEventName() : null;

    return { day: dayName, weather, nearbyEvent, eventName, competitorPresent, competitorPrice };
};

export const generateMainGameConditions = (dayNumber) => {
    const schedule = initMainGameSchedule();
    const state = schedule[dayNumber - 1];

    // Map Competitor Price if needed (it wasn't in the JSON, we should generate it if Competitor is "yes")
    let competitorPrice = null;
    if (state.Competitor.toLowerCase() === 'yes') {
        const w = state.Weather.toLowerCase();
        if (w === 'rainy') {
            competitorPrice = [4.50, 5.00, 5.50][Math.floor(Math.random() * 3)];
        } else if (w === 'cloudy') {
            competitorPrice = [5.50, 6.00, 6.50][Math.floor(Math.random() * 3)];
        } else {
            competitorPrice = [4.00, 4.50, 5.00][Math.floor(Math.random() * 3)];
        }

        if (state['Day of the week'] === 'Saturday' || state['Day of the week'] === 'Sunday') {
            competitorPrice += [0.50, 1.00][Math.floor(Math.random() * 2)];
        }
        if (state.Event.toLowerCase() === 'yes') {
            competitorPrice += [0.50, 1.00][Math.floor(Math.random() * 2)];
        }
    }

    return {
        dayNumber,
        day: state['Day of the week'],
        weather: state.Weather.charAt(0).toUpperCase() + state.Weather.slice(1),
        nearbyEvent: state.Event.toLowerCase() === 'yes',
        competitorPresent: state.Competitor.toLowerCase() === 'yes',
        competitorPrice,
        eventName: state.Event.toLowerCase() === 'yes' ? getRandomEventName() : null,
        specialEvent: null, // We can add back random excuses if desired, but user didn't ask
        stateId: state.Weather + state.Event + state.Competitor + state['Day of the week'] // Include day for specific matching
    };
};

export const calculateReward = (dailyProfit, remainingInventory, dayName, playerPrice, competitorPresent, competitorPrice, yesterdayPrice, weather, nearbyEvent) => {
    let totalScore = 0;
    let rewardPoints = 0;
    let penaltyPoints = 0;

    const state = findMatchingMarketState(weather, nearbyEvent, competitorPresent, dayName);
    const context = {
        profit: dailyProfit,
        inventory: remainingInventory,
        price: playerPrice,
        competitor_price: competitorPrice || 0,
        yesterday_price: yesterdayPrice ?? 4.50
    };

    if (state?.Rewards) {
        const total = Number(evaluateFormula(state.Rewards, context)) || 0;
        totalScore = total;

        const rewardTerms = splitTopLevelByPlus(state.Rewards);
        rewardTerms.forEach((term) => {
            const val = Number(evaluateFormula(term, context)) || 0;
            if (val >= 0) rewardPoints += val;
            else penaltyPoints += Math.abs(val);
        });
    } else {
        totalScore = dailyProfit;
        rewardPoints = Math.max(0, dailyProfit);
        penaltyPoints = Math.max(0, -dailyProfit);
    }

    return {
        total: parseFloat(totalScore.toFixed(2)),
        rewardPoints: parseFloat(rewardPoints.toFixed(2)),
        penaltyPoints: parseFloat(penaltyPoints.toFixed(2))
    };
};

