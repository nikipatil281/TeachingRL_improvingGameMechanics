import os
import argparse
from stable_baselines3 import DQN, PPO
from stable_baselines3.common.env_checker import check_env
from stable_baselines3.common.evaluation import evaluate_policy
from coffee_env import CoffeeShopEnv

def build_dqn(env):
    return DQN(
        "MlpPolicy",
        env,
        verbose=0,
        learning_rate=0.00025,
        buffer_size=200000,
        learning_starts=5000,
        batch_size=256,
        gamma=0.99,
        target_update_interval=1000,
        exploration_fraction=0.35,
        exploration_initial_eps=1.0,
        exploration_final_eps=0.02,
        train_freq=4,
        gradient_steps=1,
        policy_kwargs={"net_arch": [256, 256]},
        seed=42,
    )

def build_ppo(env):
    return PPO(
        "MlpPolicy",
        env,
        verbose=0,
        learning_rate=0.0003,
        n_steps=2048,
        batch_size=256,
        n_epochs=10,
        gamma=0.995,
        gae_lambda=0.95,
        ent_coef=0.01,
        clip_range=0.2,
        policy_kwargs={"net_arch": dict(pi=[256, 256], vf=[256, 256])},
        seed=42,
    )

def main():
    parser = argparse.ArgumentParser(description="Train an RL agent to play the Coffee Shop simulation")
    parser.add_argument("--algo", choices=["dqn", "ppo"], default="dqn", help="RL algorithm")
    parser.add_argument("--timesteps", type=int, default=600000, help="Number of timesteps to train")
    parser.add_argument("--eval_episodes", type=int, default=100, help="Number of episodes to evaluate")
    parser.add_argument("--log_interval", type=int, default=200, help="Policy log interval during training")
    args = parser.parse_args()

    # Define paths
    models_dir = "models"
    models_path = f"{models_dir}/{args.algo}_coffee.zip"
    
    os.makedirs(models_dir, exist_ok=True)

    # 1. Initialize custom environment
    env = CoffeeShopEnv(market_states_path="../market_states.json")

    # Validate the environment to ensure Gym compatibility
    print("Checking environment compatibility...")
    check_env(env, warn=True)
    print("Environment check passed!")

    # 2. Setup model
    model = build_dqn(env) if args.algo == "dqn" else build_ppo(env)

    # 3. Train the Model
    print(f"\nTraining {args.algo.upper()} agent for {args.timesteps} timesteps...")
    model.learn(total_timesteps=args.timesteps, progress_bar=True, log_interval=args.log_interval)

    # 4. Save
    print(f"\nSaving model to {models_path}...")
    model.save(models_path)

    # 5. Evaluate the newly trained model
    print("\nEvaluating trained policy...")
    eval_env = CoffeeShopEnv(market_states_path="../market_states.json")
    mean_reward, std_reward = evaluate_policy(model, eval_env, n_eval_episodes=args.eval_episodes)
    print(f"Mean Reward over {args.eval_episodes} games: {mean_reward:.2f} +/- {std_reward:.2f}")

if __name__ == "__main__":
    main()
