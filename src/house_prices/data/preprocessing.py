"""
Module de prétraitement des données pour le projet House Prices.
Includes advanced custom transformers from grp_06_ml.py
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.stats import skew
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.compose import make_column_selector
from sklearn.compose import make_column_selector as selector
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================
# CUSTOM TRANSFORMERS FROM grp_06_ml.py
# ============================================================


class MissingValuesHandler(BaseEstimator, TransformerMixin):
    """Advanced missing values handler with neighborhood-based imputation."""

    def __init__(
        self,
        none_features,
        zero_features,
        group_impute,
        mode_features,
        strategy_lotfrontage="median",
        neighborhoods_threshold=0.02,
    ):
        """Cette classe permet de traiter les missing values et elle pourra être inclus dans un Pipeline scikit-learn"""
        self.none_features = none_features
        self.zero_features = zero_features
        self.group_impute = group_impute
        self.mode_features = mode_features
        self.correct_neighborhoods_ = None
        self.neighborhoods_threshold = neighborhoods_threshold
        self.strategy_lotfrontage = strategy_lotfrontage  # median / mean
        self.global_stat_lotfrontage_ = None
        self.stat_lotfrontage_per_neighborhood_ = {}  # median / mean de lotfrontage par neighbourhood
        self.mode_for_mode_features_ = {}

    def fit(self, X_train, y=None):
        """Calcul des paramètres pour l'imputation à partir du jeu d'entraînement"""
        print("Missing Values Handler starting in fit...")
        logging.info("Calcul des paramètres pour l'imputation à partir du jeu d'entraînement...")
        if "Neighborhood" in X_train.columns:
            # Modalités assez représentées (% > self.neighborhoods_threshold)
            neighborhood_proportions = X_train["Neighborhood"].value_counts(normalize=True)
            correct_neighborhoods = neighborhood_proportions[neighborhood_proportions >= self.neighborhoods_threshold].index
            correct_neighborhoods = list(correct_neighborhoods)
            self.correct_neighborhoods_ = correct_neighborhoods

        # Mode for mode_features
        if self.mode_features and len(self.mode_features) > 0:
            result = {}
            for feature in self.mode_features:
                mode_value = X_train[feature].mode()[0]
                result[feature] = mode_value
            self.mode_for_mode_features_ = result

            # stat global pour lotfrontage
            if "LotFrontage" in X_train.columns:
                if self.strategy_lotfrontage == "median":
                    self.global_stat_lotfrontage_ = X_train["LotFrontage"].median()
                elif self.strategy_lotfrontage == "mean":
                    self.global_stat_lotfrontage_ = X_train["LotFrontage"].mean()
                else:
                    logging.error("Mauvaise valeur de strategy_lotfrontage: mettre mean ou median")

            # Stat de lotfrontage par neighborhoods
            if (
                "Neighborhood" in X_train.columns
                and "LotFrontage" in X_train.columns
                and self.correct_neighborhoods_ is not None
            ):
                X_train_temp = X_train.copy()
                # Conserver uniquement les correct_neighborhoods, les autres sont groupés en 'Autres'
                all_unique_neighborhoods = set(X_train_temp["Neighborhood"].unique())
                categories_to_replace = list(all_unique_neighborhoods.difference(set(self.correct_neighborhoods_)))
                X_train_temp["Neighborhood"] = X_train_temp["Neighborhood"].replace(categories_to_replace, "Autres")

                effective_neighborhoods = list(set(self.correct_neighborhoods_ + ["Autres"]))

                for neighborhood in effective_neighborhoods:
                    neighborhood_data = X_train_temp[X_train_temp["Neighborhood"] == neighborhood]
                    if self.strategy_lotfrontage == "median":
                        self.stat_lotfrontage_per_neighborhood_[neighborhood] = neighborhood_data["LotFrontage"].median()
                    elif self.strategy_lotfrontage == "mean":
                        self.stat_lotfrontage_per_neighborhood_[neighborhood] = neighborhood_data["LotFrontage"].mean()
                    else:
                        logging.error("Mauvaise valeur de strategy_lotfrontage: mettre mean ou median")

        return self  # Important pour la compatibilité avec scikit-learn

    def transform(self, X):
        """Applique diverses transformations pour gérer les valeurs manquantes"""
        X = X.copy()  # Travailler sur une copie pour éviter les SettingWithCopyWarning
        print("Missing Values Handler starting in transform...")
        logging.info("Imputation des valeurs manquantes en cours...")
        missing_before = X.isnull().sum().sum()
        logging.info(f"  • Valeurs manquantes avant: {missing_before:,}")

        logging.info("1. Imputation - ÉTAPE 1: NA = 'None' (Absence d'équipements)")
        if self.none_features and len(self.none_features) > 0:
            for feature in self.none_features:
                if feature in X.columns:
                    X[feature] = X[feature].fillna("None")
                    logging.info(f"  ✓ {feature}: NA → 'None'")

        logging.info("2. Imputation - ÉTAPE 2: NA = 0 (Quantité nulle)")
        if self.zero_features and len(self.zero_features) > 0:
            for feature in self.zero_features:
                if feature in X.columns:
                    X[feature] = X[feature].fillna(0)
                    logging.info(f"  ✓ {feature}: NA → 0")

        logging.info("3. Imputation - ÉTAPE 3: LotFrontage par groupe (Neighborhood)")
        # remplacer les categories mal représentées par 'Autres'
        # D'abord, identifier les catégories qui ne sont PAS dans `correct_neighborhoods`
        if self.correct_neighborhoods_ is not None and "Neighborhood" in X.columns:
            all_neighborhoods = set(X["Neighborhood"].unique())
            categories_to_replace = list(all_neighborhoods.difference(set(self.correct_neighborhoods_)))
            X["Neighborhood"] = X["Neighborhood"].replace(categories_to_replace, "Autres")

            # Imputation par médiane / moyenne de groupe
            # On utilisera le dictionnaire self.stat_lotfrontage_per_neighborhood_
            if "LotFrontage" in X.columns:
                mapped_lotfrontage = X["Neighborhood"].map(self.stat_lotfrontage_per_neighborhood_)
                X["LotFrontage"] = X["LotFrontage"].fillna(mapped_lotfrontage)

                # Si encore des NA (Neighborhood avec tous les NA), imputer par médiane globale
                remaining_na = X["LotFrontage"].isnull().sum()
                if remaining_na > 0:
                    if self.global_stat_lotfrontage_ is not None:
                        X["LotFrontage"] = X["LotFrontage"].fillna(self.global_stat_lotfrontage_)
                        logging.info(
                            f"   {remaining_na} valeurs imputées par {self.strategy_lotfrontage} globale ({self.global_stat_lotfrontage_:.1f})"
                        )
        else:
            logging.info(
                "  !!! LotFrontage: NA → aucune imputation car, pas de Neighborhood ou de correct_neighborhoods spécifié "
            )

        logging.info("4. IMPUTATION - ÉTAPE 4: Variables catégorielles par mode")
        if self.mode_for_mode_features_:
            for feature in self.mode_features:
                if feature in X.columns:
                    mode_value = self.mode_for_mode_features_[feature]
                    X[feature] = X[feature].fillna(mode_value)
        else:
            logging.info(
                "  !!! Variables catégorielles par mode: NA → aucune imputation car, pas de mode_for_mode_features spécifié "
            )

        na_final = X.isnull().sum().sum()
        logging.info(f"  ✓ Valeurs manquantes après:  {na_final:,}")

        return X


class AnomalyCorrector(BaseEstimator, TransformerMixin):
    """Corrects data anomalies and inconsistencies."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        print("Anomaly Corrector Handler starting...")

        # Fix GarageYrBlt > YearBuilt
        if "GarageYrBlt" in X.columns and "YearBuilt" in X.columns:
            mask = X["GarageYrBlt"] > X["YearBuilt"]
            X.loc[mask, "GarageYrBlt"] = X.loc[mask, "YearBuilt"]

        return X


