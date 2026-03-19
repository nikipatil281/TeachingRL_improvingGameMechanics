import argparse
import os

import pandas as pd
from stable_baselines3 import DQN

from coffee_env import CoffeeShopEnv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    parser = argparse.ArgumentParser(
        description="Generate ML training data from the trained RL agent on simplified states"
    )
    parser.add_argument("--episodes", type=int, default=40, help="Number of 28-day episodes to simulate (~1120 rows)")
    args = parser.parse_args()

    models_path = os.path.join(SCRIPT_DIR, "models", "dqn_coffee.zip")
    export_path = os.path.join(SCRIPT_DIR, "ml_assistant_data.csv")

    if not os.path.exists(models_path):
        print(f"Error: Trained model not found at {models_path}.")
        return

    print("Loading trained RL agent...")
    model = DQN.load(models_path)
    env = CoffeeShopEnv(market_states_path="../market_states.json")

    records = []

    print(f"Generating {args.episodes} episodes (~{args.episodes * 28} rows) of ML data...")

    for ep in range(args.episodes):
        env.reset()

        for day_number in range(1, 29):
            env._apply_day_state(day_number)
            env.nearby_event = 0
            env.competitor_present = 0
            env.competitor_price = 0

            obs = env._get_obs()
            day_of_week = env.day
            weather = env.weather
            inventory_start = int(env.inventory)
            nearby_event = 0

            action_rl, _ = model.predict(obs, deterministic=True)
            rl_price = env._get_price_from_action(action_rl)
            user_price = max(1, int(round(rl_price - 1.0)))

            records.append({
                "Episode": ep + 1,
                "Day": day_number,
                "DayOfWeek": day_of_week,
                "Weather": weather,
                "Event": nearby_event,
                "StartingInventory": inventory_start,
                "CompetitorPresence": 0,
                "CompetitorPrice": 0,
                "UserPrice": user_price,
            })

        if (ep + 1) % 10 == 0:
            print(f"Completed episode {ep + 1} / {args.episodes}...")

    df = pd.DataFrame(records)
    df.to_csv(export_path, index=False)
    print(f"\nSuccessfully saved {len(df)} records to {export_path}!")

    print("\nDataset columns:")
    print(list(df.columns))
    print("\nUserPrice distribution:")
    print(df["UserPrice"].value_counts().sort_index())

if __name__ == "__main__":
    main()
