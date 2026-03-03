export const calculateDemand = (price, weather, nearbyEvent, day, competitorPresent, competitorPrice, yesterdayPrice) => {
    let demand = 120; // Base baseline

    // 1. Weather impacts
    if (weather === 'Hot') {
        demand -= 10; // Softened penalty so it doesn't instantly zero out
    } else if (weather === 'Sunny') {
        demand += 10;
    } else if (weather === 'Cloudy') {
        demand += 60; // 60 for cloudy
    } else if (weather === 'Rainy') {
        demand += 30; // 30 for rainy
    }

    // 2. Events always boost foot traffic
    if (nearbyEvent) demand += 50; // Increased to 50

    // 3. Weekends have slightly more relaxed customers
    if (day === 'Saturday' || day === 'Sunday') {
        demand += 20;
    } else if (day === 'Wednesday') {
        demand -= 10; // Wednesday penalty
    }

    // 4. Price Elasticity (Strict linear relationship)
    // Higher price strictly means fewer customers
    demand -= (price * 15);

    // 5. Price changes relative to yesterday
    if (yesterdayPrice !== undefined && yesterdayPrice !== null && yesterdayPrice !== 0 && yesterdayPrice !== "Start") {
        if (price > yesterdayPrice) {
            demand -= (Math.floor(Math.random() * 2) + 1); // 1-2 people less
        } else if (price < yesterdayPrice) {
            demand += (Math.floor(Math.random() * 2) + 1); // 1-2 people more
        }
    }

    // Prevent negative intermediate demand before competitor multipliers
    demand = Math.max(0, demand);

    // 6. Competitor interaction
    // "For every 1 dollar more than the competitor, the user loses 10-15 customers."
    // "For every 1 dollar less than the competitor, the user gains 10-15 customers."
    if (competitorPresent && competitorPrice) {
        const diff = price - competitorPrice;
        if (diff > 0) {
            // More expensive than competitor
            const penaltyPerDollar = Math.floor(Math.random() * 6) + 10; // 10 to 15
            demand -= diff * penaltyPerDollar;
        } else if (diff < 0) {
            // Cheaper than competitor
            const boostPerDollar = Math.floor(Math.random() * 6) + 10; // 10 to 15
            demand += Math.abs(diff) * boostPerDollar;
        }
    }

    // Ensure demand is non-negative and integer
    return Math.max(0, Math.floor(demand));
};

export const calculateSales = (demand, inventory) => {
    return Math.min(demand, inventory);
};

// Generate repeatable but "random" specific conditions
export const generateDailyConditions = (dayNumber) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = days[(dayNumber - 1) % 7];

    // Predictable semi-random weather sequence to ensure all states are hit
    const weatherPattern = ['Sunny', 'Cloudy', 'Rainy', 'Hot', 'Sunny', 'Rainy', 'Cloudy'];
    const weather = weatherPattern[(dayNumber - 1) % 7];

    // Event pattern: fixed to Friday/Saturday to ensure perfect 7-day looping (seen 4x a month)
    const nearbyEvent = dayName === 'Friday' || dayName === 'Saturday';

    // Competitor: Absent early week, present late week, perfectly repeating.
    const competitorPresent = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayName);

    // Competitor Price Logic (Non-Deterministic Rule-Based)
    let competitorPrice = null;
    if (competitorPresent) {
        if (weather === 'Rainy') {
            competitorPrice = 4.50 + Math.random(); // 4.50 to 5.50
        } else if (weather === 'Hot') {
            competitorPrice = 3.00 + Math.random(); // 3.00 to 4.00
        } else if (weather === 'Cloudy') {
            competitorPrice = 5.50 + Math.random(); // 5.50 to 6.50
        } else {
            competitorPrice = 4.00 + Math.random(); // Sunny 4.00 to 5.00
        }

        if (dayName === 'Saturday' || dayName === 'Sunday') {
            competitorPrice += 0.50 + (Math.random() * 0.50); // 0.50 to 1.00
        }
        if (nearbyEvent) {
            competitorPrice += 0.50 + (Math.random() * 0.50); // 0.50 to 1.00
        }

        competitorPrice = Math.round(competitorPrice * 100) / 100;
    }

    return {
        day: dayName,
        weather,
        nearbyEvent,
        competitorPresent,
        competitorPrice
    };
};