class FeatureEngineer(BaseEstimator, TransformerMixin):
    """Advanced feature engineering for house prices."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        print("Feature Engineering Handler starting...")

        # Surfaces
        if all(col in X.columns for col in ["TotalBsmtSF", "1stFlrSF", "2ndFlrSF"]):
            X["TotalSF"] = X["TotalBsmtSF"] + X["1stFlrSF"] + X["2ndFlrSF"]
            X["TotalSF_AboveGround"] = X["1stFlrSF"] + X["2ndFlrSF"]
            X["Has2ndFloor"] = (X["2ndFlrSF"] > 0).astype(int)
            X["HasBasement"] = (X["TotalBsmtSF"] > 0).astype(int)

        # Porches
        porch_cols = ["OpenPorchSF", "3SsnPorch", "EnclosedPorch", "ScreenPorch", "WoodDeckSF"]
        if all(col in X.columns for col in porch_cols):
            X["TotalPorchSF"] = X["OpenPorchSF"] + X["3SsnPorch"] + X["EnclosedPorch"] + X["ScreenPorch"] + X["WoodDeckSF"]
            X["HasPorch"] = (X["TotalPorchSF"] > 0).astype(int)
            X["HasDeck"] = (X["WoodDeckSF"] > 0).astype(int)

        if "PoolArea" in X.columns:
            X["HasPool"] = (X["PoolArea"] > 0).astype(int)

        # Ages
        if "YrSold" in X.columns:
            if "YearBuilt" in X.columns:
                X["HouseAge"] = X["YrSold"] - X["YearBuilt"]
                X["IsNew"] = (X["YearBuilt"] == X["YrSold"]).astype(int)

            if "YearRemodAdd" in X.columns:
                X["RemodAge"] = X["YrSold"] - X["YearRemodAdd"]
                if "YearBuilt" in X.columns:
                    X["HasBeenRemod"] = (X["YearRemodAdd"] != X["YearBuilt"]).astype(int)

        # Temps
        if all(col in X.columns for col in ["YrSold", "YearBuilt", "YearRemodAdd"]):
            X["HouseAge"] = X["YrSold"] - X["YearBuilt"]
            X["RemodAge"] = X["YrSold"] - X["YearRemodAdd"]
            X["IsNew"] = (X["YrSold"] == X["YearBuilt"]).astype(int)
            X["HasBeenRemod"] = (X["YearRemodAdd"] > X["YearBuilt"]).astype(int)
            X["HouseAgeBin"] = pd.cut(
                X["HouseAge"],
                bins=[0, 5, 20, 50, 100, 200],
                labels=["New", "Recent", "Moderate", "Old", "VeryOld"],
                include_lowest=True,
            )

        # Garage
        if "GarageArea" in X.columns:
            X["HasGarage"] = (X["GarageArea"] > 0).astype(int)
        if all(col in X.columns for col in ["YrSold", "GarageYrBlt"]):
            X["GarageAge"] = (X["YrSold"] - X["GarageYrBlt"]).clip(lower=0)

        # Cheminée
        if all(col in X.columns for col in ["Fireplaces", "FireplaceQu"]):
            fireplace_map = {"None": 0, "Po": 1, "Fa": 2, "TA": 3, "Gd": 4, "Ex": 5}
            X["HasFireplace"] = (X["Fireplaces"] > 0).astype(int)
            X["FireplaceScore"] = X["Fireplaces"] * X["FireplaceQu"].map(fireplace_map).fillna(0)

        # Suppressions
        drop_cols = [
            "1stFlrSF",
            "2ndFlrSF",
            "TotalBsmtSF",
            "OpenPorchSF",
            "3SsnPorch",
            "EnclosedPorch",
            "YearBuilt",
            "YearRemodAdd",
            "YrSold",
            "GarageYrBlt",
            "Fireplaces",
        ]
        X = X.drop(columns=[c for c in drop_cols if c in X.columns])

        return X


class OrdinalEncoderCustom(BaseEstimator, TransformerMixin):
    """Custom ordinal encoder with predefined mappings."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        print("Ordinal Encoder Handler starting...")

        quality_mapping = {"None": 0, "Po": 1, "Fa": 2, "TA": 3, "Gd": 4, "Ex": 5}
        exposure_mapping = {"None": 0, "No": 1, "Mn": 2, "Av": 3, "Gd": 4}
        garage_finish_mapping = {"None": 0, "Unf": 1, "RFn": 2, "Fin": 3}
        functional_mapping = {"Sal": 0, "Sev": 1, "Maj2": 2, "Maj1": 3, "Mod": 4, "Min2": 5, "Min1": 6, "Typ": 7}
        slope_mapping = {"Sev": 0, "Mod": 1, "Gtl": 2}
        shape_mapping = {"IR3": 0, "IR2": 1, "IR1": 2, "Reg": 3}
        contour_mapping = {"Low": 0, "HLS": 1, "Bnk": 2, "Lvl": 3}
        house_age_mapping = {"New": 0, "Recent": 1, "Moderate": 2, "Old": 3, "VeryOld": 4}
        fence_mapping = {"None": 0, "MnWw": 1, "GdWo": 2, "MnPrv": 3, "GdPrv": 4}
        bsmt_fin_type_mapping = {"None": 0, "Unf": 1, "LwQ": 2, "Rec": 3, "BLQ": 4, "ALQ": 5, "GLQ": 6}

        # Quality features
        for col in [
            "ExterQual",
            "ExterCond",
            "BsmtQual",
            "BsmtCond",
            "HeatingQC",
            "KitchenQual",
            "FireplaceQu",
            "GarageQual",
            "GarageCond",
            "PoolQC",
        ]:
            if col in X.columns:
                X[col] = X[col].map(quality_mapping)

        # Other ordinal features
        if "BsmtExposure" in X.columns:
            X["BsmtExposure"] = X["BsmtExposure"].map(exposure_mapping)
        if "GarageFinish" in X.columns:
            X["GarageFinish"] = X["GarageFinish"].map(garage_finish_mapping)
        if "Functional" in X.columns:
            X["Functional"] = X["Functional"].map(functional_mapping)
        if "LandSlope" in X.columns:
            X["LandSlope"] = X["LandSlope"].map(slope_mapping)
        if "LotShape" in X.columns:
            X["LotShape"] = X["LotShape"].map(shape_mapping)
        if "LandContour" in X.columns:
            X["LandContour"] = X["LandContour"].map(contour_mapping)
        if "HouseAgeBin" in X.columns:
            X["HouseAgeBin"] = X["HouseAgeBin"].map(house_age_mapping)
        if "Fence" in X.columns:
            X["Fence"] = X["Fence"].map(fence_mapping)

        # Basement finish type mapping
        for col in ["BsmtFinType1", "BsmtFinType2"]:
            if col in X.columns:
                X[col] = X[col].map(bsmt_fin_type_mapping)

        return X


