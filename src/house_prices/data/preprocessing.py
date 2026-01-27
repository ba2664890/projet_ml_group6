"""
Module de prétraitement des données pour le projet House Prices.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingValueHandler(BaseEstimator, TransformerMixin):
    """Handler personnalisé pour les valeurs manquantes."""

    def __init__(self, strategy: str = "median", fill_value: Any = None):
        self.strategy = strategy
        self.fill_value = fill_value

    def fit(self, X: pd.DataFrame, y=None):
        if self.strategy == "median":
            self.fill_values_ = X.median()
        elif self.strategy == "mean":
            self.fill_values_ = X.mean()
        elif self.strategy == "most_frequent":
            self.fill_values_ = X.mode().iloc[0]
        elif self.strategy == "constant":
            self.fill_values_ = pd.Series(self.fill_value, index=X.columns)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_copy = X.copy()
        for col in X_copy.columns:
            if X_copy[col].isnull().any():
                X_copy[col] = X_copy[col].fillna(self.fill_values_[col])
        return X_copy


class FeatureEngineering(BaseEstimator, TransformerMixin):
    """Création de nouvelles features."""

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_copy = X.copy()

        # Feature 1: Âge de la maison
        if "YearBuilt" in X_copy.columns and "YrSold" in X_copy.columns:
            X_copy["HouseAge"] = X_copy["YrSold"] - X_copy["YearBuilt"]

        # Feature 2: Âge depuis la rénovation
        if "YearRemodAdd" in X_copy.columns and "YrSold" in X_copy.columns:
            X_copy["RemodAge"] = X_copy["YrSold"] - X_copy["YearRemodAdd"]

        # Feature 3: Surface totale
        if "GrLivArea" in X_copy.columns and "TotalBsmtSF" in X_copy.columns:
            X_copy["TotalSF"] = X_copy["GrLivArea"] + X_copy["TotalBsmtSF"].fillna(0)

        # Feature 4: Nombre total de salles de bain
        bathroom_cols = ["FullBath", "HalfBath", "BsmtFullBath", "BsmtHalfBath"]
        if all(col in X_copy.columns for col in bathroom_cols):
            X_copy["TotalBathrooms"] = (
                X_copy["FullBath"]
                + 0.5 * X_copy["HalfBath"]
                + X_copy["BsmtFullBath"].fillna(0)
                + 0.5 * X_copy["BsmtHalfBath"].fillna(0)
            )

        # Feature 5: Qualité globale (combinaison)
        if "OverallQual" in X_copy.columns and "OverallCond" in X_copy.columns:
            X_copy["OverallScore"] = X_copy["OverallQual"] * X_copy["OverallCond"]

        # Feature 6: Aire de garage par voiture
        if "GarageArea" in X_copy.columns and "GarageCars" in X_copy.columns:
            X_copy["GarageAreaPerCar"] = np.where(X_copy["GarageCars"] > 0, X_copy["GarageArea"] / X_copy["GarageCars"], 0)

        # Feature 7: Surface habitable par pièce
        if "GrLivArea" in X_copy.columns and "TotRmsAbvGrd" in X_copy.columns:
            X_copy["AreaPerRoom"] = np.where(X_copy["TotRmsAbvGrd"] > 0, X_copy["GrLivArea"] / X_copy["TotRmsAbvGrd"], 0)

        return X_copy


def get_feature_types(df: pd.DataFrame) -> Tuple[List[str], List[str], List[str]]:
    """
    Sépare les colonnes en numériques, catégorielles et de type date.

    Args:
        df: DataFrame à analyser

    Returns:
        Tuple de listes: (numerical_features, categorical_features, date_features)
    """
    numerical_features = []
    categorical_features = []
    date_features = []

    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            numerical_features.append(col)
        elif df[col].dtype == "object":
            categorical_features.append(col)
        elif df[col].dtype in ["datetime64", "timedelta64"]:
            date_features.append(col)

    # Exclure la variable cible et l'ID
    exclude_cols = ["SalePrice", "Id"]
    numerical_features = [col for col in numerical_features if col not in exclude_cols]
    categorical_features = [col for col in categorical_features if col not in exclude_cols]

    return numerical_features, categorical_features, date_features


def create_preprocessing_pipeline(
    numerical_features: List[str], categorical_features: List[str], target_col: str = "SalePrice"
) -> ColumnTransformer:
    """
    Crée un pipeline de prétraitement complet.

    Args:
        numerical_features: Liste des features numériques
        categorical_features: Liste des features catégorielles
        target_col: Nom de la variable cible

    Returns:
        ColumnTransformer configuré
    """

    # Pipeline pour les variables numériques
    numerical_transformer = Pipeline(steps=[("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])

    # Pipeline pour les variables catégorielles
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    # Combine les pipelines
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_transformer, numerical_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    return preprocessor


def preprocess_data(
    df: pd.DataFrame, target_col: str = "SalePrice", test_mode: bool = False
) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
    """
    Prétraite les données complètes.

    Args:
        df: DataFrame à prétraiter
        target_col: Nom de la colonne cible
        test_mode: Si True, le target n'est pas retourné

    Returns:
        Tuple (X, y) où X est le DataFrame prétraité et y la variable cible
    """
    df_copy = df.copy()

    # Ingénierie des features
    feature_engineer = FeatureEngineering()
    df_copy = feature_engineer.transform(df_copy)

    # Séparation features/target
    if test_mode or target_col not in df_copy.columns:
        X = df_copy
        y = None
    else:
        X = df_copy.drop(columns=[target_col])
        y = df_copy[target_col]

    # Gestion des valeurs manquantes pour les features numériques
    numerical_features, categorical_features, _ = get_feature_types(X)

    # Imputation pour les variables numériques
    if numerical_features:
        num_imputer = MissingValueHandler(strategy="median")
        X[numerical_features] = num_imputer.fit_transform(X[numerical_features])

    # Imputation pour les variables catégorielles
    if categorical_features:
        cat_imputer = MissingValueHandler(strategy="most_frequent", fill_value="None")
        X[categorical_features] = cat_imputer.fit_transform(X[categorical_features])

    logger.info(f"Données prétraitées: {X.shape}")

    return X, y


def handle_outliers(df: pd.DataFrame, target_col: str = "SalePrice") -> pd.DataFrame:
    """
    Gère les outliers dans le dataset.

    Args:
        df: DataFrame à traiter
        target_col: Nom de la colonne cible

    Returns:
        DataFrame avec outliers gérés
    """
    df_clean = df.copy()

    # Outliers sur la variable cible (méthode IQR)
    if target_col in df_clean.columns:
        Q1 = df_clean[target_col].quantile(0.25)
        Q3 = df_clean[target_col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        initial_shape = df_clean.shape
        df_clean = df_clean[(df_clean[target_col] >= lower_bound) & (df_clean[target_col] <= upper_bound)]
        logger.info(f"Outliers supprimés: {initial_shape[0] - df_clean.shape[0]} lignes")

    return df_clean


if __name__ == "__main__":
    # Test du module
    from .load_data import load_data

    train_df, _ = load_data("data/raw")
    if train_df is not None:
        X, y = preprocess_data(train_df)
        print(f"Features prétraitées: {X.shape}")
        print(f"Target: {y.shape if y is not None else 'None'}")
