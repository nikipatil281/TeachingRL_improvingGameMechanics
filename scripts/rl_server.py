import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from stable_baselines3 import DQN, PPO
import os
import json

app = Flask(__name__)
CORS(app) # Allow React frontend to call this

# Load the trained model
MODEL_ALGO = os.environ.get("RL_MODEL_ALGO", "dqn").strip().lower()
MODEL_PATH = f"models/{MODEL_ALGO}_coffee.zip"

if not os.path.exists(MODEL_PATH):
    # Backward-compatible fallback for older model naming
    MODEL_PATH = "models/dqn_coffee.zip"
    MODEL_ALGO = "dqn"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"RL model not found at {MODEL_PATH}. Please train the model first.")

if MODEL_ALGO == "ppo":
    model = PPO.load(MODEL_PATH)
else:
    model = DQN.load(MODEL_PATH)

MARKET_STATES_PATH = "../market_states.json"
with open(MARKET_STATES_PATH, "r") as f:
    market_states = json.load(f)

DAY_MAP = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
}

WEATHER_MAP = {
    0: "sunny",
    1: "cloudy",
    2: "rainy",
}

def get_price_from_action(action):
    # Matches the mapping in CoffeeShopEnv
    return 1.0 + (action * 0.5)

def get_optimal_price_hint(payload):
    day_name = DAY_MAP.get(int(float(payload.get("day_of_week", 0))), "Monday")
    weather = WEATHER_MAP.get(int(float(payload.get("weather", 0))), "sunny")
    event = "yes" if int(float(payload.get("nearby_event", 0))) == 1 else "no"
    comp = "yes" if int(float(payload.get("competitor_present", 0))) == 1 else "no"

    state = next(
        (
            s for s in market_states
            if s["Day of the week"] == day_name
            and s["Weather"].lower() == weather
            and s["Event"].lower() == event
            and s["Competitor"].lower() == comp
        ),
        None,
    )
    return float(state.get("OptimalPrice", 5.5)) if state else 5.5

import sys

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    print(f"\n[DEBUG] Predict trigger: {data}")
    sys.stdout.flush()
    
    try:
        day_number = float(data.get('day_number', 1))
        day_number = max(1.0, min(28.0, day_number))
        state = np.array([
            (day_number - 1.0) / 27.0,
            float(data.get('day_of_week', 0)) / 6.0,
            float(data.get('weather', 0)) / 2.0,
            min(1.0, float(data.get('inventory', 0)) / 2000.0),
            float(data.get('nearby_event', 0)),
            float(data.get('competitor_present', 0)),
            min(1.0, float(data.get('competitor_price', 0)) / 15.0),
            min(1.0, float(data.get('yesterday_price', 4.5)) / 15.0),
            min(1.0, get_optimal_price_hint(data) / 10.0)
        ], dtype=np.float32)
        
        # Predict optimal action (price)
        action, _states = model.predict(state, deterministic=True)
        suggested_price = get_price_from_action(int(action))
        
        print(f"[DEBUG] Result: Action {action}, Price ${suggested_price}")
        sys.stdout.flush()
        
        return jsonify({
            "suggested_price": float(suggested_price),
            "action": int(action)
        })
    except Exception as e:
        print(f"[ERROR] Prediction failed: {str(e)}")
        sys.stdout.flush()
        return jsonify({"error": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "model_loaded": model is not None})

if __name__ == '__main__':
    print("Starting RL Predictor Server on port 5001...")
    sys.stdout.flush()
    app.run(host='127.0.0.1', port=5001, debug=False)
