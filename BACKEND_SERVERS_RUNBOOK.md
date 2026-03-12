# Backend Servers Runbook (RL + ML)

Use this whenever you run the app locally and want real model-driven prices (not fallback values).

## 1) Python environment setup (one-time)

From repo root:

```bash
python3 -m venv scripts/venv
source scripts/venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Notes:
- `stable-baselines3` is required for `scripts/rl_server.py`.
- `joblib` + `scikit-learn` are required for `scripts/ml_server.py`.

## 2) Start the RL and ML servers

Open two terminals from repo root.

Terminal A (RL server on `5001`):

```bash
source scripts/venv/bin/activate
python scripts/rl_server.py
```

Terminal B (ML server on `5002`):

```bash
source scripts/venv/bin/activate
python scripts/ml_server.py
```

Optional: use PPO model for RL server:

```bash
source scripts/venv/bin/activate
RL_MODEL_ALGO=ppo python scripts/rl_server.py
```

## 3) Health checks

In a third terminal:

```bash
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:5002/health
```

Expected:
- RL: JSON with `"status": "ready"` and `"model_loaded": true`
- ML: JSON with `"status": "ready"` and `"model_loaded": true`

## 4) Start frontend

From repo root:

```bash
npm run dev
```

## 5) Quick troubleshooting

- Symptom: RL price is `$5.00` every day
  - Cause: RL backend fallback is being used.
  - Check:
    - `curl http://127.0.0.1:5001/health`
    - Browser console warning: `RL Agent fallback (Backend connection error)`

- Symptom: ML suggestion is missing or stuck
  - Check: `curl http://127.0.0.1:5002/health`

- Symptom: model file not found
  - Verify files exist:
    - `scripts/models/dqn_coffee.zip` (or `ppo_coffee.zip`)
    - `scripts/models/ml_model.joblib`
    - `scripts/models/ml_encoder.joblib`

## 6) Stop servers

Press `Ctrl + C` in each server terminal.
