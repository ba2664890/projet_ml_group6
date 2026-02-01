"""
House Prices Prediction Package for Laplace Immo

Ce package contient tous les outils nécessaires pour la prédiction des prix des maisons.
"""

__version__ = "1.0.0"
__author__ = "Laplace Immo Data Science Team"
__email__ = "data@laplace-immo.fr"

from .data.load_data import load_config, load_data
from .data.preprocessing import create_full_pipeline, get_feature_lists
from .models.predict_model import load_trained_model, predict
from .models.train_model import evaluate_model, train_model

__all__ = [
    "load_data",
    "load_config",
    "get_feature_lists",
    "create_full_pipeline",
    "train_model",
    "evaluate_model",
    "predict",
    "load_trained_model",
]

