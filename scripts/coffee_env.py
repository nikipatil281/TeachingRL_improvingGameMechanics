import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random


DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
NON_SUNNY_WEATHER = ['Cloudy', 'Rainy']
WEATHER_TO_INDEX = {'Sunny': 0, 'Cloudy': 1, 'Rainy': 2}

PRICE_MIN = 1
PRICE_MAX = 10
WEEKLY_START_INVENTORY = 5000
CUP_COST = 1.0
WEEKDAY_SALES_TARGET = 200
WEEKEND_SALES_TARGET = 250
LOW_SALES_PENALTY = 100.0
WASTAGE_COST_PER_CUP = 1.5
STANDARD_COMPETITOR_GAIN_MAX_PRICE = 7
UMBRELLA_PRICING_TRIGGER_PRICE = 8
UMBRELLA_PRICING_BONUS_PER_DOLLAR = 10

SET_A_RANGES = {
    1: (401, 450),
    2: (351, 400),
    3: (301, 350),
    4: (251, 300),
    5: (201, 250),
    6: (151, 200),
    7: (101, 150),
    8: (51, 100),
    9: (1, 50),
    10: (0, 10),
}

SET_B_RANGES = {
    1: (551, 600),
    2: (501, 550),
    3: (451, 500),
    4: (401, 450),
    5: (351, 400),
    6: (301, 350),
    7: (251, 300),
    8: (201, 250),
    9: (151, 200),
    10: (0, 150),
}

SET_E_RANGES = {
    1: (251, 300),
    2: (201, 250),
    3: (151, 200),
    4: (101, 150),
    5: (13, 15),
    6: (10, 13),
    7: (8, 10),
    8: (3, 7),
    9: (1, 3),
    10: (0, 0),
}

SET_G_RANGES = {
    1: (451, 500),
    2: (401, 450),
    3: (351, 400),
    4: (301, 350),
    5: (251, 300),
    6: (201, 250),
    7: (151, 200),
    8: (101, 150),
    9: (51, 100),
    10: (0, 50),
}

SET_ID = {
    None: 0,
    'A': 1,
    'B': 2,
    'C': 3,
    'D': 4,
    'E': 5,
    'F': 6,
    'G': 7,
}


def clamp(value, low, high):
    return max(low, min(high, value))


def normalize_price(value):
    try:
        return clamp(int(round(float(value))), PRICE_MIN, PRICE_MAX)
    except Exception:
        return 5


def normalize_competitor_price(value):
    try:
        return clamp(int(round(float(value))), 3, 10)
    except Exception:
        return 0


def is_weekend(day_name):
    return day_name in ('Saturday', 'Sunday')


def get_set_key(day_name, weather, nearby_event, competitor_present):
    sunny = weather == 'Sunny'
    weekday = not is_weekend(day_name)

    if weekday and not sunny and not competitor_present and not nearby_event:
        return 'A'
    if weekday and not sunny and not competitor_present and nearby_event:
        return 'B'
    if weekday and not sunny and competitor_present and not nearby_event:
        return 'C'
    if weekday and not sunny and competitor_present and nearby_event:
        return 'D'
    if weekday and sunny and not competitor_present and not nearby_event:
        return 'E'
    if (not weekday) and (not sunny) and competitor_present and nearby_event:
        return 'F'
    if (not weekday) and sunny and not competitor_present and nearby_event:
        return 'G'

    return None


def sample_range(min_max):
    low, high = min_max
    return random.randint(low, high)


def base_demand(set_key, price):
    p = normalize_price(price)

    if set_key in ('A', 'C'):
        return sample_range(SET_A_RANGES[p])
    if set_key in ('B', 'D', 'F'):
        return sample_range(SET_B_RANGES[p])
    if set_key == 'E':
        return sample_range(SET_E_RANGES[p])
    if set_key == 'G':
        return sample_range(SET_G_RANGES[p])

    return 0