class SkewnessCorrector(BaseEstimator, TransformerMixin):
    """
    Corrige l'asymétrie (skewness) des variables numériques.
    Applique log1p si |skew| > 0.75.
    """

    def __init__(self, threshold=0.75):
        self.threshold = threshold
        self.skewed_features = []

    def fit(self, X, y=None):
        print("Skewness Corrector Handler starting...")
        # Identifier les variables numériques
        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()

        for col in numeric_features:
            # Vérifier conditions: non-négatif et assez de valeurs uniques (éviter binaires)
            if X[col].min() >= 0 and X[col].nunique() > 10:
                try:
                    skew_val = skew(X[col].dropna())
                    if abs(skew_val) > self.threshold:
                        self.skewed_features.append(col)
                        print(f"  Feature détectée asymétrique: {col} (skew={skew_val:.2f})")
                except Exception:
                    pass

        print(f"  Total features asymétriques à corriger: {len(self.skewed_features)}")
        return self

    def transform(self, X):
        X = X.copy()
        print("Skewness Corrector applying transformation...")
        for col in self.skewed_features:
            if col in X.columns:
                X[col] = np.log1p(X[col])
        return X


class DebugTransformer(BaseEstimator, TransformerMixin):
    """Debug transformer to log data state."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        print("\n--- DEBUG: Après prétraitement ---")
        print("Dimension:", X.shape)
        num_nans = X.isnull().sum().sum()
        print("Nombre de NaNs:", num_nans)
        if num_nans > 0:
            print("Colonnes avec NAN et leurs types:")
            nan_cols_df = X.isnull().sum()
            nan_cols_df = nan_cols_df[nan_cols_df > 0]
            for col in nan_cols_df.index:
                print(f"  - {col}: Dtype={X[col].dtype}, NaNs={nan_cols_df[col]}")
        else:
            print("Aucune valeur manquante trouvée.")
        print("----------------------------------\n")
        return X


# ============================================================
# HELPER FUNCTIONS
# ============================================================


def get_feature_lists():
    """
    Returns the feature lists needed for MissingValuesHandler.
    These are based on the grp_06_ml.py configuration.
    """
    # NA = Absence d'équipements (None) --- variables catégorielles
    none_features = [
        "PoolQC",
        "MiscFeature",
        "Alley",
        "Fence",
        "FireplaceQu",
        "GarageType",
        "GarageFinish",
        "GarageQual",
        "GarageCond",
        "BsmtQual",
        "BsmtCond",
        "BsmtExposure",
        "BsmtFinType1",
        "BsmtFinType2",
        "MasVnrType",
    ]

    # NA = 0 (pas d'équipements) --- variables numériques
    zero_features = [
        "GarageYrBlt",
        "GarageArea",
        "GarageCars",
        "BsmtFinSF1",
        "BsmtFinSF2",
        "BsmtUnfSF",
        "TotalBsmtSF",
        "BsmtFullBath",
        "BsmtHalfBath",
        "MasVnrArea",
    ]

    # NA à imputer par médiane/groupe (lien fort entre LotFrontage et Neighborhood)
    group_impute = {"LotFrontage": "Neighborhood"}

    # NA à imputer par mode --- variables catégorielles
    mode_features = [
        "MSZoning",
        "Functional",
        "Utilities",
        "SaleType",
        "KitchenQual",
        "Exterior1st",
        "Exterior2nd",
        "Electrical",
        # Ajout des colonnes catégorielles manquantes (non déjà dans none_features)
        "Street",
        "LotShape",
        "LandContour",
        "LotConfig",
        "LandSlope",
        "Condition1",
        "Condition2",
        "BldgType",
        "RoofStyle",
        "RoofMatl",
        "Foundation",
        "Heating",
        "CentralAir",
        "PavedDrive",
        "SaleCondition",
        "MSSubClass",  # Peut être traité comme catégoriel
        # Ajout des colonnes ordinales de qualité qui doivent être imputées avant encodage
        "ExterQual",
        "ExterCond",
        "HeatingQC",
    ]

    return none_features, zero_features, group_impute, mode_features


def create_full_pipeline():
    """
    Creates the complete preprocessing pipeline as defined in grp_06_ml.py.
    This includes all custom transformers and the final ColumnTransformer.
    """
    none_features, zero_features, group_impute, mode_features = get_feature_lists()

    pipeline = Pipeline(
        [
            (
                "missing",
                MissingValuesHandler(
                    none_features=none_features,
                    zero_features=zero_features,
                    group_impute=group_impute,
                    mode_features=mode_features,
                ),
            ),
            ("anomaly", AnomalyCorrector()),
            ("features", FeatureEngineer()),
            ("ordinal", OrdinalEncoderCustom()),
            ("skewness", SkewnessCorrector()),  # Ajout de la correction de skewness
            ("debug", DebugTransformer()),
            (
                "preprocess",
                ColumnTransformer(
                    [
                        (
                            "num",
                            Pipeline([("scaler", StandardScaler())]),
                            make_column_selector(dtype_exclude=object),
                        ),
                        (
                            "nom",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                            make_column_selector(dtype_include=object),
                        ),
                    ],
                    remainder="passthrough",
                ),
            ),
        ]
    )
    return pipeline


if __name__ == "__main__":
    # Test du module
    print("Preprocessing module loaded successfully")
    print("Available transformers:")
    print("  - MissingValuesHandler")
    print("  - AnomalyCorrector")
    print("  - FeatureEngineer")
    print("  - OrdinalEncoderCustom")
    print("  - DebugTransformer")
