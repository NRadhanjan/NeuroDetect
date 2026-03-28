from flask import Flask, request, jsonify, render_template
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)

model = joblib.load("models/autism_final_model.joblib")
scaler = joblib.load("models/scaler.joblib")

feature_order = [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    'Age_Mons', 'Sex', 'Ethnicity', 'Jaundice',
    'Family_mem_with_ASD', 'Who completed the test'
]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        input_dict = {
            'A1': int(data['A1']),
            'A2': int(data['A2']),
            'A3': int(data['A3']),
            'A4': int(data['A4']),
            'A5': int(data['A5']),
            'A6': int(data['A6']),
            'A7': int(data['A7']),
            'A8': int(data['A8']),
            'A9': int(data['A9']),
            'A10': int(data['A10']),
            'Age_Mons': int(data['Age_Mons']),
            'Sex': int(data['Sex']),
            'Ethnicity': int(data['Ethnicity']),
            'Jaundice': int(data['Jaundice']),
            'Family_mem_with_ASD': int(data['Family_mem_with_ASD']),
            'Who completed the test': int(data['Who_completed_test'])
        }

        X_input = pd.DataFrame([input_dict], columns=feature_order)
        X_scaled = scaler.transform(X_input)

        pred = model.predict(X_scaled)[0]
        proba = model.predict_proba(X_scaled)[0]
        confidence = round(float(max(proba)) * 100, 2)
        risk_level = "High" if proba[1] >= 0.7 else "Moderate" if proba[1] >= 0.4 else "Low"

        return jsonify({
            "prediction": "Yes" if pred == 1 else "No",
            "confidence": confidence,
            "risk_level": risk_level
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)