def apply_competitor_adjustment(demand, set_key, player_price, competitor_price):
    factor = 0
    if set_key == 'C':
        factor = 20
    elif set_key == 'D':
        factor = 30
    elif set_key == 'F':
        factor = 50

    if factor == 0:
        return demand

    p = normalize_price(player_price)
    t = normalize_competitor_price(competitor_price)
    diff = abs(t - p)

    # Umbrella-pricing exception:
    # once the competitor moves above $8, pricing slightly above them can still
    # attract some demand instead of losing it.
    if t > UMBRELLA_PRICING_TRIGGER_PRICE and p > t:
        return max(0, int(demand + diff * UMBRELLA_PRICING_BONUS_PER_DOLLAR))

    if t >= p and t <= STANDARD_COMPETITOR_GAIN_MAX_PRICE:
        return max(0, int(demand + diff * factor))

    if t >= p:
        return max(0, int(demand))

    return max(0, int(demand - diff * factor))


def calculate_demand(price, day_name, weather, nearby_event, competitor_present, competitor_price):
    set_key = get_set_key(day_name, weather, nearby_event, competitor_present)
    if set_key is None:
        return 0, None

    demand = base_demand(set_key, price)
    demand = apply_competitor_adjustment(demand, set_key, price, competitor_price)
    return max(0, int(demand)), set_key


def create_random_state_for_day(day_name):
    weekday = not is_weekend(day_name)

    if weekday:
        if random.random() < 0.35:
            return {
                'day': day_name,
                'weather': 'Sunny',
                'nearby_event': 0,
                'competitor_present': 0,
                'competitor_price': 0,
            }

        weather = random.choice(NON_SUNNY_WEATHER)
        bucket = random.choice(['A', 'B', 'C', 'D'])
        nearby_event = 1 if bucket in ('B', 'D') else 0
        competitor_present = 1 if bucket in ('C', 'D') else 0
        competitor_price = random.randint(3, 10) if competitor_present else 0

        return {
            'day': day_name,
            'weather': weather,
            'nearby_event': nearby_event,
            'competitor_present': competitor_present,
            'competitor_price': competitor_price,
        }

    if random.random() < 0.5:
        return {
            'day': day_name,
            'weather': 'Sunny',
            'nearby_event': 1,
            'competitor_present': 0,
            'competitor_price': 0,
        }

    return {
        'day': day_name,
        'weather': random.choice(NON_SUNNY_WEATHER),
        'nearby_event': 1,
        'competitor_present': 1,
            'competitor_price': random.randint(3, 10),
    }


def state_signature(state):
    comp_part = str(state['competitor_price']) if state['competitor_present'] else 'NA'
    return (
        f"{state['day']}-{state['weather']}-"
        f"{int(state['nearby_event'])}-{int(state['competitor_present'])}-{comp_part}"
    )


def schedule_meets_weekly_constraints(schedule):
    for week in range(4):
        week_slice = schedule[week * 7:(week + 1) * 7]
        competitor_days = sum(1 for s in week_slice if int(s['competitor_present']) == 1)
        event_days = sum(1 for s in week_slice if int(s['nearby_event']) == 1)
        if competitor_days < 3 or event_days < 1:
            return False
    return True


def build_constrained_main_schedule():
    while True:

        states_by_day = {}
        for day_name in DAYS:
            first = create_random_state_for_day(day_name)
            second = create_random_state_for_day(day_name)
            guard = 0
            while state_signature(second) == state_signature(first) and guard < 20:
                second = create_random_state_for_day(day_name)
                guard += 1

            day_states = [dict(first), dict(first), dict(second), dict(second)]
            random.shuffle(day_states)
            states_by_day[day_name] = day_states

        schedule = []
        for i in range(28):
            day_name = DAYS[i % 7]
            week_idx = i // 7
            schedule.append(dict(states_by_day[day_name][week_idx]))

        if schedule_meets_weekly_constraints(schedule):
            return schedule


