"""
Module d'entraînement des modèles pour le projet House Prices.
Updated to use advanced preprocessing pipeline from grp_06_ml.py
"""

import logging
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import BayesianRidge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from ..data.preprocessing import create_full_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_model(X: pd.DataFrame, y: pd.Series, params: Dict[str, Any] = None) -> Tuple[Pipeline, Any]:
    """
    Entraîne le modèle BayesianRidge avec le pipeline de prétraitement complet.

    Args:
        X: Features d'entraînement
        y: Variable cible (SalePrice)
        params: Paramètres optionnels pour BayesianRidge

    Returns:
        Tuple (pipeline complet, scaler pour y)
    """
    # Paramètres par défaut optimisés pour BayesianRidge
    default_params = {"alpha_1": 1e-06, "alpha_2": 1e-06, "lambda_1": 1e-06, "lambda_2": 1e-06}
    if params:
        default_params.update(params)

    # Transformation log de la cible
    logger.info("Application de la transformation log sur SalePrice...")
    y_log = np.log1p(y)

    # Création du pipeline de prétraitement complet
    logger.info("Création du pipeline de prétraitement...")
    preprocessing_pipeline = create_full_pipeline()

    # Création du pipeline complet (preprocessing + model)
    logger.info(f"Entraînement du modèle BayesianRidge avec les paramètres: {default_params}")
    full_pipeline = Pipeline([("preprocessing", preprocessing_pipeline), ("model", BayesianRidge(**default_params))])

    # Entraînement
    full_pipeline.fit(X, y_log)
    logger.info("Entraînement terminé avec succès")

    return full_pipeline, y_log


def evaluate_model(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series, use_log: bool = True) -> Dict[str, float]:
    """
    Évalue les performances du modèle.

    Args:
        pipeline: Pipeline complet (preprocessing + model)
        X_test: Features de test
        y_test: Variable cible de test
        use_log: Si True, applique la transformation inverse de log

    Returns:
        Dictionnaire des métriques
    """
    # Prédiction
    if use_log:
        y_test_log = np.log1p(y_test)
        y_pred_log = pipeline.predict(X_test)
        y_pred = np.expm1(y_pred_log)
        y_test_eval = y_test
    else:
        y_pred = pipeline.predict(X_test)
        y_test_eval = y_test

    metrics = {
        "rmse": np.sqrt(mean_squared_error(y_test_eval, y_pred)),
        "mae": mean_absolute_error(y_test_eval, y_pred),
        "r2": r2_score(y_test_eval, y_pred),
    }

    logger.info(f"Performances du modèle: {metrics}")
    return metrics


def save_model(pipeline: Pipeline, output_path: str):
    """
    Sauvegarde le pipeline complet dans un fichier pkl.

    Args:
        pipeline: Pipeline complet à sauvegarder
        output_path: Chemin de sortie
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, output_file)
    logger.info(f"Pipeline sauvegardé dans {output_path}")


if __name__ == "__main__":
    from ..data.load_data import load_data

    # Chargement des données
    logger.info("Chargement des données...")
    train_df, _ = load_data("data/raw")

    # Suppression de l'ID si présent
    if "Id" in train_df.columns:
        train_df = train_df.drop(columns=["Id"])

    # Séparation X et y
    X = train_df.drop(columns=["SalePrice"])
    y = train_df["SalePrice"]

    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")

    # Entraînement
    pipeline, _ = train_model(X_train, y_train)

    # Évaluation
    metrics = evaluate_model(pipeline, X_test, y_test, use_log=True)
    logger.info(f"RMSE: ${metrics['rmse']:,.2f}")
    logger.info(f"MAE: ${metrics['mae']:,.2f}")
    logger.info(f"R²: {metrics['r2']:.4f}")

    # Sauvegarde
    save_model(pipeline, "models/house_prices_model.pkl")
