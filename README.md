# Laplace Immo - Prédiction des Prix des Maisons

![CI/CD Pipeline](https://github.com/votre-username/projet_ml_group6/workflows/CI/CD%20Pipeline/badge.svg)

## 📌 Contexte du Projet

Ce projet est réalisé pour **Laplace Immo**, un réseau national d'agences immobilières. L'objectif est de développer un algorithme de prédiction des prix des maisons résidentielles à Ames (Iowa, US) en utilisant une base de données de 79 variables descriptives.

L'algorithme permet aux agents immobiliers d'obtenir une estimation fiable du prix de vente basée sur les caractéristiques du bien.

## 🚀 Fonctionnalités Clés

- **Pipeline de Prédiction Unifié** : Intégration complète du prétraitement, du feature engineering et du modèle.
- **Correction d'Asymétrie (Skewness)** : Transformation automatique `log(1+x)` pour les variables asymétriques.
- **Feature Engineering Avancé** : Création de variables expertes (`HouseAge`, `TotalSF`, etc.).
- **Transformation Log de la Cible** : Entraînement sur `log(SalePrice)` pour une meilleure distribution, avec inversion automatique pour les prédictions.
- **Tracking MLflow** : Suivi des expériences, paramètres et métriques.
- **API FastAPI** : Interface REST performante pour les prédictions en temps réel.
- **CI/CD** : Tests automatisés et déploiement via GitHub Actions.

## 🛠️ Architecture Technique

### Structure du Projet
```
house_prices_project/
├── .github/                # Workflows Actions (CI/CD)
├── api/                    # Application FastAPI
│   └── main.py
├── data/                   # Données (raw, processed)
├── models/                 # Modèles sérialisés (.pkl)
├── notebooks/              # (Ignorés pour le déploiement)
├── src/
│   └── house_prices/
│       ├── data/           # Prétraitement & Feature Engineering
│       ├── models/         # Entraînement & Prédiction
├── tests/                  # Tests unitaires (pytest)
├── grp_06_ml.py            # Script d'analyse (Legacy/Reference)
├── requirements.txt        # Dépendances
└── README.md               # Documentation
```

### Le Modèle : BayesianRidge
Le modèle final retenu est un **Bayesian Ridge Regression**, choisi pour sa robustesse et sa capacité à gérer la régularisation automatiquement.
- **RMSE** : ~0.12 (sur log price)
- **Préprocesseurs** : 
  - `MissingValuesHandler` : Imputation intelligente
  - `AnomalyCorrector` : Correction des années aberrantes
  - `SkewnessCorrector` : Log-transformation des variables asymétriques (skew > 0.75)
  - `OrdinalEncoder` : Encodage des variables ordinales (Qualité, etc.)

## 📦 Installation & Démarrage Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/projet_ml_group6.git
cd projet_ml_group6
```

### 2. Environnement Virtuel
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -e .
```

### 3. Lancer l'API
```bash
uvicorn api.main:app --reload
```
L'API sera accessible sur [http://localhost:8000](http://localhost:8000).
Documentation interactive : [http://localhost:8000/docs](http://localhost:8000/docs)

## ☁️ Déploiement (Render)

Ce projet est configuré pour un déploiement facile sur **Render** (ou tout autre service PaaS compatible).

1. Connectez votre dépôt GitHub à Render.
2. Choisissez **Web Service**.
3. Configurez les paramètres :
   - **Runtime** : Python 3
   - **Build Command** : `pip install -r requirements.txt && pip install -e .`
   - **Start Command** : `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. Ajoutez la variable d'environnement (si nécessaire) :
   - `PYTHON_VERSION`: `3.10.12`

## 🧪 Tests et Qualité

Pour lancer la suite de tests unitaires (couvrant le chargement de données, le prétraitement, et le modèle) :

```bash
pytest tests/ -v
```

Les tests vérifient :
- L'intégrité des transformations de données.
- La gestion des valeurs manquantes et aberrantes.
- La cohérence des prédictions (valeurs positives, bornes réalistes).
- L'inversion correcte de la transformation Log sur les prédictions.

## 📊 MLflow

Pour visualiser les expériences d'entraînement :

```bash
mlflow ui
```
Accédez au dashboard sur [http://localhost:5000](http://localhost:5000).

## 📄 Licence

Projet réalisé par l'équipe Data Science - Groupe 6.
Sous licence MIT.
