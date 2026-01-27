"""
House Prices Prediction Package for Laplace Immo

Ce package contient tous les outils nécessaires pour la prédiction des prix des maisons.
"""

__version__ = "1.0.0"
__author__ = "Laplace Immo Data Science Team"
__email__ = "data@laplace-immo.fr"

from .data.load_data import load_data, load_config
from .data.preprocessing import preprocess_data, create_preprocessing_pipeline
from .models.train_model import train_model, evaluate_model
from .models.predict_model import predict, load_trained_model

__all__ = [
    "load_data",
    "load_config", 
    "preprocess_data",
    "create_preprocessing_pipeline",
    "train_model",
    "evaluate_model",
    "predict",
    "load_trained_model"
]