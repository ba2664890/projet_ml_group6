"""
Tests unitaires pour les modèles de prédiction.
Updated for BayesianRidge pipeline with log transformation.
Uses real data from data/raw/train.csv.
"""

import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import BayesianRidge
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

# Ajoute le chemin src au sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from house_prices.data.load_data import load_data
from house_prices.models.predict_model import load_trained_model, predict
from house_prices.models.train_model import evaluate_model, save_model, train_model


class TestNewPipelineWithRealData:
    """Tests pour le nouveau pipeline BayesianRidge avec données réelles."""

    @pytest.fixture
    def real_data(self):
        """Charge les données réelles pour les tests."""
        try:
            train_df, _ = load_data("data/raw")
            if "Id" in train_df.columns:
                train_df = train_df.drop(columns=["Id"])
            X = train_df.drop(columns=["SalePrice"]).head(100)  # Utiliser seulement 100 lignes pour les tests
            y = train_df["SalePrice"].head(100)
            return X, y
        except FileNotFoundError:
            pytest.skip("Données réelles non disponibles")

    def test_train_model_returns_pipeline(self, real_data):
        """Test que train_model retourne un Pipeline."""
        X, y = real_data

        pipeline, y_log = train_model(X, y)

        assert isinstance(pipeline, Pipeline)
        assert hasattr(pipeline, "predict")
        assert len(y_log) == len(y)

    def test_log_transformation(self, real_data):
        """Test que la transformation log est appliquée correctement."""
        X, y = real_data
        y_log_expected = np.log1p(y)

        pipeline, y_log = train_model(X, y)

        np.testing.assert_array_almost_equal(y_log, y_log_expected)

    def test_pipeline_prediction(self, real_data):
        """Test que le pipeline peut faire des prédictions."""
        X, y = real_data

        # Split simple
        split_idx = 80
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        pipeline, _ = train_model(X_train, y_train)
        predictions = predict(pipeline, X_test, use_log=True)

        assert len(predictions) == len(X_test)
        assert all(predictions > 0)  # Prix positifs

    def test_evaluate_model_with_log(self, real_data):
        """Test de l'évaluation avec transformation log."""
        X, y = real_data

        # Split simple
        split_idx = 80
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        pipeline, _ = train_model(X_train, y_train)
        metrics = evaluate_model(pipeline, X_test, y_test, use_log=True)

        assert "rmse" in metrics
        assert "mae" in metrics
        assert "r2" in metrics
        assert metrics["rmse"] > 0
        assert metrics["mae"] > 0


class TestModelSaveLoad:
    """Tests pour la sauvegarde et le chargement du modèle."""

    @pytest.fixture
    def real_data(self):
        """Charge les données réelles pour les tests."""
        try:
            train_df, _ = load_data("data/raw")
            if "Id" in train_df.columns:
                train_df = train_df.drop(columns=["Id"])
            X = train_df.drop(columns=["SalePrice"]).head(50)
            y = train_df["SalePrice"].head(50)
            return X, y
        except FileNotFoundError:
            pytest.skip("Données réelles non disponibles")

    def test_save_and_load_pipeline(self, real_data):
        """Test de sauvegarde et chargement du pipeline."""
        X, y = real_data

        pipeline, _ = train_model(X, y)

        # Sauvegarde
        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = Path(tmpdir) / "test_model.pkl"
            save_model(pipeline, str(model_path))

            # Chargement
            loaded_pipeline = load_trained_model(str(model_path))

            assert isinstance(loaded_pipeline, Pipeline)

            # Test de prédiction avec le modèle chargé
            X_test = X.head(5)
            predictions = predict(loaded_pipeline, X_test, use_log=True)
            assert len(predictions) == 5
            assert all(predictions > 0)


from sklearn.linear_model import HuberRegressor

class TestHuberRegressor:
    """Tests spécifiques pour HuberRegressor."""

    @pytest.fixture
    def real_data(self):
        """Charge les données réelles pour les tests."""
        try:
            train_df, _ = load_data("data/raw")
            if "Id" in train_df.columns:
                train_df = train_df.drop(columns=["Id"])
            X = train_df.drop(columns=["SalePrice"]).head(50)
            y = train_df["SalePrice"].head(50)
            return X, y
        except FileNotFoundError:
            pytest.skip("Données réelles non disponibles")

    def test_huber_regressor_parameters(self, real_data):
        """Test que HuberRegressor est configuré avec les bons paramètres."""
        X, y = real_data

        params = {"epsilon": 1.35, "alpha": 10.0}

        pipeline, _ = train_model(X, y, params=params)

        # Vérifier que le modèle est bien un HuberRegressor
        model = pipeline.named_steps["model"]
        assert isinstance(model, HuberRegressor)
        assert model.epsilon == 1.35
        assert model.alpha == 10.0


class TestModelPerformance:
    """Tests de performance des modèles."""

    @pytest.fixture
    def real_data(self):
        """Charge les données réelles pour les tests."""
        try:
            train_df, _ = load_data("data/raw")
            if "Id" in train_df.columns:
                train_df = train_df.drop(columns=["Id"])
            X = train_df.drop(columns=["SalePrice"]).head(200)
            y = train_df["SalePrice"].head(200)
            return X, y
        except FileNotFoundError:
            pytest.skip("Données réelles non disponibles")

    def test_model_performance_on_real_data(self, real_data):
        """Test que le modèle atteint des performances raisonnables."""
        X, y = real_data

        # Split train/test
        split_idx = 160
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        pipeline, _ = train_model(X_train, y_train)
        metrics = evaluate_model(pipeline, X_test, y_test, use_log=True)

        # Le modèle devrait avoir une performance raisonnable
        assert metrics["r2"] > 0.3, f"R² trop bas: {metrics['r2']}"
        assert metrics["rmse"] < 100000, f"RMSE trop élevé: {metrics['rmse']}"


class TestPredictionBounds:
    """Tests pour les bornes de prédiction."""

    @pytest.fixture
    def real_data(self):
        """Charge les données réelles pour les tests."""
        try:
            train_df, _ = load_data("data/raw")
            if "Id" in train_df.columns:
                train_df = train_df.drop(columns=["Id"])
            X = train_df.drop(columns=["SalePrice"]).head(100)
            y = train_df["SalePrice"].head(100)
            return X, y
        except FileNotFoundError:
            pytest.skip("Données réelles non disponibles")

    def test_positive_predictions(self, real_data):
        """Test que les prédictions de prix sont positives."""
        X, y = real_data

        # Split simple
        split_idx = 80
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train = y[:split_idx]

        pipeline, _ = train_model(X_train, y_train)
        predictions = predict(pipeline, X_test, use_log=True)

        assert np.all(predictions > 0)
        assert np.all(predictions < 1000000)  # Prix raisonnables


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
