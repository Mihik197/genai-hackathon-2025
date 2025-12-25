from pathlib import Path
import joblib

MODEL_PATH = Path(__file__).parent / "credit_model.joblib"
bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
MODEL_AUC = bundle.get("auc", None)


def ml_score(features):
    """Get ML score from feature vector.
    
    Returns:
        tuple: (probability_high_risk, score_0_1000)
    """
    probs = model.predict_proba([features])[0]
    
    if 2 in list(model.classes_):
        high_idx = list(model.classes_).index(2)
        prob_high = float(probs[high_idx])
    else:
        prob_high = float(max(probs))

    score = int(prob_high * 1000)
    return prob_high, score
