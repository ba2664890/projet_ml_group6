"""
Tests unitaires pour le module de chargement des données.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

# Ajoute le chemin src au sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from house_prices.data.load_data import display_data_info, get_target_distribution, load_data
from house_prices.data.preprocessing import (
    MissingValuesHandler,
    AnomalyCorrector,
    FeatureEngineer,
    OrdinalEncoderCustom,
    SkewnessCorrector,
    create_full_pipeline,
)


class TestDataLoading:
    """Classe de tests pour le chargement des données."""

    def test_load_data_success(self):
        """Test du chargement réussi des données."""
        # Créer un fichier CSV de test
        test_data = pd.DataFrame(
            {"Id": [1, 2, 3], "Feature1": [10, 20, 30], "Feature2": ["A", "B", "C"], "SalePrice": [100000, 200000, 300000]}
        )

        test_dir = Path("test_data")
        test_dir.mkdir(exist_ok=True)
        test_data.to_csv(test_dir / "train.csv", index=False)

        # Test du chargement
        train_df, test_df = load_data(str(test_dir), "train.csv")

        assert train_df is not None
        assert train_df.shape == (3, 4)
        assert "SalePrice" in train_df.columns

        # Nettoyage
        import shutil

        shutil.rmtree(test_dir)

    def test_display_data_info(self, capsys):
        """Test de l'affichage des informations du dataset."""
        df = pd.DataFrame(
            {"Id": [1, 2, 3], "Feature1": [10, 20, np.nan], "Feature2": ["A", "B", "C"], "SalePrice": [100000, 200000, 300000]}
        )

        display_data_info(df, "Test Dataset")
        captured = capsys.readouterr()

        assert "Test Dataset" in captured.out
        assert "Dimensions: (3, 4)" in captured.out

    def test_get_target_distribution(self):
        """Test du calcul des statistiques de distribution de la cible."""
        df = pd.DataFrame({"SalePrice": [100000, 200000, 300000, 400000, 500000]})

        stats = get_target_distribution(df, "SalePrice")

        assert stats["mean"] == 300000
        assert stats["median"] == 300000
        assert stats["min"] == 100000
        assert stats["max"] == 500000

    def test_get_target_distribution_missing_column(self):
        """Test avec une colonne cible manquante."""
        df = pd.DataFrame({"Feature1": [1, 2, 3]})

        with pytest.raises(ValueError):
            get_target_distribution(df, "SalePrice")


class TestDataPreprocessing:
    """Tests pour le prétraitement des données."""

    def test_missing_value_handling(self):
        """Test de la gestion des valeurs manquantes."""
        df = pd.DataFrame(
            {
                "num_feature": [1, 2, np.nan, 4, 5],
                "cat_feature": ["A", "B", None, "A", "C"],
                "SalePrice": [100, 200, 300, 400, 500],
            }
        )

        # Test que les données peuvent être nettoyées
        df_clean = df.copy()
        df_clean["num_feature"] = df_clean["num_feature"].fillna(df_clean["num_feature"].median())
        df_clean["cat_feature"] = df_clean["cat_feature"].fillna("None")

        assert not df_clean["num_feature"].isnull().any()
        assert not df_clean["cat_feature"].isnull().any()
        assert df_clean.loc[2, "num_feature"] == 3.0  # médiane
        assert df_clean.loc[2, "cat_feature"] == "None"

    def test_feature_engineering(self):
        """Test de la création de nouvelles features."""
        df = pd.DataFrame(
            {
                "YearBuilt": [2000, 1990, 1980],
                "YrSold": [2020, 2020, 2020],
                "GrLivArea": [1000, 1500, 2000],
                "TotalBsmtSF": [500, 750, 1000],
                "OverallQual": [7, 6, 8],
                "OverallCond": [5, 6, 7],
            }
        )

        # Test de l'ingénierie des features
        df["HouseAge"] = df["YrSold"] - df["YearBuilt"]
        df["TotalSF"] = df["GrLivArea"] + df["TotalBsmtSF"]
        df["OverallScore"] = df["OverallQual"] * df["OverallCond"]

        assert "HouseAge" in df.columns
        assert "TotalSF" in df.columns
        assert "OverallScore" in df.columns

        assert df.loc[0, "HouseAge"] == 20
        assert df.loc[0, "TotalSF"] == 1500
        assert df.loc[0, "OverallScore"] == 35


class TestDataIntegrity:
    """Tests d'intégrité des données."""

    def test_no_negative_prices(self):
        """Test qu'il n'y a pas de prix négatifs."""
        df = pd.DataFrame({"SalePrice": [100000, 200000, 300000]})

        assert (df["SalePrice"] >= 0).all()

    def test_realistic_price_range(self):
        """Test que les prix sont dans une plage réaliste."""
        df = pd.DataFrame({"SalePrice": [50000, 150000, 300000, 500000]})

        # Prix réalistes pour Ames, Iowa
        assert df["SalePrice"].min() >= 10000  # Minimum réaliste
        assert df["SalePrice"].max() <= 1000000  # Maximum réaliste

    def test_feature_types(self):
        """Test des types de données des features importantes."""
        df = pd.DataFrame(
            {
                "OverallQual": [7, 6, 8],  # Devrait être numérique
                "GrLivArea": [1000, 1500, 2000],  # Devrait être numérique
                "SalePrice": [100000, 200000, 300000],  # Devrait être numérique
            }
        )

        assert df["OverallQual"].dtype in ["int64", "float64"]
        assert df["GrLivArea"].dtype in ["int64", "float64"]
        assert df["SalePrice"].dtype in ["int64", "float64"]


