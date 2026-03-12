import os
import sys

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from stable_baselines3 import DQN, PPO

app = Flask(__name__)
CORS(app)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, 'models')

MODEL_ALGO = os.environ.get('RL_MODEL_ALGO', 'dqn').strip().lower()
MODEL_PATH = os.path.join(MODEL_DIR, f'{MODEL_ALGO}_coffee.zip')

if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(MODEL_DIR, 'dqn_coffee.zip')
    MODEL_ALGO = 'dqn'

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f'RL model not found at {MODEL_PATH}. Please train the model first.')

if MODEL_ALGO == 'ppo':
    model = PPO.load(MODEL_PATH)
else:
    model = DQN.load(MODEL_PATH)

PRICE_MIN = 1
PRICE_MAX = 10

DAY_MAP = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday',
}

WEATHER_MAP = {
    0: 'sunny',
    1: 'cloudy',
    2: 'rainy',
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


def get_price_from_action(action):
    # New action space: 0..9 => $1..$10. If old models emit >9, clamp.
    return float(clamp(int(action) + 1, PRICE_MIN, PRICE_MAX))


def derive_set_key(day_name, weather, nearby_event, competitor_present):
    sunny = weather == 'sunny'
    weekday = day_name in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')

    if weekday and (not sunny) and (not competitor_present) and (not nearby_event):
        return 'A'
    if weekday and (not sunny) and (not competitor_present) and nearby_event:
        return 'B'
    if weekday and (not sunny) and competitor_present and (not nearby_event):
        return 'C'
    if weekday and (not sunny) and competitor_present and nearby_event:
        return 'D'
    if weekday and sunny and (not competitor_present) and (not nearby_event):
        return 'E'
    if (not weekday) and (not sunny) and competitor_present and nearby_event:
        return 'F'
    if (not weekday) and sunny and (not competitor_present) and nearby_event:
        return 'G'

    return None


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    print(f'\n[DEBUG] Predict trigger: {data}')
    sys.stdout.flush()

    try:
        day_number = clamp(float(data.get('day_number', 1)), 1.0, 28.0)
        day_of_week = int(clamp(float(data.get('day_of_week', 0)), 0, 6))
        weather_idx = int(clamp(float(data.get('weather', 0)), 0, 2))

        inventory = clamp(float(data.get('inventory', 0)), 0.0, 5000.0)
        nearby_event = 1.0 if float(data.get('nearby_event', 0)) >= 0.5 else 0.0
        competitor_present = 1.0 if float(data.get('competitor_present', 0)) >= 0.5 else 0.0
        competitor_price = clamp(float(data.get('competitor_price', 0)), 0.0, 10.0)
        yesterday_price = clamp(float(data.get('yesterday_price', 5)), 1.0, 10.0)

        day_name = DAY_MAP.get(day_of_week, 'Monday')
        weather = WEATHER_MAP.get(weather_idx, 'sunny')
        set_key = derive_set_key(day_name, weather, bool(nearby_event), bool(competitor_present))
        set_id = SET_ID.get(set_key, 0)

        state = np.array([
            (day_number - 1.0) / 27.0,
            day_of_week / 6.0,
            weather_idx / 2.0,
            min(1.0, inventory / 5000.0),
            nearby_event,
            competitor_present,
            min(1.0, competitor_price / 10.0),
            min(1.0, yesterday_price / 10.0),
            min(1.0, set_id / 7.0),
        ], dtype=np.float32)

        action, _states = model.predict(state, deterministic=True)
        suggested_price = get_price_from_action(int(action))

        print(f'[DEBUG] Result: Action {action}, Price ${suggested_price}')
        sys.stdout.flush()

        return jsonify({
            'suggested_price': float(suggested_price),
            'action': int(action),
        })
    except Exception as e:
        print(f'[ERROR] Prediction failed: {str(e)}')
        sys.stdout.flush()
        return jsonify({'error': str(e)}), 400


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ready', 'model_loaded': model is not None})


if __name__ == '__main__':
    print('Starting RL Predictor Server on port 5001...')
    sys.stdout.flush()
    app.run(host='127.0.0.1', port=5001, debug=False)
