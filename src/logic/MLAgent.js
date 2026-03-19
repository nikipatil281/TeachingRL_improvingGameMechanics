// MLAgent.js - Uses local ML prediction backend

export const initMLModel = async () => {
    try {
        const response = await fetch("http://127.0.0.1:5002/health");
        const data = await response.json();
        console.log("ML Backend Health:", data);
        return data.model_loaded;
    } catch (e) {
        console.warn("ML Backend Not Reachable:", e.message);
        return false;
    }
};

/**
 * Basic ML predictor
 * @param {string} dayOfWeek ('Monday', etc.)
 * @param {string} weather ('Sunny', etc.)
 * @param {boolean} nearbyEvent
 * @param {number} inventory
 * @param {boolean} competitorPresent
 * @param {number} competitorPrice
 */
export const getMLPrice = async (dayOfWeek, weather, nearbyEvent, inventory, competitorPresent, competitorPrice) => {
    const normalizePrice = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 5;
        return Math.min(10, Math.max(1, Math.round(numeric * 2) / 2));
    };

    try {
        const response = await fetch("http://127.0.0.1:5002/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                day_of_week: dayOfWeek,
                weather: weather,
                nearby_event: nearbyEvent ? 1 : 0,
                inventory: inventory,
                competitor_present: competitorPresent ? 1 : 0,
                competitor_price: competitorPrice ?? 0
            })
        });

        if (!response.ok) throw new Error("ML Prediction failed");

        const data = await response.json();
        const suggestedPrice = normalizePrice(data.suggested_price ?? 5);
        console.log(`ML Suggestion (Backend RF): $${suggestedPrice.toFixed(2)}`);
        return suggestedPrice;
    } catch (e) {
        console.warn("ML Backend Predict Error:", e.message);
        // Fallback to a baseline price if server is down
        return 5;
    }
};

export const getMLFormula = () => {
    return "Random Forest - Real Inference";
};
