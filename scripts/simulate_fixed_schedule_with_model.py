import argparse
import csv
from pathlib import Path

import numpy as np
from stable_baselines3 import DQN

from coffee_env import (
    CUP_COST,
    LOW_SALES_PENALTY,
    SET_ID,
    WASTAGE_COST_PER_CUP,
    WEEKDAY_SALES_TARGET,
    WEEKEND_SALES_TARGET,
    WEEKLY_START_INVENTORY,
    calculate_demand,
    get_set_key,
    is_weekend,
)

DAY_MAP = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
}

WEATHER_MAP = {
    'Sunny': 0,
    'Cloudy': 1,
    'Rainy': 2,
}


def parse_args():
    parser = argparse.ArgumentParser(description='Replay fixed 28-day schedule with a selected RL model')
    parser.add_argument('--input_csv', default='../rl_28_day_simulation_results.csv', help='Path to baseline 28-day csv')
    parser.add_argument('--model_path', default='models/dqn_coffee_constrained_schedule_v2.zip', help='Path to RL model zip')
    parser.add_argument('--output_csv', default='../rl_28_day_simulation_results_v2.csv', help='Path to save replay output csv')
    parser.add_argument('--model_label', default='dqn_constrained_schedule_v2', help='Label written in output rows')
    return parser.parse_args()


def to_int_flag(value):
    return int(float(value))


def to_competitor_price(raw_value):
    txt = '' if raw_value is None else str(raw_value).strip()
    if txt == '':
        return 0
    return int(round(float(txt)))


def get_price_from_action(action):
    return max(1, min(10, int(action) + 1))


def build_state_vector(day_number, day_name, weather, inventory, nearby_event, competitor_present, competitor_price, yesterday_price):
    day_of_week = DAY_MAP[day_name]
    weather_idx = WEATHER_MAP[weather]
    set_key = get_set_key(day_name, weather, bool(nearby_event), bool(competitor_present))
    set_id = SET_ID.get(set_key, 0)

    return np.array([
        (day_number - 1.0) / 27.0,
        day_of_week / 6.0,
        weather_idx / 2.0,
        min(1.0, inventory / float(WEEKLY_START_INVENTORY)),
        float(nearby_event),
        float(competitor_present),
        min(1.0, competitor_price / 10.0),
        min(1.0, yesterday_price / 10.0),
        min(1.0, set_id / 7.0),
    ], dtype=np.float32)


def main():
    args = parse_args()

    input_csv = Path(args.input_csv)
    if not input_csv.exists():
        fallback = Path('../rl_28_day_simulation.csv')
        if fallback.exists():
            input_csv = fallback
        else:
            raise FileNotFoundError(f'Could not find input csv: {args.input_csv}')

    model_path = Path(args.model_path)
    if not model_path.exists():
        raise FileNotFoundError(f'Model not found: {args.model_path}')

    model = DQN.load(str(model_path))

    with input_csv.open('r', newline='') as f:
        baseline_rows = list(csv.DictReader(f))

    if len(baseline_rows) != 28:
        raise ValueError(f'Expected 28 rows in schedule CSV, found {len(baseline_rows)}')

    inventory = WEEKLY_START_INVENTORY
    yesterday_price = 5
    total_cumulative_profit = 0.0
    weekly_cumulative_profit = 0.0

    out_rows = []

    for idx, row in enumerate(baseline_rows, start=1):
        day_number = int(row['dayNumber'])
        week_number = int(row['weekNumber'])
        day_name = row['dayOfWeek']
        weather = row['weather']
        nearby_event = to_int_flag(row['nearbyEvent'])
        event_name = row.get('eventName', '')
        competitor_present = to_int_flag(row['competitorPresent'])
        competitor_price = to_competitor_price(row.get('competitorPrice')) if competitor_present else 0

        if day_number != idx:
            raise ValueError(f'Input CSV row order mismatch at row {idx}: dayNumber={day_number}')

        state = build_state_vector(
            day_number,
            day_name,
            weather,
            inventory,
            nearby_event,
            competitor_present,
            competitor_price,
            yesterday_price,
        )

        action, _ = model.predict(state, deterministic=True)
        rl_price = get_price_from_action(int(action))

        demand, _ = calculate_demand(
            rl_price,
            day_name,
            weather,
            bool(nearby_event),
            bool(competitor_present),
            competitor_price,
        )

        sales = min(max(0, int(demand)), inventory)
        gross_revenue = sales * rl_price
        cogs = sales * CUP_COST

        target = WEEKEND_SALES_TARGET if is_weekend(day_name) else WEEKDAY_SALES_TARGET
        low_sales_penalty = LOW_SALES_PENALTY if sales < target else 0

        inventory_end = inventory - sales
        sunday_wastage_penalty = (inventory_end * WASTAGE_COST_PER_CUP) if (day_number % 7 == 0) else 0.0

        daily_net_profit = gross_revenue - cogs - low_sales_penalty - sunday_wastage_penalty

        total_cumulative_profit += daily_net_profit
        weekly_cumulative_profit += daily_net_profit

        out_rows.append({
            'dayNumber': day_number,
            'weekNumber': week_number,
            'dayOfWeek': day_name,
            'weather': weather,
            'nearbyEvent': nearby_event,
            'eventName': event_name,
            'competitorPresent': competitor_present,
            'competitorPrice': competitor_price if competitor_present else '',
            'scheduleStateId': row.get('scheduleStateId', ''),
            'inventoryStart': inventory,
            'rlPrice': rl_price,
            'source': 'model_replay',
            'modelLabel': args.model_label,
            'demand': demand,
            'sales': sales,
            'grossRevenue': gross_revenue,
            'cogs': cogs,
            'dailyLowSalesPenalty': low_sales_penalty,
            'sundayWastagePenalty': sunday_wastage_penalty,
            'dailyNetProfit': daily_net_profit,
            'weeklyCumulativeProfit': weekly_cumulative_profit,
            'totalCumulativeProfit': total_cumulative_profit,
            'inventoryEnd': inventory_end,
        })

        yesterday_price = rl_price

        if day_number % 7 == 0:
            inventory = WEEKLY_START_INVENTORY
            weekly_cumulative_profit = 0.0
        else:
            inventory = inventory_end

    output_csv = Path(args.output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    header = list(out_rows[0].keys())
    with output_csv.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f'Input schedule CSV: {input_csv.resolve()}')
    print(f'Model used: {model_path.resolve()}')
    print(f'Saved replay CSV: {output_csv.resolve()}')
    print(f'Total cumulative profit: {total_cumulative_profit:.2f}')


if __name__ == '__main__':
    main()
