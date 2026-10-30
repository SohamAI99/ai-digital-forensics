import os
import joblib
import json
from typing import Tuple, Dict, Any, Optional
from backend.app.config import MODEL_PATH, EVALUATION_PATH

class EmailDetectorService:
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.evaluation_meta = {}
        self.is_loaded = False
        self.load_model()
        self.load_evaluation()

    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.is_loaded = True
                print(f"[EmailDetectorService] Loaded joblib pipeline successfully from {self.model_path}")
            else:
                print(f"[EmailDetectorService] Model file not found at {self.model_path}")
                self.is_loaded = False
        except Exception as e:
            print(f"[EmailDetectorService] Failed to load model: {e}")
            self.is_loaded = False

    def load_evaluation(self):
        if os.path.exists(EVALUATION_PATH):
            try:
                with open(EVALUATION_PATH, "r", encoding="utf-8") as f:
                    self.evaluation_meta = json.load(f)
            except Exception as e:
                print(f"[EmailDetectorService] Failed to load evaluation json: {e}")

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Runs inference on raw email text.
        Returns:
            dict containing prediction ('Phishing Email' or 'Safe Email'),
            phishing_probability, safe_probability, and confidence.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Email classification model is not loaded.")

        cleaned_text = str(text or "").strip()
        if not cleaned_text:
            return {
                "prediction": "Inconclusive (Empty Input)",
                "phishing_probability": 0.0,
                "safe_probability": 0.0,
                "is_empty": True
            }

        # Model expects iterable of raw strings:
        preds = self.model.predict([cleaned_text])
        prediction_int = int(preds[0])
        
        # Probabilities
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba([cleaned_text])[0]
            classes = self.model.named_steps["classifier"].classes_ if hasattr(self.model, "named_steps") else [0, 1]
            prob_map = dict(zip(classes, probs))
            phishing_prob = float(prob_map.get(1, 0.0))
            safe_prob = float(prob_map.get(0, 0.0))
        else:
            phishing_prob = 1.0 if prediction_int == 1 else 0.0
            safe_prob = 1.0 - phishing_prob

        return {
            "prediction": "Phishing Email" if prediction_int == 1 else "Safe Email",
            "prediction_class": prediction_int,
            "phishing_probability": round(phishing_prob, 4),
            "safe_probability": round(safe_prob, 4),
            "is_empty": False
        }

# Global singleton
email_detector_service = EmailDetectorService()
