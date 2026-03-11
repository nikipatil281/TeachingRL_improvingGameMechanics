import {
  initMainGameSchedule,
  generateMainGameConditions,
  calculateDemand,
  calculateSales,
  calculateReward,
} from "../src/logic/MarketEngine.js";

const DAY_MAP = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

const WEATHER_MAP = {
  Sunny: 0,
  Cloudy: 1,
  Rainy: 2,
};

async function getRlPrice(conditions, dayNumber, inventory, yesterdayPrice) {
  const payload = {
    day_of_week: DAY_MAP[conditions.day] ?? 0,
    day_number: dayNumber,
    weather: WEATHER_MAP[conditions.weather] ?? 0,
    inventory,
    nearby_event: conditions.nearbyEvent ? 1 : 0,
    competitor_present: conditions.competitorPresent ? 1 : 0,
    competitor_price: conditions.competitorPrice || 0,
    yesterday_price: yesterdayPrice,
  };

  try {
    const response = await fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return { price: Number(data.suggested_price), source: "backend" };
  } catch (error) {
    // Matches frontend RLAgent fallback behavior
    return { price: 5.5, source: "fallback" };
  }
}

async function main() {
  initMainGameSchedule(true);

  let day = 1;
  let rlInventory = 1500;
  let yesterdayRlPrice = 4.5;
  let totalProfit = 0;
  let totalReward = 0;

  const rows = [];
  const sourceCount = { backend: 0, fallback: 0 };

  while (day <= 28) {
    const conditions = generateMainGameConditions(day);
    const rl = await getRlPrice(conditions, day, rlInventory, yesterdayRlPrice);
    sourceCount[rl.source] += 1;

    const rlDemand = calculateDemand(
      rl.price,
      conditions.weather,
      conditions.nearbyEvent,
      conditions.day,
      conditions.competitorPresent,
      conditions.competitorPrice,
      yesterdayRlPrice
    );

    const rlSales = calculateSales(rlDemand, rlInventory);
    const rlRevenue = rlSales * rl.price;
    const rlDailyProfit = rlRevenue - rlSales;
    const nextRlInv = rlInventory - rlSales;

    const rewardData = calculateReward(
      rlDailyProfit,
      nextRlInv,
      conditions.day,
      rl.price,
      conditions.competitorPresent,
      conditions.competitorPrice,
      yesterdayRlPrice,
      conditions.weather,
      conditions.nearbyEvent
    );

    let actualNextRlInv = nextRlInv;
    let autoRestockPenalty = 0;

    // Mirrors Dashboard AI restock behavior
    if (day < 28 && day % 7 !== 0 && nextRlInv <= 50) {
      actualNextRlInv = 200 + nextRlInv;
      autoRestockPenalty = 275;
    }

    const weeklyStoragePenalty = day % 7 === 0 ? nextRlInv * 0.5 : 0;

    rows.push({
      day,
      dow: conditions.day,
      weather: conditions.weather,
      event: conditions.nearbyEvent ? "Y" : "N",
      comp: conditions.competitorPresent
        ? `Y(${conditions.competitorPrice.toFixed(2)})`
        : "N",
      invStart: rlInventory,
      rlPrice: rl.price,
      source: rl.source,
      demand: rlDemand,
      sales: rlSales,
      profit: rlDailyProfit,
      reward: rewardData.total,
      nextInv: nextRlInv,
      autoRestockPenalty,
      weeklyStoragePenalty,
    });

    totalProfit += rlDailyProfit;
    totalReward += rewardData.total;
    yesterdayRlPrice = rl.price;

    day += 1;
    rlInventory = day % 7 === 1 ? 1500 : actualNextRlInv;
  }

  console.log(
    "Day | DOW | Wth | Ev | Comp | InvStart | RLPrice | Src | Demand | Sales | Profit | Reward | NextInv | AIPen | WeekPen"
  );
  rows.forEach((r) => {
    console.log(
      `${String(r.day).padStart(2)} | ${r.dow.padEnd(9)} | ${r.weather.padEnd(
        6
      )} | ${r.event} | ${r.comp.padEnd(8)} | ${String(r.invStart).padStart(
        8
      )} | ${r.rlPrice.toFixed(2).padStart(7)} | ${r.source.padEnd(
        8
      )} | ${String(r.demand).padStart(6)} | ${String(r.sales).padStart(
        5
      )} | ${String(Math.round(r.profit)).padStart(6)} | ${String(
        Math.round(r.reward)
      ).padStart(6)} | ${String(r.nextInv).padStart(7)} | ${String(
        r.autoRestockPenalty
      ).padStart(5)} | ${String(Math.round(r.weeklyStoragePenalty)).padStart(7)}`
    );
  });

  const uniquePrices = [...new Set(rows.map((r) => r.rlPrice.toFixed(2)))];
  console.log(`\nUnique RL prices: ${uniquePrices.join(", ")}`);
  console.log(`Source counts: backend=${sourceCount.backend}, fallback=${sourceCount.fallback}`);
  console.log(`Total Profit (raw daily sum): ${totalProfit.toFixed(2)}`);
  console.log(`Total Reward sum: ${totalReward.toFixed(2)}`);
}

main().catch((err) => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
