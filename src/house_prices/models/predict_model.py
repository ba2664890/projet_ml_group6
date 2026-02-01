"""
Module de prédiction pour le projet House Prices.
Updated to work with unified pipeline from grp_06_ml.py
"""

import logging
from pathlib import Path
from typing import Any, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_trained_model(model_path: str = "models/house_prices_model.pkl") -> Pipeline:
    """
    Charge le pipeline complet.

    Args:
        model_path: Chemin vers le fichier du modèle

    Returns:
        Pipeline complet (preprocessing + model)
    """
    path = Path(model_path)
    if not path.exists():
        logger.error(f"Fichier modèle non trouvé: {model_path}")
        raise FileNotFoundError(f"Fichier modèle non trouvé: {model_path}")

    pipeline = joblib.load(path)
    logger.info(f"Pipeline chargé depuis {model_path}")
    return pipeline


def predict(pipeline: Pipeline, X: pd.DataFrame, use_log: bool = True) -> np.ndarray:
    """
    Effectue des prédictions sur de nouvelles données.

    Args:
        pipeline: Pipeline complet
        X: Features pour la prédiction
        use_log: Si True, applique la transformation inverse de log

    Returns:
        Prédictions
    """
    # Prédiction
    y_pred_log = pipeline.predict(X)

    # Transformation inverse si nécessaire
    if use_log:
        predictions = np.expm1(y_pred_log)
    else:
        predictions = y_pred_log

    logger.info(f"Prédictions effectuées pour {len(predictions)} observations")
    return predictions


if __name__ == "__main__":
    # Test du module
    logger.info("Test du module de prédiction...")

    try:
        pipeline = load_trained_model()
        logger.info("Pipeline chargé avec succès")
        logger.info(f"Type de pipeline: {type(pipeline)}")
    except FileNotFoundError:
        logger.warning("Aucun modèle trouvé. Entraînez d'abord un modèle avec train_model.py")
