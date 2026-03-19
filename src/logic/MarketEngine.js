const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NON_SUNNY_WEATHER = ['Cloudy', 'Rainy'];

const LOCAL_EVENTS = [
  'Music Concert',
  'Movie Screening',
  'Carnival',
  'Food Fest',
  'Local Marathon',
  'Street Fair',
  'Art Exhibition'
];

export const PRICE_MIN = 1;
export const PRICE_MAX = 10;
export const WEEKLY_START_INVENTORY = 5000;
export const CUP_COST = 1;
export const WASTAGE_COST_PER_CUP = 1.5;
export const WEEKDAY_SALES_TARGET = 200;
export const WEEKEND_SALES_TARGET = 250;
export const LOW_SALES_PENALTY = 100;

const STANDARD_COMPETITOR_GAIN_MAX_PRICE = 7;
const UMBRELLA_PRICING_TRIGGER_PRICE = 8;
const UMBRELLA_PRICING_BONUS_PER_DOLLAR = 10;

// Pre-calculated schedule for the 28-day simulation
let mainGameSchedule = null;

const SET_A_RANGES = {
  1: [401, 450],
  2: [351, 400],
  3: [301, 350],
  4: [251, 300],
  5: [201, 250],
  6: [151, 200],
  7: [101, 150],
  8: [51, 100],
  9: [1, 50],
  10: [0, 10]
};

const SET_B_RANGES = {
  1: [551, 600],
  2: [501, 550],
  3: [451, 500],
  4: [401, 450],
  5: [351, 400],
  6: [301, 350],
  7: [251, 300],
  8: [201, 250],
  9: [151, 200],
  10: [0, 150]
};

// Set E was provided with one duplicated price row in the spec.
// Price 8 is merged as [3,7] so both cited sub-ranges are covered.
const SET_E_RANGES = {
  1: [251, 300],
  2: [201, 250],
  3: [151, 200],
  4: [101, 150],
  5: [13, 15],
  6: [10, 13],
  7: [8, 10],
  8: [3, 7],
  9: [1, 3],
  10: [0, 0]
};

const SET_G_RANGES = {
  1: [451, 500],
  2: [401, 450],
  3: [351, 400],
  4: [301, 350],
  5: [251, 300],
  6: [201, 250],
  7: [151, 200],
  8: [101, 150],
  9: [51, 100],
  10: [0, 50]
};

const isWeekend = (dayName) => dayName === 'Saturday' || dayName === 'Sunday';
const isWeekday = (dayName) => !isWeekend(dayName);

