# Résumé du Projet - House Prices Prediction
## Laplace Immo - Data Science Project

---

## 📋 Vue d'ensemble

Ce projet a pour objectif de développer un algorithme de prédiction des prix des maisons résidentielles à Ames (Iowa, US) pour le réseau national d'agences immobilières **Laplace Immo**.

### Objectifs atteints

✅ Analyse exploratoire des données complète  
✅ Tests de multiples modèles de prédiction  
✅ Ingénierie de features avancée  
✅ API FastAPI pour les prédictions en production  
✅ Tests unitaires avec pytest  
✅ CI/CD avec GitHub Actions  
✅ Containerisation Docker  
✅ Tracking des expériences avec MLflow

---

## 📊 Données

### Caractéristiques
- **Nombre d'observations**: 1,460 maisons
- **Variables explicatives**: 79
- **Variable cible**: SalePrice (prix de vente)
- **Source**: Kaggle House Prices Dataset (Ames, Iowa)

### Statistiques clés
| Métrique | Valeur |
|----------|--------|
| Prix moyen | $180,921 |
| Prix médian | $163,000 |
| Prix minimum | $34,900 |
| Prix maximum | $755,000 |
| Asymétrie | 1.88 (asymétrie positive) |

---

## 🔍 Analyse Exploratoire (Notebook 01)

### Insights principaux

1. **Features les plus corrélées avec le prix**:
   - OverallQual (Qualité globale): r = 0.791
   - GrLivArea (Surface habitable): r = 0.709
   - TotalSF (Surface totale créée): r = 0.779
   - GarageCars (Capacité garage): r = 0.640
   - TotalBsmtSF (Surface sous-sol): r = 0.614

2. **Valeurs manquantes**:
   - 19 variables avec valeurs manquantes
   - PoolQC: 99.5% manquants (majorité sans piscine)
   - MiscFeature: 96.3% manquants
   - Alley: 93.8% manquants (majorité sans allée)

3. **Quartiers premium**:
   - NoRidge: $335,295 (moyenne)
   - NridgHt: $316,271 (moyenne)
   - StoneBr: $310,499 (moyenne)

---

## 🤖 Modélisation (Notebook 02)

### Modèles testés

| Modèle | RMSE Test | R² Test | CV RMSE |
|--------|-----------|---------|---------|
| Linear Regression | $65,003 | 0.449 | $46,237 |
| Ridge Regression | $29,473 | 0.887 | $34,556 |
| Lasso Regression | $29,398 | 0.887 | $34,016 |
| Random Forest | $29,995 | 0.883 | $30,105 |
| **Gradient Boosting** | **$27,254** | **0.903** | **$28,193** |

### 🏆 Modèle final choisi: **Gradient Boosting**

**Performance**:
- R² Score: 0.903 (90.3% de variance expliquée)
- RMSE: $27,254
- MAE: $16,518

**Hyperparamètres optimaux**:
```python
{
    'n_estimators': 200,
    'max_depth': 4,
    'learning_rate': 0.05,
    'subsample': 0.9
}
```

---

## 🏗️ Architecture du Projet

```
house_prices_project/
├── .github/workflows/ci.yml    # CI/CD avec GitHub Actions
├── api/main.py                 # API FastAPI
├── notebooks/
│   ├── house_price_01_analyse.ipynb      # Analyse exploratoire
│   └── house_price_02_essais.ipynb       # Tests de modèles
├── src/house_prices/
│   ├── data/                   # Chargement et prétraitement
│   ├── features/               # Ingénierie des features
│   ├── models/                 # Modèles ML
│   └── visualization/          # Visualisations
├── tests/                      # Tests unitaires
├── Dockerfile                  # Containerisation
├── docker-compose.yml          # Orchestration Docker
├── config.yaml                 # Configuration
└── requirements.txt            # Dépendances
```

---

## 🔧 API FastAPI

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Page d'accueil |
| `/health` | GET | Health check |
| `/predict` | POST | Prédiction pour une maison |
| `/predict/batch` | POST | Prédictions batch |
| `/model/info` | GET | Informations du modèle |

