"""
Script d'entraînement avec tracking MLflow pour le projet House Prices.
"""

import logging
from pathlib import Path

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ..data.load_data import load_data
from .train_model import evaluate_model, train_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_with_mlflow(
    experiment_name: str = "House Prices - BayesianRidge",
    run_name: str = None,
    params: dict = None,
):
    """
    Entraîne le modèle avec tracking MLflow.
    
    Args:
        experiment_name: Nom de l'expérience MLflow
        run_name: Nom du run (optionnel)
        params: Paramètres du modèle BayesianRidge
    """
    # Configuration MLflow
    mlflow.set_experiment(experiment_name)
    
    # Chargement des données
    logger.info("Chargement des données...")
    train_df, _ = load_data("data/raw")
    
    # Suppression de l'ID si présent
    if 'Id' in train_df.columns:
        train_df = train_df.drop(columns=['Id'])
    
    # Séparation X et y
    X = train_df.drop(columns=['SalePrice'])
    y = train_df['SalePrice']
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")
    
    # Démarrer le run MLflow
    with mlflow.start_run(run_name=run_name):
        logger.info("Démarrage du run MLflow...")
        
        # Paramètres par défaut
        default_params = {
            'alpha_1': 1e-06,
            'alpha_2': 1e-06,
            'lambda_1': 1e-06,
            'lambda_2': 1e-06
        }
        if params:
            default_params.update(params)
        
        # Log des paramètres
        mlflow.log_param("model_type", "BayesianRidge")
        mlflow.log_param("use_log_transform", True)
        mlflow.log_param("test_size", 0.2)
        mlflow.log_param("random_state", 42)
        for key, value in default_params.items():
            mlflow.log_param(key, value)
        
        # Entraînement
        logger.info("Entraînement du modèle...")
        pipeline, _ = train_model(X_train, y_train, params=default_params)
        
        # Évaluation
        logger.info("Évaluation du modèle...")
        metrics = evaluate_model(pipeline, X_test, y_test, use_log=True)
        
        # Log des métriques
        mlflow.log_metric("rmse", metrics['rmse'])
        mlflow.log_metric("mae", metrics['mae'])
        mlflow.log_metric("r2_score", metrics['r2'])
        
        logger.info(f"RMSE: ${metrics['rmse']:,.2f}")
        logger.info(f"MAE: ${metrics['mae']:,.2f}")
        logger.info(f"R²: {metrics['r2']:.4f}")
        
        # Créer un exemple d'input pour la signature
        input_example = X_train.head(1)
        
        # Log du modèle avec signature
        logger.info("Sauvegarde du modèle dans MLflow...")
        mlflow.sklearn.log_model(
            pipeline,
            "model",
            input_example=input_example,
            registered_model_name="house_prices_bayesian_ridge"
        )
        
        # Log des artifacts supplémentaires
        # Sauvegarder les feature names
        feature_names_path = "mlruns/feature_names.txt"
        Path("mlruns").mkdir(exist_ok=True)
        with open(feature_names_path, "w") as f:
            f.write("\n".join(X_train.columns.tolist()))
        mlflow.log_artifact(feature_names_path)
        
        logger.info(f"Run MLflow terminé. Run ID: {mlflow.active_run().info.run_id}")
        
        return pipeline, metrics


if __name__ == "__main__":
    # Entraînement avec MLflow
    pipeline, metrics = train_with_mlflow(
        experiment_name="House Prices - BayesianRidge Production",
        run_name="baseline_model"
    )
    
    print("\n" + "="*50)
    print("RÉSULTATS FINAUX")
    print("="*50)
    print(f"RMSE: ${metrics['rmse']:,.2f}")
    print(f"MAE: ${metrics['mae']:,.2f}")
    print(f"R²: {metrics['r2']:.4f}")
    print("="*50)