const normalizeWeather = (weather) => {
  const normalized = String(weather || '').trim().toLowerCase();
  if (normalized === 'sunny') return 'Sunny';
  if (normalized === 'cloudy') return 'Cloudy';
  if (normalized === 'rainy') return 'Rainy';
  return 'Sunny';
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizePrice = (price) => {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return PRICE_MIN;
  return clamp(Math.round(numeric * 2) / 2, PRICE_MIN, PRICE_MAX);
};

const normalizeCompetitorPrice = (price) => {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return 0;
  return clamp(Math.round(numeric), 3, 10);
};

const randomIntInclusive = (min, max) => {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

const sampleFromRange = (range) => {
  if (!Array.isArray(range) || range.length !== 2) return 0;
  return randomIntInclusive(range[0], range[1]);
};

const getRandomEventName = () => LOCAL_EVENTS[Math.floor(Math.random() * LOCAL_EVENTS.length)];

const getSetKey = (dayName, weather, nearbyEvent, competitorPresent) => {
  const sunny = normalizeWeather(weather) === 'Sunny';
  const weekday = isWeekday(dayName);

  if (weekday && !sunny && !competitorPresent && !nearbyEvent) return 'A';
  if (weekday && !sunny && !competitorPresent && nearbyEvent) return 'B';
  if (weekday && !sunny && competitorPresent && !nearbyEvent) return 'C';
  if (weekday && !sunny && competitorPresent && nearbyEvent) return 'D';
  if (weekday && sunny && !competitorPresent && !nearbyEvent) return 'E';
  if (!weekday && !sunny && competitorPresent && nearbyEvent) return 'F';
  if (!weekday && sunny && !competitorPresent && nearbyEvent) return 'G';

  return null;
};

const getBaseDemandForSet = (setKey, price) => {
  const p = normalizePrice(price);

  if (setKey === 'A' || setKey === 'C') return sampleFromRange(SET_A_RANGES[p]);
  if (setKey === 'B' || setKey === 'D' || setKey === 'F') return sampleFromRange(SET_B_RANGES[p]);
  if (setKey === 'E') return sampleFromRange(SET_E_RANGES[p]);
  if (setKey === 'G') return sampleFromRange(SET_G_RANGES[p]);

  return 0;
};

const applyCompetitorAdjustment = (baseDemand, setKey, playerPrice, competitorPrice) => {
  const p = normalizePrice(playerPrice);
  const t = normalizeCompetitorPrice(competitorPrice);

  let factor = 0;
  if (setKey === 'C') factor = 20;
  if (setKey === 'D') factor = 30;
  if (setKey === 'F') factor = 50;

  if (factor === 0) return baseDemand;

  const diff = Math.abs(t - p);

  // Umbrella-pricing exception:
  // once the competitor moves above $8, pricing slightly above them can still
  // attract some demand instead of losing it.
  if (t > UMBRELLA_PRICING_TRIGGER_PRICE && p > t) {
    return Math.max(0, Math.floor(baseDemand + (diff * UMBRELLA_PRICING_BONUS_PER_DOLLAR)));
  }

  const adjusted = t >= p && t <= STANDARD_COMPETITOR_GAIN_MAX_PRICE
    ? baseDemand + (diff * factor)
    : t >= p
      ? baseDemand
      : baseDemand - (diff * factor);

  return Math.max(0, Math.floor(adjusted));
};

const generateCompetitorPrice = () => randomIntInclusive(3, 10);

const shuffleArray = (array) => {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const buildStateId = (state) => {
  const compPart = state.competitorPresent ? String(state.competitorPrice) : 'NA';
  return `${state.setKey}-${state.day}-${state.weather}-${state.nearbyEvent ? 1 : 0}-${state.competitorPresent ? 1 : 0}-${compPart}`;
};

const createRandomStateForDay = (dayName) => {
  const weekday = isWeekday(dayName);

  if (weekday) {
    const sunny = Math.random() < 0.35;

    if (sunny) {
      const state = {
        day: dayName,
        weather: 'Sunny',
        nearbyEvent: false,
        competitorPresent: false,
        competitorPrice: null,
        eventName: null,
        specialEvent: null,
        setKey: 'E'
      };
      return { ...state, stateId: buildStateId(state) };
    }

    const weather = NON_SUNNY_WEATHER[Math.floor(Math.random() * NON_SUNNY_WEATHER.length)];
    const bucket = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];

    const nearbyEvent = bucket === 'B' || bucket === 'D';
    const competitorPresent = bucket === 'C' || bucket === 'D';

    const state = {
      day: dayName,
      weather,
      nearbyEvent,
      competitorPresent,
      competitorPrice: competitorPresent ? generateCompetitorPrice() : null,
      eventName: nearbyEvent ? getRandomEventName() : null,
      specialEvent: null,
      setKey: bucket
    };
    return { ...state, stateId: buildStateId(state) };
  }

  const sunny = Math.random() < 0.5;

  if (sunny) {
    const state = {
      day: dayName,
      weather: 'Sunny',
      nearbyEvent: true,
      competitorPresent: false,
      competitorPrice: null,
      eventName: getRandomEventName(),
      specialEvent: null,
      setKey: 'G'
    };
    return { ...state, stateId: buildStateId(state) };
  }

  const weather = NON_SUNNY_WEATHER[Math.floor(Math.random() * NON_SUNNY_WEATHER.length)];
  const state = {
    day: dayName,
    weather,
    nearbyEvent: true,
    competitorPresent: true,
    competitorPrice: generateCompetitorPrice(),
    eventName: getRandomEventName(),
    specialEvent: null,
    setKey: 'F'
  };
  return { ...state, stateId: buildStateId(state) };
};

const scheduleMeetsWeeklyConstraints = (schedule) => {
  for (let week = 0; week < 4; week++) {
    const weekSlice = schedule.slice(week * 7, (week + 1) * 7);
    const competitorDays = weekSlice.filter((s) => s.competitorPresent).length;
    const eventDays = weekSlice.filter((s) => s.nearbyEvent).length;
    if (competitorDays < 3 || eventDays < 1) {
      return false;
    }
  }
  return true;
};

const buildConstrainedMainSchedule = () => {
  while (true) {

    const statesByDay = {};
    for (const dayName of DAYS) {
      const first = createRandomStateForDay(dayName);
      let second = createRandomStateForDay(dayName);
      let guard = 0;
      while (buildStateId(second) === buildStateId(first) && guard < 20) {
        second = createRandomStateForDay(dayName);
        guard += 1;
      }
      statesByDay[dayName] = shuffleArray([first, first, second, second]);
    }

    const candidate = [];
    for (let i = 0; i < 28; i++) {
      const dayName = DAYS[i % 7];
      const weekIndex = Math.floor(i / 7);
      const baseState = statesByDay[dayName][weekIndex];
      candidate.push({
        ...baseState,
        dayNumber: i + 1,
        stateId: buildStateId(baseState)
      });
    }

    if (scheduleMeetsWeeklyConstraints(candidate)) return candidate;
  }
};

export const initMainGameSchedule = (forceReset = false) => {
  if (mainGameSchedule && !forceReset) return mainGameSchedule;
  mainGameSchedule = buildConstrainedMainSchedule();
  return mainGameSchedule;
};

export const calculateDemand = (price, weather, nearbyEvent, day, competitorPresent, competitorPrice) => {
  const normalizedDay = DAYS.includes(day) ? day : DAYS[0];
  const normalizedWeather = normalizeWeather(weather);
  const normalizedNearbyEvent = Boolean(nearbyEvent);
  const normalizedCompetitorPresent = Boolean(competitorPresent);
  const normalizedPrice = normalizePrice(price);

  const setKey = getSetKey(normalizedDay, normalizedWeather, normalizedNearbyEvent, normalizedCompetitorPresent);
  if (!setKey) return 0;

  const baseDemand = getBaseDemandForSet(setKey, normalizedPrice);
  const finalDemand = applyCompetitorAdjustment(baseDemand, setKey, normalizedPrice, competitorPrice);

  return Math.max(0, Math.floor(finalDemand));
};

export const calculateSales = (demand, inventory) => {
  const safeDemand = Math.max(0, Math.floor(Number(demand) || 0));
  const safeInventory = Math.max(0, Math.floor(Number(inventory) || 0));
  return Math.min(safeDemand, safeInventory);
};

export const calculateDailyPenalty = (sales, dayName) => {
  const sold = Math.max(0, Math.floor(Number(sales) || 0));

  if (isWeekend(dayName)) {
    return sold < WEEKEND_SALES_TARGET ? LOW_SALES_PENALTY : 0;
  }

  return sold < WEEKDAY_SALES_TARGET ? LOW_SALES_PENALTY : 0;
};

export const calculateDailyProfit = (sales, price, dayName) => {
  const sold = Math.max(0, Math.floor(Number(sales) || 0));
  const normalizedPrice = normalizePrice(price);
  const gross = sold * normalizedPrice;
  const cogs = sold * CUP_COST;
  const baseProfit = gross - cogs;
  const penalty = calculateDailyPenalty(sold, dayName);
  return {
    gross,
    cogs,
    penalty,
    netProfit: baseProfit - penalty
  };
};

export const calculateWeekWastagePenalty = (remainingInventory) => {
  const safeInventory = Math.max(0, Math.floor(Number(remainingInventory) || 0));
  return safeInventory * WASTAGE_COST_PER_CUP;
};

export const generateDailyConditions = (dayNumber) => {
  const safeDayNumber = Math.max(1, Math.floor(Number(dayNumber) || 1));
  const dayName = DAYS[(safeDayNumber - 1) % 7];
  return {
    ...createRandomStateForDay(dayName),
    dayNumber: safeDayNumber
  };
};

export const generateMainGameConditions = (dayNumber) => {
  const schedule = initMainGameSchedule();
  const index = Math.max(0, Math.min(27, Math.floor(Number(dayNumber) || 1) - 1));
  return { ...schedule[index] };
};

export const calculateReward = (dailyNetProfit) => {
  const value = Number(dailyNetProfit) || 0;
  return {
    total: parseFloat(value.toFixed(2)),
    rewardPoints: parseFloat(Math.max(0, value).toFixed(2)),
    penaltyPoints: parseFloat(Math.max(0, -value).toFixed(2))
  };
};

export const getNormalizedPrice = (price) => normalizePrice(price);
