import os
import json
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sklearn.model_selection import train_test_split

def evaluate_phishing_model(data_path="Phishing_Email.csv", model_path="phishing_email_model.joblib", output_path="backend/evaluation_results.json"):
    if not os.path.isabs(data_path) and not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Phishing_Email.csv")
    if not os.path.isabs(model_path) and not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "phishing_email_model.joblib")

    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Total raw records: {len(df)}")
    
    # Text and label cleaning
    data = df[['Email Text', 'Email Type']].dropna().copy()
    data.columns = ['email_text', 'label']
    data['email_text'] = data['email_text'].astype(str).str.strip()
    data = data[data['email_text'] != '']
    
    label_mapping = {
        "safe email": 0, "safe": 0, "legitimate": 0, "ham": 0,
        "phishing email": 1, "phishing": 1, "phishing email ": 1, "spam": 1
    }
    data['label'] = data['label'].str.strip().str.lower().map(label_mapping)
    data = data.dropna(subset=['label'])
    data['label'] = data['label'].astype(int)
    
    # Check duplicates
    raw_count = len(data)
    data = data.drop_duplicates(subset=['email_text', 'label']).reset_index(drop=True)
    dedup_count = len(data)
    duplicates_removed = raw_count - dedup_count
    
    # Stratified split matching notebook seed
    X_train, X_test, y_train, y_test = train_test_split(
        data['email_text'], data['label'], test_size=0.20, random_state=42, stratify=data['label']
    )
    
    print(f"Loading model from: {model_path}")
    model = joblib.load(model_path)
    
    print(f"Evaluating on {len(X_test)} unseen test samples...")
    y_pred = model.predict(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1]).tolist()
    
    report = {
        "dataset": {
            "source_file": os.path.basename(data_path),
            "total_records": raw_count,
            "deduplicated_records": dedup_count,
            "duplicates_removed": duplicates_removed,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "classes": {"0": "Safe Email", "1": "Phishing Email"}
        },
        "model": {
            "pipeline_steps": list(model.named_steps.keys()) if hasattr(model, 'named_steps') else "custom",
            "classifier": model.named_steps['classifier'].__class__.__name__ if hasattr(model, 'named_steps') else str(type(model)),
            "vectorizer": model.named_steps['tfidf'].__class__.__name__ if hasattr(model, 'named_steps') else "unknown",
        },
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "true_negative_safe": cm[0][0],
                "false_positive_phishing": cm[0][1],
                "false_negative_safe": cm[1][0],
                "true_positive_phishing": cm[1][1]
            }
        }
    }
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"Evaluation completed successfully! Results written to {output_path}")
    print(f"Accuracy: {acc*100:.2f}%, Precision: {prec*100:.2f}%, Recall: {rec*100:.2f}%, F1: {f1*100:.2f}%")
    return report

if __name__ == "__main__":
    evaluate_phishing_model()
