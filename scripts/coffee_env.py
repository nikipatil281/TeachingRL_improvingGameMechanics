import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random
import json
import re

class CoffeeShopEnv(gym.Env):
    """
    A reinforcement learning environment for the Coffee Shop simulation.
    Replicates the exact MarketEngine.js logic and market_states.json rewards.
    """
    metadata = {"render_modes": ["human"]}

    def __init__(self, market_states_path="../market_states.json"):
        super(CoffeeShopEnv, self).__init__()
        
        # Load market states for exact reward lookups
        with open(market_states_path, 'r') as f:
            self.market_states = json.load(f)

        # Action Space: 19 discrete price points ($1.00 to $10.00 in $0.50 increments)
        # 0=$1.00, 1=$1.50, ..., 18=$10.00
        self.action_space = spaces.Discrete(19)

        # Observation Space (State)
        # Using a MultiDiscrete or Box depending on needs. Box is better for neural networks.
        # [DayProgress, DayOfWeek, Weather, Inventory, NearbyEvent, CompetitorPresent, CompetitorPrice, YesterdayPrice, OptimalPriceHint]
        # DayProgress: 0-27 normalized by episode length (captures weekly/episode timing for inventory planning)
        # DayOfWeek: 0-6 (Mon-Sun)
        # Weather: 0=Sunny, 1=Cloudy, 2=Rainy
        # Inventory: 0 to 1500
        # NearbyEvent: 0 or 1
        # CompetitorPresent: 0 or 1
        # CompetitorPrice: 0.0 to 15.0
        # YesterdayPrice: 0.0 to 15.0
        self.observation_space = spaces.Box(
            low=np.zeros(9, dtype=np.float32),
            high=np.ones(9, dtype=np.float32),
            dtype=np.float32
        )

        self.day_mapping = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        self.weather_mapping = ['Sunny', 'Cloudy', 'Rainy']
        self.main_game_schedule = None
        
        # Simulation state
        self.current_day_index = 0
        self.inventory = 1500
        self.yesterday_price = 4.50
        
        # Set initial conditions
        self._init_main_game_schedule(force_reset=True)
        self._generate_conditions(1) # Start at day 1

    def _get_price_from_action(self, action):
        return 1.00 + (action * 0.50)

    def _get_obs(self):
        """
        Normalized observation for stable RL training.
        """
        return np.array([
            (self.current_day_number - 1) / 27.0,             # 0..1 across day 1..28
            self.day_of_week / 6.0,                           # 0..1
            self.weather / 2.0,                               # 0..1
            min(1.0, self.inventory / 2000.0),               # 0..1
            float(self.nearby_event),                         # 0..1
            float(self.competitor_present),                   # 0..1
            min(1.0, self.competitor_price / 15.0),          # 0..1
            min(1.0, self.yesterday_price / 15.0),           # 0..1
            min(1.0, self.optimal_price_hint / 10.0),        # 0..1
        ], dtype=np.float32)

    def _init_main_game_schedule(self, force_reset=False):
        if self.main_game_schedule is not None and not force_reset:
            return self.main_game_schedule

        days = self.day_mapping
        states_by_day = {d: [s for s in self.market_states if s['Day of the week'] == d] for d in days}

        valid_schedule = False
        attempts = 0
        new_schedule = [None] * 28

        while (not valid_schedule) and attempts < 100:
            attempts += 1
            chosen_pairs = {}

            for day_name in days:
                available = states_by_day[day_name]
                idx1 = random.randrange(len(available))
                idx2 = random.randrange(len(available))
                while idx2 == idx1:
                    idx2 = random.randrange(len(available))

                states = [available[idx1], available[idx1], available[idx2], available[idx2]]
                random.shuffle(states)
                chosen_pairs[day_name] = states

            for i in range(28):
                day_name = days[i % 7]
                week_idx = i // 7
                state = dict(chosen_pairs[day_name][week_idx])
                state['dayNumber'] = i + 1
                new_schedule[i] = state

            all_weeks_valid = True
            for w in range(4):
                week_slice = new_schedule[w * 7:(w + 1) * 7]
                comp_count = sum(1 for s in week_slice if s['Competitor'].lower() == 'yes')
                event_count = sum(1 for s in week_slice if s['Event'].lower() == 'yes')

                if comp_count < 3 or event_count < 1:
                    all_weeks_valid = False
                    break

            if all_weeks_valid:
                valid_schedule = True

        self.main_game_schedule = new_schedule
        return self.main_game_schedule

    def _generate_conditions(self, day_number):
        """
        Pick the day's state from the same 28-day schedule logic used in
        MarketEngine.js so frontend and RL see matching state distributions.
        """
        self.current_day_number = day_number
        day_name = self.day_mapping[(day_number - 1) % 7]
        state = self.main_game_schedule[day_number - 1]
        self.optimal_price_hint = float(state.get('OptimalPrice', 5.5))

        # Set weather from sampled state
        weather_str = state['Weather'].capitalize()  # e.g. 'sunny' -> 'Sunny'
        self.weather = self.weather_mapping.index(weather_str)

        # Set event from sampled state
        self.nearby_event = 1 if state['Event'].lower() == 'yes' else 0

        # Set competitor from sampled state
        self.competitor_price = 0.0
        if state['Competitor'].lower() == 'yes':
            self.competitor_present = 1

            # Generate a realistic competitor price based on weather + context
            if weather_str == 'Rainy':
                opts = [4.50, 5.00, 5.50]
            elif weather_str == 'Cloudy':
                opts = [5.50, 6.00, 6.50]
            else:  # Sunny
                opts = [4.00, 4.50, 5.00]

            c_price = random.choice(opts)

            # Weekend and event bump (mirrors MarketEngine.js)
            if day_name in ['Saturday', 'Sunday']:
                c_price += random.choice([0.50, 1.00])
            if self.nearby_event == 1:
                c_price += random.choice([0.50, 1.00])

            self.competitor_price = float(c_price)
        else:
            self.competitor_present = 0

        self.day_of_week = (day_number - 1) % 7

    def _js_eval(self, js_str, context):
        """Robust translator for JS strings to Python evals"""
        # 1. Base replacements
        # Convert generic JS random buckets:
        # Math.floor(Math.random() * N) + M -> random.randint(M, M + N - 1)
        js_str = re.sub(
            r"Math\.floor\(\s*Math\.random\(\)\s*\*\s*(\d+)\s*\)\s*\+\s*(\d+)",
            lambda m: f"random.randint({int(m.group(2))}, {int(m.group(2)) + int(m.group(1)) - 1})",
            js_str
        )
        js_str = js_str.replace("&&", " and ").replace("||", " or ")

        def translate_ternary(text):
            if '?' not in text:
                return text
            
            # Find the outermost '?'
            # We must account for balanced parens to find the correct top-level ?
            q_idx = -1
            depth = 0
            for i, char in enumerate(text):
                if char == '(': depth += 1
                elif char == ')': depth -= 1
                elif char == '?' and depth == 0:
                    q_idx = i
                    break
            
            if q_idx == -1: 
                # If no top-level ?, it might be wrapped in parens
                if text.strip().startswith('(') and text.strip().endswith(')'):
                    return "(" + translate_ternary(text.strip()[1:-1]) + ")"
                return text

            cond = text[:q_idx].strip()
            rest = text[q_idx+1:]
            
            # Find the matching ':' (accounting for nested ternaries at same depth)
            depth = 0
            c_idx = -1
            for i, char in enumerate(rest):
                if char == '(': depth += 1
                elif char == ')': depth -= 1
                elif char == ':' and depth == 0:
                    c_idx = i
                    break
            
            if c_idx == -1: return text
            
            yes = rest[:c_idx].strip()
            no = rest[c_idx+1:].strip()
            
            return f"({translate_ternary(yes)} if {translate_ternary(cond)} else {translate_ternary(no)})"

        def process(text):
            # Split by parentheses and process blocks
            res = ""
            i = 0
            while i < len(text):
                if text[i] == '(':
                    depth = 1
                    j = i + 1
                    while j < len(text) and depth > 0:
                        if text[j] == '(': depth += 1
                        elif text[j] == ')': depth -= 1
                        j += 1
                    
                    block = text[i+1:j-1]
                    if '?' in block:
                        res += translate_ternary(block)
                    else:
                        res += "(" + process(block) + ")"
                    i = j
                else:
                    res += text[i]
                    i += 1
            return res

        translated = process(js_str)
        # print(f"DEBUG: {js_str} -> {translated}")
        
        try:
            return eval(translated, {"__builtins__": {}}, {**context, "random": random})
        except Exception as e:
            # print(f"DEBUG: Eval error: {e} for string: {translated}")
            return 0

    def step(self, action):
        price = self._get_price_from_action(action)
        
        # Find exact market state
        weather_str = self.weather_mapping[self.weather]
        event_str = 'yes' if self.nearby_event == 1 else 'no'
        comp_str = 'yes' if self.competitor_present == 1 else 'no'
        day_name = self.day_mapping[self.day_of_week]
        
        matching_state = next((s for s in self.market_states 
                               if s['Weather'].lower() == weather_str.lower()
                               and s['Event'].lower() == event_str
                               and s['Competitor'].lower() == comp_str
                               and s['Day of the week'] == day_name), None)
        self.optimal_price_hint = float(matching_state.get('OptimalPrice', self.optimal_price_hint))

        # 1. Calculate Demand & Sales using JSON formula
        context = {
            "price": price,
            "yesterday_price": self.yesterday_price,
            "competitor_price": self.competitor_price,
            "inventory": self.inventory
        }
        
        demand_formula = matching_state.get('Footfall', '120')
        demand = self._js_eval(demand_formula, context)
        sales = min(max(0, int(demand)), self.inventory)
        
        # 2. Financials
        revenue = sales * price
        cogs = 1.00 
        profit = revenue - (sales * cogs)
        
        # 3. Inventory Updates
        self.inventory -= sales
        
        # 4. Calculate Reward using JSON formula
        # Use raw profit — ensures profit signal overcomes the inventory storage penalty
        context["profit"] = profit / 1.0
        context["inventory"] = self.inventory
        
        reward_formula = matching_state.get('Rewards', 'profit')
        reward = self._js_eval(reward_formula, context)
        
        # 5. Advance Time
        self.current_day_index += 1
        day_num = self.current_day_index + 1
        
        done = False
        truncated = False
        
        if day_num > 28:
            done = True
        else:
            # Weekly Refill
            if day_num % 7 == 1:
                self.inventory = 1500
            
            # Auto-Restock Penalty (Day 1-27)
            if self.inventory <= 50 and (day_num % 7 != 1):
                self.inventory += 200
                reward -= 275 # Penalty
                
            # Storage Penalty check
            if day_num % 7 == 0:
                storage_penalty = self.inventory * 0.50
                reward -= storage_penalty

            self._generate_conditions(day_num)
            
        self.yesterday_price = price
        
        # Return new state
        return self._get_obs(), float(reward), done, truncated, {"profit": profit, "sales": sales}

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_day_index = 0
        self.inventory = 1500
        self.yesterday_price = 4.50
        
        self._init_main_game_schedule(force_reset=True)
        self._generate_conditions(1)
        
        return self._get_obs(), {}
