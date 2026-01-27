"""
Module de prédiction pour le projet House Prices.
"""

import joblib
import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Any, Union, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_trained_model(model_path: str = "models/house_prices_model.pkl") -> Dict[str, Any]:
    """
    Charge le modèle et le préprocesseur.
    """
    path = Path(model_path)
    if not path.exists():
        logger.error(f"Fichier modèle non trouvé: {model_path}")
        raise FileNotFoundError(f"Fichier modèle non trouvé: {model_path}")

    data = joblib.load(path)
    logger.info(f"Modèle chargé depuis {model_path}")
    return data


def predict(model_data: Dict[str, Any], X: pd.DataFrame) -> np.ndarray:
    """
    Effectue des prédictions sur de nouvelles données.
    """
    model = model_data["model"]
    preprocessor = model_data["preprocessor"]

    # Transformation des données
    X_processed = preprocessor.transform(X)

    # Prédiction
    predictions = model.predict(X_processed)

    return predictions
