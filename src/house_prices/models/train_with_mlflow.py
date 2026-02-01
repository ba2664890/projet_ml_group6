"""
Script d'entraînement avec tracking MLflow pour comparer plusieurs modèles.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import BayesianRidge
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from ..data.load_data import load_data
from ..data.preprocessing import create_full_pipeline
from .train_model import evaluate_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_and_log_model(
    model_name: str,
    model_instance: Any,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    run_params: Dict[str, Any] = None,
):
    """
    Entraîne un modèle spécifique et le log dans MLflow.
    """
    with mlflow.start_run(run_name=f"Train_{model_name}", nested=True):
        logger.info(f"--- Entraînement du modèle : {model_name} ---")

        # Log des hyperparamètres
        mlflow.log_param("model_name", model_name)
        if run_params:
            for k, v in run_params.items():
                mlflow.log_param(k, v)

        # Création du pipeline
        preprocessing = create_full_pipeline()
        pipeline = Pipeline([("preprocessing", preprocessing), ("model", model_instance)])

        # Transformation log de la cible
        y_train_log = np.log1p(y_train)

        # Entraînement
        pipeline.fit(X_train, y_train_log)

        # Évaluation (avec inversion du log gérée par evaluate_model si use_log=True)
        metrics = evaluate_model(pipeline, X_test, y_test, use_log=True)

        # Log des métriques
        mlflow.log_metric("rmse", metrics["rmse"])
        mlflow.log_metric("mae", metrics["mae"])
        mlflow.log_metric("r2", metrics["r2"])

        # Sauvegarde du modèle
        input_example = X_train.head(1)
        mlflow.sklearn.log_model(
            pipeline, "model", input_example=input_example, registered_model_name=f"house_prices_{model_name.lower()}"
        )

        logger.info(f"Modèle {model_name} loggé avec succès. RMSE: {metrics['rmse']:.2f}")
        return metrics


def run_comparison(experiment_name: str = "Compare Models"):
    """
    Lance la comparaison de 4 modèles (définis par l'utilisateur).
    """
    mlflow.set_experiment(experiment_name)

    # Chargement des données
    logger.info("Chargement des données...")
    train_df, _ = load_data("data/raw")
    if "Id" in train_df.columns:
        train_df = train_df.drop(columns=["Id"])

    X = train_df.drop(columns=["SalePrice"])
    y = train_df["SalePrice"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    from sklearn.linear_model import HuberRegressor, Ridge

    models_to_test = [
        ("HuberRegressor", HuberRegressor(epsilon=1.35, alpha=10.0), {"epsilon": 1.35, "alpha": 10.0}),
        ("Ridge", Ridge(alpha=138.9495), {"alpha": 138.9495}),
        (
            "BayesianRidge",
            BayesianRidge(lambda_2=1e-06, lambda_1=0.01, alpha_2=0.00359, alpha_1=2.1544e-05),
            {"lambda_2": 1e-06, "lambda_1": 0.01},
        ),
        ("ExtraTrees", ExtraTreesRegressor(n_estimators=600, max_depth=None, random_state=42), {"n_estimators": 600}),
    ]

    # Lancement de l'expérience parente
    with mlflow.start_run(run_name="User_Recommended_Models_Comparison") as parent_run:
        mlflow.log_param("parent_run", True)
        logger.info(f"Début de la comparaison. Parent Run ID: {parent_run.info.run_id}")

        results = []
        for name, model, params in models_to_test:
            metrics = train_and_log_model(name, model, X_train, y_train, X_test, y_test, params)
            results.append({"model": name, **metrics})

    # Afficher le résumé
    results_df = pd.DataFrame(results).sort_values(by="rmse")
    print("\n=== CLASSEMENT DES MODÈLES (RMSE) ===")
    print(results_df)

    # Sauvegarder les résultats pour l'API
    output_path = Path("data/processed/model_comparison.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    results_df.to_json(output_path, orient="records", indent=4)
    logger.info(f"Comparaison des modèles sauvegardée dans {output_path}")


if __name__ == "__main__":
    run_comparison("House Prices - User Models Comparison")
