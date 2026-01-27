"""
Module de chargement des données pour le projet House Prices.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import yaml
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_data(
    data_path: str, train_file: str = "train.csv", test_file: Optional[str] = None
) -> Tuple[pd.DataFrame, Optional[pd.DataFrame]]:
    """
    Charge les données d'entraînement et de test.

    Args:
        data_path: Chemin vers le dossier contenant les données
        train_file: Nom du fichier d'entraînement
        test_file: Nom du fichier de test (optionnel)

    Returns:
        Tuple contenant les DataFrames d'entraînement et de test
    """
    data_dir = Path(data_path)

    try:
        # Chargement des données d'entraînement
        train_path = data_dir / train_file
        train_df = pd.read_csv(train_path)
        logger.info(f"Données d'entraînement chargées: {train_df.shape}")

        # Chargement des données de test si disponible
        test_df = None
        if test_file:
            test_path = data_dir / test_file
            if test_path.exists():
                test_df = pd.read_csv(test_path)
                logger.info(f"Données de test chargées: {test_df.shape}")

        return train_df, test_df

    except FileNotFoundError as e:
        logger.error(f"Fichier non trouvé: {e}")
        raise
    except Exception as e:
        logger.error(f"Erreur lors du chargement des données: {e}")
        raise


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """
    Charge le fichier de configuration.

    Args:
        config_path: Chemin vers le fichier de configuration

    Returns:
        Dictionnaire contenant la configuration
    """
    try:
        with open(config_path, "r", encoding="utf-8") as file:
            config = yaml.safe_load(file)
        logger.info(f"Configuration chargée depuis {config_path}")
        return config
    except FileNotFoundError:
        logger.warning(f"Fichier de configuration non trouvé: {config_path}")
        return {}
    except Exception as e:
        logger.error(f"Erreur lors du chargement de la configuration: {e}")
        return {}


def display_data_info(df: pd.DataFrame, name: str = "Dataset") -> None:
    """
    Affiche des informations de base sur le dataset.

    Args:
        df: DataFrame à analyser
        name: Nom du dataset pour l'affichage
    """
    print(f"\n=== {name} ===")
    print(f"Dimensions: {df.shape}")
    print(f"Colonnes: {df.columns.tolist()}")
    print(f"\nTypes de données:")
    print(df.dtypes.value_counts())
    print(f"\nValeurs manquantes:")
    missing_values = df.isnull().sum()
    missing_pct = (missing_values / len(df)) * 100
    missing_df = pd.DataFrame({"Missing Count": missing_values, "Missing Percentage": missing_pct}).sort_values(
        "Missing Percentage", ascending=False
    )
    print(missing_df[missing_df["Missing Count"] > 0])


def get_target_distribution(df: pd.DataFrame, target_col: str = "SalePrice") -> Dict[str, Any]:
    """
    Calcule les statistiques de distribution de la variable cible.

    Args:
        df: DataFrame contenant les données
        target_col: Nom de la colonne cible

    Returns:
        Dictionnaire avec les statistiques de distribution
    """
    if target_col not in df.columns:
        raise ValueError(f"Colonne cible '{target_col}' non trouvée dans le dataset")

    target = df[target_col]

    stats = {
        "mean": target.mean(),
        "median": target.median(),
        "std": target.std(),
        "min": target.min(),
        "max": target.max(),
        "q25": target.quantile(0.25),
        "q75": target.quantile(0.75),
        "skewness": target.skew(),
        "kurtosis": target.kurtosis(),
    }

    return stats


def save_data(df: pd.DataFrame, output_path: str, filename: str) -> None:
    """
    Sauvegarde un DataFrame au format CSV.

    Args:
        df: DataFrame à sauvegarder
        output_path: Chemin de sortie
        filename: Nom du fichier
    """
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    full_path = output_dir / filename
    df.to_csv(full_path, index=False)
    logger.info(f"Données sauvegardées: {full_path}")


if __name__ == "__main__":
    # Test du module
    train_data, test_data = load_data("data/raw")
    display_data_info(train_data, "Train Dataset")

    if "SalePrice" in train_data.columns:
        target_stats = get_target_distribution(train_data)
        print(f"\nDistribution de SalePrice:")
        for key, value in target_stats.items():
            print(f"{key}: {value:.2f}")