class CoffeeShopEnv(gym.Env):
    metadata = {'render_modes': ['human']}

    def __init__(self, market_states_path='../market_states.json'):
        super(CoffeeShopEnv, self).__init__()

        # Action Space: 10 discrete price points ($1 to $10)
        self.action_space = spaces.Discrete(10)

        # [DayProgress, DayOfWeek, Weather, Inventory, NearbyEvent, CompetitorPresent,
        #  CompetitorPrice, YesterdayPrice, SetId]
        self.observation_space = spaces.Box(
            low=np.zeros(9, dtype=np.float32),
            high=np.ones(9, dtype=np.float32),
            dtype=np.float32,
        )

        self.main_game_schedule = None
        self.current_day_index = 0
        self.current_day_number = 1
        self.inventory = WEEKLY_START_INVENTORY
        self.yesterday_price = 5

        self.day = 'Monday'
        self.weather = 'Sunny'
        self.nearby_event = 0
        self.competitor_present = 0
        self.competitor_price = 0
        self.set_key = None

        self._init_main_game_schedule(force_reset=True)
        self._apply_day_state(1)

    def _get_price_from_action(self, action):
        return clamp(int(action) + 1, PRICE_MIN, PRICE_MAX)

    def _init_main_game_schedule(self, force_reset=False):
        if self.main_game_schedule is not None and not force_reset:
            return self.main_game_schedule

        self.main_game_schedule = build_constrained_main_schedule()
        return self.main_game_schedule

    def _apply_day_state(self, day_number):
        self.current_day_number = day_number
        state = self.main_game_schedule[day_number - 1]

        self.day = state['day']
        self.weather = state['weather']
        self.nearby_event = int(state['nearby_event'])
        self.competitor_present = int(state['competitor_present'])
        self.competitor_price = int(state['competitor_price']) if self.competitor_present else 0
        self.set_key = get_set_key(
            self.day,
            self.weather,
            bool(self.nearby_event),
            bool(self.competitor_present),
        )

    def _get_obs(self):
        day_of_week = DAYS.index(self.day)
        weather_idx = WEATHER_TO_INDEX[self.weather]

        return np.array([
            (self.current_day_number - 1) / 27.0,
            day_of_week / 6.0,
            weather_idx / 2.0,
            min(1.0, self.inventory / float(WEEKLY_START_INVENTORY)),
            float(self.nearby_event),
            float(self.competitor_present),
            min(1.0, self.competitor_price / 10.0),
            min(1.0, self.yesterday_price / 10.0),
            min(1.0, SET_ID.get(self.set_key, 0) / 7.0),
        ], dtype=np.float32)

    def step(self, action):
        price = self._get_price_from_action(action)

        demand, set_key = calculate_demand(
            price,
            self.day,
            self.weather,
            bool(self.nearby_event),
            bool(self.competitor_present),
            self.competitor_price,
        )

        sales = min(max(0, int(demand)), self.inventory)
        gross = sales * price
        cogs = sales * CUP_COST

        target = WEEKEND_SALES_TARGET if is_weekend(self.day) else WEEKDAY_SALES_TARGET
        low_sales_penalty = LOW_SALES_PENALTY if sales < target else 0.0

        reward = (gross - cogs) - low_sales_penalty

        self.inventory -= sales

        # Sunday wastage cost
        if self.current_day_number % 7 == 0:
            reward -= self.inventory * WASTAGE_COST_PER_CUP

        self.current_day_index += 1
        next_day_number = self.current_day_index + 1

        done = next_day_number > 28
        truncated = False

        if not done:
            if next_day_number % 7 == 1:
                self.inventory = WEEKLY_START_INVENTORY
            self._apply_day_state(next_day_number)

        self.yesterday_price = price

        info = {
            'set_key': set_key,
            'profit': float(reward),
            'sales': int(sales),
            'inventory_left': int(self.inventory),
        }

        return self._get_obs(), float(reward), done, truncated, info

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.current_day_index = 0
        self.current_day_number = 1
        self.inventory = WEEKLY_START_INVENTORY
        self.yesterday_price = 5

        self._init_main_game_schedule(force_reset=True)
        self._apply_day_state(1)

        return self._get_obs(), {}
