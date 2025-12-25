# Credit Risk Engine

Minimal skeleton for a credit scoring microservice.

## Structure

- `app/` - application code
  - `main.py` - FastAPI entrypoint
  - `config.py` - configuration
  - `models.py` - Pydantic models
  - `api/credit.py` - scoring API endpoints
  - `scoring/` - scoring logic and assets
  - `audit/` - decision logging
  - `utils/` - helper utilities

## Quick start

1. Create a venv and install dependencies:

   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

2. Generate a synthetic dataset (one-time):

   python -m app.training.generate_dataset

3. Train the ML model (writes `app/artifacts/credit_model.joblib`):

   python -m app.training.train_model

4. Run the app:

   uvicorn app.main:app --reload

5. POST to `/credit/assess` with `sample_request.json` to test (see `sample_request.json`).

Open API docs at http://127.0.0.1:8000/docs