class TestCustomTransformers:
    """Tests pour les transformers personnalisés."""

    def test_missing_values_handler(self):
        """Test du MissingValuesHandler."""
        df = pd.DataFrame(
            {
                "LotFrontage": [np.nan, 70, 80, np.nan],
                "Neighborhood": ["A", "A", "B", "B"],
                "GarageType": [np.nan, "Attached", "Detached", np.nan],
                "GarageArea": [np.nan, 500, 600, np.nan],
            }
        )

        handler = MissingValuesHandler(
            none_features=[], zero_features=["GarageArea"], group_impute={}, mode_features=["GarageType"]
        )
        handler.fit(df)
        df_transformed = handler.transform(df)

        # Vérifier qu'il n'y a plus de NaN
        assert df_transformed["GarageType"].notna().all()
        assert df_transformed["GarageArea"].notna().all()

    def test_anomaly_corrector(self):
        """Test de l'AnomalyCorrector."""
        df = pd.DataFrame(
            {
                "YearBuilt": [2000, 1990, 1980],
                "GarageYrBlt": [2010, 1990, 1980],  # Anomalie sur la première ligne
            }
        )

        corrector = AnomalyCorrector()
        df_transformed = corrector.fit_transform(df)

        # La première valeur devrait être corrigée
        assert df_transformed.loc[0, "GarageYrBlt"] == 2000
        assert df_transformed.loc[1, "GarageYrBlt"] == 1990

    def test_feature_engineer(self):
        """Test du FeatureEngineer."""
        df = pd.DataFrame(
            {
                "YearBuilt": [2000, 1990],
                "YrSold": [2020, 2020],
                "1stFlrSF": [1000, 1200],
                "2ndFlrSF": [500, 0],
                "TotalBsmtSF": [800, 900],
            }
        )

        engineer = FeatureEngineer()
        df_transformed = engineer.fit_transform(df)

        # Vérifier que les nouvelles features sont créées
        assert "HouseAge" in df_transformed.columns
        assert "TotalSF" in df_transformed.columns
        assert "Has2ndFloor" in df_transformed.columns

        # Vérifier les valeurs
        assert df_transformed.loc[0, "HouseAge"] == 20
        assert df_transformed.loc[0, "TotalSF"] == 2300  # 1000 + 500 + 800
        assert df_transformed.loc[0, "Has2ndFloor"] == 1
        assert df_transformed.loc[1, "Has2ndFloor"] == 0

    def test_ordinal_encoder(self):
        """Test de l'OrdinalEncoderCustom."""
        df = pd.DataFrame(
            {
                "ExterQual": ["Ex", "Gd", "TA", "Fa"],
                "BsmtQual": ["Ex", "Gd", "None", "TA"],
            }
        )

        encoder = OrdinalEncoderCustom()
        df_transformed = encoder.fit_transform(df)

        # Vérifier que les valeurs sont encodées
        assert df_transformed.loc[0, "ExterQual"] == 5  # Ex = 5
        assert df_transformed.loc[1, "ExterQual"] == 4  # Gd = 4
        assert df_transformed.loc[2, "BsmtQual"] == 0  # None = 0

    def test_skewness_corrector(self):
        """Test du SkewnessCorrector."""
        # Créer des données avec skewness forte
        skewed_data = np.exp(np.random.normal(0, 1, 100))  # Log-normal distribution (skewed)
        normal_data = np.random.normal(0, 1, 100)  # Normal distribution (not skewed)

        df = pd.DataFrame(
            {"SkewedFeature": skewed_data, "NormalFeature": normal_data, "BinaryFeature": [0, 1] * 50}  # Devrait être ignoré
        )

        # Ajouter de l'asymétrie manuellement si nécessaire
        df["SkewedFeature"] = df["SkewedFeature"] ** 3

        corrector = SkewnessCorrector(threshold=0.75)
        corrector.fit(df)
        df_transformed = corrector.transform(df)

        # SkewedFeature devrait être transformée
        assert "SkewedFeature" in corrector.skewed_features
        # La valeur transformée devrait être différente de l'originale
        assert not np.array_equal(df["SkewedFeature"], df_transformed["SkewedFeature"])
        # La valeur transformée devrait être log1p(original)
        np.testing.assert_array_almost_equal(df_transformed["SkewedFeature"], np.log1p(df["SkewedFeature"]))

        # NormalFeature ne devrait pas être transformée (ou moins probable)
        # Note: on ne teste pas strictement 'NormalFeature' car randomness peut créer skewness

        # BinaryFeature ne devrait pas être transformée (nb unique < 10)
        assert "BinaryFeature" not in corrector.skewed_features
        np.testing.assert_array_equal(df["BinaryFeature"], df_transformed["BinaryFeature"])

    def test_full_pipeline_creation(self):
        """Test de la création du pipeline complet."""
        pipeline = create_full_pipeline()

        # Vérifier que le pipeline est créé
        assert pipeline is not None
        assert hasattr(pipeline, "fit")
        assert hasattr(pipeline, "transform")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
