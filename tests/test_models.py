"""
Tests unitaires pour les modèles de prédiction.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# Ajoute le chemin src au sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestModelTraining:
    """Tests pour l'entraînement des modèles."""

    def test_linear_regression_training(self):
        """Test de l'entraînement d'une régression linéaire."""
        # Données de test simples
        X = np.array([[1], [2], [3], [4], [5]])
        y = np.array([100, 200, 300, 400, 500])

        # Entraînement
        model = LinearRegression()
        model.fit(X, y)

        # Vérification
        assert hasattr(model, "coef_")
        assert hasattr(model, "intercept_")
        assert len(model.coef_) == 1
        assert model.coef_[0] > 0  # Relation positive

    def test_random_forest_training(self):
        """Test de l'entraînement d'un Random Forest."""
        # Données de test
        X = np.random.rand(100, 5)
        y = 1000 * X[:, 0] + 500 * X[:, 1] + np.random.randn(100) * 10

        # Entraînement
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X, y)

        # Vérification
        assert hasattr(model, "feature_importances_")
        assert len(model.feature_importances_) == 5
        assert model.score(X, y) > 0.5  # Score raisonnable

    def test_model_prediction_shape(self):
        """Test que les prédictions ont la bonne forme."""
        X_train = np.random.rand(50, 3)
        y_train = np.random.rand(50) * 100000
        X_test = np.random.rand(10, 3)

        model = LinearRegression()
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)

        assert len(predictions) == 10
        assert predictions.shape == (10,)


class TestModelEvaluation:
    """Tests pour l'évaluation des modèles."""

    def test_rmse_calculation(self):
        """Test du calcul du RMSE."""
        y_true = np.array([100000, 200000, 300000])
        y_pred = np.array([110000, 190000, 310000])

        rmse = np.sqrt(mean_squared_error(y_true, y_pred))

        expected_rmse = np.sqrt(np.mean([(10000) ** 2, (-10000) ** 2, (10000) ** 2]))
        assert abs(rmse - expected_rmse) < 0.01

    def test_r2_score_calculation(self):
        """Test du calcul du R²."""
        y_true = np.array([100000, 200000, 300000])
        y_pred = np.array([100000, 200000, 300000])  # Prédiction parfaite

        r2 = r2_score(y_true, y_pred)
        assert r2 == 1.0

    def test_r2_score_perfect_model(self):
        """Test du R² pour un modèle parfait."""
        X = np.array([[1], [2], [3]])
        y = np.array([100, 200, 300])

        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)

        r2 = r2_score(y, y_pred)
        assert abs(r2 - 1.0) < 0.001


class TestModelPerformance:
    """Tests de performance des modèles."""

    def test_model_performance_thresholds(self):
        """Test que le modèle atteint des seuils de performance minimum."""
        # Génération de données avec une relation claire
        np.random.seed(42)
        X = np.random.rand(100, 3)
        y = 100000 + 50000 * X[:, 0] + 25000 * X[:, 1] + 10000 * X[:, 2]

        # Division train/test
        split_idx = 80
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # Entraînement et évaluation
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        # Le modèle devrait avoir une bonne performance sur ces données simples
        assert r2 > 0.7, f"R² trop bas: {r2}"
        assert rmse < 5000, f"RMSE trop élevé: {rmse}"

    def test_model_consistency(self):
        """Test de la cohérence du modèle sur plusieurs runs."""
        np.random.seed(42)
        X = np.random.rand(50, 2)
        y = 100000 + 50000 * X[:, 0] + np.random.randn(50) * 1000

        scores = []
        for _ in range(3):
            model = LinearRegression()
            model.fit(X, y)
            score = model.score(X, y)
            scores.append(score)

        # Les scores devraient être très similaires (même seed)
        assert max(scores) - min(scores) < 0.01

    def test_feature_importance_random_forest(self):
        """Test de l'importance des features pour Random Forest."""
        # Données où la première feature est plus importante
        X = np.random.rand(100, 3)
        y = 10000 * X[:, 0] + 1000 * X[:, 1] + 100 * X[:, 2]

        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)

        importances = model.feature_importances_

        # La première feature devrait être la plus importante
        assert importances[0] > importances[1]
        assert importances[0] > importances[2]


class TestPredictionBounds:
    """Tests pour les bornes de prédiction."""

    def test_positive_predictions(self):
        """Test que les prédictions de prix sont positives."""
        X_train = np.random.rand(50, 3)
        y_train = np.abs(np.random.rand(50)) * 100000  # Prix positifs
        X_test = np.random.rand(10, 3)

        model = LinearRegression()
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        assert np.all(predictions > 0)

    def test_realistic_price_range(self):
        """Test que les prédictions sont dans une plage réaliste."""
        # Entraînement sur des prix réalistes (50k - 500k)
        X_train = np.random.rand(100, 4)
        y_train = 50000 + 450000 * np.random.rand(100)

        X_test = np.random.rand(20, 4)

        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)

        # Toutes les prédictions devraient être positives
        assert np.all(predictions > 0)

        # Et dans une plage raisonnable (avec une marge)
        assert np.all(predictions > 10000)  # Minimum 10k
        assert np.all(predictions < 1000000)  # Maximum 1M


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