export const generateMainGameConditions = (dayNumber) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = days[(dayNumber - 1) % 7];

    // Follow the 7-day pattern from Tutorial.jsx
    const weatherPattern = ['Sunny', 'Sunny', 'Cloudy', 'Rainy', 'Rainy', 'Sunny', 'Rainy'];
    const weather = weatherPattern[(dayNumber - 1) % 7];

    // Events follow tutorial pattern (Tue and Sat)
    const eventPattern = [false, true, false, false, false, true, false];
    const nearbyEvent = eventPattern[(dayNumber - 1) % 7];

    // Competitor enters the market on Day 4 and stays.
    let competitorPresent = dayNumber >= 4;
    let competitorPrice = null;
    let specialEvent = null;

    if (competitorPresent) {
        // 15% chance competitor is closed for random reasons
        const isClosed = Math.random() < 0.15;

        if (isClosed) {
            competitorPresent = false;
            const excuses = [
                "Competitor electricity out.",
                "Competitor barista unwell.",
                "Competitor espresso machine broke.",
                "Competitor closed for private event."
            ];
            specialEvent = excuses[Math.floor(Math.random() * excuses.length)];
        } else {
            // Competitor Price Logic (Non-Deterministic Rule-Based)
            if (weather === 'Rainy') {
                competitorPrice = 4.50 + Math.random(); // 4.50 to 5.50
            } else if (weather === 'Hot') {
                competitorPrice = 3.00 + Math.random(); // 3.00 to 4.00
            } else if (weather === 'Cloudy') {
                competitorPrice = 5.50 + Math.random(); // 5.50 to 6.50
            } else {
                competitorPrice = 4.00 + Math.random(); // Sunny 4.00 to 5.00
            }

            if (dayName === 'Saturday' || dayName === 'Sunday') {
                competitorPrice += 0.50 + (Math.random() * 0.50); // 0.50 to 1.00
            }
            if (nearbyEvent) {
                competitorPrice += 0.50 + (Math.random() * 0.50); // 0.50 to 1.00
            }

            competitorPrice = Math.round(competitorPrice * 100) / 100;
        }
    }

    return {
        day: dayName,
        weather,
        nearbyEvent,
        competitorPresent,
        competitorPrice,
        specialEvent
    };
};

export const calculateReward = (dailyProfit, remainingInventory, dayName, playerPrice, competitorPresent, competitorPrice) => {
    let rewardPoints = 0;

    // 1. Normalized Profit Base
    // E.g., $250 profit = +5.0 Points
    rewardPoints += (dailyProfit / 50);

    // 2. Inventory Margin Bounds
    // Mon-Wed: > 500
    // Thu-Fri: 300 - 500
    // Sat-Sun: 100 - 300
    if (remainingInventory <= 0) {
        rewardPoints -= 5.0; // Critical stockout penalty
    } else {
        if (['Monday', 'Tuesday', 'Wednesday'].includes(dayName)) {
            if (remainingInventory > 500) rewardPoints += 2.0;
            else rewardPoints -= 1.0;
        } else if (['Thursday', 'Friday'].includes(dayName)) {
            if (remainingInventory >= 300 && remainingInventory <= 500) rewardPoints += 2.0;
            else rewardPoints -= 1.0;
        } else if (['Saturday', 'Sunday'].includes(dayName)) {
            if (remainingInventory >= 100 && remainingInventory <= 300) rewardPoints += 2.0;
            else rewardPoints -= 1.0;
        }
    }

    // 3. Competitor Dominance
    if (competitorPresent && competitorPrice) {
        const diff = competitorPrice - playerPrice;
        if (diff >= 0 && diff <= 0.50) {
            // Optimal Undercut / Match (Sweet Spot)
            rewardPoints += 3.0;
        } else if (playerPrice > competitorPrice + 1.00) {
            // Hubris Penalty (Priced out of relevance)
            rewardPoints -= 3.0;
        }
    }

    // 4. End-of-Week Waste (Sunday Spoilage)
    if (dayName === 'Sunday' && remainingInventory > 100) {
        rewardPoints -= (remainingInventory / 50);
    }

    return rewardPoints;
};