### Exemple de requête

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "MSSubClass": 60,
    "MSZoning": "RL",
    "LotFrontage": 65.0,
    "LotArea": 8450,
    "Street": "Pave",
    "Alley": null,
    "LotShape": "Reg",
    "LandContour": "Lvl",
    "Utilities": "AllPub",
    "LotConfig": "Inside",
    "LandSlope": "Gtl",
    "Neighborhood": "CollgCr",
    "Condition1": "Norm",
    "Condition2": "Norm",
    "BldgType": "1Fam",
    "HouseStyle": "2Story",
    "OverallQual": 7,
    "OverallCond": 5,
    "YearBuilt": 2003,
    "YearRemodAdd": 2003,
    "RoofStyle": "Gable",
    "RoofMatl": "CompShg",
    "Exterior1st": "VinylSd",
    "Exterior2nd": "VinylSd",
    "MasVnrType": "BrkFace",
    "MasVnrArea": 196.0,
    "ExterQual": "Gd",
    "ExterCond": "TA",
    "Foundation": "PConc",
    "BsmtQual": "Gd",
    "BsmtCond": "TA",
    "BsmtExposure": "No",
    "BsmtFinType1": "GLQ",
    "BsmtFinSF1": 706.0,
    "BsmtFinType2": "Unf",
    "BsmtFinSF2": 0.0,
    "BsmtUnfSF": 150.0,
    "TotalBsmtSF": 856.0,
    "Heating": "GasA",
    "HeatingQC": "Ex",
    "CentralAir": "Y",
    "Electrical": "SBrkr",
    "1stFlrSF": 856,
    "2ndFlrSF": 854,
    "LowQualFinSF": 0,
    "GrLivArea": 1710,
    "BsmtFullBath": 1.0,
    "BsmtHalfBath": 0.0,
    "FullBath": 2,
    "HalfBath": 1,
    "BedroomAbvGr": 3,
    "KitchenAbvGr": 1,
    "KitchenQual": "Gd",
    "TotRmsAbvGrd": 8,
    "Functional": "Typ",
    "Fireplaces": 0,
    "FireplaceQu": null,
    "GarageType": "Attchd",
    "GarageYrBlt": 2003.0,
    "GarageFinish": "RFn",
    "GarageCars": 2.0,
    "GarageArea": 548.0,
    "GarageQual": "TA",
    "GarageCond": "TA",
    "PavedDrive": "Y",
    "WoodDeckSF": 0,
    "OpenPorchSF": 61,
    "EnclosedPorch": 0,
    "3SsnPorch": 0,
    "ScreenPorch": 0,
    "PoolArea": 0,
    "PoolQC": null,
    "Fence": null,
    "MiscFeature": null,
    "MiscVal": 0,
    "MoSold": 2,
    "YrSold": 2008,
    "SaleType": "WD",
    "SaleCondition": "Normal"
  }'
```

---

## 🧪 Tests Unitaires

### Couverture

- **test_data_loading.py**: Tests de chargement et validation des données
- **test_models.py**: Tests des modèles ML et métriques

### Exécution

```bash
# Exécuter tous les tests
pytest tests/ -v

# Avec couverture
pytest tests/ -v --cov=src --cov-report=html

# Tests spécifiques
pytest tests/test_models.py -v
```

---

## 🚀 CI/CD avec GitHub Actions

### Workflows

1. **test**: Exécute les tests sur Python 3.8, 3.9, 3.10
2. **build**: Construit le package Python
3. **docker-build**: Crée et pousse l'image Docker
4. **mlflow-tracking**: Log les expériences MLflow

### Déclencheurs

- Push sur `main` et `develop`
- Pull requests sur `main`

---

## 📦 Docker

### Build

```bash
docker build -t house-prices-prediction .
```

### Run

```bash
docker run -p 8000:8000 house-prices-prediction
```

### Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter
docker-compose down
```

---

## 📈 Résultats et Performance

### Métriques finales

| Métrique | Valeur | Interprétation |
|----------|--------|----------------|
| R² | 0.903 | 90.3% de variance expliquée |
| RMSE | $27,254 | Erreur quadratique moyenne |
| MAE | $16,518 | Erreur absolue moyenne |
| CV RMSE | $28,193 | RMSE en validation croisée |

### Interprétation métier

- Le modèle peut prédire le prix d'une maison avec une erreur moyenne d'environ **$27,254**
- Cela représente environ **15%** du prix médian ($163,000)
- Le modèle est **robuste** et généralise bien (CV RMSE proche du RMSE test)

---

## 🔮 Améliorations futures

1. **Hyperparameter tuning avancé**: Utiliser Optuna ou Hyperopt
2. **Feature selection automatique**: RFE, SelectKBest
3. **Ensemble methods**: Stacking de plusieurs modèles
4. **Deep learning**: Réseaux de neurones pour la prédiction
5. **Interprétabilité**: SHAP values pour expliquer les prédictions
6. **Monitoring**: Mise en place de monitoring en production
7. **A/B testing**: Tests de nouveaux modèles en production

---

## 📝 Conventions de code

- **PEP 8** respecté
- **Type hints** utilisés
- **Docstrings** pour toutes les fonctions
- **Tests unitaires** pour les fonctions critiques
- **Logging** approprié

---

## 👥 Équipe

**Projet réalisé pour**: Laplace Immo  
**Rôle**: Data Scientist  
**Date**: Janvier 2026

---

## 📚 Références

- [Kaggle House Prices Dataset](https://www.kaggle.com/c/house-prices-advanced-regression-techniques)
- [Scikit-learn Documentation](https://scikit-learn.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MLflow Documentation](https://mlflow.org/)

---

**Projet prêt pour le déploiement en production ! 🚀**