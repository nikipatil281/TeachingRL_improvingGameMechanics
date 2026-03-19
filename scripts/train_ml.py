import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def train_model():
    data_path = os.path.join(SCRIPT_DIR, "ml_assistant_data.csv")
    model_dir = os.path.join(SCRIPT_DIR, "models")
    
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    # Features: DayOfWeek, Weather, Event, StartingInventory, CompetitorPresence, CompetitorPrice
    # Target: UserPrice

    # 1. Define Categories for encoding (consistent with coffee_env.py mappings if possible)
    # DayOfWeek: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    # Weather: Sunny, Cloudy, Rainy
    # Event is generated as 0 in the simplified dataset, but we still allow 1 at inference time.

    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weathers_order = ['Sunny', 'Cloudy', 'Rainy']
    events_order = [0, 1]

    X = df[['DayOfWeek', 'Weather', 'Event', 'StartingInventory', 'CompetitorPresence', 'CompetitorPrice']]
    y = df['UserPrice']

    print("Encoding categorical features...")
    encoder = OrdinalEncoder(categories=[days_order, weathers_order, events_order])
    X_encoded = X.copy()
    X_encoded[['DayOfWeek', 'Weather', 'Event']] = encoder.fit_transform(X[['DayOfWeek', 'Weather', 'Event']])

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

    print(f"Training Random Forest Regressor on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model trained! MSE: {mse:.4f}, R2: {r2:.4f}")

    # Save components
    joblib.dump(model, os.path.join(model_dir, "ml_model.joblib"))
    joblib.dump(encoder, os.path.join(model_dir, "ml_encoder.joblib"))
    
    print(f"Model and encoder saved to {model_dir}/")

if __name__ == "__main__":
    train_model()
