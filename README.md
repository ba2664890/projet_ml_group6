# Laplace Immo - Prédiction des Prix des Maisons

## Contexte du Projet

Ce projet est réalisé pour **Laplace Immo**, un réseau national d'agences immobilières. L'objectif est de développer un algorithme de prédiction des prix des maisons résidentielles à Ames (Iowa, US) en utilisant 79 variables explicatives.

## 🎯 Objectifs

- **Analyser** les données immobilières avec 79 variables explicatives
- **Développer** un modèle de prédiction performant du prix des maisons
- **Implémenter** un système de tracking des expériences avec MLflow
- **Déployer** une API pour des prédictions en temps réel
- **Automatiser** les tests et le déploiement avec GitHub Actions

## 📁 Structure du Projet

```
house_prices_project/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD avec GitHub Actions
├── api/
│   ├── main.py                 # Application FastAPI
│   └── models/                 # Modèles sauvegardés
├── data/
│   ├── raw/                    # Données brutes
│   ├── processed/              # Données prétraitées
│   └── external/               # Données externes
├── docs/                       # Documentation
├── models/                     # Modèles entraînés
├── notebooks/
│   ├── house_price_01_analyse.ipynb      # Analyse exploratoire
│   └── house_price_02_essais.ipynb       # Tests de modèles
├── reports/                    # Rapports et visualisations
├── scripts/                    # Scripts utilitaires
├── src/
│   └── house_prices/
│       ├── __init__.py
│       ├── data/               # Chargement et prétraitement
│       ├── features/           # Ingénierie des features
│       ├── models/             # Modèles ML
│       └── visualization/      # Outils de visualisation
├── tests/                      # Tests unitaires
├── requirements.txt            # Dépendances Python
├── setup.py                    # Configuration du package
└── README.md                   # Ce fichier
```

## 🚀 Installation

### Prérequis

- Python 3.8+
- pip
- Git

### Installation locale

1. Clonez le repository :
```bash
git clone https://github.com/votre-username/house-prices-prediction.git
cd house-prices-prediction
```

2. Créez un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate
```

3. Installez les dépendances :
```bash
pip install -r requirements.txt
```

4. Installez le package en mode développement :
```bash
pip install -e .
```

## 📊 Utilisation

### 1. Analyse Exploratoire

Ouvrez le notebook `notebooks/house_price_01_analyse.ipynb` pour l'analyse exploratoire des données.

### 2. Tests de Modèles

Ouvrez le notebook `notebooks/house_price_02_essais.ipynb` pour les tests comparatifs des modèles.

### 3. Tracking avec MLflow

Lancez l'interface MLflow :
```bash
mlflow ui --host 0.0.0.0 --port 5000
```

### 4. API FastAPI

Lancez l'API de prédiction :
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible à l'adresse : http://localhost:8000/docs

### 5. Tests

Exécutez les tests unitaires :
```bash
pytest tests/
```

## 🔧 Configuration GitHub Actions

Le workflow CI/CD est configuré dans `.github/workflows/ci.yml`. Il exécute automatiquement :
- Les tests unitaires
- La vérification du style de code (flake8)
- La construction de l'application
- Le déploiement (si configuré)

## 📈 Modèles Implémentés

Les modèles suivants ont été testés :
- **Régression Linéaire**
- **Ridge Regression**
- **Lasso Regression**
- **Random Forest**
- **Gradient Boosting**
- **XGBoost**

**Modèle final choisi** : [À déterminer après analyse]

## 🎯 Métriques de Performance

Les métriques utilisées pour l'évaluation :
- **RMSE** (Root Mean Square Error)
- **MAE** (Mean Absolute Error)
- **R² Score**

## 📋 Structure des Données

- **Nombre de variables** : 79
- **Variable cible** : `SalePrice` (prix de vente)
- **Nombre d'observations** : 1460 (jeu d'entraînement)

Les variables incluent :
- Caractéristiques de la maison (surface, nombre de pièces, qualité...)
- Informations de localisation
- Caractéristiques du terrain
- Date de construction et de rénovation
- Équipements (garage, piscine, cheminée...)

## 🧪 Tests

Les tests unitaires sont implémentés avec pytest et couvrent :
- Le chargement des données
- Le prétraitement
- Les transformations
- Les prédictions du modèle

Pour exécuter les tests :
```bash
pytest tests/ -v --cov=src
```

## 📝 Convention de Code

Le projet respecte les conventions PEP 8. Utilisez flake8 pour vérifier le style :
```bash
flake8 src/ tests/
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteur

[Votre nom] - Data Scientist chez Laplace Immo

## 🙏 Remerciements

- Laplace Immo pour ce projet
- La communauté Kaggle pour les données
- Les contributeurs open source des bibliothèques utilisées

---

**Note** : Ce projet est en cours de développement. Des améliorations continues sont apportées.# projet_ml_group6
