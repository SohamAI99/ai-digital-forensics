from typing import List, Dict, Any, Optional
from backend.app.services.email_detector import email_detector_service

class LimeExplanationService:
    def __init__(self):
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        try:
            from lime.lime_text import LimeTextExplainer
            self.explainer = LimeTextExplainer(
                class_names=["Safe Email", "Phishing Email"],
                bow=True,
                random_state=42
            )
            print("[LimeExplanationService] LimeTextExplainer initialized successfully.")
        except Exception as e:
            print(f"[LimeExplanationService] Could not initialize LIME: {e}")
            self.explainer = None

    def explain(self, text: str, num_features: int = 8) -> Dict[str, Any]:
        """
        Explains which words/phrases influenced the model's prediction.
        """
        if not self.explainer:
            return {
                "status": "LIME explainer not initialized.",
                "features": []
            }

        cleaned = str(text or "").strip()
        # LIME needs at least a few words
        word_count = len(cleaned.split())
        if word_count < 3:
            return {
                "status": "Text too short for statistical LIME perturbation (minimum 3 words required).",
                "features": []
            }

        try:
            # We predict using the loaded pipeline's predict_proba
            exp = self.explainer.explain_instance(
                cleaned,
                email_detector_service.model.predict_proba,
                num_features=num_features,
                num_samples=250 # balanced speed and fidelity
            )

            as_list = exp.as_list()
            features = []
            for word, weight in as_list:
                features.append({
                    "word": str(word),
                    "weight": round(float(weight), 4)
                })

            return {
                "status": "LIME explanation computed successfully.",
                "features": features
            }
        except Exception as e:
            return {
                "status": f"LIME explanation generation failed: {str(e)}",
                "features": []
            }

lime_service = LimeExplanationService()
