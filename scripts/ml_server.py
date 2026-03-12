import os

import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Paths (always resolve from this file's directory, not process cwd)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "models", "ml_model.joblib")
ENCODER_PATH = os.path.join(SCRIPT_DIR, "models", "ml_encoder.joblib")

# Global variables for model and encoder
model = None
encoder = None

def load_model():
    global model, encoder
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            model = joblib.load(MODEL_PATH)
            encoder = joblib.load(ENCODER_PATH)
            print("ML Model and Encoder loaded successfully.")
            return True
        else:
            print(f"Error: Model or Encoder not found at {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or encoder is None:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.json
        # Expected fields: day_of_week, weather, nearby_event, inventory, yesterday_price
        # day_of_week: string ('Monday', etc.)
        # weather: string ('Sunny', etc.)
        # nearby_event: string ('yes', 'no')
        # inventory: float
        # yesterday_price: float

        features_raw = [
            data.get('day_of_week', 'Monday'),
            data.get('weather', 'Sunny'),
            data.get('nearby_event', 'no')
        ]
        
        # Encode categorical features
        # Reshape for encoder: [[day, weather, event]]
        encoded_cats = encoder.transform([features_raw])[0]
        
        # Construct full feature vector for Random Forest
        # [Day, Weather, Event, Inventory, YesterdayPrice]
        full_features = [
            encoded_cats[0], # Day
            encoded_cats[1], # Weather
            encoded_cats[2], # Event
            float(data.get('inventory', 1200)),
            float(data.get('yesterday_price', 5.0))
        ]

        # Predict
        prediction = model.predict([full_features])[0]
        
        # New mechanics use integer-dollar pricing from $1 to $10.
        suggested_price = int(round(float(prediction)))
        suggested_price = max(1, min(10, suggested_price))

        print(f"[ML DEBUG] Raw Prediction: {prediction:.4f}")
        print(f"[ML DEBUG] Result: Rounded Price ${suggested_price}")

        return jsonify({
            "suggested_price": suggested_price
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ready" if model is not None else "loading",
        "model_loaded": model is not None
    })

if __name__ == '__main__':
    load_model()
    print("Starting ML Predictor Server on port 5002...")
    app.run(host='127.0.0.1', port=5002)
