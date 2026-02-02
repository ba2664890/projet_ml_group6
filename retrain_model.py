#!/usr/bin/env python3
"""
Script simple pour réentraîner le modèle avec le preprocessing corrigé.
"""
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

import pandas as pd
import joblib
from sklearn.linear_model import HuberRegressor
from sklearn.pipeline import Pipeline
import numpy as np

from house_prices.data.preprocessing import create_full_pipeline

print("=" * 60)
print("RÉENTRAÎNEMENT DU MODÈLE AVEC PREPROCESSING CORRIGÉ")
print("=" * 60)

# 1. Charger les données
print("\n1. Chargement des données...")
train_df = pd.read_csv("data/raw/train.csv")
print(f"   ✓ {len(train_df)} observations chargées")

# 2. Séparer X et y
X_train = train_df.drop(columns=["SalePrice", "Id"])
y_train = train_df["SalePrice"]
y_train_log = np.log1p(y_train)  # Log transformation
print(f"   ✓ Features: {X_train.shape[1]} colonnes")

# 3. Créer le pipeline complet
print("\n2. Création du pipeline de preprocessing...")
preprocessing_pipeline = create_full_pipeline()
print("   ✓ Pipeline créé avec toutes les colonnes catégorielles")

# 4. Créer le modèle complet
print("\n3. Création du modèle HuberRegressor...")
full_pipeline = Pipeline([
    ('preprocessing', preprocessing_pipeline),
    ('model', HuberRegressor(epsilon=1.35, max_iter=200, alpha=0.0001))
])
print("   ✓ Pipeline complet assemblé")

# 5. Entraîner
print("\n4. Entraînement du modèle...")
print("   (Cela peut prendre quelques minutes...)")
full_pipeline.fit(X_train, y_train_log)
print("   ✓ Modèle entraîné avec succès!")

# 6. Sauvegarder
print("\n5. Sauvegarde du modèle...")
model_path = Path("models/house_prices_model.pkl")
model_path.parent.mkdir(exist_ok=True)
joblib.dump(full_pipeline, model_path)
print(f"   ✓ Modèle sauvegardé: {model_path}")

# 7. Test rapide
print("\n6. Test rapide du modèle...")
test_sample = X_train.iloc[:1].copy()
try:
    prediction_log = full_pipeline.predict(test_sample)
    prediction = np.expm1(prediction_log)[0]
    print(f"   ✓ Prédiction test: ${prediction:,.2f}")
    print(f"   ✓ Prix réel: ${y_train.iloc[0]:,.2f}")
except Exception as e:
    print(f"   ✗ Erreur lors du test: {e}")

print("\n" + "=" * 60)
print("✅ RÉENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!")
print("=" * 60)
