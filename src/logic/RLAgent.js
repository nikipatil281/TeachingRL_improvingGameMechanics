class RLAgent {
  constructor() {
    this.endpoint = "http://127.0.0.1:5001/predict";
    this.weatherMap = { "Sunny": 0, "Cloudy": 1, "Rainy": 2 };
    this.dayMap = {
      "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
      "Friday": 4, "Saturday": 5, "Sunday": 6
    };
  }

  normalizePrice(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 5;
    return Math.min(10, Math.max(1, Math.round(numeric * 2) / 2));
  }

  async getAction(conditions, yesterdayPrice = 4.50) {
    const dayOfWeek =
      typeof conditions.day === "string"
        ? this.dayMap[conditions.day]
        : Number.isFinite(conditions.dayNumber)
          ? ((conditions.dayNumber - 1) % 7 + 7) % 7
          : 0;

    const payload = {
      day_of_week: Number.isFinite(dayOfWeek) ? dayOfWeek : 0,
      day_number: conditions.dayNumber || 1,
      weather: this.weatherMap[conditions.weather] || 0,
      inventory: conditions.inventory || 0,
      nearby_event: conditions.nearbyEvent ? 1 : 0,
      competitor_present: conditions.competitorPresent ? 1 : 0,
      competitor_price: conditions.competitorPrice || 0,
      yesterday_price: yesterdayPrice
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Backend unavailable");

      const data = await response.json();
      const suggestedPrice = this.normalizePrice(data.suggested_price);
      console.log(`[RL Agent] Predicted price for day: $${suggestedPrice}`);

      return {
        action: `price_$${suggestedPrice.toFixed(2)}`,
        price: suggestedPrice,
        isExploring: false,
        state: "backend_prediction"
      };
    } catch (error) {
      console.warn("RL Agent fallback (Backend connection error):", error);
      // Fallback to a safe price if backend is down
      return {
        action: "price_$5.00",
        price: 5,
        isExploring: false,
        state: "fallback"
      };
    }
  }

  // Heuristic-based optimal range for policy review summary
  getOptimalRange(conditions) {
    let minPrice = 3;
    let maxPrice = 7;

    // Adjust based on weather
    if (conditions.weather === 'Rainy') {
      minPrice = 2;
      maxPrice = 5;
    } else if (conditions.weather === 'Cloudy') {
      minPrice = 3;
      maxPrice = 6;
    } else if (conditions.weather === 'Sunny') {
      minPrice = 4;
      maxPrice = 8;
    }

    // Adjust for events and competitor
    if (conditions.nearbyEvent) {
      minPrice += 1;
      maxPrice += 1;
    }

    if (conditions.competitorPresent && conditions.competitorPrice) {
      // RL agent tends to stay close to or slightly below competitor if they are cheap
      if (conditions.competitorPrice < minPrice + 1) {
        minPrice = Math.max(1, Math.round(conditions.competitorPrice - 1));
      }
    }

    return {
      minPrice: Math.max(1, Math.min(10, Math.round(minPrice))),
      maxPrice: Math.max(1, Math.min(10, Math.round(maxPrice)))
    };
  }

  // Learning is handled in Python, this is a placeholder to match existing interface
  learn() {
    return;
  }
}

export const rlAgent = new RLAgent();

