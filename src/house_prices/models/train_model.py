"""
Module d'entraînement des modèles pour le projet House Prices.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split
import joblib
import logging
from pathlib import Path
from typing import Dict, Any, Tuple

from ..data.preprocessing import preprocess_data, get_feature_types, create_preprocessing_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_model(X: pd.DataFrame, y: pd.Series, params: Dict[str, Any] = None) -> Tuple[Any, Any]:
    """
    Entraîne le modèle Gradient Boosting avec un pipeline de prétraitement.
    """
    # Paramètres par défaut basés sur PROJECT_SUMMARY.md
    default_params = {"n_estimators": 200, "max_depth": 4, "learning_rate": 0.05, "subsample": 0.9, "random_state": 42}
    if params:
        default_params.update(params)

    # Identification des types de features
    num_features, cat_features, _ = get_feature_types(X)

    # S'assurer que les features catégorielles sont des strings
    X = X.copy()
    X[cat_features] = X[cat_features].astype(str)

    # Création du préprocesseur
    preprocessor = create_preprocessing_pipeline(num_features, cat_features)

    # Ajustement du préprocesseur
    logger.info("Ajustement du préprocesseur...")
    X_processed = preprocessor.fit_transform(X)

    # Entraînement du modèle
    logger.info(f"Entraînement du modèle avec les paramètres: {default_params}")
    model = GradientBoostingRegressor(**default_params)
    model.fit(X_processed, y)

    return model, preprocessor


def evaluate_model(model: Any, preprocessor: Any, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
    """
    Évalue les performances du modèle.
    """
    X_test_processed = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_processed)

    metrics = {
        "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
        "mae": mean_absolute_error(y_test, y_pred),
        "r2": r2_score(y_test, y_pred),
    }

    logger.info(f"Performances du modèle: {metrics}")
    return metrics


def save_model(model: Any, preprocessor: Any, output_path: str):
    """
    Sauvegarde le modèle et le préprocesseur dans un fichier pkl.
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    data = {"model": model, "preprocessor": preprocessor}

    joblib.dump(data, output_file)
    logger.info(f"Modèle sauvegardé dans {output_path}")


if __name__ == "__main__":
    from ..data.load_data import load_data

    # Chargement des données
    train_df, _ = load_data("data/raw")
    X, y = preprocess_data(train_df)

    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Entraînement
    model, preprocessor = train_model(X_train, y_train)

    # Évaluation
    evaluate_model(model, preprocessor, X_test, y_test)

    # Sauvegarde
    save_model(model, preprocessor, "models/house_prices_model.pkl")
